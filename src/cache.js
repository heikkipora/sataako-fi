
import {fetchLightnings} from './fmi-lightnings.js'
import {fetchPostProcessedRadarFrame} from './fmi-radar-images.js'
import fs from 'fs'
import {
  generateRadarFrameTimestamps,
  generateRadarEstimateFrameTimestamps,
  wmsRequestForRadar,
  wmsRequestForRadarEstimate
} from './fmi-radar-frames.js'
import path from 'path'

/* eslint-disable no-await-in-loop */

let RADAR_FRAME_CACHE = []
let ESTIMATE_FRAME_CACHE = []
const RADAR_FRAME_CACHE_FOLDER = process.env.NODE_ENV === 'production' ? '/var/run/sataako/radar' : '/tmp/sataako-cache/radar'
const ESTIMATE_FRAME_CACHE_FOLDER = process.env.NODE_ENV === 'production' ? '/var/run/sataako/estimate' : '/tmp/sataako-cache/estimate'

const LIGHTNING_CACHE = []
const USE_LOCAL_LIGHTNING_DATA = process.env.NODE_ENV === 'local'

export async function initializeCache() {
  await fs.promises.mkdir(RADAR_FRAME_CACHE_FOLDER, {recursive: true})
  await fs.promises.mkdir(ESTIMATE_FRAME_CACHE_FOLDER, {recursive: true})
  RADAR_FRAME_CACHE = await populateFromDisk(RADAR_FRAME_CACHE_FOLDER)
  ESTIMATE_FRAME_CACHE = await populateFromDisk(ESTIMATE_FRAME_CACHE_FOLDER)
  console.log(`Radar frames cached at ${RADAR_FRAME_CACHE_FOLDER} (found ${RADAR_FRAME_CACHE.length} frames cached earlier)`)
  console.log(`Radar estimate frames cached at ${ESTIMATE_FRAME_CACHE_FOLDER} (found ${ESTIMATE_FRAME_CACHE.length} frames cached earlier)`)
}

export async function refreshCache(radarFramesToKeep, estimateFramesToKeep, refreshIntervalSeconds, once = false) {
  await Promise.allSettled([
    refreshRadarCache(),
    refreshRadarEstimateCache(),
    refreshLightningCache(getRadarFrameTimestampsAsDates())
  ])

  if (!once) {
    setTimeout(() => refreshCache(radarFramesToKeep, estimateFramesToKeep, refreshIntervalSeconds), refreshIntervalSeconds * 1000)
  }

  async function refreshRadarCache() {
    try {
      const timestamps = generateRadarFrameTimestamps(radarFramesToKeep)
      const radarImages = requestConfigsForRadarFrames(timestamps)
      await fetchAndCacheImages(radarImages, RADAR_FRAME_CACHE, RADAR_FRAME_CACHE_FOLDER)
      RADAR_FRAME_CACHE = await pruneCache(RADAR_FRAME_CACHE, RADAR_FRAME_CACHE_FOLDER, timestamps)
    } catch (err) {
      console.error(`Failed to update radar image cache: ${err.message}`)
    }
  }

  async function refreshRadarEstimateCache() {
    try {
      const timestamps = generateRadarEstimateFrameTimestamps(estimateFramesToKeep)
      const radarImages = requestConfigsForRadarEstimateFrames(timestamps)
      await fetchAndCacheImages(radarImages, ESTIMATE_FRAME_CACHE, ESTIMATE_FRAME_CACHE_FOLDER)
      ESTIMATE_FRAME_CACHE = await pruneCache(ESTIMATE_FRAME_CACHE, ESTIMATE_FRAME_CACHE_FOLDER, timestamps)
    } catch (err) {
      console.error(`Failed to update radar estimate image cache: ${err.message}`)
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

function requestConfigsForRadarFrames(timestamps) {
  function timestampNotInCache(timestamp) {
    return RADAR_FRAME_CACHE.every(image => image.timestamp !== timestamp)
  }

  return timestamps
    .filter(timestampNotInCache)
    .map(timestamp => ({
      requestConfig: wmsRequestForRadar(timestamp),
      timestamp
    }))
}

function requestConfigsForRadarEstimateFrames(timestamps) {
  return timestamps
    .map(timestamp => ({
      requestConfig: wmsRequestForRadarEstimate(timestamp),
      timestamp
    }))
}

async function fetchAndCacheImages(requestConfigs, cache, cacheFolder) {
  for (const {requestConfig, timestamp} of requestConfigs) {
    try {
      const isEmpty = await fetchPostProcessedRadarFrame(requestConfig, path.join(cacheFolder, timestamp))
      if (!isEmpty && !cache.some(f => f.timestamp === timestamp)) {
        cache.push({timestamp})
      }
    } catch (err) {
      if (!err.response || err.response.status != 404) {
        console.error(`Failed to fetch image for ${JSON.stringify(requestConfig)}: ${err.message}`)
      }
    }
  }
}

async function pruneCache(cache, cacheFolder, validTimestamps) {
  const keepInCache = cache.filter(image => validTimestamps.includes(image.timestamp))
  const evictFromCache = cache.filter(image => !keepInCache.includes(image))

  for (const {timestamp} of evictFromCache) {
    await fs.promises.unlink(path.join(cacheFolder, `${timestamp}.png`))
    await fs.promises.unlink(path.join(cacheFolder, `${timestamp}.webp`))
  }

  return keepInCache
}

export function imageFileForRadarTimestamp(timestamp) {
  return imageFileForTimestamp(RADAR_FRAME_CACHE, RADAR_FRAME_CACHE_FOLDER, timestamp)
}

export function imageFileForRadarEstimateTimestamp(timestamp) {
  return imageFileForTimestamp(ESTIMATE_FRAME_CACHE, ESTIMATE_FRAME_CACHE_FOLDER, timestamp)
}

function imageFileForTimestamp(cache, cacheFolder, timestamp) {
  if (!isTimestampInCache(cache, timestamp)) {
    return null
  }

  return {
    png: path.join(cacheFolder, `${timestamp}.png`),
    webp: path.join(cacheFolder, `${timestamp}.webp`)
  }
}

function isTimestampInCache(cache, timestamp) {
  return cache.some(image => image.timestamp === timestamp)
}

export function radarFramesList(maxFrames, publicFramesRootUrl) {
  return framesList(RADAR_FRAME_CACHE, maxFrames, publicFramesRootUrl, true)
}

export function radarEstimateFramesList(maxFrames, publicFramesRootUrl) {
  return framesList(ESTIMATE_FRAME_CACHE, maxFrames, publicFramesRootUrl, false)
    .map(frame => ({
      ...frame,
      isEstimate: true
    }))
}

function framesList(cache, maxFrames, publicFramesRootUrl, includeLightnings) {
  const frames = cache
    .map(({timestamp}) => ({
      image: publicFramesRootUrl + timestamp,
      lightnings: includeLightnings ? coordinatesForLightnings(timestamp) : [],
      timestamp
    }))
    .sort(compareTimestamp)
  return frames.slice(Math.max(frames.length - maxFrames, 0))
}

function getRadarFrameTimestampsAsDates() {
  return RADAR_FRAME_CACHE
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

async function populateFromDisk(cacheFolder) {
  const filenames = await fs.promises.readdir(cacheFolder)
  return filenames.map(filename => {
      if (filename.endsWith('.png')) {
        return filename.replace('.png', '')
      }
      return null
    })
    .filter(timestamp => timestamp)
    .map(timestamp => ({timestamp}))
}
