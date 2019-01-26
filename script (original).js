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

  that.render = function() {
    that.context.drawImage(
      that.image,  // the spritesheet
      frameIndex * that.width / numberOfFrames,  // x-coordinate on the spritesheet of the top left corner
      0,  // y-coordinate on the spritesheet of the top left corner
      that.width / numberOfFrames,  // width of the frame in the sprite sheet
      that.height,  // height of the frame in the sprite sheet
      0,  // x-coordinate on the canvas of the top left corner
      0,  // y-coordinate on the canvas of the top left corner
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
  var canvas = document.getElementById("theCanvas");
  canvas.width = 32;
  canvas.height = 32;

  var water = sprite({
    context: canvas.getContext("2d"),
    width: 128,
    height: 32,
    image: spritesheet,
    numberOfFrames: 4,
    loop: true
  });

  setInterval(
     function() {
       water.update();
       water.render();
     },
     500
  );
}
