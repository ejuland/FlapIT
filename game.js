import { AudioAssetPlayer } from "./AudioPlayer.js";
import Renderer from "./render.js";
import { Bounds, Block, Pipe, Character } from "./GameObject.js";

const TARGET_FPS = 60;

const LEVEL_SETTINGS = {
    Normal:{
        spacing: 6,
        gap: 5,
        threshold:5
    },
    Difficult:{
        spacing: 5,
        gap: 4,
        threshold: 10
    },
    Hard:{
        spacing: 4,
        gap: 3,
        threshold: 25
    },
    Extreme:{
        spacing: 4,
        gap: 4,
    }
}

export default class Game {
    SCREEN;
    CTX;
    WIDTH = 0;
    HEIGHT = 0;
    BLOCK_SIZE = 50;
    OFFSET = 0;
    resize() {
        this.HEIGHT = document.innerHeight ||
            document.documentElement.clientHeight ||
            document.body.clientHeight;
        this.WIDTH = window.innerWidth ||
            document.documentElement.clientWidth ||
            document.body.clientWidth;

        let newHeight = this.WIDTH

        this.SCREEN.setAttribute("width", window.innerWidth);
        this.SCREEN.setAttribute("height", window.innerHeight);

    }

    GameLoopInterval = null;
    pipes = [];
    renderer = null;
    ScreenBounds = null;
    character = null;
    inputLock = false;
    started = false;
    totalPipesPassed = 0;
    update() {
        this.resize();
        this.ScreenBounds = new Bounds(0, 0, this.WIDTH, this.HEIGHT)
        this.character.update(this.ScreenBounds);
        this.pipes.forEach(pipe => pipe.update(this.ScreenBounds, this.character));
        let removed = this.removeUsedPipes();
        this.setSpacingAndGap();
        for(let pipe = 0; pipe < removed; pipe++)
            this.createPipe(this.pipes[this.pipes.length-1].Bounds.X+this.blockSize*this.blockSpacing)
    }

    render() {
        this.renderer.drawImage(this.ScreenBounds, document.getElementById("bg"));
        this.character.render(this.renderer);
        this.pipes.forEach(pipe => pipe.render(this.renderer));
    }

    setSpacingAndGap(){
        if(this.totalPipesPassed < LEVEL_SETTINGS.Normal.threshold){
            this.gapSize = LEVEL_SETTINGS.Normal.gap;
            this.blockSpacing = LEVEL_SETTINGS.Normal.spacing;
        }
        else if(this.totalPipesPassed > LEVEL_SETTINGS.Normal.threshold && this.totalPipesPassed < LEVEL_SETTINGS.Difficult.threshold){
            this.gapSize = LEVEL_SETTINGS.Difficult.gap;
            this.blockSpacing = LEVEL_SETTINGS.Difficult.spacing;
        }
        else if(this.totalPipesPassed > LEVEL_SETTINGS.Difficult.threshold && this.totalPipesPassed < LEVEL_SETTINGS.Hard.threshold){
            this.gapSize = LEVEL_SETTINGS.Hard.gap;
            this.blockSpacing = LEVEL_SETTINGS.Hard.spacing;
        }else{
            this.gapSize = LEVEL_SETTINGS.Extreme.gap;
            this.blockSpacing = LEVEL_SETTINGS.Extreme.spacing;
        }
    }

    gameOver = true;

    gameLoop() {
        this.update();
        this.render();
    }

    createPipe(xOffset){
        this.pipes.push(new Pipe(Math.floor(Math.random() * 10), 10-this.gapSize, this.ScreenBounds, xOffset));
    }

    removeUsedPipes(){
        let startingPipes = this.pipes.length;
        this.pipes = this.pipes.filter(pipe=>!pipe.offScreenLeft);
        let missingPipes = startingPipes - this.pipes.length;
        this.totalPipesPassed += missingPipes;
        return missingPipes;
    }

    handleInput() {
        if (!this.started) {
            this.started = true;
            this.GameLoopInterval = setInterval(this.gameLoop.bind(this), (1000 / TARGET_FPS));
        }
        if (this.character.JumpingFrames > 0)
            return;
        this.character.isFalling = false;
        this.character.JumpingFrames = 11;
        this.character.YVelocity = 0;
        console.log("Wasup")

    }

    blockSize = 0;
    blockSpacing = 4;
    gapSize = 0;
    constructor(screen) {


        this.SCREEN = screen;
        this.CTX = this.SCREEN.getContext("2d");
        this.renderer = new Renderer(this.CTX);
        this.resize();
        this.ScreenBounds = new Bounds(0, 0, this.WIDTH, this.HEIGHT)
        this.blockSize =(this.ScreenBounds.Height / 10);
        this.character = new Character(this.ScreenBounds.Width/2, Math.floor(Math.random() * 300), this.blockSize);
        this.setSpacingAndGap();
        for(let pipes = 0; pipes < 5; pipes++)
            this.createPipe((this.ScreenBounds.Width - this.blockSize) +pipes*this.blockSize*this.blockSpacing);
        window.addEventListener("keyup", this.handleInput.bind(this));
        window.addEventListener("mousedown", this.handleInput.bind(this));
    }
}