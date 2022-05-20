var RestitutionSimulationQuality;
(function (RestitutionSimulationQuality) {
    RestitutionSimulationQuality[RestitutionSimulationQuality["VeryLow"] = 20] = "VeryLow";
    RestitutionSimulationQuality[RestitutionSimulationQuality["Low"] = 10] = "Low";
    RestitutionSimulationQuality[RestitutionSimulationQuality["Medium"] = 5] = "Medium";
    RestitutionSimulationQuality[RestitutionSimulationQuality["High"] = 2.5] = "High";
    RestitutionSimulationQuality[RestitutionSimulationQuality["VeryHigh"] = 1] = "VeryHigh";
})(RestitutionSimulationQuality || (RestitutionSimulationQuality = {}));
var RestitutionGraphProperty;
(function (RestitutionGraphProperty) {
    RestitutionGraphProperty[RestitutionGraphProperty["Y"] = 0] = "Y";
    RestitutionGraphProperty[RestitutionGraphProperty["Velocity"] = 1] = "Velocity";
})(RestitutionGraphProperty || (RestitutionGraphProperty = {}));
function restitutionGraphPropertyToString(property) {
    switch (property) {
        case RestitutionGraphProperty.Y:
            return "y (m)";
        case RestitutionGraphProperty.Velocity:
            return "v (m s⁻¹)";
    }
}
class RestitutionSettings {
    constructor() {
        this._h0 = 5;
        this._coefficient = 0.7;
        this._simulationQuality = RestitutionSimulationQuality.VeryHigh;
        this._graphProperty = RestitutionGraphProperty.Y;
    }
    get h0() { return this._h0; }
    get coefficient() { return this._coefficient; }
    get simulationQuality() { return this._simulationQuality; }
    get graphProperty() { return this._graphProperty; }
    getFromPage() {
        let settings = new RestitutionSettings();
        let parseWithSettingsUpdate = (id, property, validProperty, min, max = Infinity) => {
            settings[property] = parseInputNumber(id, min, max);
            if (isNaN(settings[property])) {
                settings[validProperty] = false;
                settings[property] = this[property];
            }
            else {
                settings[validProperty] = true;
            }
        };
        parseWithSettingsUpdate("height", "_h0", "_validH0", Number.MIN_VALUE);
        parseWithSettingsUpdate("coefficient", "_coefficient", "_validCoefficient", Number.MIN_VALUE, 1);
        settings._simulationQuality = {
            "vl": RestitutionSimulationQuality.VeryLow,
            "l": RestitutionSimulationQuality.Low,
            "m": RestitutionSimulationQuality.Medium,
            "h": RestitutionSimulationQuality.High,
            "vh": RestitutionSimulationQuality.VeryHigh
        }[document.getElementById("simulation-quality").value];
        settings._graphProperty = {
            "y": RestitutionGraphProperty.Y,
            "v": RestitutionGraphProperty.Velocity
        }[document.getElementById("graph-property").value];
        return settings;
    }
    updatePage() {
        RestitutionSimulation.state = RestitutionState.BeforeStart;
        RestitutionSimulation.graph.axes.verticalAxisName =
            restitutionGraphPropertyToString(this._graphProperty);
        function adjustColor(error, id, n) {
            let element = document.getElementById(id);
            for (; n > 0; n--) {
                element = element.parentElement;
            }
            if (error) {
                element.classList.remove("red");
            }
            else {
                element.classList.add("red");
            }
        }
        adjustColor(this._validH0, "height", 2);
        adjustColor(this._validCoefficient, "coefficient", 2);
        RestitutionSimulation.body.r = new Vec2(0, this._h0);
        document.getElementById("download-button").disabled = true;
    }
    static addEvents() {
        function onUpdate() {
            RestitutionSimulation.settings = RestitutionSimulation.settings.getFromPage();
            RestitutionSimulation.settings.updatePage();
        }
        let settingsElements = [
            "simulation-quality", "graph-property"
        ];
        for (let i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("change", onUpdate);
        }
        settingsElements = [
            "height", "coefficient"
        ];
        for (let i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
        }
    }
    static disableSettingsElements() {
        document.getElementById("height").disabled = true;
        document.getElementById("coefficient").disabled = true;
        document.getElementById("simulation-quality").disabled = true;
        document.getElementById("graph-property").disabled = true;
        document.getElementById("download-button").disabled = true;
    }
    static enableSettingsElements() {
        document.getElementById("height").disabled = false;
        document.getElementById("coefficient").disabled = false;
        document.getElementById("simulation-quality").disabled = false;
        document.getElementById("graph-property").disabled = false;
    }
}
