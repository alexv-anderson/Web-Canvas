
import { Accessable, Point, RenderableAtPoint, Updatable } from "./common.js"
import { loadPNG } from "../node_modules/web-tools/javascript/web-loaders.js";

//#region SpriteSheet Locations and Defaults
export interface SpriteSheetSource {
    baseURL: string;
    sheets: Array<MultispriteSheetDescription>;
    singles: Array<MonospriteSheetDescription>;
}
interface MultispriteSheetDescription {
    fileName: string;
    defaultSpriteProperties?: {
        frameHeight?: number;
        frameWidth?: number;
    };
    sprites: Array<SpriteDescription>;
}
interface MonospriteSheetDescription extends SpriteDescription {
    fileName: string;
}
//#endregion

//#region Sprite Configuration and Properties
interface SpriteProperties {
    frameHeight?: number;
    frameWidth?: number;

    sourceX?: number;
    sourceY?: number;
}
interface MultiFrameSpriteProperties extends SpriteProperties {
    frames?: {
        numberOfFrames: number;
        framesPerSecond: number;

        areHorizontal: boolean;

        loop: boolean;
        autoStart: boolean;
    }
}
interface SpriteDescription extends MultiFrameSpriteProperties {
    key: string;
}
//#endregion

export interface AccessableSprite extends Accessable {
    readonly frameHeight: number;
    readonly frameWidth: number;
}

/**
 * Represents a sprite which may be encompass some or all of an image.
 */
export class Sprite implements AccessableSprite, RenderableAtPoint {
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
            x,
            y,
            this.frameWidth,
            this.frameHeight
        );
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

    /**
     * The x-coordinate of the sprite's top-left pixel in the source image
     */
    protected get imageBaseX(): number {
        return this._imageBaseX;
    }
    /**
     * The y-cooridinate of the sprites's top-left pixel in the source image
     */
    protected get imageBaseY(): number {
        return this._imageBaseY;
    }

    /**
     * The x-coordinate of the top-left pixel of the sprite's frame in the source image
     */
    protected get frameSourceImageX(): number {
        return this.imageBaseX;
    }
    /**
     * The y-coordinate of the top-left pixel of the sprite's frame in the source image
     */
    protected get frameSourceImageY(): number {
        return this.imageBaseY;
    }

    private image: HTMLImageElement;

    private _imageBaseX: number;
    private _imageBaseY: number;

    private _frameHeight: number;
    private _frameWidth: number;
}

export interface AccessableMultiFrameSprite extends AccessableSprite {
    play(): void;
    pause(): void;
}

/**
 * Represents a sprite which may be encompass some or all of an image and is composed of multiple frames.
 */
export class MultiFrameSprite extends Sprite implements AccessableMultiFrameSprite, Updatable {
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
        } else {
            super(image);
        }

        this._updateFrame = false;

        if(options && options.frames) {
            this.numberOfFrames = options.frames.numberOfFrames;
            this.framesPerSecond = options.frames.framesPerSecond;
            this.horizontal = options.frames.areHorizontal;
            this.loop = options.frames.loop;

            if(options.frames.autoStart) {
                this.play();
            } else {
                this.pause();
            }
        } else {
            this.numberOfFrames = 1;
            this.framesPerSecond = 32;
            this.horizontal = true;
            this.loop = true;
            
            this.pause();
        }

        this.frameIndex = 0;

        this.lastUpdateTime = 0;
        this.lastFrameChangeTime = 0;
    }

    /**
     * The x-coordinate of the top-left pixel of the sprite's frame in the source image which
     *   has been offset for the correct frame.
     */
    protected get frameSourceImageX(): number {
        let srcX = this.imageBaseX;

        if(this.horizontal) {
            srcX += this.frameIndex * this.frameWidth;
        }

        return srcX;
    }
    /**
     * The y-coordinate of the top-left pixel of the sprite's frame in the source image which
     *   has been offset for the correct frame.
     */
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

    /**
     * Plays through the sprite's frames beginning from the current frame
     */
    public play(): void {
        this._updateFrame = true;
    }
    /**
     * Pauses the progression through the sprite's frames
     */
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

/**
 * Manages the sprites which are available
 */
export class SpriteManager {
    constructor() {
        this.map = new Map<string, MultiFrameSprite>();
    }

    /**
     * Asynchronously loads the sprites from the given source and loads them into the manager.
     * 
     * Note: If the key of a newly loaded sprite conflicts with an existing key, then the old
     *   key and its sprite will be replaced by the newly loaded sprite
     * @param spriteSheetSource The source from which sprite sheets shold be loaded
     */
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
     * Adds a key and its sprite to the manager.
     * 
     * @param key The key to be used for the given sprite
     * @param sprite The sprte to be associated with the given key
     */
    private addSprite(key: string, sprite: MultiFrameSprite): void {
        this.map.set(key, sprite);
    }

    /**
     * Updates the frame for all of the sprites in the manager.
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
     * @param point The center point of the sprite's frame on the canvas
     */
    public renderAt(context: CanvasRenderingContext2D, key: string, point: Point): void;
    /**
     * Draws the current frame of the sprite associated with the given key on the canvas at the given coordinates.
     * 
     * @param context The canvas' 2D rendering context
     * @param key The key of the sprite to be drawn at the given coordinates
     * @param point The center point of the sprite's frame on the canvas
     * @param centered True if the point given is the center of the sprite, false if the point is the top-left corner
     */
    public renderAt(context: CanvasRenderingContext2D, key: string, point: Point, centered: boolean): void;
    public renderAt(context: CanvasRenderingContext2D, key: string, point: Point, centered?: boolean): void {
        let sprite = this.map.get(key);

        if(sprite) {
            if(centered !== undefined && centered) {
                point = point.plus(
                    - (sprite.frameWidth / 2),
                    - (sprite.frameHeight / 2)
                );
            }

            sprite.renderAt(context, point);
        }
    }

    /**
     * Allows access to the sprite mapped to the given key if it exists
     * @param key The key of the sprite which should be accessed
     * @param accessor The method which will be given access to the sprite if it exists
     */
    public accessSprite(key: string, accessor: (sprite: AccessableMultiFrameSprite) => void) {
        let sprite = this.map.get(key);
        if(sprite) {
            accessor(sprite);
        }
    }

    private map: Map<string, MultiFrameSprite>;
}