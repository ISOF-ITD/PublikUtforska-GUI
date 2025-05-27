// webpack.prod.js
const { merge } = require('webpack-merge');

const common = require('./webpack.common');

module.exports = merge(common, {

  mode: 'production',
  devtool: 'source-map', // external source maps for production

  // tells webpack to split the code
  // into multiple files
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },

});
