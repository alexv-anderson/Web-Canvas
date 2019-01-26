var spritesheet = new Image();
spritesheet.src = "moving-water.png";

function sprite(options) {
  var that = {};

  var frameIndex = 0;
  var updatesSinceLastFrame = 0;
  var updatesPerFrame = 0;
  var numberOfFrames = options.numberOfFrames || 1;

  that.context = options.context;
  that.width = options.width;
  that.height = options.height;
  that.image = options.image;
  that.loop = options.loop;

  /**
   * @param x The x-coordinate on the canvas of the top left corner
   * @param y The y-coordinate on the canvas of the top left corner
   */
  that.render = function(x, y) {
    that.context.drawImage(
      that.image,  // the spritesheet
      frameIndex * that.width / numberOfFrames,  // x-coordinate on the spritesheet of the top left corner
      0,  // y-coordinate on the spritesheet of the top left corner
      that.width / numberOfFrames,  // width of the frame in the sprite sheet
      that.height,  // height of the frame in the sprite sheet
      x,
      y,
      that.width / numberOfFrames,  // width of the image on the canvas element
      that.height  // height of the image on the canvas element
    );
  };

  that.update = function() {
    updatesSinceLastFrame += 1;
    if(updatesSinceLastFrame > updatesPerFrame) {
      updatesSinceLastFrame = 0;
      if(frameIndex < numberOfFrames - 1) {
        frameIndex += 1;
      } else if(that.loop) {
        frameIndex = 0;
      }
    }
  }

  return that;
}

function onBodyLoad() {
  document.getElementById('layoutFile').onchange = onLayoutChange;
}

function onLayoutChange() {
  var canvas = document.getElementById("theCanvas");

  var spriteMap = {
    wd: sprite({
      context: canvas.getContext("2d"),
      width: 128,
      height: 32,
      image: spritesheet,
      numberOfFrames: 4,
      loop: true
    })
  };

  var layout = [];
  var file = this.files[0];
  var reader = new FileReader();
  reader.onload = function(progressEvent) {
    var lines = this.result.split('\n');
    for(var i = 0; i < lines.length; i++){
      var row = [];
      var markers = lines[i].split(',');
      if(markers.length == 0 || (markers.length == 1 && markers[0] === ""))
        continue;
      canvas.width = markers.length * 32;
      for(var j = 0; j < markers.length; j++) {
        row.push(markers[j]);
      }
      layout.push(row);
    }
    canvas.height = lines.length * 32;
  }
  reader.readAsText(file);

  setInterval(
     function() {
       for(var k in spriteMap) {
         spriteMap[k].update();
       }

       for(var i in layout) {
         for(var j in layout[i]) {
           spriteMap[layout[i][j]].render(j * 32, i * 32);
         }
       }
     },
     500
  );
}

function getJSON(jsonURL, callback) {
  loadWebResource(jsonURL, "GET", "application/json", (text) => callback(JSON.parse(text)));
}

function loadWebResource(url, method, mimeType, callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrrideMimeType(mimeType);
  xobj.open(method, url, true);
  xobj.onreadystatechange = function() {
    if(xobj.readyState === 4 && xobj.status === 200) {
      callback(xobj.responseText);
    }
  }
}
