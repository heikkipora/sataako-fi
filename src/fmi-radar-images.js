const _ = require('lodash')
const axios = require('axios')
const FMI = require('./fmi-constants')
const fs = require('fs')
const GIFEncoder = require('gifencoder')
const {PNG} = require('node-png')

async function fetchPostProcessedRadarFrameAsGif(fmiRadarImage) {
  const gif = cachedGifByUrl(fmiRadarImage.url)
  if (gif) {
    return gif
  }

  // eslint-disable-next-line no-console
  console.log(`Fetching radar image from FMI: ${fmiRadarImage.timestamp}`)
  const frame = await fetchDecodedRadarImage(fmiRadarImage.url)
  const mask = await loadRadarMask()
  const frameNoBorders = removeRadarBordersFromFrame(frame, mask)
  return cacheGif(fmiRadarImage.url, encodeAsGif(frameNoBorders))
}

async function fetchDecodedRadarImage(url) {
  const response = await axios({url, method:'get', responseType:'stream'})
  return decodePngStream(response.data)
}

function removeRadarBordersFromFrame(frameData, frameMask) {
  for (let index = 0; index < frameData.length; index += 4) {
    // eslint-disable-next-line no-bitwise, no-mixed-operators
    const color = frameData[index] << 16 | frameData[index + 1] << 8 | frameData[index + 2]
    if (color === 0xffffff || color === 0xf7f7f7 || frameMask[index + 3] !== 0) {
      frameData[index] = 0xff
      frameData[index + 1] = 0xff
      frameData[index + 2] = 0xff
      frameData[index + 3] = 0
    }
  }
  return frameData
}

function encodeAsGif(frameData) {
  const encoder = new GIFEncoder(FMI.WIDTH, FMI.HEIGHT)
  encoder.start()
  encoder.setQuality(10)
  encoder.setTransparent(0xffffff)
  encoder.addFrame(frameData)
  encoder.finish()
  return new Buffer(encoder.out.getData())
}

const GIF_CACHE = []

function cacheGif(url, gif) {
  GIF_CACHE.push({url, gif, timestamp: now()})
  return gif
}

function cachedGifByUrl(url) {
  cleanupExpiredGifsFromCache()
  const cachedGif = _.find(GIF_CACHE, {url})
  return cachedGif && cachedGif.gif
}

function cleanupExpiredGifsFromCache() {
  _.remove(GIF_CACHE, cachedGif => {
    return now() - cachedGif.timestamp > 70 * 60 * 1000
  })
}

function now() {
  return new Date().getTime()
}

let FRAME_MASK_CACHE = null

async function loadRadarMask() {
  if (!FRAME_MASK_CACHE) {
    const pngStream = fs.createReadStream(`${__dirname}/radar-mask.png`)
    FRAME_MASK_CACHE = await decodePngStream(pngStream)
  }
  return FRAME_MASK_CACHE
}

function decodePngStream(stream) {
  const png = stream.pipe(new PNG())
  return new Promise((resolve, reject) => {
    png.on('parsed', resolve)
    png.on('error', reject)
  })
}

module.exports = {
  fetchPostProcessedRadarFrameAsGif
}
