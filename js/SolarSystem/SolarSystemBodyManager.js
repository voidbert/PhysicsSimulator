var SolarSystemBodyManager = (function () {
    function SolarSystemBodyManager(bodies) {
        var _this = this;
        this.bufferCount = 0;
        this.parallelWorker = new WorkerWrapper("../../js/SolarSystem/SolarSystemWorker.js", SIMULATION_QUALITY, function (w, data) {
            _this.parallelWorker.addBuffer(new NumberedBuffer(_this.bufferCount, data.size, data.buf, bodies.length * 16));
            var array = new Float64Array(data.buf);
            console.log(array);
            _this.bufferCount++;
        }, 128, 2);
        this.bodies = bodies;
        this.parallelWorker.start({ bodies: this.bodies }, SIMULATION_QUALITY);
    }
    SolarSystemBodyManager.prototype.updatePositions = function (instant, simulationQuality) {
        var buffers = this.parallelWorker.getBoundaryBuffers(instant, true);
        if (buffers.length === 0) {
            SolarSystemSimulation.timeManager.pause(SolarSystemPauseReason.LackOfData);
        }
        else {
            SolarSystemSimulation.timeManager.resume();
            var buf1 = new Float64Array(buffers[0]);
            var buf2 = new Float64Array(buffers[1]);
            var length_1 = Math.max(buf1.length, buf2.length, this.bodies.length * 2) / 2;
            for (var i = 0; i < length_1; ++i) {
                this.bodies[i].r = ExtraMath.linearInterpolationVec2(new Vec2(buf1[i * 2], buf1[i * 2 + 1]), new Vec2(buf2[i * 2], buf2[i * 2 + 1]), simulationQuality, instant % simulationQuality);
            }
        }
    };
    SolarSystemBodyManager.prototype.renderBodies = function (renderer, camera) {
        for (var i = 0; i < this.bodies.length; ++i) {
            renderer.renderPolygon(camera.polygonToScreenPosition(this.bodies[i].transformGeometry()), "white");
        }
    };
    return SolarSystemBodyManager;
}());
