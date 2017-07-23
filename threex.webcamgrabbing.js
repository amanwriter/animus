var THREEx = THREEx || {}

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL;

/**
 * Grab camera
 * @constructor
 */
THREEx.WebcamGrabbing = function() {

    var domElement = document.createElement('video')
    domElement.setAttribute('autoplay', true)

    domElement.style.zIndex = -1;
    domElement.style.position = 'absolute'

    domElement.style.top = '0px'
    domElement.style.left = '0px'
    domElement.style.width = window.innerWidth + 'px' //'100%'
    domElement.style.height = window.innerHeight + 'px' //'100%'
    domElement.style.objectFit = "fill";

    function onResize() {
        if (domElement.videoHeight === 0) return

        domElement.style.width = window.innerWidth + 'px' //'100%'
        domElement.style.height = window.innerHeight + 'px' //'100%'
        domElement.videoWidth = window.innerWidth;
        domElement.videoHeight = window.innerHeight;
        domElement.width = window.innerWidth;
        domElement.height = window.innerHeight;
    }

    window.addEventListener('resize', function(event) {
        onResize()
    })

    setInterval(function() {
        onResize()
    }, 500)

    navigator.mediaDevices.enumerateDevices().then(sourceInfos => {
        var constraints = {
            video: true,
            audio: false,
        }
        for (var i = 0; i != sourceInfos.length; ++i) {
            var sourceInfo = sourceInfos[i];
            if (sourceInfo.kind == "videoinput") {
                constraints.video = {
                    deviceId: {
                        exact: sourceInfo.deviceId
                    }
                }
            }
        }

        navigator.getUserMedia(constraints, function(stream) {
            domElement.src = URL.createObjectURL(stream);
        }, function(error) {
            console.error("Cant getUserMedia()! due to ", error);
        });
    });

    this.domElement = domElement
}