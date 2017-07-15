var THREEx = THREEx || {}

/**
 * Handle jsaruco markers
 * @constructor
 */
THREEx.JsArucoMarker = function(){
	var _this = this

	this.debugEnabled = false
	this.videoScaleDown = 2
	this.modelSize = 75.0 // millimeter

	this.knowledge = [
[{"heading": "atom_model", "coordinates": [0.21,0.26], "size": "large"}],
[{"heading": "dandi_march", "coordinates": [0.4,0.75], "size": "large", "viewbox": [[0.094, 0.89],[0.68,0.89],[0.094, 0.6],[0.7,0.6]]}],
[{"heading": "tetrahedral", "coordinates": [0.64,0.52], "size": "medium"},
{"heading": "bipyramidal", "coordinates": [0.64,0.34], "size": "medium"},
{"heading": "octahedral", "coordinates": [0.64,0.13], "size": "medium"}],
[{"heading": "bhakra_nangal", "coordinates": [0.32,0.74], "size": "small"},
 {"heading": "hirakud", "coordinates": [0.54,0.45], "size": "small"},
 {"heading": "nagarjuna", "coordinates": [0.38,0.3], "size": "small"},
 {"heading": "gandhisagar", "coordinates": [0.27,0.54], "size": "small"}
]
]

	var vidElem = document.createElement('video')
	vidElem.src = '../gandhi.mp4';//'http://upload.wikimedia.org/wikipedia/commons/7/79/Big_Buck_Bunny_small.ogv';
	vidElem.controls = false;
	vidElem.style.display = 'none';
	vidElem.autoplay = true;
	vidElem.loop = true;
	vidElem.load();

// vidElem.addEventListener('play', function () {
//     var $this = this; //cache
//     (function loop() {
//         if (!$this.paused && !$this.ended) {
//             ctx.drawImage($this, 0, 0);
//             setTimeout(loop, 1000 / 30); // drawing at 30fps
//         }
//     })();
// }, 0);


	var canvasElement = document.createElement('canvas')
	var context = canvasElement.getContext("2d");

	// create debug element
	var debugElement = document.createElement('div')
	debugElement.appendChild(canvasElement)
	debugElement.style.position = 'absolute'
	debugElement.style.top = '0px'
	debugElement.style.left = '0px'
	debugElement.style.opacity = 0.2

	var debugInfoElement = document.createElement('div')
	debugElement.appendChild( debugInfoElement )
	debugInfoElement.classList.add('info')
	debugInfoElement.innerHTML = ''
		+ '<div>canvasSize: <span class="canvasSize">n/a</span></div>'
		+ '<div>videoScaleDown: <span class="videoScaleDown">n/a</span></div>'
		+ '<div>videoSize: <span class="videoSize">n/a</span></div>'

	/**
	 * Detect Marker in a videoElement or imageElement
	 *
	 * @param {HTMLVideoElement|HTMLImageElement} videoElement - the source element
	 * @return {Object[]} - array of found markers
	 */
	this.detectMarkers	= function(videoElement){
		// if domElement is a video
		if( videoElement instanceof HTMLVideoElement ){
			// if no new image for videoElement do nothing
			if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA){
				return []
			}

			canvasElement.width = videoElement.videoWidth/_this.videoScaleDown
			canvasElement.height = videoElement.videoHeight/_this.videoScaleDown
		// if domElement is a image
		}else if( videoElement instanceof HTMLImageElement ){
			if( videoElement.naturalWidth === 0 ){
				return []
			}

			canvasElement.width = videoElement.naturalWidth/_this.videoScaleDown
			canvasElement.height = videoElement.naturalHeight/_this.videoScaleDown
		}else console.assert(false)

		// get imageData from videoElement
		context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
		var imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);

		// detect markers
		var detector = new AR.Detector();
		var markers = detector.detect(imageData);

		//////////////////////////////////////////////////////////////////////////////////
		//		update debug
		//////////////////////////////////////////////////////////////////////////////////

		// TODO put that in a special class ?

		var debugAttached = debugElement.parentNode !== null ? true : false

		if( this.debugEnabled === true && debugAttached === false ){
			document.body.appendChild(debugElement)
		}

		if( this.debugEnabled === false && debugAttached === true ){
			debugElement.parentNode.removeChild( debugElement )
		}

		// display markers on canvas for debug
		if( this.debugEnabled === true ){
			debugElement.querySelector('.info .videoScaleDown').innerHTML = this.videoScaleDown
			if( videoElement.videoWidth !== undefined ){
				debugElement.querySelector('.info .videoSize').innerHTML = videoElement.videoWidth + 'x' + videoElement.videoHeight
			}else{
				debugElement.querySelector('.info .videoSize').innerHTML = videoElement.naturalWidth + 'x' + videoElement.naturalHeight
			}
			debugElement.querySelector('.info .canvasSize').innerHTML = canvasElement.width + 'x' + canvasElement.height
			drawDebug(markers, canvasElement)
		}


		// return the result
		return markers
	}

	this.markersToObject3D = function(markers, object3d, corners, taps, pg_no){
		// convert corners coordinate - not sure why
		// var corners = []//marker.corners;
		// var m_ids = [265, 123, 10, 401];
		var m_ids = [10, 401, 265, 123, 124,125,126]
		var pgid = -1;
		markers.forEach(function(marker){
			// console.log(marker.id);
			// console.log(marker.corners);
			pos = m_ids.indexOf(marker.id);
			if (pos>2){pgid=pos-3;pos = 3;}
			if (pos>-1){
			corners[pos] = {
				x : marker.corners[pos].x - (canvasElement.width / 2),
				y : (canvasElement.height / 2) - marker.corners[pos].y
			}
		}
		});

		canv = 	document.getElementById("overlay");
		ctx = canv.getContext("2d");
		x_scale_f = canv.width/canvasElement.width;
		y_scale_f = canv.height/canvasElement.height;
		cx0 = 0;
		cy0 = 0;
		ctx.clearRect(0,0,canv.width,canv.height);
		ctx.beginPath();
		pgpnts = []
		for (var i = 0;i<4;i++){
			cx = corners[i].x + (canvasElement.width / 2);
			cy = (canvasElement.height / 2) - corners[i].y;
			cx = cx * x_scale_f;
			cy = cy * y_scale_f;
			pgpnts.push([cx,cy]);
			if (i==0){ctx.moveTo(cx,cy);cx0 = cx;cy0 = cy;}
			else{ctx.lineTo(cx,cy);}
		}
		ctx.lineTo(cx0, cy0);
		ctx.stroke();
		ctx.closePath();
		if (pgid < 0){pgid = pg_no;}
		if (pgid>-1){
			taps.push(pgid)
		for (var i=0;i<this.knowledge[pgid].length;i++){
			ctx.fillStyle = 'red';
			rx = 10;
			if (this.knowledge[pgid][i].size == "medium"){rx=20;}
			if (this.knowledge[pgid][i].size == "large"){rx=30;}
			px = pgpnts[1][0] + (pgpnts[0][0]-pgpnts[1][0])*this.knowledge[pgid][i].coordinates[0] - rx/2;
			py = pgpnts[1][1] + (pgpnts[2][1]-pgpnts[1][1])*this.knowledge[pgid][i].coordinates[1] - rx/2;
			px = Math.round(px);
			py = Math.round(py);
			taps.push([px+rx/2,py+rx/2]);

			//console.log([px,py,rx]);

		}
		if (pgid==1){
			vx = pgpnts[1][0] + (pgpnts[0][0]-pgpnts[1][0])*this.knowledge[pgid][0].viewbox[0][0]
			vy = pgpnts[1][1] + (pgpnts[2][1]-pgpnts[1][1])*this.knowledge[pgid][0].viewbox[0][1]
			vx1 = pgpnts[1][0] + (pgpnts[0][0]-pgpnts[1][0])*this.knowledge[pgid][0].viewbox[1][0]
			vy1 = pgpnts[1][1] + (pgpnts[2][1]-pgpnts[1][1])*this.knowledge[pgid][0].viewbox[2][1]
			ctx.drawImage(vidElem, vx, vy, Math.round(vx1-vx), Math.round(vy1-vy));
		}

}

		// console.log(corners);
		// for (var i = 0; i < marker.corners.length; ++ i){
		// 	corners.push({
		// 		x : marker.corners[i].x - (canvasElement.width / 2),
		// 		y : (canvasElement.height / 2) - marker.corners[i].y,
		// 	})
		// }
		// compute the pose from the canvas
		var posit = new POS.Posit(this.modelSize, canvasElement.width);
		var pose = posit.pose(corners);
		// console.assert(pose !== null)
		if( pose === null )	return;

		//////////////////////////////////////////////////////////////////////////////////
		//		Translate pose to THREE.Object3D
		//////////////////////////////////////////////////////////////////////////////////
		var rotation = pose.bestRotation
		var translation = pose.bestTranslation

		object3d.scale.x = this.modelSize/2;
		object3d.scale.y = this.modelSize/2;
		object3d.scale.z = this.modelSize/2;

		object3d.rotation.x = -Math.asin(-rotation[1][2]);
		object3d.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
		object3d.rotation.z =  Math.atan2(rotation[1][0], rotation[1][1]);

		object3d.position.x =  translation[0];
		object3d.position.y =  translation[1];
		object3d.position.z = -translation[2];
		return pgid
	}

	/**
	* draw corners on a canvas - useful to debug
	*
	* @param {Object[]} markers - array of found markers
	*/
	function drawDebug(markers, canvasElement){
		var context = canvasElement.getContext("2d");
		context.lineWidth = 3;

		for (var i = 0; i < markers.length; ++ i){
			var marker = markers[i]
			var corners = marker.corners;

			context.strokeStyle = "red";
			context.beginPath();

			for (var j = 0; j < corners.length; ++ j){
				var corner = corners[j];
				context.moveTo(corner.x, corner.y);
				corner = corners[(j + 1) % corners.length];
				context.lineTo(corner.x, corner.y);
			}

			context.stroke();
			context.closePath();

			context.strokeStyle = "green";
			context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
			// console.log('marker', marker.id)

			context.fillStyle = "blue";
			context.font = "bold 10px Arial";
			context.fillText("id: "+marker.id, corners[0].x, corners[0].y);
		}
	};
}
