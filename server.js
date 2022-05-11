import { serve } from "https://deno.land/std@0.138.0/http/mod.ts";

var debugprint = (printable, flag) => {if (flag) console.log(printable);}

async function reqHandler(request) {
  if (request.headers.get("upgrade") != "websocket") {

    //Client is requesting static files

    const { pathname: path } = new URL(request.url);
    debugprint(path, staticFilesFlag);

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
  debugprint(sockets, websocketFlag);
  playerStates.set(identifier, "inqueuewoname");

  //dealing with messages from websocket
  websocket.onclose = () => {}

  websocket.onmessage = (message) => {}

  return response;
}

//Start server
serve(reqHandler, { port: 5000 });
