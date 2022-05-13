// Websocket networking for playing game
let ws = new WebSocket("ws://" + location.host);

// For debugging
var debugprint = (printable, flag) => {if (flag) console.log(printable);}
const webSocketFlag = true;

ws.onmessage = (message) => {
  debugprint(message.data, webSocketFlag);
}

function generateRandomName() {
  let firstnames = ["Marie", "Jean", "Jeanne", "Pierre", "Françoise", "Michel",
                    "Monique", "André", "Catherine", "Philippe", "Nat", "Louis"];
  let lastnames = ["Cool", "Bon", "Vière", "Bière", "Nice", "Bonne", "Arbre"];
  return firstnames[Math.floor(Math.random() * firstnames.length)] + " " +
         lastnames[Math.floor(Math.random() * lastnames.length)];
}
let suggestedName = generateRandomName()
