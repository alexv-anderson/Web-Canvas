
import { loadJSON } from "../../node_modules/web-tools/javascript/web-loaders.js";

export interface FlatWorldConfig {
    view: {
        width: number,
        height: number
    };
}

/**
 * Reperesents everything on the canvas
 */
export abstract class FlatWorld<C extends FlatWorldConfig> {
    /**
     * Initializes the world
     * @param canvas The canvas
     * @param configURL The URL for the canvas configuration file
     */
    constructor(canvas: HTMLCanvasElement, configURL: string) {
        this.canvas = canvas;
        let context = canvas.getContext("2d");
        if(context == null) {
            throw Error("Could not initialize canvas");
        }

        this.context = context;


        loadJSON(configURL, (config: C) => this.onConfigurationLoaded(config));
    }

    /**
     * Start the world in motion
     */
    public play() {
        this.update();
        this.render();
        window.requestAnimationFrame(() => this.play());
    }

    /**
     * Updates everything in the world
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

        this.onUpdate(dt);
    }

    /**
     * Called when the world should be updated
     * @param dt Number of milliseconds which have passed since the last time this method was called
     */
    protected onUpdate(dt: number): void {
        
    }

    protected onConfigurationLoaded(config: C): void {
        this.canvas.width = config.view.width;
        this.canvas.height = config.view.height;
    }

    /**
     * Renders the canvas
     */
    public render(): void {
        this.context.clearRect(0, 0, this.width, this.height);
    }

    /**
     * The height of the canvas
     */
    public get height(): number {
        return this.canvas.height;
    }
    /**
     * The width of the canvas
     */
    public get width(): number {
        return this.canvas.width;
    }
    /**
     * The drawing context of the world's canvas
     */
    protected get drawingContext(): CanvasRenderingContext2D {
        return this.context;
    }

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    private lastNow?: number;
}