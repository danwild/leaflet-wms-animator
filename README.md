# leaflet wms animator [![npm version](https://badge.fury.io/js/leaflet-wms-animator.svg)](https://badge.fury.io/js/leaflet-wms-animator)

Animate WMS layers with temporal dimensions.

WMS implementations are crudely starting to support animations, through the use of animated GIFs 
(e.g. [Geoserver WMS Animator](http://docs.geoserver.org/stable/en/user/tutorials/animreflector.html)).<br/>
However; the lack of start/stop/step/rewind etc. functionality in a GIF limits the usefulness of this approach.

This simple JS plugin provides some convenience functions to pre-fetch a collection of temporal slices 
from WMS to step through and/or animate them as [leaflet image overlays](http://leafletjs.com/reference.html#imageoverlay).
<br/>Note that this plugin works for ncWMS (as per example, `params` object accepts arbitrary key/value pairs).

## notes before use

- To get around CORS restrictions, I am using a proxy server. To use this plugin you will also need a proxy server, OR have admin access to your target WMS to enable CORS.
- This plugin uses [ES6 Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) syntax,
 which is [not supported](http://caniuse.com/#feat=promises) by older browsers - you may need a [Polyfill](https://babeljs.io/docs/usage/polyfill/).

## example use
```javascript
var args = {
		
	// reference to your leaflet map
	map: map,
	
	// WMS endpoint
	url: 'http://localhost:8080/geoserver/wms',
	
	// time slices to create (u probably want more than 2)
	times: ["2016-09-17T11:00:00.000Z", "2016-09-17T12:00:00.000Z"],
	
	// the bounds for the entire target WMS layer
	bbox: ["144.9497022","-42.5917177","145.7445272","-41.9883032"],
	
	// how long to show each frame in the animation  
	timeoutMs: 300,
	
	// due to CORS restrictions, you need to define a function to ask your proxy server to make the WMS 
	// GetMap request - this example is using a call to a server function called 'getImage' (in MeteorJS)
	// note that if your target WMS is CORS enabled, you can just define a direct HTTP request here instead.
	proxyFunction: function(requestUrl, time, resolve, reject){
		Meteor.call('getImage', requestUrl, function(err, res) {
			if(err){
				console.log('http request rejected');
				reject(err);
			}

			resolve({ time: time, img: res });
		});
	},
	
	// your WMS query params
	params: {
		BBOX: "144.9497022,-42.5917177,145.7445272,-41.9883032",
		LAYERS: "temp",
		SRS: "EPSG:4326",
		VERSION: "1.1.1",
		WIDTH: 2048, 
		HEIGHT: 2048,
		transparent: true,

		// ncWMS params (optional)
		abovemaxcolor: "extend",
		belowmincolor: "extend",
		colorscalerange: "10.839295,13.386014",
		elevation: "-5.050000000000001",
		format: "image/png",
		logscale: false,
		numcolorbands: "50",
		opacity: "100",
		styles: "boxfill/rainbow"
	}
};

LeafletWmsAnimator.initAnimation(args, function(frames){
	// callback function returns an array of images with their
	// respective time stamps (e.g. you can use timestamps in UI)
});
```

## convenience functions

- <strong>forward:</strong> step forward to next frame
- <strong>backward:</strong> step backward to previous frame
- <strong>play:</strong> start animating
- <strong>pause:</strong> pause animation
- <strong>setFrameIndex:</strong> skip to a specific animation frame
- <strong>destroyAnimation:</strong> destroy animation, removes image overlay layers from map etc.

## events

The `wmsAnimatorFrameIndexEvent` is dispatched from `window` every time a frame is changed, you can listen to this event to know what time frame is currently active.

Example use:

```javascript
window.addEventListener('wmsAnimatorFrameIndexEvent', function (e) {
   console.log('current frame time is at array index: '+ e.detail);
});
```

## license
MIT
