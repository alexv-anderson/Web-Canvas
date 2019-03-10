
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

    public plus(dx: number, dy: number): Point {
        return new Point(this.x + dx, this.y + dy);
    }

    /**
     * The point's x-coordinate
     */
    public get x(): number {
        return this._x;
    }

    /**
     * The point's y-coordinate
     */
    public get y(): number {
        return this._y;
    }

    private _x: number;
    private _y: number;
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
            loadSpriteMap((spriteMap: SpriteMap) => {
                canvas.height = world.viewHeight;
                canvas.width = world.viewWidth;

                let context = canvas.getContext("2d");

                let ia = new InputAccumalator(canvas);

                let lastNow: number;

                function update() {
                    if(context === null) {
                        throw new Error("Could not load context for canvas");
                    }

                    let dt = 0;
                    if(lastNow === undefined) {
                        lastNow = performance.now();
                    } else {
                        let now = performance.now();
                        dt = now - lastNow;
                        lastNow = now;
                    }

                    context.clearRect(0, 0, canvas.width, canvas.height);

                    // Updated animated sprites
                    world.update(dt, spriteMap, ia);
                    ia.reset();

                    world.render(spriteMap, context);

                    window.requestAnimationFrame(update);
                }
                update();
            });
        });
    });
}