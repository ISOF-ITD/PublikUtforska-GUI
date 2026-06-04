// webpack.prod.js
const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');

const common = require('./webpack.common');

module.exports = merge(common, {

  mode: 'production',
  devtool: 'source-map', // external source maps for production

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
