var THREEx = THREEx || {}

/**
 * Handle jsaruco markers
 * @constructor
 */
THREEx.JsArucoMarker = function(){
	var _this = this

	this.videoScaleDown = 2

	var vidCont = document.createElement('div');
	vidCont.style.opacity = 0;
	vidCont.innerHTML = '<video id="videofg" autoplay muted loop><source src="../dandi2.mp4" type="video/mp4" /></video>';
	document.body.appendChild(vidCont);
	var vidElem = document.getElementById('videofg');
	vidElem.load();

	var canvasElement = document.createElement('canvas');
	canvasElement.width = videoGrabbing.domElement.videoWidth/2;
	canvasElement.height = videoGrabbing.domElement.videoHeight/2;
	var context = canvasElement.getContext('2d');

	this.detectMarkers	= function(videoElement){


		if( videoElement instanceof HTMLVideoElement ){
			// if no new image for videoElement do nothing
			if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA){
				return []
			}
		if (canvasElement.width==0){
		canvasElement.width = videoElement.videoWidth/_this.videoScaleDown
		canvasElement.height = videoElement.videoHeight/_this.videoScaleDown
		}
		}

		// get imageData from videoElement
		context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
		var imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);

		// detect markers
		var detector = new AR.Detector();
		var markers = detector.detect(imageData);
		return markers
	}

	this.markersToObject3D = function(markers, m_ids, corners, taps, pg_no){
		// var m_ids = [10, 401, 265, 123, 124,125,126]

		var npos = {0:1, 1:0, 2:3, 3:2}
		var pgid = -1;
		markers.forEach(function(marker){
			pgid = 0;
			pos = m_ids.indexOf(marker.id);
			if (pos>-1){
			var posi = npos[pos];
			corners[pos] = {
				x : marker.corners[posi].x - (canvasElement.width / 2),
				y : (canvasElement.height / 2) - marker.corners[posi].y
			}
		}
		});
		canv = 	document.getElementById("overlay");
		ctx = canv.getContext("2d");
		x_scale_f = canv.width/canvasElement.width;
		y_scale_f = canv.height/canvasElement.height;
		cx0 = 0;
		cy0 = 0;
		// ctx.clearRect(0,0,canv.width,canv.height);
		ctx.strokeRect(0,0,canv.width,canv.height);

		pgpnts = []
		for (var i = 0;i<4;i++){
			cx = corners[i].x + (canvasElement.width / 2);
			cy = (canvasElement.height / 2) - corners[i].y;
			cx = cx * x_scale_f;
			cy = cy * y_scale_f;
			pgpnts.push([cx,cy]);
		}
		if (pgid < 0){pgid = pg_no;}
		if (pgid>-1){
			taps.push(pgid)
		for (var i=0;i<triggers.length;i++){
			ctx.fillStyle = 'red';
			var trigger = triggers[i];
			trigger['location_pnt']
			var coordinates = trigger['location_pnt'].replace('(','').replace(')','').split(',')
			coordinates = [parseFloat(coordinates[0]), parseFloat(coordinates[1])]
			rx = 80;
			px = pgpnts[1][0] + (pgpnts[0][0]-pgpnts[1][0])*coordinates[0] - rx/2;
			py = pgpnts[1][1] + (pgpnts[2][1]-pgpnts[1][1])*coordinates[1] - rx/2;
			px = Math.round(px);
			py = Math.round(py);
			taps.push([px+rx/2,py+rx/2]);


			ctx.drawImage($('#'+trigger['type'])[0], Math.round((canv.width*coordinates[0])-rx/2),
				Math.round((canv.height*(1-coordinates[1]))-rx/2),
				rx,rx)
			// ctx.fillRect(Math.round((canv.width*this.knowledge[pgid][i].coordinates[0])-rx/2),
			// 	Math.round((canv.height*(1-this.knowledge[pgid][i].coordinates[1]))-rx/2),
			// 	rx,rx);
			// console.log([px,py,rx]);

		}
		// if (pgid==1){
		// 	ctx.drawImage(vidElem,
		// 		Math.round(canv.width*this.knowledge[pgid][0].viewbox[0][0]),
		// 		Math.round(canv.height*(1-this.knowledge[pgid][0].viewbox[0][1])),
		// 		Math.round(canv.width*(this.knowledge[pgid][0].viewbox[1][0]-this.knowledge[pgid][0].viewbox[0][0])),
		// 		Math.round(canv.height*(this.knowledge[pgid][0].viewbox[0][1]-this.knowledge[pgid][0].viewbox[2][1])));

		// }

}
		// PERSPECTIVE TRANSFORM
		var canvaso = document.getElementById('canvaso');
		var texture = canvaso.texture(canv);
		var before = [0,0, canv.width,0, canv.width,canv.height, 0,canv.height];
		var after = [
		pgpnts[0][0],pgpnts[0][1], pgpnts[1][0],pgpnts[1][1],
		pgpnts[2][0],pgpnts[2][1], pgpnts[3][0],pgpnts[3][1]
		];
		canvaso.draw(texture).perspective(before, after).update();
		ctx.clearRect(0,0,canv.width,canv.height);

		return pgid
	}

}
