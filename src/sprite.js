import { loadPNG } from "web-tools";
export class Sprite {
    constructor(image, options) {
        this._frameHeight = image.height;
        this._frameWidth = image.width;
        this._imageBaseX = 0;
        this._imageBaseY = 0;
        if (options !== undefined) {
            this._frameHeight = options.frameHeight || this._frameHeight;
            this._frameWidth = options.frameWidth || this._frameWidth;
            this._imageBaseX = options.sourceX || this._imageBaseX;
            this._imageBaseY = options.sourceY || this._imageBaseY;
        }
        this.image = image;
    }
    renderAt(context, point) {
        this.renderFrom(context, point.x, point.y, this.frameSourceImageX, this.frameSourceImageY);
    }
    renderFrom(context, x, y, srcX, srcY) {
        context.drawImage(this.image, srcX, srcY, this.frameWidth, this.frameHeight, x, y, this.frameWidth, this.frameHeight);
    }
    get frameWidth() {
        return this._frameWidth;
    }
    get frameHeight() {
        return this._frameHeight;
    }
    get imageBaseX() {
        return this._imageBaseX;
    }
    get imageBaseY() {
        return this._imageBaseY;
    }
    get frameSourceImageX() {
        return this.imageBaseX;
    }
    get frameSourceImageY() {
        return this.imageBaseY;
    }
}
export class MultiFrameSprite extends Sprite {
    constructor(image, options) {
        if (options) {
            super(image, options);
        }
        else {
            super(image);
        }
        this._updateFrame = false;
        if (options && options.frames) {
            this.numberOfFrames = options.frames.numberOfFrames;
            this.framesPerSecond = options.frames.framesPerSecond;
            this.horizontal = options.frames.areHorizontal;
            this.loop = options.frames.loop;
            if (options.frames.autoStart) {
                this.play();
            }
            else {
                this.pause();
            }
        }
        else {
            this.numberOfFrames = 1;
            this.framesPerSecond = 32;
            this.horizontal = true;
            this.loop = true;
            this.pause();
        }
        this.frameIndex = 0;
        this.lastUpdateTime = 0;
        this.lastFrameChangeTime = 0;
    }
    get frameSourceImageX() {
        let srcX = this.imageBaseX;
        if (this.horizontal) {
            srcX += this.frameIndex * this.frameWidth;
        }
        return srcX;
    }
    get frameSourceImageY() {
        let srcY = this.imageBaseY;
        if (!this.horizontal) {
            srcY += this.frameIndex * this.frameHeight;
        }
        return srcY;
    }
    update(dt) {
        if (this._updateFrame) {
            let msPerFrame = 1000 / this.framesPerSecond;
            this.lastUpdateTime += dt;
            if (this.lastUpdateTime - this.lastFrameChangeTime > msPerFrame) {
                this.lastFrameChangeTime = this.lastUpdateTime;
                if (this.loop) {
                    this.frameIndex = (this.frameIndex + 1) % this.numberOfFrames;
                }
                else {
                    if (this.frameIndex === this.framesPerSecond - 1) {
                        this._updateFrame = false;
                    }
                    else {
                        this.frameIndex += 1;
                    }
                }
            }
        }
    }
    play() {
        this._updateFrame = true;
    }
    pause() {
        this._updateFrame = false;
    }
}
export class SpriteManager {
    constructor() {
        this.map = new Map();
    }
    loadSpriteSource(spriteSheetSource) {
        spriteSheetSource.singles.forEach((single) => {
            loadPNG(spriteSheetSource.baseURL + single.fileName, (image) => {
                this.addSprite(single.key, new MultiFrameSprite(image, single));
            });
        });
        spriteSheetSource.sheets.forEach((sheet) => {
            loadPNG(spriteSheetSource.baseURL + sheet.fileName, (image) => {
                let defaults = sheet.defaultSpriteProperties;
                sheet.sprites.forEach(spriteDescription => {
                    if (defaults) {
                        if (spriteDescription.frameHeight === undefined && defaults.frameHeight) {
                            spriteDescription.frameHeight = defaults.frameHeight;
                        }
                        if (spriteDescription.frameWidth === undefined && defaults.frameWidth) {
                            spriteDescription.frameWidth = defaults.frameWidth;
                        }
                    }
                    this.addSprite(spriteDescription.key, new MultiFrameSprite(image, spriteDescription));
                });
            });
        });
    }
    addSprite(key, sprite) {
        this.map.set(key, sprite);
    }
    updateAllSprites(dt) {
        this.map.forEach((sprite) => sprite.update(dt));
    }
    renderAt(context, key, point, centered) {
        let sprite = this.map.get(key);
        if (sprite) {
            if (centered !== undefined && centered) {
                point = point.plus(-(sprite.frameWidth / 2), -(sprite.frameHeight / 2));
            }
            sprite.renderAt(context, point);
        }
    }
    accessSprite(key, accessor) {
        let sprite = this.map.get(key);
        if (sprite) {
            accessor(sprite);
        }
    }
}
