
import {fetchLightnings} from './fmi-lightnings.js'
import {fetchPostProcessedRadarFrame} from './fmi-radar-images.js'
import fs from 'fs'
import {generateRadarFrameTimestamps, wmsRequestForRadar} from './fmi-radar-frames.js'
import path from 'path'

/* eslint-disable no-await-in-loop */

let IMAGE_CACHE = []
const LIGHTNING_CACHE = []
const USE_LOCAL_LIGHTNING_DATA = process.env.NODE_ENV === 'local'
const CACHE_FOLDER = process.env.NODE_ENV === 'production' ? '/var/run/sataako' : '/tmp/sataako-cache'

export async function initializeCache() {
  await fs.promises.mkdir(CACHE_FOLDER, {recursive: true})
  IMAGE_CACHE = await populateFromDisk(CACHE_FOLDER)
  console.log(`Radar frames cached at ${CACHE_FOLDER} (found ${IMAGE_CACHE.length} frames cached earlier)`)
}

export async function refreshCache(framesToKeep, refreshIntervalSeconds, once = false) {
  await refreshRadarCache()
  await refreshLightningCache(getFrameTimestampsAsDates())

  if (!once) {
    setTimeout(() => refreshCache(framesToKeep, refreshIntervalSeconds), refreshIntervalSeconds * 1000)
  }

  async function refreshRadarCache() {
    try {
      const timestamps = generateRadarFrameTimestamps(framesToKeep)
      const radarImages = requestConfigsForNonCachedFrames(timestamps)
      await fetchAndCacheImages(radarImages)
      await pruneCache(timestamps)
    } catch (err) {
      console.error(`Failed to fetch radar frames list from FMI API: ${err.message}`)
    }
  }

  async function refreshLightningCache(frameTimestamps) {
    try {
      const cacheSize = LIGHTNING_CACHE.length
      const lightnings = await fetchLightnings(frameTimestamps, USE_LOCAL_LIGHTNING_DATA)
      for (const lightning of lightnings) {
        LIGHTNING_CACHE.push(lightning)
      }
      LIGHTNING_CACHE.splice(0, cacheSize)
    } catch (err) {
      console.error(`Failed to fetch lightning list from FMI API: ${err.message}`)
    }
  }
}

function requestConfigsForNonCachedFrames(timestamps) {
  return timestamps
    .filter(timestampNotInCache)
    .map(timestamp => ({
      requestConfig: wmsRequestForRadar(timestamp),
      timestamp
    }))
}

function timestampNotInCache(timestamp) {
  return IMAGE_CACHE.every(image => image.timestamp !== timestamp)
}

async function fetchAndCacheImages(requestConfigs) {
  for (const {requestConfig, timestamp} of requestConfigs) {
    try {
      const isEmpty = await fetchPostProcessedRadarFrame(requestConfig, path.join(CACHE_FOLDER, timestamp))
      if (!isEmpty) {
        IMAGE_CACHE.push({timestamp})
      }
    } catch (err) {
      if (!err.response || err.response.status != 404) {
        console.error(`Failed to fetch radar image for ${JSON.stringify(requestConfig)}: ${err.message}`)
      }
    }
  }
}

async function pruneCache(validTimestamps) {
  const keepInCache = IMAGE_CACHE.filter(image => validTimestamps.includes(image.timestamp))
  const evictFromCache = IMAGE_CACHE.filter(image => !keepInCache.includes(image))
  IMAGE_CACHE = keepInCache

  for (const {timestamp} of evictFromCache) {
    await fs.promises.unlink(path.join(CACHE_FOLDER, `${timestamp}.png`))
    await fs.promises.unlink(path.join(CACHE_FOLDER, `${timestamp}.webp`))
  }
}

export function imageFileForTimestamp(timestamp) {
  if (!isTimestampInCache(timestamp)) {
    return null
  }

  return {
    png: path.join(CACHE_FOLDER, `${timestamp}.png`),
    webp: path.join(CACHE_FOLDER, `${timestamp}.webp`)
  }
}

function isTimestampInCache(timestamp) {
  return IMAGE_CACHE.some(image => image.timestamp === timestamp)
}

export function framesList(publicFramesRootUrl) {
  return IMAGE_CACHE
    .map(({timestamp}) => ({
      image: publicFramesRootUrl + timestamp,
      lightnings: coordinatesForLightnings(timestamp),
      timestamp
    }))
    .sort(compareTimestamp)
}

function getFrameTimestampsAsDates() {
  return IMAGE_CACHE
    .sort(compareTimestamp)
    .map(image => new Date(image.timestamp))
}

function coordinatesForLightnings(timestamp) {
  const {locations} = LIGHTNING_CACHE.find(item => item.timestamp === timestamp) || {}
  return locations || []
}

function compareTimestamp(a, b) {
  return a.timestamp.localeCompare(b.timestamp)
}

async function populateFromDisk() {
  const filenames = await fs.promises.readdir(CACHE_FOLDER)
  return filenames.map(filename => {
      if (filename.endsWith('.png')) {
        return filename.replace('.png', '')
      }
      return null
    })
    .filter(timestamp => timestamp)
    .map(timestamp => ({timestamp}))
}
