import { AudioAssetPlayer } from "./AudioPlayer.js";
import Renderer from "./render.js";
import { Bounds, Block, Pipe, Character } from "./GameObject.js";

const TARGET_FPS = 60;

const LEVEL_SETTINGS = {
    Easy: {
        block_space: 4,
        opening_gap: 6,
        pipe_speed: 3
    },
    Normal: {
        block_space: 4,
        opening_gap: 5,
        pipe_speed: 4
    },
    Hard: {
        block_space: 4,
        opening_gap: 4,
        pipe_speed: 5
    },
    Harder: {
        block_space: 4,
        opening_gap: 3,
        pipe_speed: 6
    },
    Hardest: {
        block_space: 4,
        opening_gap: 3,
        pipe_speed: 8
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
    gameEnded = false;
    update() {
        this.resize();
        this.ScreenBounds = new Bounds(0, 0, this.WIDTH, this.HEIGHT)
        this.setSpacingAndGap();
        this.character.update(this.ScreenBounds, this.audioPlayer);
        this.pipes.forEach(pipe => {
            pipe.update(this.ScreenBounds, this.character, this.audioPlayer, this.pipeSpeed);
            if (pipe.offScreenLeft) {
                let lastPipeBounds = this.pipes[this.pipes.length - 1].Bounds;
                this.createPipe((lastPipeBounds.X + this.blockSize) + (this.blockSize * this.blockSpacing));
            }
        });
        this.removeUsedPipes();
        if (!this.character.isAlive && !this.gameEnded) {
            this.endGame();
        }
    }

    endGame() {
        this.gameEnded = true;
        console.log(this.bg_music);
        this.bg_music.stop();
        this.audioPlayer.playSoundFile("./needle_fast.mp3", 1, (src) => {
            src.onended = (() => {
                this.audioPlayer.playSoundFile("./crash.mp3", 1, (crash_src) => {
                    this.audioPlayer.playSoundFile("./horse_dead.mp3", .5);
                    this.audioPlayer.playSoundFile("./crying.mp3", .5);
                    crash_src.onended = () => {
                        crash_src.context.suspend();
                        let info_string = new URLSearchParams(window.location.search);
                        let attempts = 0;
                        if (info_string.has("attempt"))
                            attempts = parseInt(info_string.get("attempt"));
                        if (isNaN(attempts))
                            attempts = 0;
                        attempts++;
                        let usedQR = false;
                        if (info_string.has("QR"))
                            usedQR = info_string.get("QR") === 'true';
                        console.log(usedQR ? "Used QR CODE" : "DIDNT USE QR CODE", info_string.get("QR"));
                        if(usedQR)
                            document.getElementById('QR').classList.remove("hidden");
                        let newHtml = document.getElementById("try_again").innerHTML.replace("{ATTEMPTS}", attempts + "&character=" + this.character.playerType.replace("_", ""));
                        newHtml = newHtml.replace("{SCORE}", this.character.Score);
                        document.getElementById("try_again").innerHTML = newHtml;
                        document.getElementById("try_again").classList.remove("hidden");
                        console.log("the_end");
                        window.clearInterval(this.GameLoopInterval);
                    };
                })
            });
        });
    }

    render() {
        this.renderer.drawImage(this.ScreenBounds, document.getElementById("bg"));
        this.character.render(this.renderer);
        this.pipes.forEach(pipe => pipe.render(this.renderer, this.character.Score));
    }
    level = 0;
    levelGapOffset = 0;
    setSpacingAndGap() {
        switch (this.pipesCreated) {
            case 0:
                this.gapSize = LEVEL_SETTINGS.Easy.opening_gap;
                this.blockSpacing = LEVEL_SETTINGS.Easy.block_space;
                break;
            case 5:
                this.gapSize = LEVEL_SETTINGS.Normal.opening_gap;
                this.blockSpacing = LEVEL_SETTINGS.Normal.block_space;
                break;
            case 20:
                this.gapSize = LEVEL_SETTINGS.Hard.opening_gap;
                this.blockSpacing = LEVEL_SETTINGS.Hard.block_space;
                break;
            case 40:
                this.gapSize = LEVEL_SETTINGS.Harder.opening_gap;
                this.blockSpacing = LEVEL_SETTINGS.Harder.block_space;
                break;
            case 60:
                this.gapSize = LEVEL_SETTINGS.Hardest.opening_gap;
                this.blockSpacing = LEVEL_SETTINGS.Hardest.block_space;
                break;
        }
        switch (this.totalPipesPassed) {
            case 0:
                this.pipeSpeed = LEVEL_SETTINGS.Easy.pipe_speed;
                break;
            case 5:
                this.pipeSpeed = LEVEL_SETTINGS.Normal.pipe_speed;
                break;
            case 20:
                this.pipeSpeed = LEVEL_SETTINGS.Hard.pipe_speed;
                break;
            case 40:
                this.pipeSpeed = LEVEL_SETTINGS.Harder.pipe_speed;
                break;
            case 40:
                this.pipeSpeed = LEVEL_SETTINGS.Hardest.pipe_speed;
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
        let newPosition = position + Math.floor(Math.random() * this.gapSize * 2) - this.gapSize;

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

    bg_music = null;
    handleInput() {
        if (!this.started) {
            this.started = true;
            this.GameLoopInterval = setInterval(this.gameLoop.bind(this), (1000 / TARGET_FPS));
            this.audioPlayer = new AudioAssetPlayer();
            let info_string = new URLSearchParams(window.location.search);
            let attempts = 0;
            if (info_string.has("attempt"))
                attempts = parseInt(info_string.get("attempt"));
            if (isNaN(attempts))
                attempts = 0;
            if (attempts == 1) {
                this.audioPlayer.playSoundFile("./bg_special_2.mp3", 1, (function (src) {
                    console.log(src);
                    this.bg_music = src;
                }).bind(this));
            } else if (attempts == 0) {
                this.audioPlayer.playSoundFile("./bg_special_4.mp3", 2, (function (src) {
                    console.log(src);
                    this.bg_music = src;
                }).bind(this));
            }
            else if (attempts % 2 == 0) {
                this.audioPlayer.playSoundFile("./bg_special_" + (Math.ceil(Math.random() * 4)) + ".mp3", 1, (function (src) {
                    console.log(src);
                    this.bg_music = src;
                }).bind(this));
            } else {
                this.audioPlayer.playSoundFile("./bg_music_" + (Math.ceil(Math.random() * 3)) + ".mp3", 1, (function (src) {
                    console.log(src);
                    this.bg_music = src;
                }).bind(this));
            }
            document.getElementById("start").classList.add("hidden");
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
        this.CTX.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.renderer = new Renderer(this.CTX);
        this.resize();
        this.ScreenBounds = new Bounds(0, 0, this.WIDTH, this.HEIGHT)
        this.blockSize = (this.ScreenBounds.Height / 10);
        this.character = new Character(!this.isMobile ? this.ScreenBounds.Width / 2 : this.blockSize, Math.floor(Math.random() * 300), this.blockSize);
        this.character.getCharacterImageAsset();
        document.getElementById("display").style.backgroundImage = `URL(./character_frame_${this.character.playerType}1.png)`;
        this.setSpacingAndGap();
        let startingOffset = (((this.ScreenBounds.Width - this.blockSize) + (this.isMobile ? 500 : 1000)));
        console.log("Starting Offset:" + startingOffset);
        console.log("Device Width:" + this.WIDTH);
        console.log("Pixel Ratiot:" + window.devicePixelRatio);
        console.log("Block Size:" + this.BLOCK_SIZE);
        console.log("Is Mobile:" + this.isMobile);
        for (let pipes = 0; pipes < 5; pipes++)
            this.createPipe(startingOffset + (pipes * this.blockSize * this.blockSpacing));
        window.addEventListener("keyup", this.handleInput.bind(this), false);
        window.addEventListener("mousedown", this.handleInput.bind(this), false);
        window.addEventListener("touchend", this.handleInput.bind(this), false);
        window.addEventListener("click", this.handleInput.bind(this), false);
    }
}