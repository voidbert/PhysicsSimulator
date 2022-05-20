class SolarSystemPlanetCharacteristics {
    constructor(radius = 1, color = "#fff") {
        this.radius = radius;
        this.color = color;
    }
}
const SINGLE_ORBIT_ANGLE = {
    "VeryLow": Math.PI * 0.20,
    "Low": Math.PI * 0.08,
    "Medium": Math.PI * 0.03,
    "High": Math.PI * 0.01,
    "VeryHigh": Math.PI * 0.01
};
class SolarSystemBodyManager {
    constructor(bodies, characteristics) {
        var _a;
        this.bufferCount = 0;
        this.parallelWorker = new WorkerWrapper("../../js/SolarSystem/SolarSystemWorker.js", SolarSystemSimulation.settings.simulationQuality, (w, data) => {
            this.parallelWorker.addBuffer(new NumberedBuffer(this.bufferCount, data.size, data.buf, bodies.length * 16));
            this.bufferCount++;
        }, 1024, 16);
        this.bodies = bodies;
        this.bodyCharacteristics = characteristics;
        if (this.bodies.length > this.bodyCharacteristics.length) {
            console.error("SolarSystemBodyManager: different number of planets and characteristics");
            let newArray = new Array(this.bodies.length);
            for (let i = 0; i < this.bodies.length; ++i) {
                newArray[i] = (_a = characteristics[i]) !== null && _a !== void 0 ? _a : new SolarSystemPlanetCharacteristics();
            }
            this.bodyCharacteristics = newArray;
        }
        this.parallelWorker.start({ bodies: this.bodies }, SolarSystemSimulation.settings.simulationQuality);
    }
    updatePositions(instant, simulationQuality) {
        let buffers = this.parallelWorker.getBoundaryBuffers(instant, true, true);
        if (buffers.length === 0) {
            SolarSystemSimulation.timeManager.pause(SolarSystemPauseReason.LackOfData);
        }
        else {
            if (SolarSystemSimulation.timeManager.pauseReason ===
                SolarSystemPauseReason.LackOfData) {
                SolarSystemSimulation.timeManager.resume();
            }
            let buf1 = new Float64Array(buffers[0]);
            let buf2 = new Float64Array(buffers[1]);
            let length = Math.max(buf1.length, buf2.length, this.bodies.length * 2) / 2;
            for (let i = 0; i < length; ++i) {
                this.bodies[i].r = ExtraMath.linearInterpolationVec2(new Vec2(buf1[i * 2], buf1[i * 2 + 1]), new Vec2(buf2[i * 2], buf2[i * 2 + 1]), simulationQuality, instant % simulationQuality);
            }
        }
    }
    renderBodies(renderer, camera, time) {
        for (let i = 0; i < this.bodies.length; ++i) {
            let scale = 0;
            if (i === 0) {
                scale = 1 + 5 * SolarSystemSimulation.settings.bodyRadius;
            }
            else if (i <= 4) {
                scale = 1 + 200 * SolarSystemSimulation.settings.bodyRadius;
            }
            else {
                scale = 1 + 50 * SolarSystemSimulation.settings.bodyRadius;
            }
            let geometry = this.bodies[i].geometry.map((point) => {
                return camera.pointToScreenPosition(this.bodies[i].transformVertex(point.scale(this.bodyCharacteristics[i].radius * scale)));
            });
            renderer.renderPolygon(geometry, this.bodyCharacteristics[i].color);
        }
        if (!SolarSystemSimulation.settings.seeOrbits)
            return;
        renderer.ctx.strokeStyle = "#fff";
        renderer.ctx.lineWidth = 1;
        let limitAngleCosine = Math.cos(SINGLE_ORBIT_ANGLE[SolarSystemSimulationQuality[SolarSystemSimulation.settings.simulationQuality]]);
        for (let i = 0; i < this.bodies.length; ++i) {
            let vectorReal = this.bodies[i].r.subtract(this.bodies[0].r);
            let currentBuffer;
            let bufferArrayView;
            let currentBufferNumber;
            let currentFrameNumber;
            let updateFrame = () => {
                if (currentFrameNumber >= this.parallelWorker.bufferSize) {
                    currentFrameNumber -= this.parallelWorker.bufferSize;
                    currentBufferNumber++;
                    currentBuffer = this.parallelWorker.getBuffer(currentBufferNumber);
                }
                if (currentBuffer === null) {
                    return null;
                }
                else {
                    bufferArrayView = new Float64Array(currentBuffer.buffer);
                }
                return new Vec2(bufferArrayView[this.bodies.length * 2 * currentFrameNumber + i * 2], bufferArrayView[this.bodies.length * 2 * currentFrameNumber + i * 2 + 1]);
            };
            let frameNumber = Math.floor(time /
                SolarSystemSimulation.settings.simulationQuality) + 1;
            currentBufferNumber = Math.floor(frameNumber / this.parallelWorker.bufferSize);
            currentFrameNumber = frameNumber - currentBufferNumber * this.parallelWorker.bufferSize;
            currentBuffer = this.parallelWorker.getBuffer(currentBufferNumber);
            if (currentBuffer === null) {
                return;
            }
            else {
                bufferArrayView = new Float64Array(currentBuffer.buffer);
            }
            let frame = updateFrame();
            let elapsed = 0;
            renderer.ctx.beginPath();
            let cameraPosition = camera.pointToScreenPosition(frame);
            renderer.ctx.moveTo(cameraPosition.x, cameraPosition.y);
            while (frame !== null) {
                cameraPosition = camera.pointToScreenPosition(frame);
                renderer.ctx.lineTo(cameraPosition.x, cameraPosition.y);
                if (SolarSystemSimulation.settings.singleOrbits) {
                    if (i !== 0 &&
                        (elapsed >= 80 * 86400000 && i <= 4 || elapsed >= 4000 * 86400000 && i <= 7
                            || elapsed >= 60000 * 86400000)) {
                        let vectorOrbit = frame.subtract(this.bodies[0].r);
                        let angle = vectorOrbit.dotProduct(vectorReal) /
                            (Math.sqrt(vectorOrbit.squareNorm() * vectorReal.squareNorm()));
                        if (angle > limitAngleCosine)
                            break;
                    }
                }
                currentFrameNumber++;
                frame = updateFrame();
                elapsed += SolarSystemSimulation.settings.simulationQuality;
            }
            renderer.ctx.stroke();
        }
    }
}
