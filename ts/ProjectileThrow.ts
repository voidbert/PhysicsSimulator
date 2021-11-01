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

	function enterChoosingVelocityMode() {
		//Make sure the body the body is in its start position
		settings.updatePage(projectile, axes, stepper);
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
		settings.updatePage(projectile, axes, stepper);
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

	//Simulation settings
	let settings = new ProjectileThrowSettings();

	const BODY_MASS = 1;
	let projectile: Body = new Body(BODY_MASS, bodyGeometry, new Vec2(0, 0));
	projectile.forces = [ new Vec2(0, -9.8 * BODY_MASS) ] //Gravity

	//When the user changes the settings, update the world.
	//The list of elements that, when changed, require the simulation to be updated.
	let settingsElements: string[] = [
		"axes", "axes-labels", "grid", "simulation-quality", "body-base", "body-cm"
	];
	//When an element is changed, call settingsUpdateCallback
	for (let i: number = 0; i < settingsElements.length; ++i) {
		document.getElementById(settingsElements[i]).addEventListener("change", () => {
			settings = ProjectileThrowSettings.getFromPage(settings);
			settings.updatePage(projectile, axes, stepper);
		});
	}

	//The same as before but with the oninput event, so that the user doesn't need to unfocus a text
	//input for the value to update
	settingsElements = [
		"height-input", "vx-input", "vy-input"
	];
	for (let i: number = 0; i < settingsElements.length; ++i) {
		document.getElementById(settingsElements[i]).addEventListener("input", () => {
			settings = ProjectileThrowSettings.getFromPage(settings);
			settings.updatePage(projectile, axes, stepper);
		});
	}

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
		
			(document.getElementById("vx-input") as HTMLInputElement).value = v.x.toString();
			(document.getElementById("vy-input") as HTMLInputElement).value = v.y.toString();
		}
	});

	//Set the surface size and use the correct settings when the simulation starts.
	updateRenderingSurfaceSize(camera, axes);
	settings = ProjectileThrowSettings.getFromPage(settings);
	settings.updatePage(projectile, axes, stepper);

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
	});
	renderer.renderLoop();

	//When ESC is pressed, exit velocity selection mode
	window.addEventListener("keydown", (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			//Update the velocity input boxes to have the values before the action was cancelled
			(document.getElementById("vx-input") as HTMLInputElement).value =
				velocityBeforeChoosing.x.toString();
			(document.getElementById("vy-input") as HTMLInputElement).value =
				velocityBeforeChoosing.y.toString();

			exitChoosingVelocityMode();
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

	//Start the physics simulation when the launch button is pressed
	document.getElementById("launch-button").addEventListener("click", () => {
		//Reset the body's position and velocity, hardcoded as of now
		if (stepper)
			stepper.stopPause();

		if (settings.heightReference === HeightReference.BodyCM)
			projectile.r = new Vec2(0, settings.height);
		else
			projectile.r = new Vec2(0, settings.height + bodyApothem);
		projectile.v = settings.launchVelocity;

		stepper = new TimeStepper((dt: number) => {
			projectile.step(dt);

			//Stop the body when it reaches the ground
			if (settings.heightReference === HeightReference.BodyCM) {
				//Stop the body when its center of mass reaches the ground
				if (projectile.r.y <= 0) {
					stepper.stopPause();
				}
			} else {
				//Stop the body when its base reaches the ground (center of mass reaches 1 body
				//apothem above 0)
				if (projectile.r.y <= bodyApothem) {
					stepper.stopPause();
				}
			}
		}, settings.simulationQuality);
	});
});