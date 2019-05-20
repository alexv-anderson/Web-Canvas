/**
 * Represents a layer of sprites which for the background/floor
 */
export interface Layer {
    update(dt: number): void;
    
    /**
     * Renders the layer on the supplied canvas
     * @param context The rendering context of the canvas on which the layer should be rendered
     */
    render(context: CanvasRenderingContext2D): void;
}

/**
 * Represents a list of layers
 */
export class LayeredLayout {
    /**
     * Adds a layer on top of the existing layers
     * @param layer The layer to be placed at the top of the list
     */
    public addLayer(layer: Layer): void {
        this.layers.push(layer);
    }

    /**
     * Supplies the layer at the given index.
     * 
     * Note: the lowest layer has an index of 0
     * @param index The index of the desired layer
     */
    public getLayer(index: number): Layer {
        return this.layers[index];
    }

    /**
     * The number of layers in this layout
     */
    public get depth(): number {
        return this.layers.length;
    }

    /**
     * Renders the layers of the layout in order
     * @param context The rendering context of the canvas on which the layout should be rendered
     */
    public render(context: CanvasRenderingContext2D): void {
        this.layers.forEach((layer: Layer) => { layer.render(context); });
    }

    private layers: Array<Layer> = [];
}
