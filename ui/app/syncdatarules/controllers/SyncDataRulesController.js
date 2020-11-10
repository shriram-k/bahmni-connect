'use strict';

angular.module('syncdatarules')
  .controller('SyncDataRulesController', ['$scope', '$rootScope','$http', '$q', 'offlineDbService',
    function ($scope, $rootScope, $http, $q, offlineDbService) {
      var self = this;

      var syncData = function (isInitSync, category) {
        
      };

   
      $scope.import = function () {
        console.log("Entering import");
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
     
    }
  ]);
