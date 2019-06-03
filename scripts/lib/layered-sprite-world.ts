import { InputAccumalator, SimpleInputAccumalator } from "./input.js";
import { Point, Placeable, Renderable, Updatable, RenderableAtPoint } from "./common.js";
import { SpriteContainerConfig, SpriteContainer, ContainerCabinet } from "./container.js";
import { SpriteConfig, SpriteMap, MultiFrameSprite } from "./sprite.js";
import { LayeredWorld, LayeredWorldConfig, LayerConfig } from "./layered-world.js";
import { Block, BlockGridLayer } from "./layer.js";

export interface SpriteMultilayerLayoutConfig<SLC extends SpriteLayerConfig, SMLCD extends SpriteMultilayerLayoutConfigDefaults> extends LayerConfig {
    defaults?: SMLCD,
    index: Array<SLC>,
    arrangement?: Array<number>
};

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
    constructor(config: SpriteLayerConfig, spriteMap: SpriteMap, construct: (key: string) => Instance<RenderableAtPoint>) {
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
                        new PassiveInstance<SpriteContainer>({ seed: new SpriteContainer([key], spriteMap) })
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

/**
 * Represents the configuration of a world with sprite layers an possibily Actors
 */
export interface LayeredSpriteWorldConfig<SMLC extends SpriteMultilayerLayoutConfig<SLC, SMLCD>, SMLCD extends SpriteMultilayerLayoutConfigDefaults, SLC extends SpriteLayerConfig> extends LayeredWorldConfig<SMLC>, SpriteConfig, SpriteContainerConfig {
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
    > extends LayeredWorld<C, SL, SMLC> {
    
    protected onConfigurationLoaded(config: C): void {

        config.spriteSources.forEach(source => this.spriteMap.loadSpriteSource(source));

        if(config.containers) {
            this.containerCabinet.fill(
                config,
                this.spriteMap
            );
        }

        if(config.instances) {
            if(config.instances.passive) {
                for(let key in config.instances.passive) {
                    let container = this.containerCabinet.getContainer(key);
                    if(container) {
                        let instanceConfig = config.instances.passive[key];
                        instanceConfig.seed = container;
                        this.passiveInstanceConfigMap.set(key, instanceConfig);
                    }
                }
            }

            if(config.instances.interactive) {
                for(let key in config.instances.interactive) {
                    let container = this.containerCabinet.getContainer(key);
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

    protected onLayerConfigurationLoaded(config: SMLC): void {
        super.onLayerConfigurationLoaded(config);

        let constructedLayers = config.index.map(layerConfig => this.constructSpriteLayer(
            layerConfig,
            this.spriteMap,
            config.defaults
        ));

        if(config.arrangement) {
            config.arrangement.forEach(layerIndex => this.addLayer(constructedLayers[layerIndex]));
        } else {
            constructedLayers.forEach(layer => this.addLayer(layer));
        }
    }

    protected constructPassiveInstance(key: string, config: InstanceConfig<RenderableAtPoint>): PassiveInstance<RenderableAtPoint> | never {
        throw new Error("No interactive instance could be created for the key: " + key);
    }
    protected constructInteractiveInstance(key: string, config: InstanceConfig<RenderableAtPoint>): InteractiveInstance<IA, RenderableAtPoint> | never {
        throw new Error("No interactive instance could be created for the key: " + key);
    }

    protected abstract constructSpriteLayer(config: SLC, spriteMap: SpriteMap, defaults?: SMLCD): SL;

    protected onUpdate(dt: number): void {
        super.onUpdate(dt);

        this.spriteMap.updateAllSprites(dt);

        this.containerCabinet.update(dt);
    }

    protected abstract get inputAccumalator(): IA;

    /**
     * Renders the world on the given canvas
     */
    public render(): void {
        super.render();

        this.adhocSprites.forEach((as: { key: string, center: Point}) => {
            this.spriteMap.renderAt(this.drawingContext, as.key, as.center)
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

    protected getSprite(key: string): MultiFrameSprite | undefined {
        return this.spriteMap.getSprite(key);
    }

    protected getInteractiveInstanceConfiguration(key: string): InstanceConfig<RenderableAtPoint> | undefined {
        return this.interactiveInstanceConfigMap.get(key);
    }

    private adhocSprites: Array<{ key: string, center: Point}> = [];

    private passiveInstanceConfigMap: Map<string, InstanceConfig<RenderableAtPoint>> = new Map<string, InstanceConfig<RenderableAtPoint>>();
    private interactiveInstanceConfigMap: Map<string, InstanceConfig<RenderableAtPoint>> = new Map<string, InstanceConfig<RenderableAtPoint>>();

    private spriteMap: SpriteMap = new SpriteMap();
    private containerCabinet: ContainerCabinet = new ContainerCabinet();
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

    protected constructSpriteLayer(config: SpriteLayerConfig, spriteMap: SpriteMap, defaults?: SpriteMultilayerLayoutConfigDefaults): SpriteLayer {
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

        return new SpriteLayer(config, spriteMap, (key: string) => {
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