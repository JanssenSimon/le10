import { serve } from "https://deno.land/std/http/mod.ts";

async function reqHandler(request) {
  const { pathname: path } = new URL(request.url);
  //console.log(path);

  if (path === "/") {
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

serve(reqHandler, { port: 5000 });
