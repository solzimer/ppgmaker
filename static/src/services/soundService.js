angular.module("ppgmaker").service("soundService",function($q,audio,fileService){

	class BrowserAudioRecorder extends audio.AudioRecorder {
		constructor(id) {
			super(id);
			this._media = null;
			this._ready = null;
			this._callbacks["success"] = [];
			this._callbacks["error"] = [];
			this._blob = $q.defer();
			this._init();
		}

		_error(err) {this._callbacks.success.forEach(c=>c(err));}
		_success() {this._callbacks.success.forEach(c=>c());}

		_init() {
			this._ready = navigator.mediaDevices.getUserMedia({audio:true}).
				then(stream => {
					const chunks = [];
					this._media = new MediaRecorder(stream);
					this._media.ondataavailable = (event) => {
						chunks.push(event.data);
						if (this._media.state == 'inactive') {
							let blob = new Blob(chunks, {type: 'audio/webm'});
							this._success();
							this._blob.resolve(blob);
						}
					}
				}).
				catch(err => {
					this._error(err)
				});
		}

		startRecord() {this._ready.then(()=>this._media.start());}
		stopRecord() {this._ready.then(()=>this._media.stop()).catch(err=>console.warn(err));}
		pauseRecord() {this._ready.then(()=>this._media.pause());}
		resumeRecord() {this._ready.then(()=>this._media.resume());}
		blob(){return this._blob.promise;}
	}

	class BrowserAudioPlayer extends audio.AudioPlayer {
		constructor(id,blob) {
			super(id);
			this._elem = null;
			this._callbacks["success"] = [];
			this._callbacks["error"] = [];
			this._blob = blob;
			this._init();
		}

		_error(err) {this._callbacks.success.forEach(c=>c(err));}
		_success() {this._callbacks.success.forEach(c=>c());}

		_init() {
			let elem = document.getElementById("ppgm_audio_item");
			if(!elem) {
				elem = document.createElement("audio");
				elem.id = "ppgm_audio_item";
				document.body.appendChild(elem);
			}
			this._elem = elem;
			this._elem.src = URL.createObjectURL(this._blob);
		}

		play() {this._elem.play();}
		pause() {this._elem.pause();}
		stop() {this._elem.pause();}
		resume() {this._elem.play();}
		release() {}
	}

	class CordovaAudioRecorder extends audio.AudioRecorder {
		constructor(id) {
			super(id);
			this._src = `${id}.m4a`;
			this._media = new Media(this._src,()=>this._success(),err=>this._error(err));
			this._callbacks["success"] = [];
			this._callbacks["error"] = [];
		}

		_error(err) {this._callbacks.success.forEach(c=>c(err));}
		_success() {this._callbacks.success.forEach(c=>c());}
		startRecord() {this._media.startRecord();}
		stopRecord() {this._media.stopRecord();}
		pauseRecord() {this._media.pauseRecord();}
		resumeRecord() {this._media.resumeRecord();}
		release() {this._media.release();}
		blob() {return fileService.readAsBlob(this._src,"audio/m4a");}
	}

	class CordovaAudioPlayer extends audio.AudioPlayer {
		constructor(id,blob) {
			super(id);
			this._src = `${id}.m4a`;
			this._ready = null;
			this._media = null;
			this._callbacks["success"] = [];
			this._callbacks["error"] = [];
			this._init(this._src,blob);
		}
		_init(src,blob) {
			this._ready = fileService.
				writeBlob(src,blob).
				then(()=>{
					this._media = new Media(src,()=>this._success(),err=>this._error(err));
					return this._media;
				});
		}
		_error(err) {this._callbacks.success.forEach(c=>c(err));}
		_success() {this._callbacks.success.forEach(c=>c());}
		play() {this._ready.then(m=>m.play());}
		pause() {this._ready.then(m=>m.pause());}
		resume() {this._ready.then(m=>m.resume());}
		stop() {this._ready.then(m=>m.stop());}
		release() {this._ready.then(m=>m.release());}
	}

	this.recorder = function(id) {
		if(window.isCordova) {
			return new CordovaAudioRecorder(id);
		}
		else {
			return new BrowserAudioRecorder(id);
		}
	}

	this.player = function(id,blob) {
		if(window.isCordova) {
			return new CordovaAudioPlayer(id,blob);
		}
		else {
			return new BrowserAudioPlayer(id,blob);
		}
	}

});
