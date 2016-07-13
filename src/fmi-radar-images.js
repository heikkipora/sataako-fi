import fs from 'fs'
import _ from 'lodash'
import request from 'request-promise'
import Promise from 'bluebird'
import {PNG} from 'node-png'
import GIFEncoder from 'gifencoder'
import FMI from './fmi-constants'

let MASK_DATA = []
fs.createReadStream(`${__dirname}/radar-mask.png`).pipe(new PNG()).on('parsed', (data) => MASK_DATA = data)

function removeRadarBordersFromFrame(frameData) {
  for (let index = 0; index < frameData.length; index += 4) {
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

function fetchDecodedRadarImage(url) {
  const png = request(url).pipe(new PNG())
  return new Promise((resolve, reject) => {
    png.on('parsed', resolve)
    png.on('error', reject)
  })
}

const GIF_CACHE = []

function now() {
  return new Date().getTime()
}

function cleanupExpiredGifsFromCache() {
  _.remove(GIF_CACHE, (cachedGif) => {
    return now() - cachedGif.timestamp > 70 * 60 * 1000
  })
}

function fetchPostProcessedRadarFrameAsGif(fmiRadarImage) {
  cleanupExpiredGifsFromCache()
  const cachedGif = _.find(GIF_CACHE, {url: fmiRadarImage.url})
  if (cachedGif) {
    return Promise.resolve(cachedGif.gif)
  }

  console.log(`Fetching radar image from FMI: ${fmiRadarImage.timestamp}`)
  return fetchDecodedRadarImage(fmiRadarImage.url).then(removeRadarBordersFromFrame).then(encodeAsGif)
    .then((gif) => {
      GIF_CACHE.push({url: fmiRadarImage.url, gif: gif, timestamp: now()})
      return gif
    })
}

export {
  fetchPostProcessedRadarFrameAsGif
}
