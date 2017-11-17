angular.module('ppgmaker', ['ui.bootstrap']).config(function() {
	console.log("App started!");
}).controller("MainController",function($scope,itemsService){

	$scope.record = false;
	$scope.play = -1;

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
	}

	$scope.addItem = function(item) {
		$scope.scene.items.push({
			src : item.src,
			buffer : []
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
