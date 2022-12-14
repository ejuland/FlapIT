export class Bounds {
    Width = 0;
    Height = 0;
    X = 0;
    Y = 0;
    Rotation = 0;

    boundsIntercept(otherBounds) {
        return (
            otherBounds.X <= this.Width + this.X && otherBounds.X >= this.X && otherBounds.Y <= this.Height + this.Y && otherBounds.Y >= this.Y
            || otherBounds.X + otherBounds.Width <= this.Width + this.X && otherBounds.X + otherBounds.Width >= this.X && otherBounds.Y <= this.Height + this.Y && otherBounds.Y >= this.Y
            || otherBounds.X <= this.Width + this.X && otherBounds.X >= this.X && otherBounds.Y + otherBounds.Height <= this.Height + this.Y && otherBounds.Y + otherBounds.Height >= this.Y
            || otherBounds.X + otherBounds.Width <= this.Width + this.X && otherBounds.X + otherBounds.Width >= this.X && otherBounds.Y + otherBounds.Height <= this.Height + this.Y && otherBounds.Y + otherBounds.Height >= this.Y
        );
    }

    constructor(x, y, w, h) {
        this.Width = w;
        this.Height = h;
        this.X = x;
        this.Y = y;
    }
}

export class GameObject {
    Bounds = null;
    InScreenBounds = true;
    Active = true;
    update() { }
    render(renderer, image_asset) {
        if (image_asset == null) {
            renderer.outlineBounds(this.Bounds);
        } else {
            renderer.drawImage(this.Bounds, image_asset);
        }
    }
    constructor(bounds) {
        this.Bounds = bounds;
    }
}

export class Block extends GameObject {

    type = 0;
    falling = false;
    YVelocity = 1;
    getAssetForType() {
        if (this.type == 0)
            return document.getElementById("teams");
        if (this.type == 1)
            return document.getElementById("outlook");
        if (this.type == 2)
            return document.getElementById("clickup");
    }

    update(ParentBounds, Y) {
        if (!this.falling) {
            this.Bounds.X = ParentBounds.X;
            this.Bounds.Y = Y;
        } else {

        }
    }

    render(renderer) {
        renderer.drawRotatedImage(this.bounds, this.getAssetForType());
    }

    constructor(x, y, size, type = 0) {
        super(new Bounds(x, y, size, size));
        this.type = type;
    }
}

export class Character extends GameObject {
    isAlive = true;
    isFalling = true;
    YVelocity = 0;
    JumpingFrames = 0;
    Score = 0;
    playedThudSound = false;
    playerType = "";

    getCharacterImageAsset() {
        if(this.playerType != "")
            return;
        let info_string = new URLSearchParams(window.location.search);
        let player = 0;
        if (info_string.has("character"))
            player = info_string.get("character");
        switch (player){
            case "brian":
            case "caleb":
            case "jason":
            case "kire":
            case "todd":
            case "mitch":
            case "sasha":
            case "linda":
            case "lynsey":
                this.playerType = player+"_";
                break;
            default:
                this.playerType = "frame";
                break;
        }
    }

        update(ScreenBounds, AudioPlayer) {
            if (this.isAlive) {
                if (this.JumpingFrames > 0) {
                    this.JumpingFrames--;
                    this.isFalling = false;
                } else {
                    this.isFalling = true;
                }
                this.Bounds.Height = ScreenBounds.Height / 10;
                this.Bounds.Width = this.Bounds.Height;
                // this.Bounds.X += 1.7;
            } else {
                this.Bounds.Y += this.YVelocity;
                this.Bounds.X - 3;
                this.YVelocity += 3.8;
                this.Bounds.Rotation += 1;
                if (!this.playedThudSound) {
                    this.playedThudSound = true;
                    AudioPlayer.playSoundFile("./impact2.wav", 2);
                }
            }

            if (this.Bounds.Y >= ScreenBounds.Height+this.Bounds.Height-2 && this.isAlive && this.Score < 1) {
                this.Bounds.Y = ScreenBounds.Height;
                return;
            }else if(this.Score > 1 && this.Bounds.Y >= ScreenBounds.Height+this.Bounds.Height-2)
                {
                    this.isAlive = false;
                    return;
                }
            if (this.isFalling) {
                if (this.YVelocity < 15)
                    this.YVelocity += .5;
                this.Bounds.Y += this.YVelocity;
                if (this.Bounds.Rotation < 180)
                    this.Bounds.Rotation += 1.5;
            } else if (this.Bounds.Y > 0) {
                if (this.YVelocity > -7)
                    this.YVelocity -= 1;
                this.Bounds.Y += this.YVelocity;
                if (this.Bounds.Rotation > 0)
                    this.Bounds.Rotation -= 5;
            }

        }

        currentFrame = 1;
        animationDirection = 1;
        render(renderer) {
            renderer.outlineBounds(this.Bounds);
            let ponyBounds = new Bounds(this.Bounds.X - this.Bounds.Width / 2, this.Bounds.Y - this.Bounds.Height / 2, this.Bounds.Width * 2, this.Bounds.Height * 2);
            ponyBounds.Rotation = this.Bounds.Rotation;
            this.getCharacterImageAsset();
            renderer.drawRotatedImage(ponyBounds, document.getElementById(this.playerType + this.currentFrame));
            this.currentFrame += this.animationDirection;
            if (this.currentFrame > 3) {
                this.animationDirection = -1;
                this.currentFrame = 3;
            }
            else if (this.currentFrame < 1) {
                this.animationDirection = 1;
                this.currentFrame = 1;
            }

        }

        constructor(x, y, size) {
            super(new Bounds(x, y, size, size));
        }
    }

export class Pipe extends GameObject {
    Segments = 10;
    HoleSlot = 0;
    blocks = [];
    blockCount = 0;
    slotSize = 0;
    offScreenLeft = false;
    collidedWithPlayer = false;
    awardedToPlayer = false;



    update(ScreenBounds, Character, AudioPlayer, speed = 3.5) {
        if (this.offScreenLeft) {
            return;
        }
        if (this.Bounds.X < -this.Bounds.Width) {
            this.offScreenLeft = true;
            return;
        }

        if (Character.isAlive)
            this.Bounds.X -= speed;
        let blockIndex = 0;

        for (let row = 0; row < 10; row++) {
            if (blockIndex < this.blocks.length && (row < this.HoleSlot || row > this.HoleSlot + (this.slotSize - 1))) {
                let block = this.blocks[blockIndex];
                if (!block.falling) {
                    block.Bounds.X = this.Bounds.X;
                    block.Bounds.Y = row * (ScreenBounds.Height / 10);
                    block.Bounds.Height = ScreenBounds.Height / 10;
                    block.Bounds.Width = block.Bounds.Height;
                    if (block.Bounds.boundsIntercept(Character.Bounds)) {
                        block.falling = true;
                        Character.isAlive = false;
                        if (!this.collidedWithPlayer)
                            AudioPlayer.playSoundFile("./crash.mp3", .5);
                        this.collidedWithPlayer = true;

                    }
                } else {
                    if (block.Bounds.Y < ScreenBounds.Height + block.Bounds.Height) {
                        block.Bounds.Y += block.YVelocity;
                        block.YVelocity += 1.8;
                        block.Bounds.Rotation += 10;
                    }
                }
                blockIndex++;

            }
        }

        if (this.Bounds.X + this.Bounds.Width < Character.Bounds.X && !this.awardedToPlayer && !this.collidedWithPlayer && Character.isAlive) {
            this.awardedToPlayer = true;
            Character.Score++;
            if (Character.Score % 5 == 0 || Character.Score % 13 == 0)
                AudioPlayer.playSoundFile(`./score${Character.Score % 2}.mp3`);
            else
                AudioPlayer.playSoundFile(`./point.mp3`);
            console.log(`./score${Character.Score % 2}.mp3`);
            // if(this.scoreSoundIndex >= 2)
            //     this.scoreSoundIndex = 0;
            // window.alert(Character.Score)
        }
    }
    scoreSoundIndex = 0;

    render(renderer, score) {
        let scored_block = false;
        this.blocks.forEach((block, blockIndex) => {
            renderer.drawRotatedImage(block.Bounds, block.getAssetForType());
            if (block.type == score % 2 && !scored_block) {
                renderer.drawBlockScoreBubble(block.Bounds, score);
                scored_block = true;
            }
        });
    }

    constructor(hole_slot, segments, ScreenBounds, xOffset = 0) {
        super(new Bounds(xOffset, 0, ScreenBounds.Height / 10, ScreenBounds.Height));
        this.HoleSlot = hole_slot;
        this.Segments = segments;
        this.blockCount = segments;
        this.slotSize = 10 - this.blockCount;
        for (let blocks = 0; blocks < this.blockCount; blocks++) {
            this.blocks.push(new Block(this.Bounds.X, blocks * 90, 0, Math.floor(Math.random() * 3)));
        }
    }

}