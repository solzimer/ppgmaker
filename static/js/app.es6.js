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

	$stateProvider.state("sound",{
		url: '/sound',
		controller : 'SoundController',
	  template: templateProvider.sound
	});

	$urlRouterProvider.otherwise("/films");

	console.log("App started!");

});

angular.module('ppgmaker').
controller("DeleteItemController",function($uibModalInstance, item){
	let $ctrl = this;

  $ctrl.item = item;

  $ctrl.ok = function () {
    $uibModalInstance.close(true);
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

});

angular.module('ppgmaker').
controller("FilmsController",function($scope,$element,$interval,$q,dialogService,sceneService){
	$scope.films = [];

	function init() {
		sceneService.allFilms().then(films=>{
			$scope.films = films;
		});
	}

	$scope.delete = function(film) {
		dialogService.
			confirmRemove(film.name).
			then(res=>res?film.drop() : true).
			then(res=>init()).
			catch(err=>{
				console.warn(err);
			});
	}

	$scope.rename = function(film) {
		dialogService.
			renameItem(film.name).
			then(name=>film.name=name).
			then(res=>film.save()).
			then(res=>init()).
			catch(err=>{
				console.warn(err);
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
controller("RenameItemController",function($uibModalInstance, item){
	let $ctrl = this;

  $ctrl.item = item;

  $ctrl.ok = function () {
    $uibModalInstance.close($ctrl.item);
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

});

angular.module('ppgmaker').
controller("SceneController",function(
	$scope,$q,$stateParams,$element,$interval,$uibModal,dialogService,
	screenshotService,styleService,soundService,itemsService,sceneService) {
	var MAX = 5;
	var MAX_TIME = 30000;
	var recordTimeout = null;
	var elemScene = $(".scene",$element).get(0);
	var media = null;

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
			if(!film) return sceneService.newFilm({name:"New Film"}).save();
			else return film;
		}).then(film=>{
			$scope.film = film;
		}).catch(err=>{
			console.error(err);
		});

		$scope.$watch("play",(newval,oldval)=>{
			if(newval!=oldval) {
				if(newval>=0) playSound();
				else stopSound();				
			}
		})

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

	function startRecordSound() {
		media = soundService.recorder("test");
		media.startRecord();
	}

	function stopRecordSound() {
		media.stopRecord();
		return media.blob().
			catch(err=>{
				console.warn(err);
			}).
			finally(()=>{
				media.release();
			});
	}

	function playSound() {
		media = soundService.player("test",$scope.scene.audio());
		media.play();
	}

	function stopSound() {
		media.stop();
		media.release();
	}

	function startRecord() {
		resetBuffers();
		startRecordSound();
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
			then(()=>stopRecordSound()).
			then(blob=>$scope.scene.audio(blob)).
			then(()=>$scope.scene.save()).
			then(scn=>$scope.scene = scn).
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
			if(idx<0) return;
			let item = $scope.scene.items[idx];
			$scope.overlapItem = null;
			dialogService.confirmRemove(item.id).then(res=>{
				$scope.scene.items.splice(idx,1);
				styleService.remove(eid);
			}).catch(err=>{});
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

	$scope.removeScene = function() {
		dialogService.
			confirmRemove("scene").
			then(res=>$scope.film.remove($scope.scene)).
			then(res=>$scope.backScene()).
			catch(err=>{
				console.warn(err);
			});
	}

	$scope.backScene = function() {
		$q.resolve($scope.record).
			then(res=>res?stopRecord():true).
			then(()=>{
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

angular.module("ppgmaker").provider("audio",function(){
	class AudioRecorder {
		constructor(id) {this.id = id; this._callbacks = {};}
		on(evt,callback) {this._callbacks[evt] = this._callbacks[id] || [];}
		startRecord() {}
		stopRecord() {}
		pauseRecord() {}
		resumeRecord() {}
		release() {}
		blob(){}
	}

	class AudioPlayer {
		constructor(id) {this.id = id; this._callbacks = {};}
		on(evt,callback) {this._callbacks[evt] = this._callbacks[id] || [];}
		play() {}
		pause() {}
		resume() {}
		stop() {}
		release() {}
	}

	this.AudioRecorder = AudioRecorder;
	this.AudioPlayer = AudioPlayer;
	this.$get = function() {
		return this;
	}
});

angular.module("ppgmaker").provider("template",function(){
	this.delete_item = "<div class=\"modal-header\">\n\t<h3 class=\"modal-title\">Remove Item</h3>\n</div>\n<div class=\"modal-body\">\n\tAre you sure you want to remove {{$ctrl.item}}?\n</div>\n<div class=\"modal-footer\">\n\t<button class=\"btn btn-danger\" type=\"button\" ng-click=\"$ctrl.ok()\">OK</button>\n\t<button class=\"btn btn-warning\" type=\"button\" ng-click=\"$ctrl.cancel()\">Cancel</button>\n</div>\n";
	this.films = "<div class=\"row action-bar\">\n\t<div class=\"col-lg-12\">\n\t\t<h4 class=\"pull-left\"><a href=\"#\" class=\"action\" ui-sref=\"film({id:'new'})\" tooltip=\"New Film\"><i class=\"fa fa-plus-circle\"></i></a></h4>\n\t\t<h4 class=\"pull-right\" style=\"margin-right:12px\"><a href=\"#\" class=\"action\" ui-sref=\"settings()\" tootltip=\"Settings\"><i class=\"fa fa-cog\"></i></a></h4>\n\t</div>\n</div>\n\n<ul class=\"film-list\">\n\t<li ng-repeat=\"film in films\">\n\t\t<h3>\n\t\t\t<a href=\"#\" ui-sref=\"film({id:film._id})\">{{film.name}}<a>\n\t\t\t<div class=\"pull-right\" style=\"margin-right:24px\">\n\t\t\t\t<a href=\"#\" class=\"mini-action\" ui-sref=\"player({id:film._id})\"><i class=\"fa fa-play\"></i></a>\n\t\t\t\t<a href=\"#\" class=\"mini-action\" ng-click=\"rename(film)\"><i class=\"fa fa-pencil\"></i></a>\n\t\t\t\t<a href=\"#\" class=\"mini-action\" ng-click=\"delete(film)\"><i class=\"fa fa-trash\"></i></a>\n\t\t\t</div>\n\t\t</h3>\n\t\t<div class=\"film-scenes\" ppg-carousel=\"film.scenes\">\n\t\t\t<img ng-repeat=\"scene in film.scenes\"\n\t\t\t\tui-sref=\"film({id:film._id})\"\n\t\t\t\tng-src=\"{{scene.screenshot||'img/web/scene001.jpg'}}\"/>\n\t\t</div>\n\t</li>\n</ul>\n";
	this.player = "<!-- Scene -->\n<div class=\"fill scene\">\n\t<div class=\"element-container fill\" ppg-play=\"play\" style=\"background-image:url('{{scene.background.src}}')\">\n\t\t<button class=\"btn btn-primary\" ui-sref=\"films()\">Stop</button>\n\t\t<img ng-repeat=\"item in scene.items\"\n\t\t\tid=\"{{item.eid}}\"\n\t\t\tclass=\"element\"\n\t\t\tppg-record=\"item.buffer\"\n\t\t\tplay=\"play\"\n\t\t\tng-src=\"{{item | imgsrc:'xl'}}\" />\n\t</div>\n</div>\n";
	this.rename_item = "<div class=\"modal-header\">\n\t<h3 class=\"modal-title\">Rename</h3>\n</div>\n<div class=\"modal-body\">\n\tNew name for {{$ctrl.item}}\n\t<input class=\"form-control\" ng-model=\"$ctrl.item\"/>\n</div>\n<div class=\"modal-footer\">\n\t<button class=\"btn btn-success\" type=\"button\" ng-click=\"$ctrl.ok()\">OK</button>\n\t<button class=\"btn btn-warning\" type=\"button\" ng-click=\"$ctrl.cancel()\">Cancel</button>\n</div>\n";
	this.scene = "<!-- Top buttons -->\n<div class=\"frame frame-top orange cover\" ng-class=\"{transparent:record}\">\n\t<div class=\"row\">\n\t\t<form class=\"form-inline\" style=\"margin: 0 auto; width: 524px;\">\n\t\t\t<div class=\"form-group\">\n\t\t\t\t<a class=\"action\" ui-sref=\"films()\"><i class=\"fa fa-home\"></i></a>\n\t\t\t\t<a class=\"action danger\" ng-show=\"scene\" ng-click=\"toggleRecord()\"><i class=\"fa\" ng-class=\"{'fa-circle':!record,'fa-pause':record}\"></i></a>\n\t\t\t\t<a class=\"action\" ng-show=\"scene\" ng-click=\"togglePlay()\"><i class=\"fa\" ng-class=\"{'fa-play':play<0,'fa-stop':play>=0}\"></i></a>\n\t\t\t</div>\n\t\t\t<div class=\"form-group\" ng-show=\"scene\">\n\t\t\t\t<uib-progressbar style=\"width:300px\" class=\"progress-bar-danger progress-big active\" value=\"time\" type=\"success\"></uib-progressbar>\n\t\t\t</div>\n\t\t\t<div class=\"form-group\" ng-show=\"scene\">\n\t\t\t\t<a class=\"action\" ng-click=\"removeScene()\"><i class=\"fa fa-trash\"></i></a>\n\t\t\t</div>\n\t\t\t<div class=\"form-group\" ng-show=\"scene\">\n\t\t\t\t<a class=\"action\" ng-click=\"backScene()\"><i class=\"fa fa-reply\"></i></a>\n\t\t\t</div>\n\t\t\t<div class=\"form-group\" ng-show=\"!scene\">\n\t\t\t\t<a class=\"action\" ng-click=\"newScene()\"><i class=\"fa fa-plus\"></i></a>\n\t\t\t</div>\n\t\t\t<div class=\"form-group\" ng-show=\"!scene\" style=\"width:50%\">\n\t\t\t\t<div ng-if=\"film.scenes.length && !scene\" ppg-carousel=\"film.scenes\">\n\t\t\t\t\t<img ng-repeat=\"scene in film.scenes track by scene._id\"\n\t\t\t\t\tng-src=\"{{scene.screenshot||'img/web/scene001.jpg'}}\"\n\t\t\t\t\talt=\"{{scene.name}}\"\n\t\t\t\t\tstyle=\"margin-right:5px;height:34px\"\n\t\t\t\t\tng-click=\"selectScene(scene)\"/>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</form>\n\t</div>\n</div>\n\n<!-- Item selector -->\n<uib-tabset active=\"active\" class=\"frame frame-bottom pink\">\n\t<uib-tab index=\"-1\" heading=\"Places\">\n\t\t<div style=\"padding:10px\" ppg-carousel=\"allitems.backgrounds.items\">\n\t\t\t<img ng-repeat=\"bg in allitems.backgrounds.items\"\n\t\t\tclass=\"item\"\n\t\t\tng-class=\"{disabled:record}\"\n\t\t\tng-src=\"{{bg.src}}\"\n\t\t\tstyle=\"margin-right:5px\"\n\t\t\tng-click=\"setBackground(bg)\"/>\n\t\t</div>\n\t</uib-tab>\n\t<uib-tab ng-repeat=\"section in allitems.sections\" index=\"$index\">\n\t\t<uib-tab-heading>{{section.id}}</uib-tab-heading>\n\t\t<div style=\"padding:10px\" ppg-carousel=\"section.items\">\n\t\t\t<img ng-repeat=\"item in section.items\"\n\t\t\tclass=\"item\"\n\t\t\tng-class=\"{disabled:addDisabled || record}\"\n\t\t\tng-src=\"{{item | imgsrc:'sm'}}\"\n\t\t\tstyle=\"margin-right:5px\"\n\t\t\tng-click=\"addItem(item)\"/>\n\t\t</div>\n\t</uib-tab>\n</uib-tabset>\n\n<!-- Scene -->\n<div class=\"fill scene\">\n\t<div class=\"element-container fill\" ppg-play=\"play\" style=\"background-image:url('{{scene.background.src}}')\">\n\t\t<div class=\"trash-container\" ppg-overlap=\"film.scenes\">\n\t\t\t<a class=\"action trash-can\" ppg-overlap=\"film.scenes\" on-overlap=\"overlaps(item)\"><i class=\"fa fa-trash\"></i></a>\n\t\t</div>\n\t\t<img ng-repeat=\"item in scene.items\"\n\t\t\tid=\"{{item.eid}}\"\n\t\t\tclass=\"element\"\n\t\t\tppg-draggable\n\t\t\tppg-flip\n\t\t\tppg-record=\"item.buffer\"\n\t\t\tppg-effects=\"item.effects\"\n\t\t\ton-ppg-drop=\"itemDropped\"\n\t\t\trecord=\"record\" play=\"play\"\n\t\t\tng-src=\"{{item | imgsrc:'xl'}}\" />\n\t</div>\n</div>\n"

	this.$get = function() {
		return this;
	}
});

angular.module("ppgmaker").service("dialogService",function($q, $uibModal, template){

	this.confirmRemove = function(name) {
		return $uibModal.open({
      animation: true,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      template: template.delete_item,
      controller: 'DeleteItemController',
      controllerAs: '$ctrl',
      resolve: {
				item: ()=>name
      }
    }).result;
	}

	this.renameItem = function(name) {
		return $uibModal.open({
      animation: true,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      template: template.rename_item,
      controller: 'RenameItemController',
      controllerAs: '$ctrl',
      resolve: {
				item: ()=>name
      }
    }).result;
	}
});

angular.module("ppgmaker").service("fileService",function($q){

	var ready = $q((resolve,reject)=>{
		if(!window.requestFileSystem) reject("App in browser");
		else {
			window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, function (fs) {
				console.log('file system open: ' + fs.name);
				resolve(fs);
			},reject);
		}
	});

	ready.catch(err=>{
		console.warn("File system not available",err);
	});

	function getFile(dirEntry,fileName,opts) {
		return $q((resolve,reject)=>{
			dirEntry.getFile(fileName, opts, resolve, reject);
		});
	}

	function readFileAsBlob(fileEntry,type) {
		return $q((resolve,reject)=>{
			fileEntry.file(file=>{
				let reader = new FileReader();
				reader.onloadend = function() {
					let blob = new Blob([new Uint8Array(this.result)], {type:type});
					resolve(blob);
				};
				reader.onerror = function(err) {reject(e)};
				reader.readAsArrayBuffer(file);
			});
		});
	}

	function writeBlobAsFile(fileEntry,blob) {
		return $q((resolve,reject)=>{
	    fileEntry.createWriter(writer=>{
				writer.onwriteend = function() {resolve(blob)};
				writer.onerror = function(err) {reject(e)};
				writer.write(blob);
	    });
		});
	}

	this.readAsBlob = function(fileName,type) {
		return ready.
			then(fs=>fs.root).
			then(dirEntry=>getFile(dirEntry,fileName,{create:false,exclusive:false})).
			then(fileEntry=>readFileAsBlob(fileEntry,type||'audio/m4a'));
	}

	this.writeBlob = function(fileName,blob) {
		return ready.
			then(fs=>fs.root).
			then(dirEntry=>getFile(dirEntry,fileName,{create:false,exclusive:false})).
			then(fileEntry=>writeBlobAsFile(fileEntry,blob));
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
	const engine = window.isCordova? {adapter: 'cordova-sqlite'} : undefined;
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
				this._attachments = props._attachments;
			}

			if(this.items) {
				let now = Date.now();
				this.items.forEach(item=>{
					item.eid = item.eid || `ppgm_item_${now++}`;
				});
			}
		}

		audio(blob) {
			if(blob) {
				this._attachments = {
					audio : {
						content_type : blob.type,
						data : blob
					}
				}
			}
			else return this._attachments.audio.data;
		}

		mini() {
			return new Scene(this,true);
		}

		fetch() {
			return q().then(()=>sceneCol.get(this._id,{attachments:true, binary:true})).then(res=>new Scene(res));
		}

		save() {
			return q().then(()=>sceneCol.put(this)).then(res=>this.fetch());
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
				then(()=>this.scenes.forEach(scn=>scn._deleted=true)).
				then(()=>sceneCol.bulkDocs(this.scenes)).
				then(res=>filmCol.remove(this)).
				then(res=>this);
		}
	}

	function init() {
		filmCol = new PouchDB('ppgmaker_films',engine);
		sceneCol = new PouchDB('ppgmaker_scenes',engine);
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

angular.module("ppgmaker").service("soundService",function($q,audio,fileService){

	class BrowserAudioRecorder extends audio.AudioRecorder {
		constructor(id) {
			super(id);
			this._media = null;
			this._ready = null;
			this._callbacks["success"] = [];
			this._callbacks["error"] = [];
			this._blob = $q.defer();
			this._init();
		}

		_error(err) {this._callbacks.success.forEach(c=>c(err));}
		_success() {this._callbacks.success.forEach(c=>c());}

		_init() {
			this._ready = navigator.mediaDevices.getUserMedia({audio:true}).
				then(stream => {
					const chunks = [];
					this._media = new MediaRecorder(stream);
					this._media.ondataavailable = (event) => {
						chunks.push(event.data);
						if (this._media.state == 'inactive') {
							let blob = new Blob(chunks, {type: 'audio/webm'});
							this._success();
							this._blob.resolve(blob);
						}
					}
				}).
				catch(err => {
					this._error(err)
				});
		}

		startRecord() {this._ready.then(()=>this._media.start());}
		stopRecord() {this._ready.then(()=>this._media.stop()).catch(err=>console.warn(err));}
		pauseRecord() {this._ready.then(()=>this._media.pause());}
		resumeRecord() {this._ready.then(()=>this._media.resume());}
		blob(){return this._blob.promise;}
	}

	class BrowserAudioPlayer extends audio.AudioPlayer {
		constructor(id,blob) {
			super(id);
			this._elem = null;
			this._callbacks["success"] = [];
			this._callbacks["error"] = [];
			this._blob = blob;
			this._init();
		}

		_error(err) {this._callbacks.success.forEach(c=>c(err));}
		_success() {this._callbacks.success.forEach(c=>c());}

		_init() {
			let elem = document.getElementById("ppgm_audio_item");
			if(!elem) {
				elem = document.createElement("audio");
				elem.id = "ppgm_audio_item";
				document.body.appendChild(elem);
			}
			this._elem = elem;
			this._elem.src = URL.createObjectURL(this._blob);
		}

		play() {this._elem.play();}
		pause() {this._elem.pause();}
		stop() {this._elem.pause();}
		resume() {this._elem.play();}
		release() {}
	}

	class CordovaAudioRecorder extends audio.AudioRecorder {
		constructor(id) {
			super(id);
			this._src = `${id}.m4a`;
			this._media = new Media(this._src,()=>this._success(),err=>this._error(err));
			this._callbacks["success"] = [];
			this._callbacks["error"] = [];
		}

		_error(err) {this._callbacks.success.forEach(c=>c(err));}
		_success() {this._callbacks.success.forEach(c=>c());}
		startRecord() {this._media.startRecord();}
		stopRecord() {this._media.stopRecord();}
		pauseRecord() {this._media.pauseRecord();}
		resumeRecord() {this._media.resumeRecord();}
		release() {this._media.release();}
		blob() {return fileService.readAsBlob(this._src,"audio/m4a");}
	}

	class CordovaAudioPlayer extends audio.AudioPlayer {
		constructor(id,blob) {
			super(id);
			this._src = `${id}.m4a`;
			this._ready = null;
			this._media = null;
			this._callbacks["success"] = [];
			this._callbacks["error"] = [];
			this._init(this._src,blob);
		}
		_init(src,blob) {
			this._ready = fileService.
				writeBlob(src,blob).
				then(()=>{
					this._media = new Media(src,()=>this._success(),err=>this._error(err));
					return this._media;
				});
		}
		_error(err) {this._callbacks.success.forEach(c=>c(err));}
		_success() {this._callbacks.success.forEach(c=>c());}
		play() {this._ready.then(m=>m.play());}
		pause() {this._ready.then(m=>m.pause());}
		resume() {this._ready.then(m=>m.resume());}
		stop() {this._ready.then(m=>m.stop());}
		release() {this._ready.then(m=>m.release());}
	}

	this.recorder = function(id) {
		if(window.isCordova) {
			return new CordovaAudioRecorder(id);
		}
		else {
			return new BrowserAudioRecorder(id);
		}
	}

	this.player = function(id,blob) {
		if(window.isCordova) {
			return new CordovaAudioPlayer(id,blob);
		}
		else {
			return new BrowserAudioPlayer(id,blob);
		}
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