import { loadJSON } from "web-tools";
export class FlatWorld {
    constructor(canvas, configURL) {
        this.canvas = canvas;
        let context = canvas.getContext("2d");
        if (context == null) {
            throw Error("Could not initialize canvas");
        }
        this.context = context;
        loadJSON(configURL, (config) => this.onConfigurationLoaded(config));
    }
    play() {
        this.update();
        this.render();
        window.requestAnimationFrame(() => this.play());
    }
    update() {
        let dt = 0;
        if (this.lastNow === undefined) {
            this.lastNow = performance.now();
        }
        else {
            let now = performance.now();
            dt = now - this.lastNow;
            this.lastNow = now;
        }
        this.onUpdate(dt);
    }
    onUpdate(dt) {
    }
    onConfigurationLoaded(config) {
        this.canvas.width = config.view.width;
        this.canvas.height = config.view.height;
    }
    render() {
        this.context.clearRect(0, 0, this.width, this.height);
    }
    get height() {
        return this.canvas.height;
    }
    get width() {
        return this.canvas.width;
    }
    get drawingContext() {
        return this.context;
    }
}
