enum SolarSystemState {
	ChoosingSimulationQuality, //Before starting, a simulation quality must be chosen
	NormalSimulation, //Running the simulation
	ShowingSettings //Running the simulation and the settings are open (portrait only)
}

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