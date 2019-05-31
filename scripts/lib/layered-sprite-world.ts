import { InputAccumalator, SimpleInputAccumalator } from "./input.js";
import { Point, Renderable, Updatable } from "./common.js";
import { SpriteConfig, SpriteMap, MultiFrameSprite } from "./sprite.js";
import { LayeredWorld, LayeredWorldConfig, LayerConfig } from "./layered-world.js";
import { Layer } from "./layer.js";

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

export abstract class Block<C extends Updatable & Renderable> implements Updatable {
    constructor(row: number, column: number) {
        this._row = row;
        this._column = column;
    }

    public update(dt: number): void {
        if(this.contents) {
            this.contents.update(dt);
        }
    }

    public render(context: CanvasRenderingContext2D,
        columnStepSize: number, columnOffset: number,
        rowStepSize: number, rowOffset: number): void {
            
        if(this.contents) {
            this.contents.renderAt(
                context,
                new Point(
                    (this.column * columnStepSize) + columnOffset,  // which column
                    (this.row * rowStepSize) + rowOffset            // which row
                )
            );
        }
    }

    protected abstract get contents(): C | undefined;

    public get row(): number {
        return this._row;
    }
    public get column(): number {
        return this._column;
    }

    private _row: number;
    private _column: number;
}

class MultiFrameSpriteBlock extends Block<MultiFrameSprite> {
    constructor(key: string, row: number, column: number, spriteMap: SpriteMap) {
        super(row, column);

        this._key = key;
        this._spriteMap = spriteMap;
    }

    protected get contents(): MultiFrameSprite | undefined {
        return this._spriteMap.getSprite(this._key);
    }

    private _key: string;
    private _spriteMap: SpriteMap;
}

class BlockGridLayer<C extends Renderable & Updatable> implements Layer {
    constructor(blockHeight: number, blockWidth: number) {
        this._blocks = new Array<Block<C>>();

        this._blockHeight = blockHeight;
        this._blockWidth = blockWidth;
    }

    public update(dt: number): void {
        this._blocks.forEach(i => i.update(dt));
    }

    public render(context: CanvasRenderingContext2D): void {
        let xScale = this._blockWidth;
        let xOffset = this._blockWidth / 2;

        let yScale = this._blockHeight;
        let yOffset = this._blockHeight / 2;

        this._blocks.forEach(b => b.render(
            context,
            xScale,
            xOffset,
            yScale,
            yOffset
        ));
    }

    protected addBlock(block: Block<C>): void {
        this._blocks.push(block);
    }

    private _blocks: Array<Block<C>>;

    private _blockWidth: number;
    private _blockHeight: number;
}

/**
 * Represents a layer of sprites which for the background/floor
 */
export class SpriteLayer extends BlockGridLayer<MultiFrameSprite> {
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
                    new MultiFrameSpriteBlock(
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
export abstract class Actor<IA extends InputAccumalator> {

    /**
     * Initializes the actor
     * @param location The center point of the actor's initial location
     * @param spriteIndex The index of the actor's initial sprite
     * @param sprites An array of the actor's sprites
     */
    constructor(location: Point, spriteIndex: number, sprites: Array<string>) {
        this.location = location;
        this.spriteIndex = spriteIndex;
        this.spriteKeys = sprites;
    }

    /**
     * Updates the actor using input from the user
     * @param inputAccumalator Input which has been supplied by the user
     */
    public abstract update(inputAccumalator: IA): void;

    /**
     * Renders the actor on the canvas
     * @param spriteMap A map from keys to sprites
     * @param context The rendering context of the canvas on which the actor should be rendered
     */
    public render(spriteMap: SpriteMap, context: CanvasRenderingContext2D): void {
        let sprite = spriteMap.getSprite(this.spriteKeys[this.spriteIndex]);
        if(sprite) {
            sprite.renderAt(
                context,
                new Point(
                    this.location.x,
                    this.location.y
                )
            );
        }
    }

    protected move(dx: number, dy: number): void {
        this.location = this.location.plus(dx, dy);
    }

    private location: Point;
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
                for(let actorConfig of config.actorConfigs[name])
                    this.actors.push(this.constructActorAt(name, actorConfig));
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

        this.actors.forEach((actor: Actor<IA>) => { actor.update(this.inputAccumalator); })
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

        this.actors.forEach((actor: Actor<IA>) => { actor.render(this.spriteMap, this.drawingContext); });
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