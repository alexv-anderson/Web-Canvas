
import { Point, RenderableAtPoint, Updatable, KeyedValueRenderableAtPoint } from "./common.js";
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
        this._spriteMap.renderAt(context, this.spriteKey, point, this.isSpriteRenderCentered);
    }

    public get isSpriteRenderCentered(): boolean {
        return this._centerRender;
    }
    public set centerSpriteRender(center: boolean) {
        this._centerRender = center;
    }

    public get spriteKey(): string {
        return this._spriteKeys[this._spriteIndex];
    }
    public set spriteIndex(index: number) {
        this._spriteIndex = index;
    }

    private _spriteMap: SpriteMap;
    private _spriteIndex: number;
    private _spriteKeys: Array<string>;
    private _centerRender: boolean;
}


export class ContainerCabinet implements KeyedValueRenderableAtPoint {
    public fill(
        config: SpriteContainerConfig, spriteMap: SpriteMap): void {

        if(config.containers) {
            config.containers.forEach(containerConfig => this.containerMap.set(
                containerConfig.key,
                new SpriteContainer(containerConfig.sprites, spriteMap)
            ));
        }
    }

    public update(dt: number): void {
        this.containerMap.forEach(container => container.update(dt));
    }

    public renderAt(context: CanvasRenderingContext2D, containerKey: string, point: Point): void {
        let container = this.getContainer(containerKey);
        if(container) {
            container.renderAt(context, point);
        }
    }

    public getContainer(containerKey: string): SpriteContainer | undefined {
        let container = this.containerMap.get(containerKey);
        if(container) {
            return container;
        }

        throw new Error("No container found for " + containerKey);
    }

    private containerMap: Map<string, SpriteContainer> = new Map<string, SpriteContainer>();
}

export interface SpriteContainerConfig {
    containers?: [{
        key: string;
        sprites: Array<string>;
    }];
}