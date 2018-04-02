const _ = require('lodash')
const axios = require('axios')
const cheerio = require('cheerio')
const municipalities = require('./kunnat.json')
const proj4 = require('proj4')

let GIGS_CACHE = []

axios.get('http://warnermusiclive.fi/artistit/pete-parkkonen/')
  .then(parseHtml)
  .then(includeLocation)
  .then(uniqueByMunicipality)
  .then(gigs => {
    GIGS_CACHE = gigs
    console.log('Loaded gigs list', gigs)
  })
  .catch(error => {
    console.error(`Failed to load gigs: ${error.message}`)
  })

function parseHtml(response) {
  const $ = cheerio.load(response.data)
  return $('#gigList > ul.gigs > li').map((index, element) => {
    const date = $(element).find('b.date').text().trim()
    const venue = $(element).find('li.venue').text().trim()
    const link = $(element).find('li.links a').filter(isPageLink($)).attr('href')
    return {date, venue, link}
  }).get()
}

function isPageLink($) {
  return (index, element) => $(element).text().trim() === '» Sivut'
}

function includeLocation(gigs) {
  return gigs.map(gig => {
      const municipality = gig.venue.split(',').shift()
      const location = municipalities[municipality]
      if (location) {
        const coordinates = proj4('WGS84', 'EPSG:3857', [location.Longitude, location.Latitude])
        return _.extend({}, gig, {municipality, coordinates})
      }
      return gig
    })
    .filter(gig => gig.coordinates)
}

function uniqueByMunicipality(gigs) {
  return _.uniqBy(gigs, 'municipality')
}

function gigsList() {
  return GIGS_CACHE
}

module.exports = {
  gigsList
}
