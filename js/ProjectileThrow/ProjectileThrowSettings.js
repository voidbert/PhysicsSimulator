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
class ProjectileThrowSettings {
    constructor() {
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
    get showAxes() { return this._showAxes; }
    get showAxesLabels() { return this._showAxesLabels; }
    get showGrid() { return this._showGrid; }
    get showTrajectory() { return this._showTrajectory; }
    get showSimulationResults() { return this._showSimulationResults; }
    get simulationQuality() { return this._simulationQuality; }
    get heightReference() { return this._heightReference; }
    get mass() { return this._mass; }
    get radius() { return this._radius; }
    get height() { return this._height; }
    get launchVelocity() { return this._launchVelocity; }
    get airResistance() { return this._airResistance; }
    getFromPage() {
        let settings = new ProjectileThrowSettings();
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
        let parseWithSettingsUpdate = (id, property, validProperty, min = -Infinity, max = Infinity) => {
            settings[property] = parseInputNumber(id, min, max);
            if (isNaN(settings[property])) {
                settings[validProperty] = false;
                settings[property] = this[property];
            }
            else {
                settings[validProperty] = true;
            }
        };
        parseWithSettingsUpdate("mass-input", "_mass", "_validMass", Number.MIN_VALUE);
        parseWithSettingsUpdate("radius-input", "_radius", "_validRadius", Number.MIN_VALUE);
        parseWithSettingsUpdate("height-input", "_height", "_validHeight", 0);
        let stringVx = document.getElementById("vx-input").value;
        let stringVy = document.getElementById("vy-input").value;
        let numberVx = Number(stringVx);
        let numberVy = Number(stringVy);
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
    }
    updatePage() {
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
        let showArrowsCheckbox = document.getElementById("axes-labels");
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
        adjustColor(this._validMass, "mass-input", 2);
        adjustColor(this._validRadius, "radius-input", 2);
        adjustColor(this._validHeight, "height-input", 2);
        adjustColor(this._validVelocity, "vx-input", 2);
        let trajectoryCheckbox = document.getElementById("trajectory");
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
    }
    static updatePageVelocity(velocity) {
        document.getElementById("vx-input").value = velocity.x.toString();
        document.getElementById("vy-input").value = velocity.y.toString();
    }
    static addEvents() {
        let settingsElements = [
            "axes", "axes-labels", "grid", "trajectory", "simulation-results-checkbox",
            "simulation-quality", "body-base", "body-cm", "air-res"
        ];
        function onUpdate() {
            ProjectileThrowSimulation.settings = ProjectileThrowSimulation.settings.getFromPage();
            ProjectileThrowSimulation.settings.updatePage();
        }
        for (let i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("change", onUpdate);
        }
        settingsElements = [
            "mass-input", "radius-input", "height-input", "vx-input", "vy-input"
        ];
        for (let i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
        }
    }
    static disableSettingsElements() {
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
    }
    static enableSettingsElements() {
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
    }
}
