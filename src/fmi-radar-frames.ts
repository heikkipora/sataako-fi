import type {WMSRequestConfig} from './types.ts'

const WMS_SERVICE_URL = 'https://openwms.fmi.fi/geoserver/Radar/wms'
export const WMS_IMAGE_WIDTH = 1987
export const WMS_IMAGE_HEIGHT = 3144

export const EPSG_3067_BOUNDS: [number, number, number, number] = [-118331.366408, 6335621.167014, 875567.731907, 7907751.537264]
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
