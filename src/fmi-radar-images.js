const _ = require('lodash')
const FMI = require('./fmi-constants')
const fs = require('fs')
const GIFEncoder = require('gifencoder')
const {PNG} = require('node-png')
const Promise = require('bluebird')
const request = require('request-promise')

let MASK_DATA = []
fs.createReadStream(`${__dirname}/radar-mask.png`)
  .pipe(new PNG())
  .on('parsed', data => {
    MASK_DATA = data
  })

function fetchPostProcessedRadarFrameAsGif(fmiRadarImage) {
  const gif = cachedGifByUrl(fmiRadarImage.url)
  if (gif) {
    return Promise.resolve(gif)
  }

  // eslint-disable-next-line no-console
  console.log(`Fetching radar image from FMI: ${fmiRadarImage.timestamp}`)
  return fetchDecodedRadarImage(fmiRadarImage.url)
    .then(removeRadarBordersFromFrame)
    .then(encodeAsGif)
    .then(cacheGif(fmiRadarImage.url))
}

function fetchDecodedRadarImage(url) {
  const png = request(url).pipe(new PNG())
  return new Promise((resolve, reject) => {
    png.on('parsed', resolve)
    png.on('error', reject)
  })
}

function removeRadarBordersFromFrame(frameData) {
  for (let index = 0; index < frameData.length; index += 4) {
    // eslint-disable-next-line no-bitwise, no-mixed-operators
    const color = frameData[index] << 16 | frameData[index + 1] << 8 | frameData[index + 2]
    if (color === 0xffffff || color === 0xf7f7f7 || MASK_DATA[index + 3] !== 0) {
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

function cacheGif(url) {
  return gif => {
    GIF_CACHE.push({url, gif, timestamp: now()})
    return gif
  }
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

module.exports = {
  fetchPostProcessedRadarFrameAsGif
}
