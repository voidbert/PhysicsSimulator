var TimeStepper = (function () {
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
    TimeStepper.prototype.changeTimeout = function (timeout) {
        var _this = this;
        this.timeout = timeout;
        if (this.isRunning) {
            clearInterval(this.interval);
            this.interval = setInterval(function () { _this.setIntervalCallback(); }, timeout);
        }
    };
    TimeStepper.prototype.resume = function () {
        var _this = this;
        if (!this.isRunning) {
            this.lastTime = Date.now();
            this._isRunning = true;
            this.interval = setInterval(function () { _this.setIntervalCallback(); }, this.timeout);
        }
    };
    TimeStepper.prototype.stopPause = function () {
        if (this._isRunning) {
            clearInterval(this.interval);
            this._isRunning = false;
        }
    };
    TimeStepper.prototype.setIntervalCallback = function () {
        var lastLastTime = this.lastTime;
        this.lastTime = Date.now();
        this.callbackFunction(this.lastTime - lastLastTime);
    };
    return TimeStepper;
}());
