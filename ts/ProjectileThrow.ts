const bodyGeometry = [
	new Vec2(-0.5, -0.5), new Vec2(0.5, -0.5), new Vec2(0.5, 0.5), new Vec2(-0.5, 0.5)
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

function settingsUpdateCallback(axes: AxisSystem) {
	let showAxes = (document.getElementById("axes") as HTMLInputElement).checked;
		axes.showAxes = showAxes;
		axes.showArrows = showAxes; //Show both arrows and the axis or none at all

		if (showAxes) {
			//Allow the user to toggle the axes' labels if the axes are visible
			(document.getElementById("axes-labels") as HTMLInputElement).disabled = false;
		} else {
			//Don't allow the user to toggle the axes' labels if the axes aren't visible
			let axesLabels: HTMLInputElement =
				document.getElementById("axes-labels") as HTMLInputElement;

			axesLabels.checked = false;
			axesLabels.disabled = true;
		}
		
		let showLabels = (document.getElementById("axes-labels") as HTMLInputElement).checked;
		axes.showUnitLabels = showLabels;
		axes.showAxisLabels = showLabels;

		axes.showGrid = (document.getElementById("grid") as HTMLInputElement).checked;
		axes.updateCaches();
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

	const BODY_MASS = 1;
	let projectile: Body = new Body(BODY_MASS, bodyGeometry, new Vec2(0, 0));
	projectile.v = new Vec2(10, 10);
	projectile.forces = [ new Vec2(0, -9.8 * BODY_MASS) ] //Gravity

	//When the user changes the settings, update the world.
	//The list of elements that, when changed, require the simulation to be updated.
	let settingsElements: HTMLElement[] = [
		document.getElementById("axes"),
		document.getElementById("axes-labels"),
		document.getElementById("grid")
	];
	//When an element is changed, call settingsUpdateCallback
	for (let i: number = 0; i < settingsElements.length; ++i) {
		settingsElements[i].addEventListener("change", () => {
			settingsUpdateCallback(axes);
		});
	}

	//Set the surface size and use the correct settings when the simulation starts.
	updateRenderingSurfaceSize(camera, axes);
	settingsUpdateCallback(axes);

	//Start rendering
	let renderer: Renderer = new Renderer(window,
		document.getElementById("canvas") as HTMLCanvasElement, (renderer) => {

		updateRenderingSurfaceSize(camera, axes);
		axes.drawAxes(renderer);
		renderer.renderPolygon(
			camera.polygonToScreenPosition(projectile.transformGeometry()), "red");
	});
	renderer.renderLoop();

	//Start the physics simulation
	stepper = new TimeStepper((dt: number) => {
		projectile.step(dt);
	}, SimulationQuality.VeryHigh);

});