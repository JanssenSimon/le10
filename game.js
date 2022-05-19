// ----------------------------------------------------------------------------
// Game rules
// ----------------------------------------------------------------------------

export class Game {
  constructor() {
  }

  addPlayer(uid) {
    console.log("Adding player " + uid);
  }
  
  bet(uid, amount) {
    console.log("Player " + uid + " betting " + amount);
  }

  playCard(uid, cardChoice) {
    console.log("Player " + uid + " choosing card " + cardChoice);
  }

  exits(uid) {
    console.log("Player " + uid + " exits game");
  }
}
