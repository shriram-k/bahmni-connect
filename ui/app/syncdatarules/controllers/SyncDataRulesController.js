"use strict";

angular.module("syncdatarules").controller("SyncDataRulesController", [
  "$scope",
  "$http",
  "offlineDbService",
  "spinner",
  function ($scope, $http, offlineDbService, spinner) {

    $('.selected-items-box').unbind('click').bind('click', function(e) {
      console.log("sliding " + e.target.id);

      if(e.target.id == "province-select") {
        $('.wrapper .province-list').slideToggle('fast');
      }
      else if(e.target.id == "district-select") {
        $('.wrapper .district-list').slideToggle('fast');
      }
      else if(e.target.id == "facility-select") {
        $('.wrapper .facility-list').slideToggle('fast');
      }

    });

    var LEVEL_PROVINCE;
    var LEVEL_DISTRICT;
    var LEVEL_FACILITY;

    var districtAddressList = [];
    var facilityAddressList = [];

    $scope.filters = {
      sync_stratergy: "full"
    };

    $scope.provinceAddressList = [];
    $scope.filteredDistrictList = [];
    $scope.filteredFacilityList = [];

    $scope.isSelectVisible = false;
    $scope.validationError = "** Please Select Province";

    $scope.showValidationError = false;

    var addProviceAddress = function (address) {
      $scope.provinceAddressList.push(address);
    };

    var addDistrictAddress = function (address) {
      districtAddressList.push(address);
    };

    var addFacilityAddress = function (address) {
      facilityAddressList.push(address);
    };

    $scope.filterDistrict = function() {
      resetSecondaryFilters();
      var selectedProvincesParentIds =  $scope.provinceAddressList.filter(province => province.selected).map(province => province.id);
      $scope.filteredDistrictList = districtAddressList.filter(dist => selectedProvincesParentIds.includes(dist.parentId));
    };

    var resetSecondaryFilters = function () {
      $scope.filters.districtId = "";
      $scope.filters.facilityId = "";

      $scope.filteredDistrictList = [];
      $scope.filteredFacilityList = [];
    };

    $scope.resetAllFilters = function () {
      $scope.filters.provinceId = "";
      $scope.filters.districtId = "";
      $scope.filters.facilityId = "";

      $scope.filteredDistrictList = [];
      $scope.filteredFacilityList = [];
    };

    $scope.filterFacility = function() {
      $scope.filteredFacilityList = facilityAddressList.filter(fac => fac.parentId == $scope.filters.districtId);
    };

		$scope.showSelect = function(val){
      $scope.isSelectVisible = val == 'Y';
      if( val == 'N') $scope.showValidationError = false;
    };

    $scope.sync = function(filters){
      console.log('Filters' ,filters);
      if(filters.sync_stratergy == "selective" && ["", undefined].includes(filters.provinceId)){
        $scope.showValidationError = true;
      }else{
        $scope.showValidationError = false;
        // below code is for makng backend post call
        // var url = 
        /* return $http.post(url, filters, {
                withCredentials: true,
                headers: {"Accept": "application/json", "Content-Type": "application/json"}
           });
        */
      }
    };

    $scope.getAllCheckedProvince = function() {
      console.log('provinceAddressList', provinceAddressList)
    };

    var populateList = function () {
      offlineDbService.getAddressesHeirarchyLevels().then(function (levels) {
        var levelIds = levels.map((id) => id.addressHierarchyLevelId);
        LEVEL_PROVINCE = levelIds[0];
        LEVEL_DISTRICT = levelIds[1];
        LEVEL_FACILITY = levelIds[2];

        levelIds.forEach(function (id) {
          offlineDbService.getAllAddressesByLevelId(id).then(function (add) {
            if (id === LEVEL_PROVINCE) {
              add.map((address) => addProviceAddress(address));
            } else if (id === LEVEL_DISTRICT) {
              add.map((address) => addDistrictAddress(address));
					  } else if (id === LEVEL_FACILITY) {
              add.map((address) => addFacilityAddress(address));
	    		  }
          });
        });
      });
		};

    populateList();
  },
]);
