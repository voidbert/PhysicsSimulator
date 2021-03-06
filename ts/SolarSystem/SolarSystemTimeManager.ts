enum SolarSystemPauseReason { //Why the simulation may be paused
	LackOfData, UserAction
}

const SIMULATION_SPEED_CORRESPONDENCE = [
	86400, //1 day per second
	172800, //2 days per second
	432000, //5 days per second
	864000, //10 days per second
	1728000, //20 days per second
	4320000, //50 days per second
	8640000 //100 days per second
];

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
			this.lastUpdateCorrespondence += (Date.now() - this.lastUpdate) *
				SIMULATION_SPEED_CORRESPONDENCE[SolarSystemSimulation.settings.simulationSpeed];
			this.lastUpdate = Date.now();
			return this.lastUpdateCorrespondence;
		}
	}
}