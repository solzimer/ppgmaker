angular.module("ppgmaker").service("soundService",function($q,fileService){

	class Sound {
		constructor(id) {
			this.id = id;
			this._callbacks = {};
		}

		on(evt,callback) {
			this._callbacks[evt] = this._callbacks[id] || [];
		}

		startRecord() {}
		stopRecord() {}
		pauseRecord() {}
		resumeRecord() {}
		play() {}
		pause() {}
		resume() {}
		release() {}
		blob(){}
	}

	class CordovaSound extends Sound {
		constructor(id) {
			super(id);
			this._src = `${id}.m4a`;
			this._media = new Media(this._src,()=>this._success(),err=>this._error(err));
			this._callbacks["success"] = [];
			this._callbacks["error"] = [];
		}

		_error(err) {this._callbacks.success.forEach(c=>c(err));}
		_success() {this._callbacks.success.forEach(c=>c());}
		startRecord(id) {this._media.startRecord();}
		stopRecord() {this._media.stopRecord();}
		pauseRecord() {this._media.pauseRecord();}
		resumeRecord() {this._media.resumeRecord();}
		play() {this._media.play();}
		pause() {this._media.pause();}
		stop() {this._media.stop();}
		release() {this._media.release();}
		blob() {return fileService.readAsBlob(this._src,"audio/m4a");}
	}


	this.create = function(id) {
		if(window.isCordova) {
			return new CordovaSound(id);
		}
		else {
			return new Sound(id);
		}
	}

});
