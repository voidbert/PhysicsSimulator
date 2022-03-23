var NumberedBuffer = (function () {
    function NumberedBuffer(index, size, buffer, frameSize) {
        this.index = index;
        this.size = size;
        this.buffer = buffer;
        this.frameSize = frameSize;
    }
    NumberedBuffer.prototype.getFrame = function (index) {
        if (index * this.frameSize >= this.size) {
            return null;
        }
        var bufferView = new Uint8Array(this.buffer);
        var ret = new Uint8Array(this.frameSize);
        for (var i = 0; i < this.frameSize; ++i) {
            ret[i] = bufferView[index * this.frameSize + i];
        }
        return ret.buffer;
    };
    return NumberedBuffer;
}());
var WorkerWrapper = (function () {
    function WorkerWrapper(url, simulationQuality, callback, bufferSize, bufferLimit) {
        var _this = this;
        if (bufferSize === void 0) { bufferSize = 512; }
        if (bufferLimit === void 0) { bufferLimit = 16; }
        this.buffers = [];
        this.bufferSize = bufferSize;
        this.bufferLimit = bufferLimit;
        this.simulationQuality = simulationQuality;
        this.worker = new Worker(url);
        this.worker.onmessage = function (e) {
            callback(_this.worker, e.data);
        };
    }
    WorkerWrapper.prototype.start = function (data, simulationQuality) {
        if (simulationQuality === void 0) { simulationQuality = this.simulationQuality; }
        this.buffers = [];
        this.simulationQuality = simulationQuality;
        data.bufferSize = Math.max(this.bufferSize, 1);
        data.allowedBuffers = this.bufferLimit;
        data.simulationQuality = this.simulationQuality;
        this.worker.postMessage(data);
    };
    WorkerWrapper.prototype.addBuffer = function (buffer) {
        if (this.buffers.length >= this.bufferLimit) {
            for (var i = 0; i < this.buffers.length; ++i) {
                if (this.buffers[i] === null) {
                    this.buffers[i] = buffer;
                    return;
                }
            }
            throw new Error("There is no free space for this buffer");
        }
        else {
            this.buffers.push(buffer);
        }
    };
    WorkerWrapper.prototype.clearBuffer = function (index) {
        for (var i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === index) {
                this.buffers[i] = null;
                this.worker.postMessage({ allowedBuffers: 1 });
                return;
            }
        }
    };
    WorkerWrapper.prototype.getBoundaryBuffers = function (time, autoClear) {
        if (autoClear === void 0) { autoClear = false; }
        var frameNumber0 = Math.floor(time / this.simulationQuality);
        var frameNumber1 = Math.ceil(time / this.simulationQuality);
        var bufferNumber0 = Math.floor(frameNumber0 / this.bufferSize);
        var bufferNumber1 = Math.floor(frameNumber1 / this.bufferSize);
        var buffer0 = null;
        var buffer1 = null;
        for (var i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === bufferNumber0) {
                buffer0 = this.buffers[i];
            }
            if (this.buffers[i] && this.buffers[i].index === bufferNumber1) {
                buffer1 = this.buffers[i];
            }
        }
        if (buffer0 === null || buffer1 === null) {
            return [];
        }
        frameNumber0 -= bufferNumber0 * this.bufferSize;
        frameNumber1 -= bufferNumber1 * this.bufferSize;
        var frame0 = buffer0.getFrame(frameNumber0);
        var frame1 = buffer1.getFrame(frameNumber1);
        if (frame0 === null || frame1 === null) {
            return [];
        }
        if (autoClear) {
            var clearCount = 0;
            for (var i = 0; i < this.buffers.length; i++) {
                if (bufferNumber0 === bufferNumber1) {
                    if (this.buffers[i] && this.buffers[i].index < buffer0.index) {
                        this.buffers[i] = null;
                        clearCount++;
                    }
                }
                else {
                    if (this.buffers[i] && this.buffers[i].index < buffer1.index) {
                        this.buffers[i] = null;
                        clearCount++;
                    }
                }
            }
            if (clearCount !== 0)
                this.worker.postMessage({ allowedBuffers: clearCount });
        }
        return [frame0, frame1];
    };
    WorkerWrapper.prototype.terminate = function () {
        this.worker.terminate();
    };
    WorkerWrapper.prototype.getFrame = function (index) {
        var buffer = Math.floor(index / this.bufferSize);
        var frame = index - buffer * this.bufferSize;
        for (var i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === buffer) {
                return this.buffers[i].getFrame(frame);
            }
        }
        return null;
    };
    WorkerWrapper.prototype.getLastFrame = function () {
        var maxIndex = 0;
        var bufferIndex = -1;
        for (var i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index >= maxIndex) {
                maxIndex = this.buffers[i].index;
                bufferIndex = i;
            }
        }
        if (bufferIndex === -1) {
            throw new Error("No buffers stored");
        }
        else {
            var buf = this.buffers[bufferIndex];
            return buf.getFrame(buf.size / buf.frameSize - 1);
        }
    };
    return WorkerWrapper;
}());
