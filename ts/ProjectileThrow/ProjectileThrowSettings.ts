//Simulation quality - the number of milliseconds between calculating the positions of bodies (dt)
enum ProjectileThrowSimulationQuality {
	VeryLow = 50,
	Low = 30,
	Medium = 20,
	High = 10,
	VeryHigh = 5
}


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

	private _simulationQuality: ProjectileThrowSimulationQuality;

	private _heightReference: HeightReference;

	private _mass: number;
	private _validMass: boolean;

	private _radius: number;
	private _validRadius: boolean;

	private _height: number;
	private _validHeight: boolean;

	private _launchVelocity: Vec2;
	private _validVelocity: boolean;

	private _airResistance: boolean;

	constructor() {
		this._showAxes = true;
		this._showAxesLabels = true;
		this._showGrid = false;
		this._showTrajectory = true;
		this._simulationQuality = ProjectileThrowSimulationQuality.VeryHigh;
		this._heightReference = HeightReference.BodyBase;
		this._mass = 1;
		this._validMass = true;
		this._radius = 0.5;
		this._validRadius = true;
		this._height = 0;
		this._validHeight = true;
		this._launchVelocity = new Vec2(0, 0);
		this._validVelocity = true;
		this._airResistance = false;
	}

	public get showAxes() { return this._showAxes; }
	public get showAxesLabels() { return this._showAxesLabels; }
	public get showGrid() { return this._showGrid; }
	public get showTrajectory() { return this._showTrajectory; }
	public get showSimulationResults() { return this._showSimulationResults; }
	public get simulationQuality() { return this._simulationQuality; }
	public get heightReference() { return this._heightReference; }
	public get mass() { return this._mass; }
	public get radius() { return this._radius; }
	public get height() { return this._height; }
	public get launchVelocity() { return this._launchVelocity; }
	public get airResistance() { return this._airResistance; }

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
		settings._showSimulationResults =
			(document.getElementById("simulation-results-checkbox") as HTMLInputElement).checked;

		settings._simulationQuality = {
			"vl": ProjectileThrowSimulationQuality.VeryLow,
			"l": ProjectileThrowSimulationQuality.Low,
			"m": ProjectileThrowSimulationQuality.Medium,
			"h": ProjectileThrowSimulationQuality.High,
			"vh": ProjectileThrowSimulationQuality.VeryHigh
		}[(document.getElementById("simulation-quality") as HTMLSelectElement).value];

		if ((document.getElementById("body-base") as HTMLInputElement).checked) {
			settings._heightReference = HeightReference.BodyBase;
		} else {
			settings._heightReference = HeightReference.BodyCM;
		}

		//Parses a number from an input element (id) and sets a property in settings to the number
		//in that input. Whether the number is valid or not is a boolean that is assigned to
		//validProperty. A number out of the [min, max] range will be considered invalid.
		let parseWithSettingsUpdate = (id: string, property: string, validProperty: string,
			min: number = -Infinity, max: number = Infinity) => {

			settings[property] = parseInputNumber(id, min, max);
			if (isNaN(settings[property])) {
				settings[validProperty] = false;
				settings[property] = this[property]; //Use last valid value
			} else {
				settings[validProperty] = true;
			}
		}

		parseWithSettingsUpdate("mass-input",   "_mass",   "_validMass",   Number.MIN_VALUE);
		parseWithSettingsUpdate("radius-input", "_radius", "_validRadius", Number.MIN_VALUE);
		parseWithSettingsUpdate("height-input", "_height", "_validHeight", 0);

		//Get the x and y velocities and check if they're valid numbers. Don't use
		//parseWithSettingsUpdate, as it can't handle vectors.
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

		settings._airResistance = (document.getElementById("air-res") as HTMLInputElement).checked;

		settings._showTrajectory = !settings._airResistance &&
			(document.getElementById("trajectory") as HTMLInputElement).checked;

		return settings;
	}

	//Updates the simulation and the page to match the settings (enables / disables some settings
	//checkboxes, updates the time between simulation steps, shows / hides axis labels, etc.)
	updatePage(): void {
		ProjectileThrowSimulation.axes.showAxes = this._showAxes;
		ProjectileThrowSimulation.axes.showArrows = this._showAxes;

		ProjectileThrowSimulation.axes.showUnitLabelsX = this._showAxesLabels;
		ProjectileThrowSimulation.axes.showUnitLabelsY = this._showAxesLabels;
		if (this._showAxesLabels) {
			ProjectileThrowSimulation.axes.horizontalAxisName = "x";
			ProjectileThrowSimulation.axes.verticalAxisName   = "y";
		} else {
			ProjectileThrowSimulation.axes.horizontalAxisName = "";
			ProjectileThrowSimulation.axes.verticalAxisName   = "";
		}

		ProjectileThrowSimulation.axes.showHorizontalGrid = this._showGrid;
		ProjectileThrowSimulation.axes.showVerticalGrid   = this._showGrid;

		//Make the "show arrows" checkbox enabled or disabled depending on the state of showAxes
		let showArrowsCheckbox = (document.getElementById("axes-labels") as HTMLInputElement);
		if (this._showAxes) {
			showArrowsCheckbox.disabled = false;
		} else {
			showArrowsCheckbox.disabled = true;
		}

		//Update the position of the body it not mid-simulation. If the height is invalid, show a
		//warning.
		if (ProjectileThrowSimulation.state === ProjectileThrowState.projectileInLaunchPosition || 
			ProjectileThrowSimulation.state === ProjectileThrowState.projectileStopped) {

			if (this._heightReference === HeightReference.BodyCM)
				ProjectileThrowSimulation.projectile.r = new Vec2(0, this._height);
			else
				ProjectileThrowSimulation.projectile.r = new Vec2(0, this._height + this._radius);
		}

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

		adjustColor(this._validMass, "mass-input", 2);
		adjustColor(this._validRadius, "radius-input", 2);
		adjustColor(this._validHeight, "height-input", 2);
		adjustColor(this._validVelocity, "vx-input",   2);

		let trajectoryCheckbox = (document.getElementById("trajectory") as HTMLInputElement);
		trajectoryCheckbox.disabled = this._airResistance;

		//If not mid-simulation, update whats needed.
		if (ProjectileThrowSimulation.state === ProjectileThrowState.projectileInLaunchPosition ||
			ProjectileThrowSimulation.state === ProjectileThrowState.projectileStopped) {

			ProjectileThrowSimulation.projectile.v = this._launchVelocity;

			ProjectileThrowSimulation.projectile.mass = this._mass;
			ProjectileThrowSimulation.projectile.forces = [ new Vec2(0, -GRAVITY * this._mass) ];

			ProjectileThrowSimulation.projectile.geometry =
				ExtraMath.generatePolygon(20, this._radius);

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
			"simulation-quality", "body-base", "body-cm", "air-res"
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
			"mass-input", "radius-input", "height-input", "vx-input", "vy-input"
		];
		for (let i: number = 0; i < settingsElements.length; ++i) {
			document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
		}
	}

	static disableSettingsElements() {
		(document.getElementById("simulation-quality") as HTMLSelectElement).disabled = true;
		(document.getElementById("body-base") as HTMLInputElement).disabled = true;
		(document.getElementById("body-cm") as HTMLInputElement).disabled = true;
		(document.getElementById("mass-input") as HTMLInputElement).disabled = true;
		(document.getElementById("radius-input") as HTMLInputElement).disabled = true;
		(document.getElementById("height-input") as HTMLInputElement).disabled = true;
		(document.getElementById("vx-input") as HTMLInputElement).disabled = true;
		(document.getElementById("vy-input") as HTMLInputElement).disabled = true;
		(document.getElementById("choose-screen-velocity") as HTMLButtonElement).disabled = true;
		(document.getElementById("air-res") as HTMLButtonElement).disabled = true;
	}
	
	static enableSettingsElements() {
		(document.getElementById("simulation-quality") as HTMLSelectElement).disabled = false;
		(document.getElementById("body-base") as HTMLInputElement).disabled = false;
		(document.getElementById("body-cm") as HTMLInputElement).disabled = false;
		(document.getElementById("mass-input") as HTMLInputElement).disabled = false;
		(document.getElementById("radius-input") as HTMLInputElement).disabled = false;
		(document.getElementById("height-input") as HTMLInputElement).disabled = false;
		(document.getElementById("vx-input") as HTMLInputElement).disabled = false;
		(document.getElementById("vy-input") as HTMLInputElement).disabled = false;
		(document.getElementById("choose-screen-velocity") as HTMLButtonElement).disabled = false;
		(document.getElementById("air-res") as HTMLButtonElement).disabled = false;
	}
}