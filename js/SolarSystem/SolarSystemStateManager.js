var SolarSystemState;
(function (SolarSystemState) {
    SolarSystemState[SolarSystemState["ChoosingSimulationQuality"] = 0] = "ChoosingSimulationQuality";
    SolarSystemState[SolarSystemState["NormalSimulation"] = 1] = "NormalSimulation";
    SolarSystemState[SolarSystemState["ShowingSettings"] = 2] = "ShowingSettings";
})(SolarSystemState || (SolarSystemState = {}));
class SolarSystemStateManager {
    static leaveChoosingSimulationQualityMode() {
        document.getElementById("choose-simulation-quality").style.display = "none";
        document.documentElement.style.setProperty("--initial-ui-div-display", "block");
        SolarSystemSimulation.state = SolarSystemState.NormalSimulation;
    }
    static enterShowingSettingsMode() {
        document.documentElement.style.setProperty("--ui-div-display", "block");
        SolarSystemSimulation.state = SolarSystemState.ShowingSettings;
    }
    static leaveShowingSettingsMode() {
        document.documentElement.style.setProperty("--ui-div-display", "none");
        SolarSystemSimulation.state = SolarSystemState.NormalSimulation;
    }
}
