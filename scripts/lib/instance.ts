
import { Placeable, Point, Renderable, RenderableAtPoint, Updatable } from "./common.js";
import { InputAccumalator } from "./input.js";

export interface InstanceConfig<R extends RenderableAtPoint> {
    seed: R;
}

export abstract class Instance<R extends RenderableAtPoint> implements Placeable, Renderable, Updatable {
    constructor(config: InstanceConfig<R>) {
        this._seed = config.seed;

        this._location = new Point(0, 0);
    }

    public get seed(): R {
        return this._seed;
    }

    public update(dt: number): void {

    }

    public render(context: CanvasRenderingContext2D): void {
        this.seed.renderAt(context, this.location);
    }

    public get location(): Point {
        return this._location;
    }
    public move(dx: number, dy: number): void {
        this._location = this._location.plus(dx, dy);
    }
    
    private _seed: R;
    private _location: Point;
}

export class PassiveInstance<R extends RenderableAtPoint> extends Instance<R> {

}

export class InteractiveInstance<IA extends InputAccumalator, R extends RenderableAtPoint> extends Instance<R> {
    constructor(config: InstanceConfig<R>, inputAccumalator: IA) {
        super(config);

        this._inputAccumalator = inputAccumalator;
    }

    protected get inputAccumalator(): IA {
        return this._inputAccumalator;
    }

    private _inputAccumalator: IA;
}
