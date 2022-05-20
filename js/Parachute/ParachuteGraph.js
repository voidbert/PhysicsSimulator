const PARACHUTE_SIMULATION_SKIPPED_FACTOR = 10;
const FAST_FORWARD_FACTOR = 2;
class ParachuteGraph {
    constructor() {
        this.camera = new Camera(new Vec2(-2, -1), new Vec2(32, 32));
        this.axes = new AxisSystem(this.camera, true, true, true, true, true, true, true, false, false, false, true, true, 64, 64, new Vec2(), "t", "y (m)", "black", 2, "0.9rem sans-serif", "#555555", 1, "white");
        let elapsedSimulationTime = 0;
        let lastRendererTick = Date.now();
        this.renderer = new Renderer(window, document.getElementById("graph"), () => {
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
                this.maxY = 0;
                this.camera.scale = new Vec2(32, 32);
                this.camera.forcePosition(new Vec2(0, 0), new Vec2(96, this.renderer.canvas.height - 32));
                this.axes.drawAxes(this.renderer);
                return;
            }
            this.scaleCamera(elapsedSimulationTime * 0.001, this.maxY + 1);
            this.axes.drawAxes(this.renderer);
            let lackOfData = false;
            let frame = ParachuteSimulation.parallelWorker.getFrame(0);
            if (frame === null) {
                lackOfData = true;
            }
            if (!lackOfData) {
                let lastPoint = this.camera.pointToScreenPosition(new Vec2(0, new Float64Array(frame)[0]));
                this.renderer.ctx.strokeStyle = "#00ff00";
                this.renderer.ctx.lineWidth = 2;
                this.renderer.ctx.beginPath();
                this.renderer.ctx.moveTo(lastPoint.x, lastPoint.y);
                let maxi = elapsedSimulationTime / (ParachuteSimulation.settings.simulationQuality *
                    PARACHUTE_SIMULATION_SKIPPED_FACTOR);
                let reachedi = -1;
                for (let i = 1; i < maxi; i++) {
                    frame = ParachuteSimulation.parallelWorker.getFrame(i);
                    if (frame === null) {
                        lackOfData = true;
                        reachedi = i;
                        break;
                    }
                    let y = new Float64Array(frame)[0];
                    let point = this.camera.pointToScreenPosition(new Vec2(i * ParachuteSimulation.settings.simulationQuality *
                        PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001, y));
                    if (y > this.maxY) {
                        this.maxY = y;
                    }
                    this.renderer.ctx.lineTo(point.x, point.y);
                    lastPoint = point;
                }
                this.renderer.ctx.stroke();
                if (reachedi === -1) {
                    reachedi = maxi;
                }
                let lastTheoreticalPoint = this.camera.pointToScreenPosition(new Vec2(0, getTheoreticalPoint(0)));
                if (ParachuteSimulation.settings.seeTheoretical) {
                    this.renderer.ctx.beginPath();
                    this.renderer.ctx.strokeStyle = "#ff0000aa";
                    this.renderer.ctx.lineWidth = 2;
                    this.renderer.ctx.moveTo(lastTheoreticalPoint.x, lastTheoreticalPoint.y);
                    maxi = Math.min(reachedi, ParachuteSimulation.theoreticalResults.timeParachuteOpens /
                        (ParachuteSimulation.settings.simulationQuality * PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001));
                    for (let i = 1; i < maxi; i++) {
                        let time = i * ParachuteSimulation.settings.simulationQuality *
                            PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001;
                        let theoreticalPoint = this.camera.pointToScreenPosition(new Vec2(time, getTheoreticalPoint(time)));
                        this.renderer.ctx.lineTo(theoreticalPoint.x, theoreticalPoint.y);
                        lastTheoreticalPoint = theoreticalPoint;
                    }
                }
                this.renderer.ctx.stroke();
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
        }, () => {
            let rect = this.renderer.canvas.getBoundingClientRect();
            this.renderer.canvas.width = rect.width * window.devicePixelRatio;
            this.renderer.canvas.height = rect.height * window.devicePixelRatio;
            this.camera.canvasSize = new Vec2(this.renderer.canvas.width, this.renderer.canvas.height);
            if (ParachuteSimulation.state === ParachuteState.BeforeRelease) {
                this.maxY = this.camera.pointToWorldPosition(new Vec2(0, 0)).y;
            }
            ParachuteStateManager.scaleSimulationResults();
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
