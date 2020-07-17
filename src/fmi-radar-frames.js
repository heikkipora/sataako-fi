const WMS_SERVICE_URL = 'https://openwms.fmi.fi/geoserver/Radar/wms'
export const WMS_IMAGE_WIDTH = 1987
export const WMS_IMAGE_HEIGHT = 3144

export const EPSG_3067_BOUNDS = [-118331.366, 6335621.167, 875567.732, 7907751.537]
export const EPSG_3067_SRS = 'EPSG:3067'

const DEFAULT_QUERY_PARAMS = {
  service: 'WMS',
  version: '1.3',
  request: 'GetMap',
  format: 'image/png',
  bbox: EPSG_3067_BOUNDS.join(','),
  srs: EPSG_3067_SRS,
  width: WMS_IMAGE_WIDTH,
  height: WMS_IMAGE_HEIGHT
}

export function wmsRequestForRadar(time) {
  return wmsRequestConfig('Radar:suomi_rr_eureffin', time)
}

export function wmsRequestForRadarEstimate(time) {
  return wmsRequestConfig('Radar:suomi_tuliset_rr_eureffin', time)
}

function wmsRequestConfig(layerId, time) {
  return {
    url: WMS_SERVICE_URL,
    params: {
      ...DEFAULT_QUERY_PARAMS,
      layers: layerId,
      time
    }
  }
}

export function generateRadarFrameTimestamps(framesCount, baseDate = Date.now()) {
  const numberSeries = new Array(framesCount).keys()
  return Array
    .from(numberSeries, nthFiveMinuteDivisibleTimestamp(baseDate))
    .reverse()
}

function nthFiveMinuteDivisibleTimestamp(baseDate) {
  return n => {
    const FIVE_MINUTES = 5 * 60 * 1000
    const nextFullFiveMinutes = (Math.floor(baseDate / FIVE_MINUTES) + 1) * FIVE_MINUTES
    return new Date(nextFullFiveMinutes - n * FIVE_MINUTES).toISOString()
  }
}
