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

	public elapsedSimulationTime: number = 0; //in milliseconds

	constructor() {
		this.elapsedSimulationTime = 0;
		let lastRendererTick: number = Date.now();

		this.renderer = new Renderer(window, document.getElementById("graph") as HTMLCanvasElement,
			() => {
			//Don't draw the graph unless the body has been released
			if (RestitutionSimulation.state === RestitutionState.BeforeStart) {
				this.elapsedSimulationTime = 0;
				lastRendererTick = Date.now();
				this.maxY = 0;

				//Reset the camera scale
				this.camera.scale = new Vec2(32, 32);
				this.camera.forcePosition(new Vec2(0, 0),
					new Vec2(96, this.renderer.canvas.height - 32));

				this.axes.drawAxes(this.renderer);
				return;
			}

			this.scaleCamera(this.elapsedSimulationTime * 0.001, this.maxY + 1);
			this.axes.drawAxes(this.renderer);

			let lackOfData: boolean = false; //To know if simulation time should be counted or not

			//Get the first point to draw on the graph (screen coordinates) 
			let frame = RestitutionSimulation.parallelWorker.getFrame(0);
			if (frame === null) {
				lackOfData = true; //Data not ready yet
			}

			if (!lackOfData) {
				//Draw all points until the current simulation time (frame number maxi)
				let maxi = Math.floor(this.elapsedSimulationTime /
					RestitutionSimulation.settings.simulationQuality);

				//x is used for simulator values and y for theoretical ones
				let frames: Vec2[] = new Array<Vec2>(maxi);
				let array = new Float64Array(frame);
				frames[0] = new Vec2(array[0], array[1]);

				//Get all frames and store the data for rendering the graph lines
				for (let i: number = 1; i < maxi; ++i) {
					frame = RestitutionSimulation.parallelWorker.getFrame(i);
					if (frame === null) {
						lackOfData = true; //Data not ready yet
						maxi = i - 1;
						break; 
					}

					array = new Float64Array(frame);
					frames[i] = new Vec2(array[0], array[1]);

					let frameMaxY = Math.max(array[0], array[1]);
					if (frameMaxY > this.maxY) {
						this.maxY = frameMaxY;
					}				
				}

				if (!lackOfData || RestitutionSimulation.workerStopped) {
					let lastPoint =
					this.camera.pointToScreenPosition(new Vec2(0, frames[0].x));

					this.renderer.ctx.strokeStyle = "#00ff00";
					this.renderer.ctx.lineWidth = 2;
					this.renderer.ctx.beginPath();
					this.renderer.ctx.moveTo(lastPoint.x, lastPoint.y);

					for (let i = 1; i < maxi; ++i) {
						let point = this.camera.pointToScreenPosition(new Vec2(i * 
							RestitutionSimulation.settings.simulationQuality * 0.001, frames[i].x));

						this.renderer.ctx.lineTo(point.x, point.y);
					}
					this.renderer.ctx.stroke();

					lastPoint =
						this.camera.pointToScreenPosition(new Vec2(0, frames[0].y));

					this.renderer.ctx.strokeStyle = "#ff0000aa";
					this.renderer.ctx.beginPath();
					this.renderer.ctx.moveTo(lastPoint.x, lastPoint.y);

					for (let i = 1; i < maxi; ++i) {
						let point = this.camera.pointToScreenPosition(new Vec2(i *
							RestitutionSimulation.settings.simulationQuality * 0.001, frames[i].y));

						this.renderer.ctx.lineTo(point.x, point.y);
					}
					this.renderer.ctx.stroke();
				}
			}

			if (lackOfData) {
				//The simulation can be finished or the worker hasn't reached this point

				if (RestitutionSimulation.workerStopped &&
					RestitutionSimulation.state === RestitutionState.OnAir) {

					RestitutionSimulation.state = RestitutionState.Ended;
					RestitutionSettings.enableSettingsElements();
				}

				//Worker doesn't have the data yet. Reset the clock.
				lastRendererTick = Date.now();
			} else {
				//Simulation time has passed
				this.elapsedSimulationTime += Date.now() - lastRendererTick;
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