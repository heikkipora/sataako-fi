Sataako.fi
==========

![screenshot](https://raw.github.com/heikkipora/sataako-fi/master/work/screenshot.jpg)

Introduction
------------
I wanted to create a mobile-friendly weather service for Finland which has the simplest possible user interface (in Finnish).

[Sataako.fi](http://www.sataako.fi) fetches weather radar images from [Finnish Meteorological Institute](http://en.ilmatieteenlaitos.fi)'s [Open Data APIs](http://en.ilmatieteenlaitos.fi/open-data-manual) and shows them as Google Maps layers after some post-processing.
The movement of rain clouds is shown as a short animation covering the last hour.

Runtime environment
-------------------
The node.js application runs in [Heroku](http://heroku.com) with a single [Hobby dyno](https://devcenter.heroku.com/articles/dyno-types).

It's responsible for

* maintaing an up-to-date list of radar frames available from FMI
* delivering those frames as post-processed GIF images

To be able to serve a decent amount of concurrent users without exceeding the FMI API request rate, the following steps are done:

* requests to FMI API go through a task queue which limits concurrency
* radar frame list is cached internally for one minute before a re-fetch from FMI
* radar frame images are cached 1) locally for about one hour and 2) by an AWS Cloudfront distribution sitting in front of the Heroku app (at cdn.sataako.fi) for 24 hours

Radar frame post-processing
---------------------------
FMI provides a [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) compliant HTTP API for fetching a composite radar image covering all of Finland.
To be able to use those images on top of Google Maps the following steps are taken:

* request a PNG image in [EPSG:3857 projection](http://spatialreference.org/ref/sr-org/7483/) to match Google Maps's projection
* decode PNG into raw 32bit pixel data
* change a solid gray background (0xf7f7f7) to fully transparent
* use a [mask-image](src/radar-mask.png) to change a solid orange border area (related to changing the projection obviously) to fully transparent
* encode image as GIF maintaining transparency

Running costs / month
---------------------

With a (modest) amount of concurrent users the service runs almost for free:

* 7€ - Heroku
* 1-3€ - AWS CloudFront (CDN) & Route53 (DNS)
* 1€ - FI domain

