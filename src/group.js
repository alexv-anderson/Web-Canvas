export class SpriteGroup {
    constructor(spriteKeys, spriteManager) {
        this._spriteKeys = spriteKeys;
        this._spriteManager = spriteManager;
        this._spriteIndex = 0;
        this._renderAtCenter = true;
    }
    update(dt) {
    }
    renderAt(context, point) {
        this._spriteManager.renderAt(context, this.currentKey, point, this.renderAtCenter);
    }
    get renderAtCenter() {
        return this._renderAtCenter;
    }
    set renderAtCenter(centered) {
        this._renderAtCenter = centered;
    }
    accessCurrentSprite(accessor) {
        this._spriteManager.accessSprite(this.currentKey, accessor);
    }
    get currentKey() {
        return this._spriteKeys[this._spriteIndex];
    }
    set keyIndex(index) {
        this._spriteIndex = index;
    }
}
export class SpriteGroupManager {
    constructor() {
        this.nextNumberMap = new Map();
        this.groupConfigMap = new Map();
        this.groupMap = new Map();
    }
    fill(configrations) {
        for (let key in configrations) {
            this.groupConfigMap.set(key, configrations[key]);
            this.nextNumberMap.set(key, 1);
        }
    }
    update(dt) {
        this.groupMap.forEach(group => group.update(dt));
    }
    buildGroup(configKey, spriteManager) {
        let config = this.groupConfigMap.get(configKey);
        let num = this.nextNumberMap.get(configKey);
        if (config && num) {
            let groupKey = configKey + num;
            let group = new SpriteGroup(config.sprites, spriteManager);
            this.groupMap.set(groupKey, group);
            this.nextNumberMap.set(configKey, num + 1);
            return group;
        }
    }
}
