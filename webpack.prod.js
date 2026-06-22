// webpack.prod.js
const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');

const common = require('./webpack.common');

module.exports = merge(common, {

  mode: 'production',
  // activate source-map for debugging, but disable for production to get the best performance
  // devtool: 'source-map', // external source maps for production
  devtool: false,

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
