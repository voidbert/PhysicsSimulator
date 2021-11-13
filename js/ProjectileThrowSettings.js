var HeightReference;
(function (HeightReference) {
    HeightReference[HeightReference["BodyBase"] = 0] = "BodyBase";
    HeightReference[HeightReference["BodyCM"] = 1] = "BodyCM";
})(HeightReference || (HeightReference = {}));
var ProjectileThrowSettings = /** @class */ (function () {
    function ProjectileThrowSettings() {
        this._showAxes = true;
        this._showAxesLabels = true;
        this._showGrid = false;
        this._showTrajectory = true;
        this._simulationQuality = SimulationQuality.VeryHigh;
        this._heightReference = HeightReference.BodyBase;
        this._height = 0;
        this._validHeight = true;
        this._launchVelocity = new Vec2(0, 0);
        this._validVelocity = true;
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
    Object.defineProperty(ProjectileThrowSettings.prototype, "validVelocity", {
        get: function () { return this._validVelocity; },
        enumerable: false,
        configurable: true
    });
    //Gets the settings set by the user in the sidebar.
    ProjectileThrowSettings.getFromPage = function (previousSettings) {
        var settings = new ProjectileThrowSettings();
        settings._showAxes = document.getElementById("axes").checked;
        //Axis labels can only be turned on if the axes are on
        if (settings._showAxes) {
            settings._showAxesLabels =
                document.getElementById("axes-labels").checked;
        }
        else {
            settings._showAxesLabels = false;
        }
        settings._showGrid = document.getElementById("grid").checked;
        settings._showTrajectory =
            document.getElementById("trajectory").checked;
        settings._showSimulationResults =
            document.getElementById("simulation-results-checkbox").checked;
        settings._simulationQuality = {
            "vl": SimulationQuality.VeryLow,
            "l": SimulationQuality.Low,
            "m": SimulationQuality.Medium,
            "h": SimulationQuality.High,
            "vh": SimulationQuality.VeryHigh
        }[document.getElementById("simulation-quality").value];
        if (document.getElementById("body-base").checked) {
            settings._heightReference = HeightReference.BodyBase;
        }
        else {
            settings._heightReference = HeightReference.BodyCM;
        }
        //Get the height and see if it's a valid number
        var stringHeight = document.getElementById("height-input").value;
        var numberHeight = Number(stringHeight);
        if (isNaN(numberHeight) || (!isNaN(numberHeight) && numberHeight < 0)) {
            settings._height = previousSettings._height;
            settings._validHeight = false;
        }
        else {
            settings._height = numberHeight;
            settings._validHeight = true;
        }
        //Get the x and y velocities and check if they're valid numbers
        var stringVx = document.getElementById("vx-input").value;
        var stringVy = document.getElementById("vy-input").value;
        var numberVx = Number(stringVx);
        var numberVy = Number(stringVy);
        if (isNaN(numberVx) || isNaN(numberVy)) {
            settings._launchVelocity = previousSettings._launchVelocity;
            settings._validVelocity = false;
        }
        else {
            settings._launchVelocity = new Vec2(numberVx, numberVy);
            settings._validVelocity = true;
        }
        return settings;
    };
    //Updates the simulation and the page (some choices may have to be disabled)
    ProjectileThrowSettings.prototype.updatePage = function (projectile, axes, stepper, trajectory) {
        axes.showAxes = this._showAxes;
        axes.showAxisLabels = this._showAxesLabels;
        axes.showUnitLabels = this._showAxesLabels;
        axes.showArrows = this._showAxes;
        axes.showGrid = this._showGrid;
        //Make the "show arrows" checkbox enabled or disabled depending on the state of showAxes
        var showArrowsCheckbox = document.getElementById("axes-labels");
        if (this._showAxes) {
            showArrowsCheckbox.disabled = false;
        }
        else {
            showArrowsCheckbox.disabled = true;
        }
        axes.updateCaches();
        //Update the simulation quality if the projectile was already launched
        if (stepper) {
            stepper.changeTimeout(this._simulationQuality);
        }
        //Update the position of the body it not mid-simulation. If the height is invalid, show a
        //warning.
        if ((stepper && !stepper.isRunning) || !stepper) {
            if (this._heightReference === HeightReference.BodyCM)
                projectile.r = new Vec2(0, this._height);
            else
                projectile.r = new Vec2(0, this._height + bodyApothem);
        }
        if (this._validHeight) {
            //Hide any invalid height warning
            document.getElementById("invalid-height").style.removeProperty("display");
        }
        else {
            document.getElementById("invalid-height").style.display = "flex";
        }
        //Update the velocity of the body it not mid-simulation. If it is invalid, show a warning.
        if ((stepper && !stepper.isRunning) || !stepper) {
            projectile.v = this._launchVelocity;
        }
        if (this._validVelocity) {
            //Hide any invalid velocity warning
            document.getElementById("invalid-velocity").style.removeProperty("display");
        }
        else {
            document.getElementById("invalid-velocity").style.display = "flex";
        }
        //If the change was applied to a non-moving body, recalculate the trajectory
        if ((stepper && !stepper.isRunning) || !stepper) {
            //Copy the body first
            var bodyCopy = new Body(projectile.mass, projectile.geometry, projectile.r);
            bodyCopy.v = projectile.v;
            bodyCopy.forces = projectile.forces;
            trajectory.points = new ProjectileTrajectory(bodyCopy, this).points;
        }
    };
    //Adds events to the UI elements in the page. So, when something is inputted, the page is
    //updated. setSettings is a function that when called, sets settings to the provided value. The
    //returned functions must be called whenever the stepper or settings are changed (new objects). 
    ProjectileThrowSettings.addEvents = function (projectile, axes, stepper, trajectory, settings, setSettings) {
        //The list of elements that, when changed, require the simulation to be updated.
        var settingsElements = [
            "axes", "axes-labels", "grid", "trajectory", "simulation-results-checkbox",
            "simulation-quality", "body-base", "body-cm"
        ];
        //When an element is changed, call settingsUpdateCallback
        for (var i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("change", function () {
                settings = ProjectileThrowSettings.getFromPage(settings);
                setSettings(settings);
                settings.updatePage(projectile, axes, stepper, trajectory);
            });
        }
        //The same as before but with the oninput event, so that the user doesn't need to unfocus a
        //text input for the value to update
        settingsElements = [
            "height-input", "vx-input", "vy-input"
        ];
        for (var i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("input", function () {
                settings = ProjectileThrowSettings.getFromPage(settings);
                setSettings(settings);
                settings.updatePage(projectile, axes, stepper, trajectory);
            });
        }
        return {
            updateStepper: function (s) {
                stepper = s;
            },
            updateSettings: function (s) {
                settings = s;
            }
        };
    };
    return ProjectileThrowSettings;
}());
