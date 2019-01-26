/// <reference path="local.ts" />

/*
 * Only things which need to be implemented to create a new canvas world.
 */

/**
 * Supplies the URL for the host's image directory
 */
function getImageDirURL(): string {
    return getHostURL() + "images/";
}

/**
 * Loads the world configuration file
 * @param onLoaded Called once the configuration data has been loaded
 */
function loadWorldConfig(onLoaded: (config: WorldConfig) => void): void {
    loadJSON(getConfigDirURL() + "world-config.json", onLoaded);
}

/**
 * Loads the sprite configuration file
 * @param onLoaded Called once the configuration data has been loaded
 */
function loadSpriteConfig(onLoaded: (config: SpriteConfig) => void): void {
    loadJSON(getConfigDirURL() + "sprite-config.json", onLoaded);
}

/**
 * Gets the canvas element
 * @param callback Called once the canvas element has bee located
 */
function getCanvas(callback: (canvas: HTMLCanvasElement) => void) {
    callback(document.getElementById("theCanvas") as HTMLCanvasElement);
}