const RESTITUTION_SIMULATION_SKIPPED_FACTOR = 1; //TODO - adjust

class RestitutionGraph {
	public renderer: Renderer;
	public camera: Camera = new Camera(new Vec2(-2, -1), new Vec2(32, 32));
	public axes: AxisSystem = new AxisSystem(
		this.camera,
		true, true, true, //Show axes, show arrows, only show positive axes
		true, true, //Show separation units (X and Y)
		true, true, //Show unit labels (X and Y)
		false, false, false, //Show grid (X and Y), only show positive grid areas
		true, true, //Auto scale (X and Y)
		64, 64, //Max grid size (X and Y)
		new Vec2(), //Non-auto scale
		"t", "y (m)", //Axes' names
		"black", 2, "0.9rem sans-serif", //Axes' properties
		"#555555", 1, //Grid properties
		"white" //Page background color
	);

	public maxY: number;

	constructor() {
		let elapsedSimulationTime: number = 0; //in milliseconds
		let lastRendererTick: number = Date.now();

		this.renderer = new Renderer(window, document.getElementById("graph") as HTMLCanvasElement,
			() => {
			//Don't draw the graph unless the body has been released
			if (RestitutionSimulation.state === RestitutionState.BeforeStart) {
				elapsedSimulationTime = 0;
				lastRendererTick = Date.now();
				this.maxY = 0;

				//Reset the camera scale
				this.camera.scale = new Vec2(32, 32);
				this.camera.forcePosition(new Vec2(0, 0),
					new Vec2(96, this.renderer.canvas.height - 32));

				this.axes.drawAxes(this.renderer);
				return;
			}

			this.scaleCamera(elapsedSimulationTime * 0.001, this.maxY + 1);
			this.axes.drawAxes(this.renderer);

			let lackOfData: boolean = false; //To know if simulation time should be counted or not

			//Get the first point to draw on the graph (screen coordinates) 
			let frame = RestitutionSimulation.parallelWorker.getFrame(0);
			if (frame === null) {
				lackOfData = true; //Data not ready yet
			}

			if (!lackOfData) {
				let lastPoint =
					this.camera.pointToScreenPosition(new Vec2(0, new Float64Array(frame)[0]));

				this.renderer.ctx.strokeStyle = "#00ff00";
				this.renderer.ctx.lineWidth = 2;
				this.renderer.ctx.beginPath();
				this.renderer.ctx.moveTo(lastPoint.x, lastPoint.y);

				//Draw all points until the current simulation time
				let maxi = elapsedSimulationTime / (SIMULATION_QUALITY *
					RESTITUTION_SIMULATION_SKIPPED_FACTOR);
				for (let i: number = 1; i < maxi; i++) {
					frame = RestitutionSimulation.parallelWorker.getFrame(i);
					if (frame === null) {
						lackOfData = true; //Data not ready yet
						break; 
					}

					let y = new Float64Array(frame)[0];
					let point = this.camera.pointToScreenPosition(
						new Vec2(i * SIMULATION_QUALITY *
						RESTITUTION_SIMULATION_SKIPPED_FACTOR * 0.001, y));

					if (y > this.maxY) {
						this.maxY = y;
					}

					this.renderer.ctx.lineTo(point.x, point.y);
					lastPoint = point;
				}
				this.renderer.ctx.stroke();
			}

			if (lackOfData) {
				//The simulation can be finished or the worker hasn't reached this point

				if (RestitutionSimulation.workerStopped &&
					RestitutionSimulation.state === RestitutionState.OnAir) {

					//TODO
					//RestitutionSettings.enableSettingsElements();
				}

				//Worker doesn't have the data yet. Reset the clock.
				lastRendererTick = Date.now();
			} else {
				//Simulation time has passed
				elapsedSimulationTime += Date.now() - lastRendererTick;
				lastRendererTick = Date.now();
			}
		}, () => {
			//On resize / zoom, set the size of the
			let rect = this.renderer.canvas.getBoundingClientRect();
			this.renderer.canvas.width = rect.width * window.devicePixelRatio;
			this.renderer.canvas.height = rect.height * window.devicePixelRatio;

			this.camera.canvasSize = new Vec2(
				this.renderer.canvas.width, this.renderer.canvas.height);

			if (RestitutionSimulation.state === RestitutionState.BeforeStart) {
				this.maxY = this.camera.pointToWorldPosition(new Vec2(0, 0)).y;
			}
		});
		this.renderer.renderLoop();
	}

	//Scales the camera to fit graphic data.
	private scaleCamera(maxX: number, maxY: number) {
		this.camera.fitMaxX(maxX);
		this.camera.scale.x = Math.min(this.camera.scale.x, 32);

		this.camera.fitMaxY(maxY);
		this.camera.scale.y = Math.min(this.camera.scale.y, 32);

		//Make sure the numbers in the axes' labels are visible
		this.camera.forcePosition(new Vec2(0, 0), new Vec2(96, this.renderer.canvas.height - 32));
	}
}