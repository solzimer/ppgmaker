angular.module('ppgmaker').directive("ppgDraggable",function(styleService) {
	var DRG = "hammer_drag";

	function handleDrag(ev,scope) {
		var elem = $(ev.target);

		if (!elem.data(DRG)) {
			elem.data(DRG,elem.position());
		}

		var oldPos = elem.data(DRG);
		var posX = ev.deltaX + oldPos.left;
		var posY = ev.deltaY + oldPos.top;
		var newPos = {left:posX,top:posY};

		elem.css(newPos);
		styleService.set(elem,newPos);

		if (ev.isFinal) {
			elem.data(DRG,null);
			scope.$eval(elem.attr("on-ppg-drop"))(elem.attr("id"));
			scope.$apply();
		}
	}

	function link(scope,elem,attrs) {
		var mc = new Hammer(elem[0]);
		mc.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );
		mc.on("pan",ev=>handleDrag(ev,scope));
	}

	return {
		link : link
	}
});
