var BODY_GEOMETRY = ExtraMath.generatePolygon(20, 0.5);
var ProjectileThrowSimulation = (function () {
    function ProjectileThrowSimulation() {
    }
    ProjectileThrowSimulation.parseFrame = function (frame) {
        var view = new Float64Array(frame);
        return new Vec2(view[0], view[1]);
    };
    ProjectileThrowSimulation.startSimulation = function () {
        var _this = this;
        this.projectile.forces = [new Vec2(0, -GRAVITY * 1)];
        ProjectileThrowSettings.addEvents();
        ProjectileThrowEvents.addEvents();
        var theoreticalResults = null;
        var bufferCount = 0;
        var newWorker = function () {
            if (!_this.workerStopped) {
                if (_this.parallelWorker) {
                    _this.parallelWorker.terminate();
                }
                _this.parallelWorker = new WorkerWrapper("../../js/ProjectileThrow/ProjectileThrowWorker.js", _this.settings.simulationQuality, function (w, data) {
                    var keys = Object.keys(data);
                    if (keys.indexOf("time") !== -1 && keys.indexOf("distance") !== -1 &&
                        keys.indexOf("maxHeight") !== -1) {
                        var results = new ProjectileThrowResults();
                        results.time = data.time;
                        results.distance = data.distance;
                        results.maxHeight = data.maxHeight;
                        ProjectileThrowResults.applyToPage(theoreticalResults, results);
                        _this.workerStopped = true;
                    }
                    else {
                        _this.parallelWorker.addBuffer(new NumberedBuffer(bufferCount, data.size, data.buf, 16));
                        bufferCount++;
                    }
                }, 512, 16);
            }
        };
        newWorker();
        this.settings = this.settings.getFromPage();
        this.settings.updatePage();
        var elapsedSimulationTime = 0;
        var lastRendererTick = Date.now();
        this.renderer = new Renderer(window, document.getElementById("canvas"), function () {
            var bodyFrame = [];
            if (_this.state === ProjectileThrowState.projectileMoving)
                bodyFrame = _this.parallelWorker.getBoundaryBuffers(elapsedSimulationTime, true);
            if (bodyFrame.length === 0) {
                if (_this.workerStopped && _this.state === ProjectileThrowState.projectileMoving) {
                    _this.state = ProjectileThrowState.projectileStopped;
                    ProjectileThrowSettings.enableSettingsElements();
                    _this.projectile.r = _this.parseFrame(_this.parallelWorker.getLastFrame());
                    if (_this.settings.showSimulationResults) {
                        ProjectileThrowStateManager.showSimulationResults();
                    }
                }
                lastRendererTick = Date.now();
            }
            else {
                _this.projectile.r = ExtraMath.linearInterpolationVec2(_this.parseFrame(bodyFrame[0]), _this.parseFrame(bodyFrame[1]), _this.settings.simulationQuality, elapsedSimulationTime % _this.settings.simulationQuality);
                elapsedSimulationTime += Date.now() - lastRendererTick;
                lastRendererTick = Date.now();
            }
            _this.camera.forcePosition(_this.projectile.r, _this.camera.canvasSize.scale(0.5));
            _this.axes.drawAxes(_this.renderer);
            _this.renderer.renderPolygon(_this.camera.polygonToScreenPosition(_this.projectile.transformGeometry()), "red");
            if (_this.state === ProjectileThrowState.choosingVelocity) {
                _this.renderer.renderLines([
                    _this.camera.pointToScreenPosition(_this.projectile.transformVertex(new Vec2())),
                    ProjectileThrowEvents.mousePosition
                ], "#00ff00", 2);
            }
            if (_this.settings.showTrajectory && _this.trajectory) {
                _this.renderer.renderLinesStrip(_this.camera.polygonToScreenPosition(_this.trajectory.points), "white", 2);
            }
        }, function () {
            _this.renderer.canvas.width = window.innerWidth * window.devicePixelRatio;
            _this.renderer.canvas.height = window.innerHeight * window.devicePixelRatio;
            var renderingSurfaceSize = new Vec2();
            if (isPortrait()) {
                renderingSurfaceSize = new Vec2(window.innerWidth, window.innerHeight)
                    .scale(window.devicePixelRatio);
            }
            else {
                renderingSurfaceSize = new Vec2(window.innerWidth -
                    document.getElementById("simulation-interaction-div").clientWidth, window.innerHeight).scale(window.devicePixelRatio);
            }
            _this.camera.canvasSize = renderingSurfaceSize;
            ProjectileThrowStateManager.scaleSimulationResults();
        });
        this.renderer.renderLoop();
        document.getElementById("choose-screen-velocity").addEventListener("click", function () {
            if (_this.state === ProjectileThrowState.projectileInLaunchPosition ||
                _this.state === ProjectileThrowState.projectileStopped) {
                ProjectileThrowStateManager.enterChoosingVelocityMode();
            }
        });
        document.getElementById("simulation-results-ok").addEventListener("click", function () {
            ProjectileThrowStateManager.hideSimulationResults();
        });
        document.getElementById("reset-button").addEventListener("click", function () {
            if (_this.state === ProjectileThrowState.projectileMoving) {
                newWorker();
                ProjectileThrowSettings.enableSettingsElements();
            }
            if (_this.state === ProjectileThrowState.choosingVelocity)
                ProjectileThrowStateManager.exitChoosingVelocityMode();
            _this.state = ProjectileThrowState.projectileInLaunchPosition;
            _this.settings.updatePage();
        });
        document.getElementById("launch-button").addEventListener("click", function () {
            if (_this.state === ProjectileThrowState.projectileMoving) {
                newWorker();
            }
            if (_this.state === ProjectileThrowState.choosingVelocity)
                ProjectileThrowStateManager.exitChoosingVelocityMode();
            ProjectileThrowSimulation.state = ProjectileThrowState.projectileInLaunchPosition;
            _this.settings = _this.settings.getFromPage();
            _this.settings.updatePage();
            smoothScroll(0, 0, function () {
                elapsedSimulationTime = 0;
                lastRendererTick = Date.now();
                _this.workerStopped = false;
                theoreticalResults = ProjectileThrowResults.calculateTheoreticalResults(_this.projectile, _this.settings);
                bufferCount = 0;
                _this.parallelWorker.start({
                    projectile: ProjectileThrowSimulation.projectile,
                    bodyRadius: ProjectileThrowSimulation.settings.radius,
                    airResistance: ProjectileThrowSimulation.settings.airResistance,
                    heightReference: ProjectileThrowSimulation.settings.heightReference
                }, _this.settings.simulationQuality);
                _this.state = ProjectileThrowState.projectileMoving;
                ProjectileThrowSettings.disableSettingsElements();
            });
        });
    };
    var _a;
    _a = ProjectileThrowSimulation;
    ProjectileThrowSimulation.state = ProjectileThrowState.projectileInLaunchPosition;
    ProjectileThrowSimulation.workerStopped = false;
    ProjectileThrowSimulation.trajectory = new ProjectileThrowTrajectory();
    ProjectileThrowSimulation.projectile = new Body(1, BODY_GEOMETRY, new Vec2(0, 0));
    ProjectileThrowSimulation.settings = new ProjectileThrowSettings();
    ProjectileThrowSimulation.velocityBeforeChoosing = new Vec2();
    ProjectileThrowSimulation.camera = new Camera(new Vec2(), new Vec2(32, 32));
    ProjectileThrowSimulation.axes = new AxisSystem(_a.camera, true, true, false, true, true, true, true, false, false, false, true, true, 64, 64, new Vec2(), "x", "y", "white", 2, "1rem sans-serif", "#555555", 1, "black");
    return ProjectileThrowSimulation;
}());
window.addEventListener("load", function () {
    ProjectileThrowSimulation.startSimulation();
});
