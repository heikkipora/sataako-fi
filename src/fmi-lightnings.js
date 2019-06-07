const axios = require('axios')
const FMI = require('./fmi-constants')
const {parseString} = require('xml2js')
const processors = require('xml2js/lib/processors')
const Promise = require('bluebird')
const url = require('url')
const _ = require('lodash')
const fs = require('fs')

const parseXml = Promise.promisify(parseString)

const FEATURE_URL = url.parse(FMI.WFS_FEATURE_URL)
FEATURE_URL.query = {
  request: 'getFeature',
  // eslint-disable-next-line camelcase
  storedquery_id: 'fmi::observations::lightning::multipointcoverage'
}
console.log(`Configured lightning URL stem: ${url.format(FEATURE_URL)}`)

async function fetchLightnings(frameDates) {
  const data = await loadData(frameDates)
  const wfsResponse = await xmlToObject(data)
  const lightnings = extractLocationsAndTimes(wfsResponse)
  return snapLightningsToFrames(lightnings, frameDates)
}

async function loadData(frameDates) {
  if (process.env.NODE_ENV == 'local') {
    const lightningPath = 'resources/multipointcoverage.xml'
    console.log(`Loading lightnings locally from: ${lightningPath}`)
    return fs.readFileSync(lightningPath)
  }
  const lightningsUrl = constructLightningsUrl(frameDates)
  if (process.env.NODE_ENV != 'production') {
    console.log(`Fetching lightnings from: ${lightningsUrl}`)
  }
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
  return parseXml(xml, {tagNameProcessors: [processors.stripPrefix, processors.firstCharLowerCase]})
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
      location: pos.split(' ').slice(0, 2).map(parseFloat),
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

module.exports = {
  fetchLightnings
}
