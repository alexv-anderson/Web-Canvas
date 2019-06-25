export class Point {
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }
    plus(dx, dy) {
        return new Point(this.x + dx, this.y + dy);
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
}
