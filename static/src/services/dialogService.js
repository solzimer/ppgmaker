angular.module("ppgmaker").service("dialogService",function($q, $uibModal, template){

	this.confirmRemove = function(name) {
		return $uibModal.open({
      animation: true,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      template: template.delete_item,
      controller: 'DeleteItemController',
      controllerAs: '$ctrl',
      resolve: {
				item: ()=>name
      }
    }).result;
	}
});
