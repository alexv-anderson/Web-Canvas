import { WorldConfig } from "./world.js";

export type LayerConfig = { [key in string]: Array<Array<number>> };

export type ActorConfig = {
    location: Array<number>,
    isi: number,
    sprites: Array<string>
}

export interface LayeredSpriteWorldConfig extends WorldConfig {
    layers: Array<LayerConfig>,
    actorConfigs?: {
        [key in string]: [ActorConfig]
    }
}
