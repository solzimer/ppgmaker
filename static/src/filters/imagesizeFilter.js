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
