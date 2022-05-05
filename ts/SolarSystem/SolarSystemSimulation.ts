const PLANET_GEOMETRY = ExtraMath.generatePolygon(50, 1);

class SolarSystemSimulation {
	static state: SolarSystemState = SolarSystemState.ChoosingSimulationQuality;
	static bodyManager: SolarSystemBodyManager;
	static timeManager: SolarSystemTimeManager;

	static settings: SolarSystemSettings = new SolarSystemSettings();

	static renderer: Renderer;
	static camera: Camera = new Camera(new Vec2(), new Vec2(3e-9, 3e-9));

	//Creates the body manager and the planets
	private static generateSolarSystem() {
		let bodies: Body[] = [
			new Body(1.988e30, PLANET_GEOMETRY, new Vec2(0, 0)), //Sun
			new Body(3.301e23, PLANET_GEOMETRY, new Vec2(0, 5.791e10)), //Mercury
			new Body(4.868e24, PLANET_GEOMETRY, new Vec2(0, 1.082e11)), //Venus
			new Body(5.972e24, PLANET_GEOMETRY, new Vec2(0, 1.495e11)), //Earth
			new Body(6.417e23, PLANET_GEOMETRY, new Vec2(0, 2.279e11)), //Mars
			new Body(1.898e27, PLANET_GEOMETRY, new Vec2(0, 7.785e11)), //Jupiter
			new Body(5.683e26, PLANET_GEOMETRY, new Vec2(0, 1.434e12)), //Saturn
			new Body(8.681e25, PLANET_GEOMETRY, new Vec2(0, 2.871e12)), //Uranus
			new Body(1.024e26, PLANET_GEOMETRY, new Vec2(0, 4.500e12)) //Neptune
		];

		bodies[1].v = new Vec2(-49700, 0); //Mercury
		bodies[2].v = new Vec2(-35000, 0); //Venus
		bodies[3].v = new Vec2(-29800, 0); //Earth
		bodies[4].v = new Vec2(-24100, 0); //Mars
		bodies[5].v = new Vec2(-13100, 0); //Jupiter
		bodies[6].v = new Vec2(-9700, 0); //Saturn
		bodies[7].v = new Vec2(-6800, 0); //Uranus
		bodies[8].v = new Vec2(-5400, 0); //Neptune

		let characteristics: SolarSystemPlanetCharacteristics[] = [
			new SolarSystemPlanetCharacteristics(6.957e8, "#f59f00"), //Sun
			new SolarSystemPlanetCharacteristics(2439700, "#adb5bd"), //Mercury
			new SolarSystemPlanetCharacteristics(6051800, "#ffc078"), //Venus
			new SolarSystemPlanetCharacteristics(6371000, "#1864ab"), //Earth
			new SolarSystemPlanetCharacteristics(3396200, "#d9480f"), //Mars
			new SolarSystemPlanetCharacteristics(71492000, "#e67700"), //Jupiter
			new SolarSystemPlanetCharacteristics(60268000, "#ffc078"), //Saturn
			new SolarSystemPlanetCharacteristics(24973000, "#74c0fc"), //Uranus
			new SolarSystemPlanetCharacteristics(24764000, "#1864ab"), //Neptune
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

		this.renderer = new Renderer(window, document.getElementById("canvas") as HTMLCanvasElement,
		() => {
			this.bodyManager.updatePositions(this.timeManager.getTime(),
				this.settings.simulationQuality);
			this.bodyManager.renderBodies(this.renderer, this.camera, this.timeManager.getTime());

			if (this.timeManager.isPaused &&
				this.timeManager.pauseReason == SolarSystemPauseReason.UserAction) {

				//Red screen when simulation is paused
				this.renderer.ctx.strokeStyle = "#f00";
				this.renderer.ctx.lineWidth = 5;
				this.renderer.ctx.strokeRect(0, 0,
					this.renderer.canvas.width, this.renderer.canvas.height);
			}
		}, () => {
			this.renderer.canvas.width  = window.innerWidth  * window.devicePixelRatio;
			this.renderer.canvas.height = window.innerHeight * window.devicePixelRatio;

			this.camera.canvasSize =
				new Vec2(this.renderer.canvas.width, this.renderer.canvas.height);

			//Stop showing settings (in the middle of the screen) if the user changes from portrait
			//to landscape.
			if (!isPortrait() && this.state === SolarSystemState.ShowingSettings) {
				SolarSystemStateManager.leaveShowingSettingsMode();
			}
		});
		this.renderer.renderLoop();

		//Center the Sun on the screen
		this.camera.forcePosition(new Vec2(0, 0), this.camera.canvasSize.scale(0.5));
	}
}

window.addEventListener("load", () => {
	//Hide the noscript tag (empty) to remove margins
	document.getElementById("noscript-container").style.display = "none";

	SolarSystemSimulation.startPage();
});