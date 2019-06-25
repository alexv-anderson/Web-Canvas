import { FlatWorld } from "./flat-world.js";
import { LayeredLayout } from "./layer.js";
export class LayeredFlatWorld extends FlatWorld {
    constructor() {
        super(...arguments);
        this.layout = new LayeredLayout();
    }
    onConfigurationLoaded(config) {
        super.onConfigurationLoaded(config);
        if (config.layout !== undefined) {
            let constructedLayers = new Array();
            if (config.layout.defaults !== undefined) {
                let defaults = config.layout.defaults;
                constructedLayers = config.layout.layers.map(layerConfig => this.onConstructLayer(layerConfig, defaults));
            }
            else {
                constructedLayers = config.layout.layers.map(layerConfig => this.onConstructLayer(layerConfig));
            }
            if (config.layout.arrangement) {
                config.layout.arrangement.forEach(layerIndex => this.layout.addLayer(constructedLayers[layerIndex]));
            }
            else {
                constructedLayers.forEach(layer => this.layout.addLayer(layer));
            }
        }
    }
    onUpdate(dt) {
        super.onUpdate(dt);
        this.layout.update(dt);
    }
    render() {
        super.render();
        this.layout.render(this.drawingContext);
    }
}
