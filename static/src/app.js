angular.module('ppgmaker', ['ui.bootstrap','ui.router']).
config(function($stateProvider,$urlRouterProvider,templateProvider) {

  $stateProvider.state("home",{
		url: '/home',
	  template: '<h3>hello world!</h3>'
	});

	$stateProvider.state("films",{
		url: '/films',
		controller : 'FilmsController',
	  template: templateProvider.films
	});

  $stateProvider.state("film",{
		url: '/film/:id',
		controller : 'SceneController',
	  template: templateProvider.scene
	});

	$stateProvider.state("player",{
		url: '/player/:id',
		controller : 'PlayerController',
	  template: templateProvider.player
	});

	$urlRouterProvider.otherwise("/films");

	console.log("App started!");

});
