"use strict";

WmsOverlay.prototype = new google.maps.OverlayView();

function WmsOverlay(bounds, map) {
  var swBound = new google.maps.LatLng(bounds.minY, bounds.minX);
  var neBound = new google.maps.LatLng(bounds.maxY, bounds.maxX);
  var mapsBounds = new google.maps.LatLngBounds(swBound, neBound);

  this.bounds_ = mapsBounds;
  this.div_ = null;
  this.setMap(map);
  this.frames_ = [];
  this.currentFrameIndex_ = 0;
}

WmsOverlay.prototype.onAdd = function () {
  var div = document.createElement('div');
  div.style.borderStyle = 'none';
  div.style.borderWidth = '0px';
  div.style.position = 'absolute';
  div.style.opacity = '0.9';

  var img = document.createElement('img');
  img.id = 'radar-image';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.position = 'absolute';
  div.appendChild(img);

  this.div_ = div;

  this.getPanes().overlayLayer.appendChild(div);
  this.reloadFrameList();
  this.animateRadar();
};

WmsOverlay.prototype.reloadFrameList = function () {
  var self = this;
  $.get('/frames.json', function (frames) {
    if (frames.length != self.frames_.length || frames[frames.length - 1].timestamp != self.frames_[frames.length - 1].timestamp) {
      self.frames_ = frames;
      var images = frames.map(function (frame) {
        return $('<img>').attr('src', frame.image);
      });
      $('#preload-frames').empty().append(images);
    }
  });

  var overlay = this;
  setTimeout(function () {
    overlay.reloadFrameList();
  }, 60 * 1000);
};

WmsOverlay.prototype.animateRadar = function () {
  var delayMs = 500;
  if (this.frames_.length > 0) {
    if (this.currentFrameIndex_ >= this.frames_.length) {
      this.currentFrameIndex_ = 0;
      delayMs = 5 * 1000;
    } else {
      var currentFrame = this.frames_[this.currentFrameIndex_++];
      document.getElementById('radar-image').src = currentFrame.image;
      var timestamp = moment(currentFrame.timestamp);
      $('.radar-timestamp').empty().append($('<span>').text(timestamp.format("D.M. HH:mm")));
    }
  }

  var overlay = this;
  setTimeout(function () {
    overlay.animateRadar();
  }, delayMs);
};

WmsOverlay.prototype.draw = function () {
  var overlayProjection = this.getProjection();
  var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
  var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

  this.div_.style.left = sw.x + 'px';
  this.div_.style.top = ne.y + 'px';
  this.div_.style.width = (ne.x - sw.x) + 'px';
  this.div_.style.height = (sw.y - ne.y) + 'px';
};

WmsOverlay.prototype.onRemove = function () {
  this.div_.parentNode.removeChild(this.div_);
  this.div_ = null;
};

// ----

var defaultUserSettings = {
  lat: Number(localStorage.getItem('sataako-fi-lat')) || 60.17297214455122,
  lng: Number(localStorage.getItem('sataako-fi-lng')) || 24.93999467670711,
  zoom: Number(localStorage.getItem('sataako-fi-zoom')) || 7
};

var map = null;

var saveDefaults = function () {
  var latLng = map.getCenter();
  localStorage.setItem('sataako-fi-lat', latLng.lat());
  localStorage.setItem('sataako-fi-lng', latLng.lng());
  localStorage.setItem('sataako-fi-zoom', map.getZoom());
};

var initializeGoogleMaps = function () {
  var styles = [
    {
      "featureType": "landscape",
      "elementType": "geometry",
      "stylers": [
        {
          "lightness": "100"
        },
        {
          "saturation": "-100"
        },
        {
          "visibility": "on"
        },
        {
          "color": "#f1eadf"
        },
        {
          "gamma": "1.36"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text",
      "stylers": [
        {
          "lightness": "7"
        },
        {
          "gamma": "2.76"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "visibility": "on"
        },
        {
          "color": "#caecc6"
        },
        {
          "lightness": "11"
        },
        {
          "gamma": "0.91"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#ff0000"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "visibility": "on"
        },
        {
          "saturation": "-39"
        },
        {
          "lightness": "-18"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        {
          "visibility": "simplified"
        },
        {
          "color": "#dddddd"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels",
      "stylers": [
        {
          "saturation": "-100"
        }
      ]
    },
    {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#dddddd"
        }
      ]
    },
    {
      "featureType": "road.highway.controlled_access",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "saturation": "-64"
        },
        {
          "lightness": "27"
        },
        {
          "gamma": "1.68"
        },
        {
          "weight": "2.18"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [
        {
          "visibility": "simplified"
        },
        {
          "color": "#ffffff"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "lightness": "30"
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "geometry",
      "stylers": [
        {
          "visibility": "simplified"
        },
        {
          "color": "#eeeeee"
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "visibility": "on"
        },
        {
          "lightness": "100"
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "visibility": "on"
        },
        {
          "lightness": "0"
        },
        {
          "gamma": "1.59"
        },
        {
          "saturation": "-100"
        }
      ]
    },
    {
      "featureType": "transit.line",
      "elementType": "labels.text",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "transit.station.bus",
      "elementType": "all",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "transit.station",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "visibility": "on"
        },
        {
          "lightness": "0"
        },
        {
          "gamma": "1.59"
        },
        {
          "saturation": "-100"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#b2e0fc"
        },
        {
          "lightness": "20"
        },
        {
          "saturation": "-32"
        },
        {
          "gamma": "1.18"
        }
      ]
    }];

  var mapOptions = {
    center: new google.maps.LatLng(defaultUserSettings.lat, defaultUserSettings.lng),
    zoom: defaultUserSettings.zoom,
    disableDefaultUI: true,
    zoomControl: false,
    styles: styles
  };

  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
  map.addListener('bounds_changed', saveDefaults);

  var wsg84Bounds = {
    minX: 10.215546158022443,
    minY: 56.751319918431086,
    maxX: 37.371658784549375,
    maxY: 71.24172567165043
  };
  var radarOverlay = new WmsOverlay(wsg84Bounds, map);

  navigator.geolocation.getCurrentPosition(function (geolocationResponse) {
    var latLng = new google.maps.LatLng(geolocationResponse.coords.latitude, geolocationResponse.coords.longitude);
    map.panTo(latLng);
    var marker = new google.maps.Marker({
      position: latLng,
      map: map,
      title: 'Olet tässä'
    });
  });
};

var toggleSideInfoPanel = function () {
  var $sideInfoPanelOpenObject = $("#side-info-panel-open");
  var $sidePanelReactionObjects = $(".side-info-panel, .zoom-control-buttons, .line-toggle-container");

  $sideInfoPanelOpenObject.toggle();
  $sidePanelReactionObjects.toggleClass("side-panel-hidden");
};

var setupUIControls = function () {
  $("#close-side-info").click(toggleSideInfoPanel);
  $("#side-info-panel-open").click(toggleSideInfoPanel);

  google.maps.event.addDomListener(zoomin, "click", function () {
      map.setZoom(map.getZoom() + 1);
    }
  );
  google.maps.event.addDomListener(zoomout, "click", function () {
      map.setZoom(map.getZoom() - 1);
    }
  );
};

var initializeApp = function () {
  if (window.innerWidth < 650) {
    toggleSideInfoPanel();
  }

  initializeGoogleMaps();
  setupUIControls();
};

$(document).ready(function () {
  ga("send", "pageview", "/");

  initializeApp();
});
