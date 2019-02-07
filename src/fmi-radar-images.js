const _ = require('lodash')
const axios = require('axios')
const sharp = require('sharp')

const CACHE_TIME_2_HOURS = 2 * 60 * 60 * 1000

async function fetchPostProcessedRadarFrameAsPng(fmiRadarImage) {
  const png = cachedPngByUrl(fmiRadarImage.url)
  if (png) {
    return png
  }

  console.log(`Fetching radar image from FMI: ${fmiRadarImage.timestamp}`)
  const data = await fetchRadarImage(fmiRadarImage.url)
  const newPng = await processPng(data)
  return cachePng(fmiRadarImage.url, newPng)
}

async function fetchRadarImage(url) {
  const response = await axios({url, method: 'get', responseType: 'arraybuffer'})
  return Buffer.from(response.data)
}

async function processPng(input) {
  const {data, info} = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true})

  applyAlphaChannel(data)

  const {width, height, channels} = info
  return sharp(data, {raw: {width, height, channels}})
    .overlayWith(`${__dirname}/radar-edges.png`)
    .png()
    .toBuffer()
}

function applyAlphaChannel(data) {
  for (let i = 0; i < data.length; i += 4) {
    // eslint-disable-next-line no-bitwise, no-mixed-operators
    const color = data[i] << 16 | data[i + 1] << 8 | data[i + 2]
    if (color === 0xffffff || color === 0xf7f7f7) {
      data[i + 3] = 0
    }
  }
}

const PNG_CACHE = []

function cachePng(url, png) {
  PNG_CACHE.push({url, png, timestamp: now()})
  return png
}

function cachedPngByUrl(url) {
  cleanupExpiredPngsFromCache()
  const cached = _.find(PNG_CACHE, {url})
  return cached && cached.png
}

function cleanupExpiredPngsFromCache() {
  _.remove(PNG_CACHE, cached => {
    return now() - cached.timestamp > CACHE_TIME_2_HOURS
  })
}

function now() {
  return new Date().getTime()
}

module.exports = {
  fetchPostProcessedRadarFrameAsPng
}
