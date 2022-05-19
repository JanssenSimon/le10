// For debugging
var debugprint = (printable, flag) => {if (flag) console.log(printable);}
const websocketFlag = true;

function generateRandomName() {
  let firstnames = ["Marie", "Jean", "Jeanne", "Pierre", "Françoise", "Michel",
                    "Monique", "André", "Catherine", "Philippe", "Nat", "Louis"];
  let lastnames = ["Cool", "Bon", "Vière", "Bière", "Nice", "Bonne", "Arbre"];
  return firstnames[Math.floor(Math.random() * firstnames.length)] + " " +
         lastnames[Math.floor(Math.random() * lastnames.length)];
}
let suggestedName = generateRandomName()

// Websocket networking for playing game
let ws = new WebSocket("ws://" + location.host);

ws.onmessage = (message) => {
  debugprint(message.data, websocketFlag);
}

/*
 * STATE: awaitingName
 * valid messages: ws.send(JSON.stringify({name: "Benjamin"}))
 *
 * STATE: gameSelection
 * valid messages: ws.send(JSON.stringify({name: "Benjamin"}))
 * valid messages: ws.send(JSON.stringify({gamechoice: "newgame"}))
 * valid messages: ws.send(JSON.stringify({gamechoice: "<UUID>"}))
 *
 * STATE: inGame
 * valid messages: ws.send(JSON.stringify({command: "EXIT"}))
 * valid messages: ws.send(JSON.stringify({bet: <amount>}))
 * valid messages: ws.send(JSON.stringify({cardchoice: <card_index>}))
 *
 */
