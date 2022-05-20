var SolarSystemPauseReason;
(function (SolarSystemPauseReason) {
    SolarSystemPauseReason[SolarSystemPauseReason["LackOfData"] = 0] = "LackOfData";
    SolarSystemPauseReason[SolarSystemPauseReason["UserAction"] = 1] = "UserAction";
})(SolarSystemPauseReason || (SolarSystemPauseReason = {}));
const SIMULATION_SPEED_CORRESPONDENCE = [
    86400,
    172800,
    432000,
    864000,
    1728000,
    4320000,
    8640000
];
class SolarSystemTimeManager {
    constructor() { }
    start() {
        this.lastUpdate = Date.now();
        this.lastUpdateCorrespondence = 0;
        this.isPaused = false;
    }
    pause(reason) {
        this.lastUpdateCorrespondence += Date.now() - this.lastUpdate;
        this.lastUpdate = Date.now();
        this.isPaused = true;
        this.pauseReason = reason;
    }
    resume() {
        this.lastUpdate = Date.now();
        this.isPaused = false;
    }
    getTime() {
        if (this.isPaused) {
            return this.lastUpdateCorrespondence;
        }
        else {
            this.lastUpdateCorrespondence += (Date.now() - this.lastUpdate) *
                SIMULATION_SPEED_CORRESPONDENCE[SolarSystemSimulation.settings.simulationSpeed];
            this.lastUpdate = Date.now();
            return this.lastUpdateCorrespondence;
        }
    }
}
