angular.module('ppgmaker', ['ui.bootstrap','ui.router']).config(function($stateProvider,$urlRouterProvider) {
  $stateProvider.state("home",{
		url: '/home',
	  template: '<h3>hello world!</h3>'
	});

	$stateProvider.state("films",{
		url: '/films',
		controller : 'FilmsController',
	  templateUrl: '/views/films.html'
	});

  $stateProvider.state("scene",{
		url: '/scene/:id',
		controller : 'SceneController',
	  templateUrl: '/views/scene.html'
	});

	$urlRouterProvider.otherwise("/films");

	console.log("App started!");

});
