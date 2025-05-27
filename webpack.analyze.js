// webpack.analyze.js
const { merge } = require('webpack-merge');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const common = require('./webpack.common');

module.exports = merge(common, {
  plugins: [new BundleAnalyzerPlugin()],

  mode: 'production',

  // tells webpack to split the code
  // into multiple files
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },

});
