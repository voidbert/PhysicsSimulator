enum SolarSystemPauseReason { //Why the simulation may be paused
	LackOfData, UserAction
}

class SolarSystemTimeManager {
	private lastUpdate: number; //When the manager was updated (started, paused, resumed or getTime)
	private lastUpdateCorrespondence: number; //The simulation time when that happened.
	public isPaused: boolean;
	public pauseReason: SolarSystemPauseReason;

	constructor() {}

	start() {
		this.lastUpdate = Date.now();
		this.lastUpdateCorrespondence = 0;
		this.isPaused = false;
	}

	pause(reason: SolarSystemPauseReason) {
		this.lastUpdateCorrespondence += Date.now() - this.lastUpdate;
		this.lastUpdate = Date.now();

		this.isPaused = true;
		this.pauseReason = reason;
	}

	resume() {
		this.lastUpdate = Date.now();
		this.isPaused = false;
	}

	//Returns the simulation time in milliseconds
	getTime(): number {
		if (this.isPaused) {
			return this.lastUpdateCorrespondence;
		} else {
			//OG - 846000
			this.lastUpdateCorrespondence += (Date.now() - this.lastUpdate) * 423000; //TODO - speed
			this.lastUpdate = Date.now();
			return this.lastUpdateCorrespondence;
		}
	}
}