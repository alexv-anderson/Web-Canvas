import { SimpleInputAccumalator } from "./input.js";
import { PassiveInstance, InstanceManager } from "./instance.js";
import { SpriteGroup, SpriteGroupManager } from "./group.js";
import { SpriteManager } from "./sprite.js";
import { LayeredFlatWorld } from "./layered-flat-world.js";
import { Block, BlockGridLayer } from "./layer.js";
class InstanceBlock extends Block {
    constructor(row, column, instance) {
        super(row, column);
        this._group = instance;
    }
    get contents() {
        return this._group;
    }
}
export class InstanceBlockLayer extends BlockGridLayer {
    constructor(config, spriteManager, constructInteractiveInstance, constructPassiveInstance) {
        let stepHeight = 32;
        let stepWidth = 32;
        if (config.step) {
            stepHeight = config.step.height || stepHeight;
            stepWidth = config.step.width || stepWidth;
        }
        super(stepHeight, stepWidth);
        for (let key in config.sprites) {
            let pairs = config.sprites[key];
            for (let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                let pair = pairs[pairIndex];
                this.addBlock(new InstanceBlock(pair[0], pair[1], new PassiveInstance({ seed: new SpriteGroup([key], spriteManager) })));
            }
        }
        if (config.instances) {
            if (config.instances.interactive) {
                for (let key in config.instances.interactive) {
                    let pairs = config.instances.interactive[key];
                    for (let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                        let pair = pairs[pairIndex];
                        this.addBlock(new InstanceBlock(pair[0], pair[1], constructInteractiveInstance(key)));
                    }
                }
            }
            if (config.instances.passive) {
                for (let key in config.instances.passive) {
                    let pairs = config.instances.passive[key];
                    for (let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                        let pair = pairs[pairIndex];
                        this.addBlock(new InstanceBlock(pair[0], pair[1], constructPassiveInstance(key)));
                    }
                }
            }
        }
    }
}
export class GenericSpriteLayeredFlatWorld extends LayeredFlatWorld {
    constructor() {
        super(...arguments);
        this.adhocSprites = [];
        this.spriteManager = new SpriteManager();
        this.groupManager = new SpriteGroupManager();
        this.instanceManager = new InstanceManager();
    }
    onConfigurationLoaded(config) {
        config.sprites.sources.forEach(source => this.spriteManager.loadSpriteSource(source));
        if (config.sprites.groups) {
            this.groupManager.fill(config.sprites.groups);
        }
        if (config.sprites.instances) {
            this.instanceManager.fill(config.sprites.instances);
        }
        super.onConfigurationLoaded(config);
    }
    onConstructLayer(config, defaults) {
        return this.onConstructSpriteLayer(config, this.spriteManager, defaults);
    }
    onConstructPassiveInstance(key, config) {
        throw new Error("No interactive instance could be created for the key: " + key);
    }
    onConstructInteractiveInstance(key, config) {
        throw new Error("No interactive instance could be created for the key: " + key);
    }
    onUpdate(dt) {
        super.onUpdate(dt);
        this.spriteManager.updateAllSprites(dt);
        this.groupManager.update(dt);
    }
    render() {
        super.render();
        this.adhocSprites.forEach((as) => {
            this.spriteManager.renderAt(this.drawingContext, as.key, as.center);
        });
    }
    addAdHocSprite(key, center) {
        this.adhocSprites.push({
            key: key,
            center: center
        });
    }
    getInteractiveInstanceConfiguration(key) {
        return this.instanceManager.assembleInteractiveInstanceConfig(key, this.inputAccumalator, properties => this.groupManager.buildGroup(properties.groupKey, this.spriteManager));
    }
    getPassiveInstanceConfiguration(key) {
        return this.instanceManager.assemblePassiveInstanceConfig(key, properties => this.groupManager.buildGroup(properties.groupKey, this.spriteManager));
    }
}
export class SimpleSpriteLayeredFlatWorld extends GenericSpriteLayeredFlatWorld {
    constructor(canvas, configURL) {
        super(canvas, configURL);
        this.ia = new SimpleInputAccumalator(canvas);
    }
    onConstructSpriteLayer(config, spriteManager, defaults) {
        if (defaults !== undefined) {
            if (config.step === undefined) {
                config.step = {
                    height: defaults.stepHeight,
                    width: defaults.stepWidth
                };
            }
            else {
                config.step.height = config.step.height || defaults.stepHeight;
                config.step.width = config.step.width || defaults.stepWidth;
            }
        }
        return new InstanceBlockLayer(config, spriteManager, (key) => {
            let config = this.getInteractiveInstanceConfiguration(key);
            if (config) {
                return this.onConstructInteractiveInstance(key, config);
            }
            throw new Error("No configuration found for interactive instance " + key);
        }, (key) => {
            let config = this.getPassiveInstanceConfiguration(key);
            if (config) {
                return this.onConstructPassiveInstance(key, config);
            }
            throw new Error("No configuration found for interactive instance " + key);
        });
    }
    onUpdate(dt) {
        super.onUpdate(dt);
    }
    get inputAccumalator() {
        return this.ia;
    }
}
