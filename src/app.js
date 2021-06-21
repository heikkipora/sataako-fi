import compression from 'compression'
import express from 'express'
import {framesList, imageFileForTimestamp, initializeCache, refreshCache} from './cache.js'

const MAX_FRAMES = 12
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

  app.get('/frame/:timestamp', (req, res) => {
    const image = imageFileForTimestamp(req.params.timestamp)
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
  })

  app.get('/frames.json', (req, res) => {
    const publicRootUrl = `${req.protocol}://${req.hostname}${PUBLIC_URL_PORT}/frame/`
    res.set('Cache-Control', 'public, max-age=60');
    res.json(framesList(MAX_FRAMES, publicRootUrl))
  })

  await initializeCache()
  refreshCache(MAX_FRAMES + 1, 60)
  return new Promise(resolve => app.listen(PORT, resolve))
}

initApp()
  .then(() => console.log(`Cache is being populated and server listening on port ${PORT}`))
  .catch(console.error)
