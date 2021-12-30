export interface Frame {
  image: string
  isForecast?: boolean
  lightnings: Array<[number, number]>
  timestamp: string
}

export interface MapSettings {
  x: number
  y: number
  zoom: number
}
