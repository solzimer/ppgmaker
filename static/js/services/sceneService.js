angular.module("ppgmaker").service("sceneService",function(){
	var self = this;
	var filmCol, sceneCol;

	this.model = {};

	function del(id) {
		return {_id:id,_deleted:true}
	}

	class Scene {
		constructor(props) {
			props = props || {};
			this._id = props._id || "scene_"+Date.now();
			this._rev = props._rev;
			this.name = props.name || "";
			this.frames = props.frames || 0;
			this.background = props.background || "";
			this.items = props.items || [];
			this.idfilm = props.idfilm || "";
			this.screenshot = props.screenshot || "";
		}

		save() {
			return sceneCol.put(this).then(res=>this);
		}

		remove() {
			filmCol.
				get(this.idfilm).
				then(film=>{
					let idx = film.idscenes.indexOf(this._id);
					if(idx>=0) {
						film.idscenes.splice(idx,1);
						return filmCol.put(film);
					}
					else {
						return film;
					}
				}).
				then(film=>sceneCol.remove(this)).
				then(res=>this);
		}
	}

	class Film {
		constructor(props) {
			props = props || {};
			this._id = props._id || "film_"+Date.now();
			this._rev = props._rev;
			this.name = props.name || "";
			this.idscenes = props.idscenes || [];
		}

		add(scene) {
			scene = scene || {};
			scene.idfilm = this._id;
			if(!scene._id) scene = new Scene(scene);

			return scene.save().then(scene=>{
				this.idscenes.push(scene._id);
				return this.save();
			}).then(res=>scene);
		}

		save() {
			return filmCol.put(this).then(res=>this);
		}

		remove() {
			sceneCol.
				bulkDocs(this.idscenes.map(del)).
				then(res=>filmCol.remove(this)).
				then(res=>this);
		}
	}

	function init() {
		filmCol = new PouchDB('ppgmaker_films');
		sceneCol = new PouchDB('ppgmaker_scenes');
	}

	this.newFilm = function(film) {
		return new Film(film);
	}

	this.getFilm = function(id) {
		return filmCol.get(id);
	}

	this.findFilm = function(query) {
		return filmCol.
			createIndex({index: {fields: ['name']}}).
			then(res => filmCol.find({selector: query})).
			then(res => res.docs[0]).
			then(film => film? new Film(film) : null);
	}

	this.newScene = function(film,scene) {
		scene = scene || {};
		scene.idfilm = film.id;
		return new Scene(scene);
	}

	init();
});
