
const { merge } = require('webpack-merge');

const common = require('./webpack.common');

module.exports = merge(common, {

  mode: 'development',
  devtool: 'eval-source-map', // faster builds and better debugging

  devServer: {
    historyApiFallback: true,
    static: './dist',

  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },

});
