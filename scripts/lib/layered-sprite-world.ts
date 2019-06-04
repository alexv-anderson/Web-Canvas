import { InputAccumalator, SimpleInputAccumalator } from "./input.js";
import { Instance, InstanceConfig, InteractiveInstance, PassiveInstance } from "./instance.js";
import { Point, RenderableAtPoint } from "./common.js";
import { SpriteContainerConfig, SpriteContainer, ContainerManager } from "./container.js";
import { SpriteConfig, SpriteManager } from "./sprite.js";
import { LayeredWorld, LayeredWorldConfig, LayeredLayoutConfig } from "./layered-world.js";
import { Block, BlockGridLayer } from "./layer.js";

export interface SpriteMultilayerLayoutConfig<
    SLC extends SpriteLayerConfig,
    SMLCD extends SpriteMultilayerLayoutConfigDefaults> extends LayeredLayoutConfig<SLC, SMLCD> {

}

export interface SpriteMultilayerLayoutConfigDefaults {
    stepHeight?: number
    stepWidth?: number
}

export interface SpriteLayerConfig {
    step?: {
        height?: number,
        width?: number
    },
    sprites: SpriteLayerLocations,
    containers?: SpriteLayerLocations
}
interface SpriteLayerLocations {
    [key: string]: Array<Array<number>>
}

class SpriteContainerBlock<I extends Instance<RenderableAtPoint>> extends Block<I> {
    constructor(row: number, column: number, instance: I) {
        super(row, column);

        this._container = instance;
    }

    protected get contents(): I {
        return this._container;
    }

    private _container: I;
}

/**
 * Represents a layer of sprites which for the background/floor
 */
export class SpriteLayer extends BlockGridLayer<Instance<RenderableAtPoint>> {
    /**
     * Initializes the layer
     * @param config The configuration for the layer
     */
    constructor(config: SpriteLayerConfig, spriteManager: SpriteManager, construct: (key: string) => Instance<RenderableAtPoint>) {
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
                    new SpriteContainerBlock(
                        pair[0],
                        pair[1],
                        new PassiveInstance<SpriteContainer>({ seed: new SpriteContainer([key], spriteManager) })
                    )
                );
            }
        }

        if(config.containers) {
            for(let key in config.containers) {
                let pairs = config.containers[key];
                for(let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                    let pair = pairs[pairIndex];

                    this.addBlock(
                        new SpriteContainerBlock(
                            pair[0],
                            pair[1],
                            construct(key)
                        )
                    )
                }
            }
        }
    }
}

/**
 * Represents the configuration of a world with sprite layers an possibily Actors
 */
export interface LayeredSpriteWorldConfig<
    SMLC extends SpriteMultilayerLayoutConfig<SLC, SMLCD>,
    SMLCD extends SpriteMultilayerLayoutConfigDefaults,
    SLC extends SpriteLayerConfig> extends LayeredWorldConfig<SLC, SMLCD, SMLC>, SpriteConfig, SpriteContainerConfig {
    instances?: {
        passive?: {
            [key: string]: InstanceConfig<RenderableAtPoint>;
        };
        interactive?: {
            [key: string]: InstanceConfig<RenderableAtPoint>;
        };
    }
}

/**
 * Generic reperesentation of a world which is composed completely of sprites.
 */
export abstract class GenericPureSpriteWorld<
    C extends LayeredSpriteWorldConfig<SMLC, SMLCD, SLC>,
    IA extends InputAccumalator,
    SL extends SpriteLayer,
    SMLC extends SpriteMultilayerLayoutConfig<SLC, SMLCD>,
    SMLCD extends SpriteMultilayerLayoutConfigDefaults,
    SLC extends SpriteLayerConfig
    > extends LayeredWorld<C, SL, SLC, SMLCD, SMLC> {
    
    protected onConfigurationLoaded(config: C): void {

        config.spriteSources.forEach(source => this.spriteManager.loadSpriteSource(source));

        if(config.containers) {
            this.containerManager.fill(
                config,
                this.spriteManager
            );
        }

        if(config.instances) {
            if(config.instances.passive) {
                for(let key in config.instances.passive) {
                    let container = this.containerManager.getContainer(key);
                    if(container) {
                        let instanceConfig = config.instances.passive[key];
                        instanceConfig.seed = container;
                        this.passiveInstanceConfigMap.set(key, instanceConfig);
                    }
                }
            }

            if(config.instances.interactive) {
                for(let key in config.instances.interactive) {
                    let container = this.containerManager.getContainer(key);
                    if(container) {
                        let instanceConfig = config.instances.interactive[key];
                        instanceConfig.seed = container;
                        this.interactiveInstanceConfigMap.set(key, instanceConfig);
                    }
                }
            }
        }

        // Try to move this to top...
        super.onConfigurationLoaded(config);
    }

    protected constructLayer(config: SLC, defaults?: SMLCD): SL {
        return this.constructSpriteLayer(config, this.spriteManager, defaults);
    }

    protected constructPassiveInstance(key: string, config: InstanceConfig<RenderableAtPoint>): PassiveInstance<RenderableAtPoint> | never {
        throw new Error("No interactive instance could be created for the key: " + key);
    }
    protected constructInteractiveInstance(key: string, config: InstanceConfig<RenderableAtPoint>): InteractiveInstance<IA, RenderableAtPoint> | never {
        throw new Error("No interactive instance could be created for the key: " + key);
    }

    protected abstract constructSpriteLayer(config: SLC, spriteManager: SpriteManager, defaults?: SMLCD): SL;

    protected onUpdate(dt: number): void {
        super.onUpdate(dt);

        this.spriteManager.updateAllSprites(dt);

        this.containerManager.update(dt);
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
    public addAdHocSprite(key: string, center: Point): void {
        this.adhocSprites.push({
            key: key,
            center: center
        });
    }

    protected getInteractiveInstanceConfiguration(key: string): InstanceConfig<RenderableAtPoint> | undefined {
        return this.interactiveInstanceConfigMap.get(key);
    }

    private adhocSprites: Array<{ key: string, center: Point}> = [];

    private passiveInstanceConfigMap: Map<string, InstanceConfig<RenderableAtPoint>> = new Map<string, InstanceConfig<RenderableAtPoint>>();
    private interactiveInstanceConfigMap: Map<string, InstanceConfig<RenderableAtPoint>> = new Map<string, InstanceConfig<RenderableAtPoint>>();

    private spriteManager: SpriteManager = new SpriteManager();
    private containerManager: ContainerManager = new ContainerManager();
}

export interface SimpleMultilayeredSpriteWorldConfig extends LayeredSpriteWorldConfig<SimpleSpriteMultilayerLayoutConfig, SpriteMultilayerLayoutConfigDefaults, SpriteLayerConfig> {

}

export interface SimpleSpriteMultilayerLayoutConfig extends SpriteMultilayerLayoutConfig<SpriteLayerConfig, SpriteMultilayerLayoutConfigDefaults> {

}

/**
 * Use the simple configuration which should work in most cases
 */
export abstract class SimpleSpriteWorld extends GenericPureSpriteWorld<
    SimpleMultilayeredSpriteWorldConfig,
    SimpleInputAccumalator,
    SpriteLayer,
    SimpleSpriteMultilayerLayoutConfig,
    SpriteMultilayerLayoutConfigDefaults,
    SpriteLayerConfig> {
    constructor(canvas: HTMLCanvasElement, configURL: string) {
        super(canvas, configURL);

        this.ia = new SimpleInputAccumalator(canvas);
    }

    protected constructSpriteLayer(config: SpriteLayerConfig, spriteManager: SpriteManager, defaults?: SpriteMultilayerLayoutConfigDefaults): SpriteLayer {
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

        return new SpriteLayer(config, spriteManager, (key: string) => {
            let config = this.getInteractiveInstanceConfiguration(key);
            if(config) {
                return this.constructInteractiveInstance(key, config) as Instance<RenderableAtPoint>;
            }
            throw new Error("No configuration found for interactive instance " + key);
        });
    }

    protected onUpdate(dt: number) {
        super.onUpdate(dt);
    }

    protected get inputAccumalator(): SimpleInputAccumalator {
        return this.ia;
    }

    private ia: SimpleInputAccumalator;
}