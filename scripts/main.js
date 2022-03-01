/*TODO client side game logic*/
const gamesection = document.getElementById("gamesection");

let isButton = x => x.target.nodeName === "BUTTON";

gamesection.addEventListener("click", (event) => {
  console.log("something got clicked");
  if (!isButton(event)) return;
  console.log("Button clicked!");
  event.target.blur();
})
