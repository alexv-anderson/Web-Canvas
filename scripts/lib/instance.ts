
import { Placeable, Point, Renderable, RenderableAtPoint, Updatable } from "./common.js";
import { InputAccumalator } from "./input.js";

export interface InstanceConfig<IP extends InstanceProperties, R extends RenderableAtPoint> {
    seed: R;
    properties?: IP;
}
export interface InstanceProperties {

}

export interface InteractiveInstanceConfig<IA extends InputAccumalator, IP extends InstanceProperties, R extends RenderableAtPoint> extends InstanceConfig<IP, R> {
    inputAccumalator: IA;
}

export abstract class Instance<IP extends InstanceProperties, R extends RenderableAtPoint> implements Placeable, Renderable, Updatable {
    constructor(config: InstanceConfig<IP, R>) {
        this._seed = config.seed;

        this._location = new Point(0, 0);

        this.onProperiesLoaded(config.properties);
    }

    public onProperiesLoaded(properties?: IP) {

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

export class PassiveInstance<IP extends InstanceProperties, R extends RenderableAtPoint> extends Instance<IP, R> {

}

export class InteractiveInstance<IA extends InputAccumalator, IP extends InstanceProperties, R extends RenderableAtPoint> extends Instance<IP, R> {
    constructor(config: InteractiveInstanceConfig<IA, IP, R>) {
        super(config);

        this._inputAccumalator = config.inputAccumalator;
    }

    protected get inputAccumalator(): IA {
        return this._inputAccumalator;
    }

    private _inputAccumalator: IA;
}
