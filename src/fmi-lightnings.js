const axios = require('axios')
const FMI = require('./fmi-constants')
const {parseString} = require('xml2js')
const processors = require('xml2js/lib/processors')
const Promise = require('bluebird')
const url = require('url')
const _ = require('lodash')

const parseXml = Promise.promisify(parseString)

const FEATURE_URL = url.parse(FMI.WFS_FEATURE_URL)
FEATURE_URL.query = {
  request: 'getFeature',
  // eslint-disable-next-line camelcase
  storedquery_id: 'fmi::observations::lightning::simple'
}
console.log(`Configured lightning URL stem: ${url.format(FEATURE_URL)}`)

async function fetchLightnings(frameDates) {
  const lightningsUrl = constructLightningsUrl(frameDates)
  const {data} = await axios.get(lightningsUrl)
  const wfsResponse = await xmlToObject(data)
  const lightnings = extractLocationsAndTimes(wfsResponse)
  return snapLightningsToFrames(lightnings, frameDates)
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
  return _(queryResult.featureCollection.member).map(({bsWfsElement}) =>
    ({
      location: bsWfsElement[0].location[0].point[0].pos[0].trim().split(' ').map(parseFloat),
      time: new Date(bsWfsElement[0].time[0])
    }))
    .uniqWith(_.isEqual)
    .sortBy(['timestamp'])
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
