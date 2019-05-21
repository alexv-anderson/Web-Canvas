import { InputAccumalator, SimpleInputAccumalator } from "./input.js";
import { Point } from "./common.js";
import { SpriteConfig, SpriteMap } from "./sprite.js";
import { LayeredWorld, LayeredWorldConfig, LayerConfig } from "./layered-world.js";
import { Layer } from "./layer.js";

export interface SpriteMultilayerLayoutConfig<SLC extends SpriteLayerConfig, SMLCD extends SpriteMultilayerLayoutConfigDefaults> extends LayerConfig {
    defaults?: SMLCD,
    layers: [SLC]
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

/**
 * Represents a layer of sprites which for the background/floor
 */
export class SpriteLayer implements Layer {
    /**
     * Initializes the layer
     * @param config The configuration for the layer
     */
    constructor(config: SpriteLayerConfig, spriteMap: SpriteMap) {
        this._sprites = config.sprites;

        this._stepHeight = 32;
        this._stepWidth = 32;

        if(config.step) {
            this._stepHeight = config.step.height || this._stepHeight;
            this._stepWidth = config.step.width || this._stepWidth;
        }

        this.spriteMap = spriteMap;
    }

    public update(dt: number): void {

    }

    /**
     * Renders the layer on the supplied canvas using the given sprite map
     * @param context The rendering context of the canvas on which the layer should be rendered
     */
    public render(context: CanvasRenderingContext2D): void {
        let xScale = this._stepWidth;
        let xOffset = this._stepWidth / 2;

        let yScale = this._stepHeight;
        let yOffset = this._stepHeight / 2;

        for(let key in this._sprites) {
            let pairs = this._sprites[key];
            for(let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                let pair = pairs[pairIndex];
                this.spriteMap.render(
                    context,
                    key,
                    new Point(
                        (pair[1] * xScale) + xOffset,   // which column
                        (pair[0] * yScale) + yOffset    // which row
                    )
                )
            }
        }
    }

    public addSquareFor(spriteKey: string, row: number, column: number): void {
        if(this._sprites[spriteKey] === undefined) {
            this._sprites[spriteKey] = [];
        }

        this._sprites[spriteKey].push([row, column]);
    }

    public getSquaresFor(spriteKey: string): Array<Array<number>> | undefined {
        return this._sprites[spriteKey];
    }

    public removeAllSpriteSquares(spriteKey: string): void {
        delete this._sprites[spriteKey];
    }

    private _sprites: SpriteLayerLocations;
    private _stepHeight: number;
    private _stepWidth: number;
    private spriteMap: SpriteMap;
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
            sprite.renderAtCenterPoint(
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

        config.layers.forEach(layerConfig => this.addLayer(this.constructSpriteLayer(layerConfig, this.spriteMap)));
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