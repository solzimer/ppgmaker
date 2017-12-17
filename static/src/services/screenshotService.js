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
		return takeBrowser(elem,w,h);
	}
});
