angular.module("ppgmaker").service("styleService",function(){
	var self = this;
	var uid = 0;

	this.model = {};

	function elemId(elem) {
		if(typeof(elem)=="string") return elem;
		else {
			elem = $(elem);
			if(!elem.attr("id"))
				elem.attr("id","_ppgm_"+(uid++));
			return elem.attr("id");
		}
	}

	this.id = function(elem) {
		return elemId(elem);
	}

	this.get = function(id) {
		id = elemId(id);
		return angular.extend({},this.model[id] || {});
	}

	this.set = function(id,props) {
		id = elemId(id);
		if(!this.model[id]) this.model[id] = {};
		angular.extend(this.model[id],props);
	}

	this.unset = function(id,props) {
		id = elemId(id);
		if(this.model[id]) {
			var style = this.model[id];
			for(var i in props) {
				delete style[i];
			}
		}
	}

	this.remove = function(id) {
		id = elemId(id);
		delete this.model[id];
	}

	this.clean = function() {
		Object.keys(this.model).forEach(k=>{
			delete this.model[k];
		});
	}
});
