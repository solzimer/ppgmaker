angular.module('ppgmaker').directive("ppgEffects",function(styleService){
	var max = 360;
	var frame = 0;
	var uid = 0;
	var items = {};
	var frames = [];

	function init() {
		for(var i=0;i<max;i++) {
			frames[i] = Math.sin(i*Math.PI/180) - 0.5;
		}

		frames.push(frames[0]);
		for(var i=0;i<max;i++) {
			frames[i] = frames[(i+1)%(max+1)] - frames[i];
		}
		frames.pop();
	}

	function applyEffects() {
		requestAnimationFrame(applyEffects);
		for(var id in items) {
			var item = items[id];
			var play = item.scope.$eval("play");
			if(play<0) {
				var elem = $(item.element.get(0));
				var pos = elem.position();
				pos.top += frames[frame]*10;
				elem.css(pos);
				styleService.set(elem,pos);
			}
		}
		frame = (frame+5) % max;
	}

	function link(scope, element, attrs) {
		var id = "drag_"+(uid++);

		scope.$on("$destroy",function(){
			delete items[id];
		});

		items[id] = {
			scope:scope,
			element:element,
		};
	}

	init();
	requestAnimationFrame(applyEffects);
	return {
		link : link,
	}
});
