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

type LayerConfig = { [key in string]: Array<Array<number>> };

type WorldConfig = {
    view: { height: number, width: number },
    layers: Array<LayerConfig>,
    actorConfigs?: {
        [key in string]: [
            {
                location: Array<number>,
                isi: number,
                sprites: Array<string>
            }
        ]
    }
}

type SpriteConfig = { spriteImageInfo: Array<SpriteInitInfo> }