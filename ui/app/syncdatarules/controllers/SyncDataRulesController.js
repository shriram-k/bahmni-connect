"use strict";

angular.module("syncdatarules").controller("SyncDataRulesController", [
  "$scope",
  "offlineDbService","offlineService",
  function ($scope, offlineDbService,offlineService) {

    $('.selected-items-box').unbind('click').bind('click', function(e) {

      if(e.currentTarget.id == "Province-select") {
        $('.Province-list').slideToggle('fast');
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
      showValidationError: false,
      isDataAvailable: false
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

		$scope.loadState = function(){
      $scope.state;
      $scope.addresses;
      for(let key in $scope.addresses)
      {
        let idToHide = '#'+ key.split("_")[1] + '-block';
        if(key.split("_")[1] === '0'){
          $scope.idsToShow.push(idToHide);
        }
      }
    };

    $scope.handleDropDowns = function(selectedId) {
      console.log(selectedId);
      let targetToShow = parseInt(selectedId) + 1;
      targetToShow += '-block';
      let temp ='#'+targetToShow;
      $scope.idsToShow.push(temp);
      $(temp).show();
    };

    $scope.display = function(idOfBlock){
      let temp = '#' + idOfBlock + '-block';
      if($scope.idsToShow.indexOf(temp) == -1)
        return false;
        else 
        return true;
    }

    $scope.sync = function(){
      
      if($scope.selectedProvinceNames().length === 0){
        $scope.state.showValidationError = true;
      }else{
        var config = { "strategy": $scope.state.sync_stratergy, "Province": $scope.selectedProvinceNames(), "District": $scope.selectedDistrictNames(), "Facility": $scope.selectedFacilityNames() };
        var filters = config.Province + (config.District.length !=0 ? ("-" +  config.District) : "") + (config.Facility.length !=0 ? ("-" + config.Facility) : "");
        console.log('Filters' , filters);
        $scope.state.showValidationError = false;
        //Override Marker.filters
        //if($scope.state.sync_stratergy === "selective"){
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
        //}
      }
    };



    $scope.addresses = {}
    $scope.idsToShow = [];

    $scope.populateList = function () {
      offlineDbService.getAddressesHeirarchyLevels().then(function (levels) {

        levels.forEach(function (level, index) {
          offlineDbService.getAllAddressesByLevelId(level.addressHierarchyLevelId).then(function (address) {
            //$scope.addresses[`level_${index}`] = address;  
            $scope.addresses[`${level.name}_${index}`] = address; 
            $('#loadData').click(); 
          });
        });
        
      });
		};
  
    //populateList();
  },
]);
