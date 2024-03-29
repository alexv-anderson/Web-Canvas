
import { InputAccumalator, SimpleInputAccumalator } from "./input.js";
import { Instance, InteractiveInstance, InteractiveInstanceConfig, PassiveInstance, PassiveInstanceConfig, InstanceProperties, InstanceConfigurations, InstanceManager } from "./instance.js";
import { Point, RenderableAtPoint } from "./common.js";
import { SpriteGroupConfig, SpriteGroup, SpriteGroupManager, GroupConfigurations } from "./group.js";
import { SpriteSheetSource, SpriteManager } from "./sprite.js";
import { LayeredFlatWorld, LayeredFlatWorldConfig, LayeredLayoutConfig } from "./layered-flat-world.js";
import { Block, BlockGridLayer } from "./layer.js";

export interface SpriteMultilayerLayoutConfig<
    SLC extends SpriteLayerConfig,
    SMLCD extends SpriteMultilayerLayoutConfigDefaults> extends LayeredLayoutConfig<SLC, SMLCD> {

}

export interface SpriteMultilayerLayoutConfigDefaults {
    stepHeight?: number;
    stepWidth?: number;
}

export interface SpriteLayerConfig {
    step?: {
        height?: number;
        width?: number;
    };
    sprites: SpriteLayerLocations;
    instances?: {
        passive?: SpriteLayerLocations;
        interactive?: SpriteLayerLocations;
    };
}
interface SpriteLayerLocations {
    [key: string]: Array<Array<number>>;
}

export interface KeyedInstanceProperties extends InstanceProperties {
    groupKey: string;
}

class InstanceBlock<I extends Instance<KIP, RenderableAtPoint>, KIP extends KeyedInstanceProperties> extends Block<I> {
    constructor(row: number, column: number, instance: I) {
        super(row, column);

        this._group = instance;
    }

    protected get contents(): I {
        return this._group;
    }

    private _group: I;
}

/**
 * Represents a layer of sprites which for the background/floor
 */
export class InstanceBlockLayer<IA extends InputAccumalator, KIP extends KeyedInstanceProperties> extends BlockGridLayer<Instance<KIP, RenderableAtPoint>> {
    /**
     * Initializes the layer
     * @param config The configuration for the layer
     */
    constructor(
        config: SpriteLayerConfig,
        spriteManager: SpriteManager,
        constructInteractiveInstance: (key: string) => InteractiveInstance<IA, KIP, RenderableAtPoint>,
        constructPassiveInstance: (key: string) => PassiveInstance<KIP, RenderableAtPoint>) {

        let stepHeight = 32;
        let stepWidth = 32;

        if(config.step) {
            stepHeight = config.step.height || stepHeight;
            stepWidth = config.step.width || stepWidth;
        }

        super(stepHeight, stepWidth);

        for(let key in config.sprites) {
            let pairs = config.sprites[key];
            for(let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                let pair = pairs[pairIndex];
                
                this.addBlock(
                    new InstanceBlock(
                        pair[0],
                        pair[1],
                        new PassiveInstance<KIP, SpriteGroup>({ seed: new SpriteGroup([key], spriteManager) })
                    )
                );
            }
        }

        if(config.instances) {
            if(config.instances.interactive) {
                for(let key in config.instances.interactive) {
                    let pairs = config.instances.interactive[key];
                    for(let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                        let pair = pairs[pairIndex];

                        this.addBlock(
                            new InstanceBlock(
                                pair[0],
                                pair[1],
                                constructInteractiveInstance(key)
                            )
                        );
                    }
                }
            }

            if(config.instances.passive) {
                for(let key in config.instances.passive) {
                    let pairs = config.instances.passive[key];
                    for(let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                        let pair = pairs[pairIndex];

                        this.addBlock(
                            new InstanceBlock(
                                pair[0],
                                pair[1],
                                constructPassiveInstance(key)
                            )
                        );
                    }
                }
            }
        }
    }
}

/**
 * Represents the configuration of a world with sprite layers an possibily Actors
 */
export interface LayeredSpriteWorldConfig<
    IP extends InstanceProperties,
    SMLC extends SpriteMultilayerLayoutConfig<SLC, SMLCD>,
    SMLCD extends SpriteMultilayerLayoutConfigDefaults,
    SLC extends SpriteLayerConfig> extends LayeredFlatWorldConfig<SLC, SMLCD, SMLC> {
        sprites: {
            sources: Array<SpriteSheetSource>;
            groups?: GroupConfigurations<SpriteGroupConfig>;
            instances?: InstanceConfigurations<IP>;
        };
}

/**
 * Generic reperesentation of a world which is composed completely of sprites.
 */
export abstract class GenericSpriteLayeredFlatWorld<
    C extends LayeredSpriteWorldConfig<KIP, SMLC, SMLCD, SLC>,
    IA extends InputAccumalator,
    KIP extends KeyedInstanceProperties,
    SL extends InstanceBlockLayer<IA, KIP>,
    SMLC extends SpriteMultilayerLayoutConfig<SLC, SMLCD>,
    SMLCD extends SpriteMultilayerLayoutConfigDefaults,
    SLC extends SpriteLayerConfig
    > extends LayeredFlatWorld<C, SL, SLC, SMLCD, SMLC> {
    
    protected onConfigurationLoaded(config: C): void {

        config.sprites.sources.forEach(source => this.spriteManager.loadSpriteSource(source));

        if(config.sprites.groups) {
            this.groupManager.fill(config.sprites.groups);
        }

        if(config.sprites.instances) {
            this.instanceManager.fill(config.sprites.instances);
        }

        super.onConfigurationLoaded(config);
    }

    protected onConstructLayer(config: SLC, defaults?: SMLCD): SL {
        return this.onConstructSpriteLayer(config, this.spriteManager, defaults);
    }

    protected onConstructPassiveInstance(key: string, config: PassiveInstanceConfig<KIP, RenderableAtPoint>): PassiveInstance<KIP, RenderableAtPoint> | never {
        throw new Error("No interactive instance could be created for the key: " + key);
    }
    protected onConstructInteractiveInstance(key: string, config: InteractiveInstanceConfig<IA, KIP, RenderableAtPoint>): InteractiveInstance<IA, KIP, RenderableAtPoint> | never {
        throw new Error("No interactive instance could be created for the key: " + key);
    }

    protected abstract onConstructSpriteLayer(config: SLC, spriteManager: SpriteManager, defaults?: SMLCD): SL;

    protected onUpdate(dt: number): void {
        super.onUpdate(dt);

        this.spriteManager.updateAllSprites(dt);

        this.groupManager.update(dt);
    }

    protected abstract get inputAccumalator(): IA;

    /**
     * Renders the world on the given canvas
     */
    public render(): void {
        super.render();

        this.adhocSprites.forEach((as: { key: string, center: Point}) => {
            this.spriteManager.renderAt(this.drawingContext, as.key, as.center)
        });
    }

    /**
     * Adds a sprite on top of the world's layers
     * @param key The key for the sprite in the SpriteMap
     * @param center The center point of the sprite in the world
     */
    protected addAdHocSprite(key: string, center: Point): void {
        this.adhocSprites.push({
            key: key,
            center: center
        });
    }

    protected getInteractiveInstanceConfiguration(key: string): InteractiveInstanceConfig<IA, KIP, RenderableAtPoint> | undefined {
        return this.instanceManager.assembleInteractiveInstanceConfig(
            key,
            this.inputAccumalator,
            properties => this.groupManager.buildGroup(properties.groupKey, this.spriteManager)
        );
    }
    protected getPassiveInstanceConfiguration(key: string): PassiveInstanceConfig<KIP, RenderableAtPoint> | undefined {
        return this.instanceManager.assemblePassiveInstanceConfig(
            key,
            properties => this.groupManager.buildGroup(properties.groupKey, this.spriteManager)
        );
    }

    private adhocSprites: Array<{ key: string, center: Point}> = [];

    private spriteManager: SpriteManager = new SpriteManager();
    private groupManager: SpriteGroupManager<SpriteGroupConfig> = new SpriteGroupManager<SpriteGroupConfig>();
    private instanceManager: InstanceManager<IA, KIP, RenderableAtPoint> = new InstanceManager<IA, KIP, RenderableAtPoint>();
}

export interface SimpleMultilayeredSpriteWorldConfig extends LayeredSpriteWorldConfig<KeyedInstanceProperties, SimpleSpriteMultilayerLayoutConfig, SpriteMultilayerLayoutConfigDefaults, SpriteLayerConfig> {

}

export interface SimpleSpriteMultilayerLayoutConfig extends SpriteMultilayerLayoutConfig<SpriteLayerConfig, SpriteMultilayerLayoutConfigDefaults> {

}

/**
 * Use the simple configuration which should work in most cases
 */
export abstract class SimpleSpriteLayeredFlatWorld extends GenericSpriteLayeredFlatWorld<
    SimpleMultilayeredSpriteWorldConfig,
    SimpleInputAccumalator,
    KeyedInstanceProperties,
    InstanceBlockLayer<SimpleInputAccumalator, KeyedInstanceProperties>,
    SimpleSpriteMultilayerLayoutConfig,
    SpriteMultilayerLayoutConfigDefaults,
    SpriteLayerConfig> {
    constructor(canvas: HTMLCanvasElement, configURL: string) {
        super(canvas, configURL);

        this.ia = new SimpleInputAccumalator(canvas);
    }

    protected onConstructSpriteLayer(config: SpriteLayerConfig, spriteManager: SpriteManager, defaults?: SpriteMultilayerLayoutConfigDefaults): InstanceBlockLayer<SimpleInputAccumalator, any> {
        if(defaults !== undefined) {
            if(config.step === undefined) {
                config.step = {
                    height: defaults.stepHeight,
                    width: defaults.stepWidth
                };
            } else {
                config.step.height = config.step.height || defaults.stepHeight;
                config.step.width = config.step.width || defaults.stepWidth;
            }
        }

        return new InstanceBlockLayer(config, spriteManager,
            (key: string) => {
                let config = this.getInteractiveInstanceConfiguration(key);
                if(config) {
                    return this.onConstructInteractiveInstance(key, config);
                }
                throw new Error("No configuration found for interactive instance " + key);
            },
            (key: string) => {
                let config = this.getPassiveInstanceConfiguration(key);
                if(config) {
                    return this.onConstructPassiveInstance(key, config);
                }
                throw new Error("No configuration found for interactive instance " + key);
            }
        );
    }

    protected onUpdate(dt: number) {
        super.onUpdate(dt);
    }

    protected get inputAccumalator(): SimpleInputAccumalator {
        return this.ia;
    }

    private ia: SimpleInputAccumalator;
}