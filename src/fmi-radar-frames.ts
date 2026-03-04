import type {WMSRequestConfig} from './types.ts'

const WMS_SERVICE_URL = 'https://openwms.fmi.fi/geoserver/Radar/wms'
export const WMS_IMAGE_WIDTH = 2236
export const WMS_IMAGE_HEIGHT = 2793

// Geographic extent matching FMI's suomi_rr_eureffin layer LatLonBoundingBox
export const GEO_EXTENT = {
  minLng: 10.215546158022443,
  minLat: 56.751319918431086,
  maxLng: 37.371658784549375,
  maxLat: 71.24172567165043
}

// Same extent in EPSG:3857 (Web Mercator) for WMS requests
export const EPSG_3857_BOUNDS: [number, number, number, number] = [1137189.3964862407, 7709459.565190111, 4160194.0259960056, 11485434.685198486]
export const EPSG_3857_SRS = 'EPSG:3857'

const DEFAULT_QUERY_PARAMS = {
  service: 'WMS',
  version: '1.1.1',
  request: 'GetMap',
  format: 'image/png',
  bbox: EPSG_3857_BOUNDS.join(','),
  srs: EPSG_3857_SRS,
  width: WMS_IMAGE_WIDTH,
  height: WMS_IMAGE_HEIGHT
}

export function wmsRequestForRadar(time: string): WMSRequestConfig {
  return wmsRequestConfig('Radar:suomi_rr_eureffin', time)
}

function wmsRequestConfig(layerId: string, time: string): WMSRequestConfig {
  return {
    url: WMS_SERVICE_URL,
    responseType: 'arraybuffer',
    timeout: 30000,
    params: {
      ...DEFAULT_QUERY_PARAMS,
      layers: layerId,
      time
    }
  }
}

export function generateRadarFrameTimestamps(framesCount: number, baseDate: number = Date.now()): string[] {
  const numberSeries = new Array(framesCount).keys()
  return Array
    .from(numberSeries, nthFiveMinuteDivisibleTimestamp(baseDate))
    .reverse()
}

function nthFiveMinuteDivisibleTimestamp(baseDate: number): (n: number) => string {
  return n => {
    const FIVE_MINUTES = 5 * 60 * 1000
    const lastFullFiveMinutes = Math.floor(baseDate / FIVE_MINUTES) * FIVE_MINUTES
    return new Date(lastFullFiveMinutes - n * FIVE_MINUTES).toISOString()
  }
}
