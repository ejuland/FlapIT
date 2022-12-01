import { AudioAssetPlayer } from "./AudioPlayer.js";
import Renderer from "./render.js";
import { Bounds, Block, Pipe, Character } from "./GameObject.js";

const TARGET_FPS = 60;

const LEVEL_SETTINGS = {
    Normal:{
        spacing: 4,
        gap: 3,
        threshold:10
    },
    Difficult:{
        spacing: 3,
        gap: 3,
        threshold: 3
    },
    Hard:{
        spacing: 2,
        gap: 4,
        threshold: 30
    },
    Extreme:{
        spacing: 2,
        gap: 3,
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
        this.character.update(this.ScreenBounds, this.audioPlayer);
        this.pipes.forEach(pipe => pipe.update(this.ScreenBounds, this.character, this.audioPlayer));
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

    lastPosition = 3;

    getNewPosition(position){
        let newPosition = position + Math.floor(Math.random() * 4)-2;

        if(newPosition == this.lastPosition)
            return this.getNewPosition(position);
        if(newPosition < 0 || newPosition+this.gapSize > 10)
            return this.getNewPosition(position);
        
        return newPosition;
    }

    createPipe(xOffset){
        this.lastPosition = this.getNewPosition(this.lastPosition);
        this.pipes.push(new Pipe(this.lastPosition, 10-this.gapSize, this.ScreenBounds, xOffset));
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
        this.audioPlayer.playSoundFile("https://dkihjuum4jcjr.cloudfront.net/ES_ITUNES/Whip%20Whoosh%202/ES_Whip%20Whoosh%202.mp3");
        this.character.isFalling = false;
        this.character.JumpingFrames = 15;
        this.character.YVelocity = 0;

    }

    blockSize = 0;
    blockSpacing = 4;
    gapSize = 0;
    audioPlayer = null;
    constructor(screen) {


        this.SCREEN = screen;
        this.CTX = this.SCREEN.getContext("2d");
        this.renderer = new Renderer(this.CTX);
        this.resize();
        this.ScreenBounds = new Bounds(0, 0, this.WIDTH, this.HEIGHT)
        this.blockSize =(this.ScreenBounds.Height / 10);
        this.character = new Character(this.ScreenBounds.Width/2, Math.floor(Math.random() * 300), this.blockSize);
        this.setSpacingAndGap();
        for(let pipes = 0; pipes < 20; pipes++)
            this.createPipe((this.ScreenBounds.Width - this.blockSize) +pipes*this.blockSize*this.blockSpacing);
        this.audioPlayer = new AudioAssetPlayer();
        window.addEventListener("keyup", this.handleInput.bind(this));
        window.addEventListener("mousedown", this.handleInput.bind(this));
        window.addEventListener("touchend", this.handleInput.bind(this));
    }
}