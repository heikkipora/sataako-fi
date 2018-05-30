const _ = require('lodash')
const browserify = require('browserify-middleware')
const compression = require('compression')
const enforce = require('express-sslify')
const express = require('express')
const {fetchPostProcessedRadarFrameAsGif} = require('./fmi-radar-images')
const {fetchRadarImageUrls} = require('./fmi-radar-frames')
const lessMiddleware = require('less-middleware')
const Queue = require('promise-queue')

const PORT = process.env.PORT || 3000
const PUBLIC_FRAMES_ROOT = process.env.CLOUDFRONT_URL || `http://localhost:${PORT}/frame/`

const app = express()
app.disable('x-powered-by')

app.get('/frame/:timestamp', (req, res) => {
  listQueue.add(fetchRadarImageUrls)
    .then(urls => {
      const fmiRadarImage = _.find(urls, {timestamp: req.params.timestamp})
      if (fmiRadarImage) {
        imageQueue.add(() => {
          return fetchPostProcessedRadarFrameAsGif(fmiRadarImage)
            .then(gif => {
              res.set('Content-Type', 'image/gif')
              res.send(gif)
            })
            .catch(err => {
              console.error(err)
              res.status(500).send('Failed fetching radar image')
            })
          })
      } else {
        res.status(404).send('Sorry, no radar image found for that timestamp')
      }
    })
})

if (process.env.NODE_ENV == 'production') {
  app.use(enforce.HTTPS({trustProtoHeader: true}))
}
app.use(compression())
app.use(lessMiddleware(`${__dirname}/../public`))
app.use(express.static('public'))
app.get('/js/client.js', browserify(__dirname + '/client/index.js'))

const listQueue = new Queue(1, Infinity);
const imageQueue = new Queue(4, Infinity);

app.get('/frames.json', (req, res) => {
  function toPublicUrl(radarUrl) {
    return {
      image: PUBLIC_FRAMES_ROOT + radarUrl.timestamp,
      timestamp: radarUrl.timestamp
    }
  }

  listQueue.add(fetchRadarImageUrls)
    .then(urls => res.json(urls.map(toPublicUrl)))
    .catch(err => {
      console.error(err)
      res.status(500).json([])
    })

})

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${server.address().port}`)
})
