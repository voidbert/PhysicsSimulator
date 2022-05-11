//Simulation quality - the number of milliseconds between calculating the positions of bodies (dt)
enum SolarSystemSimulationQuality {
	VeryLow = 86400e4, //10 days
	Low = 43200e4, //5 days
	Medium = 86400e3, //1 day
	High = 43200e3, //0.5 days
	VeryHigh = 8640e3 //0.1 days
}

class SolarSystemSettings {
	private _simulationQuality: SolarSystemSimulationQuality;

	private _simulationSpeed: number;

	private _seeOrbits: boolean;
	private _singleOrbits: boolean;
	private _bodyRadius: number;

	constructor() {
		this._simulationQuality = SolarSystemSimulationQuality.High;
	}

	get simulationQuality() { return this._simulationQuality; }
	get simulationSpeed() { return this._simulationSpeed; }
	get seeOrbits() { return this._seeOrbits; }
	get singleOrbits() { return this._singleOrbits; }
	get bodyRadius() { return this._bodyRadius }

	//Gets the settings set by the user in #ui-div.
	getFromPage(): SolarSystemSettings {
		let settings: SolarSystemSettings = new SolarSystemSettings();

		settings._simulationQuality = {
			"vl": SolarSystemSimulationQuality.VeryLow,
			"l": SolarSystemSimulationQuality.Low,
			"m": SolarSystemSimulationQuality.Medium,
			"h": SolarSystemSimulationQuality.High,
			"vh": SolarSystemSimulationQuality.VeryHigh
		}[(document.getElementById("simulation-quality") as HTMLSelectElement).value];

		settings._simulationSpeed =
			parseInt((document.getElementById("sim-speed") as HTMLInputElement).value);

		settings._seeOrbits = (document.getElementById("orbits") as HTMLInputElement).checked;
		settings._singleOrbits =
			(document.getElementById("single-orbit") as HTMLInputElement).checked;

		settings._bodyRadius =
			parseInt((document.getElementById("body-radius") as HTMLInputElement).value);

		return settings;
	}

	//Adds events to the UI elements in the page. So, when something is inputted, the page and the
	//settings are updated. 
	static addEvents(): void {
		document.getElementById("quality-confirm-button").addEventListener("click", () => {
			//Set the correct settings when the simulation starts.
			SolarSystemSimulation.settings = SolarSystemSimulation.settings.getFromPage();

			SolarSystemSimulation.startSimulation();
		});

		let elements: HTMLElement[] = [
			document.getElementById("sim-speed"), document.getElementById("orbits"),
			document.getElementById("single-orbit"), document.getElementById("body-radius")
		];
		for (let i: number = 0; i < elements.length; ++i) {
			elements[i].addEventListener("input", () => {
				SolarSystemSimulation.settings = SolarSystemSimulation.settings.getFromPage();
			});
		}
	}
}