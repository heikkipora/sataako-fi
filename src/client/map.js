import {defaults as defaultInteractions} from 'ol/interaction'
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
import {defaults as defaultControls, Attribution} from 'ol/control'
import GeoJSON from 'ol/format/GeoJSON'

proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs')
register(proj4)
const imageProjection = new Projection({code: 'EPSG:3067'})
const imageExtent = [-118331.366408, 6335621.167014, 875567.731907, 7907751.537264]

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
    controls: defaultControls({attribution: false, rotate: false}),
    interactions: defaultInteractions({altShiftDragRotate: false, pinchRotate: false}),
    layers: [createMapLayer(), createRadarLayer(), createLightningLayer(), createIconLayer(center)],
    target: 'map',
    view
  })

  // OpenLayers leaves the map distorted on some mobile browsers after screen orientation change
  window.addEventListener('orientationchange', () => location.reload())

  return map
}

function createMapLayer() {
  const source = new XYZ({url: '/tiles/{z}/{x}/{y}.png'})
  return new Tile({source})
}

function createRadarLayer() {
  return new Image({opacity: 0.8, visible: false})
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

function showRadarFrame(map, {image, lightnings}) {
  const radarImageSource = radarImageSourcesCache[image] || (radarImageSourcesCache[image] = createImageSource(image))
  const radarLayer = map.getLayers().getArray()[1]
  radarLayer.setSource(radarImageSource)
  radarLayer.setVisible(true)
  if (lightnings) {
    const lightningLayer = map.getLayers().getArray()[2]
    lightningLayer.setVisible(true)
    const featureObj = {
      type: 'Feature',
      geometry: {
        type: 'MultiPoint',
        coordinates: lightnings.map(coord => fromLonLat(coord))
      }
    }
    const lightningFeature = new GeoJSON().readFeature(featureObj)
    lightningLayer.setSource(new VectorSource({
      features: [lightningFeature]
    }))
  }
}

function cleanupImageSourceCache(validImageUrls) {
  Object.keys(radarImageSourcesCache).forEach(imageUrl => {
    if (!validImageUrls.includes(imageUrl)) {
      Reflect.deleteProperty(radarImageSourcesCache, imageUrl)
    }
  })
}

function createLightningLayer() {
  const source = new VectorSource()
  return new VectorLayer({
    source,
    style: new Style({
        image: new Icon({
          anchor: [0, 1.0],
          src: '/img/lightning.png'
        })
      })
  })
}

function createImageSource(url) {
  return new ImageStatic({
    imageExtent,
    projection: imageProjection,
    url,
    imageSmoothing: false
  })
}

function panTo(map, lonLat) {
  const center = fromLonLat(lonLat);
  const vectorLayer = map.getLayers().getArray()[3]
  const vectorFeature = vectorLayer.getSource().getFeatures()[0]
  vectorFeature.setGeometry(new Point(center))
  map.getView().animate({center, duration: 1000})
}

export {
  cleanupImageSourceCache,
  createMap,
  panTo,
  showRadarFrame
}
