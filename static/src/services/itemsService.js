angular.module("ppgmaker").service("itemsService",function($http){
	var prModel = false;
	var self = this;

	this.model = {};

	this.get = function() {
		if(!prModel) {
			prModel = $http.
				get("data/allitems.json").
				then(function(res){
					angular.extend(self.model,res.data);
					return self.model;
				});
		}
		return prModel;
	}
});
