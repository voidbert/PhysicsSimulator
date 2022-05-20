//Simulation quality - the number of milliseconds between calculating the positions of bodies (dt)
enum RestitutionSimulationQuality {
	VeryLow = 20,
	Low = 10,
	Medium = 5,
	High = 2.5,
	VeryHigh = 1
}

//What is represented in the y axis of the graph
enum RestitutionGraphProperty {
	Y, Velocity
}

function restitutionGraphPropertyToString(property: RestitutionGraphProperty): string {
	switch (property) {
		case RestitutionGraphProperty.Y:
			return "y (m)";

		case RestitutionGraphProperty.Velocity:
			return "v (m s⁻¹)";
	}
}

class RestitutionSettings {
	private _h0: number = 5;
	private _coefficient: number = 0.7;

	private _simulationQuality: RestitutionSimulationQuality =
		RestitutionSimulationQuality.VeryHigh;
	private _graphProperty: RestitutionGraphProperty = RestitutionGraphProperty.Y;

	//Whether the inputted values are valid numbers
	private _validH0: boolean; private _validCoefficient: boolean;

	get h0() { return this._h0; }
	get coefficient() { return this._coefficient; }
	get simulationQuality() { return this._simulationQuality; }
	get graphProperty() { return this._graphProperty; }

	constructor() {}

	getFromPage(): RestitutionSettings {
		let settings: RestitutionSettings = new RestitutionSettings();

		//Parses a number from an input element (id) and sets a property in the settings to the
		//number in that input. Whether the number is valid or not is a boolean that is assigned to
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

		parseWithSettingsUpdate("height", "_h0", "_validH0", Number.MIN_VALUE);
		parseWithSettingsUpdate("coefficient", "_coefficient", "_validCoefficient",
			Number.MIN_VALUE, 1);

		settings._simulationQuality = {
			"vl": RestitutionSimulationQuality.VeryLow,
			"l": RestitutionSimulationQuality.Low,
			"m": RestitutionSimulationQuality.Medium,
			"h": RestitutionSimulationQuality.High,
			"vh": RestitutionSimulationQuality.VeryHigh
		}[(document.getElementById("simulation-quality") as HTMLSelectElement).value];

		settings._graphProperty = {
			"y": RestitutionGraphProperty.Y,
			"v": RestitutionGraphProperty.Velocity
		}[(document.getElementById("graph-property") as HTMLSelectElement).value];

		return settings;
	}

	updatePage(): void {
		//When the settings change, don't draw the graph.
		RestitutionSimulation.state = RestitutionState.BeforeStart;

		RestitutionSimulation.graph.axes.verticalAxisName =
			restitutionGraphPropertyToString(this._graphProperty);

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
		adjustColor(this._validH0, "height", 2);
		adjustColor(this._validCoefficient, "coefficient", 2);

		//Update simulation properties
		RestitutionSimulation.body.r = new Vec2(0, this._h0);

		//Disable the download button it the settings are changed (not to cause invalid graphs when
		//the simulation quality is changed, for example).
		(document.getElementById("download-button") as HTMLButtonElement).disabled = true;
	}

	//Adds events to the UI elements in the page. So, when something is inputted, the page and the
	//settings are updated.
	static addEvents(): void {
		//Gets called when a page element is changed
		function onUpdate() {
			RestitutionSimulation.settings = RestitutionSimulation.settings.getFromPage();
			RestitutionSimulation.settings.updatePage();
		}

		//The list of DOM elements that, when changed, require the simulation to be updated.
		let settingsElements: string[] = [
			"simulation-quality", "graph-property"
		];

		for (let i: number = 0; i < settingsElements.length; ++i) {
			document.getElementById(settingsElements[i]).addEventListener("change", onUpdate);
		}

		//The same as before but with the oninput event, so that the user doesn't need to unfocus a
		//text input for the value to update
		settingsElements = [
			"height", "coefficient"
		];
		for (let i: number = 0; i < settingsElements.length; ++i) {
			document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
		}
	}

	static disableSettingsElements() {
		(document.getElementById("height") as HTMLInputElement).disabled = true;
		(document.getElementById("coefficient") as HTMLInputElement).disabled = true;
		(document.getElementById("simulation-quality") as HTMLSelectElement).disabled = true;
		(document.getElementById("graph-property") as HTMLSelectElement).disabled = true;

		(document.getElementById("download-button") as HTMLButtonElement).disabled = true;
		//(document.getElementById("start-button") as HTMLButtonElement).disabled = true;
	}

	static enableSettingsElements() {
		(document.getElementById("height") as HTMLInputElement).disabled = false;
		(document.getElementById("coefficient") as HTMLInputElement).disabled = false;
		(document.getElementById("simulation-quality") as HTMLSelectElement).disabled = false;
		(document.getElementById("graph-property") as HTMLSelectElement).disabled = false;

		//(document.getElementById("start-button") as HTMLButtonElement).disabled = false;

		//Don't enable the download button (it is enabled when the worker finishes the simulation)
	}
}