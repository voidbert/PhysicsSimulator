var ProjectileThrowState;
(function (ProjectileThrowState) {
    ProjectileThrowState[ProjectileThrowState["choosingVelocity"] = 0] = "choosingVelocity";
    ProjectileThrowState[ProjectileThrowState["projectileInLaunchPosition"] = 1] = "projectileInLaunchPosition";
    ProjectileThrowState[ProjectileThrowState["projectileMoving"] = 2] = "projectileMoving";
    ProjectileThrowState[ProjectileThrowState["projectileStopped"] = 3] = "projectileStopped";
    ProjectileThrowState[ProjectileThrowState["showingSimulationResults"] = 4] = "showingSimulationResults";
})(ProjectileThrowState || (ProjectileThrowState = {}));
var ProjectileThrowStateManager = (function () {
    function ProjectileThrowStateManager() {
    }
    ProjectileThrowStateManager.enterChoosingVelocityMode = function () {
        ProjectileThrowSimulation.settings.updatePage();
        ProjectileThrowSimulation.velocityBeforeChoosing =
            ProjectileThrowSimulation.settings.launchVelocity;
        if (isTouchScreenAvailable) {
            document.getElementById("choose-velocity-instructions-touch").
                classList.remove("hidden");
        }
        else {
            document.getElementById("choose-velocity-instructions-mouse").
                classList.remove("hidden");
        }
        document.body.classList.add("no-scrolling");
        smoothScroll(0, 0, function () {
            ProjectileThrowSimulation.state = ProjectileThrowState.choosingVelocity;
        });
    };
    ProjectileThrowStateManager.exitChoosingVelocityMode = function () {
        ProjectileThrowSimulation.state = ProjectileThrowState.projectileInLaunchPosition;
        if (isTouchScreenAvailable) {
            document.getElementById("choose-velocity-instructions-touch").classList.add("hidden");
        }
        else {
            document.getElementById("choose-velocity-instructions-mouse").classList.add("hidden");
        }
        ProjectileThrowSimulation.settings = ProjectileThrowSimulation.settings.getFromPage();
        ProjectileThrowSimulation.settings.updatePage();
        document.body.classList.remove("no-scrolling");
    };
    ProjectileThrowStateManager.scaleSimulationResults = function () {
        var style = window.getComputedStyle(document.getElementById("simulation-results"));
        var elementWidth = (parseFloat(style.width) + 2 * parseFloat(style.paddingLeft))
            * window.devicePixelRatio / this.simulationResultsScale;
        var maxWidth = (ProjectileThrowSimulation.camera.canvasSize.x - 20 * window.devicePixelRatio);
        var scale = maxWidth / (elementWidth * this.simulationResultsScale);
        scale = Math.min(scale, 1);
        document.documentElement.style.setProperty("--simulation-results-scale", scale.toString());
        this.simulationResultsScale = scale;
    };
    ProjectileThrowStateManager.showSimulationResults = function () {
        this.scaleSimulationResults();
        ProjectileThrowSimulation.renderer.canvas.classList.add("blur");
        document.getElementById("simulation-interaction-div").classList.add("blur");
        document.body.classList.add("no-interaction");
        var toShow;
        var toHide;
        if (ProjectileThrowSimulation.settings.airResistance) {
            toShow = document.getElementsByClassName("air-resistance-simulation-results-th");
            toHide = document.getElementsByClassName("default-simulation-results-th");
        }
        else {
            toShow = document.getElementsByClassName("default-simulation-results-th");
            toHide = document.getElementsByClassName("air-resistance-simulation-results-th");
        }
        for (var i = 0; i < toShow.length; ++i) {
            toShow[i].style.removeProperty("display");
        }
        for (var i = 0; i < toHide.length; ++i) {
            toHide[i].style.display = "none";
        }
        document.getElementById("simulation-results").classList.remove("hidden");
        ProjectileThrowSimulation.state = ProjectileThrowState.showingSimulationResults;
    };
    ProjectileThrowStateManager.hideSimulationResults = function () {
        ProjectileThrowSimulation.renderer.canvas.classList.remove("blur");
        document.getElementById("simulation-interaction-div").classList.remove("blur");
        document.body.classList.remove("no-interaction");
        document.getElementById("simulation-results").classList.add("hidden");
        ProjectileThrowSimulation.state = ProjectileThrowState.projectileStopped;
    };
    ProjectileThrowStateManager.simulationResultsScale = 1;
    return ProjectileThrowStateManager;
}());
