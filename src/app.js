const compression = require('compression')
const enforce = require('express-sslify')
const express = require('express')
const {imageForTimestamp, framesList} = require('./cache')

const PORT = process.env.PORT || 3000
const PUBLIC_URL_PORT = process.env.NODE_ENV === 'production' ? '' : `:${PORT}`

const app = express()
app.disable('x-powered-by')
if (process.env.NODE_ENV == 'production') {
  app.enable('trust proxy')
  app.use(enforce.HTTPS({trustProtoHeader: true}))
} else {
  // eslint-disable-next-line global-require
  const {bindDevAssets} = require('./dev-assets')
  bindDevAssets(app)
}
app.use(compression())
app.use(express.static(`${__dirname}/../public`))

app.get('/frame/:timestamp', (req, res) => {
  const png = imageForTimestamp(req.params.timestamp)
  if (png) {
    res.set('Content-Type', 'image/png')
    res.send(png)
  } else {
    res.status(404).send('Sorry, no radar image found for that timestamp')
  }
})

app.get('/frames.json', (req, res) => {
  const publicRootUrl = `${req.protocol}://${req.hostname}${PUBLIC_URL_PORT}/frame/`
  res.json(framesList(publicRootUrl))
})

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${server.address().port}`)
})
