import { debugprint } from "./debug.js";

// For debugging
const gameFlag = true;

// Validators
export var messageHasName = (message) => {
  console.log("Validating if message has name");
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("name") && (typeof message.name === 'string' || message.name instanceof String);
  } catch (e) {
    return false;
  }
}
export var messageHasGameChoice = (message) => {
  console.log("Validating if message has game choice");
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
  console.log("Validating if message has bet");
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("bet") &&
           Number.isFinite(message.bet) &&
           message.bet >= 50 &&
           message.bet <= 100 &&
           (message.bet % 5 === 0);
  } catch (e) {
    return false;
  }
}
export var messageHasCardChoice = (message) => {
  console.log("Validating if message has card choice");
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
  console.log("Validating if message has exit game");
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("command") && message.command === "EXIT";
  } catch (e) {
    return false;
  }
}

// State changing methods
export var recordName = (uid, message, sockets, games) => {
  sockets.get(uid).name = message.name; //message contains name
  //debugprint("Socket " + uid + " changed associated name to " + sockets.get(uid).name, gameFlag);
};
export var joinGame = (uid, message, sockets, games) => {
  if (message.game === "newgame") { //message contains game uid or newgame
    //TODO create a new game
    //debugprint("Socket " + uid + " requested creation of new game", gameFlag);
  }
  sockets.get(uid).game = message.game;
  //debugprint("Socket " + uid + " joins game " + sockets.get(uid).game, gameFlag);
  games.get(sockets.get(uid).game).addPlayer(uid);
};
export var bet = (uid, message, sockets, games) => {
  games.get(sockets.get(uid).game).bet(uid, message.bet) //message contains amount
};
export var playCard = (uid, message, sockets, games) => {
  games.get(sockets.get(uid).game).playCard(uid, message.cardchoice) //message contains chosen card index
};
export var exitGame = (uid, message, sockets, games) => {
  //debugprint("Socket " + uid + " exits from game " + sockets.get(uid).game, gameFlag);
  games.get(sockets.get(uid).game).exits(uid);
};

// Error functions
export var nameSelectionErrorFunction = () => {
  console.log("ERROR : Expected a name, received something else;");
}
export var gameSelectionErrorFunction = () => {
  console.log("ERROR : Expected a name or game choice, received something else;");
}
export var inGameErrorFunction = () => {
  console.log("ERROR : Expected a bet, a card choice, or an exit request, received something else;");
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
