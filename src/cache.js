
const _ = require('lodash')
const {fetchPostProcessedRadarFrameAsPng} = require('./fmi-radar-images')
const {fetchRadarImageUrls} = require('./fmi-radar-frames')

const PNG_CACHE = []
const REFRESH_ONE_MINUTE = 60 * 1000

refreshCache()

async function refreshCache() {
  try {
    const radarImageUrls = await fetchRadarImageUrls()
    const newImageUrls = radarImageUrls.filter(({url}) => !_.find(PNG_CACHE, {url}))
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
      const png = await fetchPostProcessedRadarFrameAsPng(url)
      PNG_CACHE.push({png, timestamp, url})
    } catch (err) {
      console.error(`Failed to fetch radar image from ${url}: ${err.message}`)
    }
  }
}

function pruneCache(validImageUrls) {
  _.remove(PNG_CACHE, ({url}) => !_.find(validImageUrls, {url}))
}

function imageForTimestamp(timestamp) {
  const item = _.find(PNG_CACHE, {timestamp})
  return item && item.png
}

function framesList(publicFramesRootUrl) {
  return PNG_CACHE.map(({timestamp}) => ({
    image: publicFramesRootUrl + timestamp,
    timestamp
  }))
}

module.exports = {
  imageForTimestamp,
  framesList
}
