(function (root, factory) {

	if(typeof define === 'function' && define.amd) {

		// AMD
		define(['LeafletWmsAnimator'], factory);

	} else if (typeof exports === 'object') {

		// Node, CommonJS-like
		module.exports = factory(root);
	}
	else {
		// Browser globals
		root.returnExports = factory(root);
	}

}(this, function () {

	var LeafletWmsAnimator = {};
	var map = null;
	var layers = null;
	var frameIndex = 0;
	var animate = false;
	var timer = null;
	var timeoutMs = 200;

	LeafletWmsAnimator.initAnimation = function(options, callback){

		map = options.map;
		timeoutMs = options.timeoutMs || 200;

		// these params shouldn't change
		options.params['SERVICE'] = "WMS";
		options.params['REQUEST'] = "GetMap";

		var requests = _buildRequests(options.url, options.params, options.times, options.proxyFunction);

		Promise.all(requests).then(function(responses){
			LeafletWmsAnimator.createFrameLayers(responses, options.bbox, options.map);
			callback(responses);
		});
	};

	LeafletWmsAnimator.play = function(){
		animate = true;
		if(timer) clearTimeout(timer);
		_animateLoop();
	};

	LeafletWmsAnimator.pause = function(){
		animate = false;
		clearTimeout(timer);
	};

	LeafletWmsAnimator.forward = function(){
		var nextIndex = frameIndex + 1;
		if(nextIndex > layers.length - 1){
			nextIndex = 0;
		}
		LeafletWmsAnimator.setFrameIndex(nextIndex);
		return nextIndex;
	};

	LeafletWmsAnimator.backward = function(){
		var nextIndex = frameIndex - 1;
		if(nextIndex < 0){
			nextIndex = layers.length - 1;
		}
		LeafletWmsAnimator.setFrameIndex(nextIndex);
		return nextIndex;
	};

	LeafletWmsAnimator.destroyAnimation = function(){
		layers.forEach(function(layer) {
			LeafletWmsAnimator.map.removeLayer(layer);
		});
		layers = null;
		map = null;
		frameIndex = 0;
	};

	LeafletWmsAnimator.setFrameIndex = function(index){

		if(!layers) return;
		index = parseInt(index);

		layers.forEach(function(layer) {

			if(layer.options.wmsAnimationFrameIndex == index){
				layer.setOpacity(1);
			}

			else {
				layer.setOpacity(0);
			}
		});

		frameIndex = index;
		window.dispatchEvent(new CustomEvent('wmsAnimatorFrameIndexEvent', { detail: index }));
	};

	/**
	 * You can also use this function directly if you already have your frames from
	 * another source, e.g. s3, cache
	 * @param frames
	 * @param bounds
	 * @param map
	 */
	LeafletWmsAnimator.createFrameLayers = function(frames, bounds, map){

		layers = [];
		var southWest = L.latLng(bounds[1], bounds[0]);
		var northEast = L.latLng(bounds[3], bounds[2]);
		var	imageBounds = L.latLngBounds(southWest, northEast);

		// setup our frame layers, all hidden opacity except first frame
		var index = 0;
		frames.forEach(function(f){

			var options = { wmsAnimationFrameIndex: index, wmsAnimationFrameTime: f.time };
			if (index != 0) options['opacity'] = 0;

			var overlay = L.imageOverlay(f.img, imageBounds, options);
			overlay.addTo(map);
			layers.push(overlay);

			index++;
		});

	};

	function _animateLoop(){
		if(!animate){
			clearTimeout(timer);
			return;
		}
		timer = setTimeout(function(){
			LeafletWmsAnimator.forward();
			_animateLoop();
		}, timeoutMs);
	}

	function _buildRequests(url, params, times, proxyFunction){

		var requests = [];

		times.forEach(function(time){

			var requestUrl = url + '?' + _stringifyParams(params) + 'TIME='+ time;

			requests.push(
				new Promise((resolve, reject) => {
					proxyFunction(requestUrl, time, resolve, reject);
				})
			);

		});

		return requests;
	}

	function _stringifyParams(params){
		var query = '';
		Object.keys(params).forEach(function(key) {
			query += key +'='+ params[key] +'&';
		});
		return query;
	}


	return LeafletWmsAnimator;

}));