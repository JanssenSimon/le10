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

function update(message) {
  message = JSON.parse(message);
  currentPlayer = message.currentplayer;
  switch(currentPlayer) {
    case "Player1":
      joueurhautnbcartes = message.player3cards;
      joueurdroitenbcartes = message.player4cards;
      joueurgauchenbcartes = message.player2cards;
      break;
    case "Player2":
      joueurhautnbcartes = message.player4cards;
      joueurdroitenbcartes = message.player1cards;
      joueurgauchenbcartes = message.player3cards;
      break;
    case "Player3":
      joueurhautnbcartes = message.player1cards;
      joueurdroitenbcartes = message.player2cards;
      joueurgauchenbcartes = message.player4cards;
      break;
    case "Player4":
      joueurhautnbcartes = message.player2cards;
      joueurdroitenbcartes = message.player3cards;
      joueurgauchenbcartes = message.player1cards;
      break;
    default:
      console.log("ERROR : insufficient information received");
  }
  document.getElementById("mainjoueurhaut").innerHTML='<button class="card inhand" aria-label="Carte détenu par le joueur à ta droite" aria-description="Tu ne peux pas voir la valeur de cette carte" disabled>🂠</button>'.repeat(joueurhautnbcartes);
  document.getElementById("mainjoueurdroite").innerHTML='<button class="card inhand" aria-label="Carte détenu par le joueur à ta droite" aria-description="Tu ne peux pas voir la valeur de cette carte" disabled>🂠</button>'.repeat(joueurdroitenbcartes);
  document.getElementById("mainjoueurgauche").innerHTML='<button class="card inhand" aria-label="Carte détenu par le joueur à ta droite" aria-description="Tu ne peux pas voir la valeur de cette carte" disabled>🂠</button>'.repeat(joueurgauchenbcartes);
}

ws.onmessage = (message) => {
  console.log(message.data);
  //update DOM
  update(message.data);
}

const playersCards = Array.from(document.getElementsByClassName("playerhand"));
playersCards.forEach((c, index) => {
  c.addEventListener("click", (event) => {
    ws.send(index);
    console.log(index);
  });
});

function generateRandomName() {
  let firstnames = ["Marie", "Jean", "Jeanne", "Pierre", "Françoise", "Michel",
                    "Monique", "André", "Catherine", "Philippe", "Nat", "Louis"];
  let lastnames = ["Cool", "Bon", "Vière", "Bière", "Nice", "Bonne", "Arbre"];
  return firstnames[Math.floor(Math.random() * firstnames.length)] + " " +
         lastnames[Math.floor(Math.random() * lastnames.length)];
}

let suggestedName = generateRandomName()
let name = prompt("Quel est ton nom?", suggestedName);
if (name == null || name == "") name = suggestedName;
ws.send(name);
