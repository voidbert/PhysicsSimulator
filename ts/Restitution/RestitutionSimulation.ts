const BODY_MASS = 1; //Mass is irrelevant for this simulation

enum RestitutionState {
	BeforeStart, OnAir, Ended
}

class RestitutionSimulation {
	static body = new Body(BODY_MASS, [], new Vec2(0, 1));
	static settings = new RestitutionSettings();

	static parallelWorker: WorkerWrapper;
	static workerStopped: boolean = false;
	static bufferCount: number = 0;

	static graph: RestitutionGraph;

	static state: RestitutionState = RestitutionState.BeforeStart;

	static startSimulation() {
		this.body.forces = [ new Vec2(0, -BODY_MASS * GRAVITY) ];

		this.graph = new RestitutionGraph();

		RestitutionSettings.addEvents();
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
					"../../js/Restitution/RestitutionWorker.js",
					RestitutionSimulation.settings.simulationQuality,
					(w: Worker, data: any) => {
						//Worker posted a message. Stop the worker if it is done.
						if (data === "DONE") {
							this.workerStopped = true;

							//Prepare the download button
							let downloadButton: HTMLButtonElement =
								document.getElementById("download-button") as HTMLButtonElement;
							downloadButton.disabled = false;
							downloadButton.onclick = () => {
								let csv = new CSVTable(this.parallelWorker,
									this.settings.simulationQuality * 0.001,
									(buf: ArrayBuffer) => {
										return new Float64Array(buf)[0];
									}, restitutionGraphPropertyToString(this.settings.graphProperty));

								//Download the CSV file
								let a: HTMLAnchorElement = document.createElement("a");
								a.href = window.URL.createObjectURL(csv.toBlob());
								a.download = "Gráfico.csv";
								a.click();

								setTimeout(() => {
									window.URL.revokeObjectURL(a.href);
								}, 10000); //Delete the blob after some time
							}
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
			if (this.state === RestitutionState.OnAir) {
				newWorker();
			}

			this.state = RestitutionState.BeforeStart;
			RestitutionSettings.enableSettingsElements();
			(document.getElementById("download-button") as HTMLButtonElement).disabled = true;
		});

		//Start the simulation when the user clicks the button
		document.getElementById("start-button").addEventListener("click", () => {
			this.settings.updatePage(); //Make sure the settings are up to date before starting
			
			this.workerStopped = false;
			this.bufferCount = 0;
			this.state = RestitutionState.OnAir;

			this.graph.elapsedSimulationTime = 0;

			if (this.state === RestitutionState.OnAir) {
				newWorker();
			}

			this.parallelWorker.start(
				{body: this.body, settings: this.settings},
				this.settings.simulationQuality);	

			RestitutionSettings.disableSettingsElements();
		});
	}
}

window.addEventListener("load", () => {
	RestitutionSimulation.startSimulation();
});