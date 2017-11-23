angular.module('ppgmaker', ['ui.bootstrap']).config(function() {
	console.log("App started!");
}).controller("MainController",function($scope,$interval,itemsService,sceneService){
	var MAX = 5;
	var MAX_TIME = 30000;
	var recordTimeout = null;

	$scope.addDisabled = false;
	$scope.record = false;
	$scope.play = -1;
	$scope.time = 0;
	$scope.scenes = [];
	$scope.scene = null

	function init() {
		itemsService.get().then(items=>{
			$scope.allitems = items;
			console.log(items);
		});

		$scope.$watchCollection("scene.items",items=>{
			$scope.addDisabled = !items || items.length>=MAX;
		});

		sceneService.findFilm({name:"testppg"}).then(film=>{
			if(!film) return sceneService.newFilm({name:"testppg"}).save();
			else return film;
		}).then(film=>{
			$scope.film = film;
			$scope.scenes = film.scenes;
			$scope.$apply();
		}).catch(err=>{
			console.error(err);
		});
	}

	function resetBuffers() {
		$scope.scene.items.forEach(item => {
			item.buffer.splice(0,item.buffer.length);
		});
	}

	function startRecord() {
		resetBuffers();
		$scope.time = 0;
		var ti = Date.now();
		recordTimeout = $interval(()=>{
			var tn = Date.now() - ti;
			$scope.time = tn*100/MAX_TIME;
			if(tn>=MAX_TIME) stopRecord();
		},1000);
	}

	function stopRecord() {
		$scope.record = false;
		$interval.cancel(recordTimeout);
		$scope.scene.
			save().
			then(()=>$scope.film.update($scope.scene,true)).
			then(()=>{
				console.log("SAVED!");
			});
	}

	$scope.newScene = function() {
		$scope.film.add({name:"New Scene"}).then(scene=>{
			$scope.scene = scene;
			$scope.$apply();
		});
	}

	$scope.addItem = function(item) {
		if(!$scope.addDisabled)
			$scope.scene.items.push({src:item.src, buffer:[]});
	}

	$scope.toggleRecord = function() {
		$scope.record = !$scope.record;

		if($scope.record)	startRecord();
		else stopRecord()
	}

	$scope.togglePlay = function() {
		$scope.play = $scope.play? 0 : -1;
	}

	$scope.selectScene = function(scene) {
		scene.fetch().then(res=>{
			$scope.scene = res;
			$scope.$apply();
		});
	}

	$scope.backScene = function() {
		$scope.play = -1;
		$scope.scene = null;
	}

	init();
});
