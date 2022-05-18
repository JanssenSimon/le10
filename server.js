import { serve } from "https://deno.land/std@0.138.0/http/mod.ts";
import * as state_machine from "./state_machine.js";

// For debugging
var debugprint = (printable, flag) => {if (flag) console.log(printable);}
const staticFilesFlag = false;
const websocketFlag = true;
const socketstateFlag = true;

let sockets = new Map(); //contains objects with socket and state of socket

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
    exitGame();     // Call exitGame so there are no zombies if disconnections
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
        obj.method();
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

//Start server
serve(reqHandler, { port: 5000 });
