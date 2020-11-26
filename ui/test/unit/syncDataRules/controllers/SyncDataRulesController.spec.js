'use strict';

describe('SyncDataRulesController', function () {
    var $aController, scopeMock , offlineDbServiceMock, offlineServiceMock
    beforeEach(module('bahmni.common.syncDataRules'));

    beforeEach(function () {
        offlineDbServiceMock = jasmine.createSpyObj('offlineDbService', ['getAddressesHeirarchyLevels','getAllAddressesByLevelId']);
        offlineServiceMock = jasmine.createSpyObj('offlineService', ['getItem']);
        // offlinePullMock = function () {
        //     return specUtil.createFakePromise();
        // };
        // offlineLocationInitializationMock = function () {
        //     return specUtil.createFakePromise();
        // };

    });

    var createController = function(){
        return $aController('SyncDataRulesController', {
            $scope: scopeMock,
            offlineDbService: offlineDbServiceMock,
            offlineService: offlineServiceMock
            // sessionService: sessionServiceMock,
            //$q: q
            // offlineLocationInitialization: offlineLocationInitializationMock,
            // dbNameService: dbNameServiceMock
        });
    };

    beforeEach(inject(function ($controller, $rootScope, $q) {
        $aController = $controller;
        scopeMock = $rootScope.$new();
        //q = $q;
    }));

    beforeEach(inject(['offlineService', function (offlineServiceInjected) {
        offlineService = offlineServiceInjected;
    }]));

    describe('SyncDataRulesController', function () {
        beforeEach(function () {
            let address = {"Level_0":[
                {
                id: 5608,
                levelId: 3,
                name: "BULAWAYO[09]",
                parentId: null,
                userGeneratedId: null,
                uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c3"},
                {
                    id: 5609,
                    levelId: 3,
                    name: "BULAWAYO[08]",
                    parentId: null,
                    userGeneratedId: null,
                    selected : true,
                    uuid: "26b4737d-4aaa-43d6-89e5-00a867bbc8c4"}
            ]}
        });

        describe('selectedLevelLength', function () {
            var controller = createController();
            it("should return the length of selected address hierarchy level", function () {
                expect(controller.selectedLevelLength(address,"Level_0")).toBe(1);
            });
    
        });

        
        it("should initialize data sync if initial sync is  not completed", function () {
            
        });
    });
});