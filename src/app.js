const compression = require('compression')
const enforce = require('express-sslify')
const express = require('express')
const {imageFileForTimestamp, framesList} = require('./cache')

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
  const image = imageFileForTimestamp(req.params.timestamp)
  if (image) {
    res.set('Cache-Control', 'public, max-age=86400');
    if (req.accepts('webp')) {
      res.set('Content-Type', 'image/webp')
      res.sendFile(image.webp)
    } else {
      res.set('Content-Type', 'image/png')
      res.sendFile(image.png)
    }
  } else {
    res.status(404).send('Sorry, no radar image found for that timestamp')
  }
})

app.get('/frames.json', (req, res) => {
  const publicRootUrl = `${req.protocol}://${req.hostname}${PUBLIC_URL_PORT}/frame/`
  res.set('Cache-Control', 'public, max-age=60');
  res.json(framesList(publicRootUrl))
})

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${server.address().port}`)
})
