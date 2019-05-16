import { ActorConfig, LayerConfig, SpriteConfig, WorldConfig } from "./canvas-grid-interface.js";
import { InputAccumalator, LayeredWorld, Point, World } from "./canvas-lib.js";
import { loadPNG } from "./general-lib.js";
import { Sprite } from "./sprite.js";
import { getImageDirURL, loadSpriteConfig } from "./canvas-grid-local.js";
import { Layer } from "./layer.js"

/**
 * Represents a single sprite which may be composed of one or more frames.
 */
class PointSprite extends Sprite {

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
        this.getSprite(key).renderAtCenterPoint(context, center);
    }

    /**
     * Supplies the sprite associated with the given key
     * @param key The key for the desired sprite
     */
    public getSprite(key: string): PointSprite {
        let sprite = this.map.get(key);
        if(sprite === undefined) {
            throw new ReferenceError("No sprite for key: " + key);
        } else {
            return sprite;
        }
    }

    private map: Map<string, PointSprite>;
}

/**
 * Represents a layer of sprites which for the background/floor
 */
export class SpriteLayer implements Layer {
    /**
     * Initializes the layer
     * @param grid The configuration for the layer
     */
    constructor(grid: LayerConfig, spriteMap: SpriteMap) {
        this.grid = grid;
        this.spriteMap = spriteMap;
    }

    /**
     * Renders the layer on the supplied canvas using the given sprite map
     * @param context The rendering context of the canvas on which the layer should be rendered
     */
    public render(context: CanvasRenderingContext2D): void {
        for(let key in this.grid) {
            let pairs = this.grid[key];
            for(let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                let pair = pairs[pairIndex];
                this.spriteMap.render(
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

    public addSquareFor(spriteKey: string, row: number, column: number): void {
        if(this.grid[spriteKey] === undefined) {
            this.grid[spriteKey] = [];
        }

        this.grid[spriteKey].push([row, column]);
    }

    public getSquaresFor(spriteKey: string): Array<Array<number>> | undefined {
        return this.grid[spriteKey];
    }

    public removeAllSpriteSquares(spriteKey: string): void {
        delete this.grid[spriteKey];
    }

    private grid: LayerConfig;
    private spriteMap: SpriteMap;
}

/**
 * Build a SpriteMap for the background tiles
 * @param onLoaded Called once all of the sprites have been loaded from the server
 */
export function loadSpriteMap(onLoaded: (map: SpriteMap) => void): void {

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
                    map.addSprite(
                        sii.mapKey,
                        new PointSprite(
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
export abstract class Actor {

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
        spriteMap.getSprite(this.spriteKeys[this.spriteIndex]).renderAtCenterPoint(
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
export abstract class SpriteWorld extends LayeredWorld {
    /**
     * Initializes the world
     * @param canvas The canvas on which the world will be drawn
     * @param config Configuration data for the world
     * @param spriteMap Data structure for the sprites in the world
     */
    constructor(canvas: HTMLCanvasElement, config: WorldConfig, spriteMap: SpriteMap) {
        super(canvas);

        if(config.actorConfigs) {
            for(let name in config.actorConfigs) {
                for(let actorConfig of config.actorConfigs[name])
                    this.actors.push(this.constructActorAt(name, actorConfig));
            }
        }

        config.layers.forEach((lc: LayerConfig) => { this.addLayer(new SpriteLayer(lc, spriteMap)); });

        this.spriteMap = spriteMap;
    }

    protected abstract constructActorAt(key: string, actorConfig: ActorConfig): Actor;

    public onUpdate(dt: number, inputAccumalator: InputAccumalator): void {
        this.spriteMap.updateAllSprites(dt);

        this.actors.forEach((actor: Actor) => { actor.update(inputAccumalator); })
    }

    /**
     * Renders the world on the given canvas
     */
    public render(): void {
        super.render();

        this.adhocSprites.forEach((as: { key: string, center: Point}) => { this.spriteMap.render(
            this.drawingContext,
            as.key,
            as.center
        )});

        this.actors.forEach((actor: Actor) => { actor.render(this.spriteMap, this.drawingContext); });
    }

    /**
     * Adds a sprite on top of the world's layers
     * @param key The key for the sprite in the SpriteMap
     * @param center The center point of the sprite in the world
     */
    public addAdHocSprite(key: string, center: Point): void {
        this.adhocSprites.push({
            key: key,
            center: center
        });
    }

    private adhocSprites: Array<{ key: string, center: Point}> = [];

    private spriteMap: SpriteMap;

    private actors: Array<Actor> = [];
}