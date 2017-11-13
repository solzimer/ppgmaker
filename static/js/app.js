angular.module('ppgmaker', []).config(function () {
	console.log("App started!");
}).controller("MainController",function($scope){

	$scope.record = false;
	$scope.play = -1;

	$scope.items = [
		{src:"/img/bliss001.png",buffer:[]},
		{src:"/img/bliss002.png",buffer:[]},
	]

	$scope.toggleRecord = function() {
		$scope.record = !$scope.record;
	}

	$scope.togglePlay = function() {
		$scope.play = $scope.play? 0 : -1;
	}

});
