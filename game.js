import { debugprint } from "./debug.js"

const gameFlag = true;

// ----------------------------------------------------------------------------
// Game rules
// ----------------------------------------------------------------------------

export class Game {
  constructor() {
    this.seats = new Map([
      [0, {hand: null, playerID: null}],
      [1, {hand: null, playerID: null}],
      [2, {hand: null, playerID: null}],
      [3, {hand: null, playerID: null}]
    ]);
    this.players = new Map();

    this.seatToBet = 0;
    this.highestBet = null;
    this.betters = [];  //players that can still bet, if empty not betting time

    this.startingPlayer = 3;

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
        this.startingPlayer = this.seatToBet;
        debugprint(amount + " is the new highest bet.", gameFlag);
      } else {
        //bet invalid, TODO send response to player
        debugprint(amount + " is an invalid bet amount.", gameFlag);
        return;
      }
      if (this.betters.length <= 1) { //betting over?
        this.betters = [];
        debugprint("Betting is over.", gameFlag);
        debugprint("It is seat " + this.startingPlayer + "'s turn to play.", gameFlag);
        //TODO update everyone with the fact that the betting is over
        //TODO update everyone with the fact that it's startingPlayers's turn to play
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

  playCard(uid, cardChoice) {
    debugprint("Player " + uid + " choosing card " + cardChoice, gameFlag);
  }

  resetGame() {
    this.distributePlayingCards();
    this.betters = [0, 1, 2, 3];
    this.startingPlayer = (this.seatToBet + 3) % 4;
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
