"use strict";

angular.module("syncdatarules").controller("SyncDataRulesController", [
  "$scope","offlineDbService","offlineService",'schedulerService', "ngDialog",
  function ($scope, offlineDbService,offlineService,schedulerService,ngDialog) {

    $('.selected-items-box').unbind('click').bind('click', function(e) {

      if(e.currentTarget.id == "province-select") {
        $('.province-list').slideToggle('fast');
      }
      else if(e.currentTarget.id == "district-select") {
        $('.district-list').slideToggle('fast');
      }
      else if(e.currentTarget.id == "facility-select") {
        $('.facility-list').slideToggle('fast');
      }

    });

    $(document).mouseup(function(e)
    {
      var container = new Array();
      container.push($('.list'));
      $.each(container, function(key, value) {
        if (!$(value).is(e.target) // if the target of the click isn't the container...
            && $(value).has(e.target).length === 0) // ... nor a descendant of the container
        {
            $(value).hide();
        }
      });
    });

    var LEVEL_PROVINCE;
    var LEVEL_DISTRICT;
    var LEVEL_FACILITY;

    var districtAddressList = [];
    var facilityAddressList = [];

    $scope.state = {
      sync_stratergy: "full",
      provinceAddressList: [],
      filteredDistrictList: [],
      filteredFacilityList: [],
      isSelectVisible: false,
      validationError: "** Please Select Province **", 
      showValidationError: false
    };

    var addProviceAddress = function (address) {
      $scope.state.provinceAddressList.push(address);
    };

    var addDistrictAddress = function (address) {
      districtAddressList.push(address);
    };

    var addFacilityAddress = function (address) {
      facilityAddressList.push(address);
    };

    $scope.filterDistrict = function () {
      resetSecondaryFilters();
      var selectedProvincesParentIds =  $scope.state.provinceAddressList.filter(province => province.selected).map(province => province.id);
      $scope.state.filteredDistrictList = districtAddressList.filter(dist => selectedProvincesParentIds.includes(dist.parentId));
    };

    $scope.filterFacility = function() {
      var selectedDistrictParentIds =  districtAddressList.filter(district => district.selected).map(district => district.id);
      $scope.state.filteredFacilityList = facilityAddressList.filter(fac => selectedDistrictParentIds.includes(fac.parentId));
    };

    $scope.selectedProvinceNames = function() {
      return $scope.state.provinceAddressList.filter(
        province => province.selected
      ).map(prov => prov.name)
    };

    $scope.selectedDistrictNames = function() {
      return $scope.state.filteredDistrictList.filter(
        dist => dist.selected
      ).map(prov => prov.name)
    };

    $scope.selectedFacilityNames = function() {
      return $scope.state.filteredFacilityList.filter(
        fac => fac.selected
      ).map(fac => fac.name)
    };

    var resetSecondaryFilters = function () {
      $scope.state.filteredDistrictList = [];
      $scope.state.filteredFacilityList = [];
    };

    $scope.resetAllFilters = function () {
      $scope.state.filteredDistrictList = [];
      $scope.state.filteredFacilityList = [];
      $scope.state.provinceAddressList.map(province => province.selected = false)
    };

		$scope.showSelect = function(val){
      $scope.state.isSelectVisible = val == 'Y';
      if( val == 'N') $scope.state.showValidationError = false;
    };

    //check if table has data then only show popup.

    $scope.confirmDelete = function () {
      ngDialog.open({
          template: 'views/deleteSyncDataConfirm.html',
          class: 'ngdialog-theme-default',
          closeByEscape: true,
          closeByDocument: false,
          showClose: true,
          scope: $scope

      });
    };

    $scope.cancelDialog = function () {
      ngDialog.close();
    }

    $scope.sync = function(){

      ngDialog.close();

      if($scope.state.sync_stratergy == "selective" && $scope.selectedProvinceNames().length === 0){
        $scope.state.showValidationError = true;
      }else{

        offlineDbService.deleteRecordsFromTable('patient');
        offlineDbService.deleteRecordsFromTable('encounter');

        var config = { "strategy": $scope.state.sync_stratergy, "Province": $scope.selectedProvinceNames(), "District": $scope.selectedDistrictNames(), "Facility": $scope.selectedFacilityNames() };
        var filters = config.Province + (config.District.length !=0 ? ("-" +  config.District) : "") + (config.Facility.length !=0 ? ("-" + config.Facility) : "");
        console.log('Filters' , filters);
        $scope.state.showValidationError = false;
        //Override Marker.filters
        if($scope.state.sync_stratergy === "selective"){
          let categories = offlineService.getItem("eventLogCategories");
        _.forEach(categories, function (category) {
          if(category === "patient" || category === "encounter"){
           offlineDbService.getMarker(category).then(function(marker){
            let tempMarkers = [];
              _.forEach(marker.filters, function(markerEntry){
                let filter = markerEntry.split("-")[0];
                filter = filter + "-" + filters;
                tempMarkers.push(filter);
              });
              offlineDbService.insertMarker(marker.markerName, marker.lastReadEventUuid, tempMarkers);
          });
        }
      });
       // logic to go to offlineSync service sync()
        }
        else{
          // logic to go to offlineSync service sync()
          let categories = offlineService.getItem("eventLogCategories");
        _.forEach(categories, function (category) {
          if(category === "patient" || category === "encounter"){
           offlineDbService.getMarker(category).then(function(marker){
            let tempMarkers = [];
              _.forEach(marker.filters, function(markerEntry){
                let filter = markerEntry.split("-")[0];
                tempMarkers.push(filter);
              });
              offlineDbService.insertMarker(marker.markerName, marker.lastReadEventUuid, tempMarkers);
          });
        }
      });
        }

        schedulerService.sync(Bahmni.Common.Constants.syncButtonConfiguration);
      }
    };

    var populateList = function () {
      offlineDbService.getAddressesHeirarchyLevels().then(function (levels) {
        var levelIds = levels.map((id) => id.addressHierarchyLevelId);
        LEVEL_PROVINCE = levelIds[2];
        LEVEL_DISTRICT = levelIds[1];
        LEVEL_FACILITY = levelIds[0];

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
