import { debugprint } from "./debug.js"

const gameFlag = true;

// ----------------------------------------------------------------------------
// Game rules
// ----------------------------------------------------------------------------

export class Game {
  constructor() {
    this.seatedPlayers = new Map();
    this.spectatingPlayers = new Map();
    this.seats = new Map();

    resetGame();
  }

  nextAvailableSeat() {
    if (seats.has("Seat1")) {
      if (seats.has("Seat2")) {
        if (seats.has("Seat3")) {
          if (seats.has("Seat4")) {
            return null;
          } else { return "Seat4"; }
        } else { return "Seat3"; }
      } else { return "Seat2"; }
    } else { return "Seat1"; }
  }

  addPlayer(uid, name) {
    console.log("Adding player " + uid + " to game");
    freeSpot = nextAvailableSeat();
    if (freeSpot) {
      this.seatedPlayers.set(uid, {name: name, seat: freeSpot});
      if (this.seats.has("empty"+freeSpot)) {   //TODO seperate seats from players
        this.seats.set(freeSpot, this.seats.get("empty"+freeSpot));
        this.seats.delete("empty"+freeSpot);
      }
    } else {
      this.spectatingPlayers.set(uid, {name: name});
      // if there are 4 player, additional players will spectate
    }
    //TODO send message to all players containing updated players
  }
  
  exits(uid) {
    console.log("Player " + uid + " exits game");
  }

  bet(uid, amount) {
    console.log("Player " + uid + " betting " + amount);
  }

  playCard(uid, cardChoice) {
    console.log("Player " + uid + " choosing card " + cardChoice);
  }

  resetGame() {
    distributePlayingCards();
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
  }
}
