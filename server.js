import { serve } from "https://deno.land/std@0.138.0/http/mod.ts";

// For debugging
var debugprint = (printable, flag) => {if (flag) console.log(printable);}
const staticFilesFlag = false;

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
