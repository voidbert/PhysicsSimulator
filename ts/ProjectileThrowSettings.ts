enum HeightReference {
	BodyBase, BodyCM
}

class ProjectileThrowSettings {
	private _showAxes: boolean;
	private _showAxesLabels: boolean;
	private _showGrid: boolean;

	private _simulationQuality: SimulationQuality;

	private _heightReference: HeightReference;

	constructor() {}

	public get showAxes() { return this._showAxes; }
	public get showAxesLabels() { return this._showAxesLabels; }
	public get showGrid() { return this._showGrid; }
	public get simulationQuality() { return this._simulationQuality; }
	public get heightReference() { return this._heightReference; }

	//Gets the settings set by the user in the sidebar.
	static getFromPage(): ProjectileThrowSettings {
		let settings: ProjectileThrowSettings = new ProjectileThrowSettings();

		settings._showAxes = (document.getElementById("axes") as HTMLInputElement).checked;

		//Axis labels can only be turned on if the axes are on
		if (settings._showAxes) {
			settings._showAxesLabels =
				(document.getElementById("axes-labels") as HTMLInputElement).checked;
		} else {
			settings._showAxesLabels = false;
		}

		settings._showGrid = (document.getElementById("grid") as HTMLInputElement).checked;

		settings._simulationQuality = {
			"vl": SimulationQuality.VeryLow,
			"l": SimulationQuality.Low,
			"m": SimulationQuality.Medium,
			"h": SimulationQuality.High,
			"vh": SimulationQuality.VeryHigh
		}[(document.getElementById("simulation-quality") as HTMLSelectElement).value];

		if ((document.getElementById("body-base") as HTMLInputElement).checked) {
			settings._heightReference = HeightReference.BodyBase;
		} else {
			settings._heightReference = HeightReference.BodyCM;
		}

		return settings;
	}

	//Updates the simulation and the page (some choices may have to be disabled).
	updatePage(axes: AxisSystem, stepper: TimeStepper): void {
		axes.showAxes = this._showAxes;
		axes.showAxisLabels = this._showAxesLabels;
		axes.showUnitLabels = this._showAxesLabels;
		axes.showArrows = this._showAxes;
		axes.showGrid = this._showGrid;

		//Make the "show arrows" checkbox enabled or disabled depending on the state of showAxes
		let showArrowsCheckbox = (document.getElementById("axes-labels") as HTMLInputElement);
		if (this._showAxes) {
			showArrowsCheckbox.disabled = false;
		} else {
			showArrowsCheckbox.disabled = true;
		}

		axes.updateCaches();

		//Update the simulation quality if the projectile was already launched
		if (stepper) {
			stepper.changeTimeout(this._simulationQuality);
		}
	}
}