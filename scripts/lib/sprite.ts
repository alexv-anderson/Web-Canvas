
import { loadPNG } from "./web-loaders.js";

export interface SpriteConfig {
    spriteSources: Array<SpriteSheetSource>
}
interface SpriteSheetSource {
    baseURL: string,
    sheets: Array<MultispriteSheetDescription>,
    singles: Array<MonospriteSheetDescription>
}
interface MultispriteSheetDescription {
    fileName: string,
    defaultSpriteProperties?: {
        frameHeight?: number,
        frameWidth?: number
    }
    sprites: Array<SpriteDescription>
}
interface MonospriteSheetDescription extends SpriteDescription {
    fileName: string,
}
interface SpriteDescription extends SpriteProperties {
    key: string,
}
interface SpriteProperties {
    frameHeight?: number,
    frameWidth?: number,

    numberOfFrames?: number,
    fps?: number,

    isHorizontal?: boolean,

    sourceX?: number,
    sourceY?: number
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
    constructor(image: HTMLImageElement, options: SpriteProperties)
    /**
     * Initializes the sprite.
     * 
     * A sprite is a image file which contains a single column or row of one or more frames.
     * 
     * @param image The image which holds the sprite
     * @param options Options which change how the sprite behaves
     */
    constructor(image: HTMLImageElement, options?: SpriteProperties) {
        this.frameIndex = 0;

        this.numberOfFrames = 1;
        this.horizontal = true;
        this.imageBaseX = 0;
        this.imageBaseY = 0;

        this._frameHeight = image.height;
        this._frameWidth = image.width;

        if(options !== undefined) {
            this._frameHeight = options.frameHeight || this._frameHeight;
            this._frameWidth = options.frameWidth || this._frameWidth;

            this.numberOfFrames = options.numberOfFrames || this.numberOfFrames;
            this.framesPerSecond = options.fps;
            this.horizontal = options.isHorizontal !== undefined ? options.isHorizontal : this.horizontal;
            this.imageBaseX = options.sourceX || this.imageBaseX;
            this.imageBaseY = options.sourceY || this.imageBaseY;
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
            srcX += this.frameIndex * this.frameWidth;
        } else {
            srcY += this.frameIndex * this.frameHeight;
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
        return this._frameWidth;
    }
    /**
     * The height of the sprite's frame
     */
    public get frameHeight(): number {
        return this._frameHeight;
    }

    private image: HTMLImageElement;

    private imageBaseX: number;
    private imageBaseY: number;

    private numberOfFrames: number;
    private lastUpdateTime: number;
    private lastFrameChangeTime: number;
    private framesPerSecond?: number;
    private frameIndex: number;

    private _frameHeight: number;
    private _frameWidth: number;

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

/**
 * Maps keys to a sprite
 */
export class SpriteMap {
    constructor() {
        this.map = new Map<string, PointSprite>();
    }

    public loadSpriteSource(spriteSheetSource: SpriteSheetSource): void {
    
        // For each sprite
        spriteSheetSource.singles.forEach((single) => {
            // Load the image file
            loadPNG(spriteSheetSource.baseURL + single.fileName, (image: HTMLImageElement) => {
                // Add the sprite to the map    
                this.addSprite(
                    single.key,
                    new PointSprite(
                        image,
                        single
                    )
                );
            });
        });

        // For each sprite sheet
        spriteSheetSource.sheets.forEach((sheet) => {
            // Load the image file
            loadPNG(spriteSheetSource.baseURL + sheet.fileName, (image) => {
                
                let defaults = sheet.defaultSpriteProperties;
                // For each sprite in the sheet
                sheet.sprites.forEach(spriteDescription => {
                    if(defaults) {
                        if(spriteDescription.frameHeight === undefined && defaults.frameHeight) {
                            spriteDescription.frameHeight = defaults.frameHeight;
                        }
                        if(spriteDescription.frameWidth === undefined && defaults.frameWidth) {
                            spriteDescription.frameWidth = defaults.frameWidth;
                        }
                    }
                    
                    // Add the sprite to the map
                    this.addSprite(
                        spriteDescription.key,
                        new PointSprite(
                            image,
                            spriteDescription
                        )
                    );
                });
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
