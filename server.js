import { serve } from "https://deno.land/std/http/mod.ts";

let sockets = new Map();
let playerStates = new Map();   //should maybe make a single map with all data

async function reqHandler(request) {
  if (request.headers.get("upgrade") != "websocket") {
    const { pathname: path } = new URL(request.url);
    //console.log(path);

    if (path === "/") {
      //serve index page
      const index = await Deno.readFile("./index.html");
      return new Response(index, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8"
        }
      });
    } else if (path === "/styles/style.css") {
      const index = await Deno.readFile("./styles/style.css");
      return new Response(index, {
        status: 200,
        headers: {
          "content-type": "text/css"          //TODO make this prettier with macros or smtg
        }
      });
    } else if (path === "/scripts/main.js") {
      const index = await Deno.readFile("./scripts/main.js");
      return new Response(index, {
        status: 200,
        headers: {
          "content-type": "application/javascript"
        }
      });
    } else if (path === "/fonts/JuliaMonoCardSet-Regular.woff2") {
      const index = await Deno.readFile("./fonts/JuliaMonoCardSet-Regular.woff2");
      return new Response(index, {
        status: 200,
        headers: {
          "content-type": "application/x-font-woff2"
        }
      });
    } //TODO what about the favicon?

    //invalid path
    return new Response(null, { status: 404 });
  }

  //upgrade websocket requested
  var websocketDetails = Deno.upgradeWebSocket(request);
  var response = websocketDetails.response;
  var websocket = websocketDetails.socket;

  //add websocket to list of websockets
  const identifier = crypto.randomUUID()
  sockets.set(identifier, websocket);
  //console.log(sockets);
  playerStates.set(identifier, "inqueuewoname");

  //dealing with messages from websocket
  websocket.onclose = () => {
    sockets.delete(identifier);
    playerStates.delete(identifier);
  }

  websocket.onmessage = (message) => {
      //parse message (what state is the uid in? q without name, q with name, in game)
      //if in game, validate message
      //if valid message, update game state according to message
      console.log(message);

      //if in game, send updated game state to all players
      sockets.forEach((ws, uid) => {
        console.log("Sending to ");
        console.log(ws);
        ws.send("YEEHAW");
      });
  }

  return response;
}

serve(reqHandler, { port: 5000 });
