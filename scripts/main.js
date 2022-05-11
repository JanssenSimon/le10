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
let ws = new WebSocket("ws://" + location.host);

function cardStringToChar(cardString) {
  if (typeof cardString === 'undefined')
    return "🃟";
  let code = "0x1F0"
  switch (cardString.charAt(0)) {
    case "♠":
      code = code + "A";
      break;
    case "♡":
      code = code + "B";
      break;
    case "♢":
      code = code + "C";
      break;
    case "♣":
      code = code + "D";
      break;
    default:
      console.log("ERROR: card string is invalid, make sure it follows <suit><value> convention");
  }
  switch (cardString.substring(1)) {
    case "A":
      code = code + "1";
      break;
    case "K":
      code = code + "E";
      break;
    case "Q":
      code = code + "D";
      break;
    case "J":
      code = code + "B";
      break;
    case "10":
      code = code + "A";
      break;
    default:
      code = code + cardString.substring(1);
  }
  //console.log("Unicode code: " + code);
  return String.fromCodePoint(parseInt(code));
}

function activatePlayerHandButtons() {
  const playersCards = Array.from(document.getElementsByClassName("playerhand"));
  playersCards.forEach((c, index) => {
    c.addEventListener("click", (event) => {
      ws.send(index);
      //console.log(index);
    });
  });
}

document.getElementById("submitbutton").addEventListener("click", () => {
  ws.send(document.getElementById("bet").value)
  //console.log(document.getElementById("bet").value)
});
document.getElementById("foldbutton").addEventListener("click", () => {
  ws.send("fold");
  //console.log("fold");
});

//taken from k0m0r on stackoverflow, thanks k0m0r
function pad_array(arr,len,fill) {
  return arr.concat(Array(len).fill(fill)).slice(0,len);
}

function update(message) {
  message = JSON.parse(message);
  currentPlayer = message.currentplayer;
  let offset = message.startingplayeroffset - 4;
  let cartehaut = "";
  let cartedroite = "";
  let cartegauche = "";
  let cartebas = "";
  names = pad_array(message.names, 4, "");
  switch(currentPlayer) {
    case "Player1":
      joueurhautnbcartes = message.player3cards;
      cartehaut = cardStringToChar(message.thisroundplayedcards[(2-offset)%4]);
      nomhaut = names[2];
      joueurdroitenbcartes = message.player4cards;
      cartedroite = cardStringToChar(message.thisroundplayedcards[(3-offset)%4]);
      nomdroite = names[3];
      joueurgauchenbcartes = message.player2cards;
      cartegauche = cardStringToChar(message.thisroundplayedcards[(1-offset)%4]);
      nomgauche = names[1];
      cartebas = cardStringToChar(message.thisroundplayedcards[(0-offset)%4]);
      nombas = names[0];
      break;
    case "Player2":
      joueurhautnbcartes = message.player4cards;
      cartehaut = cardStringToChar(message.thisroundplayedcards[(3-offset)%4]);
      nomhaut = names[3];
      joueurdroitenbcartes = message.player1cards;
      cartedroite = cardStringToChar(message.thisroundplayedcards[(0-offset)%4]);
      nomdroite = names[0];
      joueurgauchenbcartes = message.player3cards;
      cartegauche = cardStringToChar(message.thisroundplayedcards[(2-offset)%4]);
      nomgauche = names[2];
      cartebas = cardStringToChar(message.thisroundplayedcards[(1-offset)%4]);
      nombas = names[1];
      break;
    case "Player3":
      joueurhautnbcartes = message.player1cards;
      cartehaut = cardStringToChar(message.thisroundplayedcards[(0-offset)%4]);
      nomhaut = names[0];
      joueurdroitenbcartes = message.player2cards;
      cartedroite = cardStringToChar(message.thisroundplayedcards[(1-offset)%4]);
      nomdroite = names[1];
      joueurgauchenbcartes = message.player4cards;
      cartegauche = cardStringToChar(message.thisroundplayedcards[(3-offset)%4]);
      nomgauche = names[3];
      cartebas = cardStringToChar(message.thisroundplayedcards[(2-offset)%4]);
      nombas = names[2];
      break;
    case "Player4":
      joueurhautnbcartes = message.player2cards;
      cartehaut = cardStringToChar(message.thisroundplayedcards[(1-offset)%4]);
      nomhaut = names[1];
      joueurdroitenbcartes = message.player3cards;
      cartedroite = cardStringToChar(message.thisroundplayedcards[(2-offset)%4]);
      nomdroite = names[2];
      joueurgauchenbcartes = message.player1cards;
      cartegauche = cardStringToChar(message.thisroundplayedcards[(0-offset)%4]);
      nomgauche = names[0];
      cartebas = cardStringToChar(message.thisroundplayedcards[(3-offset)%4]);
      nombas = names[3];
      break;
    default:
      console.log("ERROR : insufficient information received");
  }
  document.getElementById("mainjoueurhaut").innerHTML='<h2 id="nomjoueurhaut">Jérémie</h2>'+'<button class="card inhand" aria-label="Carte détenu par le joueur à ta droite" aria-description="Tu ne peux pas voir la valeur de cette carte" disabled>🂠</button>'.repeat(joueurhautnbcartes);
  document.getElementById("mainjoueurdroite").innerHTML='<h2 id="nomjoueurdroite">Stefan</h2>'+'<button class="card inhand" aria-label="Carte détenu par le joueur à ta droite" aria-description="Tu ne peux pas voir la valeur de cette carte" disabled>🂠</button>'.repeat(joueurdroitenbcartes);
  document.getElementById("mainjoueurgauche").innerHTML='<h2 id="nomjoueurgauche">Laurier</h2>'+'<button class="card inhand" aria-label="Carte détenu par le joueur à ta droite" aria-description="Tu ne peux pas voir la valeur de cette carte" disabled>🂠</button>'.repeat(joueurgauchenbcartes);

  document.getElementById("carte-haut").innerHTML=cartehaut;
  document.getElementById("carte-droite").innerHTML=cartedroite;
  document.getElementById("carte-gauche").innerHTML=cartegauche;
  document.getElementById("carte-bas").innerHTML=cartebas;

  let newPlayerHandHTML = "";
  message.currentplayercards.forEach((card) => {
    newPlayerHandHTML=newPlayerHandHTML+'<button class="card inhand playerhand" aria-label="Carte que vous détennez"aria-description="Ace de trèfle">'
                                       +cardStringToChar(card)
                                       +'</button>';
  });
  document.getElementById("mainjoueurbas").innerHTML='<h2 id="nomjoueurbas">Alexis</h2>'+newPlayerHandHTML;
  activatePlayerHandButtons();

  document.getElementById("nomjoueurbas").innerHTML=nombas;
  document.getElementById("nomjoueurhaut").innerHTML=nomhaut;
  document.getElementById("nomjoueurdroite").innerHTML=nomdroite;
  document.getElementById("nomjoueurgauche").innerHTML=nomgauche;

  if (message.lastroundplayedcards.length > 0) {
    document.getElementById("lastroundrevealer").classList.remove("hidelastround");
    document.getElementById("lastroundhaut").innerHTML=cardStringToChar(message.lastroundplayedcards[0]);
    document.getElementById("lastrounddroite").innerHTML=cardStringToChar(message.lastroundplayedcards[1]);
    document.getElementById("lastroundbas").innerHTML=cardStringToChar(message.lastroundplayedcards[2]);
    document.getElementById("lastroundgauche").innerHTML=cardStringToChar(message.lastroundplayedcards[3]);
  } else {
    document.getElementById("lastroundrevealer").classList.add("hidelastround");
    document.getElementById("lastroundhaut").classList.add("hidelastround");
    document.getElementById("lastrounddroite").classList.add("hidelastround");
    document.getElementById("lastroundbas").classList.add("hidelastround");
    document.getElementById("lastroundgauche").classList.add("hidelastround");
  }

  document.getElementById("teampoints").innerHTML="Ton équipe: "
                                                 +message.yourteampoints
                                                 +" point(s)";
  document.getElementById("adversarypoints").innerHTML="Équipe adverse: "
                                                      +message.otherteampoints
                                                      +" point(s)";

  document.getElementById("currentgameinstruction").innerHTML = "C'est à " + message.whosturn + " de jouer";

  if (message.mise) {
    document.getElementById("currentgameinstruction").classList.add("yeeted");
    document.getElementById("bettingsection").classList.remove("yeeted");
    if (message.winthreshold >= 50)
      document.getElementById("betamount").innerHTML="La mise est à " + message.winthreshold + " en ce moment";
    else
      document.getElementById("betamount").innerHTML="Personne n'a encore misé";
    if (message.bettingplayer == currentPlayer)
      document.getElementById("betform").classList.remove("yotted");
    else
      document.getElementById("betform").classList.add("yotted");
  } else {
    document.getElementById("bettingsection").classList.add("yeeted");
    document.getElementById("currentgameinstruction").classList.remove("yeeted");
  }
}

ws.onmessage = (message) => {
  //console.log(message.data);
  //update DOM
  update(message.data);
}

activatePlayerHandButtons();

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
