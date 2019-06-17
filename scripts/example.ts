import { SimpleSpriteLayeredFlatWorld, SimpleMultilayeredSpriteWorldConfig, KeyedInstanceProperties } from "./lib/sprite-layered-flat-world.js";
import { SimpleInputAccumalator } from "./lib/input.js"
import { PassiveInstanceConfig, InteractiveInstance, InteractiveInstanceConfig, PassiveInstance } from "./lib/instance.js";
import { RenderableAtPoint } from "./lib/common.js";
import { SpriteGroup } from "./lib/group.js";

/*
 * Only things which need to be implemented to create a new canvas world.
 */

export class Soldier extends InteractiveInstance<SimpleInputAccumalator, KeyedInstanceProperties, SpriteGroup> {
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

class ToggleTile extends InteractiveInstance<SimpleInputAccumalator, KeyedInstanceProperties, SpriteGroup> {
    public update(dt: number): void {
        super.update(dt);

        if(this.inputAccumalator.arrowRightDown || this.inputAccumalator.arrowLeftDown) {
            this.seed.keyIndex = 1;
        } else if (this.inputAccumalator.arrowDownDown || this.inputAccumalator.arrowUpDown) {
            this.seed.keyIndex = 0;
        }
    }
}

class BlinkTile extends PassiveInstance<KeyedInstanceProperties, SpriteGroup> {
    public update(dt: number): void {
        this.timePassed += dt;

        if(this.timePassed > 1000) {
            if(this.showingG) {
                this.seed.keyIndex = 1;
            } else {
                this.seed.keyIndex = 0;
            }

            this.showingG = !this.showingG;
            this.timePassed = 0;
        }
    }

    private showingG: boolean = false;
    private timePassed: number = 0;
}

class MyWorld extends SimpleSpriteLayeredFlatWorld {
    protected onConfigurationLoaded(config: SimpleMultilayeredSpriteWorldConfig): void {
        super.onConfigurationLoaded(config);
    }

    protected onConstructInteractiveInstance(key: string, config: InteractiveInstanceConfig<SimpleInputAccumalator, any, SpriteGroup>): InteractiveInstance<SimpleInputAccumalator, any, RenderableAtPoint> | never {
        if(key === "Soldier") {
            return new Soldier(config);
        } else if(key === "ToggleTile") {
            return new ToggleTile(config);
        }
        
        return super.onConstructInteractiveInstance(key, config);
    }

    protected onConstructPassiveInstance(key: string, config: PassiveInstanceConfig<any, SpriteGroup>): PassiveInstance<any, RenderableAtPoint> | never {
        if(key = "BlinkTile") {
            return new BlinkTile(config);
        }

        return super.onConstructPassiveInstance(key, config);
    }

    public onUpdate(dt: number): void {
        super.onUpdate(dt);
        
        this.inputAccumalator.reset();
    }
}

window.onload = function() {
        let world = new MyWorld(
            (document.getElementById("theCanvas") as HTMLCanvasElement),
            "./config/world-config.json"
        );
        world.play();
}