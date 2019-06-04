
/**
 * Indicates an objects which expects incremental time-based updates
 */
export interface Updatable {
    /**
     * Called periodically to update the state of the object
     * @param dt Number of milliseconds which have passed since the last time this method was called
     */
    update(dt: number): void;
}

/**
 * Indicates an object which can be rendered on a 2D canvas
 */
export interface Renderable {
    /**
     * Called when the object should be rendered
     * @param context The 2D rendering context of the canvas
     */
    render(context: CanvasRenderingContext2D): void;
}

/**
 * Indicates an object which can be rendered at a point on a 2D canvas
 */
export interface RenderableAtPoint {
    /**
     * Called when the object should be rendered
     * @param context The 2D rendering context of the canvas
     * @param point The point where the object should be rendered
     */
    renderAt(context: CanvasRenderingContext2D, point: Point): void;
}

/**
 * Indicates an object which can be placed somewhere in a 2D plane
 */
export interface Placeable {
    /**
     * The objects current location
     */
    location: Point;

    /**
     * Changes the objects postion
     * @param dx The change in the object's x position
     * @param dy The change in the object's y position
     */
    move(dx: number, dy: number): void;
}

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

    /**
     * Returns a new point which is the result of change the x and y coordinates by the givne amounts
     * @param dx The change in the x-axis
     * @param dy The change in the y-axis
     */
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
