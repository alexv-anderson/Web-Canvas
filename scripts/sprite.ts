
/**
 * Options which modify how a sprite in a sprite sheet behaves
 */
interface SpriteSheetSpriteOptions extends SpriteOptions {
    key: string
}

/**
 * Represets a sprite sheet
 */
class SpriteSheet {
    /**
     * Initiallizes all of the sprites in the sprite sheet
     * @param image The image element which contains the sprite sheet
     * @param sheetConfig A list with an entry for each sprite in the sprite sheet
     */
    constructor(image: HTMLImageElement, sheetConfig: Array<SpriteSheetSpriteOptions>) {
        sheetConfig.forEach(ssso => this.sprites[ssso.key] = new Sprite(image, ssso));
    }

    /**
     * Retrieves a sprite using its unique key
     * @param key The key which uniquely identifies the sprite in this sprite sheet
     */
    public getSprite(key: string): Sprite {
        return this.sprites[key];
    }

    private sprites: {[key: string]: Sprite}
}

/**
 * Options which modify how a sprite behaves
 */
interface SpriteOptions {
    numberOfFrames?: number,
    isHorizontal?: boolean,
    framesPerSecond?: number,
    imageBaseX?: number,
    imageBaseY?: number
}

/**
 * Represents a single sprite which may be composed of one or more frames.
 */
export class Sprite {
    /**
     * Initializes the sprite.
     * 
     * @param image The image which holds the sprite
     */
    constructor(image: HTMLImageElement)
    /**
     * Initializes the sprite.
     * 
     * A sprite is a image file which contains a single column or row of one or more frames.
     * 
     * @param image The image which holds the sprite
     * @param options Options which change how the sprite behaves
     */
    constructor(
        image: HTMLImageElement,
        options: SpriteOptions
    )
    /**
     * Initializes the sprite.
     * 
     * A sprite is a image file which contains a single column or row of one or more frames.
     * 
     * @param image The image which holds the sprite
     * @param options Options which change how the sprite behaves
     */
    constructor(
        image: HTMLImageElement,
        options?: SpriteOptions
    ) {
        this.frameIndex = 0;

        this.numberOfFrames = 1;
        this.horizontal = true;
        this.imageBaseX = 0;
        this.imageBaseY = 0;

        if(options !== undefined) {
            this.numberOfFrames = options.numberOfFrames || this.numberOfFrames;
            this.framesPerSecond = options.framesPerSecond;
            this.horizontal = options.isHorizontal !== undefined ? options.isHorizontal : this.horizontal;
            this.imageBaseX = options.imageBaseX || this.imageBaseX;
            this.imageBaseY = options.imageBaseY || this.imageBaseY;
        }

        this.lastUpdateTime = 0;
        this.lastFrameChangeTime = 0;

        this.image = image;
    }

    /**
     * Draws the current frame of the sprite on the canvas at the given coordinates.
     * 
     * @param context The canvas' 2D rendering context
     * @param x The x-coordinate of the sprite's frame on the canvas
     * @param y The y-coordinate of the sprite's frame on the canvas
     */
    public render(context: CanvasRenderingContext2D, x: number, y: number): void {
        let srcX = this.imageBaseX;
        let srcY = this.imageBaseY;

        // Toggle controls whether frames progress to the right or left
        if(this.horizontal) {
            srcX = this.frameIndex * this.frameWidth;
        } else {
            srcY = this.frameIndex * this.frameHeight;
        }

        context.drawImage(
            this.image,
            srcX,
            srcY,
            this.frameWidth,
            this.frameHeight,
            x,
            y,
            this.frameWidth,
            this.frameHeight
        );
    }

    /**
     * Updates the frame which is shown for the sprite.
     * @param dt Number of milliseconds which have passed since the last time this method was called
     */
    public update(dt: number): void {
        if(this.framesPerSecond) {
            let msPerFrame = 1000 / this.framesPerSecond;

            this.lastUpdateTime += dt;

            if(this.lastUpdateTime - this.lastFrameChangeTime > msPerFrame) {
                this.frameIndex = (this.frameIndex + 1) % this.numberOfFrames;
                this.lastFrameChangeTime = this.lastUpdateTime;
            }
        }
    }

    /**
     * The width of the sprite's frame
     */
    public get frameWidth(): number {
        if(this.horizontal) {
            return this.image.width / this.numberOfFrames;
        } else {
            return this.image.width;
        }
    }
    /**
     * The height of the sprite's frame
     */
    public get frameHeight(): number {
        if(this.horizontal) {
            return this.image.height;
        } else {
            return this.image.height / this.numberOfFrames;
        }
    }

    private image: HTMLImageElement;

    private imageBaseX: number;
    private imageBaseY: number;

    private numberOfFrames: number;
    private lastUpdateTime: number;
    private lastFrameChangeTime: number;
    private framesPerSecond?: number;
    private frameIndex: number;

    private horizontal: boolean;
}
