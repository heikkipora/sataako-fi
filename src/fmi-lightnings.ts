import axios from 'axios'
import fs from 'fs'
import proj4 from 'proj4'
import {EPSG_3067_BOUNDS} from './fmi-radar-frames.ts'
import {XMLParser} from 'fast-xml-parser'
import type {Lightning, LightningCacheItem} from './types.ts'

proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs')

const xmlParser = new XMLParser({
  parseTagValue: false,
  removeNSPrefix: true
})

const FEATURE_URL = new URL('https://opendata.fmi.fi/wfs')
FEATURE_URL.searchParams.set('request', 'getFeature')
FEATURE_URL.searchParams.set('storedquery_id', 'fmi::observations::lightning::multipointcoverage')
FEATURE_URL.searchParams.set('bbox', proj4('EPSG:3067', 'WGS84', EPSG_3067_BOUNDS).join(','))
console.log(`Configured lightning URL stem: ${FEATURE_URL.toString()}`)

export async function fetchLightnings(frameDates: Date[], useLocalData: boolean = false): Promise<LightningCacheItem[]> {
  if (frameDates.length < 2) {
    return []
  }

  const data = await loadData(frameDates, useLocalData)
  const wfsResponse = xmlParser.parse(data)
  const lightnings = extractLocationsAndTimes(wfsResponse)
  return snapLightningsToFrames(lightnings, frameDates)
}

async function loadData(frameDates: Date[], useLocalData: boolean): Promise<string | Buffer> {
  if (useLocalData) {
    const lightningPath = 'resources/multipointcoverage.xml'
    console.log(`Loading lightnings locally from: ${lightningPath}`)
    return fs.promises.readFile(lightningPath)
  }
  const lightningsUrl = constructLightningsUrl(frameDates)
  return (await axios.get(lightningsUrl, {timeout: 30000})).data
}

function constructLightningsUrl(frameDates: Date[]): string {
  const [firstDate, secondData] = frameDates
  const frameInterval = secondData.getTime() - firstDate.getTime()
  const starttime = new Date(firstDate.getTime() - frameInterval)
  const endtime = frameDates[frameDates.length - 1]
  const lightningsUrl = new URL(FEATURE_URL.toString())
  lightningsUrl.searchParams.set('starttime', starttime.toISOString())
  lightningsUrl.searchParams.set('endtime', endtime.toISOString())
  return lightningsUrl.toString()
}

interface WFSResponse {
  FeatureCollection?: {
    member?: {
      GridSeriesObservation: {
        result: {
          MultiPointCoverage: {
            domainSet: {
              SimpleMultiPoint: {
                positions: string
              }
            }
          }
        }
      }
    }
  }
}

function extractLocationsAndTimes(wfsResponse: WFSResponse): Lightning[] {
  if (!wfsResponse.FeatureCollection?.member) {
    // No lightnings observed in this collection period
    return []
  }

  const {positions} = wfsResponse.FeatureCollection.member.GridSeriesObservation.result.MultiPointCoverage.domainSet.SimpleMultiPoint
  return positions
    .split('\n')
    .map(pos => {
      const [lat, lon, seconds] = pos.trim().split(' ')
      return {
        location: [parseFloat(lon), parseFloat(lat)] as [number, number],
        time: new Date(parseInt(seconds, 10) * 1000)
      }
    })
}

function snapLightningsToFrames(lightnings: Lightning[], frameDates: Date[]): LightningCacheItem[] {
  return frameDates.map((frameDate, index) => ({
      timestamp: frameDate.toISOString(),
      locations: locationsAfterPreviousFrame(lightnings, frameDate, frameDates[index - 1])
    })
  )
}

function locationsAfterPreviousFrame(lightnings: Lightning[], currentTime: Date, previousTime: Date = new Date(0)): Array<[number, number]> {
  return lightnings
    .filter(l => l.time > previousTime && l.time <= currentTime)
    .map(f => f.location)
}
