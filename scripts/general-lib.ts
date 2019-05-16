/**
 * Loads a PNG file from a server
 * @param pngURL The URL of the PNG file
 * @param callback A function which will process the image element after it has been loaded
 */
export function loadPNG(pngURL: string, callback: (image: HTMLImageElement) => void) {
    // Based on example found at https://www.html5rocks.com/en/tutorials/file/xhr2/
    let xhr = new XMLHttpRequest();
    xhr.open("GET", pngURL, true);
    xhr.responseType = "blob";
    xhr.onload = function(this: XMLHttpRequest, event: ProgressEvent) {
        if(this.status == 200) {
            let blob = this.response;
            let img = document.createElement("img");
            img.onload = (event: Event) => {
                window.URL.revokeObjectURL(img.src);
            }
            img.src = window.URL.createObjectURL(blob);
            callback(img);
        }
    }
    xhr.send();
}

/**
 * Loads a JSON file from a server
 * @param jsonURL The URL of the JSON file
 * @param callback A function which will process the object after it has been loaded
 */
export function loadJSON(jsonURL: string, callback: (json: any) => void) {
    loadWebResource(jsonURL, "GET", "application/json", (text) => callback(JSON.parse(text)));
}  

/**
 * Loads the text of a resource from a server
 * @param url The URL of the resource to be loaded
 * @param method The method to be used to load the resource (GET or POST)
 * @param mimeType The mime type of the resource
 * @param callback A function which will process the text of the resource after it has been loaded
 */
function loadWebResource(url: string, method: string, mimeType: string, callback: (text: any) => void) {
    let xobj = new XMLHttpRequest();
    xobj.overrideMimeType(mimeType);
    xobj.open(method, url, true);
    xobj.onreadystatechange = function() {
        if(xobj.readyState === 4 && xobj.status === 200) {
            callback(xobj.responseText);
        }
    }
    xobj.send();
}