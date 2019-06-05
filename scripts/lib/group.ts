
import { Point, RenderableAtPoint, Updatable } from "./common.js";
import { SpriteManager } from "./sprite.js";

/**
 * Holds an array of keys for sprites. By setting the key index the user can control which
 * sprite is rendered by the given manager.
 */
export class SpriteGroup implements Updatable, RenderableAtPoint {
    /**
     * Initializes the group
     * @param spriteKeys An array of keys for the sprites which are availble to this group
     * @param spriteManager The sprite manager which the group should use
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

export interface GroupConfigurations<GC extends GroupConfig> {
    [key: string]: GC
}
export interface GroupConfig {

}
/**
 * Manages the groups which are available
 */
export interface GroupManager<GC extends GroupConfig> extends Updatable {
    fill(config: GroupConfigurations<GC>): void;
}

export interface SpriteGroupConfig extends GroupConfig {
    sprites: Array<string>;
}
export class SpriteGroupManager<SGC extends SpriteGroupConfig> implements GroupManager<SGC> {
    /**
     * Fills the manager with the groups describe in the configuration data.
     * 
     * Note: If the key of a newly loaded group conflicts with an existing key, then the old
     *   key and its group will be replaced by the newly loaded group
     * @param configrations Configuration data for the new groups
     */
    public fill(configrations: GroupConfigurations<SGC>): void {
        for(let key in configrations) {
            this.groupConfigMap.set(key, configrations[key]);
            this.nextNumberMap.set(key, 1);
        }
    }

    public update(dt: number): void {
        this.groupMap.forEach(group => group.update(dt));
    }

    public buildGroup(configKey: string, spriteManager: SpriteManager): SpriteGroup | undefined {
        let config = this.groupConfigMap.get(configKey);
        let num = this.nextNumberMap.get(configKey);
        if(config && num) {

            let groupKey = configKey + num;
            let group = new SpriteGroup(config.sprites, spriteManager);

            this.groupMap.set(
                groupKey,
                group
            );

            this.nextNumberMap.set(configKey, num+1);

            return group;
        }
    }

    private nextNumberMap: Map<string, number> = new Map<string, number>();
    private groupConfigMap: Map<string, SGC> = new Map<string, SGC>();
    private groupMap: Map<string, SpriteGroup> = new Map<string, SpriteGroup>();
}
