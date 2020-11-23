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
      let targetToShow = parseInt(levelIndex) + 1;
      targetToShow += '-block';
      let temp = '#' + targetToShow;
      $scope.verifyLevelHasSelected(level, temp);
      var selectedParentIds = $scope.addressesToFilter[level].filter(province => province.selected).map(province => province.id);
      var indexToMatch = parseInt(levelIndex) + 1;
      for (let key in $scope.addressesToFilter) {
        if (key.includes(indexToMatch)) {
          let tempAddresses = $scope.addresses;
          $scope.addressesToFilter[key] = tempAddresses[key].filter(levelToFilter => selectedParentIds.includes(levelToFilter.parentId));
          break;
        }
      }
    };

    $scope.verifyLevelHasSelected = function (level, temp) {
      let selectedLevelLength = $scope.addressesToFilter[level].filter(hierarchyLevel => hierarchyLevel.selected).length;
      if (selectedLevelLength == 0) {
        $scope.idsToShow = $scope.removeLevelToBeHidden(temp);
      }
      else {
        $scope.idsToShow.push(temp);
      }
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

    $scope.sync = function () {
      $scope.addressesToFilter;

      for (let key in $scope.addressesToFilter) {
        $scope.addressesToFilter[key] = $scope.addressesToFilter[key].filter(level => level.selected);
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
            $scope.addresses[`${level.name}_${index}`] = address;
            $scope.addressesToFilter[`${level.name}_${index}`] = address;
            $('#loadData').click();
          });
        });

      });
    };

    //populateList();
  },
]);
