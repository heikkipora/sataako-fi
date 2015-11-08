import _ from 'lodash'
import url from 'url'
import proj4 from 'proj4'
import request from 'request-promise'
import Promise from 'bluebird'
import {parseString} from 'xml2js'
import processors from 'xml2js/lib/processors'

const parseXml = Promise.promisify(parseString)

const FMI_WMS_CAPABILITIES_URL = `http://wms.fmi.fi/fmi-apikey/${process.env.FMI_KEY}/geoserver/wms`

let capabilitiesUrl = url.parse(FMI_WMS_CAPABILITIES_URL)
capabilitiesUrl.query = {
  service: 'WMS',
  version: '1.3.0',
  request: 'GetCapabilities'
}

request(url.format(capabilitiesUrl))
  .then(resultXml => {
    return parseXml(resultXml, {tagNameProcessors: [processors.stripPrefix, processors.firstCharLowerCase]})
  })
  .then(result => {
    const layers = result.wMS_Capabilities.capability[0].layer[0].layer
    const rrLayer = _.find(layers, {name: ['Radar:suomi_rr_eureffin']})
    const boundingBox = _.find(rrLayer.boundingBox, {'$': {'CRS': 'CRS:84'}})

    return {minX: boundingBox.$.minx, minY: boundingBox.$.miny, maxX: boundingBox.$.maxx, maxY: boundingBox.$.maxy}
  })
  .then(wsg84Bounds => {
    const bottomleft = proj4('EPSG:3857').forward([wsg84Bounds.minX, wsg84Bounds.minY])
    const topright = proj4('EPSG:3857').forward([wsg84Bounds.maxX, wsg84Bounds.maxY])
    const epsg3857Bounds = bottomleft.concat(topright).join(', ')

    console.log('const wsg84Bounds = { minX: ' + wsg84Bounds.minX + ', minY: ' + wsg84Bounds.minY + ', maxX: ' + wsg84Bounds.maxX + ', maxY: ' + wsg84Bounds.maxY + ' }');
    console.log('const epsg3857Bounds = [' + epsg3857Bounds + ']');
  })
  .catch(console.error);