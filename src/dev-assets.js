import config from '../webpack.dev.js'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'

export function bindDevAssets(app) {
  const compiler = webpack(config)
  app.use(webpackDevMiddleware(compiler))
  app.use(webpackHotMiddleware(compiler))
}
