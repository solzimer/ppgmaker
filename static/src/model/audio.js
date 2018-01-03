angular.module("ppgmaker").provider("audio",function(){
	class AudioRecorder {
		constructor(id) {this.id = id; this._callbacks = {};}
		on(evt,callback) {this._callbacks[evt] = this._callbacks[id] || [];}
		startRecord() {}
		stopRecord() {}
		pauseRecord() {}
		resumeRecord() {}
		release() {}
		blob(){}
	}

	class AudioPlayer {
		constructor(id) {this.id = id; this._callbacks = {};}
		on(evt,callback) {this._callbacks[evt] = this._callbacks[id] || [];}
		play() {}
		pause() {}
		resume() {}
		stop() {}
		release() {}
	}

	this.AudioRecorder = AudioRecorder;
	this.AudioPlayer = AudioPlayer;
	this.$get = function() {
		return this;
	}
});
