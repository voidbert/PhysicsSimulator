class ParachuteSimulation {
	static body = new Body(80, [], new Vec2()); 

	static parallelWorker: WorkerWrapper;
	static workerStopped: boolean = false;
	static bufferCount: number = 0;

	static graph: ParachuteGraph;
	static theoreticalResults: ParachuteResults;

	static settings: ParachuteSettings = new ParachuteSettings();
	static state: ParachuteState = ParachuteState.BeforeRelease;

	static startSimulation() {
		this.graph = new ParachuteGraph();

		ParachuteSettings.addEvents();
		this.settings = this.settings.getFromPage();
		this.settings.updatePage();

		//Creates a new worker. If the old one stopped, there's no need to recreate it. It can be
		//reused because it will no longer post messages about old simulations.
		let newWorker = () => {
			if (!this.workerStopped) {
				if (this.parallelWorker) {
					this.parallelWorker.terminate();
				}

				this.parallelWorker = new WorkerWrapper(
					"../../js/Parachute/ParachuteWorker.js",
					this.settings.simulationQuality,
					(w: Worker, data: any) => {
						//Worker posted a message. Stop the worker if it is done.
						if ("errorAvg" in data && "openedInstant" in data) {
							//Prepare the download button
							let downloadButton: HTMLButtonElement =
								document.getElementById("download-button") as HTMLButtonElement;
							downloadButton.disabled = false;
							downloadButton.onclick = () => {
								let csv = new CSVTable(this.parallelWorker,
									this.settings.simulationQuality *
									PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001,
									(buf: ArrayBuffer) => {
										return new Float64Array(buf)[0];
									}, parachuteGraphPropertyToString(this.settings.graphProperty));

								//Download the CSV file
								let a: HTMLAnchorElement = document.createElement("a");
								a.href = window.URL.createObjectURL(csv.toBlob());
								a.download = "Gráfico.csv";
								a.click();

								setTimeout(() => {
									window.URL.revokeObjectURL(a.href);
								}, 10000); //Delete the blob after some time	
							}
							
							//Prepare simulation results
							ParachuteResults.applyToPage(this.theoreticalResults, data.errorAvg,
								data.openedInstant);

							this.workerStopped = true;
						} else {
							this.parallelWorker.addBuffer(
								new NumberedBuffer(this.bufferCount, data.size, data.buf, 8));
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
			(document.getElementById("download-button") as HTMLButtonElement).disabled = true;
		});

		//Start the simulation when the user clicks the button
		document.getElementById("start-button").addEventListener("click", () => {
			this.settings.updatePage(); //Make sure the settings are up to date before starting

			this.theoreticalResults = ParachuteResults.calculateTheoreticalResults(this.settings);

			//Scroll to the canvas
			let y = this.graph.renderer.canvas.getBoundingClientRect().top + window.scrollY;
			smoothScroll(0, y, () => {
				this.workerStopped = false;
				this.bufferCount = 0;
				this.state = ParachuteState.Released;

				this.parallelWorker.start(
					{body: this.body, settings: this.settings},
					this.settings.simulationQuality);	
			});

			ParachuteSettings.disableSettingsElements();
		});

		//When the user clicks the ok button on the simulation results, hide that menu.
		document.getElementById("simulation-results-ok").addEventListener("click", () => {
			ParachuteStateManager.hideSimulationResults();
		});
	}
}

window.addEventListener("load", () => {
	ParachuteSimulation.startSimulation();
});