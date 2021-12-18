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

//Check if the size of drawing surface (size of the window minus the size of the sidebar) has
//changed and update it if needed. Don't use window.onresize, since that doesn't account for the
//change in size of the sidebar (window.onresize doesn't wait for the elements' size to be
//calculated).
let lastRenderingSurfaceSize: Vec2 = new Vec2();
function updateRenderingSurfaceSize(camera: Camera, axes: AxisSystem) {
	//Size of surface -> all - sidebar
	let renderingSurfaceSize = new Vec2(
		(window.innerWidth - document.getElementById("simulation-interaction-div").clientWidth)
			* window.devicePixelRatio,
		window.innerHeight * window.devicePixelRatio
	);

	//Last size comparison
	if (renderingSurfaceSize !== lastRenderingSurfaceSize) {
		camera.canvasSize = renderingSurfaceSize;
	}
	lastRenderingSurfaceSize = renderingSurfaceSize;
}

class ProjectileThrowSimulation {
	static state: ApplicationState = ApplicationState.projectileInLaunchPosition;

	//Physics
	static stepper: TimeStepper; //Simulation time control
	static trajectory: ProjectileTrajectory = new ProjectileTrajectory();
	static projectile: Body = new Body(BODY_MASS, BODY_GEOMETRY, new Vec2(0, 0));

	//Simulation settings
	static settings = new ProjectileThrowSettings();

	//Keep track of the velocity before the user starting choosing another velocity in case they
	//want to cancel their action.
	static velocityBeforeChoosing: Vec2 = new Vec2();

	//Camera and display
	static camera: Camera = new Camera(new Vec2(), 32);
	static axes: AxisSystem = new AxisSystem(this.camera,
		true, true, "white",  2,
		true, "#dddddd", 1, true, true, "16px sans-serif",
		"black",
		false
	);
	static renderer: Renderer;

	static enterChoosingVelocityMode() {
		//Make sure the body is in its start position
		this.settings.updatePage();
		//Store the previous velocity in case the user cancels the action 
		this.velocityBeforeChoosing = this.settings.launchVelocity;
		//Enter choosing velocity mode (renderer checks for this mode to draw the vector. input
		//handlers do it too to check for the escape key)
		this.state = ApplicationState.choosingVelocity;
		//Show "move the mouse" instructions
		document.getElementById("choose-velocity-instructions").classList.remove("hidden");
	}
	
	static exitChoosingVelocityMode() {
		this.state = ApplicationState.projectileInLaunchPosition; //Exit mode
		//Hide the velocity choosing instructions
		document.getElementById("choose-velocity-instructions").classList.add("hidden");
		//Update page settings
		this.settings = this.settings.getFromPage();
		this.settings.updatePage();
	}

	static showSimulationResults() {
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

			updateRenderingSurfaceSize(this.camera, this.axes);

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
				], "#00ff00", 2);
			}

			//Draw the trajectory if turned on
			if (this.settings.showTrajectory && this.trajectory) {
				this.renderer.renderLines(
					this.camera.polygonToScreenPosition(this.trajectory.points), "white", 2);
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

		//If the user clicks on top of the canvas while choosing the body's velocity, stop choosing
		//the velocity (setting its value to the chosen one)
		document.getElementById("no-script-div").addEventListener("click", () => {
			if (this.state === ApplicationState.choosingVelocity) {
				this.exitChoosingVelocityMode();
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

			//Calculate the theoretical outcome based on initial conditions
			let theoreticalResults: ProjectileThrowResults =
				ProjectileThrowResults.calculateTheoreticalResults();

			//Start measuring what will be compared to theoretical expectations
			let measurer: ProjectileThrowExperienceMeasurer =
				new ProjectileThrowExperienceMeasurer();

			//Start the simulation
			this.stepper = new TimeStepper((dt: number) => {
				this.projectile.step(dt);
				measurer.step();

				if (ProjectileTrajectory.bodyReachedGround(this.projectile, this.settings)) {
					this.stepper.stopPause();
					this.state = ApplicationState.projectileStopped;

					let experimentalResults: ProjectileThrowResults = measurer.stop();
					ProjectileThrowResults.applyToPage(theoreticalResults, experimentalResults);

					//Show the menu, blur the background and stop the user from clicking on places
					if (this.settings.showSimulationResults)
						this.showSimulationResults();
				}
			}, this.settings.simulationQuality);

			this.state = ApplicationState.projectileMoving;
		});
	}
}

window.addEventListener("load", () => {
	ProjectileThrowSimulation.startSimulation();
});