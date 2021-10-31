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
	let settingsElements: HTMLElement[] = [
		document.getElementById("axes"),
		document.getElementById("axes-labels"),
		document.getElementById("grid"),
		document.getElementById("simulation-quality"),
		document.getElementById("body-base"),
		document.getElementById("body-cm"),
	];
	//When an element is changed, call settingsUpdateCallback
	for (let i: number = 0; i < settingsElements.length; ++i) {
		settingsElements[i].addEventListener("change", () => {
			settings = ProjectileThrowSettings.getFromPage(settings);
			settings.updatePage(projectile, axes, stepper);
		});
	}

	//The same as before but with the oninput event, so that the user doesn't need to unfocus a text
	//input for the value to update
	settingsElements = [
		document.getElementById("height-input")
	];
	for (let i: number = 0; i < settingsElements.length; ++i) {
		settingsElements[i].addEventListener("input", () => {
			settings = ProjectileThrowSettings.getFromPage(settings);
			settings.updatePage(projectile, axes, stepper);
		});
	}

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
	});
	renderer.renderLoop();

	//Start the physics simulation when the launch button is pressed
	document.getElementById("launch-button").addEventListener("click", () => {
		//Reset the body's position and velocity, hardcoded as of now
		if (stepper)
			stepper.stopPause();

		if (settings.heightReference === HeightReference.BodyCM)
			projectile.r = new Vec2(0, settings.height);
		else
			projectile.r = new Vec2(0, settings.height + bodyApothem);
		projectile.v = new Vec2(10, 10);

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