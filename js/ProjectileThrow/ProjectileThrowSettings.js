var ProjectileThrowSimulationQuality;
(function (ProjectileThrowSimulationQuality) {
    ProjectileThrowSimulationQuality[ProjectileThrowSimulationQuality["VeryLow"] = 50] = "VeryLow";
    ProjectileThrowSimulationQuality[ProjectileThrowSimulationQuality["Low"] = 30] = "Low";
    ProjectileThrowSimulationQuality[ProjectileThrowSimulationQuality["Medium"] = 20] = "Medium";
    ProjectileThrowSimulationQuality[ProjectileThrowSimulationQuality["High"] = 10] = "High";
    ProjectileThrowSimulationQuality[ProjectileThrowSimulationQuality["VeryHigh"] = 5] = "VeryHigh";
})(ProjectileThrowSimulationQuality || (ProjectileThrowSimulationQuality = {}));
var HeightReference;
(function (HeightReference) {
    HeightReference[HeightReference["BodyBase"] = 0] = "BodyBase";
    HeightReference[HeightReference["BodyCM"] = 1] = "BodyCM";
})(HeightReference || (HeightReference = {}));
var ProjectileThrowSettings = (function () {
    function ProjectileThrowSettings() {
        this._showAxes = true;
        this._showAxesLabels = true;
        this._showGrid = false;
        this._showTrajectory = true;
        this._simulationQuality = ProjectileThrowSimulationQuality.VeryHigh;
        this._heightReference = HeightReference.BodyBase;
        this._mass = 1;
        this._validMass = true;
        this._radius = 0.5;
        this._validRadius = true;
        this._height = 0;
        this._validHeight = true;
        this._launchVelocity = new Vec2(0, 0);
        this._validVelocity = true;
        this._airResistance = false;
    }
    Object.defineProperty(ProjectileThrowSettings.prototype, "showAxes", {
        get: function () { return this._showAxes; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "showAxesLabels", {
        get: function () { return this._showAxesLabels; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "showGrid", {
        get: function () { return this._showGrid; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "showTrajectory", {
        get: function () { return this._showTrajectory; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "showSimulationResults", {
        get: function () { return this._showSimulationResults; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "simulationQuality", {
        get: function () { return this._simulationQuality; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "heightReference", {
        get: function () { return this._heightReference; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "mass", {
        get: function () { return this._mass; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "radius", {
        get: function () { return this._radius; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "height", {
        get: function () { return this._height; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "launchVelocity", {
        get: function () { return this._launchVelocity; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "airResistance", {
        get: function () { return this._airResistance; },
        enumerable: false,
        configurable: true
    });
    ProjectileThrowSettings.prototype.getFromPage = function () {
        var _this = this;
        var settings = new ProjectileThrowSettings();
        settings._showAxes = document.getElementById("axes").checked;
        if (settings._showAxes) {
            settings._showAxesLabels =
                document.getElementById("axes-labels").checked;
        }
        else {
            settings._showAxesLabels = false;
        }
        settings._showGrid = document.getElementById("grid").checked;
        settings._showSimulationResults =
            document.getElementById("simulation-results-checkbox").checked;
        settings._simulationQuality = {
            "vl": ProjectileThrowSimulationQuality.VeryLow,
            "l": ProjectileThrowSimulationQuality.Low,
            "m": ProjectileThrowSimulationQuality.Medium,
            "h": ProjectileThrowSimulationQuality.High,
            "vh": ProjectileThrowSimulationQuality.VeryHigh
        }[document.getElementById("simulation-quality").value];
        if (document.getElementById("body-base").checked) {
            settings._heightReference = HeightReference.BodyBase;
        }
        else {
            settings._heightReference = HeightReference.BodyCM;
        }
        var parseWithSettingsUpdate = function (id, property, validProperty, min, max) {
            if (min === void 0) { min = -Infinity; }
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
        parseWithSettingsUpdate("mass-input", "_mass", "_validMass", Number.MIN_VALUE);
        parseWithSettingsUpdate("radius-input", "_radius", "_validRadius", Number.MIN_VALUE);
        parseWithSettingsUpdate("height-input", "_height", "_validHeight", 0);
        var stringVx = document.getElementById("vx-input").value;
        var stringVy = document.getElementById("vy-input").value;
        var numberVx = Number(stringVx);
        var numberVy = Number(stringVy);
        if (isNaN(numberVx) || isNaN(numberVy)) {
            settings._launchVelocity = this._launchVelocity;
            settings._validVelocity = false;
        }
        else {
            settings._launchVelocity = new Vec2(numberVx, numberVy);
            settings._validVelocity = true;
        }
        settings._airResistance = document.getElementById("air-res").checked;
        settings._showTrajectory = !settings._airResistance &&
            document.getElementById("trajectory").checked;
        return settings;
    };
    ProjectileThrowSettings.prototype.updatePage = function () {
        ProjectileThrowSimulation.axes.showAxes = this._showAxes;
        ProjectileThrowSimulation.axes.showArrows = this._showAxes;
        ProjectileThrowSimulation.axes.showUnitLabelsX = this._showAxesLabels;
        ProjectileThrowSimulation.axes.showUnitLabelsY = this._showAxesLabels;
        if (this._showAxesLabels) {
            ProjectileThrowSimulation.axes.horizontalAxisName = "x";
            ProjectileThrowSimulation.axes.verticalAxisName = "y";
        }
        else {
            ProjectileThrowSimulation.axes.horizontalAxisName = "";
            ProjectileThrowSimulation.axes.verticalAxisName = "";
        }
        ProjectileThrowSimulation.axes.showHorizontalGrid = this._showGrid;
        ProjectileThrowSimulation.axes.showVerticalGrid = this._showGrid;
        var showArrowsCheckbox = document.getElementById("axes-labels");
        if (this._showAxes) {
            showArrowsCheckbox.disabled = false;
        }
        else {
            showArrowsCheckbox.disabled = true;
        }
        if (ProjectileThrowSimulation.state === ProjectileThrowState.projectileInLaunchPosition ||
            ProjectileThrowSimulation.state === ProjectileThrowState.projectileStopped) {
            if (this._heightReference === HeightReference.BodyCM)
                ProjectileThrowSimulation.projectile.r = new Vec2(0, this._height);
            else
                ProjectileThrowSimulation.projectile.r = new Vec2(0, this._height + this._radius);
        }
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
        adjustColor(this._validMass, "mass-input", 2);
        adjustColor(this._validRadius, "radius-input", 2);
        adjustColor(this._validHeight, "height-input", 2);
        adjustColor(this._validVelocity, "vx-input", 2);
        var trajectoryCheckbox = document.getElementById("trajectory");
        trajectoryCheckbox.disabled = this._airResistance;
        if (ProjectileThrowSimulation.state === ProjectileThrowState.projectileInLaunchPosition ||
            ProjectileThrowSimulation.state === ProjectileThrowState.projectileStopped) {
            ProjectileThrowSimulation.projectile.v = this._launchVelocity;
            ProjectileThrowSimulation.projectile.mass = this._mass;
            ProjectileThrowSimulation.projectile.forces = [new Vec2(0, -GRAVITY * this._mass)];
            ProjectileThrowSimulation.projectile.geometry =
                ExtraMath.generatePolygon(20, this._radius);
            ProjectileThrowSimulation.trajectory = ProjectileThrowTrajectory
                .generateLimitedTrajectory(ProjectileThrowSimulation.projectile, this);
        }
    };
    ProjectileThrowSettings.updatePageVelocity = function (velocity) {
        document.getElementById("vx-input").value = velocity.x.toString();
        document.getElementById("vy-input").value = velocity.y.toString();
    };
    ProjectileThrowSettings.addEvents = function () {
        var settingsElements = [
            "axes", "axes-labels", "grid", "trajectory", "simulation-results-checkbox",
            "simulation-quality", "body-base", "body-cm", "air-res"
        ];
        function onUpdate() {
            ProjectileThrowSimulation.settings = ProjectileThrowSimulation.settings.getFromPage();
            ProjectileThrowSimulation.settings.updatePage();
        }
        for (var i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("change", onUpdate);
        }
        settingsElements = [
            "mass-input", "radius-input", "height-input", "vx-input", "vy-input"
        ];
        for (var i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
        }
    };
    ProjectileThrowSettings.disableSettingsElements = function () {
        document.getElementById("simulation-quality").disabled = true;
        document.getElementById("body-base").disabled = true;
        document.getElementById("body-cm").disabled = true;
        document.getElementById("mass-input").disabled = true;
        document.getElementById("radius-input").disabled = true;
        document.getElementById("height-input").disabled = true;
        document.getElementById("vx-input").disabled = true;
        document.getElementById("vy-input").disabled = true;
        document.getElementById("choose-screen-velocity").disabled = true;
        document.getElementById("air-res").disabled = true;
    };
    ProjectileThrowSettings.enableSettingsElements = function () {
        document.getElementById("simulation-quality").disabled = false;
        document.getElementById("body-base").disabled = false;
        document.getElementById("body-cm").disabled = false;
        document.getElementById("mass-input").disabled = false;
        document.getElementById("radius-input").disabled = false;
        document.getElementById("height-input").disabled = false;
        document.getElementById("vx-input").disabled = false;
        document.getElementById("vy-input").disabled = false;
        document.getElementById("choose-screen-velocity").disabled = false;
        document.getElementById("air-res").disabled = false;
    };
    return ProjectileThrowSettings;
}());
