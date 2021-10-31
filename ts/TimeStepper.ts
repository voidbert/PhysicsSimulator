//Simulation quality - the number of milliseconds between calculating the positions of bodies (dt)
enum SimulationQuality {
	VeryLow = 50,
	Low = 30,
	Medium = 20,
	High = 10,
	VeryHigh = 5
}

//Responsible for the simulation timing, this class will use setInterval depending on the selected
//simulation quality. Because setInterval timing isn't perfect, it also keeps track of the time
//since the last setInterval callback.
class TimeStepper {
	private timeout: number;
	private interval: number; //The result of setInterval
	private lastTime: number; //When setIntervalCallback was last called
	public _isRunning: boolean; //Prevents clearing an already-cleared interval.

	//The function that gets called in every setInterval. dt is in milliseconds.
	public callbackFunction: (dt: number) => any;

	constructor(callbackFunction: (dt: number) => any, timeout: number) {
		this.callbackFunction = callbackFunction;

		this.timeout = timeout;
		this._isRunning = true;
		this.lastTime = Date.now();
		this.interval = setInterval(() => { this.setIntervalCallback(); }, timeout);
	}

	public get isRunning(): boolean {
		return this._isRunning;
	}

	//Changes the time between simulation steps
	public changeTimeout(timeout: number) {
		this.timeout = timeout;

		//Stop the current setInterval loop and start another one
		if (this.isRunning) {
			clearInterval(this.interval);
			this.interval = setInterval(() => { this.setIntervalCallback(); }, timeout);
		}
	}

	//Resumes the simulation after stopPause()
	public resume() {
		if (!this.isRunning) {
			this.lastTime = Date.now();
			this._isRunning = true;
			this.interval = setInterval(() => { this.setIntervalCallback(); }, this.timeout);
		}
	}

	//Stops / pauses the simulation.
	public stopPause() {
		if (this._isRunning) {
			clearInterval(this.interval);
			this._isRunning = false;
		}	
	}

	private setIntervalCallback() {
		//Set lastTime in the beginning of the function, even if doing it in the end would be
		//easier, in order to account for the time that callbackFunction takes to run.
		let lastLastTime = this.lastTime;
		this.lastTime = Date.now();

		this.callbackFunction(this.lastTime - lastLastTime);
	}
}