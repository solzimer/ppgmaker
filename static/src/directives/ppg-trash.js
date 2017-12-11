angular.module('ppgmaker').directive("ppgTrash",function(styleService) {
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
			let model = styleService.model;
			let ret = Object.keys(model).some(id=>{
				let elem = document.getElementById(id);
				let ebox = elem.getBoundingClientRect();
				return overlap(box,ebox);
			});
			if(ret) $(elem).addClass("overlap");
			else $(elem).removeClass("overlap");
		}
		fn();
	}

	return {
		link : link,
		scope : {
			ppgTrash : "="
		}
	}
});
