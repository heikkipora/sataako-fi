const common = require('./webpack.common.cjs')
const {merge} = require('webpack-merge')
const webpack = require('webpack')

module.exports = merge(common, {
  mode: 'development',
  entry: {
    client: [
      './public/client.less',
      './src/client/index.tsx',
      'webpack-hot-middleware/client'
    ],
    'maplibre-gl-worker': 'maplibre-gl/dist/maplibre-gl-worker.mjs'
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  devtool: 'inline-source-map'
})