//Simulation quality - the number of milliseconds between calculating the positions of bodies (dt)
var SimulationQuality;
(function (SimulationQuality) {
    SimulationQuality[SimulationQuality["VeryLow"] = 50] = "VeryLow";
    SimulationQuality[SimulationQuality["Low"] = 30] = "Low";
    SimulationQuality[SimulationQuality["Medium"] = 20] = "Medium";
    SimulationQuality[SimulationQuality["High"] = 10] = "High";
    SimulationQuality[SimulationQuality["VeryHigh"] = 5] = "VeryHigh";
})(SimulationQuality || (SimulationQuality = {}));
//Responsible for the simulation timing, this class will use setInterval depending on the selected
//simulation quality. Because setInterval timing isn't perfect, it also keeps track of the time
//since the last setInterval callback.
var TimeStepper = /** @class */ (function () {
    function TimeStepper(callbackFunction, timeout) {
        var _this = this;
        this.callbackFunction = callbackFunction;
        this.timeout = timeout;
        this._isRunning = true;
        this.lastTime = Date.now();
        this.interval = setInterval(function () { _this.setIntervalCallback(); }, timeout);
    }
    Object.defineProperty(TimeStepper.prototype, "isRunning", {
        get: function () {
            return this._isRunning;
        },
        enumerable: false,
        configurable: true
    });
    //Changes the time between simulation steps
    TimeStepper.prototype.changeTimeout = function (timeout) {
        var _this = this;
        this.timeout = timeout;
        //Stop the current setInterval loop and start another one
        if (this.isRunning) {
            clearInterval(this.interval);
            this.interval = setInterval(function () { _this.setIntervalCallback(); }, timeout);
        }
    };
    //Resumes the simulation after stopPause()
    TimeStepper.prototype.resume = function () {
        var _this = this;
        if (!this.isRunning) {
            this.lastTime = Date.now();
            this._isRunning = true;
            this.interval = setInterval(function () { _this.setIntervalCallback(); }, this.timeout);
        }
    };
    //Stops / pauses the simulation.
    TimeStepper.prototype.stopPause = function () {
        if (this._isRunning) {
            clearInterval(this.interval);
            this._isRunning = false;
        }
    };
    TimeStepper.prototype.setIntervalCallback = function () {
        //Set lastTime in the beginning of the function, even if doing it in the end would be
        //easier, in order to account for the time that callbackFunction takes to run.
        var lastLastTime = this.lastTime;
        this.lastTime = Date.now();
        this.callbackFunction(this.lastTime - lastLastTime);
    };
    return TimeStepper;
}());
