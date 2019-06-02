
import { Point, RenderableAtPoint, Updatable } from "./common.js";
import { InputAccumalator } from "./input.js";
import { SpriteMap } from "./sprite.js";

export class SpriteContainer implements Updatable, RenderableAtPoint {
    constructor(spriteKeys: Array<string>, spriteMap: SpriteMap) {
        this._spriteKeys = spriteKeys;
        this._spriteMap = spriteMap;

        this._spriteIndex = 0;

        this._centerRender = true;
    }

    /**
     * Updates the actor using input from the user
     * @param dt The number of milliseconds which have passed since the last time this method was called
     */
    public update(dt: number): void {
        
    }

    public renderAt(context: CanvasRenderingContext2D, point: Point): void {
        let sprite = this._spriteMap.getSprite(this.spriteKey);

        if(sprite) {

            if(this.isSpriteRenderCentered) {
                point = point.plus(
                    - (sprite.frameWidth / 2),
                    - (sprite.frameHeight / 2)
                );
            }

            sprite.renderAt(context, point);
        }
    }

    public get isSpriteRenderCentered(): boolean {
        return this._centerRender;
    }
    public set centerSpriteRender(center: boolean) {
        this._centerRender = center;
    }

    protected get spriteKey(): string {
        return this._spriteKeys[this._spriteIndex];
    }
    protected set spriteIndex(index: number) {
        this._spriteIndex = index;
    }

    private _spriteMap: SpriteMap;
    private _spriteIndex: number;
    private _spriteKeys: Array<string>;
    private _centerRender: boolean;
}


export class ContainerCabinet<IA extends InputAccumalator> {
    public fill(
        config: SpriteContainerConfig, spriteMap: SpriteMap): void {

        if(config.default) {
            config.default.forEach(config => this.passiveContainerMap.set(
                config.key,
                new SpriteContainer(config.sprites, spriteMap)
            ));
        }
    }

    public update(dt: number): void {
        this.passiveContainerMap.forEach(passiveContainer => passiveContainer.update(dt));
    }

    public renderContainerAt(context: CanvasRenderingContext2D, containerKey: string, point: Point): void {
        let container = this.getContainer(containerKey);
        if(container) {
            container.renderAt(context, point);
        }
    }

    public getContainer(containerKey: string): SpriteContainer | undefined {
        let container = this.passiveContainerMap.get(containerKey);
        if(container) {
            return container;
        }

        throw new Error("No container found for " + containerKey);
    }

    private passiveContainerMap: Map<string, SpriteContainer> = new Map<string, SpriteContainer>();
}

export interface SpriteContainerConfig {
    default?: [{
        key: string;
        sprites: Array<string>;
    }];
    custom?: {
        passive?: {
            [key: string]: PassiveSpriteContainerConfig;
        };
        interactive?: {
            [key: string]: InteractiveSpriteContainerConfig;
        };
    }
}

export interface PassiveSpriteContainerConfig {
    spriteKey: string;
}

export interface InteractiveSpriteContainerConfig {

}