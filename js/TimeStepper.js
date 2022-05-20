class TimeStepper {
    constructor(callbackFunction, timeout) {
        this.callbackFunction = callbackFunction;
        this.timeout = timeout;
        this._isRunning = true;
        this.lastTime = Date.now();
        this.interval = setInterval(() => { this.setIntervalCallback(); }, timeout);
    }
    get isRunning() {
        return this._isRunning;
    }
    changeTimeout(timeout) {
        this.timeout = timeout;
        if (this.isRunning) {
            clearInterval(this.interval);
            this.interval = setInterval(() => { this.setIntervalCallback(); }, timeout);
        }
    }
    resume() {
        if (!this.isRunning) {
            this.lastTime = Date.now();
            this._isRunning = true;
            this.interval = setInterval(() => { this.setIntervalCallback(); }, this.timeout);
        }
    }
    stopPause() {
        if (this._isRunning) {
            clearInterval(this.interval);
            this._isRunning = false;
        }
    }
    setIntervalCallback() {
        let lastLastTime = this.lastTime;
        this.lastTime = Date.now();
        this.callbackFunction(this.lastTime - lastLastTime);
    }
}
