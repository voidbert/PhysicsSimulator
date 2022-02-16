//Simulation quality - the number of milliseconds between calculating the positions of bodies (dt)
enum ParachuteSimulationQuality {
	//Very high numbers because low dts can send things like the resultant force to infinity,
	//breaking the graph
	VeryLow = 10,
	Low = 5,
	Medium = 2,
	High = 1,
	VeryHigh = 0.5
}

//What is represented in the y axis of the graph
enum ParachuteGraphProperty {
	Y, R, Velocity, AirResistance, ResultantForce, Acceleration
}

function parachuteGraphPropertyToString(property: ParachuteGraphProperty): string {
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

class ParachuteSettings {
	private _mass: number = 80;
	private _h0: number = 2000; //Initial height
	private _hopening: number = 500; //The height at which the parachute is opened
	private _openingTime: number = 5.0;

	private _cd0: number = 0.4; private _A0: number = 0.5;
	private _cd1: number = 1.6; private _A1: number = 5;

	//Whether the inputted values are valid numbers
	private _validMass: boolean; private _validH0: boolean;
	private _validHopening: boolean; private _validOpeningTime: boolean;

	private _validCd0: boolean; private _validA0: boolean;
	private _validCd1: boolean; private _validA1: boolean;

	private _simulationQuality: ParachuteSimulationQuality = ParachuteSimulationQuality.VeryHigh;
	private _graphProperty: ParachuteGraphProperty = ParachuteGraphProperty.Velocity;
	private _seeTheoretical: boolean = true;
	private _simulationResults: boolean = true;

	get mass() { return this._mass; }
	get h0() { return this._h0; }
	get hopening() { return this._hopening; }
	get openingTime() { return this._openingTime; }

	get cd0() { return this._cd0; } get A0() { return this._A0; } 
	get cd1() { return this._cd1; } get A1() { return this._A1; } 

	get simulationQuality() { return this._simulationQuality; }
	get graphProperty() { return this._graphProperty; }
	get seeTheoretical() { return this._seeTheoretical; }
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
			"y": ParachuteGraphProperty.Y,
			"r": ParachuteGraphProperty.R,
			"v": ParachuteGraphProperty.Velocity,
			"Rar": ParachuteGraphProperty.AirResistance,
			"Fr": ParachuteGraphProperty.ResultantForce,
			"a": ParachuteGraphProperty.Acceleration
		}[(document.getElementById("graph-property") as HTMLSelectElement).value];

		settings._seeTheoretical =
			(document.getElementById("see-theoretical") as HTMLInputElement).checked;

		settings._simulationResults =
			(document.getElementById("simulation-results-check") as HTMLInputElement).checked;

		//Parses a number from an input element (id) and sets a property in settings to the number
		//in that input. Whether the number is valid or not is a boolean that is assigned to
		//validProperty. A number out of the [min, max] range will be considered invalid.
		let parseWithSettingsUpdate = (id: string, property: string, validProperty: string,
			min: number, max: number = Infinity) => {

			settings[property] = parseInputNumber(id, min, max);
			if (isNaN(settings[property])) {
				settings[validProperty] = false;
				settings[property] = this[property]; //Use last valid value
			} else {
				settings[validProperty] = true;
			}
		}

		//Parse text fields, converting the text to numbers
		parseWithSettingsUpdate("mass", "_mass", "_validMass", Number.MIN_VALUE);
		parseWithSettingsUpdate("h0", "_h0", "_validH0", Number.MIN_VALUE);
		parseWithSettingsUpdate("hopening", "_hopening", "_validHopening", Number.MIN_VALUE,
			settings._h0);
		parseWithSettingsUpdate("opening-time", "_openingTime", "_validOpeningTime", 0);

		parseWithSettingsUpdate("cd0", "_cd0", "_validCd0", Number.MIN_VALUE);
		parseWithSettingsUpdate("A0", "_A0", "_validA0", Number.MIN_VALUE);
		parseWithSettingsUpdate("cd1", "_cd1", "_validCd1", Number.MIN_VALUE);
		parseWithSettingsUpdate("A1", "_A1", "_validA1", Number.MIN_VALUE);

		return settings;
	}

	updatePage(): void {
		//When the settings change, don't draw the graph.
		ParachuteSimulation.state = ParachuteState.BeforeRelease;

		ParachuteSimulation.graph.axes.verticalAxisName =
			parachuteGraphPropertyToString(this._graphProperty);

		//Given an input element, it will add "red" to its nth parent class list if the error
		//boolean is true. Otherwise "red" will be removed from that class list. 
		function adjustColor(error: boolean, id: string, n: number /* parent */) {
			//Get the nth parent
			let element: HTMLElement = document.getElementById(id);
			for (; n > 0; n--) {
				element = element.parentElement;
			}

			if (error) {
				element.classList.remove("red");
			} else {
				element.classList.add("red");
			}
		}

		//Make elements red to show a typing error in a number
		adjustColor(this._validMass, "mass", 2);
		adjustColor(this._validH0, "h0", 2);
		adjustColor(this._validHopening, "hopening", 2);
		adjustColor(this._validOpeningTime, "opening-time", 2);

		adjustColor(this._validCd0, "cd0", 1);
		adjustColor(this._validA0, "A0", 1);
		adjustColor(this._validCd1, "cd1", 1);
		adjustColor(this._validA1, "A1", 1);

		//Update simulation properties
		ParachuteSimulation.body.mass = this._mass;
		ParachuteSimulation.body.r = new Vec2(0, this._h0);

		//Disable the download button it the settings are changed (not to cause invalid graphs when
		//the simulation quality is changed, for example).
		(document.getElementById("download-button") as HTMLButtonElement).disabled = true;
	}

	//Adds events to the UI elements in the page. So, when something is inputted, the page and the
	//settings are updated.
	static addEvents(): void {
		//Gets called when a page element is changed
		function onUpdate() {
			ParachuteSimulation.settings = ParachuteSimulation.settings.getFromPage();
			ParachuteSimulation.settings.updatePage();
		}

		//The list of DOM elements that, when changed, require the simulation to be updated.
		let settingsElements: string[] = [
			"simulation-quality", "graph-property", 
		];

		for (let i: number = 0; i < settingsElements.length; ++i) {
			document.getElementById(settingsElements[i]).addEventListener("change", onUpdate);
		}

		//The same as before but with the oninput event, so that the user doesn't need to unfocus a
		//text input for the value to update
		settingsElements = [
			"mass", "h0", "hopening", "opening-time", "cd0", "A0", "cd1", "A1"
		];
		for (let i: number = 0; i < settingsElements.length; ++i) {
			document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
		}

		//The "see theoretical graph" and "simulation results" options are independent of the others
		//because they can be changed while the sky diver is falling.
		let seeTheoreticalCheckbox = document.getElementById("see-theoretical") as HTMLInputElement;
		seeTheoreticalCheckbox.addEventListener("change", () => {
			ParachuteSimulation.settings._seeTheoretical = seeTheoreticalCheckbox.checked;
		});

		let simulationResults = document.getElementById("simulation-results-check") as
			HTMLInputElement;
		simulationResults.addEventListener("change", () => {
			ParachuteSimulation.settings._simulationResults = simulationResults.checked;
		});
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
		(document.getElementById("opening-time") as HTMLInputElement).disabled = true;

		(document.getElementById("cd0") as HTMLInputElement).disabled = true;
		(document.getElementById("A0") as HTMLInputElement).disabled = true;
		(document.getElementById("cd1") as HTMLInputElement).disabled = true;
		(document.getElementById("A1") as HTMLInputElement).disabled = true;

		(document.getElementById("simulation-quality") as HTMLSelectElement).disabled = true;
		(document.getElementById("graph-property") as HTMLSelectElement).disabled = true;

		(document.getElementById("download-button") as HTMLButtonElement).disabled = true;
	}

	static enableSettingsElements() {
		(document.getElementById("mass") as HTMLInputElement).disabled = false;
		(document.getElementById("h0") as HTMLInputElement).disabled = false;
		(document.getElementById("hopening") as HTMLInputElement).disabled = false;
		(document.getElementById("opening-time") as HTMLInputElement).disabled = false;

		(document.getElementById("cd0") as HTMLInputElement).disabled = false;
		(document.getElementById("A0") as HTMLInputElement).disabled = false;
		(document.getElementById("cd1") as HTMLInputElement).disabled = false;
		(document.getElementById("A1") as HTMLInputElement).disabled = false;

		(document.getElementById("simulation-quality") as HTMLSelectElement).disabled = false;
		(document.getElementById("graph-property") as HTMLSelectElement).disabled = false;

		//Don't enable the download button (it is enabled when the worker finishes the simulation)
	}
}