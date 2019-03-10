/// <reference path="./general-lib.ts" />
/// <reference path="./canvas-lib.ts" />
/// <reference path="./canvas-grid-interface.ts" />
/// <reference path="./canvas-grid-local.ts" />

/**
 * Represents a single sprite which may be composed of one or more frames.
 */
class Sprite {
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
     * @param numberOfFrames The number of frames in the image
     * @param horizontal Indicates if the frames are in a single row
     * @param framesPerSecond Indicates the number of frames to show in a second of time
     */
    constructor(
        image: HTMLImageElement,
        numberOfFrames: number,
        horizontal: boolean,
        framesPerSecond: number
    )
    /**
     * Initializes the sprite.
     * 
     * A sprite is a image file which contains a single column or row of one or more frames.
     * 
     * @param image The image which holds the sprite
     * @param numberOfFrames The number of frames in the image
     * @param horizontal Indicates if the frames are in a single row
     * @param framesPerSecond Indicates the number of frames to show in a second of time
     */
    constructor(
        image: HTMLImageElement,
        numberOfFrames?: number,
        horizontal?: boolean,
        framesPerSecond?: number
    ) {
        this.frameIndex = 0;

        this.numberOfFrames = numberOfFrames || 1;
        this.lastUpdateTime = 0;
        this.lastFrameChangeTime = 0;
        this.framesPerSecond = framesPerSecond;
        this.horizontal = horizontal !== undefined ? horizontal : true;

        this.image = image;
    }

    /**
     * Draws the current frame of the sprite on the canvas at the given coordinates.
     * 
     * @param context The canvas' 2D rendering context
     * @param center The center point of the sprite's frame on the canvas
     */
    public render(context: CanvasRenderingContext2D, center: Point): void {
        let srcX: number = 0;
        let srcY: number = 0;

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
            center.x - (this.frameWidth / 2),
            center.y - (this.frameHeight / 2),
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

    private numberOfFrames: number;
    private lastUpdateTime: number;
    private lastFrameChangeTime: number;
    private framesPerSecond?: number;
    private frameIndex: number;

    private horizontal: boolean;
}

/**
 * Maps keys to a sprite
 */
class SpriteMap {
    constructor() {
        this.map = new Map<string, Sprite>();
    }

    /**
     * Adds a key and its sprite to the map.
     * 
     * @param key The key to be used for the given sprite
     * @param sprite The sprte to be associated with the given key
     */
    public addSprite(key: string, sprite: Sprite): void {
        this.map.set(key, sprite);
    }

    /**
     * Updates the frame for all of the sprites in the map.
     * @param dt Number of milliseconds which have passed since the last time this method was called
     */
    public updateAllSprites(dt: number): void {
        this.map.forEach((sprite: Sprite) => sprite.update(dt));
    }

    /**
     * Draws the current frame of the sprite associated with the given key on the canvas at the given coordinates.
     * 
     * @param context The canvas' 2D rendering context
     * @param key The key of the sprite to be drawn at the given coordinates
     * @param center The center point of the sprite's frame on the canvas
     */
    public render(context: CanvasRenderingContext2D, key: string, center: Point): void {
        this.getSprite(key).render(context, center);
    }

    /**
     * Supplies the sprite associated with the given key
     * @param key The key for the desired sprite
     */
    public getSprite(key: string): Sprite {
        let sprite = this.map.get(key);
        if(sprite === undefined) {
            throw new ReferenceError("No sprite for key: " + key);
        } else {
            return sprite;
        }
    }

    private map: Map<string, Sprite>;
}

/**
 * Represents a layer of sprites which for the background/floor
 */
class SpriteLayer extends Layer {
    /**
     * Initializes the layer
     * @param grid The configuration for the layer
     */
    constructor(grid: LayerConfig, spriteMap: SpriteMap) {
        super();
        this._grid = grid;
        this._spriteMap = spriteMap;
    }

    /**
     * Renders the layer on the supplied canvas using the given sprite map
     * @param context The rendering context of the canvas on which the layer should be rendered
     */
    public render(context: CanvasRenderingContext2D): void {
        for(let key in this._grid) {
            let pairs = this._grid[key];
            for(let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                let pair = pairs[pairIndex];
                this._spriteMap.render(
                    context,
                    key,
                    new Point(
                        (pair[1] * 32) + 16,
                        (pair[0] * 32) + 16
                    )
                )
            }
        }
    }

    private _grid: LayerConfig;
    private _spriteMap: SpriteMap;
}

/**
 * Build a SpriteMap for the background tiles
 * @param onLoaded Called once all of the sprites have been loaded from the server
 */
function loadSpriteMap(onLoaded: (map: SpriteMap) => void): void {

    // Load the sprite configuration data
    loadSpriteConfig((config: SpriteConfig) => {

        // Create the map
        let map = new SpriteMap();

        /**
         * Supplies a function which will only call the callback when it has been called the given number of times.
         * 
         * Example: if the function is called with the value 3, then the 3rd time the return function is called the callback will be called.
         * @param numCallsToCallback The number of times which the returned function must be called before it will call the callback
         */
        function generateCountingDelayCallback(numCallsToCallback: number): (map: SpriteMap, callback: (map: SpriteMap) => void) => void {
            let numberOfTimesCalled = 0;    // The number of times which the returned function has been called

            return function(map: SpriteMap, callback: (map: SpriteMap) => void): void {
                numberOfTimesCalled++;  //Increment the call counter
                if(numberOfTimesCalled >= numCallsToCallback)
                    callback(map);  // Only call if enough calls have been made
            }
        }

        // Delay the callback until all of the sprites are loaded
        let countingCallback = generateCountingDelayCallback(config.spriteImageInfo.length);
        
        // For each sprite
        config.spriteImageInfo.forEach((sii) => {
            // Load the image file
            loadPNG(getImageDirURL() + sii.fileName, (image: HTMLImageElement) => {

                // Add the sprite to the map

                if(sii.isHorizontal !== undefined && sii.fps !== undefined) {
                    map.addSprite(
                        sii.mapKey,
                        new Sprite(
                            image,
                            sii.numberOfFrames,
                            sii.isHorizontal,
                            sii.fps
                        )
                    );
                } else {
                    map.addSprite(
                        sii.mapKey,
                        new Sprite(
                            image
                        )
                    );
                }

                // count for the callback
                countingCallback(map, onLoaded);
            });
        });
    });
}

/**
 * Represents something at can move due to user input on the canvas
 */
abstract class Actor {

    /**
     * Initializes the actor
     * @param location The center point of the actor's initial location
     * @param spriteIndex The index of the actor's initial sprite
     * @param sprites An array of the actor's sprites
     */
    constructor(
        location: Point,
        spriteIndex: number,
        sprites: Array<string>
    ) {
        this.location = location;
        this.spriteIndex = spriteIndex;
        this.spriteKeys = sprites;
    }

    /**
     * Updates the actor using input from the user
     * @param inputAccumalator Input which has been supplied by the user
     */
    public abstract update(inputAccumalator: InputAccumalator): void;

    /**
     * Renders the actor on the canvas
     * @param spriteMap A map from keys to sprites
     * @param context The rendering context of the canvas on which the actor should be rendered
     */
    public render(spriteMap: SpriteMap, context: CanvasRenderingContext2D): void {
        spriteMap.getSprite(this.spriteKeys[this.spriteIndex]).render(
            context,
            new Point(
                this.location.x,
                this.location.y
            )
        );
    }

    protected move(dx: number, dy: number): void {
        this.location = this.location.plus(dx, dy);
    }

    private location: Point;
    private spriteIndex: number;
    private spriteKeys: Array<string>;
}

/**
 * Reperesents everything on the canvas
 */
abstract class SpriteWorld {
    /**
     * Initializes the world
     * @param config Configuration data for the world
     */
    constructor(config: WorldConfig, spriteMap: SpriteMap) {
        if(config.actorConfigs) {
            for(let name in config.actorConfigs) {
                for(let actorConfig of config.actorConfigs[name])
                    this.actors.push(eval(
                        "new " + name + "(new Point(" + actorConfig.location[0] + ", " + actorConfig.location[1] + "), " + actorConfig.isi + ", " + JSON.stringify(actorConfig.sprites) + ")"
                    ));
            }
        }

        config.layers.forEach((lc: LayerConfig) => { this.layout.addLayer(new SpriteLayer(lc, spriteMap)); });

        this._viewHeight = config.view.height;
        this._viewWidth = config.view.width;

        this.spriteMap = spriteMap;
    }

    /**
     * Updates everything in the world
     * @param dt Number of milliseconds which have passed since the last time this method was called
     * @param spriteMap A map from keys to sprites
     * @param inputAccumalator Input collected from the user
     */
    public update(dt: number, spriteMap: SpriteMap, inputAccumalator: InputAccumalator) {
        this.onUpdate(dt, inputAccumalator);

        spriteMap.updateAllSprites(dt);

        this.actors.forEach((actor: Actor) => { actor.update(inputAccumalator); })
    }

    public abstract onUpdate(dt: number, inputAccumalator: InputAccumalator): void;

    /**
     * Renders the world on the given canvas
     * @param spriteMap A map from keys to sprites
     * @param context The rendering context of the canvas on which the world should be rendered
     */
    public render(spriteMap: SpriteMap, context: CanvasRenderingContext2D): void {
        // Draw sprites
        this.layout.render(context);

        this.adhocSprites.forEach((as: { key: string, center: Point}) => { spriteMap.render(
            context,
            as.key,
            as.center
        )});

        this.lines.forEach(line => {
            context.save();
            context.beginPath();
            context.moveTo(line.x1, line.y1);
            context.lineTo(line.x2, line.y2);
            context.lineWidth = line.width || context.lineWidth;
            context.strokeStyle = line.style || context.strokeStyle;
            context.stroke();
            context.restore();
        });

        this.actors.forEach((actor: Actor) => { actor.render(spriteMap, context); })
    }

    public addAdHocSprite(key: string, center: Point): void {
        this.adhocSprites.push({
            key: key,
            center: center
        });
    }

    protected addLine(x1: number, y1: number, x2: number, y2: number): void
    protected addLine(x1: number, y1: number, x2: number, y2: number, style: string, width: number): void
    protected addLine(x1: number, y1: number, x2: number, y2: number, style?: string, width?: number): void {
        this.lines.push({
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            style: style,
            width: width
        });
    }

    public get viewHeight(): number {
        return this._viewHeight;
    }
    public get viewWidth(): number {
        return this._viewWidth;
    }

    private adhocSprites: Array<{ key: string, center: Point}> = [];
    private lines: Array<{x1: number, y1: number, x2: number, y2: number, style?: string, width?: number}> = [];

    private _viewHeight: number;
    private _viewWidth: number;

    private spriteMap: SpriteMap;

    private actors: Array<Actor> = [];
    private layout: LayeredLayout = new LayeredLayout();
}