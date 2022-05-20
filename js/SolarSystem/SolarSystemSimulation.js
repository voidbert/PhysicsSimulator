const PLANET_GEOMETRY = ExtraMath.generatePolygon(50, 1);
class SolarSystemSimulation {
    static generateSolarSystem() {
        let bodies = [
            new Body(1.988e30, PLANET_GEOMETRY, new Vec2(0, 0)),
            new Body(3.30e23, PLANET_GEOMETRY, new Vec2(0, 5.790e10)),
            new Body(4.87e24, PLANET_GEOMETRY, new Vec2(0, 1.082e11)),
            new Body(5.97e24, PLANET_GEOMETRY, new Vec2(0, 1.496e11)),
            new Body(6.42e23, PLANET_GEOMETRY, new Vec2(0, 2.280e11)),
            new Body(1.898e27, PLANET_GEOMETRY, new Vec2(0, 7.785e11)),
            new Body(5.68e26, PLANET_GEOMETRY, new Vec2(0, 1.432e12)),
            new Body(8.68e25, PLANET_GEOMETRY, new Vec2(0, 2.867e12)),
            new Body(1.02e26, PLANET_GEOMETRY, new Vec2(0, 4.515e12))
        ];
        bodies[1].v = new Vec2(-47400, 0);
        bodies[2].v = new Vec2(-35000, 0);
        bodies[3].v = new Vec2(-29800, 0);
        bodies[4].v = new Vec2(-24100, 0);
        bodies[5].v = new Vec2(-13100, 0);
        bodies[6].v = new Vec2(-9700, 0);
        bodies[7].v = new Vec2(-6800, 0);
        bodies[8].v = new Vec2(-5400, 0);
        let characteristics = [
            new SolarSystemPlanetCharacteristics(6.957e8, "#f59f00"),
            new SolarSystemPlanetCharacteristics(2439500, "#adb5bd"),
            new SolarSystemPlanetCharacteristics(6052000, "#ffc078"),
            new SolarSystemPlanetCharacteristics(6378000, "#1864ab"),
            new SolarSystemPlanetCharacteristics(3396000, "#d9480f"),
            new SolarSystemPlanetCharacteristics(71492000, "#e67700"),
            new SolarSystemPlanetCharacteristics(60268000, "#ffc078"),
            new SolarSystemPlanetCharacteristics(25559000, "#74c0fc"),
            new SolarSystemPlanetCharacteristics(24764000, "#1864ab"),
        ];
        this.bodyManager = new SolarSystemBodyManager(bodies, characteristics);
    }
    static startPage() {
        SolarSystemSettings.addEvents();
        SolarSystemEvents.addEvents();
    }
    static startSimulation() {
        this.generateSolarSystem();
        this.timeManager = new SolarSystemTimeManager();
        this.timeManager.start();
        this.renderer = new Renderer(window, document.getElementById("canvas"), () => {
            this.bodyManager.updatePositions(this.timeManager.getTime(), this.settings.simulationQuality);
            this.bodyManager.renderBodies(this.renderer, this.camera, this.timeManager.getTime());
            if (this.timeManager.isPaused &&
                this.timeManager.pauseReason == SolarSystemPauseReason.UserAction) {
                this.renderer.ctx.strokeStyle = "#f00";
                this.renderer.ctx.lineWidth = 5;
                this.renderer.ctx.strokeRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);
            }
        }, () => {
            this.renderer.canvas.width = window.innerWidth * window.devicePixelRatio;
            this.renderer.canvas.height = window.innerHeight * window.devicePixelRatio;
            this.camera.canvasSize =
                new Vec2(this.renderer.canvas.width, this.renderer.canvas.height);
            if (!isPortrait() && this.state === SolarSystemState.ShowingSettings) {
                SolarSystemStateManager.leaveShowingSettingsMode();
            }
        });
        this.renderer.renderLoop();
        this.camera.forcePosition(new Vec2(0, 0), this.camera.canvasSize.scale(0.5));
    }
}
SolarSystemSimulation.state = SolarSystemState.ChoosingSimulationQuality;
SolarSystemSimulation.settings = new SolarSystemSettings();
SolarSystemSimulation.camera = new Camera(new Vec2(), new Vec2(3e-9, 3e-9));
window.addEventListener("load", () => {
    document.getElementById("noscript-container").style.display = "none";
    SolarSystemSimulation.startPage();
});
