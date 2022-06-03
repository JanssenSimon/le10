// Create WebSocket to communicate with server.
const ws = new WebSocket("ws://" + location.host);

const savedState = {
  phase: "waiting",
  currentBid: undefined,
  user: {
    seat: 3, // Hack if player's seat is unavailable when drawing players' cards
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

    savedState.bid = data.currentBid ?? 50;
    view.bidDialog.bidAmount.min = savedState.bid;
    if (view.bidDialog.bidAmount.value < savedState.bid) {
      view.bidDialog.bidAmount.value = savedState.bid;
    }

  } else if (data.bidding === false && savedState.phase !== "waiting") {
    savedState.phase = "playing";
    setActivePlayer(data.currentBidWinner.name);

    const bidAmount = savedState.bid;
    const attackingTeam = (data.currentBidWinner.seat + savedState.user.seat) % 2;
    setBid(bidAmount, attackingTeam);

    const userIsActivePlayer = data.currentBidWinner.name === savedState.user.name;
    const adressee = userIsActivePlayer ? "vous" : data.currentBidWinner.name;

    setStateText(`La partie commence. À ${adressee} de jouer.`);
  }

  if (data.hasOwnProperty("activePlayer")) {
    if (data.bidding === true) {
      setActivePlayer(data.activePlayer.name);

      if (data.activePlayer.name === savedState.user.name) {
        setStateText("C’est à vous de miser.");
        openModal(view.bidDialog.container, true);

      } else {
        setStateText(`C’est à ${data.activePlayer.name} de miser.`);
      }

    } else if (data.playing === true) {
      setActivePlayer(data.activePlayer.name);

      if (data.activePlayer.name === savedState.user.name) {
        setStateText("C’est à vous de jouer une carte.");
      } else {
        setStateText(`C’est à ${data.activePlayer.name} de jouer une carte.`);
      }
    }
  }

  if (data.hasOwnProperty("table") && savedState.phase === "playing") {
    updateTableCenter(data.table);
  }

  if (data.hasOwnProperty("lastWinningPlayer")) {
    savedState.lastWinningPlayer = data.lastWinningPlayer;
  }

  if (data.hasOwnProperty("lastFourCards") && savedState.phase === "playing") {
    updateLastFourCards(data.lastFourCards, savedState.lastWinningPlayer);
  }

  if (data.hasOwnProperty("trump") && data.playing === true) {
    let className = "placeholder";
    if (data.trump !== null) {
      className = getColorFromIndex(data.trump);
    }
    view.game.trumpCard.className = "card medium " + className;
  }

  if (data.hasOwnProperty("points") && data.playing === true) {
    const homeTeam = savedState.user.team;
    const awayTeam = 1 - homeTeam;
    view.game.pointsHome.innerText = data.points[homeTeam] + " pts";
    view.game.pointsAway.innerText = data.points[awayTeam] + " pts";
  }

  if (data.hasOwnProperty("hands") && savedState.phase !== "waiting") {
    for (let player in data.hands) {
      updateNbOfCardsInHand(data.hands[player], player);
    }
  }
};


ws.onopen = () => {
  const randomName = generateRandomName();
  view.tableSelectDialog.name.value = randomName;
  savedState.user.name = randomName;
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
