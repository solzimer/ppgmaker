angular.module('ppgmaker').directive("ppgFlip",function(styleService) {

	function handleTap(ev) {
		var elem = $(ev.target);
		elem.toggleClass("flip");

		setTimeout(()=>{
			let flip = elem.css("transform");
			styleService.set(elem,{transform:flip});
		},200);
	}

	function link(scope,elem,attrs) {
		var mc = new Hammer(elem[0]);
		mc.on("tap", handleTap);
	}

	return {
		link : link
	}
});
