const browserify = require('browserify-middleware')
const lessMiddleware = require('less-middleware')
const path = require('path')

function bindDevAssets(app) {
  app.use(lessMiddleware(`${__dirname}/../public`))
  app.get('/client.js', browserify(path.join(__dirname, '/client/index.js'), {
    transform: [['babelify', {
      global: true,
      ignore: [/\/node_modules\/(?!ol\/)/],
      presets: ["@babel/env", "@babel/react"]
    }]]
  }))
}

module.exports = {
  bindDevAssets
}
