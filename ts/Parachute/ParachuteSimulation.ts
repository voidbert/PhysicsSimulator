class ParachuteSimulation {
	static body = new Body(80, [], new Vec2(0, 10)); //TODO - remove hardcoded value 

	static parallelWorker: WorkerWrapper;
	static workerStopped: boolean = false;
	static bufferCount: number = 0;

	static graph: ParachuteGraph = new ParachuteGraph();
	static renderer: Renderer;

	static settings: ParachuteSettings = new ParachuteSettings();
	static state: ParachuteState = ParachuteState.BeforeRelease;

	static startSimulation() {
		this.body.forces = [ new Vec2(0, -this.settings.mass * 9.8) ]; //TODO - remove

		//Creates a new worker. If the old one stopped, there's no need to recreate it. It can be
		//reused because it will no longer post messages about old simulations.
		let newWorker = () => {
			if (!this.workerStopped) {
				if (this.parallelWorker) {
					this.parallelWorker.terminate();
				}

				this.parallelWorker = new WorkerWrapper(
					"../../js/Parachute/ParachuteWorker.js",
					8, /*the number (float64) that will be shown on the graph*/
					this.settings.simulationQuality,
					(w: Worker, data: any) => {
						//Worker posted a message. Stop the worker if it is done.
						if (data === "DONE") {
							console.log(data);
							this.workerStopped = true;
						} else {
							this.parallelWorker.addBuffer(
								new NumberedBuffer(this.bufferCount, data.size, data.buf));
							this.bufferCount++;
						}
					},
					512, 16
				);
			}
		}
		newWorker();

		let elapsedSimulationTime: number = 0;
		let lastRendererTick: number = Date.now();

		this.renderer = new Renderer(window, document.getElementById("graph") as HTMLCanvasElement,
			() => {

			ParachuteSettings.adjustUI();

			//Get the data to be shown
			let bodyFrame: ArrayBuffer[] = [];
			if (this.state === ParachuteState.Released)
				bodyFrame = this.parallelWorker.getBoundaryBuffers(elapsedSimulationTime, true);

			if (bodyFrame.length === 0) {
				//The simulation can be done or the worker hasn't reached this point

				if (this.workerStopped && this.state === ParachuteState.Released) {
					//Simulation done
					this.state = ParachuteState.ReachedGround;
				}

				//Worker doesn't have the data yet. Reset the clock.
				lastRendererTick = Date.now();
			} else {
				//Simulation time has passed
				elapsedSimulationTime += Date.now() - lastRendererTick;
				lastRendererTick = Date.now();
			}

			this.graph.render(this.renderer, this.parallelWorker, this.settings.simulationQuality, elapsedSimulationTime);

		}, () => {
			let rect = this.renderer.canvas.getBoundingClientRect();
			this.renderer.canvas.width = rect.width * window.devicePixelRatio;
			this.renderer.canvas.height = rect.height * window.devicePixelRatio;

			this.graph.camera.canvasSize = new Vec2(
				this.renderer.canvas.width, this.renderer.canvas.height);
		});
		this.renderer.renderLoop();

		//Start the simulation when the user clicks the button
		document.getElementById("start-button").addEventListener("click", () => {
			//Scroll to the canvas
			let y = this.renderer.canvas.getBoundingClientRect().top;
			smoothScroll(0, y, () => {
				this.parallelWorker.start(
					{body: this.body, settings: this.settings},
					this.settings.simulationQuality);
				this.state = ParachuteState.Released;
			});
		});
	}
}

window.addEventListener("load", () => {
	ParachuteSimulation.startSimulation();
});