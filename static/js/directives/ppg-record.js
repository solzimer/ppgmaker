angular.module('ppgmaker').directive("ppgRecord",function($interval){
	var uid = 0;
	var items = {};
	var now = Date.now();

	function recordItems() {
		requestAnimationFrame(function(){
			for(var id in items) {
				var item = items[id];
				if(item.scope.record) {
					var pos = item.element.position();
					item.buffer.push(pos);
				}
			}
			recordItems();
		});
	}

	function link(scope, element, attrs) {
		var id = "drag_"+(uid++);
		var drg = $(element).draggable();
		var initPos = $(element).position();
		var buffer = scope.ppgRecord;

		if(!buffer) buffer = [];

		scope.$on("$destroy",function(){
			delete elems[id];
			drg.destroy();
		});

		items[id] = {
			scope:scope,
			element:element,
			buffer:buffer
		};
	}

	recordItems();
	return {
		link : link,
		scope : {
			"ppgRecord" : "=",
			"record" : "="
		}
	}
});
