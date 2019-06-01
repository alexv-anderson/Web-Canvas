import { InputAccumalator, SimpleInputAccumalator } from "./input.js";
import { Point } from "./common.js";
import { SpriteConfig, SpriteMap, MultiFrameSprite, SpriteContainer, InteractiveSpriteContainer } from "./sprite.js";
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
    sprites: SpriteLayerLocations
}
interface SpriteLayerLocations {
    [key: string]: Array<Array<number>>
}

class SpriteContainerBlock extends Block<SpriteContainer> {
    constructor(key: string, row: number, column: number, spriteMap: SpriteMap) {
        super(row, column);

        this._container = new SpriteContainer({key: key, spriteMap: spriteMap});
    }

    protected get contents(): SpriteContainer {
        return this._container;
    }

    private _container: SpriteContainer;
}

/**
 * Represents a layer of sprites which for the background/floor
 */
export class SpriteLayer extends BlockGridLayer<SpriteContainer> {
    /**
     * Initializes the layer
     * @param config The configuration for the layer
     */
    constructor(config: SpriteLayerConfig, spriteMap: SpriteMap) {
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
                        key,
                        pair[0],
                        pair[1],
                        spriteMap
                    )
                );
            }
        }
    }
}

/**
 * Represtnes the configuration for an actor which is represented by sprites
 */
export interface ActorConfig {
    location: Array<number>,
    isi: number,
    sprites: Array<string>
}

/**
 * Represents something at can move due to user input on the canvas
 */
export abstract class Actor<IA extends InputAccumalator> extends InteractiveSpriteContainer<IA> {

    /**
     * Initializes the actor
     * @param location The center point of the actor's initial location
     * @param spriteIndex The index of the actor's initial sprite
     * @param sprites An array of the actor's sprites
     */
    constructor(config: ActorConfig) {
        super();

        this.move(config.location[0], config.location[1]);
        this.spriteIndex = 0;
        this.spriteKeys = config.sprites;
    }

    /**
     * Renders the actor on the canvas
     * @param spriteMap A map from keys to sprites
     * @param context The rendering context of the canvas on which the actor should be rendered
     */
    public render(context: CanvasRenderingContext2D): void {
        this.spriteKey = this.spriteKeys[this.spriteIndex];

        super.render(context);
    }

    private spriteIndex: number;
    private spriteKeys: Array<string>;
}

/**
 * Represents the configuration of a world with sprite layers an possibily Actors
 */
export interface LayeredSpriteWorldConfig<SMLC extends SpriteMultilayerLayoutConfig<SLC, SMLCD>, SMLCD extends SpriteMultilayerLayoutConfigDefaults, SLC extends SpriteLayerConfig> extends LayeredWorldConfig<SMLC>, SpriteConfig {
    actorConfigs?: {
        [key: string]: [ActorConfig]
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
        super.onConfigurationLoaded(config);

        if(config.actorConfigs) {
            for(let name in config.actorConfigs) {
                for(let actorConfig of config.actorConfigs[name]) {
                    let actor = this.constructActorAt(name, actorConfig);
                    actor.spriteMap = this.spriteMap;
                    this.actors.push(actor);
                }
            }
        }

        config.spriteSources.forEach(spriteSource => this.spriteMap.loadSpriteSource(spriteSource));
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

    protected abstract constructSpriteLayer(config: SLC, spriteMap: SpriteMap, defaults?: SMLCD): SL;

    protected constructActorAt(key: string, actorConfig: ActorConfig): Actor<IA> | never {
        throw new Error("No matching sprite for " + key);
    }

    protected onUpdate(dt: number): void {
        super.onUpdate(dt);

        this.spriteMap.updateAllSprites(dt);

        this.actors.forEach((actor: Actor<IA>) => { actor.update(dt, this.inputAccumalator); })
    }

    protected abstract get inputAccumalator(): IA;

    /**
     * Renders the world on the given canvas
     */
    public render(): void {
        super.render();

        this.adhocSprites.forEach((as: { key: string, center: Point}) => { this.spriteMap.render(
            this.drawingContext,
            as.key,
            as.center
        )});

        this.actors.forEach((actor: Actor<IA>) => { actor.render(this.drawingContext); });
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

    private adhocSprites: Array<{ key: string, center: Point}> = [];

    private spriteMap: SpriteMap = new SpriteMap();

    private actors: Array<Actor<IA>> = [];
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

        return new SpriteLayer(config, spriteMap);
    }

    protected onUpdate(dt: number) {
        super.onUpdate(dt);
    }

    protected get inputAccumalator(): SimpleInputAccumalator {
        return this.ia;
    }

    private ia: SimpleInputAccumalator;
}