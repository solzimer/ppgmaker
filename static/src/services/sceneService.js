angular.module("ppgmaker").service("sceneService",function($q){
	var self = this;
	var filmCol, sceneCol;

	this.model = {};

	function q() {
		return $q.resolve($q);
	}

	function del(id) {
		return {_id:id,_deleted:true}
	}

	class Scene {
		constructor(props,mini) {
			this.extend(props,mini);
		}

		extend(props,mini) {
			props = props || {};
			this._id = props._id || "scene_"+Date.now();
			this._rev = props._rev;
			this.name = props.name || "";
			this.frames = props.frames || 0;
			this.background = props.background || "";
			this.screenshot = props.screenshot || "";

			if(!mini) {
				this.sound = props.sound || null;
				this.items = props.items || [];
				this.idfilm = props.idfilm || "";
			}

			if(this.items) {
				let now = Date.now();
				this.items.forEach(item=>{
					item.eid = item.eid || `ppgm_item_${now++}`;
				});
			}
		}

		mini() {
			return new Scene(this,true);
		}

		fetch() {
			return q().then(()=>sceneCol.get(this._id)).then(res=>new Scene(res));
		}

		save() {
			return q().then(()=>sceneCol.put(this)).then(res=>this);
		}

		remove() {
			return q().then(()=>sceneCol.remove(this)).then(res=>this);
		}
	}

	class Film {
		constructor(props) {
			props = props || {};
			this._id = props._id || "film_"+Date.now();
			this._rev = props._rev;
			this.name = props.name || "";
			this.scenes = (props.scenes || []).map(scn=>new Scene(scn,true));
		}

		find(scene) {
			let id = scene._id || scene;
			return q().then(()=>this.scenes.find(scn=>scn._id==id));
		}

		add(scene) {
			scene = scene || {};
			scene.idfilm = this._id;
			if(!scene._id) scene = new Scene(scene);

			return q().
				then(()=>scene.save()).
				then(scene=>{
					this.scenes.push(scene.mini());
					return this.save();
				}).
				then(res=>scene);
		}

		remove(scene) {
			return q().
				then(()=>scene.remove()).
				then(scene=>{
					let idx = this.scenes.findIndex(scn=>scn._id==scene._id);
					this.scenes.splice(idx,1);
					return this.save();
				}).
				then(res=>scene);
		}

		update(scene,save) {
			return q().
					then(()=>this.find(scene)).
					then(old=>old.extend(scene,true)).
					then(()=>{
						if(save) return this.save();
						else return this;
					});
		}

		save() {
			this.scenes = this.scenes.map(scn=>scn.mini());
			return q().then(()=>filmCol.put(this)).then(res=>this);
		}

		drop() {
			return q().
				then(()=>sceneCol.bulkDocs(this.idscenes.map(del))).
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

	this.allFilms = function() {
		return q().
			then(()=>filmCol.allDocs({include_docs: true})).
			then(list=>list.rows.map(elem=>elem.doc)).
			then(docs=>docs.filter(doc=>doc.name)).
			then(docs=>docs.map(doc=>new Film(doc)));
	}

	this.getFilm = function(id) {
		return q().
			then(()=>filmCol.get(id)).
			then(film=>new Film(film));
	}

	this.findFilm = function(query) {
		return q().
			then(()=>filmCol.createIndex({index: {fields: ['name']}})).
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
