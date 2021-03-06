const path = require('path');

const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

// We need this for a few things
const version = require(path.join(__dirname, 'package.json')).version;

// Copy the manifest.json, inserting the current version as we go
const copy = new CopyWebpackPlugin([
  {
    context: './src/',
    from: 'popup/popup.html',
    to: 'popup/popup.html',
  },
  {
    context: './src/',
    from: 'manifest.json',
    to: 'manifest.json',
    transform: (content) => {
      return content.toString()
        .replace('VERSION', `"${version}"`);
    },
  },
]);

const zip = new ZipPlugin({
  path: path.join(__dirname, 'dist'),
  filename: `fl-conversion-helper-${version}.zip`,
});

module.exports = {
  entry: {
    'index.js': './src/index.js',
    'popup/popup.js': './src/popup/popup.js',
  },
  output: {
    path: `${__dirname}/build/`,
    filename: '[name]',
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ExtractTextWebpackPlugin.extract({
          use: ['css-loader', 'sass-loader']
        }),
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['env', 'stage-0'],
        },
      },
    ],
  },
  plugins: [
    copy,
    zip,
    new ExtractTextWebpackPlugin('style.css'),
    new webpack.DefinePlugin({
      DEBUG: process.env.NODE_ENV !== 'production',
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
