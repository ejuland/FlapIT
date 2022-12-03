import Game from "./game.js";

const GameScreen = document.getElementById("screen");
Promise.all(Array.from(document.images).filter(img => !img.complete).map(img => new Promise(resolve => { img.onload = img.onerror = resolve; }))).then(() => {
    console.log('images finished loading');
    document.getElementById("loading").innerText = "Tap Anywhere to Begin";
    let GameSession = new Game(GameScreen);
});

