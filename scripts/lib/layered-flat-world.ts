
import { FlatWorld, FlatWorldConfig } from "./flat-world.js";
import { Layer, LayeredLayout } from "./layer.js";

export interface LayeredFlatWorldConfig<LC extends LayerConfig, LCD extends LayerConfigDefaults, LLC extends LayeredLayoutConfig<LC, LCD>> extends FlatWorldConfig {
    layout?: LLC;    
}
export interface LayeredLayoutConfig<LC extends LayerConfig, LCD> {
    defaults?: LCD;
    layers: Array<LC>;
    arrangement?: Array<number>;
}
export interface LayerConfig {

}
export interface LayerConfigDefaults {

}

/**
 * Reperesents everything on the canvas
 */
export abstract class LayeredFlatWorld<
    C extends LayeredFlatWorldConfig<LC, LCD, LLC>,
    L extends Layer,
    LC extends LayerConfig,
    LCD extends LayerConfigDefaults,
    LLC extends LayeredLayoutConfig<LC, LCD>
    > extends FlatWorld<C> {

    protected onConfigurationLoaded(config: C): void {
        super.onConfigurationLoaded(config);

        if(config.layout !== undefined) {
            let constructedLayers = new Array<L>();
            if(config.layout.defaults !== undefined) {
                let defaults = config.layout.defaults;
                constructedLayers = config.layout.layers.map(layerConfig => this.onConstructLayer(layerConfig, defaults));
            } else {
                constructedLayers = config.layout.layers.map(layerConfig => this.onConstructLayer(layerConfig));
            }

            if(config.layout.arrangement) {
                config.layout.arrangement.forEach(layerIndex => this.layout.addLayer(constructedLayers[layerIndex]));
            } else {
                constructedLayers.forEach(layer => this.layout.addLayer(layer));
            }
        }
    }

    /**
     * Constructs and returns a list of the layers for the world
     * @param config Configuration data for the layers
     */
    protected abstract onConstructLayer(config: LC, defaults?: LCD): L;

    protected onUpdate(dt: number) {
        super.onUpdate(dt);
        
        this.layout.update(dt);
    }

    /**
     * Renders the world
     */
    public render(): void {
        super.render();

        this.layout.render(this.drawingContext);
    }

    private layout: LayeredLayout<L> = new LayeredLayout<L>();
}