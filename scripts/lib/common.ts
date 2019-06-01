
export interface Updatable {
    update(dt: number): void;
}

export interface Renderable {
    render(context: CanvasRenderingContext2D): void;
}

export interface RenderableAtPoint {
    renderAt(context: CanvasRenderingContext2D, point: Point): void;
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
