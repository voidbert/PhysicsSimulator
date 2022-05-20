class RestitutionGraph {
    constructor() {
        this.camera = new Camera(new Vec2(-2, -1), new Vec2(32, 32));
        this.axes = new AxisSystem(this.camera, true, true, true, true, true, true, true, false, false, false, true, true, 64, 64, new Vec2(), "t", "y (m)", "black", 2, "0.9rem sans-serif", "#555555", 1, "white");
        this.elapsedSimulationTime = 0;
        this.elapsedSimulationTime = 0;
        let lastRendererTick = Date.now();
        this.renderer = new Renderer(window, document.getElementById("graph"), () => {
            if (RestitutionSimulation.state === RestitutionState.BeforeStart) {
                this.elapsedSimulationTime = 0;
                lastRendererTick = Date.now();
                this.maxY = 0;
                this.camera.scale = new Vec2(32, 32);
                this.camera.forcePosition(new Vec2(0, 0), new Vec2(96, this.renderer.canvas.height - 32));
                this.axes.drawAxes(this.renderer);
                return;
            }
            this.scaleCamera(this.elapsedSimulationTime * 0.001, this.maxY + 1);
            this.axes.drawAxes(this.renderer);
            let lackOfData = false;
            let frame = RestitutionSimulation.parallelWorker.getFrame(0);
            if (frame === null) {
                lackOfData = true;
            }
            if (!lackOfData) {
                let lastPoint = this.camera.pointToScreenPosition(new Vec2(0, new Float64Array(frame)[0]));
                this.renderer.ctx.strokeStyle = "#00ff00";
                this.renderer.ctx.lineWidth = 2;
                this.renderer.ctx.beginPath();
                this.renderer.ctx.moveTo(lastPoint.x, lastPoint.y);
                let maxi = this.elapsedSimulationTime /
                    RestitutionSimulation.settings.simulationQuality;
                for (let i = 1; i < maxi; i++) {
                    frame = RestitutionSimulation.parallelWorker.getFrame(i);
                    if (frame === null) {
                        lackOfData = true;
                        break;
                    }
                    let y = new Float64Array(frame)[0];
                    let point = this.camera.pointToScreenPosition(new Vec2(i * RestitutionSimulation.settings.simulationQuality * 0.001, y));
                    if (y > this.maxY) {
                        this.maxY = y;
                    }
                    this.renderer.ctx.lineTo(point.x, point.y);
                    lastPoint = point;
                }
                this.renderer.ctx.stroke();
            }
            if (lackOfData) {
                if (RestitutionSimulation.workerStopped &&
                    RestitutionSimulation.state === RestitutionState.OnAir) {
                    RestitutionSimulation.state = RestitutionState.Ended;
                    RestitutionSettings.enableSettingsElements();
                }
                lastRendererTick = Date.now();
            }
            else {
                this.elapsedSimulationTime += Date.now() - lastRendererTick;
                lastRendererTick = Date.now();
            }
        }, () => {
            let rect = this.renderer.canvas.getBoundingClientRect();
            this.renderer.canvas.width = rect.width * window.devicePixelRatio;
            this.renderer.canvas.height = rect.height * window.devicePixelRatio;
            this.camera.canvasSize = new Vec2(this.renderer.canvas.width, this.renderer.canvas.height);
            if (RestitutionSimulation.state === RestitutionState.BeforeStart) {
                this.maxY = this.camera.pointToWorldPosition(new Vec2(0, 0)).y;
            }
        });
        this.renderer.renderLoop();
    }
    scaleCamera(maxX, maxY) {
        this.camera.fitMaxX(maxX);
        this.camera.scale.x = Math.min(this.camera.scale.x, 32);
        this.camera.fitMaxY(maxY);
        this.camera.scale.y = Math.min(this.camera.scale.y, 32);
        this.camera.forcePosition(new Vec2(0, 0), new Vec2(96, this.renderer.canvas.height - 32));
    }
}
