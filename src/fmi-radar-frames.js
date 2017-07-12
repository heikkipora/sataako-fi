const errors = require('request-promise/errors')
const FMI = require('./fmi-constants')
const {parseString} = require('xml2js')
const processors = require('xml2js/lib/processors')
const Promise = require('bluebird')
const request = require('request-promise')
const url = require('url')

const parseXml = Promise.promisify(parseString)

const featureUrl = url.parse(FMI.WFS_FEATURE_URL)
featureUrl.query = {
  request: 'getFeature',
  // eslint-disable-next-line camelcase
  storedquery_id: 'fmi::radar::composite::rr'
}
const fmiRadarFramesRequest = url.format(featureUrl)
// eslint-disable-next-line no-console
console.log(`Configured radar frames URL: ${fmiRadarFramesRequest}`)

function xmlToObject(featureQueryResultXml) {
  return parseXml(featureQueryResultXml, {tagNameProcessors: [processors.stripPrefix, processors.firstCharLowerCase]})
}

function extractFrameReferences(featureQueryResult) {
  return featureQueryResult.featureCollection.member.map((member) => {
    return {
      url: member.gridSeriesObservation[0].result[0].rectifiedGridCoverage[0].rangeSet[0].file[0].fileReference[0],
      timestamp: member.gridSeriesObservation[0].phenomenonTime[0].timeInstant[0].timePosition[0]
    }
  })
}

function setProjectionAndCleanupUrls(frameReferences) {
  function cleanupUrl(frameReference) {
    const radarUrl = url.parse(frameReference.url, true)
    radarUrl.query.format = 'image/png'
    radarUrl.query.width = FMI.WIDTH
    radarUrl.query.height = FMI.HEIGHT
    radarUrl.query.bbox = FMI.EPSG_3857_BOUNDS
    radarUrl.query.srs = FMI.EPSG_3857_SRS
    Reflect.deleteProperty(radarUrl.query, 'styles')
    Reflect.deleteProperty(radarUrl, 'search')
    return {
      url: url.format(radarUrl),
      timestamp: frameReference.timestamp
    }
  }

  return frameReferences.map(cleanupUrl)
}

function now() {
  return new Date().getTime()
}

let CACHED_RADAR_IMAGE_URLS = []
let CACHE_TIMESTAMP = now()

function updateCache(radarImageUrls) {
  CACHED_RADAR_IMAGE_URLS = radarImageUrls
  CACHE_TIMESTAMP = now()
  return radarImageUrls
}

function isCacheValid() {
  const cacheAge = now() - CACHE_TIMESTAMP
  return cacheAge < 60 * 1000 && CACHED_RADAR_IMAGE_URLS.length > 0
}

function fetchRadarImageUrls() {
  if (isCacheValid()) {
    return Promise.resolve(CACHED_RADAR_IMAGE_URLS)
  }
  // eslint-disable-next-line no-console
  console.log('Updating radar frame list from FMI')
  return request(fmiRadarFramesRequest)
    .then(xmlToObject)
    .then(extractFrameReferences)
    .then(setProjectionAndCleanupUrls)
    .then(updateCache)
    .catch(errors.StatusCodeError, reason => {
      // Sometimes the FMI API returns a HTTP error - in which case we use the cached list as fallback
      // eslint-disable-next-line no-console
      console.error(`Radar frames API returned HTTP status ${reason.statusCode}, using cached frame list`)
      return Promise.resolve(CACHED_RADAR_IMAGE_URLS)
    })
}

module.exports = {
  fetchRadarImageUrls
}
