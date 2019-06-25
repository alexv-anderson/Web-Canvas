import { Point } from "./common.js";
export class Instance {
    constructor(config) {
        this._seed = config.seed;
        this._location = new Point(0, 0);
        this.onProperiesLoaded(config.properties);
    }
    onProperiesLoaded(properties) {
    }
    get seed() {
        return this._seed;
    }
    update(dt) {
    }
    render(context) {
        this.seed.renderAt(context, this.location);
    }
    get location() {
        return this._location;
    }
    move(dx, dy) {
        this._location = this._location.plus(dx, dy);
    }
}
export class PassiveInstance extends Instance {
    constructor(config) {
        super(config);
    }
}
export class InteractiveInstance extends Instance {
    constructor(config) {
        super(config);
        this._inputAccumalator = config.inputAccumalator;
    }
    get inputAccumalator() {
        return this._inputAccumalator;
    }
}
export class InstanceManager {
    constructor() {
        this.passiveInstancePropertiesMap = new Map();
        this.interactiveInstancePropertiesMap = new Map();
    }
    fill(config) {
        if (config.passive) {
            for (let key in config.passive) {
                let instanceProperties = config.passive[key];
                this.passiveInstancePropertiesMap.set(key, instanceProperties);
            }
        }
        if (config.interactive) {
            for (let key in config.interactive) {
                let instanceConfig = config.interactive[key];
                this.interactiveInstancePropertiesMap.set(key, instanceConfig);
            }
        }
    }
    assembleInteractiveInstanceConfig(key, inputAccumalator, getRenderableAtPoint) {
        let properties = this.interactiveInstancePropertiesMap.get(key);
        if (properties) {
            let seed = getRenderableAtPoint(properties);
            if (seed) {
                return {
                    inputAccumalator: inputAccumalator,
                    seed: seed,
                    properties: properties
                };
            }
        }
    }
    assemblePassiveInstanceConfig(key, getRenderableAtPoint) {
        let properties = this.passiveInstancePropertiesMap.get(key);
        if (properties) {
            let seed = getRenderableAtPoint(properties);
            if (seed) {
                return {
                    seed: seed,
                    properties: properties
                };
            }
        }
    }
}
