
import { loadJSON, loadPNG } from "./general.js";

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

interface Point {
    x: number,
    y: number
}

/**
 * Represents a single sprite which may be composed of one or more frames.
 */
export class PointSprite extends Sprite {

    /**
     * Draws the current frame of the sprite on the canvas at the given coordinates.
     * 
     * @param context The canvas' 2D rendering context
     * @param center The center point of the sprite's frame on the canvas
     */
    public renderAtCenterPoint(context: CanvasRenderingContext2D, center: Point): void {
        super.render(
            context,
            center.x - (this.frameWidth / 2),
            center.y - (this.frameHeight / 2)
        );
    }
}

export type SpriteConfig = { 
    imageDirectoryPath: string,
    spriteImageInfo: Array<SpriteInitInfo>
}
type SpriteInitInfo = {
    fileName: string,
    mapKey: string,
    width: number,
    height: number,
    numberOfFrames: number,
    isHorizontal?: boolean,
    fps?: number
}

/**
 * Maps keys to a sprite
 */
export class SpriteMap {
    constructor() {
        this.map = new Map<string, PointSprite>();
    }

    public loadSpritesFrom(configURL: string): void {
        loadJSON(configURL, (config: SpriteConfig) => this.appendSprites(config));
    }
    
    private appendSprites(config: SpriteConfig): void {
    
        // For each sprite
        config.spriteImageInfo.forEach((sii) => {
            // Load the image file
            loadPNG(config.imageDirectoryPath + sii.fileName, (image: HTMLImageElement) => {
    
                // Add the sprite to the map
    
                if(sii.isHorizontal !== undefined && sii.fps !== undefined) {
                    this.addSprite(
                        sii.mapKey,
                        new PointSprite(
                            image,
                            {
                                numberOfFrames: sii.numberOfFrames,
                                isHorizontal: sii.isHorizontal,
                                framesPerSecond: sii.fps
                            }
                        )
                    );
                } else {
                    this.addSprite(
                        sii.mapKey,
                        new PointSprite(
                            image
                        )
                    );
                }
            });
        });
    }
    

    /**
     * Adds a key and its sprite to the map.
     * 
     * @param key The key to be used for the given sprite
     * @param sprite The sprte to be associated with the given key
     */
    public addSprite(key: string, sprite: PointSprite): void {
        this.map.set(key, sprite);
    }

    /**
     * Updates the frame for all of the sprites in the map.
     * @param dt Number of milliseconds which have passed since the last time this method was called
     */
    public updateAllSprites(dt: number): void {
        this.map.forEach((sprite: PointSprite) => sprite.update(dt));
    }

    /**
     * Draws the current frame of the sprite associated with the given key on the canvas at the given coordinates.
     * 
     * @param context The canvas' 2D rendering context
     * @param key The key of the sprite to be drawn at the given coordinates
     * @param center The center point of the sprite's frame on the canvas
     */
    public render(context: CanvasRenderingContext2D, key: string, center: Point): void {
        let sprite = this.getSprite(key);

        if(sprite) {
            sprite.renderAtCenterPoint(context, center);
        }
    }

    /**
     * Supplies the sprite associated with the given key
     * @param key The key for the desired sprite
     */
    public getSprite(key: string): PointSprite | undefined {
        return this.map.get(key);
    }

    private map: Map<string, PointSprite>;
}
