import { getConfigDirURL, getHostURL } from "./local.js";
import { loadJSON } from "./general-lib.js";
import { SpriteConfig, LayeredSpriteWorldConfig, ActorConfig } from "./canvas-grid-interface.js";
import { loadSpriteMap, Actor, SpriteMap, SpriteWorld, SpriteLayer } from "./canvas-grid-lib.js";
import { InputAccumalator, Point } from "./canvas-lib.js";

/*
 * Only things which need to be implemented to create a new canvas world.
 */

/**
 * Supplies the URL for the host's image directory
 */
export function getImageDirURL(): string {
    return getHostURL() + "images/";
}

/**
 * Loads the sprite configuration file
 * @param onLoaded Called once the configuration data has been loaded
 */
export function loadSpriteConfig(onLoaded: (config: SpriteConfig) => void): void {
    loadJSON(getConfigDirURL() + "sprite-config.json", onLoaded);
}

/**
 * Gets the canvas element
 * @param callback Called once the canvas element has bee located
 */
export function getCanvas(callback: (canvas: HTMLCanvasElement) => void) {
    callback(document.getElementById("theCanvas") as HTMLCanvasElement);
}

export class Soldier extends Actor {
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

class MyWorld extends SpriteWorld<LayeredSpriteWorldConfig> {
    constructor(canvas: HTMLCanvasElement, configURL: string, spriteMap: SpriteMap) {
        super(canvas, configURL, spriteMap);

        this.ia = new InputAccumalator(canvas);
    }

    protected onConfigurationLoaded(config: LayeredSpriteWorldConfig): void {
        super.onConfigurationLoaded(config);

        let sl0 = this.getLayerAtIndex(0) as SpriteLayer;
        let sqrs = sl0.getSquaresFor("wr");
        if(sqrs) {
            sqrs.pop();    
        }

        let sl1 = this.getLayerAtIndex(1) as SpriteLayer;
        sl1.addSquareFor("rsl", 1, 0);
    }

    protected constructActorAt(key: string, actorConfig: ActorConfig): Actor | never {
        if(key === "Soldier") {
            return new Soldier(
                new Point(actorConfig.location[0], actorConfig.location[1]),
                actorConfig.isi,
                actorConfig.sprites
            )
        }
        throw new Error("No matching sprite for " + key);
    }

    public onUpdate(dt: number, inputAccumalator: InputAccumalator): void {
        super.onUpdate(dt, inputAccumalator);
        
        if(inputAccumalator.mouseDown && inputAccumalator.mouseDownPoint) {
            if(this.lastClickPoint) {
                this.addLine(
                    this.lastClickPoint.x,
                    this.lastClickPoint.y,
                    inputAccumalator.mouseDownPoint.x,
                    inputAccumalator.mouseDownPoint.y,
                    "red",
                    2
                )
            }

            this.lastClickPoint = inputAccumalator.mouseDownPoint;
        }
    }

    protected get inputAccumalator(): InputAccumalator {
        return this.ia;
    }

    private ia: InputAccumalator;

    private lastClickPoint: Point;
}

window.onload = function() {
    getCanvas((canvas: HTMLCanvasElement) => {
        loadSpriteMap((spriteMap: SpriteMap) => {
            let world = new MyWorld(canvas, getConfigDirURL() + "world-config.json", spriteMap);
            world.start();
        });
    });
}