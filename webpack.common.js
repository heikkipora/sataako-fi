import webpack from 'webpack'
import {URL} from 'url'

const config = {
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
    path: new URL('./build/public', import.meta.url).pathname
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx']
  },
  performance: {
    hints: false
  }
}

export default config
