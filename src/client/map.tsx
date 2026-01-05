import Feature from 'ol/Feature'
import GeoJSON from 'ol/format/GeoJSON'
import Geometry from 'ol/geom/Geometry'
import Icon from 'ol/style/Icon'
import ImageLayer from 'ol/layer/Image'
import ImageStatic from 'ol/source/ImageStatic'
import ImageTile from 'ol/source/ImageTile'
import Map from 'ol/Map'
import Point from 'ol/geom/Point'
import proj4 from 'proj4'
import Projection from 'ol/proj/Projection'
import Style from 'ol/style/Style'
import TileLayer from 'ol/layer/WebGLTile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import View from 'ol/View'
import {defaults as defaultControls} from 'ol/control'
import {defaults as defaultInteractions} from 'ol/interaction'
import {fromLonLat} from 'ol/proj'
import {register} from 'ol/proj/proj4'
import type {Frame, MapSettings} from './types'

proj4.defs('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs')
register(proj4)
const imageProjection = new Projection({code: 'EPSG:3067'})
const imageExtent = [-118331.366408, 6335621.167014, 875567.731907, 7907751.537264]

export function createMap(settings: MapSettings) {
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
    view
  })

  function updateSizeLater() {
    setTimeout(() => map.updateSize(), 1000)
  }

  window.addEventListener('resize', updateSizeLater)
  window.addEventListener('orientationchange', updateSizeLater)
  return map
}

function createMapLayer() {
  const source = new ImageTile({url: '/tiles/{z}/{x}/{y}.png'})
  return new TileLayer({source})
}

function createRadarLayer() {
  return new ImageLayer({opacity: 0.8, visible: false})
}

function createIconLayer(position: number[]) {
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

const radarImageSourcesCache: {[key: string]: ImageStatic | undefined} = {}

export function showRadarFrame(map: Map, {image, lightnings}: Frame) {
  const radarImageSource = radarImageSourcesCache[image] || (radarImageSourcesCache[image] = createImageSource(image))
  const radarLayer = map.getLayers().getArray()[1] as ImageLayer<ImageStatic>
  radarLayer.setSource(radarImageSource)
  radarLayer.setVisible(true)

  const hasLightnings = lightnings.length > 0
  const lightningLayer = map.getLayers().getArray()[2] as VectorLayer<VectorSource<Feature<Geometry>>>
  lightningLayer.setVisible(hasLightnings)
  if (hasLightnings) {
    const lightningLayer = map.getLayers().getArray()[2] as VectorLayer<VectorSource<Feature<Geometry>>>
    const featureObj = {
      type: 'Feature',
      geometry: {
        type: 'MultiPoint',
        coordinates: lightnings.map(coord => fromLonLat(coord))
      }
    }
    const lightningFeature = new GeoJSON().readFeature(featureObj) as Feature<Geometry>
    lightningLayer.setSource(new VectorSource<Feature<Geometry>>({
      features: [lightningFeature]
    }))
  }
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

function createImageSource(url: string) {
  return new ImageStatic({
    imageExtent,
    projection: imageProjection,
    url
  })
}

export function panTo(map: Map, lonLat: [number, number]) {
  const center = fromLonLat(lonLat);
  const vectorLayer = map.getLayers().getArray()[3] as VectorLayer<VectorSource<Feature<Geometry>>>
  const [vectorFeature] = vectorLayer.getSource()?.getFeatures() || []
  vectorFeature?.setGeometry(new Point(center))
  map.getView().animate({center, duration: 1000})
}
