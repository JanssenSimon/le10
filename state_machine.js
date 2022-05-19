import { debugprint } from "./debug.js"
import { Game } from "./game.js";

const validationFlag = false;
const gameFlag = true;

// ----------------------------------------------------------------------------
// State machine
// ----------------------------------------------------------------------------

// Validators
export var messageHasName = (message) => {
  debugprint("Validating if message has name", validationFlag);
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("name") && (typeof message.name === 'string' || message.name instanceof String);
  } catch (e) {
    return false;
  }
}
export var messageHasGameChoice = (message) => {
  debugprint("Validating if message has game choice", validationFlag);
  try {
    message = JSON.parse(message);
    if (message.hasOwnProperty("gamechoice"))
      return message.gamechoice === "newgame" ||
             /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(message.gamechoice); // thanks, Ωmega from SO
    return false;
  } catch (e) {
    return false;
  }
}
export var messageHasBet = (message) => {
  debugprint("Validating if message has bet", validationFlag);
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("bet") &&
           ((Number.isFinite(message.bet) &&
           message.bet >= 50 &&
           message.bet <= 100 &&
           (message.bet % 5 === 0)) || (
           message.bet === "fold"));
  } catch (e) {
    return false;
  }
}
export var messageHasCardChoice = (message) => {
  debugprint("Validating if message has card choice", validationFlag);
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("cardchoice") &&
           Number.isFinite(message.cardchoice) &&
           message.cardchoice >= 0 &&
           message.cardchoice < 10;
  } catch (e) {
    return false;
  }
}
export var messageHasExitGame = (message) => {
  debugprint("Validating if message has exit game", validationFlag);
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("command") && message.command === "EXIT";
  } catch (e) {
    return false;
  }
}

// State changing methods
export var recordName = (uid, message, sockets, games) => {
  message = JSON.parse(message);
  sockets.get(uid).name = message.name; //message contains name
  debugprint("Socket " + uid + " changed associated name to " + sockets.get(uid).name, gameFlag);
};
export var joinGame = (uid, message, sockets, games) => {
  message = JSON.parse(message);
  if (message.gamechoice === "newgame") { //message contains game uid or newgame
    // Create a new game
    const gameid = crypto.randomUUID()
    games.set(gameid, new Game());
    sockets.get(uid).game = gameid;
    debugprint("Socket " + uid + " requested creation of new game", gameFlag);
    debugprint("New game given uid: " + gameid, gameFlag);
    //TODO send updated game list to all players
  } else {
    sockets.get(uid).game = message.gamechoice;
    debugprint("Socket " + uid + " joins game " + sockets.get(uid).game, gameFlag);
  }
  games.get(sockets.get(uid).game).addPlayer(uid, sockets.get(uid).name);
};
export var bet = (uid, message, sockets, games) => {
  message = JSON.parse(message);
  games.get(sockets.get(uid).game).bet(uid, message.bet) //message contains amount
};
export var playCard = (uid, message, sockets, games) => {
  message = JSON.parse(message);
  games.get(sockets.get(uid).game).playCard(uid, message.cardchoice) //message contains chosen card index
};
export var exitGame = (uid, message, sockets, games) => {
  message = JSON.parse(message);
  debugprint("Socket " + uid + " exits from game " + sockets.get(uid).game, gameFlag);
  games.get(sockets.get(uid).game).exits(uid);
};

// Error functions
export var nameSelectionErrorFunction = () => {
  console.log("ERROR : Expected a name, received something else;");
  //TODO send error to player, let them know they need to be named
}
export var gameSelectionErrorFunction = () => {
  console.log("ERROR : Expected a name or game choice, received something else;");
  //TODO send error to player
}
export var inGameErrorFunction = () => {
  console.log("ERROR : Expected a bet, a card choice, or an exit request, received something else;");
  //TODO send error to player
}

export var STATES = new Map([
  ["NameSelection", {
    name: "NameSelection",
    methods: [
      {
        validator: messageHasName,
        method: recordName,
        nextState: "GameSelection"
      }
    ],
    error: nameSelectionErrorFunction
  }],
  ["GameSelection", {
    name: "GameSelection",
    methods: [
      {
        validator: messageHasName,
        method: recordName,
        nextState: "GameSelection"    // No change in state
      },
      {
        validator: messageHasGameChoice,
        method: joinGame,
        nextState: "InGame"
      }
    ],
    error: gameSelectionErrorFunction
  }],
  ["InGame", {
    name: "InGame",
    methods: [
      {
        validator: messageHasBet,
        method: bet,
        nextState: "InGame"
      },
      {
        validator: messageHasCardChoice,
        method: playCard,
        nextState: "InGame"
      },
      {
        validator: messageHasExitGame,
        method: exitGame,
        nextState: "GameSelection"
      }
    ],
    error: inGameErrorFunction
  }]
]);
