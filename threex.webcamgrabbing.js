var THREEx = THREEx || {}

// shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL;

/**
 * Grab camera
 * @constructor
 */
THREEx.WebcamGrabbing = function(){

	//////////////////////////////////////////////////////////////////////////////////
	//		Comments
	//////////////////////////////////////////////////////////////////////////////////
        // create video element
        var domElement        = document.createElement('video')
        domElement.setAttribute('autoplay', true)

	// window.domElement = video
	domElement.style.zIndex = -1;
        domElement.style.position = 'absolute'

	// domElement.style.top = '50%'
	// domElement.style.left = '50%'
	// domElement.style.marginRight = '50%'
	// domElement.style.transform = 'translate(-50%, -50%)'
	// domElement.style.minWidth = '100%'

	domElement.style.top = '0px'
	domElement.style.left = '0px'
	domElement.style.width = window.innerWidth+'px'//'100%'
	domElement.style.height = window.innerHeight+'px'//'100%'
    domElement.style.objectFit= "fill";
        /**
         * Resize video element.
         * - Made complex to handle the aspect change
         * - it is frequently when the mobile is changing orientation
         * - after a search on the internet, it seems hard/impossible to prevent browser from changing orientation
         */
        function onResize(){
                // is the size of the video available ?
                if( domElement.videoHeight === 0 )   return

                domElement.style.width = window.innerWidth+'px'//'100%'
                domElement.style.height = window.innerHeight+'px'//'100%'
                domElement.videoWidth = window.innerWidth;
                domElement.videoHeight = window.innerHeight;
                domElement.width = window.innerWidth;
                domElement.height = window.innerHeight;
        }

        window.addEventListener('resize', function(event){
                onResize()
        })

        // just to be sure - resize on mobile is funky to say the least
        setInterval(function(){
                onResize()
        }, 500)

        // get the media sources
        //MediaStreamTrack.getSources(function(sourceInfos) {
        navigator.mediaDevices.enumerateDevices().then(sourceInfos => {
                // define getUserMedia() constraints
                var constraints = {
                        video: true,
                        audio: false,
                }
                // to mirror the video element when it isnt 'environment'
                // domElement.style.transform   = 'scaleX(-1)'

                // it it finds the videoSource 'environment', modify constraints.video
                for (var i = 0; i != sourceInfos.length; ++i) {
                        var sourceInfo = sourceInfos[i];
                        if(sourceInfo.kind == "videoinput"){ //&& sourceInfo.facing == "environment") {
                                constraints.video = {
                                        deviceId: {exact:sourceInfo.deviceId}
                                        //optional: [{sourceId: sourceInfo.id}]
                                }
                                // not to mirror the video element when it is 'environment'
                                // domElement.style.transform   = ''
                        }
                }

                // try to get user media
                navigator.getUserMedia( constraints, function(stream){
                        domElement.src = URL.createObjectURL(stream);
                }, function(error) {
                        console.error("Cant getUserMedia()! due to ", error);
                });
        });

	this.domElement = domElement
}
