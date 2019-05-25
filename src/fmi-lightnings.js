const axios = require('axios')
const FMI = require('./fmi-constants')
const {parseString} = require('xml2js')
const processors = require('xml2js/lib/processors')
const Promise = require('bluebird')
const url = require('url')
const fs = require('fs')

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
  // const {data} = await axios.get(fmiLightningsRequestUrl)
  const data = fs.readFileSync('src/lightnings.xml') // Mock data for developing
  const wfsResponse = await xmlToObject(data)
  return extractLocationsAndTimes(wfsResponse)
}

function xmlToObject(xml) {
  return parseXml(xml, {tagNameProcessors: [processors.stripPrefix, processors.firstCharLowerCase]})
}

function extractLocationsAndTimes(queryResult) {
  if(!queryResult.featureCollection.hasOwnProperty('member')) { return [] } // No lightnings atm
  return queryResult.featureCollection.member.map(({bsWfsElement}) =>
    ({
      location: bsWfsElement[0].location[0].point[0].pos[0].trim(),
      timestamp: roundToFiveMinutes(bsWfsElement[0].time[0])
    })
  )
}

function roundToFiveMinutes(timestamp) {
  const fiveMin = 1000 * 60 * 5
  const twoAndHalfMin = 1000 * 60 * 2.5
  const date = new Date(timestamp)
  const roundedDate = new Date(Math.round((date.getTime() + twoAndHalfMin) / fiveMin) * fiveMin)
  return roundedDate.toISOString()

}

module.exports = {
  fetchLightnings
}