import Feature from 'ol/Feature'
import {register} from 'ol/proj/proj4'
import Icon from 'ol/style/Icon'
import Image from 'ol/layer/Image'
import ImageStatic from 'ol/source/ImageStatic'
import Map from 'ol/Map'
import Point from 'ol/geom/Point'
import proj4 from 'proj4'
import Projection from 'ol/proj/Projection'
import Style from 'ol/style/Style'
import Tile from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import View from 'ol/View'
import XYZ from 'ol/source/XYZ'
import {fromLonLat} from 'ol/proj'
import VectorSource from 'ol/source/Vector'

proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs')
register(proj4)
const imageProjection = new Projection({code: 'EPSG:3067'})
const imageExtent = [-118331.366, 6335621.167, 875567.732, 7907751.537]

const MAP_ID = 'mapbox.light'
const ACCESS_TOKEN = 'pk.eyJ1IjoiZHJpbGxzb2Z0IiwiYSI6ImNpamhheThmMDAwMWJ2bGx3cTdnc2pqN3YifQ.T03pA9q2dnHo4lLHHMmrYA'

function createMap(settings) {
  const {x, y, zoom} = settings
  const center = [x, y]
  const view = new View({
    center,
    minZoom: 5,
    maxZoom: 13,
    projection: 'EPSG:3857',
    zoom
  })

  const map = new Map({
    layers: [createMapLayer(), createRadarLayer(), createIconLayer(center)],
    logo: false,
    target: 'map',
    view
  })

  // OpenLayers leaves the map distorted on some mobile browsers after screen orientation change
  window.addEventListener('orientationchange', () => location.reload())

  return map
}

function createMapLayer() {
  const source = new XYZ({url: `https://api.tiles.mapbox.com/v4/${MAP_ID}/{z}/{x}/{y}.png?access_token=${ACCESS_TOKEN}`})
  return new Tile({source})
}

function createRadarLayer() {
  return new Image({opacity: 0.8})
}

function createIconLayer(position) {
  const style = new Style({
    image: new Icon({
      anchor: [0.5, 1.0],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      scale: 0.33,
      src: '/img/pin.png'
    })
  })

  const iconFeature = new Feature({
    geometry: new Point(position)
  })
  iconFeature.setStyle(style)

  const source = new VectorSource({features: [iconFeature]})
  return new VectorLayer({source})
}

const radarImageSourcesCache = {}

function showRadarFrame(map, url) {
  const radarImageSource = radarImageSourcesCache[url] || (radarImageSourcesCache[url] = createImageSource(url))
  const radarLayer = map.getLayers().getArray()[1]
  radarLayer.setSource(radarImageSource)
}

function createImageSource(url) {
  return new ImageStatic({
    imageExtent,
    projection: imageProjection,
    url
  })
}

function panTo(map, lonLat) {
  const center = fromLonLat(lonLat);
  const vectorLayer = map.getLayers().getArray()[2]
  const vectorFeature = vectorLayer.getSource().getFeatures()[0]
  vectorFeature.setGeometry(new Point(center))
  map.getView().animate({center, duration: 1000})
}

export {
  createMap,
  panTo,
  showRadarFrame
}
