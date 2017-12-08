angular.module('ppgmaker').directive("ppgFlip",function(styleService) {
	const CLASS = "ppg-flip-style";

	function handleTap(ev) {
		var elem = $(ev.target);
		elem.toggleClass(CLASS);

		let flip = elem.is(`.${CLASS}`)? "scaleX(-1)" : "none";
		let tr = {transform:flip};
		styleService.set(elem,tr);
		elem.css(tr);
	}

	function link(scope,elem,attrs) {
		var mc = new Hammer(elem[0]);
		mc.on("tap", handleTap);
	}

	return {
		link : link
	}
});
