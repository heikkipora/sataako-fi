import fs from 'fs'
import compression from 'compression'
import express from 'express'
import http from 'http'
import {framesList, imageFileForTimestamp, initializeCache, refreshCache} from './cache.ts'

const MAX_FRAMES = 12
const PORT = process.env.PORT || 3000
const PUBLIC_URL_PORT = process.env.NODE_ENV === 'production' ? '' : `:${PORT}`

const app = express()
const httpServer = new http.Server(app)

if (process.env.NODE_ENV !== 'production' && fs.existsSync('./src/dev-assets.ts')) {
  const {bindDevAssets} = await import('./dev-assets.ts')
  bindDevAssets(app)
}

app.disable('x-powered-by')
app.enable('trust proxy')
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

httpServer.listen(PORT, () => {
  console.log(`Listening on port *:${PORT}`)
})
