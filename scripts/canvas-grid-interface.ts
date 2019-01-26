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
    actorInitialInfo: Array<ActorConfigData>
}
type ActorConfigData = {
    initialLocation: Array<number>,
    initialSpriteIndex: number,
    spriteKeys: Array<string>
}

type SpriteConfig = { spriteImageInfo: Array<SpriteInitInfo> }