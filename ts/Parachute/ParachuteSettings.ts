//Simulation quality - the number of milliseconds between calculating the positions of bodies (dt)
enum ParachuteSimulationQuality {
	VeryLow = 100,
	Low = 50,
	Medium = 20,
	High = 10,
	VeryHigh = 5
}

//What is represented in the y axis of the graph
enum GraphProperty {
	Y, R, Velocity, AirResistance, ResultantForce, Acceleration
}

class ParachuteSettings {
	private _mass: number = 80;
	private _h0: number = 2000; //Initial height
	private _hopening: number = 500; //The height at which the parachute is opened

	private _cd0: number = 0.4; private _A0: number = 0.5;
	private _cd1: number = 1.6; private _A1: number = 3;

	private _simulationQuality: ParachuteSimulationQuality = ParachuteSimulationQuality.VeryHigh;
	private _graphProperty: GraphProperty = GraphProperty.Velocity;
	private _simulationResults: boolean = true;

	get mass() { return this._mass; }
	get h0() { return this._h0; }
	get hopening() { return this._hopening; }

	get cd0() { return this._cd0; } get A0() { return this._A0; } 
	get cd1() { return this._cd1; } get A1() { return this._A1; } 

	get simulationQuality() { return this._simulationQuality; }
	get graphProperty() { return this._graphProperty; }
	get simulationResults() { return this._simulationResults; }

	constructor() {}

	getFromPage(): ParachuteSettings {
		let settings: ParachuteSettings = new ParachuteSettings();

		//Simulation tab
		settings._simulationQuality = {
			"vl": ParachuteSimulationQuality.VeryLow,
			"l": ParachuteSimulationQuality.Low,
			"m": ParachuteSimulationQuality.Medium,
			"h": ParachuteSimulationQuality.High,
			"vh": ParachuteSimulationQuality.VeryHigh
		}[(document.getElementById("simulation-quality") as HTMLSelectElement).value];

		settings._graphProperty = {
			"y": GraphProperty.Y,
			"r": GraphProperty.R,
			"v": GraphProperty.Velocity,
			"Rar": GraphProperty.AirResistance,
			"Fr": GraphProperty.ResultantForce,
			"a": GraphProperty.Acceleration
		}[(document.getElementById("graph-property") as HTMLSelectElement).value];

		settings._simulationResults =
			(document.getElementById("simulation-results") as HTMLInputElement).checked;

		return settings;
	}

	updatePage(): void {
		//When the settings change, don't draw the graph.
		ParachuteSimulation.state = ParachuteState.BeforeRelease;

		switch (this._graphProperty) {
			case GraphProperty.Y:
				ParachuteSimulation.graph.axes.verticalAxisName = "y (m)";
				break;

			case GraphProperty.R:
				ParachuteSimulation.graph.axes.verticalAxisName = "r (m)";
				break;

			case GraphProperty.Velocity:
				ParachuteSimulation.graph.axes.verticalAxisName = "v (m s⁻¹)";
				break;

			case GraphProperty.AirResistance:
				ParachuteSimulation.graph.axes.verticalAxisName = "Rar (N)";
				break;

			case GraphProperty.ResultantForce:
				ParachuteSimulation.graph.axes.verticalAxisName = "Fr (N)";
				break;

			case GraphProperty.Acceleration:
				ParachuteSimulation.graph.axes.verticalAxisName = "a (m s⁻²)";
				break;
		}
	}

	//Adds events to the UI elements in the page. So, when something is inputted, the page and the
	//settings are updated.
	static addEvents(): void {
		//The list of DOM elements that, when changed, require the simulation to be updated.
		let settingsElements: string[] = [
			"simulation-quality", "graph-property", "simulation-results"
		];

		//Gets called when a page element is changed
		function onUpdate() {
			ParachuteSimulation.settings = ParachuteSimulation.settings.getFromPage();
			ParachuteSimulation.settings.updatePage();
		}

		for (let i: number = 0; i < settingsElements.length; ++i) {
			document.getElementById(settingsElements[i]).addEventListener("change", onUpdate);
		}

		//The same as before but with the oninput event, so that the user doesn't need to unfocus a
		//text input for the value to update
		settingsElements = [
			"mass", "h0", "hopening", "cd0", "A0", "cd1", "A1"
		];
		for (let i: number = 0; i < settingsElements.length; ++i) {
			document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
		}
	}

	//Centers the buttons in case the grid is 3 elements wide. This could be achieved with a media
	//query but that would fail for transitioning window sizes (I theorize it's due to rem to px
	//conversions with approximations). This must be called every render loop, as window.onresize
	//is called before elements' positions are updated.
	static adjustUI() {
		let gridElements: HTMLCollectionOf<HTMLElement> =
			document.getElementsByClassName("settings-grid-item") as HTMLCollectionOf<HTMLElement>;
		let gridElementsY: number[] = [];
		let hiddenElementY = document.getElementById("buttons-centerer").getBoundingClientRect().y;

		//Get the elements' vertical position
		for (let i = 0; i < gridElements.length; ++i) {
			gridElementsY.push(gridElements[i].getBoundingClientRect().y);
		}

		//If only three elements have the same vertical position, the grid is 3 elements wide
		if (gridElementsY[0] === gridElementsY[1] && gridElementsY[0] === gridElementsY[2] &&
			gridElementsY[0] !== gridElementsY[3] && gridElementsY[0] !== hiddenElementY) {

			//Make an element visible to center the buttons
			document.getElementById("buttons-centerer").style.display = "initial";
		} else {
			document.getElementById("buttons-centerer").style.display = "none";
		}
	}

	static disableSettingsElements() {
		(document.getElementById("mass") as HTMLInputElement).disabled = true;
		(document.getElementById("h0") as HTMLInputElement).disabled = true;
		(document.getElementById("hopening") as HTMLInputElement).disabled = true;

		(document.getElementById("cd0") as HTMLInputElement).disabled = true;
		(document.getElementById("A0") as HTMLInputElement).disabled = true;
		(document.getElementById("cd1") as HTMLInputElement).disabled = true;
		(document.getElementById("A1") as HTMLInputElement).disabled = true;

		(document.getElementById("simulation-quality") as HTMLSelectElement).disabled = true;
		(document.getElementById("graph-property") as HTMLSelectElement).disabled = true;
		(document.getElementById("simulation-results") as HTMLInputElement).disabled = true;

		(document.getElementById("download-button") as HTMLButtonElement).disabled = true;
	}

	static enableSettingsElements() {
		(document.getElementById("mass") as HTMLInputElement).disabled = false;
		(document.getElementById("h0") as HTMLInputElement).disabled = false;
		(document.getElementById("hopening") as HTMLInputElement).disabled = false;

		(document.getElementById("cd0") as HTMLInputElement).disabled = false;
		(document.getElementById("A0") as HTMLInputElement).disabled = false;
		(document.getElementById("cd1") as HTMLInputElement).disabled = false;
		(document.getElementById("A1") as HTMLInputElement).disabled = false;

		(document.getElementById("simulation-quality") as HTMLSelectElement).disabled = false;
		(document.getElementById("graph-property") as HTMLSelectElement).disabled = false;
		(document.getElementById("simulation-results") as HTMLInputElement).disabled = false;

		(document.getElementById("download-button") as HTMLButtonElement).disabled = false;
	}
}