/**
 * Represents a single sprite which may be composed of one or more frames.
 */
class Sprite {
    /**
     * Initializes the sprite.
     * 
     * @param image The image which holds the sprite
     * @param width The width of the image in pixels
     * @param height The height of the image in pixels
     */
    constructor(image: HTMLImageElement,
        width: number,
        height: number)
    /**
     * Initializes the sprite.
     * 
     * A sprite is a image file which contains a single column or row of one or more frames.
     * 
     * @param image The image which holds the sprite
     * @param width The width of the image in pixels
     * @param height The height of the image in pixels
     * @param numberOfFrames The number of frames in the image
     * @param horizontal Indicates if the frames are in a single row
     * @param loop Indicates if the frames should loop
     */
    constructor(
        image: HTMLImageElement,
        width: number,
        height: number,
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
     * @param imageWidth The width of the image in pixels
     * @param imageHeight The height of the image in pixels
     * @param numberOfFrames The number of frames in the image
     * @param horizontal Indicates if the frames are in a single row
     * @param loop Indicates if the frames should loop
     */
    constructor(
        image: HTMLImageElement,
        imageWidth: number,
        imageHeight: number,
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
     * @param canvasX The x-coordinate on the canvas of the top-left corner of the render
     * @param canvasY The y-coordinate on the canvas of the top-left corner of the render
     */
    public render(context: CanvasRenderingContext2D, canvasX: number, canvasY: number): void {
        let srcX: number = 0;
        let srcY: number = 0;

        // Toggle controls whether frames progress to the right or left
        if(this.horizontal) {
            srcX = this.frameIndex * this.getFrameWidth();
        } else {
            srcY = this.frameIndex * this.getFrameHeight();
        }

        context.drawImage(
            this.image,
            srcX,
            srcY,
            this.getFrameWidth(),
            this.getFrameHeight(),
            canvasX,
            canvasY,
            this.getFrameWidth(),
            this.getFrameHeight()
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

    public get width(): number {
        return this.getFrameWidth();
    }
    public get height(): number {
        return this.getFrameHeight();
    }

    private getFrameWidth(): number {
        if(this.horizontal) {
            return this.image.width / this.numberOfFrames;
        } else {
            return this.image.width;
        }
    }

    private getFrameHeight(): number {
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
     * @param x The x-coordinate on the canvas of the top-left corner of the render
     * @param y The y-coordinate on the canvas of the top-left corner of the render
     */
    public render(context: CanvasRenderingContext2D, key: string, x: number, y: number) {
        this.map.get(key).render(context, x, y);
    }

    public getSprite(key: string): Sprite {
        return this.map.get(key);
    }

    private map: Map<string, Sprite>;
}

type LayerConfig = { [key in string]: Array<Array<number>> };

class Layer {
    constructor(grid: LayerConfig) {
        this._grid = grid;
    }

    public render(spriteMap: SpriteMap, context: CanvasRenderingContext2D): void {
        for(let key in this._grid) {
            let pairs = this._grid[key];
            for(let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                let pair = pairs[pairIndex];
                spriteMap.render(
                    context,
                    key,
                    pair[1] * 32,
                    pair[0] * 32
                )
            }
        }
    }

    private _grid: LayerConfig;
}

class LayeredLayout {
    public addLayer(layer: Layer): void {
        this.layers.push(layer);
    }

    public getLayer(index: number): Layer {
        return this.layers[index];
    }

    public get depth(): number {
        return this.layers.length;
    }

    public render(spriteMap: SpriteMap, context: CanvasRenderingContext2D): void {
        this.layers.forEach((layer: Layer) => { layer.render(spriteMap, context); });
    }

    private layers: Array<Layer> = [];
}

/**
 * Supplies the URL for the index of the host
 */
function getHostURL(): string {
    return "http://127.0.0.1:8000/"
}

/**
 * Build a SpriteMap for the background tiles
 * @param onLoaded Called once all of the sprites have been loaded from the server
 */
function getSpriteMap(onLoaded: (map: SpriteMap) => void): void {

    // Load the sprite configuration data
    loadJSON(getHostURL() + "sprite-config.json", (json) => {

        // Type information for the sprite configuration data
        interface SpriteInitInfo {
            fileName: string,
            mapKey: string,
            width: number,
            height: number,
            numberOfFrames: number,
            isHorizontal?: boolean,
            loop?: boolean
        }
        
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
        let countingCallback = generateCountingDelayCallback((json.spriteImageInfo as Array<SpriteInitInfo>).length);
        
        // For each sprite
        (json.spriteImageInfo as Array<SpriteInitInfo>).forEach((sii) => {
            // Load the image file
            loadPNG(getHostURL() + sii.fileName, (image: HTMLImageElement) => {

                // Add the sprite to the map
                map.addSprite(
                    sii.mapKey,
                    new Sprite(
                        image,
                        sii.width,
                        sii.height,
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

class Point {
    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    public get x(): number {
        return this._x;
    }
    public set x(x: number) {
        this._x = x;
    }
    public get y(): number {
        return this._y;
    }
    public set y(y: number) {
        this._y = y;
    }

    private _x: number;
    private _y: number;
}

class Actor {

    constructor(
        location: Point,
        spriteIndex: number,
        sprites: Array<Sprite>
    ) {
        this.location = location;
        this.spriteIndex = spriteIndex;
        this.sprites = sprites;
    }

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

    public render(context: CanvasRenderingContext2D): void {
        let sprite = this.sprites[this.spriteIndex];
        sprite.render(
            context,
            this.location.x - (sprite.width / 2),
            this.location.y - (sprite.height / 2)
        );
    }

    private location: Point;
    private spriteIndex: number;
    private sprites: Array<Sprite>;
}

class World {
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

    public render(context: CanvasRenderingContext2D): void {
        // Draw sprites
        this.layout.render(this.spriteMap, context);

        this.targetLocations.forEach((point: Point) => { this.spriteMap.render(
            context,
            "target",
            point.x - 16,
            point.y - 16
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

type WorldConfig = {
    view: { height: number, width: number },
    layers: Array<LayerConfig>,
    actorInitialInfo: Array<ActorConfigData>
}
type ActorConfigData = {
    initialLocation: Array<number>,
    initialSpriteIndex: number,
    spriteKeys: Array<string>
}

function getWorld(callback: (world: World) => void): void {
    getSpriteMap((spriteMap: SpriteMap) => {
        loadJSON(getHostURL() + "world-config.json", (config: WorldConfig) => {
            callback(new World(spriteMap, config));
        });
    });
}

class InputAccumalator {
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


    public get mouseDown(): boolean {
        return this._mouseDownPoint !== undefined;
    }
    public get mouseDownPoint(): Point | undefined {
        return this._mouseDownPoint;
    }

    public get arrowUpDown(): boolean {
        return this._arrowUpDown;
    }
    public get arrowDownDown(): boolean {
        return this._arrowDownDown;
    }
    public get arrowLeftDown(): boolean {
        return this._arrowLeftDown;
    }
    public get arrowRightDown(): boolean {
        return this._arrowRightDown;
    }

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
    getWorld((world: World) => {
        let canvas = document.getElementById("theCanvas") as HTMLCanvasElement;

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
}

/**
 * Loads a PNG file from a server
 * @param pngURL The URL of the PNG file
 * @param callback A function which will process the image element after it has been loaded
 */
function loadPNG(pngURL: string, callback: (image: HTMLImageElement) => void) {
    // Based on example found at https://www.html5rocks.com/en/tutorials/file/xhr2/
    let xhr = new XMLHttpRequest();
    xhr.open("GET", pngURL, true);
    xhr.responseType = "blob";
    xhr.onload = function(this: XMLHttpRequest, event: ProgressEvent) {
        if(this.status == 200) {
            let blob = this.response;
            let img = document.createElement("img");
            img.onload = (event: Event) => {
                window.URL.revokeObjectURL(img.src);
            }
            img.src = window.URL.createObjectURL(blob);
            callback(img);
        }
    }
    xhr.send();
}

/**
 * Loads a JSON file from a server
 * @param jsonURL The URL of the JSON file
 * @param callback A function which will process the object after it has been loaded
 */
function loadJSON(jsonURL: string, callback: (json: any) => void) {
    loadWebResource(jsonURL, "GET", "application/json", (text) => callback(JSON.parse(text)));
}  

/**
 * Loads the text of a resource from a server
 * @param url The URL of the resource to be loaded
 * @param method The method to be used to load the resource (GET or POST)
 * @param mimeType The mime type of the resource
 * @param callback A function which will process the text of the resource after it has been loaded
 */
function loadWebResource(url: string, method: string, mimeType: string, callback: (text: any) => void) {
    let xobj = new XMLHttpRequest();
    xobj.overrideMimeType(mimeType);
    xobj.open(method, url, true);
    xobj.onreadystatechange = function() {
        if(xobj.readyState === 4 && xobj.status === 200) {
            callback(xobj.responseText);
        }
    }
    xobj.send();
}