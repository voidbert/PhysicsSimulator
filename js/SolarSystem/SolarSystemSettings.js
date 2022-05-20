var SolarSystemSimulationQuality;
(function (SolarSystemSimulationQuality) {
    SolarSystemSimulationQuality[SolarSystemSimulationQuality["VeryLow"] = 864000000] = "VeryLow";
    SolarSystemSimulationQuality[SolarSystemSimulationQuality["Low"] = 432000000] = "Low";
    SolarSystemSimulationQuality[SolarSystemSimulationQuality["Medium"] = 86400000] = "Medium";
    SolarSystemSimulationQuality[SolarSystemSimulationQuality["High"] = 43200000] = "High";
    SolarSystemSimulationQuality[SolarSystemSimulationQuality["VeryHigh"] = 8640000] = "VeryHigh";
})(SolarSystemSimulationQuality || (SolarSystemSimulationQuality = {}));
class SolarSystemSettings {
    constructor() {
        this._simulationQuality = SolarSystemSimulationQuality.High;
    }
    get simulationQuality() { return this._simulationQuality; }
    get simulationSpeed() { return this._simulationSpeed; }
    get seeOrbits() { return this._seeOrbits; }
    get singleOrbits() { return this._singleOrbits; }
    get bodyRadius() { return this._bodyRadius; }
    getFromPage() {
        let settings = new SolarSystemSettings();
        settings._simulationQuality = {
            "vl": SolarSystemSimulationQuality.VeryLow,
            "l": SolarSystemSimulationQuality.Low,
            "m": SolarSystemSimulationQuality.Medium,
            "h": SolarSystemSimulationQuality.High,
            "vh": SolarSystemSimulationQuality.VeryHigh
        }[document.getElementById("simulation-quality").value];
        settings._simulationSpeed =
            parseInt(document.getElementById("sim-speed").value);
        settings._seeOrbits = document.getElementById("orbits").checked;
        settings._singleOrbits =
            document.getElementById("single-orbit").checked;
        settings._bodyRadius =
            parseInt(document.getElementById("body-radius").value);
        return settings;
    }
    updatePage() {
        if (this.seeOrbits) {
            document.getElementById("single-orbit").disabled = false;
        }
        else {
            document.getElementById("single-orbit").disabled = true;
        }
    }
    static addEvents() {
        document.getElementById("quality-confirm-button").addEventListener("click", () => {
            SolarSystemSimulation.settings = SolarSystemSimulation.settings.getFromPage();
            SolarSystemSimulation.settings.updatePage();
            SolarSystemSimulation.startSimulation();
        });
        let elements = [
            document.getElementById("sim-speed"), document.getElementById("orbits"),
            document.getElementById("single-orbit"), document.getElementById("body-radius")
        ];
        for (let i = 0; i < elements.length; ++i) {
            elements[i].addEventListener("input", () => {
                SolarSystemSimulation.settings = SolarSystemSimulation.settings.getFromPage();
                SolarSystemSimulation.settings.updatePage();
            });
        }
    }
}
