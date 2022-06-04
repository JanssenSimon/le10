// Create WebSocket to communicate with server.
const ws = new WebSocket("ws://" + location.host);

const savedState = {
  phase: "waiting",
  currentBid: undefined,
  lastFourCards: undefined,
  user: {
    seat: 3, // Hack for if player's seat is unavailable when drawing players' cards
    team: undefined,
    name: undefined
  }
}

// Act on incoming messages
ws.onmessage = msg => {
  data = JSON.parse(msg.data);
  console.log(data);


  // Manage tables list.
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


  // Manage bidding phase.
  if (data.bidding === true) {
    savedState.phase = "bidding";

    savedState.bid = data.currentBid ?? 50;
    view.bidDialog.bidAmount.min = savedState.bid;
    if (view.bidDialog.bidAmount.value < savedState.bid) {
      view.bidDialog.bidAmount.value = savedState.bid;
    }

  } else if (data.bidding === false && savedState.phase !== "waiting") {
    savedState.phase = "playing";
    updateActivePlayer(data.currentBidWinner.seat);

    const bidAmount = savedState.bid;
    const attackingTeam = (data.currentBidWinner.seat + savedState.user.seat) % 2;
    savedState.attackingTeam = data.currentBidWinner.seat % 2;
    drawBid(bidAmount, attackingTeam);

    const userIsActivePlayer = data.currentBidWinner.name === savedState.user.name;
    const adressee = userIsActivePlayer ? "vous" : data.currentBidWinner.name;

    updateStateText(`La partie commence. À ${adressee} de jouer.`);
  }


  // Highlight the active player.
  if (data.hasOwnProperty("activePlayer")) {
    if (data.bidding === true) {
      updateActivePlayer(data.activePlayer.seat);

      if (data.activePlayer.name === savedState.user.name) {
        updateStateText("C’est à vous de miser.");
        openModal(view.bidDialog.container, true);

      } else {
        updateStateText(`C’est à ${data.activePlayer.name} de miser.`);
      }

    } else if (data.playing === true) {
      updateActivePlayer(data.activePlayer.seat);

      if (data.activePlayer.name === savedState.user.name) {
        updateStateText("C’est à vous de jouer une carte.");
      } else {
        updateStateText(`C’est à ${data.activePlayer.name} de jouer une carte.`);
      }
    }
  }


  // Update the user's own cards.
  if (data.hasOwnProperty("cardsinhand")) {
    updateCardsInHand(data.cardsinhand);
    savedState.user.seat = data.seat;
    savedState.user.team = data.team;
  }


  // Update cards in the table center.
  if (data.hasOwnProperty("table") && savedState.phase === "playing") {
    updateTableCenter(data.table);
  }


  // Save round winner to state.
  if (data.hasOwnProperty("lastWinningPlayer")) {
    savedState.lastWinningPlayer = data.lastWinningPlayer;
  }


  // Draw last four cards at the end of a round.
  if (data.hasOwnProperty("lastFourCards") && savedState.phase === "playing") {
    const serializedLastCards = JSON.stringify(data.lastFourCards);
    if (serializedLastCards !== savedState.lastFourCards) {
      updateLastFourCards(data.lastFourCards, savedState.lastWinningPlayer);
      savedState.lastFourCards = serializedLastCards;
    }
  }


  // Set trump.
  if (data.hasOwnProperty("trump") && data.playing === true) {
    updateTrump(data.trump);
  }


  // Update scoreboard.
  if (data.hasOwnProperty("points") && data.playing === true) {
    updateScoreboard(data.points);
  }


  // Update other players' hands.
  if (data.hasOwnProperty("hands") && savedState.phase !== "waiting") {
    let totalNbOfCardsLeft = 0;
    for (let player in data.hands) {
      updateNbOfCardsInHand(data.hands[player], player);
      totalNbOfCardsLeft += data.hands[player];
    }

    // Trigger end screen when all hands are empty.
    if (totalNbOfCardsLeft === 0) {
      drawEndScreen(data.points);
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
