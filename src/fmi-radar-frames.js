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
  storedquery_id: 'fmi::radar::composite::rr'
}
const fmiRadarFramesRequestUrl = url.format(featureUrl)
console.log(`Configured radar frames URL: ${fmiRadarFramesRequestUrl}`)

async function fetchRadarImageUrls() {
  if (isCacheValid()) {
    return CACHED_RADAR_IMAGE_URLS
  }

  console.log('Updating radar frame list from FMI')
  try {
    const response = await axios.get(fmiRadarFramesRequestUrl)
    const wfsResponse = await xmlToObject(response.data)
    const frameReferences = await extractFrameReferences(wfsResponse)
    const frameUrls = setProjectionAndCleanupUrls(frameReferences)
    return updateCache(frameUrls)  
  } catch (error) {
    // Sometimes the FMI API returns a HTTP error - in which case we use the cached list as fallback
    console.error(`Failed to communicate with FMI API: ${error.message}, using cached frame list`)
    return Promise.resolve(CACHED_RADAR_IMAGE_URLS)
  }
}

function xmlToObject(xml) {
  return parseXml(xml, {tagNameProcessors: [processors.stripPrefix, processors.firstCharLowerCase]})
}

function extractFrameReferences(featureQueryResult) {
  return featureQueryResult.featureCollection.member.map(member =>
    ({
      url: member.gridSeriesObservation[0].result[0].rectifiedGridCoverage[0].rangeSet[0].file[0].fileReference[0],
      timestamp: member.gridSeriesObservation[0].phenomenonTime[0].timeInstant[0].timePosition[0]
    })
  )
}

function setProjectionAndCleanupUrls(frameReferences) {
  function cleanupUrl(frameReference) {
    const radarUrl = url.parse(frameReference.url, true)
    radarUrl.query.format = 'image/png'
    radarUrl.query.width = FMI.WIDTH
    radarUrl.query.height = FMI.HEIGHT
    radarUrl.query.bbox = FMI.EPSG_3067_BOUNDS
    radarUrl.query.srs = FMI.EPSG_3067_SRS
    Reflect.deleteProperty(radarUrl.query, 'styles')
    Reflect.deleteProperty(radarUrl, 'search')
    return {
      url: url.format(radarUrl),
      timestamp: frameReference.timestamp
    }
  }

  return frameReferences.map(cleanupUrl)
}

let CACHED_RADAR_IMAGE_URLS = []
let CACHE_TIMESTAMP = now()

function isCacheValid() {
  const cacheAge = now() - CACHE_TIMESTAMP
  return cacheAge < 60 * 1000 && CACHED_RADAR_IMAGE_URLS.length > 0
}

function updateCache(radarImageUrls) {
  CACHED_RADAR_IMAGE_URLS = radarImageUrls
  CACHE_TIMESTAMP = now()
  return radarImageUrls
}

function now() {
  return new Date().getTime()
}

module.exports = {
  fetchRadarImageUrls
}
