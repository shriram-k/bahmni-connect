var EncounterConfig = (function () {
    function EncounterConfig(encounterTypes) {
        this.encounterTypes = encounterTypes;
    }
    EncounterConfig.prototype = {
        getOpdConsultationEncounterTypeUuid:function () {
            return this.encounterTypes["OPD"];
        },
        getAdmissionEncounterTypeUuid:function () {
            return this.encounterTypes["ADMISSION"];
        },
        getInvestigationEncounterTypeUuid:function () {
            return this.encounterTypes["INVESTIGATION"];
        },
        getDischargeEncounterTypeUuid:function () {
            return this.encounterTypes["DISCHARGE"];
        },
        getTransferEncounterTypeUuid:function () {
            return this.encounterTypes["TRANSFER"];
        },
        getRadiologyEncounterTypeUuid:function () {
            return this.encounterTypes["RADIOLOGY"];
        },
        getEncounterTypeUuid:function(encounterTypeName) {
            return this.encounterTypes[encounterTypeName]
        },
        getVisitTypes:function(){
            var visitTypesArray = [];
            for(var name in this.visitTypes) {
                visitTypesArray.push({name: name, uuid: this.visitTypes[name]});
            }
            return visitTypesArray;
        },
        getVisitTypeByUuid: function(uuid) {
            var visitTypes = this.getVisitTypes();
            return visitTypes.filter(function(visitType){
                return visitType.uuid === uuid;
            })[0];
        }
    };
    return EncounterConfig;
})();