angular.module("ppgmaker").service("fileService",function($q){

	var ready = $q((resolve,reject)=>{
		window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, function (fs) {
	    console.log('file system open: ' + fs.name);
	    resolve(fs);
		},
		reject);
	});

	ready.catch(err=>{
		console.warn("File system not available",err);
	});

	function getFile(dirEntry,fileName,opts) {
		return $q((resolve,reject)=>{
			dirEntry.getFile(fileName, opts, resolve, reject);
		});
	}

	function readFileAsBlob(fileEntry) {
		return $q((resolve,reject)=>{
			fileEntry.file(file=>{
				let reader = new FileReader();
				reader.onloadend = function() {
					let blob = new Blob([new Uint8Array(this.result)], {type:type});
					resolve(blob);
				};
				reader.readAsArrayBuffer(file);
			});
		});
	}

	this.readAsBlob = function(fileName,type) {
		return ready.
			then(fs=>fs.root).
			then(dirEntry=>getFile(dirEntry,fileName,{create:false,exclusive:false})).
			then(fileEntry=>readFileAsBlob(fileEntry,type));
	}
});
