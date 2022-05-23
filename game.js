import { debugprint } from "./debug.js"

const gameFlag = true;

// ----------------------------------------------------------------------------
// Game rules
// ----------------------------------------------------------------------------

export class Game {
  constructor() {
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

    this.seatToBet = 0;
    this.highestBet = null;
    this.highestBetter = 3;
    this.betters = [];  //players that can still bet, if empty not betting time

    this.seatToPlay = 3;
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

  addPlayer(uid, name) {
    debugprint("Adding player " + uid + " to game", gameFlag);
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
    //TODO send message to all players containing updated players
  }

  exits(uid) {
    debugprint("Player " + uid + " exits game", gameFlag);
    this.seats.get(this.players.get(uid).seat).playerID = null;
    this.players.delete(uid);
    debugprint("Current state of seats and players:", gameFlag);
    debugprint(this.seats, gameFlag);
    debugprint(this.players, gameFlag);
    //TODO maybe replace exited player with someone from the spectators?
    //TODO send message to all players containing updated players
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
      } else {
        //bet invalid, TODO send response to player
        debugprint(amount + " is an invalid bet amount.", gameFlag);
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
        //TODO update everyone with the fact that it's seatToPlay's turn to play
      } else {
        //if not update who's turn it is to bet
        this.seatToBet = this.betters[betrsIndx] === this.seatToBet ? this.betters[(betrsIndx + 1) % this.betters.length] : this.betters[(betrsIndx) % this.betters.length];
        debugprint("It is now seat " + this.seatToBet + "'s turn to bet.", gameFlag);
        //TODO update everyone with who's turn it is to bet
      }
    } else {
      //TODO update player with fact it is not time for them to bet
      debugprint("But it is not time for them to bet.", gameFlag);
    }} else {
      //TODO update player with fact there aren't enough players for them to bet
      debugprint("There aren't enough seated players to allow betting.", gameFlag);
    }
  }

  isOkToPlay(seatToPlay, cardChoice) {
    // TODO make sure that, according to the rules, the chosen card is chill to play
    return false;
  }

  playCard(uid, cardChoice) {
    debugprint("Player " + uid + " choosing card " + cardChoice, gameFlag);
    if (this.allSeatsFilled()) {
    //verify that player is allowed to play a card
    if (this.seats.get(this.seatToPlay).playerID === uid && this.betters.length === 0 && !this.gamePaused) {
      //verify played card choice is valid
      if (cardChoice < this.seats.get(this.seatToPlay).hand.length && this.isOkToPlay(this.seatToPlay, cardChoice)) {
        chosenCard = this.seats.get(this.seatToPlay).hand.splice(cardChoice,1);
        debugprint("Seat " + this.seatToPlay + " plays " + chosenCard, gameFlag);
        this.table.set(this.seatToPlay, chosenCard);

        //check if four cards have been played
        if (this.table.get(0) && this.table.get(1) && this.table.get(2) && this.table.get(3)) {
          //TODO do the whole thing when the round is over
          //if yes check winning card and affect points to correct player
          //check if last round of game
          //    if yes announce winners of game
          //set startingPlayer to winning player
          //start a timer for pausing the game so people can check their cards
        }else{
          //TODO update players with new player to play and card that been played
          this.seatToPlay = (this.seatToPlay + 1) % 4;
          debugprint("It is now seat " + this.seatToPlay + "'s turn to play", gameFlag);
        }
      } else {
        //TODO update player with fact they've played the wrong card
        debugprint("Seat " + this.seatToPlay + " cannot play " + chosenCard, gameFlag);
      }
    } else {
      //TODO update player with fact it is not time for them to play
      debugprint("But it is not time for them to play.", gameFlag);
    }} else {
      //TODO update player with fact there aren't enough players for them to play
      debugprint("There aren't enough seated players to play a card.", gameFlag);
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
  }

  distributePlayingCards() {  //assigns playing cards randomly to four players
    let arrs = [[],[],[],[]];
    const suits = ["♠","♡","♢","♣"];
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
}
