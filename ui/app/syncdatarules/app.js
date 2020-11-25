'use strict';

angular.module('syncdatarules', ['ui.router', 'bahmni.common.offline','bahmni.common.config','bahmni.common.uiHelper','bahmni.common.logging', 'ngDialog', 'httpErrorInterceptor','pascalprecht.translate'])
  .config(['$urlRouterProvider', '$stateProvider', '$httpProvider', function ($urlRouterProvider, $stateProvider, $httpProvider) {
    $httpProvider.defaults.headers.common['Disable-WWW-Authenticate'] = true;
    $urlRouterProvider.otherwise('/syncdatarules');

    $stateProvider
      .state('syncdatarules', {
        url: '/syncdatarules',
        views: {
          'layout': {templateUrl: 'views/syncdatarules.html', controller: 'SyncDataRulesController'}
        },
        resolve: {
          offlineDb: function (offlineDbInitialization) {
            return offlineDbInitialization();
          }
        }
      });
  }])
  .run(['$rootScope', function ($rootScope) {
  }]);