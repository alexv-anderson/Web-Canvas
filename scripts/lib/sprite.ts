
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
interface SpriteDescription extends MultiFrameSpriteProperties {
    key: string,
}
interface SpriteProperties {
    frameHeight?: number,
    frameWidth?: number,

    sourceX?: number,
    sourceY?: number
}
interface MultiFrameSpriteProperties extends SpriteProperties {
    frames?: {
        numberOfFrames: number,
        framesPerSecond: number,

        areHorizontal: boolean,

        loop: boolean,
        autoStart: boolean
    }
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
        this._frameHeight = image.height;
        this._frameWidth = image.width;

        this._imageBaseX = 0;
        this._imageBaseY = 0;

        this._centerRender = true;

        if(options !== undefined) {
            this._frameHeight = options.frameHeight || this._frameHeight;
            this._frameWidth = options.frameWidth || this._frameWidth;

            this._imageBaseX = options.sourceX || this._imageBaseX;
            this._imageBaseY = options.sourceY || this._imageBaseY;
        }

        this.image = image;
    }

    /**
     * Draws the current frame of the sprite on the canvas at the given coordinates.
     * 
     * @param context The canvas' 2D rendering context
     * @param point The point at which the sprite should be rendered on the canvas
     */
    public renderAt(context: CanvasRenderingContext2D, point: Point): void {
        this.renderFrom(context, point.x, point.y, this.frameSourceImageX, this.frameSourceImageY);
    }

    protected renderFrom(context: CanvasRenderingContext2D, x: number, y: number, srcX: number, srcY: number): void {
        context.drawImage(
            this.image,
            srcX,
            srcY,
            this.frameWidth,
            this.frameHeight,
            this._centerRender ? x - (this.frameWidth / 2) : x,
            this._centerRender ? y - (this.frameHeight / 2) : y,
            this.frameWidth,
            this.frameHeight
        );
    }

    public update(dt: number): void {

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

    protected get imageBaseX(): number {
        return this._imageBaseX;
    }
    protected get imageBaseY(): number {
        return this._imageBaseY;
    }

    protected get frameSourceImageX(): number {
        return this.imageBaseX;
    }
    protected get frameSourceImageY(): number {
        return this.imageBaseY;
    }

    private image: HTMLImageElement;

    private _imageBaseX: number;
    private _imageBaseY: number;

    private _frameHeight: number;
    private _frameWidth: number;

    private _centerRender: boolean;
}

export class MultiFrameSprite extends Sprite {
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
    constructor(image: HTMLImageElement, options: MultiFrameSpriteProperties)
    /**
     * Initializes the sprite.
     * 
     * A sprite is a image file which contains a single column or row of one or more frames.
     * 
     * @param image The image which holds the sprite
     * @param options Options which change how the sprite behaves
     */
    constructor(image: HTMLImageElement, options?: MultiFrameSpriteProperties) {
        if(options) {
            super(image, options);

            if(options.frames) {
                this.numberOfFrames = options.frames.numberOfFrames;
                this.framesPerSecond = options.frames.framesPerSecond;
                this.horizontal = options.frames.areHorizontal;
                this.loop = options.frames.loop;

                if(options.frames.autoStart) {
                    this.start();
                } else {
                    this.pause();
                }
            }

        } else {
            super(image);

            this.pause();
        }

        this.numberOfFrames = this.numberOfFrames || 1;
        this.framesPerSecond = this.framesPerSecond || 32;
        this.horizontal = this.horizontal !== undefined ? this.horizontal : true;
        this.loop = this.loop !== undefined ? this.loop : true;
        this._updateFrame = this._updateFrame !== undefined ? this._updateFrame : false;

        this.frameIndex = 0;

        this.lastUpdateTime = 0;
        this.lastFrameChangeTime = 0;
    }

    protected get frameSourceImageX(): number {
        let srcX = this.imageBaseX;

        if(this.horizontal) {
            srcX += this.frameIndex * this.frameWidth;
        }

        return srcX;
    }
    protected get frameSourceImageY(): number {
        let srcY = this.imageBaseY;
        
        if(!this.horizontal) {
            srcY += this.frameIndex * this.frameHeight;
        }

        return srcY;
    }

    /**
     * Updates the frame which is shown for the sprite.
     * @param dt Number of milliseconds which have passed since the last time this method was called
     */
    public update(dt: number): void {
        super.update(dt);

        if(this._updateFrame) {
            let msPerFrame = 1000 / this.framesPerSecond;

            this.lastUpdateTime += dt;

            if(this.lastUpdateTime - this.lastFrameChangeTime > msPerFrame) {
                this.lastFrameChangeTime = this.lastUpdateTime;

                if(this.loop) {
                    // Loop the animation
                    this.frameIndex = (this.frameIndex + 1) % this.numberOfFrames;
                } else {
                    if(this.frameIndex === this.framesPerSecond - 1) {
                        // The animation has finished so stop updating the frame
                        this._updateFrame = false;
                    } else {
                        // Proceed to the next frame in the animation
                        this.frameIndex += 1;
                    }
                }
            }
        }
    }

    public start(): void {
        this._updateFrame = true;
    }
    public pause(): void {
        this._updateFrame = false;
    }

    private numberOfFrames: number;
    private lastUpdateTime: number;
    private lastFrameChangeTime: number;
    private framesPerSecond: number;
    private frameIndex: number;
    private horizontal: boolean;
    private loop: boolean;

    private _updateFrame: boolean;
}

interface Point {
    x: number,
    y: number
}

/**
 * Maps keys to a sprite
 */
export class SpriteMap {
    constructor() {
        this.map = new Map<string, MultiFrameSprite>();
    }

    public loadSpriteSource(spriteSheetSource: SpriteSheetSource): void {
    
        // For each sprite
        spriteSheetSource.singles.forEach((single) => {
            // Load the image file
            loadPNG(spriteSheetSource.baseURL + single.fileName, (image: HTMLImageElement) => {
                // Add the sprite to the map    
                this.addSprite(
                    single.key,
                    new MultiFrameSprite(
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
                        new MultiFrameSprite(
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
    public addSprite(key: string, sprite: MultiFrameSprite): void {
        this.map.set(key, sprite);
    }

    /**
     * Updates the frame for all of the sprites in the map.
     * @param dt Number of milliseconds which have passed since the last time this method was called
     */
    public updateAllSprites(dt: number): void {
        this.map.forEach((sprite: MultiFrameSprite) => sprite.update(dt));
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
            sprite.renderAt(context, center);
        }
    }

    /**
     * Supplies the sprite associated with the given key
     * @param key The key for the desired sprite
     */
    public getSprite(key: string): MultiFrameSprite | undefined {
        return this.map.get(key);
    }

    private map: Map<string, MultiFrameSprite>;
}
