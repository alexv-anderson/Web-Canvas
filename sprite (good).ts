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
        this.width = width;
        this.height = height;
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

    private getFrameWidth(): number {
        if(this.horizontal) {
            return this.width / this.numberOfFrames;
        } else {
            return this.width;
        }
    }

    private getFrameHeight(): number {
        if(this.horizontal) {
            return this.height;
        } else {
            return this.height / this.numberOfFrames;
        }
    }

    private image: HTMLImageElement;

    private numberOfFrames: number;
    private frameIndex: number;
    private numberOfUpdatesPerFrame: number;

    private height: number;
    private width: number;

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

    private map: Map<string, Sprite>;
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
    getJSON(getHostURL() + "sprite-config.json", (json) => {

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

/**
 * Begins loading everything once the body of the document has loaded
 */
function onBodyLoad() {
    // Get the map with all of the sprite information
    getSpriteMap((spriteMap: SpriteMap) => {
        // Get the information for the background layout
        getJSON(getHostURL() + "background.json", (json: { layout: Array<string> }) => {

            // Get the canvas
            let canvas = document.getElementById("theCanvas") as HTMLCanvasElement;

            // Start update loop
            setInterval(
                () => {
                    // Updated animated sprites
                    spriteMap.updateAllSprites();

                    // Draw sprites
                    for(let i = 0; i < json.layout.length; i++) {
                        for(let j = 0; j < json.layout[i].length; j++) {
                            spriteMap.render(
                                canvas.getContext("2d"),
                                json.layout[i][j],   // sprite key
                                j * 32,     // x-coordinate (row)
                                i * 32      // y-coordinate (column)
                            );
                        }
                    }

                    spriteMap.render(
                        canvas.getContext("2d"),
                        "rsl",
                        2 * 32,
                        0 * 32
                    )
                },
                500 // milliseconds
            );
        });
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
function getJSON(jsonURL: string, callback: (json: any) => void) {
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


//document.addEventListener("keydown", (event: KeyboardEvent) => { });