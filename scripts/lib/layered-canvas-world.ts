
import { World, WorldConfig } from "./world.js";
import { Layer, LayeredLayout } from "./layer.js";

/**
 * Reperesents everything on the canvas
 */
export abstract class LayeredWorld<C extends WorldConfig> extends World<C> {

    protected onConfigurationLoaded(config: C): void {
        super.onConfigurationLoaded(config);
    }

    public onUpdate(dt: number) {
        super.onUpdate(dt);
        
        for(let i = 0; i < this.layout.depth; i++) {
            this.layout.getLayer(i).update(dt);
        }
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