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
    filename: 'client.js',
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
