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
    this.seats.every((seat, key) => {!(this.sit(uid, key));});

    debugprint("Current state of seats and players:", gameFlag);
    debugprint(this.seats, gameFlag);
    debugprint(this.players, gameFlag);
    //TODO send message to all players containing updated players
  }
  
  exits(uid) {
    debugprint("Player " + uid + " exits game", gameFlag);
  }

  bet(uid, amount) {
    debugprint("Player " + uid + " betting " + amount, gameFlag);
  }

  playCard(uid, cardChoice) {
    debugprint("Player " + uid + " choosing card " + cardChoice, gameFlag);
  }

  resetGame() {
    this.distributePlayingCards();
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
