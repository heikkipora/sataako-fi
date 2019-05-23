const axios = require('axios')
const FMI = require('./fmi-constants')
const {parseString} = require('xml2js')
const processors = require('xml2js/lib/processors')
const Promise = require('bluebird')
const url = require('url')

const parseXml = Promise.promisify(parseString)

const featureUrl = url.parse(FMI.WFS_FEATURE_URL)
featureUrl.query = {
  request: 'getFeature',
  // eslint-disable-next-line camelcase
  storedquery_id: 'fmi::observations::lightning::simple'
}
const fmiLightningsRequestUrl = url.format(featureUrl)
console.log(`Configured lightning URL: ${fmiLightningsRequestUrl}`)

async function fetchLightnings() {
  const {data} = await axios.get(fmiLightningsRequestUrl)
  const wfsResponse = await xmlToObject(data)
  return extractLocationsAndTimes(wfsResponse)
}

function xmlToObject(xml) {
  return parseXml(xml, {tagNameProcessors: [processors.stripPrefix, processors.firstCharLowerCase]})
}

function extractLocationsAndTimes(queryResult) {
  if(!queryResult.featureCollection.hasOwnProperty('member')) return [] // No lightnings atm
  return queryResult.featureCollection.member.map(({bsWfsElement}) =>
    ({
      location: bsWfsElement[0].location[0].point[0].pos[0].trim(),
      timestamp: bsWfsElement[0].time[0]
    })
  )
}

module.exports = {
  fetchLightnings
}