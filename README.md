# Sprite Generator
By Joel Dies

I will update this documentation when I am not so tired.

**This is not 100% documented but is on its way to being 100% documented.**

Help support these efforts by becoming a [Patreon](https://www.patreon.com/user?u=4928922)

If you wish to use this plugin in a commercial product, or get the full source [you may do so this way](https://gum.co/eivJX).

## Require modules
These modules are required to be installed either globally or locally with node.
 * [Lodash](https://www.npmjs.com/package/lodash)
 * [Canvas](https://www.npmjs.com/package/canvas)
 * [Crypto](https://www.npmjs.com/package/crypto)

## Example
Express-like backend used. Can be places in any system.

### API Call
api/renderer/:type/:object/?params=value

**Example:**
.../api/renderer/object/dumpster/?force=true&base=tint::f3eded|visible=false

### Setup
```
// Import the generator.
var SpriteGen = require(path.join(process.cwd(), '/dist/phreaknation.generator.sprite.js'));
// initialize the generator with a default config. See config.js for more details.
var spritegen = new SpriteGen(path.join(process.cwd(), '/src/js/Sprite Generator/config.js'));
...
```
### RESTful API Post

```
// We pass in the params and query from the request object
var opts = spritegen.getOptions(req.params, req.query);

// Hash the options return to generate the unique name, or handle it yourself.
var hash = spritegen.encrypt(JSON.stringify(opts));

// Create a new sprite. We pass in the options and the hash
var sprite = new spritegen.Sprite(opts, hash);

// We check here to see if the sprite is already generated or not. You can handle this how ever you want.
// You can also override this in the url by passing force=true with the query string.
if (sprite.isLoaded === true) { // sprite is cached
  // return the cached file
  res.json({
    options: opts,
    src: sprite.getImageURL(),
    base64: sprite.getBase64Image(),
  });
} else { // must generate the sprite
  // Process the layers of the sprite with current settings
  sprite.processLayers();
  
  // save the sprite
  sprite.save(function(sprite, stream) {
    // return the generated image details
    res.json({
      options: opts,
      src: sprite.getImageURL(),
      base64: sprite.getBase64Image(),
    });
    
    // We close the write stream to allow anything to access the file.
    stream.end();
  });
}
```

## System Query Params
These are query params that are system specific.

  + _force [boolean] Forces regeneration of an image

## Layer Query Param Breakdown
For each layer param you will need at least 3 parts. The name, a filter, and a value. Filter and value are separated by double colons `::`, and you can pass as many values after the initial filter name. You may add in multiple filters by separating them with the pipe character `|`

  + `|` Filter Separator
  + `::` Value Separator


### Examples
```
?layer=filter::value

?layer=filter::value1::value2

?layer2=filter1::value1&layer2=filter1::value2|filter2::value3
```

## Custom Filters
You can easily custom build your own filters that can work inline with `Sprite Generator`
Below is an example of the tint.js file that is included. All that you need to do is in the config file, point to your filters directory which can be anywhere in your application. The only requirement is that they are functions. The layer object is passed as the first param while the values are passed as the second param as an array.

```
var _ = require('lodash');
module.exports = function(layer, values) {
  if (!_.isUndefined(color)) {
    var shifted = layer.shiftHue(color[0], 'overlay', { height: layer.height, width: layer.width });
    layer.ctx.putImageData(shifted, 0, 0);

    return layer;
  }
  return false;
};
```
## Sprite Object


### getBase64Image
Returns the base64 text of the sprite image.

### getImagePath
Returns the physical location of the sprite image file.

### getImageURL
Returns the relative location of the sprite image file.

### loadImage

```
file
```

### mergeLayers
Merger two canvas contexts together

```
bottomImageCTX, topImageCTX
```

### processLayers
Processes the url params.

### save
Saves out the file to the local filesystem and returns the callback with the sprite and write stream as arguments.

```
callback
```


## Layer Object

```
var height = 100;
var width = 100;
var layer = new spritegen.Layer(height, width);
```

### crop
*TODO:* Move to a filter
Crops the layer as needed.

```
x, y, width, height, apply
```

### getCanvas
Returns the canvas object.

### loadImage

```
file, hash, callback
```

### processURL
Parses a URL

```
url
```

### shiftHue
*TODO:* Move to a filter
Applies a hue mask to a layer.

```
hex, mode, dimensions, position
```
