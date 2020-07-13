var winw;
var winh;
var g_canvasScaleRate = 1;

var passiveSupported = false;
try {
	var options = Object.defineProperty({}, "passive", {
		get: function() {
			passiveSupported = true;
		}
	});
	window.addEventListener("test", null, options);
} catch(err) {}

(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

let init = function(){
	Editor.resetWindowSize()
	initCanvas()
	Editor.init()
	Editor.startTick()
}

window.onload = init