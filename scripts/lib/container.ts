
import { Placeable, Point, Renderable, Updatable } from "./common.js";
import { InputAccumalator } from "./input.js";
import { SpriteMap } from "./sprite.js";

export abstract class SpriteContainer implements Updatable, Renderable, Placeable {
    constructor(defaults?: {key?: string, spriteMap?: SpriteMap, location?: Point}) {
        this._location = new Point(0, 0);

        if(defaults) {
            this.spriteKey = defaults.key;
            this._spriteMap = defaults.spriteMap;
            this._location = defaults.location !== undefined ? defaults.location : this._location;
        }

        this._centerRender = true;
    }

    /**
     * Updates the actor using input from the user
     * @param dt The number of milliseconds which have passed since the last time this method was called
     */
    public update(dt: number): void {

    }

    public render(context: CanvasRenderingContext2D): void {
        if(this._spriteMap && this.spriteKey) {

            let sprite = this._spriteMap.getSprite(this.spriteKey);

            if(sprite) {

                let point = this.location;
                if(this.isSpriteRenderCentered) {
                    point = point.plus(
                        - (sprite.frameWidth / 2),
                        - (sprite.frameHeight / 2)
                    );
                }

                sprite.renderAt(context, point);
            }
        }
    }

    public get isSpriteRenderCentered(): boolean {
        return this._centerRender;
    }
    public set centerSpriteRender(center: boolean) {
        this._centerRender = center;
    }

    protected get spriteKey(): string | undefined {
        return this._spriteKey;
    }
    protected set spriteKey(key: string | undefined) {
        this._spriteKey = key;
    }

    public set spriteMap(spriteMap: SpriteMap | undefined) {
        this._spriteMap = spriteMap;
    }

    public get location(): Point {
        return this._location;
    }
    public move(dx: number, dy: number): void {
        this._location = this._location.plus(dx, dy);
    }
    
    private _spriteMap: SpriteMap | undefined;
    private _spriteKey: string | undefined;
    private _location: Point;
    private _centerRender: boolean;
}

export class PassiveSpriteContainer extends SpriteContainer {

}

/**
 * Represents a sprite container which at can respond to input
 */
export class InteractiveSpriteContainer<IA extends InputAccumalator> extends SpriteContainer {

    /**
     * Updates the actor using input from the user
     * @param dt The number of milliseconds which have passed since the last time this method was called
     * @param inputAccumalator Input which has been supplied by the user
     */
    public update(dt: number, inputAccumalator?: IA): void {
        super.update(dt);
    }

    public render(context: CanvasRenderingContext2D): void {
        super.render(context);
    }
}

export interface SpriteContainerConfig {
    default?: [{
        key: string;
        spriteKey: string;
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