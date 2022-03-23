//The web worker only sends one tenth of the points processed to the window context.
const PARACHUTE_SIMULATION_SKIPPED_FACTOR = 10;
const FAST_FORWARD_FACTOR = 2;

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

			//Based on the current settings, returns the point to be displayed in the graph for
			//theoretical values (chooses between y(t), v(t), etc.).
			function getTheoreticalPoint(time: number): number {
				switch (ParachuteSimulation.settings.graphProperty) {
					case ParachuteGraphProperty.Y:
						return ParachuteSimulation.theoreticalResults.y(time);
					case ParachuteGraphProperty.R:
						return ParachuteSimulation.theoreticalResults.r(time);
					case ParachuteGraphProperty.Velocity:
						return ParachuteSimulation.theoreticalResults.v(time);
					case ParachuteGraphProperty.AirResistance:
						return ParachuteSimulation.theoreticalResults.Rair(time);
					case ParachuteGraphProperty.ResultantForce:
						return ParachuteSimulation.theoreticalResults.Fr(time);
					case ParachuteGraphProperty.Acceleration:
						return ParachuteSimulation.theoreticalResults.a(time);
				}
			}

			ParachuteSettings.adjustUI();	

			//Don't draw the graph unless the sky diver has been released
			if (ParachuteSimulation.state === ParachuteState.BeforeRelease) {
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
			let frame = ParachuteSimulation.parallelWorker.getFrame(0);
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
				let maxi = elapsedSimulationTime / (ParachuteSimulation.settings.simulationQuality *
					PARACHUTE_SIMULATION_SKIPPED_FACTOR);
				let reachedi = -1;
				for (let i: number = 1; i < maxi; i++) {
					frame = ParachuteSimulation.parallelWorker.getFrame(i);
					if (frame === null) {
						lackOfData = true; //Data not ready yet
						reachedi = i;
						break; 
					}

					let y = new Float64Array(frame)[0];
					let point = this.camera.pointToScreenPosition(
						new Vec2(i * ParachuteSimulation.settings.simulationQuality *
						PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001, y));

					if (y > this.maxY) {
						this.maxY = y;
					}

					this.renderer.ctx.lineTo(point.x, point.y);
					lastPoint = point;
				}
				this.renderer.ctx.stroke();

				if (reachedi === -1) {
					reachedi = maxi; //Drew all points possible
				}

				let lastTheoreticalPoint =
					this.camera.pointToScreenPosition(new Vec2(0, getTheoreticalPoint(0)));

				if (ParachuteSimulation.settings.seeTheoretical) {
					
					this.renderer.ctx.beginPath();
					this.renderer.ctx.strokeStyle = "#ff0000aa";
					this.renderer.ctx.lineWidth = 2;
					this.renderer.ctx.moveTo(lastTheoreticalPoint.x, lastTheoreticalPoint.y);

					maxi = Math.min(reachedi,
						ParachuteSimulation.theoreticalResults.timeParachuteOpens /
						(ParachuteSimulation.settings.simulationQuality * PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001));

					for (let i: number = 1; i < maxi; i++) {
						let time = i * ParachuteSimulation.settings.simulationQuality *
							PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001;
						let theoreticalPoint = this.camera.pointToScreenPosition(
							new Vec2(time, getTheoreticalPoint(time)));

						this.renderer.ctx.lineTo(theoreticalPoint.x, theoreticalPoint.y);
						lastTheoreticalPoint = theoreticalPoint;
					}
				}
				this.renderer.ctx.stroke();
			}

			if (lackOfData) {
				//The simulation can be finished or the worker hasn't reached this point

				if (ParachuteSimulation.workerStopped &&
					ParachuteSimulation.state === ParachuteState.Released) {

					//Simulation done
					if (ParachuteSimulation.settings.simulationResults) {
						ParachuteStateManager.showSimulationResults();
					} else {
						ParachuteSimulation.state = ParachuteState.ReachedGround;
					}
					
					ParachuteSettings.enableSettingsElements();
				}

				//Worker doesn't have the data yet. Reset the clock.
				lastRendererTick = Date.now();
			} else {
				//Simulation time has passed
				if (ParachuteSimulation.settings.fastForward) {
					elapsedSimulationTime += (Date.now() - lastRendererTick) * FAST_FORWARD_FACTOR;
				} else {
					elapsedSimulationTime += Date.now() - lastRendererTick;
				}

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

			ParachuteStateManager.scaleSimulationResults();
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