var _ = require('lodash');
var url = require('url');
var proj4 = require('proj4');
var request = require('request-promise');
var Promise = require('bluebird');
var parseXml = Promise.promisify(require('xml2js').parseString);
var processors = require('xml2js/lib/processors');

var FMI_WMS_CAPABILITIES_URL = 'http://wms.fmi.fi/fmi-apikey/' + process.env.FMI_KEY + '/geoserver/wms';

var capabilitiesUrl = url.parse(FMI_WMS_CAPABILITIES_URL);
capabilitiesUrl.query = {
    service: 'WMS',
    version: '1.3.0',
    request: 'GetCapabilities'
};

request(url.format(capabilitiesUrl))
    .then(function (resultXml) {
        return parseXml(resultXml, {tagNameProcessors: [processors.stripPrefix, processors.firstCharLowerCase]});
    })
    .then(function (result) {
        var layers = result.wMS_Capabilities.capability[0].layer[0].layer;
        var rrLayer = _.find(layers, {name: ['Radar:suomi_rr_eureffin']});
        var boundingBox = _.find(rrLayer.boundingBox, {'$': {'CRS': 'CRS:84'}});

        return {minX: boundingBox.$.minx, minY: boundingBox.$.miny, maxX: boundingBox.$.maxx, maxY: boundingBox.$.maxy}
    })
    .then(function (wsg84Bounds) {
        var bottomleft = proj4('EPSG:3857').forward([wsg84Bounds.minX, wsg84Bounds.minY]);
        var topright = proj4('EPSG:3857').forward([wsg84Bounds.maxX, wsg84Bounds.maxY]);
        var epsg3857Bounds = bottomleft.concat(topright).join(', ');

        console.log('var wsg84Bounds = { minX: ' + wsg84Bounds.minX + ', minY: ' + wsg84Bounds.minY + ', maxX: ' + wsg84Bounds.maxX + ', maxY: ' + wsg84Bounds.maxY + ' };');
        console.log('var epsg3857Bounds = [' + epsg3857Bounds + '];');
    })
    .catch(console.error);