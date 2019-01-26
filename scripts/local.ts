/**
 * Supplies the URL for the index of the host
 */
function getHostURL(): string {
    return "http://127.0.0.1:8000/";
}

/**
 * Supplies the URL for the host's configuration directory
 */
function getConfigDirURL(): string {
    return getHostURL() + "config/";
}