angular.module('ppgmaker').directive("ppgRecord",function($interval){
	var uid = 0;
	var items = {};

	function recordItems() {
		requestAnimationFrame(recordItems);
		for(var id in items) {
			var item = items[id];
			var record = item.scope.$eval("record");
			if(item.scope.record) {
				var pos = item.element.position();
				item.buffer.push(pos);
			}
		}
	}

	function link(scope, element, attrs) {
		var id = "drag_"+(uid++);
		var buffer = scope.$eval(attrs.ppgRecord);

		if(!buffer) buffer = [];

		scope.$on("$destroy",function(){
			delete elems[id];
		});

		items[id] = {
			scope:scope,
			element:element,
			buffer:buffer
		};
	}

	requestAnimationFrame(recordItems);
	return {
		link : link,
	}
});
