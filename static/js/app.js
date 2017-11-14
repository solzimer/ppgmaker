angular.module('ppgmaker', []).config(function() {
	console.log("App started!");
}).controller("MainController",function($scope,itemsService){

	$scope.record = false;
	$scope.play = -1;

	$scope.background = {
		src : "/img/bg/bg002.jpg"
	}

	$scope.items = [
		{src:"/img/bliss/bliss001.png",buffer:[]},
		{src:"/img/buttercup/buttercup004.png",buffer:[]},
		{src:"/img/bubbles/bubbles001.png",buffer:[]},
	]

	function init() {
		itemsService.get().then(function(items){
			$scope.allitems = items;
			console.log(items);
		});
	}

	$scope.toggleRecord = function() {
		$scope.record = !$scope.record;
	}

	$scope.togglePlay = function() {
		$scope.play = $scope.play? 0 : -1;
	}

	init();
});
