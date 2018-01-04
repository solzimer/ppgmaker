angular.module('ppgmaker').
controller("RenameItemController",function($uibModalInstance, item){
	let $ctrl = this;

  $ctrl.item = item;

  $ctrl.ok = function () {
    $uibModalInstance.close($ctrl.item);
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

});
