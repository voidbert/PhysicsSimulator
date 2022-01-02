const BODY_APOTHEM = 0.5;
const BODY_MASS = 1;
const BODY_GEOMETRY = [
	new Vec2(-BODY_APOTHEM, -BODY_APOTHEM), new Vec2(BODY_APOTHEM, -BODY_APOTHEM),
	new Vec2(BODY_APOTHEM, BODY_APOTHEM), new Vec2(-BODY_APOTHEM, BODY_APOTHEM)
];

//Checks if the display's orientation is portrait
function isPortrait(): boolean {
	return window.matchMedia("(orientation: portrait)").matches;
}

class ProjectileThrowSimulation {
	static state: ApplicationState = ApplicationState.projectileInLaunchPosition;

	//Tools for running the physics simulation in a different thread.
	static parallelWorker: WorkerWrapper;
	static workerStopped: boolean = false;

	//Physics
	static trajectory: ProjectileThrowTrajectory = new ProjectileThrowTrajectory();
	static projectile: Body = new Body(BODY_MASS, BODY_GEOMETRY, new Vec2(0, 0));

	//Simulation settings
	static settings = new ProjectileThrowSettings();

	//Keep track of the velocity before the user starting choosing another velocity in case they
	//want to cancel their action.
	static velocityBeforeChoosing: Vec2 = new Vec2();

	//The scale of #simulation-results, that is adjust so that the element fits the screen
	static simulationResultsScale = 1;

	//Camera and display
	static camera: Camera = new Camera(new Vec2(), 32);
	static axes: AxisSystem = new AxisSystem(
		this.camera,
		true, true, false, //Show axes, show arrows, only show positive axes
		true, true, //Show separation units (X and Y)
		true, true, //Show unit labels (X and Y)
		false, false, false, //Show grid (X and Y), only show positive grid areas
		true, true, //Auto scale (X and Y)
		64, 64, //Max grid size (X and Y)
		new Vec2(), //Non-auto scale
		"x", "y", //Axes' names
		"white", 2, "1rem sans-serif", //Axes' properties
		"#555555", 1, //Grid properties
		"black" //Page background color
		);
	static renderer: Renderer;

	//Parses a frame from the web worker (gets the position vector in it)
	static parseFrame(frame: ArrayBuffer): Vec2 {
		let view = new Float64Array(frame);
		return new Vec2(view[0], view[1]);
	}

	static startSimulation() {
		this.projectile.forces = [ new Vec2(0, -9.8 * BODY_MASS) ]; //Projectile gravity

		ProjectileThrowSettings.addEvents();
		ProjectileThrowEvents.addEvents();

		//Have the web worker ready for when the launch button is clicked
		let theoreticalResults: ProjectileThrowResults = null;
		let bufferCount = 0;

		//Creates a new worker. If the old one stopped, there's no need to recreate it. It can be
		//reused because it will no longer post messages about old simulations.
		let newWorker = () => {
			if (!this.workerStopped) {
				if (this.parallelWorker) {
					this.parallelWorker.terminate();
				}

				this.parallelWorker = new WorkerWrapper(
					"../../js/ProjectileThrow/ProjectileThrowWorker.js",
					16, /*two numbers (8 bytes each) per Vec2, position of the body*/
					this.settings.simulationQuality,
					(w: Worker, data: any) => {
						//Worker posted a message. If it is the simulation statistics, stop the
						//worker.
						let keys = Object.keys(data);
						if (keys.indexOf("time") !== -1 && keys.indexOf("distance") !== -1 &&
							keys.indexOf("maxHeight") !== -1 ) {
			
							let results = new ProjectileThrowResults();
							results.time = data.time;
							results.distance = data.distance;
							results.maxHeight = data.maxHeight;
		
							ProjectileThrowResults.applyToPage(theoreticalResults, results);
							this.workerStopped = true;
						} else {
							this.parallelWorker.addBuffer(
								new NumberedBuffer(bufferCount, data.size, data.buf));
							bufferCount++;
						}
					},
					512, 16
				);
			}
		}
		newWorker();

		//Set the correct settings when the simulation starts.
		this.settings = this.settings.getFromPage();
		this.settings.updatePage();

		//Start the render loop
		let elapsedSimulationTime: number = 0;
		let lastRendererTick: number = Date.now();

		this.renderer = new Renderer(window,
			document.getElementById("canvas") as HTMLCanvasElement, () => {

			//Get the position of the body
			let bodyFrame: ArrayBuffer[] = [];
			if (this.state === ApplicationState.projectileMoving)
				bodyFrame = this.parallelWorker.getBoundaryBuffers(elapsedSimulationTime, true);

			if (bodyFrame.length === 0) {
				//The simulation can be done or the worker hasn't reached this point

				if (this.workerStopped && this.state === ApplicationState.projectileMoving) {
					//Simulation done
					this.state = ApplicationState.projectileStopped;
					ProjectileThrowSettings.enableSettingsElements();

					//Make sure the body has the last position (due to frame timing, it may not be
					//there)
					this.projectile.r = this.parseFrame(this.parallelWorker.getLastFrame());

					if (this.settings.showSimulationResults) {
						showSimulationResults();
					}
				}

				//Worker doesn't have the data yet. Reset the clock.
				lastRendererTick = Date.now();
			} else {
				//The position of the body is known. Apply it.

				//Linear interpolation to know the body's position
				this.projectile.r = ExtraMath.linearInterpolationVec2(
					this.parseFrame(bodyFrame[0]), this.parseFrame(bodyFrame[1]),
					this.settings.simulationQuality,
					elapsedSimulationTime % this.settings.simulationQuality);

				//Simulation time has passed
				elapsedSimulationTime += Date.now() - lastRendererTick;
				lastRendererTick = Date.now();
			}

			//Center the body on the camera (move the camera so that the body is on the center of
			//the screen)
			this.camera.r =
				this.projectile.r.subtract(this.camera.canvasSize.scale(0.5 / this.camera.scale));

			this.axes.drawAxes(this.renderer);

			this.renderer.renderPolygon(
				this.camera.polygonToScreenPosition(this.projectile.transformGeometry()), "red");

			//Draw the velocity vector if the user is choosing it interactively
			if (this.state === ApplicationState.choosingVelocity) {
				this.renderer.renderLines([
					this.camera.pointToScreenPosition(this.projectile.transformVertex(new Vec2())),
					ProjectileThrowEvents.mousePosition
				], "#00ff00", 2);
			}

			//Draw the trajectory if turned on
			if (this.settings.showTrajectory && this.trajectory) {
				this.renderer.renderLinesStrip(
					this.camera.polygonToScreenPosition(this.trajectory.points), "white",
					2
				);
			}
		}, () => {
			this.renderer.canvas.width  = window.innerWidth  * window.devicePixelRatio;
			this.renderer.canvas.height = window.innerHeight * window.devicePixelRatio;

			//Calculate the size of the drawing surface (might not be all of the canvas)
			let renderingSurfaceSize: Vec2 = new Vec2();
			if (isPortrait()) {
				//Canvas takes 1 viewport
				renderingSurfaceSize = new Vec2(window.innerWidth, window.innerHeight)
					.scale(window.devicePixelRatio);
			} else {
				//Size of surface -> all - sidebar
				renderingSurfaceSize = new Vec2(window.innerWidth -
					document.getElementById("simulation-interaction-div").clientWidth,
					window.innerHeight
				).scale(window.devicePixelRatio);
			}

			this.camera.canvasSize = renderingSurfaceSize;
			scaleSimulationResults();
		});
		this.renderer.renderLoop();

		//Enter velocity choosing mode when the user clicks on the button
		document.getElementById("choose-screen-velocity").addEventListener("click", () => {
			//Only select a velocity if the body isn't moving
			if (this.state === ApplicationState.projectileInLaunchPosition || 
				this.state === ApplicationState.projectileStopped) {
				enterChoosingVelocityMode();
			}
		});

		//When the user clicks the ok button on the simulation results, hide that menu.
		document.getElementById("simulation-results-ok").addEventListener("click", () => {
			hideSimulationResults();
		});

		//Reset the position and velocity of the body when asked to
		document.getElementById("reset-button").addEventListener("click", () => {
			if (this.state === ApplicationState.projectileMoving) {
				newWorker();
				ProjectileThrowSettings.enableSettingsElements();
			}

			//Handle the edge case where the user is choosing a velocity and clicks this button
			if (this.state === ApplicationState.choosingVelocity)
				exitChoosingVelocityMode();

			//Update the settings on the page
			this.state = ApplicationState.projectileInLaunchPosition;
			this.settings.updatePage();
		});

		//Start the physics simulation when the launch button is pressed
		document.getElementById("launch-button").addEventListener("click", () => {
			//Reset the body's position and velocity
			if (this.state === ApplicationState.projectileMoving) {
				newWorker();
			}

			//Handle the edge case where the user is choosing a velocity and clicks this button
			if (this.state === ApplicationState.choosingVelocity)
				exitChoosingVelocityMode();

			//Make sure the body is launched from the right position with the right velocity
			ProjectileThrowSimulation.state = ApplicationState.projectileInLaunchPosition;
			this.settings = this.settings.getFromPage();
			this.settings.updatePage();

			//Before staring the simulation, position the page so that the canvas is visible
			//(useful for portrait displays)
			ProjectileThrowEvents.smoothScroll(0, 0, () => {
				elapsedSimulationTime = 0;
				lastRendererTick = Date.now();
				this.workerStopped = false;

				//Calculate the theoretical outcome based on initial conditions
				theoreticalResults = ProjectileThrowResults.calculateTheoreticalResults
					(this.projectile, this.settings);

				//Start the simulation
				bufferCount = 0; //Parameter to reset first
				this.parallelWorker.start({
					projectile: ProjectileThrowSimulation.projectile,
					heightReference: ProjectileThrowSimulation.settings.heightReference
				}, this.settings.simulationQuality);

				this.state = ApplicationState.projectileMoving;
				ProjectileThrowSettings.disableSettingsElements();
			});
		});
	}
}

window.addEventListener("load", () => {
	ProjectileThrowSimulation.startSimulation();
});