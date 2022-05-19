const SIMULATION_QUALITY = RestitutionSimulationQuality.VeryLow; //TODO - non constant quality

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
		this.graph = new RestitutionGraph();

		//Creates a new worker. If the old one stopped, there's no need to recreate it. It can be
		//reused because it will no longer post messages about old simulations.
		let newWorker = () => {
			if (!this.workerStopped) {
				if (this.parallelWorker) {
					this.parallelWorker.terminate();
				}

				this.parallelWorker = new WorkerWrapper(
					"../../js/Restitution/RestitutionWorker.js",
					SIMULATION_QUALITY,
					(w: Worker, data: any) => {
						//Worker posted a message. Stop the worker if it is done.
						if ("errorAvg" in data && "openedInstant" in data) {
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

		this.workerStopped = false;
		this.bufferCount = 0;
		this.state = RestitutionState.OnAir;
		this.parallelWorker.start(
			{body: this.body, settings: null }, //TODO - change null to settings
			SIMULATION_QUALITY);
	}
}

window.addEventListener("load", () => {
	RestitutionSimulation.startSimulation();
});