Sataako.fi
==========

![screenshot](https://raw.github.com/heikkipora/sataako-fi/master/work/screenshot.png)

Introduction
------------
I wanted to create a mobile-friendly weather service for Finland which has the simplest possible user interface (in Finnish).

[Sataako.fi](https://www.sataako.fi) fetches weather radar images from [Finnish Meteorological Institute](http://en.ilmatieteenlaitos.fi)'s [Open Data APIs](http://en.ilmatieteenlaitos.fi/open-data-manual) and shows them as a MapLibre GL JS image layer after some post-processing. The vector map tiles are served from [OpenFreeMap](https://openfreemap.org/) using [OpenStreetMap](https://www.openstreetmap.org) data. The movement of rain clouds is shown as a short animation covering the last hour.

Embedding
---------
If you want to embed the map into another website such as a radiator or a home automation system, you
can fix the coordinates and zoom level and automatically hide the side panel using query parameters.

Available query parameters:
* `lng` & `lat`: Set the coordinate the map centers on (WGS84 longitude/latitude).
* `zoom`: Set the default zoom level
* `collapsed`: Set the collapsed status of the side panel. Set as `true` to hide the side bar by default.

Example: `https://www.sataako.fi?lng=24.94&lat=60.17&zoom=7&collapsed=true`

Runtime environment
-------------------
The node.js application runs in [Hetzner Cloud](https://www.hetzner.com/cloud) with a single vCpu instance. It's deployed there with ```ansible```.

It's responsible for

* maintaing an up-to-date list of radar frames available from FMI
* delivering those frames as post-processed PNG or WEBP images (depending on the browser)

To be able to serve a decent amount of concurrent users without exceeding the FMI API request rate, the following steps are done:

* requests to FMI API go through a task queue which limits concurrency
* radar frame list is cached internally for one minute before a re-fetch from FMI
* radar frame images are cached locally for about one hour

Radar frame post-processing
---------------------------
FMI provides a [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) compliant HTTP API for fetching a composite radar image covering all of Finland.
To be able to use those images on top of the map the following steps are taken:

* request a PNG image in [EPSG:3067 projection](http://spatialreference.org/ref/epsg/3067/) which is native for FMI's radar images
* decode PNG into raw 32bit pixel data
* change a solid gray background (0xf7f7f7) to fully transparent
* use a [mask-image](src/radar-mask.png) to change a solid orange area outside the radars' range to fully transparent
* use an [overlay-image](src/radar-edges.png) to draw the edge of the radars' range
* encode image as PNG and WEBP maintaining transparency

MapLibre GL JS reprojects those images on the fly from EPSG:3067 to the map's Web Mercator projection using precomputed corner coordinates.

## Contributing

Pull requests are welcome. Kindly check that your code passes ESLint checks by running ```npm test``` first.

## Contributors

* Lauri Kangassalo ([lakka](https://github.com/lakka)) - Lightning implementation
