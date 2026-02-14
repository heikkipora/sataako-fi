export interface Frame {
  image: string
  lightnings: Array<[number, number]>
  timestamp: string
}

export interface MapSettings {
  lng: number
  lat: number
  zoom: number
}
