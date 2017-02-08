/* global module */
/* global process */
/* global require */

var path = require('path');
module.exports = {
  folders: {
    cache: '/assets/images/cache/',
    src: path.join(process.cwd(), 'src/images/'),
    output: path.join(process.cwd(), 'public/assets/images/cache/'),
    www: path.join(process.cwd(), '/public/'),
  },
};
