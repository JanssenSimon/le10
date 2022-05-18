export var messageHasName = (message) => {
  console.log("Validating if message has name");
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("name") && (typeof message.name === 'string' || message.name instanceof String);
  } catch (e) {
    return false;
  }
}

export var recordName = (name) => {}   //modifies state of games, must be overloaded

export var nameSelectionErrorFunction = () => {
  console.log("ERROR : Expected a name, received something else;");
}

export var messageHasGameChoice = (message) => {
  console.log("Validating if message has game choice");
  try {
    message = JSON.parse(message);
    if (message.hasOwnProperty("gamechoice"))
      return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(message); // thanks, Ωmega from SO
    return false;
  } catch (e) {
    return false;
  }
}

export var joinGame = (game) => {}     //modifies state of games, must be overloaded

export var gameSelectionErrorFunction = () => {
  console.log("ERROR : Expected a name or game choice, received something else;");
}

export var messageHasBet = (message) => {
  console.log("Validating if message has bet");
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("bet") &&
           Number.isFinite(message.bet) &&
           message.bet >= 50 &&
           message.bet <= 100 &&
           (message.bet % 5 === 0);
  } catch (e) {
    return false;
  }
}

export var bet = (amount) => {}        //modifies state of games, must be overloaded

export var messageHasCardChoice = (message) => {
  console.log("Validating if message has card choice");
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("cardchoice") &&
           Number.isFinite(message.cardchoice) &&
           message.cardchoice >= 0 &&
           message.cardchoice < 10;
  } catch (e) {
    return false;
  }
}

export var playCard = (card) => {}     //modifies state of games, must be overloaded

export var messageHasExitGame = (message) => {
  console.log("Validating if message has exit game");
  try {
    message = JSON.parse(message);
    return message.hasOwnProperty("command") && message.command === "EXIT";
  } catch (e) {
    return false;
  }
}

export var exitGame = () => {}         //modifies state of games, must be overloaded

export var inGameErrorFunction = () => {
  console.log("ERROR : Expected a bet, a card choice, or an exit request, received something else;");
}

export var STATES = new Map([
  ["NameSelection", {
    name: "NameSelection",
    methods: [
      {
        validator: messageHasName,
        method: recordName,
        nextState: "GameSelection"
      }
    ],
    error: nameSelectionErrorFunction
  }],
  ["GameSelection", {
    name: "GameSelection",
    methods: [
      {
        validator: messageHasName,
        method: recordName,
        nextState: "GameSelection"    // No change in state
      },
      {
        validator: messageHasGameChoice,
        method: joinGame,
        nextState: "InGame"
      }
    ],
    error: gameSelectionErrorFunction
  }],
  ["InGame", {
    name: "InGame",
    methods: [
      {
        validator: messageHasBet,
        method: bet,
        nextState: "InGame"
      },
      {
        validator: messageHasCardChoice,
        method: playCard,
        nextState: "InGame"
      },
      {
        validator: messageHasExitGame,
        method: exitGame,
        nextState: "GameSelection"
      }
    ],
    error: inGameErrorFunction
  }]
]);
