import {fetchLightnings} from './fmi-lightnings.ts'
import {fetchPostProcessedRadarFrame} from './fmi-radar-images.ts'
import fs from 'fs'
import {generateRadarFrameTimestamps, wmsRequestForRadar} from './fmi-radar-frames.ts'
import path from 'path'
import type {FrameResponse, ImageCacheItem, ImageFilePaths, LightningCacheItem, RadarFrameRequest} from './types.ts'

let IMAGE_CACHE: ImageCacheItem[] = []
const LIGHTNING_CACHE: LightningCacheItem[] = []
const USE_LOCAL_LIGHTNING_DATA = process.env.NODE_ENV === 'local'
const CACHE_FOLDER = process.env.NODE_ENV === 'production' ? '/var/run/sataako' : '/tmp/sataako-cache'

export async function initializeCache(): Promise<void> {
  await fs.promises.mkdir(CACHE_FOLDER, {recursive: true})
  IMAGE_CACHE = await populateFromDisk(CACHE_FOLDER)
  console.log(`Radar frames cached at ${CACHE_FOLDER} (found ${IMAGE_CACHE.length} frames cached earlier)`)
}

export async function refreshCache(framesToKeep: number, refreshIntervalSeconds: number, once: boolean = false): Promise<void> {
  await refreshRadarCache()
  await refreshLightningCache(getFrameTimestampsAsDates())

  if (!once) {
    setTimeout(() => refreshCache(framesToKeep, refreshIntervalSeconds), refreshIntervalSeconds * 1000)
  }

  async function refreshRadarCache(): Promise<void> {
    try {
      const timestamps = generateRadarFrameTimestamps(framesToKeep)
      const radarImages = requestConfigsForNonCachedFrames(timestamps)
      if (radarImages.length === 0) {
        console.log(new Date(), 'Nothing to fetch, all cached', JSON.stringify(timestamps))
      }
      await fetchAndCacheImages(radarImages)
      await pruneCache(timestamps)
    } catch (err) {
      console.error(`Failed to fetch radar frames list from FMI API: ${(err as Error).message}`)
    }
  }

  async function refreshLightningCache(frameTimestamps: Date[]): Promise<void> {
    try {
      const cacheSize = LIGHTNING_CACHE.length
      const lightnings = await fetchLightnings(frameTimestamps, USE_LOCAL_LIGHTNING_DATA)
      for (const lightning of lightnings) {
        LIGHTNING_CACHE.push(lightning)
      }
      LIGHTNING_CACHE.splice(0, cacheSize)
    } catch (err) {
      console.error(`Failed to fetch lightning list from FMI API: ${(err as Error).message}`)
    }
  }
}

function requestConfigsForNonCachedFrames(timestamps: string[]): RadarFrameRequest[] {
  return timestamps
    .filter(timestampNotInCache)
    .map(timestamp => ({
      requestConfig: wmsRequestForRadar(timestamp),
      timestamp
    }))
}

function timestampNotInCache(timestamp: string): boolean {
  return IMAGE_CACHE.every(image => image.timestamp !== timestamp)
}

async function fetchAndCacheImages(requestConfigs: RadarFrameRequest[]): Promise<void> {
  for (const {requestConfig, timestamp} of requestConfigs) {
    try {
      const isEmpty = await fetchPostProcessedRadarFrame(requestConfig, path.join(CACHE_FOLDER, timestamp))
      console.log(new Date(), 'Fetched', timestamp, isEmpty ? ', was empty' : ', cached it')
      if (!isEmpty) {
        IMAGE_CACHE.push({timestamp})
      }
    } catch (err) {
      const axiosError = err as {response?: {status: number}}
      if (!axiosError.response || axiosError.response.status != 404) {
        console.error(new Date(), `Failed to fetch radar image for ${JSON.stringify(requestConfig)}: ${(err as Error).message}`)
      }
    }
  }
}

async function pruneCache(validTimestamps: string[]): Promise<void> {
  const keepInCache = IMAGE_CACHE.filter(image => validTimestamps.includes(image.timestamp))
  const evictFromCache = IMAGE_CACHE.filter(image => !keepInCache.includes(image))
  IMAGE_CACHE = keepInCache

  for (const {timestamp} of evictFromCache) {
    await fs.promises.unlink(path.join(CACHE_FOLDER, `${timestamp}.png`))
    await fs.promises.unlink(path.join(CACHE_FOLDER, `${timestamp}.webp`))
  }
}

export function imageFileForTimestamp(timestamp: string): ImageFilePaths | null {
  if (!isTimestampInCache(timestamp)) {
    return null
  }

  return {
    png: path.join(CACHE_FOLDER, `${timestamp}.png`),
    webp: path.join(CACHE_FOLDER, `${timestamp}.webp`)
  }
}

function isTimestampInCache(timestamp: string): boolean {
  return IMAGE_CACHE.some(image => image.timestamp === timestamp)
}

export function framesList(maxFrames: number, publicFramesRootUrl: string): FrameResponse[] {
  const frames = IMAGE_CACHE
    .map(({timestamp}) => ({
      image: publicFramesRootUrl + timestamp,
      lightnings: coordinatesForLightnings(timestamp),
      timestamp
    }))
    .sort(compareTimestamp)
  return frames.slice(Math.max(frames.length - maxFrames, 0))
}

function getFrameTimestampsAsDates(): Date[] {
  return IMAGE_CACHE
    .sort(compareTimestamp)
    .map(image => new Date(image.timestamp))
}

function coordinatesForLightnings(timestamp: string): Array<[number, number]> {
  const {locations} = LIGHTNING_CACHE.find(item => item.timestamp === timestamp) || {}
  return locations || []
}

function compareTimestamp(a: {timestamp: string}, b: {timestamp: string}): number {
  return a.timestamp.localeCompare(b.timestamp)
}

async function populateFromDisk(cacheFolder: string): Promise<ImageCacheItem[]> {
  const filenames = await fs.promises.readdir(cacheFolder)
  return filenames.map(filename => {
      if (filename.endsWith('.png')) {
        return filename.replace('.png', '')
      }
      return null
    })
    .filter((timestamp): timestamp is string => timestamp !== null)
    .map(timestamp => ({timestamp}))
}
