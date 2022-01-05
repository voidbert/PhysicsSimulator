class ParachuteGraph {
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
		"t", "y", //Axes' names
		"black", 2, "1rem sans-serif", //Axes' properties
		"#555555", 1, //Grid properties
		"white" //Page background color
	);

	public maxY: number;

	constructor() {
		let elapsedSimulationTime: number = 0;
		let lastRendererTick: number = Date.now();

		this.renderer = new Renderer(window, document.getElementById("graph") as HTMLCanvasElement,
			() => {

			ParachuteSettings.adjustUI();	

			//Don't draw the graph unless the sky diver has been released
			if (ParachuteSimulation.state === ParachuteState.BeforeRelease) {
				elapsedSimulationTime = 0;
				lastRendererTick = Date.now();
				this.maxY = 0;

				//Reset the camera scale
				this.camera.scale = new Vec2(32, 32);
				this.camera.forcePosition(new Vec2(0, 0),
					new Vec2(64, this.renderer.canvas.height - 32));

				this.axes.drawAxes(this.renderer);
				return;
			}

			this.scaleCamera(elapsedSimulationTime * 0.001, this.maxY + 1);
			this.axes.drawAxes(this.renderer);

			let lackOfData: boolean = false; //To know if simulation time should be counted or not

			//Get the first point to draw on the graph (screen coordinates) 
			let frame = ParachuteSimulation.parallelWorker.getFrame(0);
			if (frame === null) {
				lackOfData = true; //Data not ready yet
			}

			if (!lackOfData) {
				let lastPoint =
					this.camera.pointToScreenPosition(new Vec2(0, new Float64Array(frame)[0]));

				//Draw all points until the current simulation time
				let maxi = elapsedSimulationTime / ParachuteSimulation.settings.simulationQuality;
				for (let i: number = 1; i < maxi; i++) {

					frame = ParachuteSimulation.parallelWorker.getFrame(i);
					if (frame === null) {
						lackOfData = true; //Data not ready yet
						break; 
					}

					let y = new Float64Array(frame)[0];
					let point = this.camera.pointToScreenPosition(
						new Vec2(i * ParachuteSimulation.settings.simulationQuality * 0.001, y));

					if (y > this.maxY) {
						this.maxY = y;
					}

					this.renderer.renderLines([lastPoint, point], "#00ff00", 2);

					lastPoint = point;
				}
			}

			if (lackOfData) {
				//The simulation can be finished or the worker hasn't reached this point

				if (ParachuteSimulation.workerStopped &&
					ParachuteSimulation.state === ParachuteState.Released) {

					//Simulation done
					ParachuteSimulation.state = ParachuteState.ReachedGround;
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

			if (ParachuteSimulation.state === ParachuteState.BeforeRelease) {
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
		this.camera.forcePosition(new Vec2(0, 0), new Vec2(64, this.renderer.canvas.height - 32));
	}
}