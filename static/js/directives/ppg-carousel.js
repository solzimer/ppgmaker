angular.module('ppgmaker').directive("ppgCarousel",function($interval,styleService){
	var uid = 0;

	function link(scope, element, attrs) {
		scope.$watchCollection(()=>{
			return scope.$eval(element.attr("ppg-carousel"));
		},items=>{
			if(items && items.length) {
				$(element).slick({
					mobileFirst : true,
					arrows: false,
					slidesToScroll: 5,
					variableWidth: true
				});
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
