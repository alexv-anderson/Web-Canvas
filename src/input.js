import { Point } from "./common.js";
export class SimpleInputAccumalator {
    constructor(canvas) {
        this._arrowUpDown = false;
        this._arrowDownDown = false;
        this._arrowLeftDown = false;
        this._arrowRightDown = false;
        document.addEventListener("mousedown", (event) => {
            let rect = canvas.getBoundingClientRect();
            let clickPoint = new Point(event.clientX - rect.left, event.clientY - rect.top);
            if (clickPoint.x >= 0 && clickPoint.x <= canvas.width &&
                clickPoint.y >= 0 && clickPoint.y <= canvas.height) {
                this._mouseDownPoint = clickPoint;
            }
        });
        document.addEventListener("keydown", (event) => {
            if (event.keyCode == 38)
                this._arrowUpDown = true;
            else if (event.keyCode == 40)
                this._arrowDownDown = true;
            else if (event.keyCode == 37)
                this._arrowLeftDown = true;
            else if (event.keyCode == 39)
                this._arrowRightDown = true;
        });
        this.reset();
    }
    get mouseDown() {
        return this._mouseDownPoint !== undefined;
    }
    get mouseDownPoint() {
        return this._mouseDownPoint;
    }
    get arrowUpDown() {
        return this._arrowUpDown;
    }
    get arrowDownDown() {
        return this._arrowDownDown;
    }
    get arrowLeftDown() {
        return this._arrowLeftDown;
    }
    get arrowRightDown() {
        return this._arrowRightDown;
    }
    reset() {
        this._mouseDownPoint = undefined;
        this._arrowUpDown = false;
        this._arrowDownDown = false;
        this._arrowLeftDown = false;
        this._arrowRightDown = false;
    }
}
