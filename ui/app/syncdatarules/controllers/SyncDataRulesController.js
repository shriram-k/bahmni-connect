"use strict";

angular.module("syncdatarules").controller("SyncDataRulesController", [
  "$scope","offlineDbService", "offlineService", 'schedulerService', 'eventQueue','spinner', "$q",
  function ($scope, offlineDbService, offlineService, schedulerService, eventQueue,spinner, $q) {

  

    $scope.isOfflineApp = offlineService.isOfflineApp();

    var init = function () {
      console.log("in sync data rules init: ", $scope.isOfflineApp);
      if ($scope.isOfflineApp) {
          setWatchersForErrorStatus();
      }
  };

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
          indexToMatch = indexToMatch + 1 ;
        }
      }
    };

    $scope.verifyLevelHasSelected = function (level, targetId) {
      let levelIndex = $scope.getLevel(level); //0,1,2...
      let selectedLevelLength = $scope.addressesToFilter[level].filter(hierarchyLevel => hierarchyLevel.selected).length;
      if (levelIndex == 0 && selectedLevelLength == 0) {
        $scope.idsToShow = [];
        $scope.idsToShow.push(getTargetID(levelIndex, false))
      }
      else if (levelIndex != 0 && selectedLevelLength == 0) {
        let indexToMatch = parseInt(levelIndex) + 1;
        for (let key in $scope.addressesToFilter) {
          if (key.includes(indexToMatch)) {
            $scope.idsToShow = $scope.removeLevelToBeHidden(getTargetID(levelIndex, true));
            indexToMatch = indexToMatch + 1 ;
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

    $scope.isParentSelected = function (key) {
      let parentLevelId = parseInt($scope.getLevel(key)) - 1;
      parentLevelId = parentLevelId >= 0 ? parentLevelId : -1;
      let addressCopy = angular.copy($scope.addressesToFilter);
      if (parentLevelId == -1)
        return true;
      else {
        for (key in addressCopy) {
          if (key.includes(parentLevelId)) {
            let selectedLevelLength = addressCopy[key].filter(hierarchyLevel => hierarchyLevel.selected).length;
            return selectedLevelLength == 0 ? false : true;
          }
        }
      }
    };

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
  var cleanUpListenerSchedulerStage = $scope.$on("schedulerStage", function (event, stage, restartSync) {
      $scope.isSyncing = (stage !== null);
      if (restartSync) {
          schedulerService.stopSync();
          schedulerService.sync();
      }
  });

  $scope.$on("$destroy", cleanUpListenerSchedulerStage);

    $scope.getStatusStyleCode = function () {
      return $scope.syncStatusMessage && ($scope.syncStatusMessage.match(/.*Success.*/i) ? 'success' : $scope.syncStatusMessage.match(/.*Pending.*/i) ? 'pending' : $scope.syncStatusMessage.match(/.*Failed.*/i) ? 'fail' : 'inProgress');
    };

    var getLastSyncTime = function () {
      var date = offlineService.getItem('lastSyncTime');
      var localeDate = Bahmni.Common.Util.DateUtil.parseServerDateToDate(date);
      $scope.lastSyncTime = Bahmni.Common.Util.DateUtil.getDateTimeInSpecifiedFormat(localeDate, "dddd, MMMM Do YYYY, HH:mm:ss");
    };

    var getErrorCount = function () {
      return eventQueue.getErrorCount().then(function (errorCount) {
        return errorCount;
      });
    };

    var getEventCount = function () {
      return eventQueue.getCount().then(function (eventCount) {
        return eventCount;
      });
    };

    var updateSyncStatusMessageBasedOnQueuesCount = function () {
      getErrorCount().then(function (errorCount) {
        if (errorCount) {
          $scope.syncStatusMessage = Bahmni.Common.Constants.syncStatusMessages.syncFailed;
        } else {
          getEventCount().then(function (eventCount) {
            $scope.syncStatusMessage = eventCount ? Bahmni.Common.Constants.syncStatusMessages.syncPending : updateLastSyncTimeOnSuccessfullSyncAnReturnSuccessMessage();
          });
        }
      });
    };

    var updateLastSyncTimeOnSuccessfullSyncAnReturnSuccessMessage = function () {
      if ($scope.isSyncing !== undefined) {
        offlineService.setItem('lastSyncTime', new Date());
        getLastSyncTime();
      }
      return Bahmni.Common.Constants.syncStatusMessages.syncSuccess;
    };

    var getSyncStatusInfo = function () {
      getLastSyncTime();
      $scope.isSyncing ? $scope.syncStatusMessage = "Sync in Progress..." : updateSyncStatusMessageBasedOnQueuesCount();
    };
    getSyncStatusInfo();

    var setErrorStatusOnErrorsInSync = function () {
      offlineDbService.getAllLogs().then(function (errors) {
          $scope.errorsInSync = !!errors.length;
      });
  };

    var setWatchersForErrorStatus = function () {
      $scope.$watch('isSyncing', function () {
          getSyncStatusInfo();
          setErrorStatusOnErrorsInSync();
      });
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
        //Override Marker.filters
        if ($scope.state.sync_stratergy === "selective") {
          let categories = offlineService.getItem("eventLogCategories");
          _.forEach(categories, function (category) {
            if (category === "patient" || category === "encounter") {
              offlineDbService.getMarker(category).then(function (marker) {
                let tempMarkers = [];
                _.forEach(marker.filters, function (markerEntry) {
                  let filter = markerEntry.split("-")[0];
                  filter = filter + "-" + filters;
                  tempMarkers.push(filter);
                });
                offlineDbService.insertMarker(marker.markerName, marker.lastReadEventUuid, tempMarkers);
              });
            }
          });
          // logic to go to offlineSync service sync()
          schedulerService.sync(Bahmni.Common.Constants.syncButtonConfiguration);
        }

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


    return spinner.forPromise($q.all(init()));
  },
]);
