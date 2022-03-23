var ParachuteState;
(function (ParachuteState) {
    ParachuteState[ParachuteState["BeforeRelease"] = 0] = "BeforeRelease";
    ParachuteState[ParachuteState["Released"] = 1] = "Released";
    ParachuteState[ParachuteState["ReachedGround"] = 2] = "ReachedGround";
    ParachuteState[ParachuteState["ShowingSimulationResults"] = 3] = "ShowingSimulationResults";
})(ParachuteState || (ParachuteState = {}));
var ParachuteStateManager = (function () {
    function ParachuteStateManager() {
    }
    ParachuteStateManager.scaleSimulationResults = function () {
        var style = window.getComputedStyle(document.getElementById("simulation-results"));
        var elementWidth = (parseFloat(style.width) + 2 * parseFloat(style.paddingLeft))
            * window.devicePixelRatio / this.simulationResultsScale;
        var maxWidth = (window.innerWidth - 20) * window.devicePixelRatio;
        var scale = maxWidth / (elementWidth * this.simulationResultsScale);
        scale = Math.min(scale, 1);
        document.documentElement.style.setProperty("--simulation-results-scale", scale.toString());
        this.simulationResultsScale = scale;
    };
    ParachuteStateManager.showSimulationResults = function () {
        this.scaleSimulationResults();
        document.getElementById("settings-grid").classList.add("blur");
        document.getElementById("graph-container").classList.add("blur");
        document.body.classList.add("no-interaction");
        document.getElementById("simulation-results").classList.remove("hidden");
        ParachuteSimulation.state = ParachuteState.ShowingSimulationResults;
        smoothScroll(0, 0);
    };
    ParachuteStateManager.hideSimulationResults = function () {
        this.scaleSimulationResults();
        document.getElementById("settings-grid").classList.remove("blur");
        document.getElementById("graph-container").classList.remove("blur");
        document.body.classList.remove("no-interaction");
        document.getElementById("simulation-results").classList.add("hidden");
        ParachuteSimulation.state = ParachuteState.BeforeRelease;
    };
    ParachuteStateManager.simulationResultsScale = 1;
    return ParachuteStateManager;
}());
