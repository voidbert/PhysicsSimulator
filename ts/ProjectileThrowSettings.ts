enum HeightReference {
	BodyBase, BodyCM
}

class ProjectileThrowSettings {
	private _showAxes: boolean;
	private _showAxesLabels: boolean;
	private _showGrid: boolean;

	private _simulationQuality: SimulationQuality;

	private _heightReference: HeightReference;

	private _height: number;
	private _validHeight: boolean;

	constructor() {
		this._showAxes = true;
		this._showAxesLabels = true;
		this._showGrid = false;
		this._simulationQuality = SimulationQuality.VeryHigh;
		this._heightReference = HeightReference.BodyBase;
		this._height = 0;
		this._validHeight = true;
	}

	public get showAxes() { return this._showAxes; }
	public get showAxesLabels() { return this._showAxesLabels; }
	public get showGrid() { return this._showGrid; }
	public get simulationQuality() { return this._simulationQuality; }
	public get heightReference() { return this._heightReference; }
	public get height() { return this._height; }

	//Gets the settings set by the user in the sidebar.
	static getFromPage(previousSettings: ProjectileThrowSettings): ProjectileThrowSettings {
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

		//Get the height and see if it's a valid integer
		let stringHeight = (document.getElementById("height-input") as HTMLInputElement).value;
		let numberHeight = Number(stringHeight);
		if (isNaN(numberHeight) || (!isNaN(numberHeight) && numberHeight < 0)) {
			settings._height = previousSettings._height;
			settings._validHeight = false;
		} else {
			settings._height = numberHeight;
			settings._validHeight = true;
		}

		return settings;
	}

	//Updates the simulation and the page (some choices may have to be disabled).
	updatePage(projectile: Body, axes: AxisSystem, stepper: TimeStepper): void {
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

		//If the height is valid, update the position of the body it not mid-simulation. Show a
		//warning if the height is invalid
		if (this._validHeight) {
			if ((stepper && !stepper.isRunning) || !stepper) {
				if (this._heightReference === HeightReference.BodyCM)
					projectile.r = new Vec2(0, this._height);
				else
					projectile.r = new Vec2(0, this._height + bodyApothem);
			}

			//Hide any invalid height warning
			document.getElementById("invalid-height").style.removeProperty("display");
		} else {
			document.getElementById("invalid-height").style.display = "flex";
		}
	}
}