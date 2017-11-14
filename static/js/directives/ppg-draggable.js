angular.module('ppgmaker').directive("ppgDraggable",function($q) {
	var PPGDR = "ppg-dragging";

	function handleDrag(ev) {
		if(ev.srcEvent.type=='pointercancel') return;

		var elem = $(ev.target);

		if(!elem.data(PPGDR)) {
			elem.data(PPGDR,$(elem).position());
		}

		var pos = elem.data(PPGDR);
		var posX = ev.deltaX + pos.left;
		var posY = ev.deltaY + pos.top;
		$(elem).css({'left':posX,'top':posY});

		if(ev.isFinal) {
			elem.data(PPGDR,null);
		}
	}

	function link(scope,elem,attrs) {
		var mc = new Hammer(elem[0]);
		mc.get("pan").set({direction:Hammer.DIRECTION_ALL, threshold:0});
		mc.on("pan", handleDrag);
	}

	return {
		link : link
	}
});
