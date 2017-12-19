angular.module('ppgmaker').directive("ppgPlay",function(styleService) {
	var containers = {};

	function animate() {
		requestAnimationFrame(animate);
		Object.values(containers).forEach(data=>{
			let scope = data.scope, items = data.items;
			for(let key in items) {
				let item = items[key];
				if(item.frame>=0) {
					let style = item.buffer[item.frame];
					if(style) {
						$(item.elem).css(style);
						item.frame++;
					}
					else {
						item.frame = -1;
						scope.ppgPlay = -1;
						scope.$apply();
					}
				}
			}
		});
	}

	function getId(el) {
		if(!el.attr("id")) el.attr("id","ppgplay_"+(uid++));
		return el.attr("id");
	}

	function link(scope,element,attrs) {
		if(!element.attr("id")) {
			element.attr("id",`ppg-play-${Math.random()}`);
		}

		let eid = element.attr("id");
		containers[eid] = containers[eid] || {scope:scope,items:[]};
		let items = containers[eid].items;

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
			delete containers[eid];
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
