Sataako.fi
==========

![screenshot](https://raw.github.com/heikkipora/sataako-fi/master/work/screenshot.jpg)

Introduction
------------
I wanted to create a mobile-friendly weather service for Finland which has the simplest possible user interface (in Finnish).

[Sataako.fi](https://www.sataako.fi) fetches weather radar images from [Finnish Meteorological Institute](http://en.ilmatieteenlaitos.fi)'s [Open Data APIs](http://en.ilmatieteenlaitos.fi/open-data-manual) and shows them as a Openlayers v5 image layer after some post-processing. The map tiles are server from <a href="https://www.mapbox.com">Mapbox</a>. The movement of rain clouds is shown as a short animation covering the last hour.

[![build status](https://travis-ci.org/heikkipora/sataako-fi.svg?branch=master)](https://travis-ci.org/heikkipora/sataako-fi)

Runtime environment
-------------------
The node.js application runs in [Heroku](http://heroku.com) with a single [Hobby dyno](https://devcenter.heroku.com/articles/dyno-types).

It's responsible for

* maintaing an up-to-date list of radar frames available from FMI
* delivering those frames as post-processed GIF images

To be able to serve a decent amount of concurrent users without exceeding the FMI API request rate, the following steps are done:

* requests to FMI API go through a task queue which limits concurrency
* radar frame list is cached internally for one minute before a re-fetch from FMI
* radar frame images are cached 1) locally for about one hour and 2) by an AWS Cloudfront distribution sitting in front of the Heroku app (at d2ot8aujc2hu2d.cloudfront.net) for 24 hours

Radar frame post-processing
---------------------------
FMI provides a [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) compliant HTTP API for fetching a composite radar image covering all of Finland.
To be able to use those images on top of the Mapbox map the following steps are taken:

* request a PNG image in [EPSG:3067 projection](http://spatialreference.org/ref/epsg/3067/) which is native for FMI's radar images
* decode PNG into raw 32bit pixel data
* change a solid gray background (0xf7f7f7) to fully transparent
* use a [mask-image](src/radar-mask.png) to change a solid orange area outside the radars' range to fully transparent
* use an [overlay-image](src/radar-edges.png) to draw the edge of the radars' range
* encode image as GIF maintaining transparency

Openlayers will then reproject those images on the fly to [EPSG:3857 projection](http://spatialreference.org/ref/sr-org/7483/) aka WGS84 Web Mercator which is used by the Mapbox tiles.

Thanks to
--------
Runtime environment costs kindly covered by my employer <a href="https://www.reaktor.com">Reaktor</a>. We are constantly looking for talented people - <a href="https://www.reaktor.com/careers">join us!</a>
