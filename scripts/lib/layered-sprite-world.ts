import { InputAccumalator } from "./input.js";
import { Point } from "./common.js";
import { SpriteMap } from "./sprite.js";
import { LayeredWorld } from "./layered-world.js";
import { Layer } from "./layer.js";
import { WorldConfig } from "./world";

/**
 * Represents a layer of sprites which for the background/floor
 */
export class SpriteLayer implements Layer {
    /**
     * Initializes the layer
     * @param grid The configuration for the layer
     */
    constructor(grid: LayerConfig, spriteMap: SpriteMap) {
        this.grid = grid;
        this.spriteMap = spriteMap;
    }

    public update(dt: number): void {

    }

    /**
     * Renders the layer on the supplied canvas using the given sprite map
     * @param context The rendering context of the canvas on which the layer should be rendered
     */
    public render(context: CanvasRenderingContext2D): void {
        for(let key in this.grid) {
            let pairs = this.grid[key];
            for(let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                let pair = pairs[pairIndex];
                this.spriteMap.render(
                    context,
                    key,
                    new Point(
                        (pair[1] * 32) + 16,
                        (pair[0] * 32) + 16
                    )
                )
            }
        }
    }

    public addSquareFor(spriteKey: string, row: number, column: number): void {
        if(this.grid[spriteKey] === undefined) {
            this.grid[spriteKey] = [];
        }

        this.grid[spriteKey].push([row, column]);
    }

    public getSquaresFor(spriteKey: string): Array<Array<number>> | undefined {
        return this.grid[spriteKey];
    }

    public removeAllSpriteSquares(spriteKey: string): void {
        delete this.grid[spriteKey];
    }

    private grid: LayerConfig;
    private spriteMap: SpriteMap;
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

export type LayerConfig = { [key in string]: Array<Array<number>> };

export type ActorConfig = {
    location: Array<number>,
    isi: number,
    sprites: Array<string>
}

export interface LayeredSpriteWorldConfig extends WorldConfig {
    layers: Array<LayerConfig>,
    actorConfigs?: {
        [key in string]: [ActorConfig]
    }
}

/**
 * Reperesents everything on the canvas
 */
export abstract class SpriteWorld<C extends LayeredSpriteWorldConfig, IA extends InputAccumalator> extends LayeredWorld<C> {
    /**
     * Initializes the world
     * @param canvas The canvas on which the world will be drawn
     * @param config Configuration data for the world
     * @param spriteMap Data structure for the sprites in the world
     */
    constructor(canvas: HTMLCanvasElement, configURL: string, spriteMapURL: string) {
        super(canvas, configURL);

        this.spriteMap.loadSpritesFrom(spriteMapURL);
    }

    protected onConfigurationLoaded(config: C): void {
        super.onConfigurationLoaded(config);

        if(config.actorConfigs) {
            for(let name in config.actorConfigs) {
                for(let actorConfig of config.actorConfigs[name])
                    this.actors.push(this.constructActorAt(name, actorConfig));
            }
        }

        config.layers.forEach((lc: LayerConfig) => { this.addLayer(new SpriteLayer(lc, this.spriteMap)); });        
    }

    protected constructActorAt(key: string, actorConfig: ActorConfig): Actor<IA> | never {
        throw new Error("No matching sprite for " + key);
    }

    public onUpdate(dt: number): void {
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