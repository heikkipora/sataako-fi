const path = require('path')
const webpack = require('webpack')

module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
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
  }
}
