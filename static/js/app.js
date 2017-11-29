angular.module('ppgmaker', ['ui.bootstrap','ui.router']).config(function($stateProvider,$urlRouterProvider) {
  $stateProvider.state("home",{
		url: '/home',
	  template: '<h3>hello world!</h3>'
	});

  $stateProvider.state("scene",{
		url: '/scene',
		controller : 'SceneController',
	  templateUrl: '/views/scene.html'
	});

	$urlRouterProvider.otherwise("/scene");
	
	console.log("App started!");

});
