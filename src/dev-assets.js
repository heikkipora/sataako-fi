import browserify from 'browserify-middleware'
import lessMiddleware from 'less-middleware'

export function bindDevAssets(app) {
  app.use(lessMiddleware('public'))
  app.get('/client.js', browserify('src/client/index.js', {
    transform: [['babelify', {
      global: true,
      ignore: [/\/node_modules\/(?!ol\/)/],
      presets: ["@babel/env", "@babel/react"]
    }]]
  }))
}
