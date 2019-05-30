## World

The layout and contents of the canvas/world are specified in a JSON file similar to the one below:
```json
{
    "view": {
        "height": 64,
        "width": 160
    },
    "spriteSources": [
        {
            "baseURL": "./images/",
            "sheets": [
                {
                    "fileName": "TicTacToe.png",
                    "sprites": [
                        {
                            "key": "corner",
                            "frameHeight": 32,
                            "frameWidth": 32,
                            "sourceX": 64,
                            "sourceY": 96
                        }
                    ]
                }
            ],
            "singles": [
                {
                    "fileName": "moving-water-down-vertical.png",
                    "key": "wd",
                    "frameWidth": 32,
                    "frameHeight": 32,
                    "frames": {
                        "numberOfFrames": 4,
                        "isHorizontal": false,
                        "framesPerSecond": 4,
                        "loop": true,
                        "autoStart": true
                    }
                }
            ]
        }
    ],
    "layers": {
        "defaults": {
            "stepHeight": 32,
            "stepWidth": 32
        },
        "index": [
            {
                "sprites": {
                    "wd": [
                        [0, 3], [0, 4]
                    ]
                }
            },
            {
                "step": {
                    "width": 64
                },
                "sprites": {
                    "corner": [
                        [0, 1]
                    ]
                }
            }
        ],
        "arrangement": [ 1, 0 ]
    },
    "actorConfigs": {
        "Soldier": [
            {
                "location": [70, 30],
                "isi": 0,
                "sprites": [ "rsl" ]
            }
        ]
    }
}
```
- `view` contains properties about the canvas/view
    - `height` is the height of the canvas element in pixels
    - `width` is the width of the canvas element in pixels
- `spriteSources` is a list of sources from which image files can be found
  - `baseURL` is the URL of the source
  - `sheets` is a list of images which contain multiple sprites
    - `fileName` is the image's file path from the `baseURL`
    - `defaultSpriteProperties` _(Optional)_ specifies default values for properties of the sprites in the sheet
        -  `frameHeight` _(Optional)_ is the default height _(in pixels)_ of the sprites in the sheet
        - `frameWidth` _(Optional)_ is the default width _(in pixels)_ of the sprites in the sheet
    - `sprites` is a list of the sprites in the file
      - `key` the key by which the sprite will be refered to in the world configuration file and the library's API.
      - `frameHeight` _(Optional)_ is the height of the sprite in pixels. If no default is given, then the height will be the height of the sheet.
      - `frameWidth` _(Optional)_ is the width of the sprite in pixels. If no default is given, then the width will be the width of the sheet.
      - `sourceX` _(Optional)_ The x-coordinate of the sprite in the image. Default value is `0`.
      - `sourceY` _(Optional)_ The y-coordinate of the sprite in the image. Default value is `0`.
      - `frames` _(Optional)_ an object which describes sprites which have multiple frames.
        - `numberOfFrames`  is the number of times which the sprite's frame repeats in the sheet. If no `frame` object is given, then a default value of `1` is used.
        - `isHorizontal` is a boolean flag indicating if the multiple frames used by the sprite progress horizontally or vertically. If no `frame` object is given, then a default value of `true` is used.
        - `framesPerSecond` is the number of frames which should be shown in a single second. If no `frame` object is given, then a default value of `32` is used.
        - `loop` is a boolean flag indicating if the the zeroth frame should be shown after the last frame creating a looped animation. If no `frame` object is given, then a default value of `true` is used.
        - `autoStart` is a boolean flag indicating of the progression of frames should begin once the world has been set into motion. If no `frame` object is given, then a default value of `false` is used.
  - `singles` is a list of images which contain a single sprite
    - `fileName` is the image's file path from the `baseURL`
    - `key` the key by which the sprite will be refered to in the world configuration file and the library's API.
    - `frameHeight` _(Optional)_ is the height of the sprite in pixels. Default value is the height of the image.
    - `frameWidth` _(Optional)_ is the width of the sprite in pixels. Default value is the width of the image.
    - `frames` _(Optional)_ an object which describes sprites which have multiple frames.
      - `numberOfFrames`  is the number of times which the sprite's frame repeats in the sheet. If no `frame` object is given, then a default value of `1` is used.
      - `isHorizontal` is a boolean flag indicating if the multiple frames used by the sprite progress horizontally or vertically. If no `frame` object is given, then a default value of `true` is used.
      - `framesPerSecond` is the number of frames which should be shown in a single second. If no `frame` object is given, then a default value of `32` is used.
      - `loop` is a boolean flag indicating if the the zeroth frame should be shown after the last frame creating a looped animation. If no `frame` object is given, then a default value of `true` is used.
      - `autoStart` is a boolean flag indicating of the progression of frames should begin once the world has been set into motion. If no `frame` object is given, then a default value of `false` is used.
- `layers` describes the layers in the world.
    - `defaults`  _(Optional)_ sets default values for the per-layer properties
        - `stepHeight` _(Optional)_ the default step height used by all layers
        - `stepWidth` _(Optional)_ the default step width used by all layers
    - `index` is a list of objects which describe the layers of sprites.
        - `step` _(Optional)_ describes the step sizes used by the layer to form its grid
            - `height` _(Optional)_ is the number of pixels between the layer's horizontal gird lines
            - `width` _(Optional)_ is the number of pixels between the layer's vertical gird lines
        - `sprites` is an object whose properites are the `key`s found in the `spriteSources`. Each property is a list of pairs of numbers. Each pair is a _(row, column)_ coordinate of in the layer's grid.
    - `arrangement` _(Optional)_ is a list which uses the indexes of the objects in `index` to re-arrange the order of the layers.
- `actorConfigs` _(Optional)_ is an object whose properties are the names of the subclasses of the `Actor` class. The properties are lists of objects where each object represents an instance of the subclass in the world
  - `location` is the location of the actor in pixels
  - `sprites` the `key`s of the sprites which the actor can access
  - `isi` is the index if the default sprite in the `sprites` list