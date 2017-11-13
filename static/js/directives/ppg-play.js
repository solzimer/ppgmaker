angular.module('ppgmaker').directive("ppgPlay",function($q) {
	var items = {};

	function animate() {
		requestAnimationFrame(function(){
			for(key in items) {
				var item = items[key];
				if(item.frame>=0) {
					var pos = item.item.buffer[item.frame];
					if(pos) {
						$(item.elem).css(pos);
						item.frame++;
					}
					else {
						item.frame = -1;
					}
				}
			}
			animate();
		});
	}

	function link(scope,element,attrs) {
		scope.$watch("ppgPlay",function(frame) {
			var elems = document.querySelectorAll("[ppg-record]",element);
			elems.forEach(function(el){
				el = angular.element(el);
				if(!el.attr("id")) el.attr("id","ppgplay_"+Math.random());
				var id = el.attr("id");
				var item = el.scope()[el.attr("ppg-record")];
				items[id] = {frame:frame, elem:el, item:item}
			});
		});

		$scope.$on("$destroy",function(){
			var elems = document.querySelectorAll("[ppg-record]",element);
			elems.forEach(function(el){
				el = angular.element(el);
				if(!el.attr("id")) el.attr("id","ppgplay_"+Math.random());
				var id = el.attr("id");
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
