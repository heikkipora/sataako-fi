import compression from 'compression'
import express from 'express'
import fs from 'fs'
import http from 'http'
import {framesList, imageFileForTimestamp, initializeCache, refreshCache} from './cache.ts'
import {getStats, statsMiddleware} from './dashboard.ts'
import {statsPageHtml} from './dashboard-page.ts'

const MAX_FRAMES = 16
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
app.use(statsMiddleware)

app.get('/dashboard/live', (_req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })
  res.flushHeaders()

  const timer = setInterval(() => {
    res.write(`data: ${JSON.stringify(getStats())}\n\n`)
  }, 1000)

  res.on('close', () => clearInterval(timer))
})

app.use(compression())
app.use(express.static('public'))

app.get('/dashboard', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.type('html').send(statsPageHtml())
})

app.get('/frame/:timestamp', (req, res) => {
  const image = imageFileForTimestamp(req.params.timestamp)
  if (image) {
    res.set('Cache-Control', 'public, max-age=86400')
    res.set('Content-Type', 'image/webp')
    res.sendFile(image)
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
