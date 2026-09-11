const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        // MapLibre v6 loads optional scripts at runtime with import(url): the deprecated RTL text
        // plugin and importScriptInWorkers(). Webpack cannot resolve those statically and warns;
        // the app uses neither.
        test: /node_modules\/maplibre-gl\/dist\/.*\.mjs$/,
        parser: {
          exprContextCritical: false
        }
      },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader'
        ]
      },
      {
        test: /\.(ttf|html)$/i,
        type: 'asset/resource'
      }
    ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build/public')
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx']
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'client.css'
    })
  ]
}
