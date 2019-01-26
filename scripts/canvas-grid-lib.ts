/// <reference path="./general-lib.ts" />
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
     * @param loop Indicates if the frames should loop
     */
    constructor(
        image: HTMLImageElement,
        numberOfFrames: number,
        horizontal: boolean,
        loop: boolean
    )
    /**
     * Initializes the sprite.
     * 
     * A sprite is a image file which contains a single column or row of one or more frames.
     * 
     * @param image The image which holds the sprite
     * @param numberOfFrames The number of frames in the image
     * @param horizontal Indicates if the frames are in a single row
     * @param loop Indicates if the frames should loop
     */
    constructor(
        image: HTMLImageElement,
        numberOfFrames?: number,
        horizontal?: boolean,
        loop?: boolean
    ) {
        this.frameIndex = 0;
        this.updatesSinceLastFrame = 0;
        this.numberOfUpdatesPerFrame = 0;

        this.numberOfFrames = numberOfFrames || 1;
        this.horizontal = horizontal !== undefined ? horizontal : true;
        this.loop = loop !== undefined ? loop : false;

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
     */
    public update(): void {
        this.updatesSinceLastFrame += 1;
        if(this.updatesSinceLastFrame > this.numberOfUpdatesPerFrame) {
            this.updatesSinceLastFrame = 0;
            if(this.frameIndex < this.numberOfFrames - 1) {
                this.frameIndex += 1;
            } else if(this.loop) {
                this.frameIndex = 0;
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
    private frameIndex: number;
    private numberOfUpdatesPerFrame: number;

    private updatesSinceLastFrame: number;

    private horizontal: boolean;
    private loop: boolean;
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
     */
    public updateAllSprites(): void {
        this.map.forEach((sprite: Sprite) => sprite.update());
    }

    /**
     * Draws the current frame of the sprite associated with the given key on the canvas at the given coordinates.
     * 
     * @param context The canvas' 2D rendering context
     * @param key The key of the sprite to be drawn at the given coordinates
     * @param center The center point of the sprite's frame on the canvas
     */
    public render(context: CanvasRenderingContext2D, key: string, center: Point): void {
        this.map.get(key).render(context, center);
    }

    /**
     * Supplies the sprite associated with the given key
     * @param key The key for the desired sprite
     */
    public getSprite(key: string): Sprite {
        return this.map.get(key);
    }

    private map: Map<string, Sprite>;
}

/**
 * Represents a layer of sprites which for the background/floor
 */
class Layer {
    /**
     * Initializes the layer
     * @param grid The configuration for the layer
     */
    constructor(grid: LayerConfig) {
        this._grid = grid;
    }

    /**
     * Renders the layer on the supplied canvas using the given sprite map
     * @param spriteMap A map from keys to sprites
     * @param context The rendering context of the canvas on which the layer should be rendered
     */
    public render(spriteMap: SpriteMap, context: CanvasRenderingContext2D): void {
        for(let key in this._grid) {
            let pairs = this._grid[key];
            for(let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                let pair = pairs[pairIndex];
                spriteMap.render(
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
}

/**
 * Represents a list of layers
 */
class LayeredLayout {
    /**
     * Adds a layer on top of the existing layers
     * @param layer The layer to be placed at the top of the list
     */
    public addLayer(layer: Layer): void {
        this.layers.push(layer);
    }

    /**
     * Supplies the layer at the given index.
     * 
     * Note: the lowest layer has an index of 0
     * @param index The index of the desired layer
     */
    public getLayer(index: number): Layer {
        return this.layers[index];
    }

    /**
     * The number of layers in this layout
     */
    public get depth(): number {
        return this.layers.length;
    }

    /**
     * Renders the layers of the layout in order
     * @param spriteMap A mapping from keys to sprites
     * @param context The rendering context of the canvas on which the layout should be rendered
     */
    public render(spriteMap: SpriteMap, context: CanvasRenderingContext2D): void {
        this.layers.forEach((layer: Layer) => { layer.render(spriteMap, context); });
    }

    private layers: Array<Layer> = [];
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
                map.addSprite(
                    sii.mapKey,
                    new Sprite(
                        image,
                        sii.numberOfFrames,
                        sii.isHorizontal,
                        sii.loop
                    )
                );

                // count for the callback
                countingCallback(map, onLoaded);
            });
        });
    });
}

/**
 * Represents a point in 2D Cartesian space
 */
class Point {
    /**
     * Initializes the point
     * @param x The point's x-coordinate
     * @param y The point's y-coordinate
     */
    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    /**
     * The point's x-coordinate
     */
    public get x(): number {
        return this._x;
    }
    /**
     * The point's x-coordinate
     */
    public set x(x: number) {
        this._x = x;
    }
    /**
     * The point's y-coordinate
     */
    public get y(): number {
        return this._y;
    }
    /**
     * The point's y-coordinate
     */
    public set y(y: number) {
        this._y = y;
    }

    private _x: number;
    private _y: number;
}

/**
 * Represents something at can move due to user input on the canvas
 */
class Actor {

    /**
     * Initializes the actor
     * @param location The center point of the actor's initial location
     * @param spriteIndex The index of the actor's initial sprite
     * @param sprites An array of the actor's sprites
     */
    constructor(
        location: Point,
        spriteIndex: number,
        sprites: Array<Sprite>
    ) {
        this.location = location;
        this.spriteIndex = spriteIndex;
        this.sprites = sprites;
    }

    /**
     * Updates the actor using input from the user
     * @param inputAccumalator Input which has been supplied by the user
     */
    public update(inputAccumalator: InputAccumalator) {
        if(inputAccumalator.arrowUpDown)
            this.location.y -= 5;
        else if(inputAccumalator.arrowDownDown)
            this.location.y += 5;
        else if(inputAccumalator.arrowLeftDown)
            this.location.x -= 5;
        else if(inputAccumalator.arrowRightDown)
            this.location.x += 5;
    }

    /**
     * Renders the actor on the canvas
     * @param context The rendering context of the canvas on which the actor should be rendered
     */
    public render(context: CanvasRenderingContext2D): void {
        let sprite = this.sprites[this.spriteIndex];
        sprite.render(
            context,
            new Point(
                this.location.x - (sprite.frameWidth / 2) + 16,
                this.location.y - (sprite.frameHeight / 2) + 16
            )
        );
    }

    private location: Point;
    private spriteIndex: number;
    private sprites: Array<Sprite>;
}

/**
 * Reperesents everything on the canvas
 */
class World {
    /**
     * Initializes the world
     * @param spriteMap A mapping between keys and sprites
     * @param config Configuration data for the world
     */
    constructor(spriteMap: SpriteMap, config: WorldConfig) {
        this.spriteMap = spriteMap;

        config.actorInitialInfo.forEach((acd: ActorConfigData) => {
            this.actors.push(new Actor(
                new Point(acd.initialLocation[0], acd.initialLocation[1]),
                acd.initialSpriteIndex || 0,
                acd.spriteKeys.map((key: string) => { return spriteMap.getSprite(key); })
            ));
        });

        config.layers.forEach((lc: LayerConfig) => { this.layout.addLayer(new Layer(lc)); });

        this._viewHeight = config.view.height;
        this._viewWidth = config.view.width;
    }

    /**
     * Updates everything in the world
     * @param inputAccumalator Input collected from the user
     */
    public update(inputAccumalator: InputAccumalator) {
        if(inputAccumalator.mouseDown) {
            this.targetLocations.push(new Point(
                inputAccumalator.mouseDownPoint.x,
                inputAccumalator.mouseDownPoint.y
            ))
        }

        this.spriteMap.updateAllSprites();

        this.actors.forEach((actor: Actor) => { actor.update(inputAccumalator); })
    }

    /**
     * Renders the world on the given canvas
     * @param context The rendering context of the canvas on which the world should be rendered
     */
    public render(context: CanvasRenderingContext2D): void {
        // Draw sprites
        this.layout.render(this.spriteMap, context);

        this.targetLocations.forEach((point: Point) => { this.spriteMap.render(
            context,
            "target",
            new Point(
                point.x,
                point.y
            )
        )});        

        this.actors.forEach((actor: Actor) => { actor.render(context); })
    }

    public addTarget(point: Point): void {
        this.targetLocations.push(point);
    }

    public get viewHeight(): number {
        return this._viewHeight;
    }
    public get viewWidth(): number {
        return this._viewWidth;
    }

    private targetLocations: Array<Point> = [];

    private _viewHeight: number;
    private _viewWidth: number;

    private actors: Array<Actor> = [];
    private layout: LayeredLayout = new LayeredLayout();
    private spriteMap: SpriteMap;
}

/**
 * Loads the world
 * @param callback Called once the world has been initialized
 */
function loadWorld(callback: (world: World) => void): void {
    loadSpriteMap((spriteMap: SpriteMap) => {
        loadWorldConfig((config: WorldConfig) => callback(new World(spriteMap, config)));
        // loadJSON(getConfigDirURL() + "world-config.json", (config: WorldConfig) => {
        //     callback(new World(spriteMap, config));
        // });
    });
}

/**
 * Collects input from the user
 */
class InputAccumalator {
    /**
     * Initializes the accumalator
     * @param canvas The canvas from which click events should be collected
     */
    constructor(canvas: HTMLCanvasElement) {
        document.addEventListener("mousedown", (event: MouseEvent) => {
            let rect = canvas.getBoundingClientRect();
            this._mouseDownPoint = new Point(
                event.clientX - rect.left,
                event.clientY - rect.top
            );
        });

        document.addEventListener("keydown", (event: KeyboardEvent) => {
            if(event.keyCode == 38)
                this._arrowUpDown = true;    // Go up
            else if(event.keyCode == 40)
                this._arrowDownDown = true;    // Go down
            else if(event.keyCode == 37)
                this._arrowLeftDown = true;    // Go left
            else if(event.keyCode == 39)
                this._arrowRightDown = true;    // Go right
        });

        this.reset();
    }

    /**
     * Flag indicating if the mousedown event has occurred on the canvase
     */
    public get mouseDown(): boolean {
        return this._mouseDownPoint !== undefined;
    }
    /**
     * The point on the canvas relative to its top-left corner at which the mousedown event occurred
     */
    public get mouseDownPoint(): Point | undefined {
        return this._mouseDownPoint;
    }

    /**
     * Flag indicating if the up arrow was pressed
     */
    public get arrowUpDown(): boolean {
        return this._arrowUpDown;
    }
    /**
     * Flag indicating if the down arrow was pressed
     */
    public get arrowDownDown(): boolean {
        return this._arrowDownDown;
    }
    /**
     * Flag indicating if the left arrow was pressed
     */
    public get arrowLeftDown(): boolean {
        return this._arrowLeftDown;
    }
    /**
     * Flag indicating if the right arrow was pressed
     */
    public get arrowRightDown(): boolean {
        return this._arrowRightDown;
    }

    /**
     * Resets all of the data
     */
    public reset(): void {
        this._mouseDownPoint = undefined;

        this._arrowUpDown = false;
        this._arrowDownDown = false;
        this._arrowLeftDown = false;
        this._arrowRightDown = false;
    }

    private _mouseDownPoint?: Point;

    private _arrowUpDown: boolean;
    private _arrowDownDown: boolean;
    private _arrowLeftDown: boolean;
    private _arrowRightDown: boolean;
}

/**
 * Begins loading everything once the body of the document has loaded
 */
function onBodyLoad() {
    loadWorld((world: World) => {
        getCanvas((canvas: HTMLCanvasElement) => {
            canvas.height = world.viewHeight;
            canvas.width = world.viewWidth;

            let context = canvas.getContext("2d");

            let ia = new InputAccumalator(canvas);

            // Start update loop
            setInterval(
                () => {
                    context.clearRect(0, 0, canvas.width, canvas.height);

                    // Updated animated sprites
                    world.update(ia);
                    ia.reset();

                    world.render(context);
                },
                250 // milliseconds
            );
        });
    });
}