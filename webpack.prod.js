import common from './webpack.common.js'
import {merge} from 'webpack-merge'

const config = merge(common, {
  mode: 'production',
  entry: [
    './src/client/index.tsx'
  ]
})

export default config
