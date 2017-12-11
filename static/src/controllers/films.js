angular.module('ppgmaker').
controller("FilmsController",function($scope,$element,$interval,$q,sceneService){
	$scope.films = [];

	function init() {
		sceneService.allFilms().then(films=>{
			$scope.films = films;
		});
	}

	init();
});
