'use strict';

angular.module('syncdatarules')
  .controller('SyncDataRulesController', ['$scope', '$rootScope','$http', '$q', 'offlineDbService', 'offlineService', 'eventLogService','dbNameService','messagingService',
    function ($scope, $rootScope, $http, $q, offlineDbService, offlineService, eventLogService,dbNameService,messagingService) {
      console.log("Inside the controller");
      var self = this;
      var stages, categories;

      //thread.exec
      $scope.exportMetaData = function () {
        const db = new Dexie('Bahmni');
        Dexie.getDatabaseNames(function (databaseNames) {
          console.log(databaseNames.length + "  :   " + databaseNames[0]);
        });

        db.open().then(function () {
          const idbDatabase = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
          // export to JSON, clear database, and import from JSON
          exportToJsonString(idbDatabase, function (err, jsonString) {
            if (err) {
              console.error(err);
            } else {
              console.log('Exported as JSON: ' + jsonString);
              var file = new Blob([jsonString], {
                type: 'application/json'
              });
              var fileURL = URL.createObjectURL(file);
              var a = document.createElement('a');
              a.href = fileURL;
              a.target = '_blank';
              a.download = $scope.selectedFile + '.json';
              document.body.appendChild(a);
              a.click();
            }
          });
        }).catch(function (e) {
          console.error('Could not connect. ' + e);
        });
        // var promises = [];
        // offlineService.isOfflineApp();
        // let isInitSync=false;
        // promises.push(syncForCategory("addressHierarchy", isInitSync));
        // promises.push(syncForCategory("parentAddressHierarchy", isInitSync));
        //
        // return $q.all(promises);
      };
      var syncForCategory = function (category, isInitSync) {
        return offlineDbService.getMarker(category).then(function (marker) {
          if (category === "encounter" && isInitSync) {
            marker = angular.copy(marker);
            marker.filters = offlineService.getItem("initSyncFilter");
          }
          return syncForMarker(category, marker, isInitSync);
        });
      };

      var syncForMarker = function (category, marker, isInitSync) {
        return eventLogService.getEventsFor(category, marker).then(function (response) {
          var events = response.data ? response.data["events"] : undefined;
          // if (events == undefined || events.length == 0) {
          //   endSync(stages++);
          //   return;
          // }
          // updatePendingEventsCount(category, response.data.pendingEventsCount);
          return readEvent(events, 0, category, isInitSync);
        }, function () {
          // endSync(-1);
          // return createRejectedPromise();
        });
      };

      var readEvent = function (events, index, category, isInitSync) {
        console.log("Reading events here ...");


      };

      var getDbName = function () {
        var loginInformation = offlineService.getItem('LoginInformation');
        var location = loginInformation ? loginInformation.currentLocation.display : null;
        var username = offlineService.getItem("userData").results[0].username;
        return dbNameService.getDbName(username, location);
    };

    var getDbNameCondition = function () {
      var appName = "dbNameCondition";
      var requestUrl = Bahmni.Common.Constants.baseUrl + appName + "/" + appName + ".json";
      return $http.get(requestUrl).then(function (result) {
          return offlineDbService.insertConfig(appName, result.data, result.headers().etag);
      }).catch(function (response) {
          messagingService.showMessage("error", Bahmni.Common.Constants.offlineErrorMessages.dbNameConditionNotPresent);
          logSyncError(response);
      });
  };

      var migrate = function (isInitSync) {
        var categoryPromise = eventLogService.getEventCategoriesToBeSynced().then(function (results) {
            offlineService.setItem("eventLogCategories", results.data);
        });
        var url = Bahmni.Common.Constants.globalPropertyUrl + "?property=allowMultipleLoginLocation";
        var multiDbConfigPromise = $http.get(url).then(function (res) {
            offlineService.setItem("allowMultipleLoginLocation", res.data);
            if (res.data) {
                return getDbNameCondition();
            }
        });
        return $q.all([categoryPromise, multiDbConfigPromise]).then(function () {
            return syncData(isInitSync);
        });
    };

    var initializeInitSyncInfo = function initializeCounters (categories) {
      $rootScope.initSyncInfo = {};
      $rootScope.showSyncInfo = true;
      _.map(categories, function (category) {
          $rootScope.initSyncInfo[category] = {};
          $rootScope.initSyncInfo[category].pendingEventsCount = 0;
          $rootScope.initSyncInfo[category].savedEventsCount = 0;
      });
      $rootScope.initSyncInfo.savedEvents = 0;
  };

      var syncData = function (isInitSync, category) {
        console.log("hahaha  got it ", category);
        var promises = [];
        categories = offlineService.getItem("eventLogCategories");
        initializeInitSyncInfo(categories);
        _.forEach(categories, function (category) {
          if (!isInitSync || category !== "patient") {
            promises.push(syncForCategory(category, isInitSync));
          }

          // promises.push(syncForCategory("addressHierarchy", isInitSync));
          promises.push(syncForCategory("offline-concepts", isInitSync));

        });
        if (isInitSync && _.indexOf(categories, 'offline-concepts') !== -1) {
          var patientPromise = savePatientDataFromFile().then(function (uuid) {
            return updateMarker({ uuid: uuid }, "offline-concepts");
          });
          promises.push(patientPromise);
        }
        return $q.all(promises);
      };

      var updateMarker = function (event, category) {
        return offlineDbService.getMarker(category).then(function (marker) {
            if (event.uuid == undefined) {
                if (marker.lastReadEventUuid != undefined) {
                    console.log("Event identifier is null or undefined. Can not override last read event for category - " + category);
                    throw new Error("Event identifier is null or undefined. Can not override last read event for category - " + category);
                }
            }
            return offlineDbService.insertMarker(marker.markerName, event.uuid, marker.filters);
        });
    };

      var savePatientDataFromFile = function () {
        var defer = $q.defer();
        offlineDbService.getMarker('offline-concepts').then(function (marker) {
          if (marker.lastReadEventUuid) {
            return defer.resolve(marker.lastReadEventUuid);
          }

          return getDbName().then(function (dbName) {
            var eventLogUuid;
           // var promises = marker.filters.map(function (filter) {
             // var syncedInfo = offlineService.getItem("synced") || {};
            //  var synced = syncedInfo[dbName] || [];
              return $http.get(Bahmni.Common.Constants.preprocessedOfflineConceptsFilesUrl + "offline-concepts").then(function (response) {
                return getPatientDataForFiles(getRemainingFileNames(response.data, []), 0, null, dbName).then(function (uuid) {
                  eventLogUuid = uuid;
                });
              }).catch(function () {
                endSync(-1);
                return defer.reject();
              });
           // });
            return $q.all(promises).then(function () {
              return defer.resolve(eventLogUuid);
            });
          });
        });
        return defer.promise;
      };

      var getRemainingFileNames = function (fileNames, synced) {
        var remaining = _.difference(fileNames, synced);
        return remaining.length ? remaining : fileNames.length ? [_.last(fileNames)] : fileNames;
      };

      var getPatientDataForFiles = function (fileNames, count, eventLogUuid, dbName) {
        if (count !== fileNames.length) {
          return $http.get(Bahmni.Common.Constants.preprocessedOfflineConceptsUrl + fileNames[count]).then(function (response) {
            updatePendingEventsCount("offline-concepts", response.data.offlineconcepts.length);
            var lastReadEventUuid = response.data.lastReadEventUuid;
            return savePatients(response.data.offlineconcepts, 0).then(function () {
              updateSyncedFileNames(fileNames[count], dbName);
              return getPatientDataForFiles(fileNames, ++count, lastReadEventUuid, dbName);
            });
          });
        }
        return $q.when(eventLogUuid);
      };

      var updatePendingEventsCount = function (category, pendingEventsCount) {
        if (category === 'offline-concepts') {
          $rootScope.initSyncInfo[category].pendingEventsCount += pendingEventsCount;
        } else {
          $rootScope.initSyncInfo[category].pendingEventsCount = pendingEventsCount;
        }
        $rootScope.initSyncInfo.totalEvents = categories.reduce(function (count, category) {
          return count + $rootScope.initSyncInfo[category].savedEventsCount + $rootScope.initSyncInfo[category].pendingEventsCount;
        }, 0);
      };

      var savePatients = function (patients, count) {
        if (count != patients.length) {
          return saveData({ category: 'offline-concepts' }, { data: patients[count] }).then(function () {
            updateSavedEventsCount('offline-concepts');
            return (offlineService.isAndroidApp() && count % 10 == 0) ?
              $timeout(savePatients, 100, true, patients, ++count) : savePatients(patients, ++count);
          });
        }
        return $q.when();
      };

      var updateSyncedFileNames = function (fileName, dbName) {
        var syncedInfo = offlineService.getItem("synced") || {};
        syncedInfo[dbName] = syncedInfo[dbName] || [];
        syncedInfo[dbName].push(fileName);
        offlineService.setItem("synced", syncedInfo);
      };

      var saveData = function (event, response) {
        var deferrable = $q.defer();
        switch (event.category) {
          case 'patient':
            offlineDbService.getAttributeTypes().then(function (attributeTypes) {
              mapAttributesToPostFormat(response.data.person.attributes, attributeTypes);
              mapIdentifiers(response.data.identifiers).then(function () {
                offlineDbService.createPatient({ patient: response.data }).then(function () {
                  deferrable.resolve();
                }, function (response) {
                  deferrable.reject(response);
                });
              });
            });
            break;
          case 'Encounter':
          case 'SHREncounter':
            offlineDbService.createEncounter(response.data).then(function () {
              deferrable.resolve();
            });
            break;
          case 'LabOrderResults':
            var patientUuid = event.object.match(Bahmni.Common.Constants.uuidRegex)[0];
            offlineDbService.insertLabOrderResults(patientUuid, response.data).then(function () {
              deferrable.resolve();
            });
            break;

          case 'offline-concepts':
            offlineDbService.insertConceptAndUpdateHierarchy({ "results": [response.data] }).then(function () {
              deferrable.resolve();
            });
            break;
          case 'addressHierarchy':
          case 'addressHierarchy':
            offlineDbService.insertAddressHierarchy(response.data).then(function () {
              deferrable.resolve();
            });
            break;
          case 'forms':
            offlineDbService.insertForm(response.data).then(function () {
              deferrable.resolve();
            });
            break;
          default:
            deferrable.resolve();
            break;
        }
        return deferrable.promise;
      };

      var updateSavedEventsCount = function (category) {
        $rootScope.initSyncInfo[category].savedEventsCount++;
        $rootScope.initSyncInfo[category].pendingEventsCount--;
        $rootScope.initSyncInfo.savedEvents++;
      };

      var mapAttributesToPostFormat = function (attributes, attributeTypes) {
        angular.forEach(attributes, function (attribute) {
            if (!attribute.voided && !attribute.attributeType.retired) {
                var foundAttribute = _.find(attributeTypes, function (attributeType) {
                    return attributeType.uuid === attribute.attributeType.uuid;
                });
                if (foundAttribute.format === "org.openmrs.Concept") {
                    var value = attribute.value;
                    attribute.value = value.display;
                    attribute.hydratedObject = value.uuid;
                }
            }
        });
    };

      $scope.import = function () {
        console.log("Entering import");
        migrate(true);
        syncData(true,'offline-concepts');
        // var selfie = this;
        // var thread = vkThread();
        // var thread2 = vkThread();
        // var thread3 = vkThread();
        // var param = {
        //   fn: getPatientDataForFiles,
        //   args: ["https://192.168.33.79"+Bahmni.Common.Constants.preprocessedPatientUrl + "BAMA10-1.json.gz"],
        //   context:self
        // };
        // var param1 = {
        //   fn: getPatientDataForFiles,
        //   args: ['https://192.168.33.79'+Bahmni.Common.Constants.preprocessedPatientUrl + 'BAMA1-1.json.gz'],
        //   context:self
        // };
        // var param2 = {
        //   fn: getPatientDataForFiles,
        //   args: ['https://192.168.33.79'+Bahmni.Common.Constants.preprocessedPatientUrl + 'BAMA1-21.json.gz'],
        //   context:self
        // };
        // thread.exec(param).then(function (data) {
        //     console.log("Starting download of file 1");  // <-- thread returns 3
        //   $scope.data=data;
        //   },
        //   function (err) {
        //     alert(err);  // <-- thread returns error message
        //   });
        // thread2.exec(param1).then(function (data) {
        //     console.log("Starting download of file 2");  // <-- thread returns 3
        //   },
        //   function (err) {
        //     alert(err);  // <-- thread returns error message
        //   });
        // thread3.exec(param2).then(function (data) {
        //     console.log("Starting download of file 3");  // <-- thread returns 3
        //   },
        //   function (err) {
        //     alert(err);  // <-- thread returns error message
        //   });
        //getPatientDataForFiles();
      };
      // var getPatientDataForFiles = function (config) {
      //   console.log(config.toString());
      //   return vkhttp(config).then(function (response) {
      //     var test = response;
      //     console.log("here in response");
      //     // var deferrable = $q.defer();
      //     // offlineDbService.getAttributeTypes().then(function (attributeTypes) {
      //     //   mapAttributesToPostFormat(response.data.patients[1].person.attributes, attributeTypes);
      //     //   mapIdentifiers(response.data.patients[1].person.identifiers).then(function () {
      //     //     offlineDbService.createPatient({
      //     //       patient: response.data.patients[1]
      //     //     }).then(function () {
      //     //       deferrable.resolve();
      //     //     }, function (response) {
      //     //       deferrable.reject(response);
      //     //     });
      //     //   });
      //     // });
      //   })
      // };
      var mapAttributesToPostFormat = function (attributes, attributeTypes) {
        angular.forEach(attributes, function (attribute) {
          if (!attribute.voided && !attribute.attributeType.retired) {
            var foundAttribute = _.find(attributeTypes, function (attributeType) {
              return attributeType.uuid === attribute.attributeType.uuid;
            });
            if (foundAttribute.format === "org.openmrs.Concept") {
              var value = attribute.value;
              attribute.value = value.display;
              attribute.hydratedObject = value.uuid;
            }
          }
        });
      };

      var mapIdentifiers = function (identifiers) {
        var deferred = $q.defer();
        return offlineDbService.getReferenceData("IdentifierTypes").then(function (identifierTypesData) {
          var identifierTypes = identifierTypesData.data;
          angular.forEach(identifiers, function (identifier) {
            identifier.identifierType.primary = isPrimary(identifier, identifierTypes);
          });
          var extraIdentifiersForSearch = {};
          var extraIdentifiers = _.filter(identifiers, {
            'identifierType': {
              'primary': false
            }
          });
          var primaryIdentifier = _.filter(identifiers, {
            'identifierType': {
              'primary': true
            }
          })[0];
          angular.forEach(extraIdentifiers, function (extraIdentifier) {
            var name = extraIdentifier.identifierType.display || extraIdentifier.identifierType.name;
            extraIdentifiersForSearch[name] = extraIdentifier.identifier;
          });
          angular.forEach(identifiers, function (identifier) {
            identifier.primaryIdentifier = primaryIdentifier.identifier;
            identifier.extraIdentifiers = !_.isEmpty(extraIdentifiersForSearch) ? extraIdentifiersForSearch : undefined;
          });
          deferred.resolve({
            data: identifiers
          });
          return deferred.promise;
        });
      };

      var endSync = function (status) {
        if (stages == categories.length || status == -1) {
            $rootScope.$broadcast("schedulerStage", null);
        }
    };

      $scope.jsonString;
      $scope.readFromFile = function () {
        if (window.FileReader) {
          var input = document.getElementById('myFile');
          var file = input.files[0];

          readFile(file, function (e) {
            $scope.jsonString = e.target.result;
            $scope.$apply();

            const db = new Dexie('Bahmni');
            db.open().then(function () {
              const idbDatabase = db.backendDB();
              // clearDatabase(idbDatabase, function (err) {
              //   if (!err) { // cleared data successfully
              //    console.log("Cleared storage.");
              //   }
              // });
              //read from file
              importFromJsonString(idbDatabase, e.target.result, function (err) {
                if (!err) {
                  console.log('Imported data successfully');
                }
              });
            });

          });
        }
      };

      function readFile(file, callback) {
        var reader = new FileReader();
        reader.onload = callback;
        reader.readAsText(file);
      }

      $scope.clearMetaData = function () {
        const db = new Dexie('metaData');
        db.open().then(function () {
          const idbDatabase = db.backendDB();
          clearDatabase(idbDatabase, function (err) {
            if (!err) { // cleared data successfully
              console.log("Cleared storage.");
            }
          });
        });
      };

      $scope.estimate = function () {
        console.log("Entering estimate");
        $scope.noEventsMessage = "";
        $http.get(Bahmni.Common.Constants.preprocessedPatientUrl + "BAMA10-1.json.gz").then(function (response) {
          if (response.data.patients.length > 0) {
            $scope.noEvents = false;
            $scope.events = response.data.patients.length;
          } else {
            $scope.noEvents = true;
          }
        });
      };
    }
  ]);
