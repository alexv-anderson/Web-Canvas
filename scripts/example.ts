import { SimpleSpriteWorld, SimpleMultilayeredSpriteWorldConfig } from "./lib/layered-sprite-world.js";
import { SimpleInputAccumalator } from "./lib/input.js"
import { InstanceConfig, InteractiveInstance, InteractiveInstanceConfig } from "./lib/instance.js";
import { Point, RenderableAtPoint } from "./lib/common.js";
import { SpriteContainer } from "./lib/container.js";

/*
 * Only things which need to be implemented to create a new canvas world.
 */

export class Soldier extends InteractiveInstance<SimpleInputAccumalator, any, SpriteContainer> {
    public update(dt: number): void {
        super.update(dt);

        let dx: number = 0;
        let dy: number = 0;

        if(this.inputAccumalator.arrowUpDown) {
            dy -= 5;
        }
        if(this.inputAccumalator.arrowDownDown) {
            dy += 5;
        }
        if(this.inputAccumalator.arrowLeftDown) {
            dx -= 5;
        }
        if(this.inputAccumalator.arrowRightDown) {
            dx += 5;
        }

        this.move(dx, dy);
    }
}

class ToggleTile extends InteractiveInstance<SimpleInputAccumalator, any, SpriteContainer> {
    public update(dt: number): void {
        super.update(dt);

        if(this.inputAccumalator.arrowRightDown || this.inputAccumalator.arrowLeftDown) {
            this.seed.keyIndex = 1;
        } else if (this.inputAccumalator.arrowDownDown || this.inputAccumalator.arrowUpDown) {
            this.seed.keyIndex = 0;
        }
    }
}

class MyWorld extends SimpleSpriteWorld {
    protected onConfigurationLoaded(config: SimpleMultilayeredSpriteWorldConfig): void {
        super.onConfigurationLoaded(config);
    }

    protected constructInteractiveInstance(key: string, config: InteractiveInstanceConfig<SimpleInputAccumalator, any, SpriteContainer>): InteractiveInstance<SimpleInputAccumalator, any, RenderableAtPoint> | never {
        if(key === "Soldier") {
            return new Soldier(config);
        } else if(key === "ToggleTile") {
            return new ToggleTile(config);
        }
        
        return super.constructInteractiveInstance(key, config);
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
                );
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
        world.play();
}