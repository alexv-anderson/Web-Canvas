
import { Point, RenderableAtPoint, Updatable } from "./common.js";
import { SpriteManager } from "./sprite.js";

/**
 * Holds an array of keys for sprites. By setting the key index the user can control which
 * sprite is rendered by the given manager.
 */
export class SpriteContainer implements Updatable, RenderableAtPoint {
    /**
     * Initializes the container
     * @param spriteKeys An array of keys for the sprites which are availble to this container
     * @param spriteManager The sprite manager which the container should use
     */
    constructor(spriteKeys: Array<string>, spriteManager: SpriteManager) {
        this._spriteKeys = spriteKeys;
        this._spriteManager = spriteManager;

        this._spriteIndex = 0;

        this._renderAtCenter = true;
    }

    public update(dt: number): void {
        
    }

    public renderAt(context: CanvasRenderingContext2D, point: Point): void {
        this._spriteManager.renderAt(context, this.currentKey, point, this.renderAtCenter);
    }

    /**
     * Indicates if the point given at render time is the center point or the top-left corner
     */
    public get renderAtCenter(): boolean {
        return this._renderAtCenter;
    }
    /**
     * Set to true if the point given at render time is the center point
     */
    public set renderAtCenter(centered: boolean) {
        this._renderAtCenter = centered;
    }

    /**
     * The currently selected key which will be given to the manager at render time.
     */
    public get currentKey(): string {
        return this._spriteKeys[this._spriteIndex];
    }
    /**
     * Changes the index of the selected key
     */
    public set keyIndex(index: number) {
        this._spriteIndex = index;
    }

    private _spriteManager: SpriteManager;
    private _spriteIndex: number;
    private _spriteKeys: Array<string>;
    private _renderAtCenter: boolean;
}

/**
 * Manages the containers which are available
 */
export class ContainerManager implements Updatable {
    /**
     * Fills the manager with the containers describe in the configuration data.
     * 
     * Note: If the key of a newly loaded container conflicts with an existing key, then the old
     *   key and its container will be replaced by the newly loaded container
     * @param config Configuration data for the new containers
     * @param spriteManager The sprite manager which should be used by the containers
     */
    public fill(
        config: SpriteContainerConfig, spriteManager: SpriteManager): void {

        if(config.containers) {
            config.containers.forEach(containerConfig => this.containerMap.set(
                containerConfig.key,
                new SpriteContainer(containerConfig.sprites, spriteManager)
            ));
        }
    }

    public update(dt: number): void {
        this.containerMap.forEach(container => container.update(dt));
    }

    /**
     * Draws the container associated with the given key on the canvas at the given coordinates.
     * 
     * @param context The canvas' 2D rendering context
     * @param containerKey The key of the container to be drawn at the given coordinates
     * @param point The point to be given to the container's render method
     */
    public renderAt(context: CanvasRenderingContext2D, containerKey: string, point: Point): void {
        let container = this.getContainer(containerKey);

        if(container) {
            container.renderAt(context, point);
        }
    }

    /**
     * Supplies the container for the given key if it exists
     * @param containerKey The key of the desired container
     */
    public getContainer(containerKey: string): SpriteContainer | undefined {
        return this.containerMap.get(containerKey);
    }

    private containerMap: Map<string, SpriteContainer> = new Map<string, SpriteContainer>();
}

export interface SpriteContainerConfig {
    containers?: [{
        key: string;
        sprites: Array<string>;
    }];
}