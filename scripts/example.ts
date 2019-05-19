import { LayeredSpriteWorldConfig, ActorConfig } from "./lib/layered-sprite-canvas-world-interface.js";
import { Actor, SpriteWorld, SpriteLayer } from "./lib/layered-sprite-canvas-world.js";
import { InputAccumalator, Point } from "./lib/base-canvas-world.js";

/*
 * Only things which need to be implemented to create a new canvas world.
 */

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

class MyWorld extends SpriteWorld<LayeredSpriteWorldConfig, InputAccumalator> {
    constructor(canvas: HTMLCanvasElement, configURL: string, spriteMapURL: string) {
        super(canvas, configURL, spriteMapURL);

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
        
        return super.constructActorAt(key, actorConfig);
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
        let world = new MyWorld(
            (document.getElementById("theCanvas") as HTMLCanvasElement),
            "./config/world-config.json",
            "./config/sprite-config.json"
        );
        world.start();
}