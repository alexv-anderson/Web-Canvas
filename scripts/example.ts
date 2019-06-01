import { ActorConfig, Actor, SimpleSpriteWorld, SimpleMultilayeredSpriteWorldConfig } from "./lib/layered-sprite-world.js";
import { SimpleInputAccumalator } from "./lib/input.js"
import { Point } from "./lib/common.js";

/*
 * Only things which need to be implemented to create a new canvas world.
 */

export class Soldier extends Actor<SimpleInputAccumalator> {
    public update(dt: number, inputAccumalator?: SimpleInputAccumalator): void {
        super.update(dt);

        let dx: number = 0;
        let dy: number = 0;

        if(inputAccumalator) {
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
        }

        this.move(dx, dy);
    }
}

class MyWorld extends SimpleSpriteWorld {
    protected onConfigurationLoaded(config: SimpleMultilayeredSpriteWorldConfig): void {
        super.onConfigurationLoaded(config);
    }

    protected constructActorAt(key: string, actorConfig: ActorConfig): Actor<SimpleInputAccumalator> | never {
        if(key === "Soldier") {
            return new Soldier(actorConfig)
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

        this.inputAccumalator.reset();
    }

    private lastClickPoint: Point;
}

window.onload = function() {
        let world = new MyWorld(
            (document.getElementById("theCanvas") as HTMLCanvasElement),
            "./config/world-config.json"
        );
        world.start();
}