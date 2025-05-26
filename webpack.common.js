// webpack.common.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

console.log(`🏗️  Bygger med PUBLIC_PATH=${process.env.PUBLIC_PATH || '/'} 🚀`);

module.exports = {
  entry: './scripts/app.js',
  output: {
    // add a rev-hash to the filename to avoid caching issues
    filename: 'bndl.[contenthash].js',
    chunkFilename: 'chnk.[contenthash].js',
    // output to the "www-deploy"-folder, the old "www"-folder
    // is replaced by the deploy script
    path: path.resolve(__dirname, 'www-deploy'),
    clean: true,
    // sätt PUBLIC_PATH om du vill ha en annan path än "/", t.ex. "/demo/slump/www":
    // PUBLIC_PATH="/demo/slump/www" npm run build
    publicPath: process.env.PUBLIC_PATH || '/',
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
      
      {
        test: /tw\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { sourceMaps: true }, // enable source maps for babel
        },
      },
      // add support for .less files
      {
        test: /\.less$/i,
        use: [
          // compiles Less to CSS
          'style-loader',
          'css-loader',
          'less-loader',
        ],
      },
      // copy images to the "www/img"-folder
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name][ext]',
        },
      },

      // copy fonts to the "www/fonts"-folder
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      favicon: './img/favicon.ico',
      lang: 'sv',
      meta: {
        viewport: 'width=device-width, initial-scale=1',
        robots: 'index, follow',
      },
      template: './index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'varning.template*', to: '' }, // Copy varning.template-html-files to www-folder
        { from: 'googlef01bc830ea17f73e.html', to: '' }, // Copy google site verification to www-folder
        { from: 'img/og-screenshot.png', to: 'img' }, // Copy og-screenshot.png to www/img-folder
        // Not needed because sitemaps are generated on server
        // { from: 'sitemap*.xml', to: '' }, // Copy all individual sitemaps (sitemap_0.txt, sitemap_1.txt, etc.)
      ],
    }),
  ],
};
