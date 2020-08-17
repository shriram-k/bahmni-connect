'use strict';

angular.module('syncdatarules', ['ui.router','bahmni.common.offline','bahmni.common.config','bahmni.common.uiHelper', 'ngDialog', 'httpErrorInterceptor','pascalprecht.translate'])
  .config(['$urlRouterProvider', '$stateProvider', '$httpProvider', '$compileProvider', function ($urlRouterProvider, $stateProvider, $httpProvider, $compileProvider) {
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
