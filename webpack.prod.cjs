const common = require('./webpack.common.cjs')
const {merge} = require('webpack-merge')

module.exports = merge(common, {
  mode: 'production',
  entry: {
    client: [
      './public/client.less',
      './src/client/index.tsx'
    ],
    'maplibre-gl-worker': 'maplibre-gl/dist/maplibre-gl-worker.mjs'
  }
})
