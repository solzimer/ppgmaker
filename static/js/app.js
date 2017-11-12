angular.module('ppgmaker', []).config(function () {
	console.log("App started!");
}).controller("MainController",function($scope){

	$scope.items = [
		{buffer:[]},
		{buffer:[]},
	]
	$scope.record = false;

	$scope.toggleRecord = function() {
		$scope.record = !$scope.record;
	}

}).directive("ppgRecord",function(){
	var uid = 0;
	var items = {};
	var now = Date.now();

	setInterval(function(){
		var ts = Date.now() - now;
		for(var id in items) {
			var item = items[id];
			if(item.scope.record) {
				var pos = item.element.position();
				item.item.buffer.push({ts:ts,pos:pos});
			}
		}
	},100);

	function link(scope, element, attrs) {
		var id = "drag_"+(uid++);
		var drg = $(element).draggable();
		var initPos = $(element).position();
		var item = scope.ppgRecord;

		if(!item.buffer) item.buffer = [];

		drg.on("drag",function(event,ui){
			var buff = item.buffer;
			var pos = Math.max(buff.length-1,0);
			if(!scope.record)
				buff[pos] = {ts:0,pos:ui.position};
		});

		scope.$watch("record",function(record) {
			if(record) now = Date.now();
		})

		scope.$on("$destroy",function(){
			delete elems[id];
		});

		items[id] = {
			scope:scope,
			element:element,
			item:item
		};
	}

	return {
		link : link,
		scope : {
			"ppgRecord" : "=",
			"record" : "="
		}
	}
}).directive("ppgPlayabe",function() {
	function nextFrame(frame,items) {
		if(frame<0) return;

		items.filter(function(item) {
			return item.buffer && item.buffer[frame];
		}).forEach(function(){

		});
	}

	function link(scope,element,attrs) {
		// var tweens = [];
		// scope.$watch("play",function(play) {
		// 	if(play>=0) {
		// 		tweens = nextFrame(play,scope);
		// 	}
		// 	else {
		// 		stopAll(tweens);
		// 	}
		// });

    //
		// position = {x: 100, y: 100, rotation: 0};
		// 				target = document.getElementById('target');
		// 				tween = new TWEEN.Tween(position)
		// 					.to({x: 700, y: 200, rotation: 359}, 2000)
		// 					.delay(1000)
		// 					.easing(TWEEN.Easing.Elastic.InOut)
		// 					.onUpdate(update);
		// 				tweenBack = new TWEEN.Tween(position)
		// 					.to({x: 100, y: 100, rotation: 0}, 3000)
		// 					.easing(TWEEN.Easing.Elastic.InOut)
		// 					.onUpdate(update);
		// 				tween.chain(tweenBack);
		// 				tweenBack.chain(tween);
		// 				tween.start();
	}
});
