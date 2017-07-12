import $ from 'jquery'
import _ from 'lodash'

const {ol} = window

function addPete(map) {
  loadGigs().then(createPeteLayer).then(layer => map.addLayer(layer))

  const select = new ol.interaction.Select()
  map.addInteraction(select)
  select.getFeatures().on('add', event => {
    const url = event.target.item(0).get('url')
    if (url) {
      document.location = url
    }
  })
}

function loadGigs() {
  return $.get('/pete.json')
}

function createPeteLayer(gigs) {
  const features = gigs.map(gig => createPeteIcon(gig))
  const source = new ol.source.Vector({features})
  return new ol.layer.Vector({source})
}

function createPeteIcon({date, link, venue, coordinates}) {
  const id = _.random(1, 6)
  const style = new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 0.5],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      scale: 0.33,
      src: `/img/pete-${id}.png`
    }),
    text: new ol.style.Text({
      font: '13px "Roboto Condensed",Helvetica,Arial,sans-serif',
      fill: new ol.style.Fill({color: '#000'}),
      offsetY: 50,
      text: `${date}\n ${venue}`
    })
  })

  const iconFeature = new ol.Feature({
    geometry: new ol.geom.Point(coordinates)
  })
  iconFeature.set('url', link, true)
  iconFeature.setStyle(style)
  return iconFeature
}

function isKohtaSataa() {
  return location.hostname.indexOf('kohtasataa') !== -1
}

export {
  addPete,
  isKohtaSataa
}
