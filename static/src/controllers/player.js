angular.module('ppgmaker').
controller("PlayerController",function($scope,$stateParams,$state,$timeout,sceneService){
	var idx = 0;
	var watch = null;

	$scope.play = -1;
	$scope.film = null;
	$scope.scene = null;

	function init() {
		sceneService.getFilm($stateParams.id).then(film=>{
			$scope.film = film;
			play(true);
		}).catch(err=>{
			console.error(err);
		});
	}

	function makeWatch() {
		return $scope.$watch("play",(val,old)=>{
			if(val!=old && val==-1) {
				idx++;
				play();
			}
		});
	}

	function play(start) {
		if(start) {
			if(watch) watch();
			else watch = makeWatch();
		}

		let scene = $scope.film.scenes[idx];
		if(!scene) return stop();
		else return scene.fetch().
			then(res=>$scope.scene = res).
			then(res=>new Promise(resolve=>$timeout(resolve,10))).
			then(res=>$scope.play = 0).
			catch(err=>{
				console.error(err);
			});
	}

	function stop() {
		if(watch) watch();
		idx = 0;
		$scope.play = -1;
	}

	init();
});
