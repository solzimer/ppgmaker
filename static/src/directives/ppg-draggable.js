angular.module('ppgmaker').directive("ppgDraggable",function(styleService) {
	const DRG = "hammer_drag";

	function isOutside(elem,dx,dy) {
		let box = elem[0].getBoundingClientRect();
		let ww = window.innerWidth, wh = window.innerHeight;
		if(box.x<0 && dx<0) return true;
		else if(box.y<0 && dy<0) return true;
		else if((box.x+box.width)>ww && dx>0) return true;
		else if((box.y+box.height)>wh && dy>0) return true;
		else return false;
	}

	function handleDrag(ev,scope) {
		var elem = $(ev.target);

		if (!elem.data(DRG)) {
			elem.data(DRG,elem.position());
		}

		if(!isOutside(elem,ev.deltaX,ev.deltaY)) {
			var oldPos = elem.data(DRG);
			var posX = ev.deltaX + oldPos.left;
			var posY = ev.deltaY + oldPos.top;
			var newPos = {left:posX,top:posY};
			elem.css(newPos);
			styleService.set(elem,newPos);
		}

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
