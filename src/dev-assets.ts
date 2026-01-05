import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import {createRequire} from 'module'
import type {Configuration} from 'webpack'
import type {Express} from 'express'

const require = createRequire(import.meta.url)

export function bindDevAssets(app: Express) {
  const config = require('../webpack.dev.cjs') as Configuration
  const compiler = webpack(config)
  app.use(webpackDevMiddleware(compiler))
  app.use(webpackHotMiddleware(compiler))
}
