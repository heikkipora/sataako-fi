Sataako.fi
==========

Introduction
------------
I wanted to create a mobile-friendly weather-service for Finland which has the simplest possible user interface.

[Sataako.fi](http://www.sataako.fi) fetches weather radar images from [Finnish Meteorological Institute](http://en.ilmatieteenlaitos.fi)'s [Open Data APIs](http://en.ilmatieteenlaitos.fi/open-data-manual) and shows them as Google Maps layers after some post-processing.


Runtime environment
-------------------
The node.js application runs in [Heroku](http://heroku.com) with a single [Hobby dyno](https://devcenter.heroku.com/articles/dyno-types).

It's responsible for

* maintaing an up-to-date list of radar frames available from FMI
* delivering those frames as post-processed GIF images

To be able to serve a decent amount of concurrent users without exceeding the FMI API request rate, the following steps are done:

* radar frame list is cached internally for one minute before a re-fetch from FMI
* radar frame images are cached by an AWS Cloudfront distribution sitting in front of the Heroku app (at cdn.sataako.fi)

Running costs / month
---------------------

* 7€ - Heroku
* 1-3€ - AWS CloudFront (CDN) & Route53 (DNS)
* 1€ - FI domain
