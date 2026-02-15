import maplibregl from 'maplibre-gl'
import {DarkModeControl} from './dark-mode-control'
import type {Frame, MapSettings} from './types'

const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

// EPSG:3067 image extent corners converted to [lng, lat]
const IMAGE_COORDINATES: [[number, number], [number, number], [number, number], [number, number]] = [
  [10.21544313101359, 70.49992323787335],   // top-left
  [37.37165999357402, 70.98306000020692],   // top-right
  [33.189093913539125, 57.01073319104798],  // bottom-right
  [16.867430011086615, 56.751320001830045]  // bottom-left
]

const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

let marker: maplibregl.Marker | null = null
let lastFrameUrl: string = TRANSPARENT_PIXEL
let lastLightnings: [number, number][] = []

function addOverlayLayers(map: maplibregl.Map) {
  map.addSource('radar', {
    type: 'image',
    url: lastFrameUrl,
    coordinates: IMAGE_COORDINATES
  })

  map.addLayer({
    id: 'radar-layer',
    type: 'raster',
    source: 'radar',
    paint: {'raster-opacity': 0.8}
  })

  map.loadImage('/img/lightning.png').then(({data}) => {
    map.addImage('lightning-icon', data)

    map.addSource('lightnings', {
      type: 'geojson',
      data: {type: 'FeatureCollection', features: []}
    })

    map.addLayer({
      id: 'lightning-layer',
      type: 'symbol',
      source: 'lightnings',
      layout: {
        'icon-image': 'lightning-icon',
        'icon-anchor': 'bottom-left',
        'icon-allow-overlap': true
      }
    })

    if (lastLightnings.length > 0) {
      const source = map.getSource('lightnings') as maplibregl.GeoJSONSource
      source.setData({
        type: 'FeatureCollection',
        features: lastLightnings.map(coord => ({
          type: 'Feature' as const,
          geometry: {type: 'Point' as const, coordinates: coord},
          properties: {}
        }))
      })
    }
  })
}

let darkModeControl: DarkModeControl | null = null

export function createMap(container: string, settings: MapSettings, darkMode: boolean, onDarkModeToggle: () => void) {
  const map = new maplibregl.Map({
    container,
    style: darkMode ? STYLE_DARK : STYLE_LIGHT,
    center: [settings.lng, settings.lat],
    zoom: settings.zoom,
    minZoom: 3,
    maxZoom: 16,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false
  })

  map.addControl(new maplibregl.NavigationControl({showCompass: false}), 'top-left')
  darkModeControl = new DarkModeControl(darkMode, onDarkModeToggle)
  map.addControl(darkModeControl, 'top-left')
  map.touchZoomRotate.disableRotation()

  map.on('load', () => addOverlayLayers(map))

  return map
}

export function setMapStyle(map: maplibregl.Map, darkMode: boolean) {
  const style = darkMode ? STYLE_DARK : STYLE_LIGHT
  darkModeControl?.update(darkMode)
  map.once('styledata', () => addOverlayLayers(map))
  map.setStyle(style)
}

export function showRadarFrame(map: maplibregl.Map, {image, lightnings}: Frame) {
  lastFrameUrl = image
  lastLightnings = lightnings

  const radarSource = map.getSource('radar') as maplibregl.ImageSource | undefined
  if (radarSource) {
    radarSource.updateImage({url: image, coordinates: IMAGE_COORDINATES})
  }

  const lightningSource = map.getSource('lightnings') as maplibregl.GeoJSONSource | undefined
  if (lightningSource) {
    if (lightnings.length > 0) {
      lightningSource.setData({
        type: 'FeatureCollection',
        features: lightnings.map(coord => ({
          type: 'Feature' as const,
          geometry: {type: 'Point' as const, coordinates: coord},
          properties: {}
        }))
      })
      map.setLayoutProperty('lightning-layer', 'visibility', 'visible')
    } else {
      lightningSource.setData({type: 'FeatureCollection', features: []})
      map.setLayoutProperty('lightning-layer', 'visibility', 'none')
    }
  }
}

function createPinElement(): HTMLElement {
  const el = document.createElement('div')
  el.innerHTML = '<svg viewBox="0 0 24 36" width="24" height="36" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#4a90d9"/>' +
    '<circle cx="12" cy="12" r="5" fill="white"/></svg>'
  return el
}

export function panTo(map: maplibregl.Map, lonLat: [number, number]) {
  if (marker) {
    marker.setLngLat(lonLat)
  } else {
    marker = new maplibregl.Marker({element: createPinElement(), anchor: 'bottom'})
      .setLngLat(lonLat)
      .addTo(map)
  }
  map.flyTo({center: lonLat, duration: 1000})
}
