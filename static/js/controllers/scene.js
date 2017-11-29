angular.module('ppgmaker').
controller("SceneController",function($scope,$element,$interval,$q,itemsService,sceneService){
	var MAX = 5;
	var MAX_TIME = 30000;
	var recordTimeout = null;
	var elemScene = $(".scene",$element).get(0);
	var canvas = document.createElement("canvas");

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

	function resizeImage(img) {
		var ctx = canvas.getContext('2d');
		canvas.height = 100;
		canvas.width = img.width*canvas.height/img.height;
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL();
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

		$q(res=>html2canvas(elemScene,{onrendered:res})).
			then(canvas=>resizeImage(canvas)).
			then(img=>$scope.scene.screenshot=img).
			then(()=>$scope.scene.save()).
			then(()=>$scope.film.update($scope.scene,true));
	}

	$scope.newScene = function() {
		$scope.film.add({name:"New Scene"}).then(scene=>{
			$scope.scene = scene;
			$scope.$apply();
		});
	}

	$scope.setBackground = function(item) {
		if(!$scope.addDisabled)
			$scope.scene.background = item;
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
