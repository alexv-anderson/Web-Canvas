## Sprites

Sprites resources are specified in a sprite configuration JSON file similar to the one shown below:
```json
{
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
                    "numberOfFrames": 4,
                    "isHorizontal": false,
                    "fps": 4
                }
            ]
        }
    ]
}
```
- `spriteSources` is a list of sources from which image files can be found
  - `baseURL` is the URL of the source
  - `sheets` is a list of images which contain multiple sprites
    - `fileName` is the image's file path from the `baseURL`
    - `sprites` is a list of the sprites in the file
      - `key` the key by which the sprite will be refered to in the world configuration file and the library's API.
      - `frameHeight` is the height of the sprite in pixels
      - `frameWidth` is the width of the sprite in pixels
      - `numberOfFrames` _(Optional)_ is the number of times which the sprite's frame repeats in the sheet
      - `isHorizontal` _(Optional)_ is a boolean flag indicating if the multiple frames used by the sprite progress horizontally or vertically
      - `fps` _(Optional)_ is the number of frames which should be shown in a single second
      - `sourceX` _(Optional)_ The x-coordinate of the sprite in the image
      - `sourceY` _(Optional)_ The y-coordinate of the sprite in the image
  - `singles` is a list of images which contain a single sprite
    - `fileName` is the image's file path from the `baseURL`
    - `key` the key by which the sprite will be refered to in the world configuration file and the library's API.
    - `frameHeight` is the height of the sprite in pixels
    - `frameWidth` is the width of the sprite in pixels
    - `numberOfFrames` _(Optional)_ is the number of times which the sprite's frame repeats in the sheet
    - `isHorizontal` _(Optional)_ is a boolean flag indicating if the multiple frames used by the sprite progress horizontally or vertically
    - `fps` _(Optional)_ is the number of frames which should be shown in a single second

## World

The layout and contents of the canvas/world is specified in a second JSON file similar to the one below:
```json
{
    "view": {
        "height": 64,
        "width": 160
    },
    "layers":[
        {
            "wd": [
                [0, 3], [0, 4]
            ]
        }
    ],
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
- `layers` is a list of of objects which describe the layers of sprites. The properties of the objects are the `key`s found in the sprite configuration file. Each property is a list of pairs of numbers. Each pair is a coordinate of in the layer's 32x32 pixel grid.
- `actorConfigs` is an object whose properties are the names of the subclasses of the `Actor` class. The properties are lists of objects where each object represents an instance of the subclass in the world
  - `location` is the location of the actor in pixels
  - `sprites` the `key`s of the sprites which the actor can access
  - `isi` is the index if the default sprite in the `sprites` list