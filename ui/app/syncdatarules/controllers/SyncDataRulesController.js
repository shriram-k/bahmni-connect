'use strict';

angular.module('syncdatarules')
  .controller('SyncDataRulesController', ['$scope', 'offlineDbService',
      function ($scope, offlineDbService) {
          var LEVEL_PROVINCE;
          var LEVEL_DISTRICT;

          $scope.provinceAddressList = [];
          $scope.districtAddressList = [];

          var addProviceAddress = function (address) {
              $scope.provinceAddressList.push(address);
          };

          var addDistrictAddress = function (address) {
              $scope.districtAddressList.push(address);
          };

          $scope.populateList = function () {
              offlineDbService.getAddressesHeirarchyLevels().then(
            function (levels) {
                var levelIds = levels.map(id => id.addressHierarchyLevelId);
                LEVEL_PROVINCE = levelIds[0];
                LEVEL_DISTRICT = levelIds[1];

                levelIds.forEach(function (id) {
                    offlineDbService.getAllAddressesByLevelId(id).then(
                    function (add) {
                        if (id === LEVEL_PROVINCE) {
                            add.map(address => addProviceAddress(address));
                        } else if (id === LEVEL_DISTRICT) {
                            add.map(address => addDistrictAddress(address));
                        }
                    }
                  );
                });
            }
        );
          };
          $scope.populateList();
      }
  ]);
