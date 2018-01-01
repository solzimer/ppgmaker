angular.module("ppgmaker").service("soundService",function($q){
	var media, src;

	this.startRecord = function(id) {
		return $q((resolve,reject)=>{
			let src = `${id}.wav`;
	    media = new Media(src,resolve,reject);
			media.startRecord();
		}).finally(()=>media.release());
	}

	this.stopRecord = function() {
		media.stopRecord();
	}

	this.pauseRecord = function() {
		media.pauseRecord();
	}

	this.resumeRecord = function() {
		media.resumeRecord();
	}

	this.play = function(id) {
		return $q((resolve,reject)=>{
			let src = `${id}.wav`;
	    media = new Media(src,resolve,reject);
			media.play();
		}).finally(()=>media.release());
	}

	this.pause = function() {
		media.pause();
	}

	this.stop = function() {
		media.stop();
	}
});
