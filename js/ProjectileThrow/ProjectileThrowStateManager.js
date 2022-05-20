var ProjectileThrowState;
(function (ProjectileThrowState) {
    ProjectileThrowState[ProjectileThrowState["choosingVelocity"] = 0] = "choosingVelocity";
    ProjectileThrowState[ProjectileThrowState["projectileInLaunchPosition"] = 1] = "projectileInLaunchPosition";
    ProjectileThrowState[ProjectileThrowState["projectileMoving"] = 2] = "projectileMoving";
    ProjectileThrowState[ProjectileThrowState["projectileStopped"] = 3] = "projectileStopped";
    ProjectileThrowState[ProjectileThrowState["showingSimulationResults"] = 4] = "showingSimulationResults";
})(ProjectileThrowState || (ProjectileThrowState = {}));
class ProjectileThrowStateManager {
    static enterChoosingVelocityMode() {
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
        smoothScroll(0, 0, () => {
            ProjectileThrowSimulation.state = ProjectileThrowState.choosingVelocity;
        });
    }
    static exitChoosingVelocityMode() {
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
    }
    static scaleSimulationResults() {
        let style = window.getComputedStyle(document.getElementById("simulation-results"));
        let elementWidth = (parseFloat(style.width) + 2 * parseFloat(style.paddingLeft))
            * window.devicePixelRatio / this.simulationResultsScale;
        let maxWidth = (ProjectileThrowSimulation.camera.canvasSize.x - 20 * window.devicePixelRatio);
        let scale = maxWidth / (elementWidth * this.simulationResultsScale);
        scale = Math.min(scale, 1);
        document.documentElement.style.setProperty("--simulation-results-scale", scale.toString());
        this.simulationResultsScale = scale;
    }
    static showSimulationResults() {
        this.scaleSimulationResults();
        ProjectileThrowSimulation.renderer.canvas.classList.add("blur");
        document.getElementById("simulation-interaction-div").classList.add("blur");
        document.body.classList.add("no-interaction");
        let toShow;
        let toHide;
        if (ProjectileThrowSimulation.settings.airResistance) {
            toShow = document.getElementsByClassName("air-resistance-simulation-results-th");
            toHide = document.getElementsByClassName("default-simulation-results-th");
        }
        else {
            toShow = document.getElementsByClassName("default-simulation-results-th");
            toHide = document.getElementsByClassName("air-resistance-simulation-results-th");
        }
        for (let i = 0; i < toShow.length; ++i) {
            toShow[i].style.removeProperty("display");
        }
        for (let i = 0; i < toHide.length; ++i) {
            toHide[i].style.display = "none";
        }
        document.getElementById("simulation-results").classList.remove("hidden");
        ProjectileThrowSimulation.state = ProjectileThrowState.showingSimulationResults;
    }
    static hideSimulationResults() {
        ProjectileThrowSimulation.renderer.canvas.classList.remove("blur");
        document.getElementById("simulation-interaction-div").classList.remove("blur");
        document.body.classList.remove("no-interaction");
        document.getElementById("simulation-results").classList.add("hidden");
        ProjectileThrowSimulation.state = ProjectileThrowState.projectileStopped;
    }
}
ProjectileThrowStateManager.simulationResultsScale = 1;
