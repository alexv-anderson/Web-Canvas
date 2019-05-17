
import { WorldConfig } from "./canvas-interface.js";
import { loadJSON } from "./general-lib.js";

/**
 * Represents a point in 2D Cartesian space
 */
export class Point {
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
export class InputAccumalator {
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
 * Reperesents everything on the canvas
 */
export abstract class World<C extends WorldConfig> {
    /**
     * Initializes the world
     * @param canvas The canvas on which the world should be drawn
     */
    constructor(canvas: HTMLCanvasElement, configURL: string) {
        this.setCanvas(canvas);

        loadJSON(configURL, (config: C) => {
            this.canvas.width = config.view.width;
            this.canvas.height = config.view.height;
            this.onConfigurationLoaded(config);
        });
    }

    /**
     * Start the world in motion
     */
    public start() {
        this.update();
        this.render();
        window.requestAnimationFrame(() => this.start());
    }

    /**
     * Updates everything in the world
     * @param dt Number of milliseconds which have passed since the last time this method was called
     * @param inputAccumalator Input collected from the user
     */
    public update() {
        let dt = 0;
        if(this.lastNow === undefined) {
            this.lastNow = performance.now();
        } else {
            let now = performance.now();
            dt = now - this.lastNow;
            this.lastNow = now;
        }

        this.context.clearRect(0, 0, this.viewWidth, this.viewHeight);

        this.onUpdate(dt, this.inputAccumalator);

        this.inputAccumalator.reset();
    }

    /**
     * Called when the world should be updated
     * @param dt Number of milliseconds which have passed since the last time this method was called
     * @param inputAccumalator Input collected from the user
     */
    public abstract onUpdate(dt: number, inputAccumalator: InputAccumalator): void;

    protected abstract onConfigurationLoaded(config: C): void;

    /**
     * Gets the input accumalator for this world
     */
    protected abstract get inputAccumalator(): InputAccumalator;

    /**
     * Renders the world
     * @param spriteMap A map from keys to sprites
     * @param context The rendering context of the canvas on which the world should be rendered
     */
    public render(): void {
        this.lines.forEach(line => {
            this.drawingContext.save();
            this.drawingContext.beginPath();
            this.drawingContext.moveTo(line.x1, line.y1);
            this.drawingContext.lineTo(line.x2, line.y2);
            this.drawingContext.lineWidth = line.width || this.drawingContext.lineWidth;
            this.drawingContext.strokeStyle = line.style || this.drawingContext.strokeStyle;
            this.drawingContext.stroke();
            this.drawingContext.restore();
        });
    }

    /**
     * Adds a line on top of the world
     * @param x1 The x-coordinate of the first point
     * @param y1 The y-coordinate of the first point
     * @param x2 The x-coordinate of the second point
     * @param y2 The y-coordinate of the second point
     */
    protected addLine(x1: number, y1: number, x2: number, y2: number): void
    /**
     * Adds a line on top of the world
     * @param x1 The x-coordinate of the first point
     * @param y1 The y-coordinate of the first point
     * @param x2 The x-coordinate of the second point
     * @param y2 The y-coordinate of the second point
     * @param style The style of the line
     * @param width The width of the line
     */
    protected addLine(x1: number, y1: number, x2: number, y2: number, style: string, width: number): void
    /**
     * Adds a line on top of the world
     * @param x1 The x-coordinate of the first point
     * @param y1 The y-coordinate of the first point
     * @param x2 The x-coordinate of the second point
     * @param y2 The y-coordinate of the second point
     * @param style The style of the line
     * @param width The width of the line
     */
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

    /**
     * The height of the world's canvas
     */
    public get viewHeight(): number {
        return this.canvas.height;
    }
    /**
     * The width of the world's canvas
     */
    public get viewWidth(): number {
        return this.canvas.width;
    }
    /**
     * The drawing context of the world's canvas
     */
    protected get drawingContext(): CanvasRenderingContext2D {
        return this.context;
    }

    private setCanvas(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        let context = canvas.getContext("2d");
        if(context == null)
            throw Error("Could not initialize canvas");

        this.context = context;
    }

    private lines: Array<{x1: number, y1: number, x2: number, y2: number, style?: string, width?: number}> = [];

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    private lastNow: number;
}