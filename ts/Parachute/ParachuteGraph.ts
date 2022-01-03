class ParachuteGraph {

	public camera: Camera = new Camera(new Vec2(-1, -1), 32);
	public axes: AxisSystem = new AxisSystem(
		this.camera,
		true, true, false, //Show axes, show arrows, only show positive axes
		true, true, //Show separation units (X and Y)
		true, true, //Show unit labels (X and Y)
		false, false, false, //Show grid (X and Y), only show positive grid areas
		true, true, //Auto scale (X and Y)
		64, 64, //Max grid size (X and Y)
		new Vec2(), //Non-auto scale
		"t", "y", //Axes' names
		"black", 2, "1rem sans-serif", //Axes' properties
		"#555555", 1, //Grid properties
		"white" //Page background color
	);

	constructor() {
		
	}

	render(renderer: Renderer, worker: WorkerWrapper, simulationQuality: number,
		elapsedSimulationTime: number) {

		this.axes.drawAxes(renderer);

		//Get the first point to draw on the graph (screen coordinates) 
		let lastPoint = this.camera.pointToScreenPosition(
			new Vec2(0, new Float64Array(worker.getFrame(0))[0]));

		//Draw all points until the current time
		let maxi = elapsedSimulationTime / simulationQuality;
		for (let i: number = 1; i < maxi; i++) {
			let point = this.camera.pointToScreenPosition(
				new Vec2(i * simulationQuality * 0.001, new Float64Array(worker.getFrame(i))[0]));

			renderer.renderLines([lastPoint, point], "#00ff00", 2);

			lastPoint = point;
		}
	}
}