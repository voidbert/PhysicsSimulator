const bodyGeometry = [
	new Vec2(-0.5, -0.5), new Vec2(0.5, -0.5), new Vec2(0.5, 0.5), new Vec2(-0.5, 0.5)
];

window.addEventListener("load", () => {
	
	//Camera and display
	let camera: Camera = new Camera(new Vec2(-1.5, -1.5), 32);
	let axes: AxisSystem = new AxisSystem(camera,
		true, "white",  2,
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

	//When the window is loaded of resized, readjust the size of the camera.
	let resizeCallback = function() {
		camera.canvasSize = new Vec2(
			window.innerWidth * window.devicePixelRatio,
			window.innerHeight * window.devicePixelRatio
		);
		axes.updateCaches();
	}
	window.addEventListener("resize", resizeCallback);
	resizeCallback();

	//Start rendering
	let renderer: Renderer = new Renderer(window,
		document.getElementById("canvas") as HTMLCanvasElement, (renderer) => {

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