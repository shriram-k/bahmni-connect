'use strict';

angular.module('syncdatarules', ['ui.router', 'bahmni.common.offline','bahmni.common.config','bahmni.common.i18n','bahmni.common.uiHelper',
'bahmni.common.logging', 'ngDialog', 'httpErrorInterceptor','authentication','pascalprecht.translate', 'bahmni.common.routeErrorHandler'])
  .config(['$urlRouterProvider', '$stateProvider', '$httpProvider',function ($urlRouterProvider, $stateProvider, $httpProvider) {
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
      }).state('errorLog', {
        url: '/errorLog',
        views: {
          'layout': {templateUrl: 'views/errorLog.html', controller: 'ErrorLogController'}
        },
        resolve: {
            offlineDb: function (offlineDbInitialization) {
                return offlineDbInitialization();
            }
        }
    });
    //$bahmniTranslateProvider.init({app: 'home', shouldMerge: true});
  }])
  .run(['$rootScope', function ($rootScope) {
  }]);
