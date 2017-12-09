angular.module('ppgmaker').directive("ppgPlay",function(styleService) {
	var items = {};

	function animate() {
		requestAnimationFrame(animate);
		for(key in items) {
			var item = items[key];
			if(item.frame>=0) {
				var style = item.buffer[item.frame];
				if(style) {
					$(item.elem).css(style);
					item.frame++;
				}
				else {
					item.frame = -1;
				}
			}
		}
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
				var id = styleService.id(el);
				var buffer = el.scope().$eval(el.attr("ppg-record"));
				items[id] = {frame:frame, elem:el, buffer:buffer}
			});
		});

		scope.$on("$destroy",function(){
			var elems = document.querySelectorAll("[ppg-record]",element);
			elems.forEach(function(el){
				el = angular.element(el);
				var id = styleService.id(el);
				delete items[id];
			});
		});
	}

	requestAnimationFrame(animate);
	return {
		link : link,
		scope : {
			ppgPlay : "="
		}
	}
});
