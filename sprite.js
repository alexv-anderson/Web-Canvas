class Sprite {
    constructor(image, imageWidth, imageHeight, numberOfFrames, horizontal, loop) {
        this.frameIndex = 0;
        this.updatesSinceLastFrame = 0;
        this.numberOfUpdatesPerFrame = 0;
        this.numberOfFrames = numberOfFrames || 1;
        this.horizontal = horizontal !== undefined ? horizontal : true;
        this.loop = loop !== undefined ? loop : false;
        this.image = image;
    }
    render(context, canvasX, canvasY) {
        let srcX = 0;
        let srcY = 0;
        if (this.horizontal) {
            srcX = this.frameIndex * this.getFrameWidth();
        }
        else {
            srcY = this.frameIndex * this.getFrameHeight();
        }
        context.drawImage(this.image, srcX, srcY, this.getFrameWidth(), this.getFrameHeight(), canvasX, canvasY, this.getFrameWidth(), this.getFrameHeight());
    }
    update() {
        this.updatesSinceLastFrame += 1;
        if (this.updatesSinceLastFrame > this.numberOfUpdatesPerFrame) {
            this.updatesSinceLastFrame = 0;
            if (this.frameIndex < this.numberOfFrames - 1) {
                this.frameIndex += 1;
            }
            else if (this.loop) {
                this.frameIndex = 0;
            }
        }
    }
    get width() {
        return this.getFrameWidth();
    }
    get height() {
        return this.getFrameHeight();
    }
    getFrameWidth() {
        if (this.horizontal) {
            return this.image.width / this.numberOfFrames;
        }
        else {
            return this.image.width;
        }
    }
    getFrameHeight() {
        if (this.horizontal) {
            return this.image.height;
        }
        else {
            return this.image.height / this.numberOfFrames;
        }
    }
}
class SpriteMap {
    constructor() {
        this.map = new Map();
    }
    addSprite(key, sprite) {
        this.map.set(key, sprite);
    }
    updateAllSprites() {
        this.map.forEach((sprite) => sprite.update());
    }
    render(context, key, x, y) {
        this.map.get(key).render(context, x, y);
    }
    getSprite(key) {
        return this.map.get(key);
    }
}
class Layer {
    constructor(grid) {
        this._grid = grid;
    }
    render(spriteMap, context) {
        for (let key in this._grid) {
            let pairs = this._grid[key];
            for (let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
                let pair = pairs[pairIndex];
                spriteMap.render(context, key, pair[1] * 32, pair[0] * 32);
            }
        }
    }
}
class LayeredLayout {
    constructor() {
        this.layers = [];
    }
    addLayer(layer) {
        this.layers.push(layer);
    }
    getLayer(index) {
        return this.layers[index];
    }
    get depth() {
        return this.layers.length;
    }
    render(spriteMap, context) {
        this.layers.forEach((layer) => { layer.render(spriteMap, context); });
    }
}
function getHostURL() {
    return "http://127.0.0.1:8000/";
}
function getSpriteMap(onLoaded) {
    getJSON(getHostURL() + "sprite-config.json", (json) => {
        let map = new SpriteMap();
        function generateCountingDelayCallback(numCallsToCallback) {
            let numberOfTimesCalled = 0;
            return function (map, callback) {
                numberOfTimesCalled++;
                if (numberOfTimesCalled >= numCallsToCallback)
                    callback(map);
            };
        }
        let countingCallback = generateCountingDelayCallback(json.spriteImageInfo.length);
        json.spriteImageInfo.forEach((sii) => {
            loadPNG(getHostURL() + sii.fileName, (image) => {
                map.addSprite(sii.mapKey, new Sprite(image, sii.width, sii.height, sii.numberOfFrames, sii.isHorizontal, sii.loop));
                countingCallback(map, onLoaded);
            });
        });
    });
}
class Point {
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }
    get x() {
        return this._x;
    }
    set x(x) {
        this._x = x;
    }
    get y() {
        return this._y;
    }
    set y(y) {
        this._y = y;
    }
}
class Actor {
    constructor(location, spriteIndex, sprites) {
        this.location = location;
        this.spriteIndex = spriteIndex;
        this.sprites = sprites;
    }
    update(inputAccumalator) {
        if (inputAccumalator.arrowUpDown)
            this.location.y -= 5;
        else if (inputAccumalator.arrowDownDown)
            this.location.y += 5;
        else if (inputAccumalator.arrowLeftDown)
            this.location.x -= 5;
        else if (inputAccumalator.arrowRightDown)
            this.location.x += 5;
    }
    render(context) {
        let sprite = this.sprites[this.spriteIndex];
        sprite.render(context, this.location.x - (sprite.width / 2), this.location.y - (sprite.height / 2));
    }
}
class World {
    constructor(spriteMap, config) {
        this.targetLocations = [];
        this.actors = [];
        this.layout = new LayeredLayout();
        this.spriteMap = spriteMap;
        config.actorInitialInfo.forEach((acd) => {
            this.actors.push(new Actor(new Point(acd.initialLocation[0], acd.initialLocation[1]), acd.initialSpriteIndex || 0, acd.spriteKeys.map((key) => { return spriteMap.getSprite(key); })));
        });
        config.layers.forEach((lc) => { this.layout.addLayer(new Layer(lc)); });
        this._viewHeight = config.view.height;
        this._viewWidth = config.view.width;
    }
    update(inputAccumalator) {
        if (inputAccumalator.mouseDown) {
            this.targetLocations.push(new Point(inputAccumalator.mouseDownPoint.x, inputAccumalator.mouseDownPoint.y));
        }
        this.spriteMap.updateAllSprites();
        this.actors.forEach((actor) => { actor.update(inputAccumalator); });
    }
    render(context) {
        this.layout.render(this.spriteMap, context);
        this.targetLocations.forEach((point) => {
            this.spriteMap.render(context, "target", point.x - 16, point.y - 16);
        });
        this.actors.forEach((actor) => { actor.render(context); });
    }
    addTarget(point) {
        this.targetLocations.push(point);
    }
    get viewHeight() {
        return this._viewHeight;
    }
    get viewWidth() {
        return this._viewWidth;
    }
}
function getWorld(callback) {
    getSpriteMap((spriteMap) => {
        getJSON(getHostURL() + "world-config.json", (config) => {
            callback(new World(spriteMap, config));
        });
    });
}
class InputAccumalator {
    constructor(canvas) {
        document.addEventListener("mousedown", (event) => {
            let rect = canvas.getBoundingClientRect();
            this._mouseDownPoint = new Point(event.clientX - rect.left, event.clientY - rect.top);
        });
        document.addEventListener("keydown", (event) => {
            if (event.keyCode == 38)
                this._arrowUpDown = true;
            else if (event.keyCode == 40)
                this._arrowDownDown = true;
            else if (event.keyCode == 37)
                this._arrowLeftDown = true;
            else if (event.keyCode == 39)
                this._arrowRightDown = true;
        });
        this.reset();
    }
    get mouseDown() {
        return this._mouseDownPoint !== undefined;
    }
    get mouseDownPoint() {
        return this._mouseDownPoint;
    }
    get arrowUpDown() {
        return this._arrowUpDown;
    }
    get arrowDownDown() {
        return this._arrowDownDown;
    }
    get arrowLeftDown() {
        return this._arrowLeftDown;
    }
    get arrowRightDown() {
        return this._arrowRightDown;
    }
    reset() {
        this._mouseDownPoint = undefined;
        this._arrowUpDown = false;
        this._arrowDownDown = false;
        this._arrowLeftDown = false;
        this._arrowRightDown = false;
    }
}
function onBodyLoad() {
    getWorld((world) => {
        let canvas = document.getElementById("theCanvas");
        canvas.height = world.viewHeight;
        canvas.width = world.viewWidth;
        let context = canvas.getContext("2d");
        let ia = new InputAccumalator(canvas);
        setInterval(() => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            world.update(ia);
            ia.reset();
            world.render(context);
        }, 250);
    });
}
function loadPNG(pngURL, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", pngURL, true);
    xhr.responseType = "blob";
    xhr.onload = function (event) {
        if (this.status == 200) {
            let blob = this.response;
            let img = document.createElement("img");
            img.onload = (event) => {
                window.URL.revokeObjectURL(img.src);
            };
            img.src = window.URL.createObjectURL(blob);
            callback(img);
        }
    };
    xhr.send();
}
function getJSON(jsonURL, callback) {
    loadWebResource(jsonURL, "GET", "application/json", (text) => callback(JSON.parse(text)));
}
function loadWebResource(url, method, mimeType, callback) {
    let xobj = new XMLHttpRequest();
    xobj.overrideMimeType(mimeType);
    xobj.open(method, url, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState === 4 && xobj.status === 200) {
            callback(xobj.responseText);
        }
    };
    xobj.send();
}
//# sourceMappingURL=sprite.js.map