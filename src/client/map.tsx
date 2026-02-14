import maplibregl from 'maplibre-gl'
import type {Frame, MapSettings} from './types'

// EPSG:3067 image extent corners converted to [lng, lat]
const IMAGE_COORDINATES: [[number, number], [number, number], [number, number], [number, number]] = [
  [10.21544313101359, 70.49992323787335],   // top-left
  [37.37165999357402, 70.98306000020692],   // top-right
  [33.189093913539125, 57.01073319104798],  // bottom-right
  [16.867430011086615, 56.751320001830045]  // bottom-left
]

let marker: maplibregl.Marker | null = null

export function createMap(container: string, settings: MapSettings) {
  const map = new maplibregl.Map({
    container,
    style: 'https://tiles.openfreemap.org/styles/positron',
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
  map.touchZoomRotate.disableRotation()

  map.on('load', () => {
    map.addSource('radar', {
      type: 'image',
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
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
    })
  })

  return map
}

export function showRadarFrame(map: maplibregl.Map, {image, lightnings}: Frame) {
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

export function panTo(map: maplibregl.Map, lonLat: [number, number]) {
  if (marker) {
    marker.setLngLat(lonLat)
  } else {
    const el = document.createElement('img')
    el.src = '/img/pin.png'
    el.style.height = '40px'
    el.style.width = 'auto'
    marker = new maplibregl.Marker({element: el, anchor: 'bottom'})
      .setLngLat(lonLat)
      .addTo(map)
  }
  map.flyTo({center: lonLat, duration: 1000})
}
