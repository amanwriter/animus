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

		var before = [-10,0, canv.width+10,0, canv.width+10,canv.height, -10,canv.height];
		var after = [
		pgpnts[0][0],pgpnts[0][1], pgpnts[1][0],pgpnts[1][1],
		pgpnts[2][0],pgpnts[2][1], pgpnts[3][0],pgpnts[3][1]
		];

  		var perspT = PerspT(before, after);
  // var srcPt = [250, 120];
  // var dstPt = perspT.transform(srcPt[0], srcPt[1]);


		if (pgid < 0){pgid = pg_no;}
		if (pgid>-1){
			taps.push(pgid)
		for (var i=0;i<triggers.length;i++){
			ctx.fillStyle = 'red';
			var trigger = triggers[i];
			var coordinates = trigger['location_pnt'].replace('(','').replace(')','').split(',')
			coordinates = [parseFloat(coordinates[0]), (parseFloat(coordinates[1]))]
			rx = 80;
			if (trigger['type']=='3dmodel'){rx=10;}
			if (trigger['type']=='location'){rx=30;}
			if (trigger['type']=='info'){rx=40;}
			dstPnt = perspT.transform(canv.width*coordinates[0],canv.height*(1-coordinates[1]));
			taps.push([Math.round(dstPnt[0]),Math.round(dstPnt[1])]);
			if ((trigger['type'] == 'video')||(trigger['type'] == '3dmodel')){

			var box = trigger['location_box'].replace(/\(/g,'').replace(/\)/g,'').split(',');
			box = [parseFloat(box[0]), parseFloat(box[1]),
			parseFloat(box[2]), parseFloat(box[3])];
			var drawing_element = $('#trigger'+i)[0];
			if (trigger['type']=='video'){
				drawing_element = $('#vid_trigger'+i)[0];
			}
			if (trigger['type']=='3dmodel'){
				drawing_element = drawing_element.contentDocument.getElementById('3dmodel');}
			ctx.drawImage(drawing_element,
				Math.round(canv.width*box[2]),
				Math.round(canv.height*(1-box[1])),
				Math.round(canv.width*(box[0]-box[2])),
				Math.round(canv.height*(box[1]-box[3])));
			}

			var y_offset = 0;
			if (trigger['type']=='location'){y_offset+=rx/2;}
			ctx.drawImage($('#'+trigger['type'])[0], Math.round((canv.width*coordinates[0])-rx/2),
				Math.round((canv.height*(1-coordinates[1]))-(rx/2)-(y_offset)),
				rx,rx);

		}

}
		// PERSPECTIVE TRANSFORM
		var canvaso = document.getElementById('canvaso');
		var texture = canvaso.texture(canv);
		canvaso.draw(texture).perspective(before, after).update();
		ctx.clearRect(0,0,canv.width,canv.height);
		return pgid
	}

}
