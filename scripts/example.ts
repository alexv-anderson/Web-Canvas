import { LayeredSpriteWorldConfig, ActorConfig } from "./lib/layered-sprite-canvas-world-interface.js";
import { Actor, SpriteWorld, SpriteLayer } from "./lib/layered-sprite-canvas-world.js";
import { SimpleInputAccumalator } from "./lib/input.js"
import { Point } from "./lib/world.js";

/*
 * Only things which need to be implemented to create a new canvas world.
 */

export class Soldier extends Actor<SimpleInputAccumalator> {
    public update(inputAccumalator: SimpleInputAccumalator): void {
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

class MyWorld extends SpriteWorld<LayeredSpriteWorldConfig, SimpleInputAccumalator> {
    constructor(canvas: HTMLCanvasElement, configURL: string, spriteMapURL: string) {
        super(canvas, configURL, spriteMapURL);

        this.ia = new SimpleInputAccumalator(canvas);
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

    protected constructActorAt(key: string, actorConfig: ActorConfig): Actor<SimpleInputAccumalator> | never {
        if(key === "Soldier") {
            return new Soldier(
                new Point(actorConfig.location[0], actorConfig.location[1]),
                actorConfig.isi,
                actorConfig.sprites
            )
        }
        
        return super.constructActorAt(key, actorConfig);
    }

    public onUpdate(dt: number): void {
        super.onUpdate(dt);
        
        if(this.inputAccumalator.mouseDown && this.inputAccumalator.mouseDownPoint) {
            if(this.lastClickPoint) {
                this.addLine(
                    this.lastClickPoint.x,
                    this.lastClickPoint.y,
                    this.inputAccumalator.mouseDownPoint.x,
                    this.inputAccumalator.mouseDownPoint.y,
                    "red",
                    2
                )
            }

            this.lastClickPoint = this.inputAccumalator.mouseDownPoint;
        }
    }

    protected get inputAccumalator(): SimpleInputAccumalator {
        return this.ia;
    }

    private ia: SimpleInputAccumalator;

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