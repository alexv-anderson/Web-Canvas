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
    loop?: boolean
}

type LayerConfig = { [key in string]: Array<Array<number>> };

type WorldConfig = {
    view: { height: number, width: number },
    layers: Array<LayerConfig>,
    actors?: Array<Actor>
}

type SpriteConfig = { spriteImageInfo: Array<SpriteInitInfo> }