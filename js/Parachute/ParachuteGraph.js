var PARACHUTE_SIMULATION_SKIPPED_FACTOR = 10;
var FAST_FORWARD_FACTOR = 2;
var ParachuteGraph = (function () {
    function ParachuteGraph() {
        var _this = this;
        this.camera = new Camera(new Vec2(-2, -1), new Vec2(32, 32));
        this.axes = new AxisSystem(this.camera, true, true, true, true, true, true, true, false, false, false, true, true, 64, 64, new Vec2(), "t", "y (m)", "black", 2, "0.9rem sans-serif", "#555555", 1, "white");
        var elapsedSimulationTime = 0;
        var lastRendererTick = Date.now();
        this.renderer = new Renderer(window, document.getElementById("graph"), function () {
            function getTheoreticalPoint(time) {
                switch (ParachuteSimulation.settings.graphProperty) {
                    case ParachuteGraphProperty.Y:
                        return ParachuteSimulation.theoreticalResults.y(time);
                    case ParachuteGraphProperty.R:
                        return ParachuteSimulation.theoreticalResults.r(time);
                    case ParachuteGraphProperty.Velocity:
                        return ParachuteSimulation.theoreticalResults.v(time);
                    case ParachuteGraphProperty.AirResistance:
                        return ParachuteSimulation.theoreticalResults.Rair(time);
                    case ParachuteGraphProperty.ResultantForce:
                        return ParachuteSimulation.theoreticalResults.Fr(time);
                    case ParachuteGraphProperty.Acceleration:
                        return ParachuteSimulation.theoreticalResults.a(time);
                }
            }
            ParachuteSettings.adjustUI();
            if (ParachuteSimulation.state === ParachuteState.BeforeRelease) {
                elapsedSimulationTime = 0;
                lastRendererTick = Date.now();
                _this.maxY = 0;
                _this.camera.scale = new Vec2(32, 32);
                _this.camera.forcePosition(new Vec2(0, 0), new Vec2(96, _this.renderer.canvas.height - 32));
                _this.axes.drawAxes(_this.renderer);
                return;
            }
            _this.scaleCamera(elapsedSimulationTime * 0.001, _this.maxY + 1);
            _this.axes.drawAxes(_this.renderer);
            var lackOfData = false;
            var frame = ParachuteSimulation.parallelWorker.getFrame(0);
            if (frame === null) {
                lackOfData = true;
            }
            if (!lackOfData) {
                var lastPoint = _this.camera.pointToScreenPosition(new Vec2(0, new Float64Array(frame)[0]));
                _this.renderer.ctx.strokeStyle = "#00ff00";
                _this.renderer.ctx.lineWidth = 2;
                _this.renderer.ctx.beginPath();
                _this.renderer.ctx.moveTo(lastPoint.x, lastPoint.y);
                var maxi = elapsedSimulationTime / (ParachuteSimulation.settings.simulationQuality *
                    PARACHUTE_SIMULATION_SKIPPED_FACTOR);
                var reachedi = -1;
                for (var i = 1; i < maxi; i++) {
                    frame = ParachuteSimulation.parallelWorker.getFrame(i);
                    if (frame === null) {
                        lackOfData = true;
                        reachedi = i;
                        break;
                    }
                    var y = new Float64Array(frame)[0];
                    var point = _this.camera.pointToScreenPosition(new Vec2(i * ParachuteSimulation.settings.simulationQuality *
                        PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001, y));
                    if (y > _this.maxY) {
                        _this.maxY = y;
                    }
                    _this.renderer.ctx.lineTo(point.x, point.y);
                    lastPoint = point;
                }
                _this.renderer.ctx.stroke();
                if (reachedi === -1) {
                    reachedi = maxi;
                }
                var lastTheoreticalPoint = _this.camera.pointToScreenPosition(new Vec2(0, getTheoreticalPoint(0)));
                if (ParachuteSimulation.settings.seeTheoretical) {
                    _this.renderer.ctx.beginPath();
                    _this.renderer.ctx.strokeStyle = "#ff0000aa";
                    _this.renderer.ctx.lineWidth = 2;
                    _this.renderer.ctx.moveTo(lastTheoreticalPoint.x, lastTheoreticalPoint.y);
                    maxi = Math.min(reachedi, ParachuteSimulation.theoreticalResults.timeParachuteOpens /
                        (ParachuteSimulation.settings.simulationQuality * PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001));
                    for (var i = 1; i < maxi; i++) {
                        var time = i * ParachuteSimulation.settings.simulationQuality *
                            PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001;
                        var theoreticalPoint = _this.camera.pointToScreenPosition(new Vec2(time, getTheoreticalPoint(time)));
                        _this.renderer.ctx.lineTo(theoreticalPoint.x, theoreticalPoint.y);
                        lastTheoreticalPoint = theoreticalPoint;
                    }
                }
                _this.renderer.ctx.stroke();
            }
            if (lackOfData) {
                if (ParachuteSimulation.workerStopped &&
                    ParachuteSimulation.state === ParachuteState.Released) {
                    if (ParachuteSimulation.settings.simulationResults) {
                        ParachuteStateManager.showSimulationResults();
                    }
                    else {
                        ParachuteSimulation.state = ParachuteState.ReachedGround;
                    }
                    ParachuteSettings.enableSettingsElements();
                }
                lastRendererTick = Date.now();
            }
            else {
                if (ParachuteSimulation.settings.fastForward) {
                    elapsedSimulationTime += (Date.now() - lastRendererTick) * FAST_FORWARD_FACTOR;
                }
                else {
                    elapsedSimulationTime += Date.now() - lastRendererTick;
                }
                lastRendererTick = Date.now();
            }
        }, function () {
            var rect = _this.renderer.canvas.getBoundingClientRect();
            _this.renderer.canvas.width = rect.width * window.devicePixelRatio;
            _this.renderer.canvas.height = rect.height * window.devicePixelRatio;
            _this.camera.canvasSize = new Vec2(_this.renderer.canvas.width, _this.renderer.canvas.height);
            if (ParachuteSimulation.state === ParachuteState.BeforeRelease) {
                _this.maxY = _this.camera.pointToWorldPosition(new Vec2(0, 0)).y;
            }
            ParachuteStateManager.scaleSimulationResults();
        });
        this.renderer.renderLoop();
    }
    ParachuteGraph.prototype.scaleCamera = function (maxX, maxY) {
        this.camera.fitMaxX(maxX);
        this.camera.scale.x = Math.min(this.camera.scale.x, 32);
        this.camera.fitMaxY(maxY);
        this.camera.scale.y = Math.min(this.camera.scale.y, 32);
        this.camera.forcePosition(new Vec2(0, 0), new Vec2(96, this.renderer.canvas.height - 32));
    };
    return ParachuteGraph;
}());
