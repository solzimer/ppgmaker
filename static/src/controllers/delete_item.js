angular.module('ppgmaker').
controller("DeleteItemController",function($uibModalInstance, item){
	let $ctrl = this;

  $ctrl.item = item;

  $ctrl.ok = function () {
    $uibModalInstance.close(true);
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

});
