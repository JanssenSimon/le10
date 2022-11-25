import { debugprint } from "./debug.js"
import { sendToClients } from "./server.js"

const gameFlag = true;
const comparisonFlag = true;

// ----------------------------------------------------------------------------
// Game rules
// ----------------------------------------------------------------------------

export class Game {
  constructor() {
    this.name = "BRUH";
    this.seats = new Map([
      [0, {hand: null, playerID: null, points: 0}],
      [1, {hand: null, playerID: null, points: 0}],
      [2, {hand: null, playerID: null, points: 0}],
      [3, {hand: null, playerID: null, points: 0}]
    ]);
    this.players = new Map();

    this.table = new Map([
      [0, null],
      [1, null],
      [2, null],
      [3, null]
    ]);
    this.lastFourCards = new Map([
      [0, null],
      [1, null],
      [2, null],
      [3, null]
    ]);

    this.sorteDemandee = null;
    this.atout = null;

    this.seatToBet = 0;
    this.highestBet = null;
    this.highestBetter = 3;
    this.betters = [];  //players that can still bet, if empty not betting time

    this.seatToPlay = 3;
    this.lastWinningSeat = null;
    this.gamePaused = false;

    this.resetGame();
  }

  sit(uid, seat) {
    if (this.seats.get(seat).playerID &&
        this.players.has(this.seats.get(seat).playerID) &&
        this.players.get(this.seats.get(seat).playerID).seat === seat)
      return false;
    this.players.get(uid).seat = seat;
    this.seats.get(seat).playerID = uid;
    return true;
  }

  updatePlayersPlayers() {
    let clientsToUpdate = Array.from(this.players, ([uid, player]) => (uid));
    let allPlayers = Array.from(this.players, ([uid, player]) => (player));
    sendToClients(clientsToUpdate, JSON.stringify({allplayers: allPlayers}));
  }
  updatePlayersBids() {
    let bidding = (this.betters.length > 0 && this.allSeatsFilled())
    let activePlayer = this.players.get(this.seats.get(this.seatToBet).playerID);
    let currentBid = this.highestBet;
    let currentBidWinner = this.players.get(this.seats.get(this.highestBetter).playerID);
    let currentlyFolded = Array.from([0,1,2,3].filter(x => !(this.betters.includes(x))),
                               (seatNum) => (this.players.get(this.seats.get(seatNum).playerID)));
    sendToClients(Array.from(this.players,([id,_])=>(id)), JSON.stringify({
      bidding,
      activePlayer,
      currentBid,
      currentBidWinner,
      currentlyFolded
    }));
  }
  updatePlayersThemselves() {
    this.seats.forEach((seat, seatNum) => {
      sendToClients([seat.playerID], JSON.stringify({
        cardsinhand: seat.hand,
        seat: seatNum,
        team: seatNum % 2
      }));
    });
  }
  updatePlayersCards() {
    let playing = (this.betters.length === 0 && this.allSeatsFilled())
    let activePlayer = this.players.get(this.seats.get(this.seatToPlay).playerID);
    let lastWinningPlayer = this.lastWinningSeat;
    let points = {0:this.seats.get(0).points+this.seats.get(2).points, 1:this.seats.get(1).points+this.seats.get(3).points}
    let trump = this.atout
    let sorteDemandee = this.sorteDemandee
    let table = Object.fromEntries(this.table);
    let lastFourCards = Object.fromEntries(this.lastFourCards);
    let hands = Array.from(this.seats, ([seatNum, seat]) => (seat.hand.length));
    sendToClients(Array.from(this.players,([id,_])=>(id)), JSON.stringify({
      playing,
      activePlayer,
      lastWinningPlayer,
      points,
      trump,
      sorteDemandee,
      table,
      lastFourCards,
      hands
    }));
  }
  updatePlayersTable() {
    let sorteDemandee = this.sorteDemandee
    let table = Object.fromEntries(this.table);
    let lastFourCards = Object.fromEntries(this.lastFourCards);
    sendToClients(Array.from(this.players,([id,_])=>(id)), JSON.stringify({
      sorteDemandee,
      table,
      lastFourCards
    }));
  }

  addPlayer(uid, name) {
    name = name.substring(0, 21)
    debugprint("Adding player " + uid + " to game", gameFlag);
    if (this.name === "BRUH")
      this.name = "Table de " + name;
    this.players.set(uid, {name: name, seat: null});
    //sits new player if seat available
    for (const [key, seat] of this.seats.entries()) {
      if (this.sit(uid, key)) {
        debugprint("Player " + uid + " seated on seat " + key, gameFlag);
        break;
      }
    }
    debugprint("Current state of seats and players:", gameFlag);
    debugprint(this.seats, gameFlag);
    debugprint(this.players, gameFlag);

    //update joined player with state of game
    this.updatePlayersBids();
    this.updatePlayersCards();
    this.updatePlayersThemselves();

    //send message to all players containing updated players
    this.updatePlayersPlayers()
  }

  exits(uid) {
    debugprint("Player " + uid + " exits game", gameFlag);
    if (this.players.get(uid).seat)
      this.seats.get(this.players.get(uid).seat).playerID = null;
    this.players.delete(uid);
    debugprint("Current state of seats and players:", gameFlag);
    debugprint(this.seats, gameFlag);
    debugprint(this.players, gameFlag);
    //TODO maybe replace exited player with someone from the spectators?
    //send message to all players containing updated players
    this.updatePlayersPlayers()
  }

  allSeatsFilled() {
    var allFilled = true;
    this.seats.forEach((s, key) => {
      if (!(s.playerID &&
          this.players.has(s.playerID) &&
          this.players.get(s.playerID).seat === key))
        allFilled = false;
    });
    return allFilled;
  }

  bet(uid, amount) {
    debugprint("Player " + uid + " betting " + amount, gameFlag);
    if (this.allSeatsFilled()) {
    //verify that player is allowed to bet
    if (this.seats.get(this.seatToBet).playerID === uid && this.betters.length > 0) {
      let betrsIndx = this.betters.indexOf(this.seatToBet);
      //verify bet is valid
      if (amount === "fold") {
        this.betters.splice(betrsIndx,1);
        debugprint("They are out of the betting process.", gameFlag);
      } else if (!(this.highestBet) || amount > this.highestBet) {
        this.highestBet = amount;
        this.highestBetter = this.seatToBet;
        debugprint(amount + " is the new highest bet.", gameFlag);
        if (amount === 100)
          this.betters = [];    //if someone goes all in, betting over
      } else {
        //bet invalid, send response to player
        debugprint(amount + " is an invalid bet amount.", gameFlag);
        sendToClients([uid], JSON.stringify({error: "Ta mise doit être supérieure à la précédente."}));
        return;
      }
      if (this.betters.length <= 1) { //betting over?
        this.betters = [];
        if (!(this.highestBet))
          this.highestBet = 50;     //if nobody bets, 50 points required to win
        this.seatToPlay = this.highestBetter;
        debugprint("Betting is over.", gameFlag);
        debugprint("It is seat " + this.seatToPlay + "'s turn to play.", gameFlag);
        //TODO update everyone with the fact that the betting is over
        //and with the fact that it's seatToPlay's turn to play
        this.updatePlayersCards();
      } else {
        //if not update who's turn it is to bet
        this.seatToBet = this.betters[betrsIndx] === this.seatToBet ? this.betters[(betrsIndx + 1) % this.betters.length] : this.betters[(betrsIndx) % this.betters.length];
        debugprint("It is now seat " + this.seatToBet + "'s turn to bet.", gameFlag);
      }
      //update everyone with who's turn it is to bet
      this.updatePlayersBids();
    } else {
      debugprint("But it is not time for them to bet.", gameFlag);
      sendToClients([uid], JSON.stringify({error: "Ce n'est pas à ton tour de miser."}));
    }} else {
      debugprint("There aren't enough seated players to allow betting.", gameFlag);
      sendToClients([uid], JSON.stringify({error: "Il n'y a pas assez de joueurs pour miser."}));
    }
  }

  isOkToPlay(cardChoice) {
    // make sure that, according to the rules, the chosen card is chill to play
    let chosenCard = this.seats.get(this.seatToPlay).hand[cardChoice];
    if (!(this.sorteDemandee) || this.sorteDemandee === chosenCard.charAt(0)) {
      return true;
    } else {
      //does the player not have cards of the same kind as what's asked?
      return !(this.seats.get(this.seatToPlay).hand.reduce((does, card) => {
        return does || this.sorteDemandee === card.charAt(0);
      }, false));
    }
  }

  valueToInt(value) {    //converts card value to integer value for comparison
    switch (value) {
      case "A":
        return 14;
      case "K":
        return 13;
      case "Q":
        return 12;
      case "J":
        return 11;
      default:
        return parseInt(value);
    }
  }

  isStronger(card1, card2, demandee, atout) {   //comparing cards to find win
    switch (card1.charAt(0)) {
      case atout:
        if (card2.charAt(0) === atout) {
          return !(this.valueToInt(card1.substring(1)) < this.valueToInt(card2.substring(1)));
        } else {
          return true;
        }
      case demandee:
        if (card2.charAt(0) === atout) {
          return false;
        } else if (card2.charAt(0) === demandee) {
          return !(this.valueToInt(card1.substring(1)) < this.valueToInt(card2.substring(1)));
        } else {
          return true;
        }
      default:
        console.log("ERROR, cannot compare cards");
        debugprint("Card1 : " + card1 + "\tCard2 : " + card2, comparisonFlag);
        debugprint("Sorte demandee : " + demandee + "\tAtout : " + atout, comparisonFlag);
    }
  }

  getWinningSeat() {
    let winningSeat = null;
    let winningCard = null;
    this.table.forEach((card, seatnum) => {
      if (!(winningCard) || this.isStronger(card, winningCard, this.sorteDemandee, this.atout)) {
        winningSeat = seatnum;
        winningCard = card;
      }
    });
    debugprint("Winningseat: " + winningSeat, gameFlag);
    return winningSeat;
  }

  cardToPoints(card) {
    switch (card.substring(1)) {
      case "A":
      case "10":
        return 10;
      case "5":
        return 5;
      default:
        return 0;
    }
  }

  getPointsOnTable() {
    let points = 0;
    this.table.forEach((card, seatnum) => {points += this.cardToPoints(card);});
    return points;
  }

  getTeamPoints() {return {team1: this.seats.get(0).points+this.seats.get(2).points, team2: this.seats.get(1).points+this.seats.get(3).points};}

  switchCards() {
    return new Promise (resolve => {
      setTimeout(() => {
        this.sorteDemandee = null;
        this.lastFourCards = this.table;
        this.table = new Map([
          [0, null],
          [1, null],
          [2, null],
          [3, null]
        ]);
        //send to players updated table
        this.updatePlayersTable();
        this.gamePaused = false;
      }, 1);               //give 1 milliseconds for players to acknowledge round
    });
  }
  async switchToNextCards() {    // async caller function
    await this.switchCards();
  }

  playCard(uid, cardChoice) {
    debugprint("Player " + uid + " choosing card " + cardChoice, gameFlag);
    if (this.allSeatsFilled()) {
    //verify that player is allowed to play a card
    if (this.seats.get(this.seatToPlay).playerID === uid && this.betters.length === 0 && !this.gamePaused) {
      //verify played card choice is valid
      if (cardChoice < this.seats.get(this.seatToPlay).hand.length && this.isOkToPlay(cardChoice)) {
        let chosenCard = this.seats.get(this.seatToPlay).hand.splice(cardChoice,1)[0];
        debugprint("Seat " + this.seatToPlay + " plays " + chosenCard, gameFlag);
        this.table.set(this.seatToPlay, chosenCard);
        debugprint(this.table, gameFlag);
        if (!(this.sorteDemandee)) {
          this.sorteDemandee = chosenCard.charAt(0);
          debugprint("Sorte demandee: " + this.sorteDemandee, gameFlag);
        }
        if (!(this.atout)) {
          this.atout = chosenCard.charAt(0);
          debugprint("Atout: " + this.atout, gameFlag);
        }

        //check if four cards have been played
        if (this.table.get(0) && this.table.get(1) && this.table.get(2) && this.table.get(3)) {
          let winningSeat = this.getWinningSeat();
          this.seats.get(winningSeat).points += this.getPointsOnTable();
          debugprint("Seat " + winningSeat + " wins " + this.getPointsOnTable() + " points!", gameFlag);
          debugprint(this.getTeamPoints(), gameFlag);
          this.seatToPlay = winningSeat;
          debugprint("It is seat " + winningSeat + "'s turn to play", gameFlag);
          this.lastWinningSeat = winningSeat;

          //check if last round of game
          //    if yes announce winners of game
          //    TODO send to players the winning of the game
          //    resetgame after delay

          //start a timer for pausing the game so people can check their cards
          this.gamePaused = true;
          this.switchToNextCards();
        }else{
          this.seatToPlay = (this.seatToPlay + 1) % 4;
          debugprint("It is now seat " + this.seatToPlay + "'s turn to play", gameFlag);
        }

        //update players with played card and atout/sorteDemandee and activeplayer
        this.updatePlayersThemselves();
        this.updatePlayersCards();
      } else {
        //update player with fact they've played the wrong card
        debugprint("Seat " + this.seatToPlay + " cannot play the card they chose.", gameFlag);
        sendToClients([uid], JSON.stringify({error: "Tu ne peux pas jouer cette carte en ce moment."}));
      }
    } else {
      //update player with fact it is not time for them to play
      debugprint("But it is not time for them to play.", gameFlag);
      sendToClients([uid], JSON.stringify({error: "Ce n'est pas à votre tour de jouer."}));
    }} else {
      //update player with fact there aren't enough players for them to play
      debugprint("There aren't enough seated players to play a card.", gameFlag);
      sendToClients([uid], JSON.stringify({error: "Il n'y a pas assez de joueurs pour jouer."}));
    }
  }

  resetGame() {
    this.distributePlayingCards();
    this.betters = [0, 1, 2, 3];
    this.seatToPlay = (this.seatToBet + 3) % 4; //if no one bets, the last player starts
    this.highestBetter = this.seatToPlay;
    this.highestBet = null;
    this.seats.forEach((seat, key) => {seat.points = 0;});
    this.table = new Map([
      [0, null],
      [1, null],
      [2, null],
      [3, null]
    ]);
    this.lastFourCards = new Map([
      [0, null],
      [1, null],
      [2, null],
      [3, null]
    ]);
    this.sorteDemandee = null;
    this.atout = null;
  }

  distributePlayingCards() {  //assigns playing cards randomly to four players
    let arrs = [[],[],[],[]];
    const suits = ["♡","♣","♢","♠"];
    const values = ["5","6","7","8","9","10","J","Q","K","A"];
    suits.forEach((s) => {
      values.forEach((v) => {
        do {
          var selectedHand = Math.floor(Math.random() * arrs.length);
        } while (arrs[selectedHand].length >= 10);
        arrs[selectedHand].push(s+v);
      });
    });
    debugprint("Distributed cards:", gameFlag);
    debugprint(arrs, gameFlag);
    this.seats.forEach((seat, key) => {seat.hand = arrs[key];});
  }

  getSeatedPlayers() {
    let names = [];
    this.seats.forEach((seat, seatid) => {
      if (seat.playerID && this.players.has(seat.playerID) && this.players.get(seat.playerID).name)
        names.push(this.players.get(seat.playerID).name);
    });
    return names;
  }
  isInGame(uid) {
    return this.players.has(uid);
  }
}
