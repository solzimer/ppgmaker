angular.module("ppgmaker").service("sceneService",function($q,$http){
	var self = this;
	var fdb = new ForerunnerDB();
	var db = null;
	var filmCol, sceneCol;

	this.model = {};

	function init() {
		db = fdb.db("ppgmaker");
		filmCol = db.collection("films");
		sceneCol = db.collection("scenes");
	}

	this.newFilm = function(film) {
		return filmCol.newDocument(film);
	}

	this.newScene = function(film,scene) {
		scene.film = film.id;
		return sceneCol.newDocument(scene);
	}

	init();
});
