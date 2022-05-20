var _a;
const BODY_GEOMETRY = ExtraMath.generatePolygon(20, 0.5);
class ProjectileThrowSimulation {
    static parseFrame(frame) {
        let view = new Float64Array(frame);
        return new Vec2(view[0], view[1]);
    }
    static startSimulation() {
        this.projectile.forces = [new Vec2(0, -GRAVITY * 1)];
        ProjectileThrowSettings.addEvents();
        ProjectileThrowEvents.addEvents();
        let theoreticalResults = null;
        let bufferCount = 0;
        let newWorker = () => {
            if (!this.workerStopped) {
                if (this.parallelWorker) {
                    this.parallelWorker.terminate();
                }
                this.parallelWorker = new WorkerWrapper("../../js/ProjectileThrow/ProjectileThrowWorker.js", this.settings.simulationQuality, (w, data) => {
                    let keys = Object.keys(data);
                    if (keys.indexOf("time") !== -1 && keys.indexOf("distance") !== -1 &&
                        keys.indexOf("maxHeight") !== -1) {
                        let results = new ProjectileThrowResults();
                        results.time = data.time;
                        results.distance = data.distance;
                        results.maxHeight = data.maxHeight;
                        ProjectileThrowResults.applyToPage(theoreticalResults, results);
                        this.workerStopped = true;
                    }
                    else {
                        this.parallelWorker.addBuffer(new NumberedBuffer(bufferCount, data.size, data.buf, 16));
                        bufferCount++;
                    }
                }, 512, 16);
            }
        };
        newWorker();
        this.settings = this.settings.getFromPage();
        this.settings.updatePage();
        let elapsedSimulationTime = 0;
        let lastRendererTick = Date.now();
        this.renderer = new Renderer(window, document.getElementById("canvas"), () => {
            let bodyFrame = [];
            if (this.state === ProjectileThrowState.projectileMoving)
                bodyFrame = this.parallelWorker.getBoundaryBuffers(elapsedSimulationTime, true);
            if (bodyFrame.length === 0) {
                if (this.workerStopped && this.state === ProjectileThrowState.projectileMoving) {
                    this.state = ProjectileThrowState.projectileStopped;
                    ProjectileThrowSettings.enableSettingsElements();
                    this.projectile.r = this.parseFrame(this.parallelWorker.getLastFrame());
                    if (this.settings.showSimulationResults) {
                        ProjectileThrowStateManager.showSimulationResults();
                    }
                }
                lastRendererTick = Date.now();
            }
            else {
                this.projectile.r = ExtraMath.linearInterpolationVec2(this.parseFrame(bodyFrame[0]), this.parseFrame(bodyFrame[1]), this.settings.simulationQuality, elapsedSimulationTime % this.settings.simulationQuality);
                elapsedSimulationTime += Date.now() - lastRendererTick;
                lastRendererTick = Date.now();
            }
            this.camera.forcePosition(this.projectile.r, this.camera.canvasSize.scale(0.5));
            this.axes.drawAxes(this.renderer);
            this.renderer.renderPolygon(this.camera.polygonToScreenPosition(this.projectile.transformGeometry()), "red");
            if (this.state === ProjectileThrowState.choosingVelocity) {
                this.renderer.renderLines([
                    this.camera.pointToScreenPosition(this.projectile.transformVertex(new Vec2())),
                    ProjectileThrowEvents.mousePosition
                ], "#00ff00", 2);
            }
            if (this.settings.showTrajectory && this.trajectory) {
                this.renderer.renderLinesStrip(this.camera.polygonToScreenPosition(this.trajectory.points), "white", 2);
            }
        }, () => {
            this.renderer.canvas.width = window.innerWidth * window.devicePixelRatio;
            this.renderer.canvas.height = window.innerHeight * window.devicePixelRatio;
            let renderingSurfaceSize = new Vec2();
            if (isPortrait()) {
                renderingSurfaceSize = new Vec2(window.innerWidth, window.innerHeight)
                    .scale(window.devicePixelRatio);
            }
            else {
                renderingSurfaceSize = new Vec2(window.innerWidth -
                    document.getElementById("simulation-interaction-div").clientWidth, window.innerHeight).scale(window.devicePixelRatio);
            }
            this.camera.canvasSize = renderingSurfaceSize;
            ProjectileThrowStateManager.scaleSimulationResults();
        });
        this.renderer.renderLoop();
        document.getElementById("choose-screen-velocity").addEventListener("click", () => {
            if (this.state === ProjectileThrowState.projectileInLaunchPosition ||
                this.state === ProjectileThrowState.projectileStopped) {
                ProjectileThrowStateManager.enterChoosingVelocityMode();
            }
        });
        document.getElementById("simulation-results-ok").addEventListener("click", () => {
            ProjectileThrowStateManager.hideSimulationResults();
        });
        document.getElementById("reset-button").addEventListener("click", () => {
            if (this.state === ProjectileThrowState.projectileMoving) {
                newWorker();
                ProjectileThrowSettings.enableSettingsElements();
            }
            if (this.state === ProjectileThrowState.choosingVelocity)
                ProjectileThrowStateManager.exitChoosingVelocityMode();
            this.state = ProjectileThrowState.projectileInLaunchPosition;
            this.settings.updatePage();
        });
        document.getElementById("launch-button").addEventListener("click", () => {
            if (this.state === ProjectileThrowState.projectileMoving) {
                newWorker();
            }
            if (this.state === ProjectileThrowState.choosingVelocity)
                ProjectileThrowStateManager.exitChoosingVelocityMode();
            ProjectileThrowSimulation.state = ProjectileThrowState.projectileInLaunchPosition;
            this.settings = this.settings.getFromPage();
            this.settings.updatePage();
            smoothScroll(0, 0, () => {
                elapsedSimulationTime = 0;
                lastRendererTick = Date.now();
                this.workerStopped = false;
                theoreticalResults = ProjectileThrowResults.calculateTheoreticalResults(this.projectile, this.settings);
                bufferCount = 0;
                this.parallelWorker.start({
                    projectile: ProjectileThrowSimulation.projectile,
                    bodyRadius: ProjectileThrowSimulation.settings.radius,
                    airResistance: ProjectileThrowSimulation.settings.airResistance,
                    heightReference: ProjectileThrowSimulation.settings.heightReference
                }, this.settings.simulationQuality);
                this.state = ProjectileThrowState.projectileMoving;
                ProjectileThrowSettings.disableSettingsElements();
            });
        });
    }
}
_a = ProjectileThrowSimulation;
ProjectileThrowSimulation.state = ProjectileThrowState.projectileInLaunchPosition;
ProjectileThrowSimulation.workerStopped = false;
ProjectileThrowSimulation.trajectory = new ProjectileThrowTrajectory();
ProjectileThrowSimulation.projectile = new Body(1, BODY_GEOMETRY, new Vec2(0, 0));
ProjectileThrowSimulation.settings = new ProjectileThrowSettings();
ProjectileThrowSimulation.velocityBeforeChoosing = new Vec2();
ProjectileThrowSimulation.camera = new Camera(new Vec2(), new Vec2(32, 32));
ProjectileThrowSimulation.axes = new AxisSystem(_a.camera, true, true, false, true, true, true, true, false, false, false, true, true, 64, 64, new Vec2(), "x", "y", "white", 2, "1rem sans-serif", "#555555", 1, "black");
window.addEventListener("load", () => {
    ProjectileThrowSimulation.startSimulation();
});
