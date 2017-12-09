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
