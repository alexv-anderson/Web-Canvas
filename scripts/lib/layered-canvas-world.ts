
import { World, WorldConfig, InputAccumalator } from "./base-canvas-world.js";
import { Layer, LayeredLayout } from "./layer.js";

/**
 * Reperesents everything on the canvas
 */
export abstract class LayeredWorld<C extends WorldConfig, IA extends InputAccumalator> extends World<C, IA> {

    protected onConfigurationLoaded(config: C): void {
        
    }

    /**
     * Renders the world
     * @param spriteMap A map from keys to sprites
     * @param context The rendering context of the canvas on which the world should be rendered
     */
    public render(): void {
        // Draw sprites
        this.layout.render(this.drawingContext);

        super.render();
    }

    /**
     * Adds a layer to the top of the world's stack of layers
     * @param layer The layer to be added
     */
    protected addLayer(layer: Layer) {
        this.layout.addLayer(layer);
    }

    protected get numberOfLayers(): number {
        return this.layout.depth;
    }

    protected getLayerAtIndex(index: number): Layer {
        return this.layout.getLayer(index);
    }

    private layout: LayeredLayout = new LayeredLayout();
}