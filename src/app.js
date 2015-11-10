import _ from 'lodash'
import express from 'express'
import compression from 'compression'
import Queue from 'promise-queue'
import {fetchRadarImageUrls} from './fmi-radar-frames'
import {fetchPostProcessedRadarFrameAsGif} from './fmi-radar-images'

const PORT = process.env.PORT || 3000
const PUBLIC_FRAMES_ROOT = process.env.CLOUDFRONT_URL || `http://localhost:${PORT}/frame/`

const app = express()
app.use(compression())
app.use(express.static('public'))

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
    .then((urls) => {
      res.json(urls.map(toPublicUrl))
    })
    .catch((err) => {
      console.error(err)
      res.status(500).json([])
    })

})

app.get('/wms/frames.json', (req, res) => res.redirect('/frames.json'))

app.get('/frame/:timestamp', (req, res) => {
  listQueue.add(fetchRadarImageUrls)
    .then((urls) => {
      const fmiRadarImage = _.find(urls, {timestamp: req.params.timestamp})
      if (fmiRadarImage) {
        imageQueue.add(() => {
          return fetchPostProcessedRadarFrameAsGif(fmiRadarImage).then((gif) => {
            res.set('Content-Type', 'image/gif')
            res.send(gif)
          })
        })
          .catch((err) => {
            console.error(err)
            res.status(500).send('Failed fetching radar image')
          })
      } else {
        res.status(404).send('Sorry, no radar image found for that timestamp')
      }
    })
})

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${server.address().port}`)
})
