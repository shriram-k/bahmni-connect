'use strict';

angular.module('syncdatarules')
  .controller('SyncDataRulesController', ['$scope', '$rootScope', '$http', '$q', 'offlineDbService',
      function ($scope, $rootScope, $http, $q, offlineDbService) {
          $scope.addressList = [];
          var addAddress = function (address) {
              $scope.addressList.push(address);
          };

          $scope.populateList = function () {
              offlineDbService.getAddressesHeirarchyLevels().then(// 3,4
            function (levels) {
                var levelIds = levels.map(id => id.addressHierarchyLevelId);
                console.log("levels: " + levelIds);

                levelIds.forEach(function (id) {
                    offlineDbService.getAllAddressesByLevelId(id).then(
                function (add) {
                    add.map(address => addAddress(address));
                }
              );
                });
            }
        );
          };
          $scope.populateList();
      }
  ]);
