angular.module('ppgmaker').directive("ppgPlay",function($q) {
	var items = {};
	var uid = 0;

	function animate() {
		for(key in items) {
			var item = items[key];
			if(item.frame>=0) {
				var pos = item.buffer[item.frame];
				if(pos) {
					$(item.elem).css(pos);
					item.frame++;
				}
				else {
					item.frame = -1;
				}
			}
		}
		requestAnimationFrame(animate);
	}

	function getId(el) {
		if(!el.attr("id")) el.attr("id","ppgplay_"+(uid++));
		return el.attr("id");
	}

	function link(scope,element,attrs) {
		scope.$watch("ppgPlay",function(frame) {
			var elems = document.querySelectorAll("[ppg-record]",element);
			elems.forEach(function(el){
				el = angular.element(el);
				var id = getId(el);
				var buffer = el.scope().$eval(el.attr("ppg-record"));
				items[id] = {frame:frame, elem:el, buffer:buffer}
			});
		});

		scope.$on("$destroy",function(){
			var elems = document.querySelectorAll("[ppg-record]",element);
			elems.forEach(function(el){
				el = angular.element(el);
				var id = getId(el);
				delete items[id];
			});
		});
	}

	animate();
	return {
		link : link,
		scope : {
			ppgPlay : "="
		}
	}
});
