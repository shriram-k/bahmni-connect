"use strict";

angular.module("syncdatarules").controller("SyncDataRulesController", [
  "$scope",
  "offlineDbService", "offlineService",
  function ($scope, offlineDbService, offlineService) {

    $scope.state = {
      sync_stratergy: "selective",
      validationError: "** Please Select Province **",
      showValidationError: false,
      isDataAvailable: false
    };

    $scope.selecteLevelNames = function (level) {
      if ($scope.addressesToFilter.hasOwnProperty(level)) {
        return $scope.addressesToFilter[level].filter(
          address => address.selected
        ).map(prov => prov.name)
      }
    };

    $scope.getLevel = function (levelKey) {
      return levelKey.split("_")[1];
    };

    $scope.getLevelName = function (levelKey) {
      return levelKey.split("_")[0];
    };

    $scope.filterLevels = function (level) {
      let levelIndex = $scope.getLevel(level);
      let targetId = getTargetID(levelIndex, true);
      $scope.verifyLevelHasSelected(level, targetId);
      var selectedParentIds = $scope.addressesToFilter[level].filter(province => province.selected).map(province => province.id);
      var indexToMatch = parseInt(levelIndex) + 1;
      for (let key in $scope.addressesToFilter) {
        if (key.includes(indexToMatch)) {
          let tempAddresses = angular.copy($scope.addresses);
          $scope.addressesToFilter[key] = tempAddresses[key].filter(levelToFilter => selectedParentIds.includes(levelToFilter.parentId));
          break;
        }
      }
    };

    $scope.verifyLevelHasSelected = function (level, targetId) {
      let levelIndex = $scope.getLevel(level); //0,1,2
      let selectedLevelLength = $scope.addressesToFilter[level].filter(hierarchyLevel => hierarchyLevel.selected).length;
      if (levelIndex == 0 && selectedLevelLength == 0) {
        $scope.idsToShow = [];
        $scope.idsToShow.push(getTargetID(levelIndex, false))
      }
      else if (levelIndex != 0 && selectedLevelLength == 0) {
        //we need to visit indexes post current level and hide all of them
        let indexToMatch = parseInt(levelIndex) + 1;
        for (let key in $scope.addressesToFilter) {
          if (key.includes(indexToMatch)) {
            $scope.idsToShow = $scope.removeLevelToBeHidden(getTargetID(levelIndex, true));
          }
        }
      }
      else {
        $scope.idsToShow.push(targetId);
      }
    };

    let getTargetID = function (levelIndex, next) {
      let targetToToggle = (next ? parseInt(levelIndex) + 1 : levelIndex);
      targetToToggle += '-block';
      let targetId = '#' + targetToToggle;
      return targetId;
    };

    $scope.removeLevelToBeHidden = function (value) {
      return $scope.idsToShow.filter(function (ele) {
        return ele != value;
      });
    }

    var resetSecondaryFilters = function () {
      $scope.state.filteredDistrictList = [];
      $scope.state.filteredFacilityList = [];
    };

    $scope.resetAllFilters = function () {
      $scope.state.filteredDistrictList = [];
      $scope.state.filteredFacilityList = [];
      $scope.state.provinceAddressList.map(province => province.selected = false)
    };

    $scope.openDropDown = function (dropDownId) {
      let targetClass = '.' + $scope.getLevelName(dropDownId) + '-list';
      $(targetClass).slideToggle('fast');
    };

    $scope.loadState = function () {
      $scope.state;
      $scope.addresses;
      for (let key in $scope.addresses) {
        let levelIndex = $scope.getLevel(key);
        let idToHide = '#' + levelIndex + '-block';
        if (levelIndex === '0') {
          $scope.idsToShow.push(idToHide);
        }
      }
    };

    $scope.display = function (idOfBlock) {
      let temp = '#' + idOfBlock + '-block';
      if ($scope.idsToShow.indexOf(temp) == -1)
        return false;
      else
        return true;
    }
    $scope.addresses = {}
    $scope.addressesToFilter = {};
    $scope.idsToShow = [];

    let selectedLevelLength = function (addresses, level) {
      return addresses[level].filter(hierarchyLevel => hierarchyLevel.selected).length;
    };

    var getSelectedLevelNames = function (obj) {
      var names = [];
      for (var key in obj) {
        names.push(obj[key].name);
      }
      return names;
    }

    $scope.removeFromSelectedList = function(name, level){
      let levelDetails = $scope.addressesToFilter[level];
      for(let key in levelDetails){
          if(levelDetails[key].name === name){
            levelDetails[key].selected = false;
          }
      }
      $scope.filterLevels(level);
    };

    $scope.sync = function () {
      let selectedAddresses = angular.copy($scope.addressesToFilter);
      let filters = "";
      for (let key in selectedAddresses) {
        selectedAddresses[key] = selectedAddresses[key].filter(level => level.selected);
        if (selectedLevelLength(selectedAddresses, key) != 0 && key.includes('0')) {
          filters += getSelectedLevelNames(selectedAddresses[key]);
          $scope.state.showValidationError = false;
        }
        else if (selectedLevelLength(selectedAddresses, key) != 0 && !key.includes('0')) {
          filters += "-" + getSelectedLevelNames(selectedAddresses[key]);
        }
        else {
          if (key.includes('0')) {
            $scope.state.showValidationError = true;
          }
        }
      }

      // if ($scope.selectedProvinceNames().length === 0) {
      //   $scope.state.showValidationError = true;
      // } else {
      //   var config = { "strategy": $scope.state.sync_stratergy, "Province": $scope.selectedProvinceNames(), "District": $scope.selectedDistrictNames(), "Facility": $scope.selectedFacilityNames() };
      //   var filters = config.Province + (config.District.length != 0 ? ("-" + config.District) : "") + (config.Facility.length != 0 ? ("-" + config.Facility) : "");



      //   $scope.state.showValidationError = false;

      //   let categories = offlineService.getItem("eventLogCategories");
      //   _.forEach(categories, function (category) {
      //     if (category === "patient" || category === "encounter") {
      //       offlineDbService.getMarker(category).then(function (marker) {
      //         let tempMarkers = [];
      //         _.forEach(marker.filters, function (markerEntry) {
      //           let filter = markerEntry.split("-")[0];
      //           filter = filter + "-" + filters;
      //           tempMarkers.push(filter);
      //         });
      //         offlineDbService.insertMarker(marker.markerName, marker.lastReadEventUuid, tempMarkers);
      //       });
      //     }
      //   });
      // }
    };

    $scope.populateList = function () {
      offlineDbService.getAddressesHeirarchyLevels().then(function (levels) {

        levels.forEach(function (level, index) {
          offlineDbService.getAllAddressesByLevelId(level.addressHierarchyLevelId).then(function (address) {
            //$scope.addresses[`level_${index}`] = address;  
            $scope.addresses[`${level.name}_${index}`] = address.sort(function(a, b) { 
              return a.name.localeCompare(b.name);
            });
            $scope.addressesToFilter[`${level.name}_${index}`] = address;
            $('#loadData').click();
          });
        });

      });
    };

    //populateList();
  },
]);
