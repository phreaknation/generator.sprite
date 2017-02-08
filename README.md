# generator.sprite

I will update this documentation when I am not so tired.


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
api/renderer/item/chemlight/?colors=d000d0

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
if (sprite.isLoaded === true) { // sprite is cached
  // return the cached file
  res.json({
    src: sprite.getImageURL(),
    base64: sprite.getBase64Image(),
  });
} else { // must generate the sprite
  // Process the layers of the sprite with current settings
  sprite.processLayers();

  // save the sprite
  sprite.save(function(sprite) {
    // return the generated file
    res.json({
      src: sprite.getImageURL(),
      base64: sprite.getBase64Image(),
    });
  });
}
```
