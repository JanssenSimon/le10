let isButton = x => x.target.nodeName === "BUTTON";

// Makes clicks visible
const gamesection = document.getElementById("gamesection");
gamesection.addEventListener("click", (event) => {
  if (!isButton(event)) return;
  event.target.blur();
});

// Toggles the last round
const lastroundrevealer = document.getElementById("lastroundrevealer");
var lastroundcards = Array.from(document.getElementsByClassName("hidelastround"));
lastroundrevealer.addEventListener("click", () => {
  for (c of lastroundcards) {
    c.classList.toggle("hidelastround");
  }
});


// Websocket networking for playing game
let ws = new WebSocket("ws://localhost:5000");

ws.onmessage = (message) => {
  console.log(message.data);
}

const playersCards = Array.from(document.getElementsByClassName("playerhand"));
playersCards.forEach((c, index) => {
  c.addEventListener("click", (event) => {
    ws.send(JSON.stringify({ index }));
    console.log(index);
  });
});
