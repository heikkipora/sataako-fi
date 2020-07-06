import _ from 'lodash'
import axios from 'axios'
import FMI from './fmi-constants.js'
import fs from 'fs'
import url from 'url'
import xml2js from 'xml2js'
import xml2jsProcessors from 'xml2js/lib/processors.js'

const {parseStringPromise} = xml2js
const {firstCharLowerCase, stripPrefix} = xml2jsProcessors

const FEATURE_URL = url.parse(FMI.WFS_FEATURE_URL)
FEATURE_URL.query = {
  request: 'getFeature',
  // eslint-disable-next-line camelcase
  storedquery_id: 'fmi::observations::lightning::multipointcoverage'
}
console.log(`Configured lightning URL stem: ${url.format(FEATURE_URL)}`)

async function fetchLightnings(frameDates) {
  if (frameDates.length < 2) {
    return []
  }

  const data = await loadData(frameDates)
  const wfsResponse = await xmlToObject(data)
  const lightnings = extractLocationsAndTimes(wfsResponse)
  return snapLightningsToFrames(lightnings, frameDates)
}

async function loadData(frameDates) {
  if (process.env.NODE_ENV == 'local') {
    const lightningPath = 'resources/multipointcoverage.xml'
    console.log(`Loading lightnings locally from: ${lightningPath}`)
    return fs.promises.readFile(lightningPath)
  }
  const lightningsUrl = constructLightningsUrl(frameDates)
  return (await axios.get(lightningsUrl)).data
}

function constructLightningsUrl(frameDates) {
  const frameInterval = frameDates[1].getTime() - _.first(frameDates).getTime()
  // Fetch lightnings before first frame
  const starttime = new Date(_.first(frameDates).getTime() - frameInterval)
  const endtime = _.last(frameDates)
  const lightningsUrl = {...FEATURE_URL}
  lightningsUrl.query.starttime = starttime.toISOString()
  lightningsUrl.query.endtime = endtime.toISOString()
  return url.format(lightningsUrl)
}

function xmlToObject(xml) {
  return parseStringPromise(xml, {tagNameProcessors: [stripPrefix, firstCharLowerCase]})
}

function extractLocationsAndTimes(queryResult) {
  // No lightnings atm
  if (!_.has(queryResult.featureCollection, 'member')) {
    return []
  }
  return _(queryResult.featureCollection.member[0].gridSeriesObservation[0]
    .result[0].multiPointCoverage[0].domainSet[0].simpleMultiPoint[0].positions[0]
    .split('\n')
    .map(_.trim))
    .map(pos =>
    ({
      // Pos is (lat, lon) - GeoJSON in client is (lon, lat)
      location: pos.split(' ').slice(0, 2).map(parseFloat).reverse(),
      time: new Date(parseInt(pos.split(' ')[2], 10) * 1000)
    }))
    .uniqWith(_.isEqual)
    .value()
}

function snapLightningsToFrames(lightnings, frameDates) {
  return frameDates.map((frame) => ({
      timestamp: frame.toISOString(),
      locations: _.remove(lightnings, ({time}) => time < frame).map(({location}) => location)
    })
  )
}

export {
  fetchLightnings
}
