/**
 * Supplies the URL for the index of the host
 */
export function getHostURL(): string {
    return "http://127.0.0.1:8000/";
}

/**
 * Supplies the URL for the host's configuration directory
 */
export function getConfigDirURL(): string {
    return getHostURL() + "config/";
}