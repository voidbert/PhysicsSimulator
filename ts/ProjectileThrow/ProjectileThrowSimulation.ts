const BODY_APOTHEM = 0.5;
const BODY_MASS = 1;
const BODY_GEOMETRY = [
	new Vec2(-BODY_APOTHEM, -BODY_APOTHEM), new Vec2(BODY_APOTHEM, -BODY_APOTHEM),
	new Vec2(BODY_APOTHEM, BODY_APOTHEM), new Vec2(-BODY_APOTHEM, BODY_APOTHEM)
];

enum ApplicationState {
	//Choosing the velocity with the interactive mode (mouse moves vector)
	choosingVelocity,
	//NOTE - The body can also be in the initial position if the state is choosingVelocity
	projectileInLaunchPosition,
	projectileMoving,
	//Projectile after hitting the ground (simulation results off)
	projectileStopped,
	//After the body reaches the ground and the simulation results popup is on
	showingSimulationResults
} 

//Checks if the display's orientation is portrait
function isPortrait(): boolean {
	return window.matchMedia("(orientation: portrait)").matches;
}

//Check if the size of drawing surface has changed and an update it if needed. Don't use
//window.onresize, since that doesn't account for the change in size of the sidebar, crucial in
//landscape displays. True is returned if the size of the rendering surface changed.
let lastRenderingSurfaceSize: Vec2 = new Vec2();
function updateRenderingSurfaceSize(camera: Camera, axes: AxisSystem): boolean {
	let renderingSurfaceSize: Vec2 = new Vec2();
	if (isPortrait()) {
		//Canvas takes 1 viewport
		renderingSurfaceSize = new Vec2(window.innerWidth, window.innerHeight)
			.scale(window.devicePixelRatio);
	} else {
		//Size of surface -> all - sidebar
		renderingSurfaceSize = new Vec2(
			(window.innerWidth - document.getElementById("simulation-interaction-div").clientWidth),
			window.innerHeight
		).scale(window.devicePixelRatio);
	}

	//Last size comparison
	if (renderingSurfaceSize !== lastRenderingSurfaceSize) {
		camera.canvasSize = renderingSurfaceSize;
		lastRenderingSurfaceSize = renderingSurfaceSize;
		return true;
	}
	
	return false;
}

let parallel; //TODO - remove - this is for DEBUG only

class ProjectileThrowSimulation {
	static state: ApplicationState = ApplicationState.projectileInLaunchPosition;

	//Physics
	static stepper: TimeStepper; //Simulation time control
	static trajectory: ProjectileThrowTrajectory = new ProjectileThrowTrajectory();
	static projectile: Body = new Body(BODY_MASS, BODY_GEOMETRY, new Vec2(0, 0));

	//Simulation settings
	static settings = new ProjectileThrowSettings();

	//Keep track of the velocity before the user starting choosing another velocity in case they
	//want to cancel their action.
	static velocityBeforeChoosing: Vec2 = new Vec2();

	//The scale of #simulation-results, that is adjust so that the element fits the screen
	private static simulationResultsScale = 1; 

	//Camera and display
	static camera: Camera = new Camera(new Vec2(), 32 * window.devicePixelRatio);
	static axes: AxisSystem = new AxisSystem(this.camera,
		true, true, "white",  2 * window.devicePixelRatio,
		true, "#dddddd", 1 * window.devicePixelRatio, true, true,
		(16 * window.devicePixelRatio).toString() + "px sans-serif", "black", false
	);
	static renderer: Renderer;

	static enterChoosingVelocityMode() {
		//Make sure the body is in its start position
		this.settings.updatePage();
		//Store the previous velocity in case the user cancels the action 
		this.velocityBeforeChoosing = this.settings.launchVelocity;

		//Show "move the mouse" instructions (different depending if the device supports touch or
		//not)
		if (ProjectileThrowEvents.isTouchScreenAvailable) {
			document.getElementById("choose-velocity-instructions-touch").classList.remove("hidden");
		} else {
			document.getElementById("choose-velocity-instructions-mouse").classList.remove("hidden");
		}

		document.body.classList.add("no-scrolling");
		//Prevent scrolling on touch devices (trying to choose the velocity would move the page)
		ProjectileThrowEvents.smoothScroll(0, 0, () => {
			//Enter choosing velocity mode (renderer checks for this mode to draw the vector. Input
			//handlers do it too to check for the escape key)
			this.state = ApplicationState.choosingVelocity;
		});
	}
	
	static exitChoosingVelocityMode() {
		this.state = ApplicationState.projectileInLaunchPosition; //Exit mode

		//Hide the velocity choosing instructions
		if (ProjectileThrowEvents.isTouchScreenAvailable) {
			document.getElementById("choose-velocity-instructions-touch").classList.add("hidden");
		} else {
			document.getElementById("choose-velocity-instructions-mouse").classList.add("hidden");
		}

		//Update page settings
		this.settings = this.settings.getFromPage();
		this.settings.updatePage();

		//Re-allow scrolling if disabled
		document.body.classList.remove("no-scrolling");
	}

	//Scales the #simulation-results element to fit in the page
	static scaleSimulationResults() {
		//Scale the element. Get its size and make it the maximum possible.
		let style = window.getComputedStyle(document.getElementById("simulation-results"));
		let elementWidth = (parseFloat(style.width) + 2 * parseFloat(style.paddingLeft))
			* window.devicePixelRatio / this.simulationResultsScale;
		let maxWidth = (this.camera.canvasSize.x - 20 * window.devicePixelRatio);
		let scale: number = maxWidth / (elementWidth * this.simulationResultsScale);
		scale = Math.min(scale, 1); //Limit the scale from 0 to 1
		document.documentElement.style.setProperty("--simulation-results-scale", scale.toString());
		this.simulationResultsScale = scale;
	}

	static showSimulationResults() {
		this.scaleSimulationResults();

		//Blur the background and show the popup with the results
		this.renderer.canvas.classList.add("blur");
		document.getElementById("simulation-interaction-div").classList.add("blur");
		document.body.classList.add("no-interaction");

		document.getElementById("simulation-results").classList.remove("hidden");

		this.state = ApplicationState.showingSimulationResults;
	}

	static hideSimulationResults() {
		//Un-blur the background and hide the window
		this.renderer.canvas.classList.remove("blur");
		document.getElementById("simulation-interaction-div").classList.remove("blur");
		document.body.classList.remove("no-interaction");

		document.getElementById("simulation-results").classList.add("hidden");

		this.state = ApplicationState.projectileStopped;
	}

	static startSimulation() {
		this.projectile.forces = [ new Vec2(0, -9.8 * BODY_MASS) ]; //Projectile gravity

		ProjectileThrowSettings.addEvents();
		ProjectileThrowEvents.addEvents();

		//Set the surface size and use the correct settings when the simulation starts.
		updateRenderingSurfaceSize(this.camera, this.axes);
		this.settings = this.settings.getFromPage();
		this.settings.updatePage();

		//Start the render loop
		this.renderer = new Renderer(window,
			document.getElementById("canvas") as HTMLCanvasElement, () => {

			if (updateRenderingSurfaceSize(this.camera, this.axes)) {
				this.scaleSimulationResults();
			}

			//Center the body on the camera (move the camera so that the body is on the center of
			//the screen)
			this.camera.r =
				this.projectile.r.subtract(this.camera.canvasSize.scale(0.5 / this.camera.scale));

			//TODO - remove updateCaches - the axis system will be rewritten with no caches
			this.axes.updateCaches();
			this.axes.drawAxes(this.renderer);

			this.renderer.renderPolygon(
				this.camera.polygonToScreenPosition(this.projectile.transformGeometry()), "red");

			//Draw the velocity vector if the user is choosing it interactively
			if (this.state === ApplicationState.choosingVelocity) {
				this.renderer.renderLines([
					this.camera.pointToScreenPosition(this.projectile.transformVertex(new Vec2())),
					ProjectileThrowEvents.mousePosition
				], "#00ff00", 2 * window.devicePixelRatio);
			}

			//Draw the trajectory if turned on
			if (this.settings.showTrajectory && this.trajectory) {
				this.renderer.renderLinesStrip(
					this.camera.polygonToScreenPosition(this.trajectory.points), "white",
					2 * window.devicePixelRatio
				);
			}
		});
		this.renderer.renderLoop();

		//Enter velocity choosing mode when the user clicks on the button
		document.getElementById("choose-screen-velocity").addEventListener("click", () => {
			//Only select a velocity if the body isn't moving
			if (this.state === ApplicationState.projectileInLaunchPosition || 
				this.state === ApplicationState.projectileStopped) {
				this.enterChoosingVelocityMode();
			}
		});

		//When the user clicks the ok button on the simulation results, hide that menu.
		document.getElementById("simulation-results-ok").addEventListener("click", () => {
			this.hideSimulationResults();
		});

		//Reset the position and velocity of the body when asked to
		document.getElementById("reset-button").addEventListener("click", () => {
			if (this.stepper)
				this.stepper.stopPause();

			//Handle the edge case where the user is choosing a velocity and clicks this button
			if (this.state === ApplicationState.choosingVelocity)
				this.exitChoosingVelocityMode();

			//Update the settings on the page
			this.state = ApplicationState.projectileInLaunchPosition;
			this.settings.updatePage();
		});

		//Start the physics simulation when the launch button is pressed
		document.getElementById("launch-button").addEventListener("click", () => {
			//Reset the body's position and velocity
			if (this.state === ApplicationState.projectileMoving)
				this.stepper.stopPause();

			//Handle the edge case where the user is choosing a velocity and clicks this button
			if (this.state === ApplicationState.choosingVelocity)
				this.exitChoosingVelocityMode();

			//Make sure the body is launched from the right position with the right velocity
			ProjectileThrowSimulation.state = ApplicationState.projectileInLaunchPosition;
			this.settings = this.settings.getFromPage();
			this.settings.updatePage();

			//Before staring the simulation, position the page so that the canvas is visible
			//(useful for portrait displays)
			ProjectileThrowEvents.smoothScroll(0, 0, () => {
				//Start the simulation
				let bufferCount = 0;
				parallel = new WorkerWrapper( //TODO - change
					"../../js/ProjectileThrow/ProjectileThrowWorker.js",
					{
						projectile: ProjectileThrowSimulation.projectile,
						simulationQuality: ProjectileThrowSimulation.settings.simulationQuality,
						heightReference: ProjectileThrowSimulation.settings.heightReference
					},
					16, /*two numbers (8 bytes each) per Vec2, position of the body*/
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

							//Calculate the theoretical outcome based on initial conditions
							let theoreticalResults: ProjectileThrowResults =
							ProjectileThrowResults.calculateTheoreticalResults(this.projectile,
								this.settings);

							ProjectileThrowResults.applyToPage(theoreticalResults, results);
							if (this.settings.showSimulationResults) {
								this.showSimulationResults();
							}
			
							console.log(results);
							w.terminate();
						} else {
							//This is a new buffer
							parallel.addBuffer(new NumberedBuffer(bufferCount, data));
							console.log("New buffer");
							bufferCount++;
						}
					},
					512
				);
			});
		});
	}
}

window.addEventListener("load", () => {
	ProjectileThrowSimulation.startSimulation();
});