angular.module('ppgmaker').directive("ppgRecord",function($interval,styleService){
	var uid = 0;
	var items = {};

	function recordItems() {
		requestAnimationFrame(recordItems);
		for(var id in items) {
			var item = items[id];
			var record = item.scope.$eval("record");
			if(record) {
				var style = styleService.get(item.element);
				item.buffer.push(style);
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
