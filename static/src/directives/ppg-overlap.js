angular.module('ppgmaker').directive("ppgOverlap",function(styleService) {
	function overlap(rect1,rect2) {
		return !(
			rect1.right < rect2.left ||
			rect1.left > rect2.right ||
			rect1.bottom < rect2.top ||
			rect1.top > rect2.bottom
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
