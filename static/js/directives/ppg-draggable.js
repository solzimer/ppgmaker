angular.module('ppgmaker').directive("ppgDraggable",function($q) {

	function link(scope,elem,attrs) {
		var drg = $(elem).draggable();

		scope.$on("$destroy",function(){
			drg.destroy();
		});
	}

	return {
		link : link
	}
});
