angular.module('ppgmaker').directive("ppgDraggable",function(styleService) {
	const
		DRG = "hammer_drag",
		BOX = "hammer_drag_box";

	function handleDrag(ev,scope) {
		var elem = $(ev.target);

		if (!elem.data(DRG)) {
			elem.data(DRG,elem.position());
			elem.data(BOX,elem[0].getBoundingClientRect());
		}

		var oldPos = elem.data(DRG);
		var box = elem.data(BOX);
		var posX = ev.deltaX + oldPos.left;
		var posY = ev.deltaY + oldPos.top;
		posX = Math.min(Math.max(0,posX),window.innerWidth-box.width);
		posY = Math.min(Math.max(0,posY),window.innerHeight-box.height);
		var newPos = {left:posX,top:posY};
		elem.css(newPos);
		styleService.set(elem,newPos);

		if (ev.isFinal) {
			elem.data(DRG,null);
			elem.data(BOX,null);
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
