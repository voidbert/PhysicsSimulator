var ParachuteSimulationQuality;
(function (ParachuteSimulationQuality) {
    ParachuteSimulationQuality[ParachuteSimulationQuality["VeryLow"] = 10] = "VeryLow";
    ParachuteSimulationQuality[ParachuteSimulationQuality["Low"] = 5] = "Low";
    ParachuteSimulationQuality[ParachuteSimulationQuality["Medium"] = 2] = "Medium";
    ParachuteSimulationQuality[ParachuteSimulationQuality["High"] = 1] = "High";
    ParachuteSimulationQuality[ParachuteSimulationQuality["VeryHigh"] = 0.5] = "VeryHigh";
})(ParachuteSimulationQuality || (ParachuteSimulationQuality = {}));
var ParachuteGraphProperty;
(function (ParachuteGraphProperty) {
    ParachuteGraphProperty[ParachuteGraphProperty["Y"] = 0] = "Y";
    ParachuteGraphProperty[ParachuteGraphProperty["R"] = 1] = "R";
    ParachuteGraphProperty[ParachuteGraphProperty["Velocity"] = 2] = "Velocity";
    ParachuteGraphProperty[ParachuteGraphProperty["AirResistance"] = 3] = "AirResistance";
    ParachuteGraphProperty[ParachuteGraphProperty["ResultantForce"] = 4] = "ResultantForce";
    ParachuteGraphProperty[ParachuteGraphProperty["Acceleration"] = 5] = "Acceleration";
})(ParachuteGraphProperty || (ParachuteGraphProperty = {}));
function parachuteGraphPropertyToString(property) {
    switch (property) {
        case ParachuteGraphProperty.Y:
            return "y (m)";
        case ParachuteGraphProperty.R:
            return "r (m)";
        case ParachuteGraphProperty.Velocity:
            return "v (m s⁻¹)";
        case ParachuteGraphProperty.AirResistance:
            return "Rar (N)";
        case ParachuteGraphProperty.ResultantForce:
            return "Fr (N)";
        case ParachuteGraphProperty.Acceleration:
            return "a (m s⁻²)";
    }
}
var ParachuteSettings = (function () {
    function ParachuteSettings() {
        this._mass = 80;
        this._h0 = 2000;
        this._hopening = 500;
        this._openingTime = 5.0;
        this._cd0 = 0.4;
        this._A0 = 0.5;
        this._cd1 = 1.6;
        this._A1 = 5;
        this._simulationQuality = ParachuteSimulationQuality.VeryHigh;
        this._graphProperty = ParachuteGraphProperty.Velocity;
        this._seeTheoretical = true;
        this._simulationResults = true;
        this._fastForward = false;
    }
    Object.defineProperty(ParachuteSettings.prototype, "mass", {
        get: function () { return this._mass; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "h0", {
        get: function () { return this._h0; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "hopening", {
        get: function () { return this._hopening; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "openingTime", {
        get: function () { return this._openingTime; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "cd0", {
        get: function () { return this._cd0; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "A0", {
        get: function () { return this._A0; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "cd1", {
        get: function () { return this._cd1; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "A1", {
        get: function () { return this._A1; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "simulationQuality", {
        get: function () { return this._simulationQuality; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "graphProperty", {
        get: function () { return this._graphProperty; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "seeTheoretical", {
        get: function () { return this._seeTheoretical; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "simulationResults", {
        get: function () { return this._simulationResults; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "fastForward", {
        get: function () { return this._fastForward; },
        enumerable: false,
        configurable: true
    });
    ParachuteSettings.prototype.getFromPage = function () {
        var _this = this;
        var settings = new ParachuteSettings();
        settings._simulationQuality = {
            "vl": ParachuteSimulationQuality.VeryLow,
            "l": ParachuteSimulationQuality.Low,
            "m": ParachuteSimulationQuality.Medium,
            "h": ParachuteSimulationQuality.High,
            "vh": ParachuteSimulationQuality.VeryHigh
        }[document.getElementById("simulation-quality").value];
        settings._graphProperty = {
            "y": ParachuteGraphProperty.Y,
            "r": ParachuteGraphProperty.R,
            "v": ParachuteGraphProperty.Velocity,
            "Rar": ParachuteGraphProperty.AirResistance,
            "Fr": ParachuteGraphProperty.ResultantForce,
            "a": ParachuteGraphProperty.Acceleration
        }[document.getElementById("graph-property").value];
        settings._seeTheoretical =
            document.getElementById("see-theoretical").checked;
        settings._simulationResults =
            document.getElementById("simulation-results-check").checked;
        settings._fastForward =
            document.getElementById("fast-checkbox").checked;
        var parseWithSettingsUpdate = function (id, property, validProperty, min, max) {
            if (max === void 0) { max = Infinity; }
            settings[property] = parseInputNumber(id, min, max);
            if (isNaN(settings[property])) {
                settings[validProperty] = false;
                settings[property] = _this[property];
            }
            else {
                settings[validProperty] = true;
            }
        };
        parseWithSettingsUpdate("mass", "_mass", "_validMass", Number.MIN_VALUE);
        parseWithSettingsUpdate("h0", "_h0", "_validH0", Number.MIN_VALUE);
        parseWithSettingsUpdate("hopening", "_hopening", "_validHopening", Number.MIN_VALUE, settings._h0);
        parseWithSettingsUpdate("opening-time", "_openingTime", "_validOpeningTime", 0);
        parseWithSettingsUpdate("cd0", "_cd0", "_validCd0", Number.MIN_VALUE);
        parseWithSettingsUpdate("A0", "_A0", "_validA0", Number.MIN_VALUE);
        parseWithSettingsUpdate("cd1", "_cd1", "_validCd1", Number.MIN_VALUE);
        parseWithSettingsUpdate("A1", "_A1", "_validA1", Number.MIN_VALUE);
        return settings;
    };
    ParachuteSettings.prototype.updatePage = function () {
        ParachuteSimulation.state = ParachuteState.BeforeRelease;
        ParachuteSimulation.graph.axes.verticalAxisName =
            parachuteGraphPropertyToString(this._graphProperty);
        function adjustColor(error, id, n) {
            var element = document.getElementById(id);
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
        adjustColor(this._validMass, "mass", 2);
        adjustColor(this._validH0, "h0", 2);
        adjustColor(this._validHopening, "hopening", 2);
        adjustColor(this._validOpeningTime, "opening-time", 2);
        adjustColor(this._validCd0, "cd0", 1);
        adjustColor(this._validA0, "A0", 1);
        adjustColor(this._validCd1, "cd1", 1);
        adjustColor(this._validA1, "A1", 1);
        ParachuteSimulation.body.mass = this._mass;
        ParachuteSimulation.body.r = new Vec2(0, this._h0);
        document.getElementById("download-button").disabled = true;
    };
    ParachuteSettings.addEvents = function () {
        function onUpdate() {
            ParachuteSimulation.settings = ParachuteSimulation.settings.getFromPage();
            ParachuteSimulation.settings.updatePage();
        }
        var settingsElements = [
            "simulation-quality", "graph-property", "fast-checkbox"
        ];
        for (var i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("change", onUpdate);
        }
        settingsElements = [
            "mass", "h0", "hopening", "opening-time", "cd0", "A0", "cd1", "A1"
        ];
        for (var i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
        }
        var seeTheoreticalCheckbox = document.getElementById("see-theoretical");
        seeTheoreticalCheckbox.addEventListener("change", function () {
            ParachuteSimulation.settings._seeTheoretical = seeTheoreticalCheckbox.checked;
        });
        var simulationResults = document.getElementById("simulation-results-check");
        simulationResults.addEventListener("change", function () {
            ParachuteSimulation.settings._simulationResults = simulationResults.checked;
        });
    };
    ParachuteSettings.adjustUI = function () {
        var gridElements = document.getElementsByClassName("settings-grid-item");
        var gridElementsY = [];
        var hiddenElementY = document.getElementById("buttons-centerer").getBoundingClientRect().y;
        for (var i = 0; i < gridElements.length; ++i) {
            gridElementsY.push(gridElements[i].getBoundingClientRect().y);
        }
        if (gridElementsY[0] === gridElementsY[1] && gridElementsY[0] === gridElementsY[2] &&
            gridElementsY[0] !== gridElementsY[3] && gridElementsY[0] !== hiddenElementY) {
            document.getElementById("buttons-centerer").style.display = "initial";
        }
        else {
            document.getElementById("buttons-centerer").style.display = "none";
        }
    };
    ParachuteSettings.disableSettingsElements = function () {
        document.getElementById("mass").disabled = true;
        document.getElementById("h0").disabled = true;
        document.getElementById("hopening").disabled = true;
        document.getElementById("opening-time").disabled = true;
        document.getElementById("cd0").disabled = true;
        document.getElementById("A0").disabled = true;
        document.getElementById("cd1").disabled = true;
        document.getElementById("A1").disabled = true;
        document.getElementById("fast-checkbox").disabled = true;
        document.getElementById("simulation-quality").disabled = true;
        document.getElementById("graph-property").disabled = true;
        document.getElementById("download-button").disabled = true;
    };
    ParachuteSettings.enableSettingsElements = function () {
        document.getElementById("mass").disabled = false;
        document.getElementById("h0").disabled = false;
        document.getElementById("hopening").disabled = false;
        document.getElementById("opening-time").disabled = false;
        document.getElementById("cd0").disabled = false;
        document.getElementById("A0").disabled = false;
        document.getElementById("cd1").disabled = false;
        document.getElementById("A1").disabled = false;
        document.getElementById("fast-checkbox").disabled = false;
        document.getElementById("simulation-quality").disabled = false;
        document.getElementById("graph-property").disabled = false;
    };
    return ParachuteSettings;
}());
