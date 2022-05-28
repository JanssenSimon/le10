import { debugprint } from "./debug.js"
import { Game } from "./game.js";
import { sendToClients } from "./server.js";
import { sockets } from "./server.js";

const validationFlag = false;
const gameFlag = false;

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
  debugprint("Validating if message has bid", validationFlag);
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("bid") &&
           ((Number.isFinite(message.bid) &&
           message.bid >= 50 &&
           message.bid <= 100 &&
           (message.bid % 5 === 0)) || (
           message.bid === "fold"));
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
  } else {
    if (games.has(message.gamechoice)) {
      sockets.get(uid).game = message.gamechoice;
      debugprint("Socket " + uid + " joins game " + sockets.get(uid).game, gameFlag);
    } else {
      //TODO something when joining non existant game (create one?)
      debugprint("Game does not exist", gameFlag);
    }
  }
  games.get(sockets.get(uid).game).addPlayer(uid, sockets.get(uid).name);
  //Update all sockets about new games
  updateClientsGames(games);
};
export var bet = (uid, message, sockets, games) => {
  message = JSON.parse(message);
  games.get(sockets.get(uid).game).bet(uid, message.bid) //message contains amount
};
export var playCard = (uid, message, sockets, games) => {
  message = JSON.parse(message);
  games.get(sockets.get(uid).game).playCard(uid, message.cardchoice) //message contains chosen card index
};
export var exitGame = (uid, message, sockets, games) => {
  message = JSON.parse(message);
  let gameID = sockets.get(uid).game;
  debugprint("Socket " + uid + " exits from game " + gameID, gameFlag);
  games.get(gameID).exits(uid);
  //if nobody's left in the room, delete game
  if (games.get(gameID).players.size === 0)
    games.delete(gameID);
  //Update all sockets about new games
  updateClientsGames(games);
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
  console.log("ERROR : Expected a bid, a card choice, or an exit request, received something else;");
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

//Client feedback methods
export var updateClientsGames = (games, clients) => {       //TODO redo this whole function, maybe move it
  let gamesInfo = [];
  let currentGameInfo = null;
  if (!games) games = new Map();

  games.forEach((game, uid) => {gamesInfo.push({name: game.name, uuid: uid, seatedplayers: game.getSeatedPlayers()});});

  if (clients) {
    clients.forEach((pid) => {
      games.forEach((game, uid) => {
        if (game.isInGame(pid))
          currentGameInfo = {name: game.name, uuid: uid, seatedplayers: game.getSeatedPlayers()};
      });
      sendToClients([pid], JSON.stringify({games: gamesInfo,
                                           currentGame: currentGameInfo}));
    });
  } else {
    sockets.forEach((socket, pid) => {
      games.forEach((game, uid) => {
        if (game.isInGame(pid))
          currentGameInfo = {name: game.name, uuid: uid, seatedplayers: game.getSeatedPlayers()};
      });
      sendToClients([pid], JSON.stringify({games: gamesInfo,
                                           currentGame: currentGameInfo}));
    });
  }
}
