/**
 * Type information for the sprite configuration data
 */
type SpriteInitInfo = {
    fileName: string,
    mapKey: string,
    width: number,
    height: number,
    numberOfFrames: number,
    isHorizontal?: boolean,
    fps?: number
}

export type LayerConfig = { [key in string]: Array<Array<number>> };

export type ActorConfig = {
    location: Array<number>,
    isi: number,
    sprites: Array<string>
}

export type WorldConfig = {
    view: { height: number, width: number },
    layers: Array<LayerConfig>,
    actorConfigs?: {
        [key in string]: [ActorConfig]
    }
}

export type SpriteConfig = { spriteImageInfo: Array<SpriteInitInfo> }