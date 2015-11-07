var _ = require('lodash');
var express = require('express');
var app = express();
var fetchRadarImageUrls = require('./fmi-radar-frames');
var fetchPostProcessedRadarFrameAsGif = require('./fmi-radar-images');

var PUBLIC_FRAMES_ROOT = process.env.CLOUDFRONT_URL || 'http://localhost:3000/frame/';

function toPublicUrl(radarUrl) {

  return {
    image: PUBLIC_FRAMES_ROOT + radarUrl.timestamp,
    timestamp: radarUrl.timestamp
  };

}
app.use(express.static('public'));

app.get('/frames.json', function (req, res) {
  fetchRadarImageUrls().then(function (urls) {
    res.json(urls.map(toPublicUrl));
  });
});

app.get('/wms/frames.json', function(req, res) {
  res.redirect('/frames.json');
});

app.get('/frame/:timestamp', function (req, res) {
  fetchRadarImageUrls().then(function (urls) {
    var fmiRadarImage = _.find(urls, {timestamp: req.params.timestamp});
    if (fmiRadarImage) {
      fetchPostProcessedRadarFrameAsGif(fmiRadarImage.url).then(function (gif) {
        res.set('Content-Type', 'image/gif');
        res.send(gif);
      })
    } else {
      res.status(404).send('Sorry, no radar image found for that timestamp');
    }
  })
});

module.exports = app;
