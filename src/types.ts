import type {AxiosRequestConfig} from 'axios'

export interface WMSRequestConfig extends AxiosRequestConfig {
  url: string
  responseType: 'arraybuffer'
  timeout: number
  params: {
    service: string
    version: string
    request: string
    format: string
    bbox: string
    srs: string
    width: number
    height: number
    layers: string
    time: string
  }
}

export interface ImageCacheItem {
  timestamp: string
}

export interface LightningCacheItem {
  timestamp: string
  locations: Array<[number, number]>
}

export interface FrameResponse {
  image: string
  lightnings: Array<[number, number]>
  timestamp: string
}

export interface Lightning {
  location: [number, number]
  time: Date
}

export interface RadarFrameRequest {
  requestConfig: WMSRequestConfig
  timestamp: string
}
