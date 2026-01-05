const common = require('./webpack.common.cjs')
const {merge} = require('webpack-merge')

module.exports = merge(common, {
  mode: 'production',
  entry: [
    './public/client.less',
    './src/client/index.tsx'
  ]
})
