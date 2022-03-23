var SolarSystemPauseReason;
(function (SolarSystemPauseReason) {
    SolarSystemPauseReason[SolarSystemPauseReason["LackOfData"] = 0] = "LackOfData";
    SolarSystemPauseReason[SolarSystemPauseReason["UserAction"] = 1] = "UserAction";
})(SolarSystemPauseReason || (SolarSystemPauseReason = {}));
var SolarSystemTimeManager = (function () {
    function SolarSystemTimeManager() {
    }
    SolarSystemTimeManager.prototype.start = function () {
        this.lastUpdate = Date.now();
        this.lastUpdateCorrespondence = 0;
        this.isPaused = false;
    };
    SolarSystemTimeManager.prototype.pause = function (reason) {
        this.lastUpdateCorrespondence += Date.now() - this.lastUpdate;
        this.lastUpdate = Date.now();
        this.isPaused = true;
        this.pauseReason = reason;
    };
    SolarSystemTimeManager.prototype.resume = function () {
        this.lastUpdate = Date.now();
        this.isPaused = false;
    };
    SolarSystemTimeManager.prototype.getTime = function () {
        if (this.isPaused) {
            return this.lastUpdateCorrespondence;
        }
        else {
            this.lastUpdateCorrespondence += Date.now() - this.lastUpdate;
            return this.lastUpdateCorrespondence;
        }
    };
    return SolarSystemTimeManager;
}());
