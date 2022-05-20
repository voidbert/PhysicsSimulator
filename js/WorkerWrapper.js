class NumberedBuffer {
    constructor(index, size, buffer, frameSize) {
        this.index = index;
        this.size = size;
        this.buffer = buffer;
        this.frameSize = frameSize;
    }
    getFrame(index) {
        if (index * this.frameSize >= this.size) {
            return null;
        }
        let bufferView = new Uint8Array(this.buffer);
        let ret = new Uint8Array(this.frameSize);
        for (let i = 0; i < this.frameSize; ++i) {
            ret[i] = bufferView[index * this.frameSize + i];
        }
        return ret.buffer;
    }
}
class WorkerWrapper {
    constructor(url, simulationQuality, callback, bufferSize = 512, bufferLimit = 16) {
        this.buffers = [];
        this._bufferSize = bufferSize;
        this.bufferLimit = bufferLimit;
        this._simulationQuality = simulationQuality;
        this.worker = new Worker(url);
        this.worker.onmessage = (e) => {
            callback(this.worker, e.data);
        };
    }
    get bufferSize() { return this._bufferSize; }
    get simulationQuality() { return this._simulationQuality; }
    start(data, simulationQuality = this._simulationQuality) {
        this.buffers = [];
        this._simulationQuality = simulationQuality;
        data.bufferSize = Math.max(this._bufferSize, 1);
        data.allowedBuffers = this.bufferLimit;
        data.simulationQuality = this._simulationQuality;
        this.worker.postMessage(data);
    }
    addBuffer(buffer) {
        if (this.buffers.length >= this.bufferLimit) {
            for (let i = 0; i < this.buffers.length; ++i) {
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
    }
    clearBuffer(index) {
        for (let i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === index) {
                this.buffers[i] = null;
                this.worker.postMessage({ allowedBuffers: 1 });
                return;
            }
        }
    }
    getBoundaryBuffers(time, autoClear = false, sleepProtection = false) {
        let frameNumber0 = Math.floor(time / this._simulationQuality);
        let frameNumber1 = Math.ceil(time / this._simulationQuality);
        let bufferNumber0 = Math.floor(frameNumber0 / this._bufferSize);
        let bufferNumber1 = Math.floor(frameNumber1 / this._bufferSize);
        let buffer0 = null;
        let buffer1 = null;
        let maxBufferNumber = -1;
        for (let i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === bufferNumber0) {
                buffer0 = this.buffers[i];
            }
            if (this.buffers[i] && this.buffers[i].index === bufferNumber1) {
                buffer1 = this.buffers[i];
            }
            if (this.buffers[i] && this.buffers[i].index > maxBufferNumber) {
                maxBufferNumber = this.buffers[i].index;
            }
        }
        if (buffer0 === null || buffer1 === null) {
            if (sleepProtection && bufferNumber0 >= maxBufferNumber) {
                let bufferCount = 0;
                for (let i = 0; i < this.buffers.length; ++i) {
                    if (this.buffers[i] && this.buffers[i].index < bufferNumber0) {
                        this.buffers[i] = null;
                        bufferCount++;
                    }
                }
                this.worker.postMessage({ allowedBuffers: bufferCount });
            }
            return [];
        }
        frameNumber0 -= bufferNumber0 * this._bufferSize;
        frameNumber1 -= bufferNumber1 * this._bufferSize;
        let frame0 = buffer0.getFrame(frameNumber0);
        let frame1 = buffer1.getFrame(frameNumber1);
        if (frame0 === null || frame1 === null) {
            return [];
        }
        if (autoClear) {
            let clearCount = 0;
            for (let i = 0; i < this.buffers.length; i++) {
                if (bufferNumber0 === bufferNumber1) {
                    if (this.buffers[i] && this.buffers[i].index < buffer0.index) {
                        this.buffers[i] = null;
                        clearCount++;
                    }
                }
            }
            if (clearCount !== 0)
                this.worker.postMessage({ allowedBuffers: clearCount });
        }
        return [frame0, frame1];
    }
    terminate() {
        this.worker.terminate();
    }
    getFrame(index) {
        let buffer = Math.floor(index / this._bufferSize);
        let frame = index - buffer * this._bufferSize;
        for (let i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === buffer) {
                return this.buffers[i].getFrame(frame);
            }
        }
        return null;
    }
    getBuffer(index) {
        for (let i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === index) {
                return this.buffers[i];
            }
        }
        return null;
    }
    getLastFrame() {
        let maxIndex = 0;
        let bufferIndex = -1;
        for (let i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index >= maxIndex) {
                maxIndex = this.buffers[i].index;
                bufferIndex = i;
            }
        }
        if (bufferIndex === -1) {
            throw new Error("No buffers stored");
        }
        else {
            let buf = this.buffers[bufferIndex];
            return buf.getFrame(buf.size / buf.frameSize - 1);
        }
    }
}
