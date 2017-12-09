angular.module('ppgmaker', ['ui.bootstrap','ui.router']).
config(function($stateProvider,$urlRouterProvider) {
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

angular.module('ppgmaker').
controller("FilmsController",function($scope,$element,$interval,$q,sceneService){
	$scope.films = [];

	function init() {
		sceneService.allFilms().then(films=>{
			$scope.films = films;
		});
	}

	init();
});

angular.module('ppgmaker').
controller("SceneController",function($scope,$stateParams,$element,$interval,$q,itemsService,sceneService){
	var MAX = 5;
	var MAX_TIME = 30000;
	var recordTimeout = null;
	var elemScene = $(".scene",$element).get(0);
	var canvas = document.createElement("canvas");

	$scope.addDisabled = false;
	$scope.record = false;
	$scope.play = -1;
	$scope.time = 0;
	$scope.film = null;
	$scope.scene = null;

	function init() {
		itemsService.get().then(items=>{
			$scope.allitems = items;
			console.log(items);
		});

		$scope.$watchCollection("scene.items",items=>{
			$scope.addDisabled = !items || items.length>=MAX;
		});

		sceneService.findFilm({_id:$stateParams.id}).then(film=>{
			if(!film) return sceneService.newFilm({name:"testppg"}).save();
			else return film;
		}).then(film=>{
			$scope.film = film;
		}).catch(err=>{
			console.error(err);
		});

		setupBars();
	}

	function setupBars() {
		let mc = new Hammer($element[0]);
		mc.on("tap",evt=>{
			let frame = $(evt.target).closest(".frame-bottom");
			if(frame.length) {
				if(frame.is(".hide-down"))
					frame.removeClass("hide-down");
			}
			else {
				$(".frame-bottom",$element).each((i,el)=>{
					if(!$(el).is((".hide-down")))
						$(el).addClass("hide-down");
				});
			}
		});
	}

	function resizeImage(img) {
		var ctx = canvas.getContext('2d');
		canvas.height = 100;
		canvas.width = img.width*canvas.height/img.height;
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL();
	}

	function resetBuffers() {
		$scope.scene.items.forEach(item => {
			item.buffer.splice(0,item.buffer.length);
		});
	}

	function startRecord() {
		resetBuffers();
		$scope.time = 0;
		var ti = Date.now();
		recordTimeout = $interval(()=>{
			var tn = Date.now() - ti;
			$scope.time = tn*100/MAX_TIME;
			if(tn>=MAX_TIME) stopRecord();
		},1000);
	}

	function stopRecord() {
		$scope.record = false;
		$interval.cancel(recordTimeout);

		return $q(res=>html2canvas(elemScene,{onrendered:res})).
			then(canvas=>resizeImage(canvas)).
			then(img=>$scope.scene.screenshot=img).
			then(()=>$scope.scene.save()).
			then(()=>$scope.film.update($scope.scene,true)).
			catch(err=>console.log(err.message));
	}

	$scope.newScene = function() {
		$scope.film.add({name:"New Scene"}).
			then(scene=>$scope.scene = scene);
	}

	$scope.setBackground = function(item) {
		if(!$scope.record)
			$scope.scene.background = item;
	}

	$scope.addItem = function(item) {
		if(!$scope.addDisabled) {
			item = JSON.parse(JSON.stringify(item));
			$scope.scene.items.push(item);
		}
	}

	$scope.toggleRecord = function() {
		$scope.record = !$scope.record;

		if($scope.record)	startRecord();
		else stopRecord()
	}

	$scope.togglePlay = function() {
		$scope.play = $scope.play? 0 : -1;
	}

	$scope.selectScene = function(scene) {
		scene.fetch().then(res=>$scope.scene = res);
	}

	$scope.backScene = function() {
		stopRecord().then(()=>{
			$scope.play = -1;
			$scope.scene = null;
		});
	}

	init();
});

angular.module('ppgmaker').directive("ppgCarousel",function($timeout,styleService){
	var uid = 0;

	function link(scope, element, attrs) {
		scope.$watchCollection(()=>{
			return scope.$eval(element.attr("ppg-carousel"));
		},items=>{
			if(items && items.length) {
				$timeout(()=>{
					$(element).slick({
						mobileFirst : true,
						arrows: false,
						slidesToScroll: 5,
						variableWidth: true,
						infinite: false
					});
				},10);
			}
		});

		scope.$on("destroy",()=>{
			$(element).slick('unslick');
		})
	}

	return {
		link : link,
	}
});

angular.module('ppgmaker').directive("ppgDraggable",function(styleService) {
	var DRG = "hammer_drag";

	function handleDrag(ev) {
		var elem = $(ev.target);

		if (!elem.data(DRG)) {
			elem.data(DRG,elem.position());
		}

		var oldPos = elem.data(DRG);
		var posX = ev.deltaX + oldPos.left;
		var posY = ev.deltaY + oldPos.top;
		var newPos = {left:posX,top:posY};

		elem.css(newPos);
		styleService.set(elem,newPos);

		if (ev.isFinal) {
			elem.data(DRG,null);
		}
	}

	function link(scope,elem,attrs) {
		var mc = new Hammer(elem[0]);
		mc.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );
		mc.on("pan", handleDrag);
	}

	return {
		link : link
	}
});

angular.module('ppgmaker').directive("ppgEffects",function(styleService){
	var max = 360;
	var frame = 0;
	var uid = 0;
	var items = {};
	var frames = [];

	function init() {
		for(var i=0;i<max;i++) {
			frames[i] = Math.sin(i*Math.PI/180) - 0.5;
		}

		frames.push(frames[0]);
		for(var i=0;i<max;i++) {
			frames[i] = frames[(i+1)%(max+1)] - frames[i];
		}
		frames.pop();
	}

	function applyEffects() {
		requestAnimationFrame(applyEffects);
		for(var id in items) {
			var item = items[id];
			var play = item.scope.$eval("play");
			if(play<0) {
				var elem = $(item.element.get(0));
				var pos = elem.position();
				pos.top += frames[(frame+item.initial)%max]*10;
				elem.css(pos);
				styleService.set(elem,pos);
			}
		}
		frame = (frame+5) % max;
	}

	function link(scope, element, attrs) {
		var id = "drag_"+(uid++);

		scope.$on("$destroy",function(){
			delete items[id];
		});

		items[id] = {
			initial:Math.floor(Math.random()*max),
			scope:scope,
			element:element,
		};
	}

	init();
	requestAnimationFrame(applyEffects);
	return {
		link : link,
	}
});

angular.module('ppgmaker').directive("ppgFlip",function(styleService) {
	const CLASS = "ppg-flip-style";

	function handleTap(ev) {
		var elem = $(ev.target);
		elem.toggleClass(CLASS);

		let flip = elem.is(`.${CLASS}`)? "scaleX(-1)" : "none";
		let tr = {transform:flip};
		styleService.set(elem,tr);
		elem.css(tr);
	}

	function link(scope,elem,attrs) {
		var mc = new Hammer(elem[0]);
		mc.on("tap", handleTap);
	}

	return {
		link : link
	}
});

angular.module('ppgmaker').directive("ppgPlay",function(styleService) {
	var items = {};

	function animate() {
		requestAnimationFrame(animate);
		for(key in items) {
			var item = items[key];
			if(item.frame>=0) {
				var style = item.buffer[item.frame];
				if(style) {
					$(item.elem).css(style);
					item.frame++;
				}
				else {
					item.frame = -1;
				}
			}
		}
	}

	function getId(el) {
		if(!el.attr("id")) el.attr("id","ppgplay_"+(uid++));
		return el.attr("id");
	}

	function link(scope,element,attrs) {
		scope.$watch("ppgPlay",function(frame) {
			var elems = document.querySelectorAll("[ppg-record]",element);
			elems.forEach(function(el){
				el = angular.element(el);
				var id = styleService.id(el);
				var buffer = el.scope().$eval(el.attr("ppg-record"));
				items[id] = {frame:frame, elem:el, buffer:buffer}
			});
		});

		scope.$on("$destroy",function(){
			var elems = document.querySelectorAll("[ppg-record]",element);
			elems.forEach(function(el){
				el = angular.element(el);
				var id = styleService.id(el);
				delete items[id];
			});
		});
	}

	requestAnimationFrame(animate);
	return {
		link : link,
		scope : {
			ppgPlay : "="
		}
	}
});

angular.module('ppgmaker').directive("ppgRecord",function($interval,styleService){
	var uid = 0;
	var items = {};

	function diff(prev,next) {
		if(!prev) return next;

		var map = new Set();
		var ret = {};

		Object.keys(prev).forEach(k=>map.add(k));
		Object.keys(next).forEach(k=>map.add(k));
		Array.from(map).forEach(k=>{
			let pk = prev[k], nk = next[k];
			if(	(pk===undefined && nk!==undefined) ||
					(pk!==undefined && nk!==undefined && pk!=nk) ) {
				ret[k] = nk;
			}
		});
		return ret;
	}

	function recordItems() {
		requestAnimationFrame(recordItems);
		for(var id in items) {
			var item = items[id];
			var record = item.scope.$eval("record");
			if(record) {
				var next = styleService.get(item.element);
				var prev = item.buffer[item.buffer.length-1] || undefined;
				item.buffer.push(diff(prev,next));
			}
		}
	}

	function link(scope, element, attrs) {
		var id = "drag_"+(uid++);
		var buffer = scope.$eval(attrs.ppgRecord);

		if(!buffer) buffer = [];
		if(buffer.length)
			$(element).css(buffer[0]);

		scope.$on("$destroy",function(){
			delete items[id];
		});

		items[id] = {
			scope:scope,
			element:element,
			buffer:buffer
		};
	}

	requestAnimationFrame(recordItems);
	return {
		link : link,
	}
});

angular.module('ppgmaker').directive("ppgResizable",function(styleService) {
	var DRG = "hammer_drag";

	function handleDrag(ev) {
		var elem = $(ev.target);

		if (!elem.data(DRG)) {
			elem.data(DRG,elem.position());
		}

		var oldPos = elem.data(DRG);
		var posX = ev.deltaX + oldPos.left;
		var posY = ev.deltaY + oldPos.top;
		var newPos = {left:posX,top:posY};

		elem.css(newPos);
		styleService.set(elem,newPos);

		if (ev.isFinal) {
			elem.data(DRG,null);
		}
	}

	function link(scope,elem,attrs) {
		var mc = new Hammer(elem[0]);
		mc.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );
		mc.on("pan", handleDrag);
	}

	return {
		link : link
	}
});

angular.module("ppgmaker").
filter("imgsrc",function(){
	return function(input,size) {
		let src = input.src;
		if(input[size]) {
			let path = src.split("/");
			let file = path.pop();
			path.push(input[size]);
			path.push(file);
			return path.join("/");
		}
		else {
			return input.src;
		}
	}
});

angular.module("ppgmaker").service("itemsService",function($http){
	var prModel = false;
	var self = this;

	this.model = {};

	this.get = function() {
		if(!prModel) {
			prModel = $http.
				get("/data/allitems.json").
				then(function(res){
					angular.extend(self.model,res.data);
					return self.model;
				});
		}
		return prModel;
	}
});

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
				this.items = props.items || [];
				this.idfilm = props.idfilm || "";
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
					then(()=>this.find(scene).extend(scene,true)).
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

angular.module("ppgmaker").service("styleService",function(){
	var self = this;
	var uid = 0;

	this.model = {};

	function elemId(elem) {
		if(typeof(elem)=="string") return elem;
		else {
			elem = $(elem);
			if(!elem.attr("id"))
				elem.attr("id","_ppgm_"+(uid++));
			return elem.attr("id");
		}
	}

	this.id = function(elem) {
		return elemId(elem);
	}

	this.get = function(id) {
		id = elemId(id);
		return angular.extend({},this.model[id] || {});
	}

	this.set = function(id,props) {
		id = elemId(id);
		if(!this.model[id]) this.model[id] = {};
		angular.extend(this.model[id],props);
	}

	this.unset = function(id,props) {
		id = elemId(id);
		if(this.model[id]) {
			var style = this.model[id];
			for(var i in props) {
				delete style[i];
			}
		}
	}

	this.remove = function(id) {
		id = elemId(id);
		delete this.model[id];
	}
});

//# sourceMappingURL=app.es6.js.map