import { serve } from "https://deno.land/std/http/mod.ts";

//To handle player states
let sockets = new Map();
let playerStates = new Map();   //should maybe make a single map with all data
let playerNames = new Map();

function isValidName(nameProspect) {
  return (typeof nameProspect === 'string' || nameProspect instanceof String);    //TODO input sanitization
}


//To handle game state
let gameSeats = new Map();
function isGameFull() {
  return gameSeats.has("Player1") && gameSeats.has("Player2") && gameSeats.has("Player3") && gameSeats.has("Player4");
}
let playerCards = new Map();
function distributePlayingCards() {  //assigns playing cards randomly to four players
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
  //console.log(arrs);
  playerCards.set("Player1", arrs[0]);
  playerCards.set("Player2", arrs[1]);
  playerCards.set("Player3", arrs[2]);
  playerCards.set("Player4", arrs[3]);
}
distributePlayingCards();
let whoToPlay = 0;
let thisRoundPlayedCards = [];
let lastRoundPlayedCards = [];
function testNoSuit(cardArr, suit) {
  //returns true if array of cards doesn't contain suit
  var noSuit = true;
  cardArr.forEach((card) => {
    if (card.charAt(0) == suit) noSuit = false;
  });
  return noSuit;
}
let atout = null;
function valueToInt(value) {    //converts card value to integer value for comparison
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
function greaterCard(card1, card2, demandee, atout) {   //comparing cards to find win
  switch (card1.charAt(0)) {
    case atout:
      if (card2.charAt(0) === atout) {
        return (valueToInt(card1.substring(1)) < valueToInt(card2.substring(1)) ? card2 : card1);
      } else {
        return card1;
      }
    case demandee:
      if (card2.charAt(0) === atout) {
        return card2;
      } else if (card2.charAt(0) === demandee) {
        return (valueToInt(card1.substring(1)) < valueToInt(card2.substring(1)) ? card2 : card1);
      } else {
        return card1;
      }
    default:
      console.log("ERROR, cannot compare cards");
  }
}
let team1points = 0;            //for tracking team points
let team2points = 0;
function cardToPoints(card) {
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
let startingPlayer = "Player1";



let waitingForEveryoneToSeeCards = false;
function switchCards(winningPlayer) {
  return new Promise (resolve => {
    setTimeout(() => {
      lastRoundPlayedCards = thisRoundPlayedCards;
      thisRoundPlayedCards = [];
      waitingForEveryoneToSeeCards = false;
      startingPlayer = winningPlayer; //TODO consolidate startingPlayer and whoToPlay into a single variable
      sendGameUpdate("gameUpdate");
    }, 3000);               //give 3 seconds for players to acknowledge round
  });
}
async function switchToNextCards(winningPlayer) {    // async caller function
  await switchCards(winningPlayer);
}
function sendGameUpdate(flag) {
  //send updated game state to all players
  sockets.forEach((ws, uid) => {
    //console.log("Sending to " + playerNames.get(uid));
    var AAAAA = null;
    var yourTeamPoints = null;
    var otherTeamPoints = null;
    gameSeats.forEach((id, playernumber) => {
      if (id === uid) {
        AAAAA = playernumber;
      }
    });
    switch (AAAAA) {
      case "Player1":
      case "Player3":
        yourTeamPoints = team1points;
        otherTeamPoints = team2points;
        break;
      case "Player2":
      case "Player4":
        yourTeamPoints = team2points;
        otherTeamPoints = team1points;
        break;
    }
    ws.send(JSON.stringify({
      player1cards: playerCards.get("Player1").length,
      player2cards: playerCards.get("Player2").length,
      player3cards: playerCards.get("Player3").length,
      player4cards: playerCards.get("Player4").length,
      currentplayercards: playerCards.get(AAAAA),
      thisroundplayedcards: thisRoundPlayedCards,
      lastroundplayedcards: lastRoundPlayedCards,
      yourteampoints: yourTeamPoints,
      otherteampoints: otherTeamPoints,
      currentplayer: AAAAA,
      startingplayeroffset: parseInt(startingPlayer.charAt(6))-1
    }));
  });
}

//To handle requests
async function reqHandler(request) {
  if (request.headers.get("upgrade") != "websocket") {
    const { pathname: path } = new URL(request.url);
    //console.log(path);

    if (path === "/") {
      //serve index page
      const index = await Deno.readFile("./index.html");
      return new Response(index, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8"
        }
      });
    } else if (path === "/styles/style.css") {
      const index = await Deno.readFile("./styles/style.css");
      return new Response(index, {
        status: 200,
        headers: {
          "content-type": "text/css"          //TODO make this prettier with macros or smtg
        }
      });
    } else if (path === "/scripts/main.js") {
      const index = await Deno.readFile("./scripts/main.js");
      return new Response(index, {
        status: 200,
        headers: {
          "content-type": "application/javascript"
        }
      });
    } else if (path === "/fonts/JuliaMonoCardSet-Regular.woff2") {
      const index = await Deno.readFile("./fonts/JuliaMonoCardSet-Regular.woff2");
      return new Response(index, {
        status: 200,
        headers: {
          "content-type": "application/x-font-woff2"
        }
      });
    } //TODO what about the favicon?

    //invalid path
    return new Response(null, { status: 404 });
  }

  //upgrade websocket requested
  var websocketDetails = Deno.upgradeWebSocket(request);
  var response = websocketDetails.response;
  var websocket = websocketDetails.socket;

  //add websocket to list of websockets
  const identifier = crypto.randomUUID()
  sockets.set(identifier, websocket);
  //console.log(sockets);
  playerStates.set(identifier, "inqueuewoname");

  //dealing with messages from websocket
  websocket.onclose = () => {
    sockets.delete(identifier);
    playerStates.delete(identifier);
    playerNames.delete(identifier);
    gameSeats.forEach((uid, playernumber) => {
      if (uid === identifier)
        gameSeats.delete(playernumber);
    });
    //TODO tell game room to return to waiting for players
    //Look in queue of named players to fill empty spot
  }

  websocket.onmessage = (message) => {
    if (playerStates.get(identifier) === "inqueuewoname" && isValidName(message.data)) {

      console.log("Associating UID " + identifier + " with name " + message.data + ".");
      playerNames.set(identifier, message.data);
      if (isGameFull()) {
        playerStates.set(identifier, "inqueuewithname");
        console.log(playerNames.get(identifier) + " enters queue to play.")
      } else {
        if (gameSeats.has("Player1")) {
          if (gameSeats.has("Player2")) {
            if (gameSeats.has("Player3")) {
              if (gameSeats.has("Player4")) {
                  //game is actually full
                  playerStates.set(identifier, "inqueuewithname");
                  console.log(playerNames.get(identifier) + " enters queue to play.");
              } else {
                gameSeats.set("Player4", identifier);
                playerStates.set(identifier, "ingame");
                console.log(playerNames.get(identifier) + " enters game as player 4.");
              }
            } else {
              gameSeats.set("Player3", identifier);
              playerStates.set(identifier, "ingame");
              console.log(playerNames.get(identifier) + " enters game as player 3.");
            }
          } else {
            gameSeats.set("Player2", identifier);
            playerStates.set(identifier, "ingame");
            console.log(playerNames.get(identifier) + " enters game as player 2.");
          }
        } else {
          gameSeats.set("Player1", identifier);
          playerStates.set(identifier, "ingame");
          console.log(playerNames.get(identifier) + " enters game as player 1.");
        }
        sendGameUpdate("onConnect");
      }

    } else if (playerStates.get(identifier) === "inqueuewithname") {

      console.log("This is not my beautiful wife")  //TODO something with this and when people disconnect

    } else if (playerStates.get(identifier) === "ingame") {

      if (gameSeats.get("Player"+(whoToPlay+1)) === identifier && isGameFull() && !waitingForEveryoneToSeeCards) {

        console.log(playerNames.get(identifier) + " plays the card at index " + message.data + " of their hand.");

        //update game state
        const cartejouee = playerCards.get("Player"+(whoToPlay+1)).splice(parseInt(message.data),1)[0];
        //verify that played card is ok
        let validation = thisRoundPlayedCards.length === 0
                      || thisRoundPlayedCards[0].charAt(0) === cartejouee.charAt(0)
                      || testNoSuit(playerCards.get("Player"+(whoToPlay+1)), thisRoundPlayedCards[0].charAt(0));
        if (validation) {
          thisRoundPlayedCards.push(cartejouee);

          if (atout == null)
            atout = cartejouee.charAt(0);

          if (thisRoundPlayedCards.length === 4) {
            //End of round, check who wins
            let demandee = thisRoundPlayedCards[0].charAt(0);
            let winningCard = thisRoundPlayedCards.reduce(
              (previousMax, maxCandidate) => greaterCard(previousMax, maxCandidate, demandee, atout)
            );
            whoToPlay = (parseInt(startingPlayer.charAt(6)) - 1 + thisRoundPlayedCards.indexOf(winningCard))%4-1;
              //TODO above sets whoToPlay to person before winner because it will be incremented at end of handling message
              //below it therefore does +2; correct this and make it more concise
            let winningPlayer = "Player"+(whoToPlay+2);
            console.log("Round over! Winning card : " + winningCard);
            console.log("Winning player : " + winningPlayer);
            //Count points
            let pointTotal = thisRoundPlayedCards.reduce(
              (sum, card) => sum + cardToPoints(card), 0
            );
            switch (winningPlayer) {
              case "Player1":
              case "Player3":
                team1points += pointTotal;
                break;
              case "Player2":
              case "Player4":
                team2points += pointTotal;
                break;
              default:
                console.log("ERROR: Points won by player who doesn't exist")
            }
            console.log("Points won this round : " + pointTotal);
            console.log("Team1: " + team1points + " \tTeam2: " + team2points);
            //Move this round's cards to past round after giving enough time for players to see it
            waitingForEveryoneToSeeCards = true;
            switchToNextCards(winningPlayer);  //TODO winning player has to be given as argument because the display of the cards in the right order depends on it, fix it
          }

          //send updated game state to all players
          sendGameUpdate("gameUpdate");

          whoToPlay = ((whoToPlay + 1) % 4);
          console.log("It is now Player"+(whoToPlay+1)+"'s turn to play.");
        } else {
          console.log(playerNames.get(identifier) + " tried to play a card they weren't allowed to.");
          playerCards.get("Player"+(whoToPlay+1)).splice(parseInt(message.data),0,cartejouee);
        }
      } else {
        console.log(playerNames.get(identifier) + " tried to play a card but it was not their turn or the game wasn't full.");
      }

    } else {

      console.log("ERROR");
      console.log(message);

    }
  }

  return response;
}

//Start server
serve(reqHandler, { port: 5000 });
