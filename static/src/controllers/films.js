angular.module('ppgmaker').
controller("FilmsController",function($scope,$element,$interval,$q,dialogService,sceneService) {
	$scope.films = [];

	function init() {
		sceneService.allFilms().then(films=>{
			$scope.films = films;
		});
	}

	$scope.delete = function(film) {
		dialogService.
			confirmRemove(film.name).
			then(res=>res?film.drop() : true).
			then(res=>init()).
			catch(err=>{
				console.warn(err);
			});
	}

	$scope.rename = function(film) {
		dialogService.
			renameItem(film.name).
			then(name=>film.name=name).
			then(res=>film.save()).
			then(res=>init()).
			catch(err=>{
				console.warn(err);
			});
	}

	init();
});
