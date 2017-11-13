angular.module('ppgmaker', []).config(function () {
	console.log("App started!");
}).controller("MainController",function($scope){

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

	$scope.toggleRecord = function() {
		$scope.record = !$scope.record;
	}

	$scope.togglePlay = function() {
		$scope.play = $scope.play? 0 : -1;
	}

});
