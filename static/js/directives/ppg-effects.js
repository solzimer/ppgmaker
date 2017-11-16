angular.module('ppgmaker').directive("ppgEffects",function($interval){
	var max = 360;
	var frame = 0;
	var uid = 0;
	var items = {};
	var frames = [];

	function init() {
		for(var i=0;i<max;i++) {
			frames[i] = Math.sin(i*Math.PI/180) - 0.5;
		}
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
			}
		}
		frame = (frame+1) % max;
	}

	function link(scope, element, attrs) {
		var id = "drag_"+(uid++);

		scope.$on("$destroy",function(){
			delete elems[id];
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
