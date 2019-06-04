
import { Placeable, Point, Renderable, RenderableAtPoint, Updatable } from "./common.js";
import { InputAccumalator } from "./input.js";

export interface InstanceConfig<IP extends InstanceProperties, R extends RenderableAtPoint> {
    seed: R;
    properties?: IP;
}
export interface InstanceProperties {

}
export interface InstanceConfigurations<IP extends InstanceProperties> {
    instances?: {
        passive?: {
            [key: string]: IP;
        };
        interactive?: {
            [key: string]: IP;
        };
    }
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

export class InstanceManager<IA extends InputAccumalator, IP extends InstanceProperties, R extends RenderableAtPoint> {
    fill(config: InstanceConfigurations<IP>): void {
        if(config.instances) {
            if(config.instances.passive) {
                for(let key in config.instances.passive) {
                    let instanceProperties = config.instances.passive[key];
                    this.passiveInstancePropertiesMap.set(key, instanceProperties);
                }
            }

            if(config.instances.interactive) {
                for(let key in config.instances.interactive) {
                    let instanceConfig = config.instances.interactive[key];
                    this.interactiveInstancePropertiesMap.set(key, instanceConfig);
                }
            }
        }
    }

    public assembleInteractiveInstanceConfig(key: string, inputAccumalator: IA, getRenderableAtPoint: (properties: IP) => R | undefined): InteractiveInstanceConfig<IA, IP, R> | undefined {
        let properties = this.interactiveInstancePropertiesMap.get(key);
        if(properties) {
            let seed = getRenderableAtPoint(properties);
            if(seed) {
                return {
                    inputAccumalator: inputAccumalator,
                    seed: seed,
                    properties: properties
                };
            }
        }
    }

    private passiveInstancePropertiesMap: Map<string, IP> = new Map<string, IP>();
    private interactiveInstancePropertiesMap: Map<string, IP> = new Map<string, IP>();
}