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
  console.log(arrs);
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
      }

    } else if (playerStates.get(identifier) === "inqueuewithname") {

      console.log("This is not my beautiful wife")

    } else if (playerStates.get(identifier) === "ingame") {

      if (gameSeats.get("Player"+(whoToPlay+1)) === identifier && isGameFull()) {
        console.log(playerNames.get(identifier) + " plays the card at index " + message.data + " of their hand.");

        //update game state
        const cartejouee = playerCards.get("Player"+(whoToPlay+1)).splice(parseInt(message.data),1)[0];
        //verify that played card is ok
        let validation = lastRoundPlayedCards.length === 0
                      || lastRoundPlayedCards[0].charAt(0) === cartejouee.charAt(0)
                      || testNoSuit(playerCards.get("Player"+(whoToPlay+1)), lastRoundPlayedCards[0].charAt(0));
        if (validation) {
          lastRoundPlayedCards.push(cartejouee);

          //verify if four cards have been played

          //send updated game state to all players
          sockets.forEach((ws, uid) => {
            //console.log("Sending to " + playerNames.get(uid));
            var AAAAA = null;
            gameSeats.forEach((id, playernumber) => {
              if (id === uid) {
                AAAAA = playernumber;
              }
            });
            ws.send(JSON.stringify({
              player1cards: playerCards.get("Player1").length,
              player2cards: playerCards.get("Player2").length,
              player3cards: playerCards.get("Player3").length,
              player4cards: playerCards.get("Player4").length,
              currentplayercards: playerCards.get(AAAAA),
              thisroundplayedcards: thisRoundPlayedCards,
              lastroundplayedcards: lastRoundPlayedCards,
            }));
          });

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
