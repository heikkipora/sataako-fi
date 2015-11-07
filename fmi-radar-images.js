var fs = require('fs');
var request = require('request-promise');
var Promise = require('bluebird');
var PNG = require('node-png').PNG;
var GIFEncoder = require('gifencoder');
var FMI = require('./fmi-constants');

var MASK_DATA = [];
fs.createReadStream('radar-mask.png').pipe(new PNG())
  .on('parsed', function() {
      MASK_DATA = this.data;
  });

function removeRadarBordersFromFrame(frameData) {
    for (var index = 0; index < frameData.length; index += 4) {
        var color = frameData[index] << 16 | frameData[index + 1] << 8 | frameData[index + 2];
        if (color === 0xffffff || color === 0xf7f7f7 || MASK_DATA[index + 3] !== 0) {
            frameData[index] = 0xff;
            frameData[index + 1] = 0xff;
            frameData[index + 2] = 0xff;
            frameData[index + 3] = 0;
        }
    }
    return frameData;
}

function encodeAsGif(frameData) {
    var encoder = new GIFEncoder(FMI.WIDTH, FMI.HEIGHT);
    encoder.start();
    encoder.setQuality(10);
    encoder.setTransparent(0xffffff);
    encoder.addFrame(frameData);
    encoder.finish();
    encoder.finish();
    return new Buffer(encoder.out.getData());
}

function fetchDecodedRadarImage(url) {
    var png = request(url).pipe(new PNG());
    return new Promise(function (resolve, reject) {
        png.on('parsed', resolve);
        png.on('error', reject);
    });
}

function fetchPostProcessedRadarFrameAsGif(frameUrl) {
    console.log("Fetching radar image from FMI: " + frameUrl);
    return fetchDecodedRadarImage(frameUrl).then(removeRadarBordersFromFrame).then(encodeAsGif)
}

module.exports = fetchPostProcessedRadarFrameAsGif;
