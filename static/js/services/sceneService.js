angular.module("ppgmaker").service("sceneService",function(){
	var self = this;
	var filmCol, sceneCol;

	this.model = {};

	function del(id) {
		return {_id:id,_deleted:true}
	}

	class Scene {
		constructor(props,mini) {
			props = props || {};
			this._id = props._id || "scene_"+Date.now();
			this._rev = props._rev;
			this.name = props.name || "";
			this.frames = props.frames || 0;
			this.background = props.background || "";

			if(!mini) {
				this.items = props.items || [];
				this.idfilm = props.idfilm || "";
				this.screenshot = props.screenshot || "";
			}
		}

		mini() {
			return new Scene(this,true);
		}

		fetch() {
			return sceneCol.get(this._id).then(res=>new Scene(res));
		}

		save() {
			return sceneCol.put(this).then(res=>this);
		}

		remove() {
			return sceneCol.remove(this).then(res=>this);
		}
	}

	class Film {
		constructor(props) {
			props = props || {};
			this._id = props._id || "film_"+Date.now();
			this._rev = props._rev;
			this.name = props.name || "";
			this.scenes = (props.scenes || []).map(scn=>(new Scene(scn)).mini());
		}

		add(scene) {
			scene = scene || {};
			scene.idfilm = this._id;
			if(!scene._id) scene = new Scene(scene);

			return scene.save().then(scene=>{
				this.scenes.push(scene.mini());
				return this.save();
			}).then(res=>scene);
		}

		remove(scene) {
			return scene.remove().then(scene=>{
				let idx = this.scenes.findIndex(scn=>scn._id==scene._id);
				this.scenes.splice(idx,1);
				return this.save();
			}).then(res=>scene);
		}

		save() {
			this.scenes = this.scenes.map(scn=>scn.mini());
			return filmCol.put(this).then(res=>this);
		}

		drop() {
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
		return filmCol.get(id).then(film=>new Film(film));
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