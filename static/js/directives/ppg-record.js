angular.module('ppgmaker').directive("ppgRecord",function($interval,styleService){
	var uid = 0;
	var items = {};

	function diff(prev,next) {
		if(!prev) return next;

		var map = new Set();
		var ret = {};

		Object.keys(prev).forEach(k=>map.add(k));
		Object.keys(next).forEach(k=>map.add(k));
		Array.from(map).forEach(k=>{
			let pk = prev[k], nk = next[k];
			if(	(pk===undefined && nk!==undefined) ||
					(pk!==undefined && nk!==undefined && pk!=nk) ) {
				ret[k] = nk;
			}
		});
		return ret;
	}

	function recordItems() {
		requestAnimationFrame(recordItems);
		for(var id in items) {
			var item = items[id];
			var record = item.scope.$eval("record");
			if(record) {
				var next = styleService.get(item.element);
				var prev = item.buffer[item.buffer.length-1] || undefined;
				item.buffer.push(diff(prev,next));
			}
		}
	}

	function link(scope, element, attrs) {
		var id = "drag_"+(uid++);
		var buffer = scope.$eval(attrs.ppgRecord);

		if(!buffer) buffer = [];
		if(buffer.length)
			$(element).css(buffer[0]);

		scope.$on("$destroy",function(){
			delete items[id];
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
