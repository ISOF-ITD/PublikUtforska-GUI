// webpack.prod.js
const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');

const common = require('./webpack.common');

module.exports = merge(common, {

  mode: 'production',
  // activate source-map for debugging, but disable for production to get the best performance
  // devtool: 'source-map', // external source maps for production
  devtool: false,

  // Varnar om en JavaScript-fil eller hela första sidladdningen blir större
  // än den nuvarande produktionsstorleken. Webpacks standardgräns är för låg.
  performance: {
    maxAssetSize: 400 * 1024,
    maxEntrypointSize: 600 * 1024,
  },

  // tells webpack to split the code
  // into multiple files
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: false,
      }),
    ],
    splitChunks: {
      chunks: 'all',
    },
  },

});
