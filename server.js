import { serve } from "https://deno.land/std@0.138.0/http/mod.ts";

// For debugging
let debugprint = (string, flag) => {if (flag) console.log(string);}
const staticFilesFlag = false;
const websocketFlag = true;
const socketstateFlag = true;
const gameFlag = true;


// ----------------------------------------------------------------------------
// State
// ----------------------------------------------------------------------------

let sockets = new Map();    //contains objects with socket and state of socket
let games = new Map();      //contains game objects


// Validators
var messageHasName = (message) => {
  console.log("Validating if message has name");
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("name") && (typeof message.name === 'string' || message.name instanceof String);
  } catch (e) {
    return false;
  }
}
var messageHasGameChoice = (message) => {
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
var messageHasBet = (message) => {
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
var messageHasCardChoice = (message) => {
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
var messageHasExitGame = (message) => {
  console.log("Validating if message has exit game");
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("command") && message.command === "EXIT";
  } catch (e) {
    return false;
  }
}

// State changing methods
var recordName = (uid, message) => {
  sockets.get(uid).name = message.name; //message contains name
  debugprint("Socket " + uid + " changed associated name to " + sockets.get(uid).name, gameFlag);
};
var joinGame = (uid, message) => {
  if (message.game === "newgame") { //message contains game uid or newgame
    //TODO create a new game
    debugprint("Socket " + uid + " requested creation of new game", gameFlag);
  }
  sockets.get(uid).game = message.game;
  debugprint("Socket " + uid + " joins game " + sockets.get(uid).game, gameFlag);
  games.get(sockets.get(uid).game).addPlayer(uid);
};
var bet = (uid, message) => {
  games.get(sockets.get(uid).game).bet(uid, message.bet) //message contains amount
};
var playCard = (uid, message) => {
  games.get(sockets.get(uid).game).playCard(uid, message.cardchoice) //message contains chosen card index
};
var exitGame = (uid, message) => {
  debugprint("Socket " + uid + " exits from game " + sockets.get(uid).game, gameFlag);
  games.get(sockets.get(uid).game).exits(uid);
};

// Error functions
var nameSelectionErrorFunction = () => {
  console.log("ERROR : Expected a name, received something else;");
}
var gameSelectionErrorFunction = () => {
  console.log("ERROR : Expected a name or game choice, received something else;");
}
var inGameErrorFunction = () => {
  console.log("ERROR : Expected a bet, a card choice, or an exit request, received something else;");
}

var STATES = new Map([
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


// ----------------------------------------------------------------------------
// Server request handler, handles requests to the server
// ----------------------------------------------------------------------------

async function reqHandler(request) {
  if (request.headers.get("upgrade") != "websocket") {

    //Client is requesting static files

    let resourceFromPath = new Map([
        [ /^\/$/, "./index.html"],              //detects root, a single "/"
        [ /^\/styles\/[\w\/-]+\.css$/, "PATH"], //matches css files in /styles/
        [ /^\/scripts\/[\w\/-]+\.js$/, "PATH"], //matches js files in /scripts/
        [ /^\/fonts\/[\w\/-]+\.woff2$/, "PATH"],//matches font files
    ]);
    let mimeTypeFromExtension = new Map([
        [".html", { "content-type": "text/html; charset=utf-8" }],
        [".css", { "content-type": "text/css" }],
        [".js", { "content-type": "application/javascript" }],
        [".woff2", { "content-type": "application/x-font-woff2" }],
    ]);

    const { pathname: path } = new URL(request.url);
    debugprint("Path: "+path, staticFilesFlag);

    for (const key of resourceFromPath.keys()) {
      if (key.test(path)) {
        let resource = resourceFromPath.get(key);
        resource = resource === "PATH" ? "."+path : resource;
        let fileExtension = resource.match(/\.\w+$/)[0];
        const body = await Deno.readFile(resource);
        return new Response(body, {
            status: 200,
            headers: mimeTypeFromExtension.get(fileExtension)
        });
        break;
      }
    } //TODO what about the favicon?

    return new Response(null, { status: 404 }); //invalid path
  }

  //upgrade websocket requested
  var websocketDetails = Deno.upgradeWebSocket(request);
  var response = websocketDetails.response;
  var websocket = websocketDetails.socket;

  //add websocket to list of websockets
  const identifier = crypto.randomUUID()
  sockets.set(identifier, {socket: websocket, state: "NameSelection"});
  debugprint("New websocket connection", websocketFlag);
  debugprint("Websocket given identifier " + identifier, websocketFlag);
  debugprint(sockets, websocketFlag);

  //dealing with messages from websocket
  websocket.onclose = () => {
    if (sockets.get(identifier).state === "InGame")
      exitGame(identifier, {command: "EXIT"});  // no zombies if disconnections
    sockets.delete(identifier);
    debugprint("Websocket " + identifier + " closed.", websocketFlag);
  }

  websocket.onmessage = (message) => {
    debugprint("Message received from socket " + identifier, websocketFlag);
    debugprint(message.data, websocketFlag);

    // Use state machine to evaluate message appropriately
    let socketState = STATES.get(sockets.get(identifier).state);
    debugprint("Socket's current state", websocketFlag);
    debugprint(socketState, socketstateFlag);

    let noMethodCalled = true;
    socketState.methods.forEach((obj) => {
      if (obj.validator(message.data)) {
        debugprint("Validated message: " + message.data, socketstateFlag);
        debugprint("Calling method based on message...", socketstateFlag);
        obj.method(identifier, message.data);
        noMethodCalled = false;
        sockets.get(identifier).state = obj.nextState;
        debugprint("State changing to " + obj.nextState + "...", socketstateFlag);
        debugprint("State changed to " + sockets.get(identifier).state, socketstateFlag);
      }
    });
    if (socketState.methods.length === 0 || noMethodCalled)
      socketState.error();
  }

  return response;
}


// ----------------------------------------------------------------------------
//Start server
// ----------------------------------------------------------------------------

serve(reqHandler, { port: 5000 });
