angular.module("ppgmaker").provider("template",function(){
	this.delete_item = "<div class=\"modal-header\">\r\n\t<h3 class=\"modal-title\">Remove Item</h3>\r\n</div>\r\n<div class=\"modal-body\">\r\n\tAre you sure you want to remove {{$ctrl.item}}?\r\n</div>\r\n<div class=\"modal-footer\">\r\n\t<button class=\"btn btn-danger\" type=\"button\" ng-click=\"$ctrl.ok()\">OK</button>\r\n\t<button class=\"btn btn-warning\" type=\"button\" ng-click=\"$ctrl.cancel()\">Cancel</button>\r\n</div>\r\n";
	this.films = "<div class=\"row action-bar\">\r\n\t<div class=\"col-lg-12\">\r\n\t\t<h4 class=\"pull-left\"><a href=\"#\" class=\"action\" ui-sref=\"film({id:'new'})\" tooltip=\"New Film\"><i class=\"fa fa-plus-circle\"></i></a></h4>\r\n\t\t<h4 class=\"pull-right\" style=\"margin-right:12px\"><a href=\"#\" class=\"action\" ui-sref=\"settings()\" tootltip=\"Settings\"><i class=\"fa fa-cog\"></i></a></h4>\r\n\t</div>\r\n</div>\r\n\r\n<ul class=\"film-list\">\r\n\t<li ng-repeat=\"film in films\">\r\n\t\t<h3>\r\n\t\t\t<a href=\"#\" ui-sref=\"film({id:film._id})\">{{film.name}}<a>\r\n\t\t\t<div class=\"pull-right\" style=\"margin-right:24px\">\r\n\t\t\t\t<a href=\"#\" class=\"mini-action\" ui-sref=\"player({id:film._id})\"><i class=\"fa fa-play\"></i></a>\r\n\t\t\t\t<a href=\"#\" class=\"mini-action\" ng-click=\"rename(film)\"><i class=\"fa fa-pencil\"></i></a>\r\n\t\t\t\t<a href=\"#\" class=\"mini-action\" ng-click=\"delete(film)\"><i class=\"fa fa-trash\"></i></a>\r\n\t\t\t</div>\r\n\t\t</h3>\r\n\t\t<div class=\"film-scenes\" ppg-carousel=\"film.scenes\">\r\n\t\t\t<img ng-repeat=\"scene in film.scenes\"\r\n\t\t\t\tui-sref=\"film({id:film._id})\"\r\n\t\t\t\tng-src=\"{{scene.screenshot||'img/web/scene001.jpg'}}\"/>\r\n\t\t</div>\r\n\t</li>\r\n</ul>\r\n";
	this.player = "<!-- Scene -->\r\n<div class=\"fill scene\">\r\n\t<div class=\"element-container fill\" ppg-play=\"play\" style=\"background-image:url('{{scene.background.src}}')\">\r\n\t\t<button class=\"btn btn-primary\" ui-sref=\"films()\">Stop</button>\r\n\t\t<img ng-repeat=\"item in scene.items\"\r\n\t\t\tid=\"{{item.eid}}\"\r\n\t\t\tclass=\"element\"\r\n\t\t\tppg-record=\"item.buffer\"\r\n\t\t\tplay=\"play\"\r\n\t\t\tng-src=\"{{item | imgsrc:'xl'}}\" />\r\n\t</div>\r\n</div>\r\n";
	this.rename_item = "<div class=\"modal-header\">\r\n\t<h3 class=\"modal-title\">Rename</h3>\r\n</div>\r\n<div class=\"modal-body\">\r\n\tNew name for {{$ctrl.item}}\r\n\t<input class=\"form-control\" ng-model=\"$ctrl.item\"/>\r\n</div>\r\n<div class=\"modal-footer\">\r\n\t<button class=\"btn btn-success\" type=\"button\" ng-click=\"$ctrl.ok()\">OK</button>\r\n\t<button class=\"btn btn-warning\" type=\"button\" ng-click=\"$ctrl.cancel()\">Cancel</button>\r\n</div>\r\n";
	this.scene = "<!-- Top buttons -->\r\n<div class=\"frame frame-top orange cover\" ng-class=\"{transparent:record}\">\r\n\t<div class=\"row\">\r\n\t\t<form class=\"form-inline\" style=\"margin: 0 auto; width: 524px;\">\r\n\t\t\t<div class=\"form-group\">\r\n\t\t\t\t<a class=\"action\" ui-sref=\"films()\"><i class=\"fa fa-home\"></i></a>\r\n\t\t\t\t<a class=\"action danger\" ng-show=\"scene\" ng-click=\"toggleRecord()\"><i class=\"fa\" ng-class=\"{'fa-circle':!record,'fa-pause':record}\"></i></a>\r\n\t\t\t\t<a class=\"action\" ng-show=\"scene\" ng-click=\"togglePlay()\"><i class=\"fa\" ng-class=\"{'fa-play':play<0,'fa-stop':play>=0}\"></i></a>\r\n\t\t\t</div>\r\n\t\t\t<div class=\"form-group\" ng-show=\"scene\">\r\n\t\t\t\t<uib-progressbar style=\"width:300px\" class=\"progress-bar-danger progress-big active\" value=\"time\" type=\"success\"></uib-progressbar>\r\n\t\t\t</div>\r\n\t\t\t<div class=\"form-group\" ng-show=\"scene\">\r\n\t\t\t\t<a class=\"action\" ng-click=\"removeScene()\"><i class=\"fa fa-trash\"></i></a>\r\n\t\t\t</div>\r\n\t\t\t<div class=\"form-group\" ng-show=\"scene\">\r\n\t\t\t\t<a class=\"action\" ng-click=\"backScene()\"><i class=\"fa fa-reply\"></i></a>\r\n\t\t\t</div>\r\n\t\t\t<div class=\"form-group\" ng-show=\"!scene\">\r\n\t\t\t\t<a class=\"action\" ng-click=\"newScene()\"><i class=\"fa fa-plus\"></i></a>\r\n\t\t\t</div>\r\n\t\t\t<div class=\"form-group\" ng-show=\"!scene\" style=\"width:50%\">\r\n\t\t\t\t<div ng-if=\"film.scenes.length && !scene\" ppg-carousel=\"film.scenes\">\r\n\t\t\t\t\t<img ng-repeat=\"scene in film.scenes track by scene._id\"\r\n\t\t\t\t\tng-src=\"{{scene.screenshot||'img/web/scene001.jpg'}}\"\r\n\t\t\t\t\talt=\"{{scene.name}}\"\r\n\t\t\t\t\tstyle=\"margin-right:5px;height:34px\"\r\n\t\t\t\t\tng-click=\"selectScene(scene)\"/>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</form>\r\n\t</div>\r\n</div>\r\n\r\n<!-- Item selector -->\r\n<uib-tabset active=\"active\" class=\"frame frame-bottom pink\">\r\n\t<uib-tab index=\"-1\" heading=\"Places\">\r\n\t\t<div style=\"padding:10px\" ppg-carousel=\"allitems.backgrounds.items\">\r\n\t\t\t<img ng-repeat=\"bg in allitems.backgrounds.items\"\r\n\t\t\tclass=\"item\"\r\n\t\t\tng-class=\"{disabled:record}\"\r\n\t\t\tng-src=\"{{bg.src}}\"\r\n\t\t\tstyle=\"margin-right:5px\"\r\n\t\t\tng-click=\"setBackground(bg)\"/>\r\n\t\t</div>\r\n\t</uib-tab>\r\n\t<uib-tab ng-repeat=\"section in allitems.sections\" index=\"$index\">\r\n\t\t<uib-tab-heading>{{section.id}}</uib-tab-heading>\r\n\t\t<div style=\"padding:10px\" ppg-carousel=\"section.items\">\r\n\t\t\t<img ng-repeat=\"item in section.items\"\r\n\t\t\tclass=\"item\"\r\n\t\t\tng-class=\"{disabled:addDisabled || record}\"\r\n\t\t\tng-src=\"{{item | imgsrc:'sm'}}\"\r\n\t\t\tstyle=\"margin-right:5px\"\r\n\t\t\tng-click=\"addItem(item)\"/>\r\n\t\t</div>\r\n\t</uib-tab>\r\n</uib-tabset>\r\n\r\n<!-- Scene -->\r\n<div class=\"fill scene\">\r\n\t<div class=\"element-container fill\" ppg-play=\"play\" style=\"background-image:url('{{scene.background.src}}')\">\r\n\t\t<div class=\"trash-container\" ppg-overlap=\"film.scenes\">\r\n\t\t\t<a class=\"action trash-can\" ppg-overlap=\"film.scenes\" on-overlap=\"overlaps(item)\"><i class=\"fa fa-trash\"></i></a>\r\n\t\t</div>\r\n\t\t<img ng-repeat=\"item in scene.items\"\r\n\t\t\tid=\"{{item.eid}}\"\r\n\t\t\tclass=\"element\"\r\n\t\t\tppg-draggable\r\n\t\t\tppg-flip\r\n\t\t\tppg-record=\"item.buffer\"\r\n\t\t\tppg-effects=\"item.effects\"\r\n\t\t\ton-ppg-drop=\"itemDropped\"\r\n\t\t\trecord=\"record\" play=\"play\"\r\n\t\t\tng-src=\"{{item | imgsrc:'xl'}}\" />\r\n\t</div>\r\n</div>\r\n"

	this.$get = function() {
		return this;
	}
});
