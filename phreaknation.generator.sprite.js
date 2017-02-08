module.exports = (function() {
  'use strict';


  var __modulename = 'sprite_generator';
  var __pluginname = 'SpriteGenerator';
  var __version = [0, 0, 1];
  var __description = 'Generate sprites via a back end, as well as saving them via the Registry Plugin via Base64 and cache.';
  var __author = 'Joel Dies <phreaknation@gmail.com>';

  var $ = {
    fs: require('fs'),
    path: require('path'),
    url: require('url'),
    _: require('lodash'),
    Canvas: require('canvas'),
    crypto: require('crypto'),
  };

  var imgSize = {};
  var config;

  var module = function(configFile) {
    config = {
      folders: {
        cache: '/assets/images/cache/',
        src: $.path.join(process.cwd(), 'src/images/'),
        output: $.path.join(process.cwd(), 'public/assets/images/cache/'),
        www: $.path.join(process.cwd(), '/public/'),
      },
    };

    if ($._.isString(configFile) && $.fs.existsSync(configFile)) {
      config = require(configFile);
    }
    return this;
  };


  var Cache = function(opts) {
    this._opts = opts;

    return this;
  };

  module.prototype.Cache = Cache;


  Cache.prototype.getImagePath = function getImagePath(hash) {
    var imagePath = $.path.join(config.folders.src, this._opts.type, this._opts.name, 'cache', hash + '.png');
    return imagePath;
  };


  var Layer = function(height, width) {
    this._canvas = new $.Canvas(width, height);
    this.ctx = this._canvas.getContext('2d');
    return this;
  };

  module.prototype.Layer = Layer;


  Layer.prototype.crop = function crop(x, y, width, height, apply) {
    apply = apply || false;
    var canvas = new $.Canvas(this.config.details.width, this.config.details.height);
    var ctx = this._canvas.getContext('2d');

    this.canvas.width = width;
    this.canvas.height = height;

    ctx.drawImage(this._canvas, x, y, width, height,
      0, 0, this._canvas.width, this._canvas.height);

    if (apply) {
      this._canvas = canvas;
      this._ctx = ctx;
      return this;
    } else {
      return canvas;
    }
  };


  Layer.prototype.loadImage = function loadImage(file, hash, callback) {
    var imgSize = $.sizeOf(file);
    var canvas = new $.Canvas(imgSize.width, imgSize.height);
    var ctx = canvas.getContext('2d');
    var i = new $.Canvas.Image();

    i.src = $.fs.readFileSync(file);
    ctx.drawImage(i, 0, 0, i.width, i.height);

    if (callback) {
      callback(canvas, hash);
    }
  };


  Layer.prototype.shiftHue = function shiftHue(hex, mode, dimensions, position) {
    mode = mode || 'overlay';
    position = position || {
      x: 0,
      y: 0,
    };
    var imgData = this.ctx.getImageData(position.x, position.y, dimensions.width, dimensions.height);
    var dataArray = imgData.data;
    for (var i = 0; i < dataArray.length; i += 4) {
      var red = dataArray[i]; 
      var green = dataArray[i + 1]; 
      var blue = dataArray[i + 2]; 
      var alpha = dataArray[i + 3]; 

      if (alpha !== 0) {
        var r = parseInt(hex.substr(0, 2), 16);
        var g = parseInt(hex.substr(2, 2), 16);
        var b = parseInt(hex.substr(4, 2), 16);

        switch (mode) {
          case 'multiply':
            dataArray[i] = (red * r) / 255;
            dataArray[i + 1] = (green * g) / 255;
            dataArray[i + 2] = (blue * b) / 255;
            dataArray[i + 3] = alpha;
            break;
          case 'overlay':
            dataArray[i] = r < 128 ? (2 * red * r / 255) : (255 - ((2 * (255 - red) * (255 - r)) / 255));
            dataArray[i + 1] = g < 128 ? (2 * green * g / 255) : (255 - ((2 * (255 - green) * (255 - g)) / 255));
            dataArray[i + 2] = b < 128 ? (2 * blue * b / 255) : (255 - ((2 * (255 - blue) * (255 - b)) / 255));
            dataArray[i + 3] = alpha;
            break;
          default:
            dataArray[i] = red;
            dataArray[i + 1] = green;
            dataArray[i + 2] = blue;
            dataArray[i + 3] = alpha;
        }
      }
    }
    return imgData;

  };


  var Sprite = function(opts, hash) {
    this._opts = opts;
    this._srcFolder = $.path.join(config.folders.src, opts.type, opts.name);
    this._hash = hash;
    this._hashfile = $.path.join(config.folders.output, hash + '.png');
    this._config = require(this._srcFolder + '/sprite.json');

    this._canvas = new $.Canvas(this._config.details.width, this._config.details.height);
    this.ctx = this._canvas.getContext('2d');

    if (!$.fs.existsSync($.path.join(config.folders.www, config.folders.cache)))
      $.fs.mkdirSync($.path.join(config.folders.www, config.folders.cache));

    this.type = opts.type;
    this.name = opts.name;
    this.hash = hash;
    this.isLoaded = false;

    if ($.fs.existsSync(this._hashfile)) {
      var i = this.loadImage(this._hashfile);
      this.ctx.drawImage(i, 0, 0, this._config.details.width, this._config.details.height);
      this.isLoaded = true;
    }
    return this;
  };

  module.prototype.Sprite = Sprite;


  Sprite.prototype.getBase64Image = function getBase64Image(opts, img) {
    return this._canvas.toDataURL();
  };


  Sprite.prototype.getImagePath = function getImagePath() {
    return this._hashfile;
  };


  Sprite.prototype.getImageURL = function getImageURL() {
    return config.folders.cache + this._hash + '.png';
  };


  Sprite.prototype.loadImage = function loadImage(file) {
    var spritesheet = new $.Canvas.Image();
    if (!$._.isUndefined(file)) { 
      spritesheet.src = $.fs.readFileSync(file);
    }
    return spritesheet;
  };


  Sprite.prototype.mergeLayers = function mergeLayers(bottomImageCTX, topImageCTX) {
    var bottomImageData = bottomImageCTX.getImageData(0, 0, this._canvas.width, this._canvas.height);
    var topImageData = topImageCTX.getImageData(0, 0, this._canvas.width, this._canvas.height);
    var bottomDataArray = bottomImageData.data;
    var topDataArray = topImageData.data;
    for (var i = 0; i < bottomDataArray.length; i += 4) {

      var topLayer = {
        red: topDataArray[i],
        green: topDataArray[i + 1],
        blue: topDataArray[i + 2],
        alpha: topDataArray[i + 3]
      };

      if (topLayer.alpha !== 0) {
        bottomDataArray[i] = topLayer.red;
        bottomDataArray[i + 1] = topLayer.green;
        bottomDataArray[i + 2] = topLayer.blue;
        bottomDataArray[i + 3] = topLayer.alpha;
      }
    }

    return bottomImageData;
  };


  Sprite.prototype.processLayers = function processLayers() {
    var sprite = this;
    var canvas = sprite._canvas;
    var ctx = sprite.ctx;
    var config = sprite._config;
    var opts = sprite._opts;
    var i;

    var spritesheet = sprite.loadImage($.path.join(sprite._srcFolder, 'spritesheet.png'));
    var indexes = [];

    $._.each(sprite._config.layers, (function(_layer, index) {
      var cfgSS = sprite._config.spritesheet[_layer.name];
      if ($._.isUndefined(cfgSS)) {
        cfgSS = {
          x: 0,
          y: 0,
          height: sprite._canvas.height,
          width: sprite._canvas.width,
        };
      }

      $._.each(_layer.options, function(option, index) {
        var type = $._.toLower(option.type);
        var layer = new Layer(canvas.height, canvas.width);
        switch (type) {
          case 'color':
            var colorIndex = indexes.color;
            var flatData;
            var color;


            if ($._.isArray(opts.colors)) {
              if ($._.isUndefined(colorIndex)) indexes.color = colorIndex = 0;
              color = opts.colors[colorIndex];
            } else if ($._.isString(opts.colors)) {
              color = opts.colors;
            } else {
              color = 'ffffff';
            }

            if (!$._.isUndefined(color)) {
              var layerFile = $.path.join(sprite._srcFolder, _layer.src);
              var colorImage = sprite.loadImage(layerFile);
              var colorLayer = new Layer(cfgSS.height, cfgSS.width);
              colorLayer.ctx.drawImage(colorImage, cfgSS.x, cfgSS.y, cfgSS.width, cfgSS.height, 0, 0, cfgSS.width, cfgSS.height);
              var shifted = colorLayer.shiftHue(color, 'overlay', cfgSS);
              layer.ctx.putImageData(shifted, 0, 0);
              flatData = sprite.mergeLayers(ctx, layer.ctx);
              ctx.putImageData(flatData, 0, 0);
            }


            colorIndex++;
            break;
          case 'variation':
            var vIndex = indexes.variation;
            if ($._.isUndefined()) indexes.variation = vIndex = 0;
            var vCanvas = new $.Canvas($.imgSize.width, $.imgSize.height);

            if (sprite._opts.variations[vIndex - 1]) {
              var v = sprite._opts.variations[vIndex - 1];
              if (!i) i = new $.Canvas.Image();

              i.src = $.fs.readFileSync(sprite._srcFolder + '/variations/' + v[0] + '.png');
              if (v[1]) {
                ctx.drawImage(i, ((parseInt(v[1]) - 1) / $.imgSize.width), 0, i.width, i.height);
              } else {
                ctx.drawImage(i, 0, 0, i.width, i.height);
              }
            }
            break;
          default:
            var layerFile = $.path.join(sprite._srcFolder, _layer.src);
            var baseImage = sprite.loadImage(layerFile);
            var baseLayer = new Layer(cfgSS.height, cfgSS.width);
            baseLayer.ctx.drawImage(baseImage, cfgSS.x, cfgSS.y, cfgSS.width, cfgSS.height, 0, 0, cfgSS.width, cfgSS.height);
            layer.ctx.putImageData(baseLayer.ctx.getImageData(0, 0, cfgSS.width, cfgSS.height), 0, 0);
            flatData = sprite.mergeLayers(ctx, layer.ctx);
            ctx.putImageData(flatData, 0, 0);
        }
      });
    }).bind(sprite));

    sprite.isLoaded
    return sprite;
  };


  Sprite.prototype.save = function save(callback) {
    var __funcname = 'save';
    var fileOutput = $.fs.createWriteStream(this._hashfile);
    var stream = this._canvas.pngStream();

    stream.on('data', (function(chunk) {
      this.write(chunk);
    }).bind(fileOutput));

    stream.on('end', (function(callback) {
      if ($._.isFunction(callback)) callback(this);
      console.log('[%s][%s] Generated Sprite `%s`.', __modulename, __funcname, this._hash);
    }).bind(this, callback));
  };

  module.prototype.description = function description() {
    return $._.capitalize($._.replace(__modulename, /\_/g, ' ')) + ' module by ' + __author + '. ' + __description;
  };

  module.prototype.version = function version() {
    return __version.join('.');
  };


  module.prototype.buildImage = function buildImage(opts, hash, callback) {
    var srcFolder = $.path.join(config.folders.src, opts.type, opts.name);

    return ctx;
  };

  module.prototype.encrypt = function encrypt(preHash) {
    return $.crypto.createHash('md5').update(preHash).digest("hex");
  };


  module.prototype.getOptions = function getOptions(params, query) {
    var __funcname = 'getOptions';
    var colors = query.colors ? query.colors.split('::') : false;
    var variations = query.variations ? query.variations.split('::') : false;
    var opts = {};

    if (!$._.isString(params.type)) throw Error('[' + __modulename + '][' + __funcname + '] Type is either undefined or not a string.');
    if (!$._.isString(params.name)) throw Error('[' + __modulename + '][' + __funcname + '] Name is either undefined or not a string.');
    opts.type = params.type;
    opts.name = params.name;

    if ($._.isArray(colors) && colors.length > 0) {
      opts.colors = query.colors;
    }

    if ($._.isArray(variations) && variations.length > 0) {
      opts.variations = [];
      $._.each(variations, function(variation, index) {
        var v = variation.split('||');
        opts.variations.push(v);
      });
    }

    return opts;
  };


  return module;
})();