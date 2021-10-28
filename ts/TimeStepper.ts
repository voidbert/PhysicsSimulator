//Responsible for the simulation timing, this class will use setInterval depending on the selected
//simulation quality. Because setInterval timing isn't perfect, it also keeps track of the time
//since the last setInterval callback.
class TimeStepper {
	private interval: number; //The result of setInterval
	private lastTime: number; //When setIntervalCallback was last called

	//The function that gets called in every setInterval. dt is in milliseconds.
	public callbackFunction: (dt: number) => any;

	constructor(callbackFunction: (dt: number) => any, timeout: number) {
		this.callbackFunction = callbackFunction;
		this.lastTime = Date.now();
		this.interval = setInterval(() => { this.setIntervalCallback(); }, timeout);
	}

	private setIntervalCallback() {
		//Set lastTime in the beginning of the function, even if doing it in the end would be
		//easier, in order to account for the time that callbackFunction takes to run.
		let lastLastTime = this.lastTime;
		this.lastTime = Date.now();

		this.callbackFunction(this.lastTime - lastLastTime);
	}
}