// Create WebSocket to communicate with server.
const ws = new WebSocket("ws://" + location.host);

const savedState = {
  user: {
    seat: undefined,
    team: undefined,
    name: undefined
  }
}

// Act on incoming messages
ws.onmessage = msg => {
  data = JSON.parse(msg.data);
  console.log(data);

  if (data.hasOwnProperty("games")) {
    updateTableList(data.games);

    if (data.currentGame !== null) {
      closeModal(view.tableSelectDialog.container);
      view.game.tableName.innerText = data.currentGame.name;
      updateSeatedPlayers(data.currentGame.seatedplayers);

    } else {
      openModal(view.tableSelectDialog.container, true);
    }

  }

  if (data.hasOwnProperty("cardsinhand")) {
    updateCardsInHand(data.cardsinhand);
    savedState.user.seat = data.seat;
    savedState.user.team = data.team;
  }

  if (data.bidding === true) {
    savedState.phase = "bidding";

    view.bidDialog.bidAmount.min = data.currentBid ?? 50;
    if (view.bidDialog.bidAmount.value < data.currentBid) {
      view.bidDialog.bidAmount.value = data.currentBid;
    }

  } else if (data.bidding === false) {
    savedState.phase = "playing";
    setActivePlayer(data.currentBidWinner.name);

    view.game.state.innerText = "La partie peut commencer.";
  }

  if (data.hasOwnProperty("activePlayer")) {
    setActivePlayer(data.activePlayer.name);

    let stateText = "";

    if (savedState.phase === "bidding") {
      if (data.activePlayer.name === savedState.user.name) {
        stateText = "C’est à vous de miser.";
        openModal(view.bidDialog.container, true);
      } else {
        stateText = `C’est à ${data.activePlayer.name} de miser.`;
      }

    } else if (savedState.phase === "playing") {
      if (data.activePlayer.name === savedState.user.name) {
        stateText = "C’est à vous de jouer une carte.";
      } else {
        stateText = `C’est à ${data.activePlayer.name} de jouer une carte.`;
      }
    }

    view.game.state.innerText = stateText;
  }

  if (data.hasOwnProperty("table")) {
    updateTableCenter(data.table)
  }

  if (data.hasOwnProperty("trump")) {
    let className = "placeholder";
    if (data.trump !== null) {
      className = getColorFromIndex(data.trump);
    }
    view.game.trumpCard.className = "card medium " + className;
  }

  if (data.hasOwnProperty("points")) {
    const homeTeam = savedState.user.team;
    const awayTeam = 1 - homeTeam;
    view.game.pointsHome.innerText = data.points[homeTeam] + " pts";
    view.game.pointsAway.innerText = data.points[awayTeam] + " pts";
  }
};


ws.onopen = () => {
  const randomName = generateRandomName();
  view.tableSelectDialog.name.value = randomName;
  ws.send(JSON.stringify({ name: randomName }));
};


// Table selection
openModal(view.tableSelectDialog.container, true);


// Generates a random name.
function generateRandomName() {
  const firstNames = ["Marie", "Jean", "Jeanne", "Pierre", "Françoise", "Michel",
                      "Monique", "André", "Catherine", "Philippe", "Nat", "Louis"];
  const lastNames = ["Cool", "Bon", "Vière", "Bière", "Nice", "Bonne", "Arbre"];
  return firstNames[Math.floor(Math.random() * firstNames.length)] + " " +
         lastNames[Math.floor(Math.random() * lastNames.length)];
}
