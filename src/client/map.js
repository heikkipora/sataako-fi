const markerGroup = L.layerGroup()

function createMap(settings) {
  const map = L.map('map').setView([settings.lat, settings.lon], settings.zoom)

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    minZoom: 5,
    maxZoom: 16,
    id: 'mapbox.light',
    accessToken: `pk.eyJ1IjoiZHJpbGxzb2Z0IiwiYSI6ImNpamhheThmMDAwMWJ2bGx3cTdnc2pqN3YifQ.T03pA9q2dnHo4lLHHMmrYA`
  }).addTo(map)

  return map
}

function createOverlay(map) {
  const southWest = L.latLng(56.751319918431086, 10.215546158022443)
  const northEast = L.latLng(71.24172567165043, 37.371658784549375)
  const bounds = L.latLngBounds(southWest, northEast)
  return L.imageOverlay('', bounds, {opacity: 0.8}).addTo(map)
}

export {
  createMap,
  createOverlay
}
