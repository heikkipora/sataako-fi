import axios from 'axios'
import {EPSG_3067_BOUNDS} from './fmi-radar-frames.js'
import fs from 'fs'
import proj4 from 'proj4'
import url from 'url'
import xml2js from 'xml2js'
import xml2jsProcessors from 'xml2js/lib/processors.js'

const {parseStringPromise} = xml2js
const {firstCharLowerCase, stripPrefix} = xml2jsProcessors

proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs')

const FEATURE_URL = url.parse('https://opendata.fmi.fi/wfs')
FEATURE_URL.query = {
  request: 'getFeature',
  // eslint-disable-next-line camelcase
  storedquery_id: 'fmi::observations::lightning::multipointcoverage',
  bbox: proj4('EPSG:3067', 'WGS84', EPSG_3067_BOUNDS).join(',')
}
console.log(`Configured lightning URL stem: ${url.format(FEATURE_URL)}`)

export async function fetchLightnings(frameDates, useLocalData = false) {
  if (frameDates.length < 2) {
    return []
  }

  const data = await loadData(frameDates, useLocalData)
  const wfsResponse = await xmlToObject(data)
  const lightnings = extractLocationsAndTimes(wfsResponse)
  return snapLightningsToFrames(lightnings, frameDates)
}

async function loadData(frameDates, useLocalData) {
  if (useLocalData) {
    const lightningPath = 'resources/multipointcoverage.xml'
    console.log(`Loading lightnings locally from: ${lightningPath}`)
    return fs.promises.readFile(lightningPath)
  }
  const lightningsUrl = constructLightningsUrl(frameDates)
  return (await axios.get(lightningsUrl, {timeout: 30000})).data
}

function constructLightningsUrl(frameDates) {
  const [firstDate, secondData] = frameDates
  const frameInterval = secondData.getTime() - firstDate.getTime()
  const starttime = new Date(firstDate.getTime() - frameInterval)
  const endtime = frameDates[frameDates.length - 1]
  const lightningsUrl = {...FEATURE_URL}
  lightningsUrl.query.starttime = starttime.toISOString()
  lightningsUrl.query.endtime = endtime.toISOString()
  return url.format(lightningsUrl)
}

function xmlToObject(xml) {
  return parseStringPromise(xml, {tagNameProcessors: [stripPrefix, firstCharLowerCase]})
}

function extractLocationsAndTimes({featureCollection}) {
  if (!featureCollection.member) {
    // No lightnings observed in this collection period
    return []
  }

  const positions = featureCollection.member[0].gridSeriesObservation[0].result[0].multiPointCoverage[0].domainSet[0].simpleMultiPoint[0].positions[0]
  return positions
    .split('\n')
    .map(pos => {
      const [lat, lon, seconds] = pos.trim().split(' ')
      return {
        location: [parseFloat(lon), parseFloat(lat)],
        time: new Date(parseInt(seconds, 10) * 1000)
      }
    })
}

function snapLightningsToFrames(lightnings, frameDates) {
  return frameDates.map((frameDate, index) => ({
      timestamp: frameDate.toISOString(),
      locations: locationsAfterPreviousFrame(lightnings, frameDate, frameDates[index - 1])
    })
  )
}

function locationsAfterPreviousFrame(lightnings, currentTime, previousTime = new Date(0)) {
  return lightnings
    .filter(l => l.time > previousTime && l.time <= currentTime)
    .map(f => f.location)
}
