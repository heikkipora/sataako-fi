import compression from 'compression'
import express from 'express'
import {
  radarFramesList,
  radarEstimateFramesList,
  imageFileForRadarTimestamp,
  imageFileForRadarEstimateTimestamp,
  initializeCache,
  refreshCache
} from './cache.js'

const MAX_RADAR_FRAMES = 12
const MAX_ESTIMATE_FRAMES = 4
const PORT = process.env.PORT || 3000
const PUBLIC_URL_PORT = process.env.NODE_ENV === 'production' ? '' : `:${PORT}`

// eslint-disable-next-line max-statements
async function initApp() {
  const app = express()
  app.disable('x-powered-by')
  if (process.env.NODE_ENV == 'production') {
    app.enable('trust proxy')
  } else {
    const {bindDevAssets} = await import('./dev-assets.js')
    bindDevAssets(app)
  }
  app.use(compression())
  app.use(express.static('public'))

  app.get('/frame/:timestamp', (req, res) =>
    serveFrame(imageFileForRadarTimestamp(req.params.timestamp), res)
  )

  app.get('/frame/estimate/:timestamp', (req, res) =>
    serveFrame(imageFileForRadarEstimateTimestamp(req.params.timestamp), res)
  )

  app.get('/frames.json', (req, res) => {
    const radarFrames = radarFramesList(MAX_RADAR_FRAMES, `${req.protocol}://${req.hostname}${PUBLIC_URL_PORT}/frame/`)
    const esimateFrames = radarEstimateFramesList(MAX_ESTIMATE_FRAMES, `${req.protocol}://${req.hostname}${PUBLIC_URL_PORT}/frame/estimate/`)
    res.set('Cache-Control', 'public, max-age=20');
    res.json(radarFrames.concat(esimateFrames))
  })

  await initializeCache()
  refreshCache(MAX_RADAR_FRAMES + 1, MAX_ESTIMATE_FRAMES, 30)
  return new Promise(resolve => app.listen(PORT, resolve))
}

function serveFrame(image, res) {
  if (image) {
    res.set('Cache-Control', 'public, max-age=86400');
    res.format({
      'image/png': () => {
        res.set('Content-Type', 'image/png')
        res.sendFile(image.png)
      },
      'image/webp': () => {
        res.set('Content-Type', 'image/webp')
        res.sendFile(image.webp)
      }
    })
  } else {
    res.status(404).send('Sorry, no radar image found for that timestamp')
  }
}

initApp()
  .then(() => console.log(`Cache is being populated and server listening on port ${PORT}`))
