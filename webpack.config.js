const path = require('path');

module.exports = {
  mode: 'development',
  entry: './scripts/app.js',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'www'),
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                { targets: "defaults" }
              ],
              '@babel/preset-react'
            ]
          }
        }
      },
      // add support for .less files and write them to the www folder
      {
        test: /\.less$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'style.css',
              outputPath: './www/'
            }
          },
          { loader: 'extract-loader' },
          { loader: 'css-loader' },
          { loader: 'less-loader' }
        ]
      }
    ]
  }
};  