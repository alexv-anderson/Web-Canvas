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