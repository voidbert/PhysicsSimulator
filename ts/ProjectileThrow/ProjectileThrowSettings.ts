//Whether the projectile's height to ground is measured from its base or from its center of mass
enum HeightReference {
	BodyBase, BodyCM
}

//Responsible for interacting with page UI to set the simulation settings.
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

	//Gets the settings set by the user in the sidebar. Any unknown setting assumes the value of the
	//last used setting (this). Not a static function for this reason
	getFromPage(): ProjectileThrowSettings {
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
			settings._height = this._height;
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
			settings._launchVelocity = this._launchVelocity;
			settings._validVelocity = false;
		} else {
			settings._launchVelocity = new Vec2(numberVx, numberVy);
			settings._validVelocity = true;
		}

		return settings;
	}

	//Updates the simulation and the page to match the settings (enables / disables some settings
	//checkboxes, updates the time between simulation steps, shows / hides axis labels, etc.)
	updatePage(): void {
		ProjectileThrowSimulation.axes.showAxes = this._showAxes;
		ProjectileThrowSimulation.axes.showAxisLabels = this._showAxesLabels;
		ProjectileThrowSimulation.axes.showUnitLabels = this._showAxesLabels;
		ProjectileThrowSimulation.axes.showArrows = this._showAxes;
		ProjectileThrowSimulation.axes.showGrid = this._showGrid;

		//Make the "show arrows" checkbox enabled or disabled depending on the state of showAxes
		let showArrowsCheckbox = (document.getElementById("axes-labels") as HTMLInputElement);
		if (this._showAxes) {
			showArrowsCheckbox.disabled = false;
		} else {
			showArrowsCheckbox.disabled = true;
		}

		ProjectileThrowSimulation.axes.updateCaches();

		//Update the position of the body it not mid-simulation. If the height is invalid, show a
		//warning.
		if (ProjectileThrowSimulation.state === ApplicationState.projectileInLaunchPosition || 
			ProjectileThrowSimulation.state === ApplicationState.projectileStopped) {

			if (this._heightReference === HeightReference.BodyCM)
				ProjectileThrowSimulation.projectile.r = new Vec2(0, this._height);
			else
				ProjectileThrowSimulation.projectile.r = new Vec2(0, this._height + BODY_APOTHEM);
		}
		if (this._validHeight) {
			//Hide any invalid height warning
			document.getElementById("invalid-height").classList.add("hidden");
		} else {
			document.getElementById("invalid-height").classList.remove("hidden");
		}

		//Update the velocity of the body it not mid-simulation. If it is invalid, show a warning.
		if (ProjectileThrowSimulation.state === ApplicationState.projectileInLaunchPosition || 
			ProjectileThrowSimulation.state === ApplicationState.projectileStopped) {

			ProjectileThrowSimulation.projectile.v = this._launchVelocity;
		}
		if (this._validVelocity) {
			//Hide any invalid velocity warning
			document.getElementById("invalid-velocity").classList.add("hidden");
		} else {
			document.getElementById("invalid-velocity").classList.remove("hidden");
		}

		//If the change was applied to a non-moving body, recalculate the trajectory
		if (ProjectileThrowSimulation.state === ApplicationState.projectileInLaunchPosition || 
			ProjectileThrowSimulation.state === ApplicationState.projectileStopped) {

			ProjectileThrowSimulation.trajectory = ProjectileThrowTrajectory
				.generateLimitedTrajectory(ProjectileThrowSimulation.projectile, this);
		}
	}

	//Updates the text on the velocity input boxes with a new value. Useful, for example, for
	//updating while in interactive velocity choosing mode.
	static updatePageVelocity(velocity: Vec2): void {
		(document.getElementById("vx-input") as HTMLInputElement).value = velocity.x.toString();
		(document.getElementById("vy-input") as HTMLInputElement).value = velocity.y.toString();
	}

	//Adds events to the UI elements in the page. So, when something is inputted, the page and the
	//settings are updated. 
	static addEvents(): void {
		//The list of DOM elements that, when changed, require the simulation to be updated.
		let settingsElements: string[] = [
			"axes", "axes-labels", "grid", "trajectory", "simulation-results-checkbox",
			"simulation-quality", "body-base", "body-cm"
		];

		//Gets called when a page element is changed
		function onUpdate() {
			ProjectileThrowSimulation.settings = ProjectileThrowSimulation.settings.getFromPage();
			ProjectileThrowSimulation.settings.updatePage();
		}

		//When an element is changed, call settingsUpdateCallback
		for (let i: number = 0; i < settingsElements.length; ++i) {
			document.getElementById(settingsElements[i]).addEventListener("change", onUpdate);
		}

		//The same as before but with the oninput event, so that the user doesn't need to unfocus a
		//text input for the value to update
		settingsElements = [
			"height-input", "vx-input", "vy-input"
		];
		for (let i: number = 0; i < settingsElements.length; ++i) {
			document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
		}
	}

	static disableSettingsElements() {
		(document.getElementById("simulation-quality") as HTMLSelectElement).disabled = true;
		(document.getElementById("body-base") as HTMLInputElement).disabled = true;
		(document.getElementById("body-cm") as HTMLInputElement).disabled = true;
		(document.getElementById("height-input") as HTMLInputElement).disabled = true;
		(document.getElementById("vx-input") as HTMLInputElement).disabled = true;
		(document.getElementById("vy-input") as HTMLInputElement).disabled = true;
		(document.getElementById("choose-screen-velocity") as HTMLButtonElement).disabled = true;
	}
	
	static enableSettingsElements() {
		(document.getElementById("simulation-quality") as HTMLSelectElement).disabled = false;
		(document.getElementById("body-base") as HTMLInputElement).disabled = false;
		(document.getElementById("body-cm") as HTMLInputElement).disabled = false;
		(document.getElementById("height-input") as HTMLInputElement).disabled = false;
		(document.getElementById("vx-input") as HTMLInputElement).disabled = false;
		(document.getElementById("vy-input") as HTMLInputElement).disabled = false;
		(document.getElementById("choose-screen-velocity") as HTMLButtonElement).disabled = false;
	}
}