import common from './webpack.common.js'
import {merge} from 'webpack-merge'
import webpack from 'webpack'

const config = merge(common, {
  mode: 'development',
  entry: [
    './src/client/index.tsx',
    'webpack-hot-middleware/client'
  ],
  plugins: [new webpack.HotModuleReplacementPlugin()],
  devtool: 'inline-source-map'
})

export default config
