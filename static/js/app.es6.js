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
controller("PlayerController",function($scope,$stateParams,$state,$timeout,sceneService){
	var idx = 0;
	var watch = null;

	$scope.play = -1;
	$scope.film = null;
	$scope.scene = null;

	function init() {
		sceneService.getFilm($stateParams.id).then(film=>{
			$scope.film = film;
			play(true);
		}).catch(err=>{
			console.error(err);
		});
	}

	function makeWatch() {
		return $scope.$watch("play",(val,old)=>{
			if(val!=old && val==-1) {
				idx++;
				play();
			}
		});
	}

	function play(start) {
		if(start) {
			if(watch) watch();
			else watch = makeWatch();
		}

		let scene = $scope.film.scenes[idx];
		if(!scene) return stop();
		else return scene.fetch().
			then(res=>$scope.scene = res).
			then(res=>new Promise(resolve=>$timeout(resolve,10))).
			then(res=>$scope.play = 0).
			catch(err=>{
				console.error(err);
			});
	}

	function stop() {
		if(watch) watch();
		idx = 0;
		$scope.play = -1;
	}

	init();
});

angular.module('ppgmaker').
controller("SceneController",function($scope,$q,$stateParams,$element,$interval,screenshotService,styleService,itemsService,sceneService){
	var MAX = 5;
	var MAX_TIME = 30000;
	var recordTimeout = null;
	var elemScene = $(".scene",$element).get(0);

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

		return screenshotService.take(elemScene,100,100).
			then(img=>$scope.scene.screenshot=img).
			then(()=>$scope.scene.save()).
			then(()=>$scope.film.update($scope.scene,true)).
			catch(err=>console.error(err));
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
			item.eid = `ppgm_item_${Date.now()}`;
			$scope.scene.items.push(item);
		}
	}

	$scope.overlaps = function(eid) {
		if(eid!=$scope.overlapItem) {
			$scope.overlapItem = eid;
		}
	}

	$scope.itemDropped = function(eid) {
		let eitem = $scope.overlapItem;
		if(eitem && eid==eitem) {
			let idx = $scope.scene.items.findIndex(item=>item.eid==eid);
			if(idx>=0) {
				$scope.overlapItem = null;
				$scope.scene.items.splice(idx,1);
				styleService.remove(eid);
			}
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
			styleService.clean();
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
	const
		DRG = "hammer_drag",
		BOX = "hammer_drag_box";

	function handleDrag(ev,scope) {
		var elem = $(ev.target);

		if (!elem.data(DRG)) {
			elem.data(DRG,elem.position());
			elem.data(BOX,elem[0].getBoundingClientRect());
		}

		var oldPos = elem.data(DRG);
		var box = elem.data(BOX);
		var posX = ev.deltaX + oldPos.left;
		var posY = ev.deltaY + oldPos.top;
		posX = Math.min(Math.max(0,posX),window.innerWidth-box.width);
		posY = Math.min(Math.max(0,posY),window.innerHeight-box.height);
		var newPos = {left:posX,top:posY};
		elem.css(newPos);
		styleService.set(elem,newPos);

		if (ev.isFinal) {
			elem.data(DRG,null);
			elem.data(BOX,null);
			scope.$eval(elem.attr("on-ppg-drop"))(elem.attr("id"));
			scope.$apply();
		}
	}

	function link(scope,elem,attrs) {
		var mc = new Hammer(elem[0]);
		mc.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );
		mc.on("pan",ev=>handleDrag(ev,scope));
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

angular.module('ppgmaker').directive("ppgOverlap",function(styleService) {
	function overlap(rect1,rect2) {
		return !(
			rect1.right <= rect2.left ||
			rect1.left >= rect2.right ||
			rect1.bottom <= rect2.top ||
			rect1.top >= rect2.bottom
		);
	}

	function link(scope,elem,attrs) {
		let box = elem[0].getBoundingClientRect();
		let fn = function() {
			requestAnimationFrame(fn);
			if(scope.disabled) return;
			let model = styleService.model;
			let oid = null;
			let ret = Object.keys(model).some(id=>{
				let elem = document.getElementById(id);
				if(!elem) return false;
				let ebox = elem.getBoundingClientRect();
				return overlap(box,ebox) && (oid = id);
			});
			if(ret) $(elem).addClass("overlap");
			else $(elem).removeClass("overlap");
			scope.onOverlap({item:oid});
		}
		fn();
	}

	return {
		link : link,
		scope : {
			ppgOverlap : "=",
			disabled : "=",
			onOverlap : "&"
		}
	}
});

angular.module('ppgmaker').directive("ppgPlay",function(styleService) {
	var containers = {};

	function animate() {
		requestAnimationFrame(animate);
		Object.values(containers).forEach(data=>{
			let scope = data.scope, items = data.items;
			for(let key in items) {
				let item = items[key];
				if(item.frame>=0) {
					let style = item.buffer[item.frame];
					if(style) {
						$(item.elem).css(style);
						item.frame++;
					}
					else {
						item.frame = -1;
						scope.ppgPlay = -1;
						scope.$apply();
					}
				}
			}
		});
	}

	function getId(el) {
		if(!el.attr("id")) el.attr("id","ppgplay_"+(uid++));
		return el.attr("id");
	}

	function link(scope,element,attrs) {
		if(!element.attr("id")) {
			element.attr("id",`ppg-play-${Math.random()}`);
		}

		let eid = element.attr("id");
		containers[eid] = containers[eid] || {scope:scope,items:[]};
		let items = containers[eid].items;

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
			delete containers[eid];
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

angular.module("ppgmaker").provider("template",function(){
	this.films = "<div class=\"row\" style=\"height:50px\">\r\n\t<div class=\"col-lg-12\" style=\"position:fixed;width:100%;z-index:1000;\">\r\n\t\t<h2 class=\"pull-left\" style=\"margin-left:20px\"><a href=\"#\" ui-sref=\"film({id:'new'})\" tooltip=\"New Film\"><i class=\"fa fa-plus-circle\"></i></a></h2>\r\n\t\t<h2 class=\"pull-right\" style=\"margin-right:20px\"><a href=\"#\" ui-sref=\"settings()\" tootltip=\"Settings\"><i class=\"fa fa-cog\"></i></a></h2>\r\n\t</div>\r\n</div>\r\n\r\n<ul class=\"film-list\">\r\n\t<li ng-repeat=\"film in films\">\r\n\t\t<h3>\r\n\t\t\t<a href=\"#\" ui-sref=\"film({id:film._id})\">{{film.name}}<a>\r\n\t\t\t<a href=\"#\" ui-sref=\"player({id:film._id})\"><i class=\"fa fa-play\"></i></a>\r\n\t\t</h3>\r\n\t\t<div class=\"film-scenes\" ppg-carousel=\"film.scenes\">\r\n\t\t\t<img ng-repeat=\"scene in film.scenes\"\r\n\t\t\t\tui-sref=\"film({id:film._id})\"\r\n\t\t\t\tng-src=\"{{scene.screenshot||'img/web/scene001.jpg'}}\"/>\r\n\t\t</div>\r\n\t</li>\r\n</ul>\r\n";
	this.player = "<!-- Scene -->\r\n<div class=\"fill scene\">\r\n\t<div class=\"element-container fill\" ppg-play=\"play\" style=\"background-image:url('{{scene.background.src}}')\">\r\n\t\t<button class=\"btn btn-primary\" ui-sref=\"films()\">Stop</button>\r\n\t\t<img ng-repeat=\"item in scene.items\"\r\n\t\t\tid=\"{{item.eid}}\"\r\n\t\t\tclass=\"element\"\r\n\t\t\tppg-record=\"item.buffer\"\r\n\t\t\tplay=\"play\"\r\n\t\t\tng-src=\"{{item | imgsrc:'xl'}}\" />\r\n\t</div>\r\n</div>\r\n";
	this.scene = "<!-- Top buttons -->\r\n<div class=\"frame frame-top orange cover\" ng-class=\"{transparent:record}\">\r\n\t<div class=\"row\">\r\n\t\t<form class=\"form-inline\">\r\n\t\t\t<div class=\"form-group\">\r\n\t\t\t\t<a class=\"action\" ui-sref=\"films()\"><i class=\"fa fa-home\"></i></a>\r\n\t\t\t\t<a class=\"action danger\" ng-show=\"scene\" ng-click=\"toggleRecord()\"><i class=\"fa\" ng-class=\"{'fa-circle':!record,'fa-pause':record}\"></i></a>\r\n\t\t\t\t<a class=\"action\" ng-show=\"scene\" ng-click=\"togglePlay()\"><i class=\"fa\" ng-class=\"{'fa-play':play<0,'fa-stop':play>=0}\"></i></a>\r\n\t\t\t</div>\r\n\t\t\t<div class=\"form-group\" ng-show=\"scene\">\r\n\t\t\t\t<uib-progressbar style=\"width:300px\" class=\"progress-bar-danger progress-big active\" value=\"time\" type=\"success\"></uib-progressbar>\r\n\t\t\t</div>\r\n\t\t\t<div class=\"form-group\" ng-show=\"scene\">\r\n\t\t\t\t<a class=\"action\" ng-click=\"backScene()\"><i class=\"fa fa-reply\"></i></a>\r\n\t\t\t</div>\r\n\t\t\t<div class=\"form-group\" ng-show=\"!scene\">\r\n\t\t\t\t<a class=\"action\" ng-click=\"newScene()\"><i class=\"fa fa-plus\"></i></a>\r\n\t\t\t</div>\r\n\t\t\t<div class=\"form-group\" ng-show=\"!scene\" style=\"width:50%\">\r\n\t\t\t\t<div ng-if=\"film.scenes.length && !scene\" ppg-carousel=\"film.scenes\">\r\n\t\t\t\t\t<img ng-repeat=\"scene in film.scenes track by scene._id\"\r\n\t\t\t\t\tng-src=\"{{scene.screenshot||'img/web/scene001.jpg'}}\"\r\n\t\t\t\t\talt=\"{{scene.name}}\"\r\n\t\t\t\t\tstyle=\"margin-right:5px;height:34px\"\r\n\t\t\t\t\tng-click=\"selectScene(scene)\"/>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</form>\r\n\t</div>\r\n</div>\r\n\r\n<!-- Item selector -->\r\n<uib-tabset active=\"active\" class=\"frame frame-bottom pink\">\r\n\t<uib-tab index=\"-1\" heading=\"Places\">\r\n\t\t<div style=\"padding:10px\" ppg-carousel=\"allitems.backgrounds.items\">\r\n\t\t\t<img ng-repeat=\"bg in allitems.backgrounds.items\"\r\n\t\t\tclass=\"item\"\r\n\t\t\tng-class=\"{disabled:record}\"\r\n\t\t\tng-src=\"{{bg.src}}\"\r\n\t\t\tstyle=\"margin-right:5px\"\r\n\t\t\tng-click=\"setBackground(bg)\"/>\r\n\t\t</div>\r\n\t</uib-tab>\r\n\t<uib-tab ng-repeat=\"section in allitems.sections\" index=\"$index\">\r\n\t\t<uib-tab-heading>{{section.id}}</uib-tab-heading>\r\n\t\t<div style=\"padding:10px\" ppg-carousel=\"section.items\">\r\n\t\t\t<img ng-repeat=\"item in section.items\"\r\n\t\t\tclass=\"item\"\r\n\t\t\tng-class=\"{disabled:addDisabled || record}\"\r\n\t\t\tng-src=\"{{item | imgsrc:'sm'}}\"\r\n\t\t\tstyle=\"margin-right:5px\"\r\n\t\t\tng-click=\"addItem(item)\"/>\r\n\t\t</div>\r\n\t</uib-tab>\r\n</uib-tabset>\r\n\r\n<!-- Scene -->\r\n<div class=\"fill scene\">\r\n\t<div class=\"element-container fill\" ppg-play=\"play\" style=\"background-image:url('{{scene.background.src}}')\">\r\n\t\t<div class=\"trash-container\" ppg-overlap=\"film.scenes\">\r\n\t\t\t<a class=\"action trash-can\" ppg-overlap=\"film.scenes\" on-overlap=\"overlaps(item)\"><i class=\"fa fa-trash\"></i></a>\r\n\t\t</div>\r\n\t\t<img ng-repeat=\"item in scene.items\"\r\n\t\t\tid=\"{{item.eid}}\"\r\n\t\t\tclass=\"element\"\r\n\t\t\tppg-draggable\r\n\t\t\tppg-flip\r\n\t\t\tppg-record=\"item.buffer\"\r\n\t\t\tppg-effects=\"item.effects\"\r\n\t\t\ton-ppg-drop=\"itemDropped\"\r\n\t\t\trecord=\"record\" play=\"play\"\r\n\t\t\tng-src=\"{{item | imgsrc:'xl'}}\" />\r\n\t</div>\r\n</div>\r\n"

	this.$get = function() {
		return this;
	}
});

angular.module("ppgmaker").service("itemsService",function($http){
	var prModel = false;
	var self = this;

	this.model = {};

	this.get = function() {
		if(!prModel) {
			prModel = $http.
				get("data/allitems.json").
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

angular.module("ppgmaker").service("screenshotService",function($q){
	var canvas = document.createElement("canvas");

	this.take = function(elem,w,h) {
		if(window.isCordova) return takeCordova(elem,w,h);
		else return takeBrowser(elem,w,h);
	}

	function resizeImage(img,h) {
		let ctx = canvas.getContext('2d');
		canvas.height = h;
		canvas.width = img.width*canvas.height/img.height;
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL();
	}

	function takeBrowser(elemScene,w,h) {
		return $q(res=>html2canvas(elemScene,{onrendered:res})).
			then(canvas=>resizeImage(canvas,h));
	}

	function takeCordova(elem,w,h) {
		let quality = '80';
		let defer = $q.defer();

		navigator.screenshot.URI((error, res) => {
			if (error) defer.reject(error);
			else defer.resolve(res.URI);
		}, quality);

		return defer.promise;
	}
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

	this.clean = function() {
		Object.keys(this.model).forEach(k=>{
			delete this.model[k];
		});
	}
});

//# sourceMappingURL=app.es6.js.map