class ParachuteSimulation {
	static body = new Body(80, [], new Vec2(0, 2000)); //TODO - remove hardcoded value 

	static parallelWorker: WorkerWrapper;
	static workerStopped: boolean = false;
	static bufferCount: number = 0;

	static graph: ParachuteGraph;

	static settings: ParachuteSettings = new ParachuteSettings();
	static state: ParachuteState = ParachuteState.BeforeRelease;

	static startSimulation() {
		this.graph = new ParachuteGraph();

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
					1024, 100000 //Very high buffer limit to allow CSV exportation
				);
			}
		}
		newWorker();

		document.getElementById("reset-button").addEventListener("click", () => {
			if (this.state === ParachuteState.Released) {
				newWorker();
			}

			this.state = ParachuteState.BeforeRelease;
			ParachuteSettings.enableSettingsElements();
		});

		//Start the simulation when the user clicks the button
		document.getElementById("start-button").addEventListener("click", () => {
			//Scroll to the canvas
			let y = this.graph.renderer.canvas.getBoundingClientRect().top + window.scrollY;
			smoothScroll(0, y, () => {
				this.parallelWorker.start(
					{body: this.body, settings: this.settings},
					this.settings.simulationQuality);
				this.bufferCount = 0;
				this.state = ParachuteState.Released;
			});

			ParachuteSettings.disableSettingsElements();
		});
	}
}

window.addEventListener("load", () => {
	ParachuteSimulation.startSimulation();
});