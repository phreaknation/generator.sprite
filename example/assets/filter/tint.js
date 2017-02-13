/* global module */
/* global require */

var _ = require('lodash');
module.exports = function(layer, color) {
  if (!_.isUndefined(color)) {
    var shifted = layer.shiftHue(color[0], 'overlay', { height: layer.height, width: layer.width });
    layer.ctx.putImageData(shifted, 0, 0);

    return layer;
  }
  return false;
};
