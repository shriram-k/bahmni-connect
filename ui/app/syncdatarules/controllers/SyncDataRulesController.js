"use strict";

angular.module("syncdatarules").controller("SyncDataRulesController", [
    "$scope", "offlineDbService", "offlineService", 'schedulerService', 'eventQueue', 'spinner', "$q", "ngDialog",'$window',
    function ($scope, offlineDbService, offlineService, schedulerService, eventQueue, spinner, $q, ngDialog, $window) {
        $scope.isOfflineApp = offlineService.isOfflineApp();

        var init = function () {
            console.log("in sync data rules init: ", $scope.isOfflineApp);
            if ($scope.isOfflineApp) {
                setWatchersForErrorStatus();
            }
        };

        $scope.state = {
            sync_stratergy: "selective",
            showValidationError: false,
            isDataAvailable: false
        };

        $scope.validationError = function(levelKey){
            return `** Please Select Atleast One Filter**`;
        } 

        $scope.selecteLevelNames = function (level) {
            if ($scope.addressesToFilter.hasOwnProperty(level)) {
                return $scope.addressesToFilter[level].filter(
          address => address.selected
        ).map(prov => prov.name);
            }
        };

        $scope.getLevel = function (levelKey) {
          let levelKeysSplitArray = levelKey.split("_");
          return levelKeysSplitArray[levelKeysSplitArray.length - 1];
        };
    
        $scope.getLevelName = function (levelKey) {
          return levelKey.slice(0, -2);
        };
    

        $scope.filterLevels = function (level) {
            let levelIndex = $scope.getLevel(level);
            let targetId = getTargetID(levelIndex, true);
            $scope.verifyLevelHasSelected(level, targetId);
            var selectedParentIds = $scope.addressesToFilter[level].filter(province => province.selected).map(province => province.id);
            var indexToMatch = parseInt(levelIndex) + 1;
            for (let key in $scope.addressesToFilter) {
                if ($scope.getLevel(key) == indexToMatch) {
                    let tempAddresses = angular.copy($scope.addresses);
                    $scope.addressesToFilter[key] = tempAddresses[key].filter(levelToFilter => selectedParentIds.includes(levelToFilter.parentId));
                    indexToMatch = indexToMatch + 1;
                }
            }
        };

        $scope.verifyLevelHasSelected = function (level, targetId) {
            let levelIndex = $scope.getLevel(level); // 0,1,2...
            let selectedLevelLength = $scope.addressesToFilter[level].filter(hierarchyLevel => hierarchyLevel.selected).length;
            if (levelIndex == 0 && selectedLevelLength == 0) {
                $scope.idsToShow = [];
                $scope.idsToShow.push(getTargetID(levelIndex, false));
            } else if (levelIndex != 0 && selectedLevelLength == 0) {
                let indexToMatch = parseInt(levelIndex) + 1;
                for (let key in $scope.addressesToFilter) {
                    if (key.includes(indexToMatch)) {
                        $scope.idsToShow = $scope.removeLevelToBeHidden(getTargetID(levelIndex, true));
                        indexToMatch = indexToMatch + 1;
                    }
                }
            } else {
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
        };

        $scope.openDropDown = function (dropDownId) {
            let targetClass = '.' + $scope.getLevelName(dropDownId).replaceAll(' ', '-') + '-list';
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
            if ($scope.idsToShow.indexOf(temp) == -1) { return false; } else { return true; }
        };

        $scope.isParentSelected = function (key) {
            let parentLevelId = parseInt($scope.getLevel(key)) - 1;
            parentLevelId = parentLevelId >= 0 ? parentLevelId : -1;
            let addressCopy = angular.copy($scope.addressesToFilter);
            if (parentLevelId == -1) { return true; } else {
                for (key in addressCopy) {
                    if (key.includes(parentLevelId)) {
                        let selectedLevelLength = addressCopy[key].filter(hierarchyLevel => hierarchyLevel.selected).length;
                        return selectedLevelLength != 0;
                    }
                }
            }
        };

        $scope.addresses = {};
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
        };

        $scope.removeFromSelectedList = function (name, level) {
            let levelDetails = $scope.addressesToFilter[level];
            for (let key in levelDetails) {
                if (levelDetails[key].name === name) {
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

        var getParentName = function(parentObject,names){
            if(parentObject != null)
            {
              names.push(parentObject.name);
              getParentName(parentObject.parent,names);
            }
        };

        $scope.confirmDelete = function () {
            offlineDbService.getPatientsCount().then(function (count) {
                count > 0 ? ngDialog.open({
                    template: 'views/deleteSyncDataConfirm.html',
                    class: 'ngdialog-theme-default',
                    closeByEscape: true,
                    closeByDocument: false,
                    showClose: true,
                    scope: $scope
                }) : $scope.sync();
            });
        };

        $scope.cancelDialog = function () {
          ngDialog.close();
        }

    $scope.cancelDialog = function () {
      ngDialog.close();
    }
        
      $scope.sync = function () {

        ngDialog.close();
        let selectedAddresses = angular.copy($scope.addressesToFilter);
        let filters = [];
        let results = new Object();

        for (let key in selectedAddresses) {
          let temp = selectedAddresses[key].filter(level => level.selected);
          if (temp.length != 0 && key.includes('0')) {
            $scope.state.showValidationError = false;
          }
          else if (temp.length == 0 && key.includes('0')) {
            $scope.state.showValidationError = true;
          }

          if (temp.length != 0)
            results = temp;
        }

        if (!$scope.state.showValidationError) {
          let counter = 0;
          for (let newKey in results) {
            offlineDbService.getAddressesHeirarchyLevelsById(results[newKey].levelId).then(function (result) {
              let addressFields = Bahmni.Common.Offline.AddressFields;
              var params = { searchString: results[newKey].name, addressField: addressFields[result[0].addressField], parentUuid: null, limit: 100, strategy: 'SelectiveSync' };
              offlineDbService.searchAddress(params).then(function (result) {
                counter++;
                let names = [];
                let data = result.data[0];
                names.push(data.name);
                getParentName(data.parent, names);
                let string = "";
                for (let key in names.reverse()) {
                  if (key == 0) {
                    string += names[key];
                  }
                  else {
                    string = string + '-' + names[key];
                  }
                }
                filters.push(string);
                $window.localStorage.setItem('SyncFilterConfig', filters);
              }).then(function () {
                if (counter === results.length) {
                  let categories = offlineService.getItem("eventLogCategories");
                  _.forEach(categories, function (category) {
                    if (category === "patient" || category === "encounter") {
                      offlineDbService.getMarker(category).then(function (marker) {
                        offlineDbService.insertMarker(marker.markerName, marker.lastReadEventUuid, filters);
                      });
                    }
                  });

                var saveFilterConfig =  $window.localStorage.getItem('SyncFilterConfig');
                
                if(saveFilterConfig !== filters.toString()){
                  offlineDbService.deleteRecordsFromTable('patient');
                  offlineDbService.deleteRecordsFromTable('encounter');
                }
                  schedulerService.sync(Bahmni.Common.Constants.syncButtonConfiguration);
                }
              });
            });
          }
        }

      };

        $scope.populateList = function () {
            offlineDbService.getAddressesHeirarchyLevels().then(function (levels) {
                levels.forEach(function (level, index) {
                    offlineDbService.getAllAddressesByLevelId(level.addressHierarchyLevelId).then(function (address) {
                        // $scope.addresses[`level_${index}`] = address;
                        $scope.addresses[`${level.name}_${index}`] = address.sort(function (a, b) {
                            return a.name.localeCompare(b.name);
                        });
                        $scope.addressesToFilter[`${level.name}_${index}`] = address;
                        $('#loadData').click();
                    });
                });
            });
        };

        return spinner.forPromise($q.all(init()));
    }
]);
