enum HeightReference {
	BodyBase, BodyCM
}

class ProjectileThrowSettings {
	private _showAxes: boolean;
	private _showAxesLabels: boolean;
	private _showGrid: boolean;
	private _showTrajectory: boolean;
	private _showSimulationResults: boolean;

	private _simulationQuality: SimulationQuality;

	private _heightReference: HeightReference;

	private _height: number;
	private _validHeight: boolean;

	private _launchVelocity: Vec2;
	private _validVelocity: boolean;

	constructor() {
		this._showAxes = true;
		this._showAxesLabels = true;
		this._showGrid = false;
		this._showTrajectory = true;
		this._simulationQuality = SimulationQuality.VeryHigh;
		this._heightReference = HeightReference.BodyBase;
		this._height = 0;
		this._validHeight = true;
		this._launchVelocity = new Vec2(0, 0);
		this._validVelocity = true;
	}

	public get showAxes() { return this._showAxes; }
	public get showAxesLabels() { return this._showAxesLabels; }
	public get showGrid() { return this._showGrid; }
	public get showTrajectory() { return this._showTrajectory; }
	public get showSimulationResults() { return this._showSimulationResults; }
	public get simulationQuality() { return this._simulationQuality; }
	public get heightReference() { return this._heightReference; }
	public get height() { return this._height; }
	public get launchVelocity() { return this._launchVelocity; }
	public get validVelocity() { return this._validVelocity; }

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
		settings._showTrajectory =
			(document.getElementById("trajectory") as HTMLInputElement).checked;
		settings._showSimulationResults =
			(document.getElementById("simulation-results-checkbox") as HTMLInputElement).checked;

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

		//Get the height and see if it's a valid number
		let stringHeight = (document.getElementById("height-input") as HTMLInputElement).value;
		let numberHeight = Number(stringHeight);
		if (isNaN(numberHeight) || (!isNaN(numberHeight) && numberHeight < 0)) {
			settings._height = previousSettings._height;
			settings._validHeight = false;
		} else {
			settings._height = numberHeight;
			settings._validHeight = true;
		}

		//Get the x and y velocities and check if they're valid numbers
		let stringVx = (document.getElementById("vx-input") as HTMLInputElement).value;
		let stringVy = (document.getElementById("vy-input") as HTMLInputElement).value;
		let numberVx = Number(stringVx);
		let numberVy = Number(stringVy);
		if (isNaN(numberVx) || isNaN(numberVy)) {
			settings._launchVelocity = previousSettings._launchVelocity;
			settings._validVelocity = false;
		} else {
			settings._launchVelocity = new Vec2(numberVx, numberVy);
			settings._validVelocity = true;
		}

		return settings;
	}

	//Updates the simulation and the page (some choices may have to be disabled)
	updatePage(projectile: Body, axes: AxisSystem, stepper: TimeStepper,
		trajectory: ProjectileTrajectory): void {

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

		//Update the position of the body it not mid-simulation. If the height is invalid, show a
		//warning.
		if ((stepper && !stepper.isRunning) || !stepper) {
			if (this._heightReference === HeightReference.BodyCM)
				projectile.r = new Vec2(0, this._height);
			else
				projectile.r = new Vec2(0, this._height + bodyApothem);
		}
		if (this._validHeight) {
			//Hide any invalid height warning
			document.getElementById("invalid-height").style.removeProperty("display");
		} else {
			document.getElementById("invalid-height").style.display = "flex";
		}

		//Update the velocity of the body it not mid-simulation. If it is invalid, show a warning.
		if ((stepper && !stepper.isRunning) || !stepper) {
			projectile.v = this._launchVelocity;
		}
		if (this._validVelocity) {
			//Hide any invalid velocity warning
			document.getElementById("invalid-velocity").style.removeProperty("display");
		} else {
			document.getElementById("invalid-velocity").style.display = "flex";
		}

		//If the change was applied to a non-moving body, recalculate the trajectory
		if ((stepper && !stepper.isRunning) || !stepper) {
			//Copy the body first
			let bodyCopy = new Body(projectile.mass, projectile.geometry, projectile.r);
			bodyCopy.v = projectile.v;
			bodyCopy.forces = projectile.forces;

			trajectory.points = new ProjectileTrajectory(bodyCopy, this).points;
		}
	}

	//Adds events to the UI elements in the page. So, when something is inputted, the page is
	//updated. setSettings is a function that when called, sets settings to the provided value. The
	//returned functions must be called whenever the stepper or settings are changed (new objects). 
	static addEvents(projectile: Body, axes: AxisSystem, stepper: TimeStepper,
		trajectory: ProjectileTrajectory, settings: ProjectileThrowSettings,
		setSettings: (s: ProjectileThrowSettings) => any):

		{updateStepper: (s: TimeStepper) => any,
		updateSettings: (s: ProjectileThrowSettings) => any} {

		//The list of elements that, when changed, require the simulation to be updated.
		let settingsElements: string[] = [
			"axes", "axes-labels", "grid", "trajectory", "simulation-results-checkbox",
			"simulation-quality", "body-base", "body-cm"
		];
		//When an element is changed, call settingsUpdateCallback
		for (let i: number = 0; i < settingsElements.length; ++i) {
			document.getElementById(settingsElements[i]).addEventListener("change", () => {
				settings = ProjectileThrowSettings.getFromPage(settings);
				setSettings(settings);
				settings.updatePage(projectile, axes, stepper, trajectory);
			});
		}

		//The same as before but with the oninput event, so that the user doesn't need to unfocus a
		//text input for the value to update
		settingsElements = [
			"height-input", "vx-input", "vy-input"
		];
		for (let i: number = 0; i < settingsElements.length; ++i) {
			document.getElementById(settingsElements[i]).addEventListener("input", () => {
				settings = ProjectileThrowSettings.getFromPage(settings);
				setSettings(settings);
				settings.updatePage(projectile, axes, stepper, trajectory);
			});
		}

		return {
			updateStepper: (s: TimeStepper) => {
				stepper = s;
			},

			updateSettings: (s: ProjectileThrowSettings) => {
				settings = s;
			}
		}
	}
}