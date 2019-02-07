
const _ = require('lodash')
const {fetchPostProcessedRadarFrame} = require('./fmi-radar-images')
const {fetchRadarImageUrls} = require('./fmi-radar-frames')

const IMAGE_CACHE = []
const REFRESH_ONE_MINUTE = 60 * 1000

refreshCache()

async function refreshCache() {
  try {
    const radarImageUrls = await fetchRadarImageUrls()
    const newImageUrls = radarImageUrls.filter(({url}) => !_.find(IMAGE_CACHE, {url}))
    fetchAndCacheImages(newImageUrls)
    pruneCache(radarImageUrls)
  } catch (err) {
    console.error(`Failed to fetch radar frames list from FMI API: ${err.message}`)
  }

  setTimeout(refreshCache, REFRESH_ONE_MINUTE)
}

async function fetchAndCacheImages(imageUrls) {
  for (const {url, timestamp} of imageUrls) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const {png, webp} = await fetchPostProcessedRadarFrame(url)
      IMAGE_CACHE.push({png, timestamp, url, webp})
    } catch (err) {
      console.error(`Failed to fetch radar image from ${url}: ${err.message}`)
    }
  }
}

function pruneCache(validImageUrls) {
  _.remove(IMAGE_CACHE, ({url}) => !_.find(validImageUrls, {url}))
}

function imageForTimestamp(timestamp) {
  return _.find(IMAGE_CACHE, {timestamp})
}

function framesList(publicFramesRootUrl) {
  return _(IMAGE_CACHE)
  .map(({timestamp}) => ({
    image: publicFramesRootUrl + timestamp,
    timestamp
  }))
  .sortBy(['timestamp'])
  .value()
}

module.exports = {
  imageForTimestamp,
  framesList
}
