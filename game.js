import { AudioAssetPlayer } from "./AudioPlayer.js";
import Renderer from "./render.js";
import { Bounds, Block, Pipe, Character } from "./GameObject.js";

const TARGET_FPS = 60;

const LEVEL_SETTINGS = {
    Easy:{
        block_space: 4,
        opening_gap: 4,
        pipe_speed: 3
    },
    Normal:{
        block_space: 4,
        opening_gap: 4,
        pipe_speed: 4
    },
    Hard:{
        block_space: 4,
        opening_gap: 4,
        pipe_speed: 5
    },
    Harder:{
        block_space: 4,
        opening_gap: 3,
        pipe_speed: 6
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
        if (this.WIDTH / window.devicePixelRatio < 500)
            this.isMobile = true;
        console.log(this.isMobile);
        this.SCREEN.setAttribute("width", window.innerWidth);
        this.SCREEN.setAttribute("height", window.innerHeight);

    }
    isMobile = false;
    GameLoopInterval = null;
    pipes = [];
    renderer = null;
    ScreenBounds = null;
    character = null;
    inputLock = false;
    started = false;
    totalPipesPassed = 0;
    pipeSpeed = 3.5;
    update() {
        this.resize();
        this.ScreenBounds = new Bounds(0, 0, this.WIDTH, this.HEIGHT)
        this.setSpacingAndGap();
        this.character.update(this.ScreenBounds, this.audioPlayer);
        this.pipes.forEach(pipe =>{
             pipe.update(this.ScreenBounds, this.character, this.audioPlayer, this.pipeSpeed);
             if(pipe.offScreenLeft){
                let lastPipeBounds = this.pipes[this.pipes.length-1].Bounds;
                this.createPipe((lastPipeBounds.X+this.blockSize)+(this.blockSize*this.blockSpacing));
             }
        });
        this.removeUsedPipes();
    }

    render() {
        this.renderer.drawImage(this.ScreenBounds, document.getElementById("bg"));
        this.character.render(this.renderer);
        this.pipes.forEach(pipe => pipe.render(this.renderer, this.character.Score));
    }
    level = 0;
    levelGapOffset = 0;
    setSpacingAndGap() {
        switch(this.pipesCreated){
            case 0:
                this.gapSize = LEVEL_SETTINGS.Easy.opening_gap;
                this.blockSpacing = LEVEL_SETTINGS.Easy.block_space;
            break;
            case 5:
                this.gapSize = LEVEL_SETTINGS.Normal.opening_gap;
                this.blockSpacing = LEVEL_SETTINGS.Normal.block_space;
            break;
            case 15:
                this.gapSize = LEVEL_SETTINGS.Hard.opening_gap;
                this.blockSpacing = LEVEL_SETTINGS.Hard.block_space;
            break;
            case 30:
                this.gapSize = LEVEL_SETTINGS.Harder.opening_gap;
                this.blockSpacing = LEVEL_SETTINGS.Harder.block_space;
            break;
        }
        switch(this.totalPipesPassed){
            case 0:
                this.pipeSpeed = LEVEL_SETTINGS.Easy.pipe_speed;
            break;
            case 5:
                this.pipeSpeed = LEVEL_SETTINGS.Normal.pipe_speed;
            break;
            case 15:
                this.pipeSpeed = LEVEL_SETTINGS.Hard.pipe_speed;
            break;
            case 30:
                this.pipeSpeed = LEVEL_SETTINGS.Harder.pipe_speed;
            break;
        }
    }

    gameOver = true;

    gameLoop() {
        this.update();
        this.render();
    }

    lastPosition = 3;

    getNewPosition(position) {
        let newPosition = position + Math.floor(Math.random() * this.gapSize*2)-this.gapSize;

        if (newPosition < 0 || newPosition + this.gapSize > 10)
            return this.getNewPosition(position);

        return newPosition;
    }

    pipesCreated = 0;
    createPipe(xOffset) {
        this.lastPosition = this.getNewPosition(this.lastPosition);
        this.pipes.push(new Pipe(this.lastPosition, 10 - this.gapSize, this.ScreenBounds, xOffset));
        this.pipesCreated++;
    }

    removeUsedPipes() {
        let startingPipes = this.pipes.length;
        this.pipes = this.pipes.filter(pipe => !pipe.offScreenLeft);
        let missingPipes = startingPipes - this.pipes.length;
        this.totalPipesPassed += missingPipes;
        return missingPipes;
    }

    handleInput() {
        if (!this.started) {
            this.started = true;
            this.GameLoopInterval = setInterval(this.gameLoop.bind(this), (1000 / TARGET_FPS));
            this.audioPlayer = new AudioAssetPlayer();
            this.audioPlayer.playSoundFile("https://dkihjuum4jcjr.cloudfront.net/ES_ITUNES/Whip%20Whoosh%202/ES_Whip%20Whoosh%202.mp3");

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
        if (this.isMobile)
            this.CTX.scale(window.devicePixelRatio,window.devicePixelRatio);
        this.renderer = new Renderer(this.CTX);
        this.resize();
        this.ScreenBounds = new Bounds(0, 0, this.WIDTH, this.HEIGHT)
        this.blockSize = (this.ScreenBounds.Height / 10);
        this.character = new Character(!this.isMobile ? this.ScreenBounds.Width / 2 : this.blockSize, Math.floor(Math.random() * 300), this.blockSize);
        this.setSpacingAndGap();
        for (let pipes = 0; pipes < 5; pipes++)
            this.createPipe((((this.ScreenBounds.Width - this.blockSize) + this.isMobile ? 500 : 1000)) + pipes * this.blockSize * this.blockSpacing);
        window.addEventListener("keyup", this.handleInput.bind(this), false);
        window.addEventListener("mousedown", this.handleInput.bind(this), false);
        this.SCREEN.addEventListener("touchend", this.handleInput.bind(this), false);
        this.SCREEN.addEventListener("click", this.handleInput.bind(this), false);
    }
}