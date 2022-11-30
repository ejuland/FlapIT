export default class Renderer{
    CTX = null;

    outlineBounds(bounds){
        this.CTX.beginPath();
        this.CTX.rect(bounds.X, bounds.Y, bounds.Width, bounds.Height);
        this.CTX.stroke();
    }

    rotation = 0;
    drawImage(bounds, asset){
        this.CTX.drawImage(asset,bounds.X, bounds.Y, bounds.Width, bounds.Height);
    }

    drawRotatedImage(bounds, asset){
        // save the unrotated context of the canvas so we can restore it later
        // the alternative is to untranslate & unrotate after drawing
        this.CTX.save();
    
        // move to the center of the canvas
        this.CTX.translate(bounds.X+bounds.Width/2, bounds.Y+bounds.Height/2);
    
        // rotate the canvas to the specified degrees
        this.CTX.rotate((bounds.Rotation) *Math.PI/180);
    
        // draw the image
        // since the context is rotated, the image will be rotated also
        this.CTX.drawImage(asset,-bounds.Width/2,-bounds.Width/2);
    
        // we’re done with the rotating so restore the unrotated context
        this.CTX.restore();
    }

    constructor(ctx){
        this.CTX = ctx;
    }

}