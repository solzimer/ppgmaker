angular.module('ppgmaker', ['ui.bootstrap']).config(function() {
	console.log("App started!");
}).controller("MainController",function($scope,$interval,itemsService,sceneService){
	debugger;
	var MAX = 5;
	var MAX_TIME = 30000;
	var recordTimeout = null;

	$scope.addDisabled = false;
	$scope.record = false;
	$scope.play = -1;
	$scope.time = 0;

	$scope.scene = {
		background : {
			src : "/img/bg/bg003.jpg"
		},
		items : [
			{src:"/img/bubbles/bubbles001.png",buffer:[]},
		]
	}

	function init() {
		itemsService.get().then(function(items){
			$scope.allitems = items;
			console.log(items);
		});

		$scope.$watchCollection("scene.items",function(items){
			$scope.addDisabled = items.length>=MAX;
		});
	}

	function resetBuffers() {
		$scope.scene.items.forEach(function(item){
			item.buffer.splice(0,item.buffer.length);
		});
	}

	function startRecord() {
		resetBuffers();
		$scope.time = 0;
		var ti = Date.now();
		recordTimeout = $interval(function(){
			var tn = Date.now() - ti;
			$scope.time = tn*100/MAX_TIME;
			if(tn>=MAX_TIME) stopRecord();
		},1000);
	}

	function stopRecord() {
		$scope.record = false;
		$interval.cancel(recordTimeout);
	}

	$scope.addItem = function(item) {
		if(!$scope.addDisabled)
			$scope.scene.items.push({src : item.src, buffer : []});
	}

	$scope.toggleRecord = function() {
		$scope.record = !$scope.record;

		if($scope.record)	startRecord();
		else stopRecord()
	}

	$scope.togglePlay = function() {
		$scope.play = $scope.play? 0 : -1;
	}

	init();
});
