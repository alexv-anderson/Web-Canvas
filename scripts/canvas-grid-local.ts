/// <reference path="local.ts" />

/*
 * Only things which need to be implemented to create a new canvas world.
 */

/**
 * Supplies the URL for the host's image directory
 */
function getImageDirURL(): string {
    return getHostURL() + "images/";
}

/**
 * Loads the world configuration file
 * @param onLoaded Called once the configuration data has been loaded
 */
function loadWorld(callback: (world: World) => void): void {
    loadJSON(getConfigDirURL() + "world-config.json", (config: WorldConfig) => {
        callback(new MyWorld(config));
    });
}

/**
 * Loads the sprite configuration file
 * @param onLoaded Called once the configuration data has been loaded
 */
function loadSpriteConfig(onLoaded: (config: SpriteConfig) => void): void {
    loadJSON(getConfigDirURL() + "sprite-config.json", onLoaded);
}

/**
 * Gets the canvas element
 * @param callback Called once the canvas element has bee located
 */
function getCanvas(callback: (canvas: HTMLCanvasElement) => void) {
    callback(document.getElementById("theCanvas") as HTMLCanvasElement);
}

class Soldier extends Actor {
    public update(inputAccumalator: InputAccumalator): void {
        let dx: number = 0;
        let dy: number = 0;

        if(inputAccumalator.arrowUpDown) {
            dy -= 5;
        }
        if(inputAccumalator.arrowDownDown) {
            dy += 5;
        }
        if(inputAccumalator.arrowLeftDown) {
            dx -= 5;
        }
        if(inputAccumalator.arrowRightDown) {
            dx += 5;
        }

        this.move(dx, dy);
    }
}

class MyWorld extends World {
    public onUpdate(inputAccumalator: InputAccumalator): void {
        if(inputAccumalator.mouseDown && inputAccumalator.mouseDownPoint) {
            this.addTarget(new Point(
                inputAccumalator.mouseDownPoint.x,
                inputAccumalator.mouseDownPoint.y
            ));
        }
    }
}