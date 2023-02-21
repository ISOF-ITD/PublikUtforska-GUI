const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');

const TerserPlugin = require("terser-webpack-plugin");


module.exports = merge(common, {

  mode: 'production',

  // tells webpack to split the code
  // into multiple files
  optimization: {
    splitChunks: {
      chunks: 'all',
    }
  },

});