import { serve } from "https://deno.land/std@0.138.0/http/mod.ts";
import { debugprint } from "./debug.js";
import * as state_machine from "./state_machine.js";

// For debugging
const staticFilesFlag = false;
const websocketFlag = false;
const socketstateFlag = false;


// ----------------------------------------------------------------------------
// State
// ----------------------------------------------------------------------------

export var sockets = new Map();    //contains objects with socket and state of socket
let games = new Map();      //contains game objects


// ----------------------------------------------------------------------------
// Server request handler, handles requests to the server
// ----------------------------------------------------------------------------

async function reqHandler(request) {
  if (request.headers.get("upgrade") != "websocket") {

    //Client is requesting static files

    let resourceFromPath = new Map([
        [ /^\/$/, "./public/index.html"],          //detects root, a single "/"
        [ /^\/favicon.ico$/, "./public/favicon.ico"], // Detects faviron.ico
        [ /^\/styles\/[\w\/-]+\.css$/, "PATH"], //matches css files in /styles/
        [ /^\/scripts\/[\w\/-]+\.js$/, "PATH"], //matches js files in /scripts/
        [ /^\/fonts\/[\w\/-]+\.woff2$/, "PATH"],//matches font files
        [ /^\/graphics\/[\w\/-]+\.svg$/, "PATH"], //matches svg files
    ]);
    let mimeTypeFromExtension = new Map([
        [".html", { "content-type": "text/html; charset=utf-8" }],
        [".css", { "content-type": "text/css" }],
        [".js", { "content-type": "application/javascript" }],
        [".woff2", { "content-type": "application/x-font-woff2" }],
        [".svg", { "content-type": "image/svg+xml" }],
        [".ico", { "content-type": "image/x-icon" }],
    ]);

    const { pathname: path } = new URL(request.url);
    debugprint("Path: "+path, staticFilesFlag);

    for (const key of resourceFromPath.keys()) {
      if (key.test(path)) {
        let resource = resourceFromPath.get(key);
        resource = resource === "PATH" ? "./public/"+path : resource;
        let fileExtension = resource.match(/\.\w+$/)[0];
        const body = await Deno.readFile(resource);
        return new Response(body, {
            status: 200,
            headers: mimeTypeFromExtension.get(fileExtension)
        });
        break;
      }
    }

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
      state_machine.exitGame(identifier, JSON.stringify({command: "EXIT"}), sockets, games);  // no zombies if disconnections
    sockets.delete(identifier);
    debugprint("Websocket " + identifier + " closed.", websocketFlag);
  }

  websocket.onmessage = (message) => {
    debugprint("Message received from socket " + identifier, websocketFlag);
    debugprint(message.data, websocketFlag);

    // Use state machine to evaluate message appropriately
    let socketState = state_machine.STATES.get(sockets.get(identifier).state);
    debugprint("Socket's current state", websocketFlag);
    debugprint(socketState, socketstateFlag);

    let noMethodCalled = true;
    socketState.methods.forEach((obj) => {
      if (obj.validator(message.data)) {
        debugprint("Validated message: " + message.data, socketstateFlag);
        debugprint("Calling method based on message...", socketstateFlag);
        obj.method(identifier, message.data, sockets, games);
        noMethodCalled = false;
        sockets.get(identifier).state = obj.nextState;
        debugprint("State changing to " + obj.nextState + "...", socketstateFlag);
        debugprint("State changed to " + sockets.get(identifier).state, socketstateFlag);
      }
    });
    if (socketState.methods.length === 0 || noMethodCalled)
      socketState.error();
  }

  websocket.onopen = () => {
    //send to socket initial info about what game exist
    state_machine.updateClientsGames(games, [identifier]);
  }


  return response;
}


// ----------------------------------------------------------------------------
//Sending messages to clients
// ----------------------------------------------------------------------------

export var sendToClients = (clientIDs, message) => {
  if (clientIDs === "everyone") {
    clientIDs = []
    sockets.forEach((socketobj, uid) => {clientIDs.push(uid);});
  }
  clientIDs.forEach((uid) => {
      try {sockets.get(uid).socket.send(message)}
      catch(e) {debugprint("Tried to send a message to closed socket.", websocketFlag);}}); //TODO fix this eventually I guess
}


// ----------------------------------------------------------------------------
//Start server
// ----------------------------------------------------------------------------

serve(reqHandler, { port: 8002 });
