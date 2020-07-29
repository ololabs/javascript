const nodeExternals = require('webpack-node-externals');

const path = require('path');
const webpack = require('webpack');

module.exports = {
  devtool: 'sourcemap',
  mode: 'development',
  output: {
    path: path.resolve('./dist'),
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  externals: [nodeExternals({ modulesFromFile: { fileName: 'package.json' } })],
  entry: { main: path.resolve('index.ts') },
  plugins: [new webpack.WatchIgnorePlugin([/dist/])],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
        exclude: [/node_modules/],
      },
      {
        test: /\.ts$/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
          },
        ],
        exclude: [/node_modules/],
      },
      {
        test: /\.(j|t)s$/,
        loader: 'eslint-loader',
        exclude: /node_modules/,
        options: {
          cache: false,
          configFile: path.resolve('.eslintrc.js'),
          emitErrors: true,
          emitWarnings: true,
          enforce: 'pre',
          formatter: 'stylish',
        },
      },
    ],
  },
  optimization: {
    sideEffects: true,
  },
};
