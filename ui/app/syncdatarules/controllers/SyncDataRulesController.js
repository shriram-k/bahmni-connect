"use strict";

angular.module("syncdatarules").controller("SyncDataRulesController", [
  "$scope",
  "offlineDbService",
  function ($scope, offlineDbService) {
    var LEVEL_PROVINCE;
    var LEVEL_DISTRICT;

    $scope.provinceAddressList = [];
		$scope.districtAddressList = [];
		
    $scope.isSelectVisible = false;
    $scope.validationError = "** Please Select Province & District";

    $scope.showValidationError = false;

    var addProviceAddress = function (address) {
      $scope.provinceAddressList.push(address);
    };

    var addDistrictAddress = function (address) {
      $scope.districtAddressList.push(address);
		};

		$scope.showSelect = function(val){
      $scope.isSelectVisible = val == 'Y';
      if( val == 'N') $scope.showValidationError = false;
    }
    
    $scope.sync = function(filters){
      console.log('Filters' ,filters);
      if(filters.sync_stratergy == "selective" && ["", undefined].includes(filters.province) && ["", undefined].includes(filters.district)){
        $scope.showValidationError = true;
      }else{
        $scope.showValidationError = false;
        // below code is for makng backend post call
        // $http({
        //   url: 'request-url',
        //   method: "POST",
        //   data: filters
        // })
        // .then(function(response) {
        //         // success
        // }, 
        // function(response) { // optional
        //         // failed
        // });
      }


    }

    $scope.populateList = function () {
      offlineDbService.getAddressesHeirarchyLevels().then(function (levels) {
        var levelIds = levels.map((id) => id.addressHierarchyLevelId);
        LEVEL_PROVINCE = levelIds[0];
        LEVEL_DISTRICT = levelIds[1];

        levelIds.forEach(function (id) {
          offlineDbService.getAllAddressesByLevelId(id).then(function (add) {
            if (id === LEVEL_PROVINCE) {
              add.map((address) => addProviceAddress(address));
            } else if (id === LEVEL_DISTRICT) {
              add.map((address) => addDistrictAddress(address));
					}
          });
        });
      });
		};
		
    $scope.populateList();
  },
]);
