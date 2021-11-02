const bodyApothem = 0.5;
const bodyGeometry = [
	new Vec2(-bodyApothem, -bodyApothem), new Vec2(bodyApothem, -bodyApothem),
	new Vec2(bodyApothem, bodyApothem), new Vec2(-bodyApothem, bodyApothem)
];

//Get the size of the area on the screen that can be rendered on (canvas minus sidebar);
let sidebar: HTMLElement = document.getElementById("simulation-interaction-div");
function getRenderingSurfaceSize(): Vec2 {
	return new Vec2(
		(window.innerWidth - sidebar.clientWidth) * window.devicePixelRatio,
		window.innerHeight * window.devicePixelRatio
	);
}

let lastRenderingSurfaceSize: Vec2 = new Vec2();
//Check if the size of drawing surface (size of the canvas minus the size of the sidebar) has
//changed and update it if needed. Don't use window.onresize, since that doesn't account for the
//change in size of the sidebar (window.onresize doesn't wait for the elements' size to be
//calculated).
function updateRenderingSurfaceSize(camera: Camera, axes: AxisSystem) {
	let renderingSurfaceSize = getRenderingSurfaceSize();
	if (renderingSurfaceSize !== lastRenderingSurfaceSize) {
		camera.canvasSize = renderingSurfaceSize;
		axes.updateCaches();
	}
	lastRenderingSurfaceSize = renderingSurfaceSize;
}

window.addEventListener("load", () => {
	//State (choosing velocity or not choosing)
	let choosingVelocity: boolean = false;
	//Keep track of the velocity before the user starting choosing another velocity in case they
	//want to cancel their action.
	let velocityBeforeChoosing: Vec2 = new Vec2();
	//State (background blurred when showing)
	let showingSimulationResults: boolean = false;

	function enterChoosingVelocityMode() {
		//Make sure the body the body is in its start position
		settings.updatePage(projectile, axes, stepper, trajectory);
		//Store the previous velocity in case the user cancels the action 
		velocityBeforeChoosing = settings.launchVelocity;
		//Enter mode
		choosingVelocity = true;
		//Show instructions
		document.getElementById("choose-velocity-instructions").style.display = "block";
	}
	
	function exitChoosingVelocityMode() {
		choosingVelocity = false; //Exit mode
		//Hide the velocity choosing instructions
		document.getElementById("choose-velocity-instructions").style.removeProperty("display");
		//Update page settings
		settings = ProjectileThrowSettings.getFromPage(settings);
		settings.updatePage(projectile, axes, stepper, trajectory);
	}

	function showSimulationResults() {
		renderer.canvas.style.filter = "blur(5px)";
		document.getElementById("simulation-interaction-div").style.filter = "blur(5px)";
		document.getElementById("simulation-results").style.display = "flex";
		document.body.style.pointerEvents = "none";
		showingSimulationResults = true;
	}

	function hideSimulationResults() {
		document.getElementById("simulation-results").style.removeProperty("display");
		renderer.canvas.style.removeProperty("filter");
		document.getElementById("simulation-interaction-div").style.removeProperty("filter");
		document.body.style.removeProperty("pointer-events");
		showingSimulationResults = false;
	}

	//Camera and display
	let camera: Camera = new Camera(new Vec2(-1.5, -1.5), 32);
	let axes: AxisSystem = new AxisSystem(camera,
		true, true, "white",  2,
		true, "#dddddd", 1, true, true, "16px sans-serif",
		"black",
		false
	);

	//Physics
	let stepper: TimeStepper; //Simulation time control
	let trajectory: ProjectileTrajectory = new ProjectileTrajectory();

	const BODY_MASS = 1;
	let projectile: Body = new Body(BODY_MASS, bodyGeometry, new Vec2(0, 0));
	projectile.forces = [ new Vec2(0, -9.8 * BODY_MASS) ] //Gravity

	//Simulation settings
	let settings = new ProjectileThrowSettings();

	let updateFunctions = ProjectileThrowSettings.addEvents(
		projectile, axes, stepper, trajectory, settings, (s) => {
			settings = s;
	});

	//Keep track of the mouse position for the program to be able to know what velocity the user is
	//choosing
	let mousePosition: Vec2 = new Vec2(0, 0);
	window.addEventListener("mousemove", (e: MouseEvent) => {
		mousePosition = new Vec2(e.clientX, e.clientY);

		//If the user is choosing the velocity, update the velocity inputs
		if (choosingVelocity) {
			let v: Vec2 =
				camera.pointToWorldPosition(mousePosition)
				.subtract(projectile.transformVertex(new Vec2(0, 0)))
				.scale(3);
			//Max of 2 decimal places in the velocity inputs
			v = new Vec2(ExtraMath.round(v.x, 2),　ExtraMath.round(v.y, 2));
			
			(document.getElementById("vx-input") as HTMLInputElement).value = v.x.toString();
			(document.getElementById("vy-input") as HTMLInputElement).value = v.y.toString();

			//Calculate the trajectory. Copy the body first.
			let bodyCopy = new Body(projectile.mass, projectile.geometry, projectile.r);
			bodyCopy.v = v;
			bodyCopy.forces = projectile.forces;

			//Don't use trajectory = new ProjectileTrajectory() so that the trajectory stored in
			//ProjectileThrowSettings.addEvents() doesn't get out of date.
			trajectory.points = new ProjectileTrajectory(bodyCopy, settings).points;
		}
	});

	//Set the surface size and use the correct settings when the simulation starts.
	updateRenderingSurfaceSize(camera, axes);
	settings = ProjectileThrowSettings.getFromPage(settings);
	settings.updatePage(projectile, axes, stepper, trajectory);

	//Start rendering
	let renderer: Renderer = new Renderer(window,
		document.getElementById("canvas") as HTMLCanvasElement, (renderer) => {

		updateRenderingSurfaceSize(camera, axes);
		axes.drawAxes(renderer);
		renderer.renderPolygon(
			camera.polygonToScreenPosition(projectile.transformGeometry()), "red");

		//Draw the velocity vector if the user is choosing it interactively
		if (choosingVelocity) {
			renderer.renderLines([
				camera.pointToScreenPosition(projectile.transformVertex(new Vec2())),
				mousePosition
			], "#00ff00", 2);
		}

		//Draw the trajectory if turned on
		if (settings.showTrajectory && trajectory) {
			renderer.renderLines(camera.polygonToScreenPosition(trajectory.points), "white", 2);
		}
	});
	renderer.renderLoop();

	//When ESC is pressed, exit velocity selection mode
	window.addEventListener("keydown", (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			if (choosingVelocity) {
				//Update the velocity input boxes to have the values before the action was cancelled
				(document.getElementById("vx-input") as HTMLInputElement).value =
					velocityBeforeChoosing.x.toString();
				(document.getElementById("vy-input") as HTMLInputElement).value =
					velocityBeforeChoosing.y.toString();

				exitChoosingVelocityMode();
			}

			if (showingSimulationResults) {
				hideSimulationResults();
			}
		}
	});

	//Enter velocity choosing mode when the user clicks on the button
	document.getElementById("choose-screen-velocity").addEventListener("click", () => {
		//Only select a velocity if the body isn't moving
		if ((stepper && !stepper.isRunning) || !stepper) {
			enterChoosingVelocityMode();
		}
	});

	//If the user clicks on top of the canvas while choosing the body's velocity, stop choosing the
	//velocity
	document.getElementById("no-script-div").addEventListener("click", () => {
		exitChoosingVelocityMode();
	});

	//Reset the position and velocity of the body when asked to
	document.getElementById("reset-button").addEventListener("click", () => {
		if (stepper)
			stepper.stopPause();

		//Update the settings on the page
		settings.updatePage(projectile, axes, stepper, trajectory);
	});

	//When the user clicks the ok button on the simulation results, hide that menu.
	document.getElementById("simulation-results-ok").addEventListener("click", () => {
		hideSimulationResults();
	});

	//Start the physics simulation when the launch button is pressed
	document.getElementById("launch-button").addEventListener("click", () => {
		//Reset the body's position and velocity
		if (stepper)
			stepper.stopPause();

		//Make sure the body is launched from the right position with the right velocity
		settings = ProjectileThrowSettings.getFromPage(settings);
		settings.updatePage(projectile, axes, stepper, trajectory);
		updateFunctions.updateSettings(settings);

		//Calculate the theoretical outcome
		let theoretical: ProjectileTheoreticalOutcome =
			new ProjectileTheoreticalOutcome(projectile, bodyApothem, settings);

		//Count the time between the start and the end of the simulation.
		let beginningTime = Date.now();
		//Keep track of the maximum height reached
		let maxHeight = projectile.r.y;

		stepper = new TimeStepper((dt: number) => {
			projectile.step(dt);

			if (projectile.r.y > maxHeight) {
				maxHeight = projectile.r.y;
			}

			if (ProjectileTrajectory.bodyReachedGround(projectile, settings)) {
				stepper.stopPause();

				let elapsedTime = Date.now() - beginningTime;
				theoretical.applyToPage(elapsedTime, projectile.r.x, maxHeight);

				//Show the menu, blur the background and stop the user from clicking on places
				showSimulationResults();
			}
		}, settings.simulationQuality);
		updateFunctions.updateStepper(stepper);
	});
});