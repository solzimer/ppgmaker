angular.module('ppgmaker').
controller("SceneController",function($scope,$q,$stateParams,$element,$interval,screenshotService,styleService,itemsService,sceneService){
	var MAX = 5;
	var MAX_TIME = 30000;
	var recordTimeout = null;
	var elemScene = $(".scene",$element).get(0);

	$scope.addDisabled = false;
	$scope.record = false;
	$scope.play = -1;
	$scope.time = 0;
	$scope.film = null;
	$scope.scene = null;

	function init() {
		itemsService.get().then(items=>{
			$scope.allitems = items;
			console.log(items);
		});

		$scope.$watchCollection("scene.items",items=>{
			$scope.addDisabled = !items || items.length>=MAX;
		});

		sceneService.findFilm({_id:$stateParams.id}).then(film=>{
			if(!film) return sceneService.newFilm({name:"testppg"}).save();
			else return film;
		}).then(film=>{
			$scope.film = film;
		}).catch(err=>{
			console.error(err);
		});

		setupBars();
	}

	function setupBars() {
		let mc = new Hammer($element[0]);
		mc.on("tap",evt=>{
			let frame = $(evt.target).closest(".frame-bottom");
			if(frame.length) {
				if(frame.is(".hide-down"))
					frame.removeClass("hide-down");
			}
			else {
				$(".frame-bottom",$element).each((i,el)=>{
					if(!$(el).is((".hide-down")))
						$(el).addClass("hide-down");
				});
			}
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

		return screenshotService.take(elemScene,100,100).
			then(img=>$scope.scene.screenshot=img).
			then(()=>$scope.scene.save()).
			then(()=>$scope.film.update($scope.scene,true)).
			catch(err=>console.error(err));
	}

	$scope.newScene = function() {
		$scope.film.add({name:"New Scene"}).
			then(scene=>$scope.scene = scene);
	}

	$scope.setBackground = function(item) {
		if(!$scope.record)
			$scope.scene.background = item;
	}

	$scope.addItem = function(item) {
		if(!$scope.addDisabled) {
			item = JSON.parse(JSON.stringify(item));
			item.eid = `ppgm_item_${Date.now()}`;
			$scope.scene.items.push(item);
		}
	}

	$scope.overlaps = function(eid) {
		if(eid!=$scope.overlapItem) {
			$scope.overlapItem = eid;
		}
	}

	$scope.itemDropped = function(eid) {
		let eitem = $scope.overlapItem;
		if(eitem && eid==eitem) {
			let idx = $scope.scene.items.findIndex(item=>item.eid==eid);
			if(idx>=0) {
				$scope.overlapItem = null;
				$scope.scene.items.splice(idx,1);
				styleService.remove(eid);
			}
		}
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
		scene.fetch().then(res=>$scope.scene = res);
	}

	$scope.backScene = function() {
		stopRecord().then(()=>{
			$scope.play = -1;
			$scope.scene = null;
			styleService.clean();
		});
	}

	init();
});
