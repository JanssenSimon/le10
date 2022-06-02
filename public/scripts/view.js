function whenDOMReady(callback, options = { once: true, passive: true }) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, options);
  } else { callback(); }
}


// Holds references to interface elements.
const view = {
  game: {},
  nav: {},
  bidDialog: {},
  tutorialDialog: {},
  quitDialog: {},
  tableSelectDialog: {}
}


whenDOMReady(() => {
  view.game.tableName = document.getElementById("table-name");
  view.game.trumpCard = document.getElementById("trump-card");
  view.game.pointsHome = document.getElementById("points-home");
  view.game.pointsAway = document.getElementById("points-away");
  view.game.bidHome = document.getElementById("bid-home");
  view.game.bidAway = document.getElementById("bid-away");
  view.game.players = [
    {
      container: document.getElementById("player0"),
      name: document.getElementById("player0-name"),
      hand: document.getElementById("player0-hand")
    },
    {
      container: document.getElementById("player1"),
      name: document.getElementById("player1-name"),
      hand: document.getElementById("player1-hand")
    },
    {
      container: document.getElementById("player2"),
      name: document.getElementById("player2-name"),
      hand: document.getElementById("player2-hand")
    },
    {
      container: document.getElementById("player3"),
      name: document.getElementById("player3-name"),
      hand: document.getElementById("player3-hand")
    }
  ];
  view.game.state = document.getElementById("table-state");
  view.game.tableCenter = [
    document.getElementById("table-center-card0"),
    document.getElementById("table-center-card1"),
    document.getElementById("table-center-card2"),
    document.getElementById("table-center-card3")
  ];

  view.bidDialog.container = document.getElementById("bid");
  view.bidDialog.bidAmount = document.getElementById("bid-amount");
  view.bidDialog.bidPass = document.getElementById("bid-pass");
  view.bidDialog.bidConfirm = document.getElementById("bid-confirm");

  view.nav.tutorialLink = document.getElementById("nav-tutorial");
  view.tutorialDialog.container = document.getElementById("tutorial");
  view.tutorialDialog.closeButton = document.getElementById("tutorial-close");

  view.nav.quitLink = document.getElementById("nav-quit");
  view.quitDialog.container = document.getElementById("quit");
  view.quitDialog.cancelButton = document.getElementById("quit-cancel");
  view.quitDialog.confirmButton = document.getElementById("quit-confirm");

  view.tableSelectDialog.container = document.getElementById("table-select");
  view.tableSelectDialog.name = document.getElementById("player-name");
  view.tableSelectDialog.spectator = document.getElementById("spctator-mode");
  view.tableSelectDialog.newTable = document.getElementById("new-table");
  view.tableSelectDialog.tableList = document.getElementById("table-list");


  view.nav.tutorialLink.addEventListener("click", () => {
    openModal(view.tutorialDialog.container);
  });
  view.tutorialDialog.closeButton.addEventListener("click", () => {
    closeModal(view.tutorialDialog.container);
  });

  view.nav.quitLink.addEventListener("click", () => {
    openModal(view.quitDialog.container);
  });
  view.quitDialog.cancelButton.addEventListener("click", () => {
    closeModal(view.quitDialog.container);
  });
  view.quitDialog.confirmButton.addEventListener("click", () => {
    closeModal(view.quitDialog.container);
    openModal(view.tableSelectDialog.container, true);
  });

  view.tableSelectDialog.name.addEventListener("change", () => {
    const value = view.tableSelectDialog.name.value;
    savedState.user.name = value;
    ws.send(JSON.stringify({ name: value }));
  });
  view.tableSelectDialog.newTable.addEventListener("click", () => {
    ws.send(JSON.stringify({ gamechoice: "newgame" }));
  });

  view.bidDialog.bidPass.addEventListener("click", () => {
    ws.send(JSON.stringify({ bid: "fold" }));
    closeModal(view.bidDialog.container);
  });
  view.bidDialog.bidConfirm.addEventListener("click", () => {
    ws.send(JSON.stringify({ bid: parseInt(view.bidDialog.bidAmount.value) }));
    closeModal(view.bidDialog.container);
  });

});


/*
 * Wrapper for dialog.show().
 * Dialogs opened with this must use closeModal().
 * *el* is the dialog HTML element to be opened.
 * *trap* is whether to allow automatic exit methods (escape key and background click)
 */
function openModal(el, trap = false) {
  el.open = true;

  document.documentElement.classList.add("inert");

  if (!trap) {
    el.timeOpened = Date.now();
    el.abortCloseWithClick = new AbortController();
    document.addEventListener("click", e => {
      if (e.target !== el && !el.contains(e.target) &&
          Date.now() - 250 > el.timeOpened) {
        closeModal(el);
      }
    }, { signal: el.abortCloseWithClick.signal });

    el.abortCloseWithEscape = new AbortController();
    document.addEventListener("keydown", e => {
      if (e.code === "Escape") {
        closeModal(el)
        e.preventDefault();
      }
    }, { once: true, signal: el.abortCloseWithEscape.signal });
  }

}

/*
 * Wrapper for dialog.close().
 * *el* is the dialog HTML element to be closed.
 */
function closeModal(el) {
  el.abortCloseWithClick?.abort();
  el.abortCloseWithEscape?.abort();
  document.documentElement.classList.remove("inert");
  el.open = false;
}


function setActivePlayer(name) {
  for (const player of view.game.players) {
    if (name === player.name.innerText) {
      player.container.classList.add("active");
    } else {
      player.container.classList.remove("active");
    }
  }
}


/*
 * Utility function to create a new playing card element.
 */
function newCard(index, interactive = false) {
  const tagName = interactive ? "button" : "div";
  const newCard = document.createElement(tagName);
  newCard.classList.add("card");

  let className = [];

  if (index !== "face-down") {
    className.push(getColorFromIndex(index));
    className.push(getRankFromIndex(index));

  } else {
    className.push(index);
  }

  newCard.classList.add(...className);

  return newCard;
}

function getColorFromIndex(index) {
  let color = index.substring(0, 1);
  switch (color) {
    case "♠":
      color = "spades";
      break;
    case "♡":
      color = "hearts";
      break;
    case "♢":
      color = "diamonds";
      break;
    case "♣":
      color = "clubs";
      break;
  }
  return color;
}

function getRankFromIndex(index) {
  let rank = index.substring(1);
  switch (rank) {
    case "5":
      rank = "five";
      break;
    case "6":
      rank = "six";
      break;
    case "7":
      rank = "seven";
      break;
    case "8":
      rank = "eight";
      break;
    case "9":
      rank = "nine";
      break;
    case "10":
      rank = "ten";
      break;
    case "J":
      rank = "jack";
      break;
    case "Q":
      rank = "queen";
      break;
    case "K":
      rank = "king";
      break;
    case "A":
      rank = "ace";
      break;
  }
  return rank;
}

/*
 * Utility function to create a new playing card element.
 */
function updateTableList(tables) {
  // Clear table list.
  view.tableSelectDialog.tableList.innerHTML = "";

  if (tables.length === 0) {
    const p = document.createElement("p");
    view.tableSelectDialog.tableList.innerHTML = "<p class='no-games'>Aucune partie en cours.</p>";
  }

  for (const table of tables) {
    const isFull = table.seatedplayers.length >= 4;

    const tableElement = document.createElement("li");
    if (isFull) tableElement.classList.add("full");

    const tableName = document.createElement("h3");
    tableName.innerText = table.name;

    const playerCount = document.createElement("output");
    playerCount.innerText = `${table.seatedplayers.length}/4 joueurs`;
    const players = document.createElement("output");
    players.innerText = table.seatedplayers.join(", ");

    const join = document.createElement("button");
    join.classList.add("button");
    join.innerText = "Rejoindre";
    join.addEventListener("click", () => {
      ws.send(JSON.stringify({ gamechoice: table.uuid }));
    });

    tableElement.append(tableName, playerCount, players, join);

    view.tableSelectDialog.tableList.append(tableElement);
  }
}


/*
 * Draws names of seated players.
 */
function updateSeatedPlayers(seatedPlayers) {
  for (let i = 0; i < 4; i++) {
    playerSeat = (i + savedState.user.seat) % 4;
    const name = seatedPlayers.length - 1 >= playerSeat ? seatedPlayers[playerSeat] : "Vacant";
    view.game.players[i].name.innerText = name;
  }
}

function updateTableCenter(cards) {
  for (let i = 0; i < 4; i++) {
    playerSeat = (i - savedState.user.seat + 4) % 4;
    let className = "card ";
    if (cards[i] !== null) {
      className += getColorFromIndex(cards[i]) + " ";
      className += getRankFromIndex(cards[i]);
    } else {
      className += "placeholder";
    }
    view.game.tableCenter[playerSeat].className = className;
  }
}


/*
 * Draws the cards in the user's hand.
 */
function updateCardsInHand(hand) {
  view.game.players[0].hand.innerHTML = "";

  for (let i = 0; i < hand.length; i++) {
    const cardIndex = savedState.phase !== "waiting" ? hand[i] : "face-down";
    const cardElement = newCard(cardIndex, true);
    cardElement.addEventListener("click", () => {
      ws.send(JSON.stringify({ cardchoice: i }));
    });
    view.game.players[0].hand.append(cardElement);
  }
}

function setStateText(text) {
  view.game.state.innerText = text;
}
