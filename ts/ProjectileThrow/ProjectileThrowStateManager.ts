//This file contains functions that transition between states in the projectile throw simulation

enum ProjectileThrowState {
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

class ProjectileThrowStateManager {
	//The scale of #simulation-results, that is adjust so that the element fits the screen
	private static simulationResultsScale = 1;

	static enterChoosingVelocityMode() {
		//Make sure the body is in its start position
		ProjectileThrowSimulation.settings.updatePage();
		//Store the previous velocity in case the user cancels the action 
		ProjectileThrowSimulation.velocityBeforeChoosing =
			ProjectileThrowSimulation.settings.launchVelocity;
	
		//Show "move the mouse" instructions (different depending if the device supports touch or
		//not)
		if (isTouchScreenAvailable) {
			document.getElementById("choose-velocity-instructions-touch").
				classList.remove("hidden");
		} else {
			document.getElementById("choose-velocity-instructions-mouse").
				classList.remove("hidden");
		}
	
		document.body.classList.add("no-scrolling");
		//Prevent scrolling on touch devices (trying to choose the velocity would move the page)
		smoothScroll(0, 0, () => {
			//Enter choosing velocity mode (renderer checks for this mode to draw the vector. Input
			//handlers do it too to check for the escape key)
			ProjectileThrowSimulation.state = ProjectileThrowState.choosingVelocity;
		});
	}
	
	static exitChoosingVelocityMode() {
		//Exit mode
		ProjectileThrowSimulation.state = ProjectileThrowState.projectileInLaunchPosition;
	
		//Hide the velocity choosing instructions
		if (isTouchScreenAvailable) {
			document.getElementById("choose-velocity-instructions-touch").classList.add("hidden");
		} else {
			document.getElementById("choose-velocity-instructions-mouse").classList.add("hidden");
		}
	
		//Update page settings
		ProjectileThrowSimulation.settings = ProjectileThrowSimulation.settings.getFromPage();
		ProjectileThrowSimulation.settings.updatePage();
	
		//Re-allow scrolling if disabled
		document.body.classList.remove("no-scrolling");
	}
	
	//Scales the #simulation-results element to fit in the page
	static scaleSimulationResults() {
		//Scale the element. Get its size and make it the maximum possible.
		let style = window.getComputedStyle(document.getElementById("simulation-results"));
		let elementWidth = (parseFloat(style.width) + 2 * parseFloat(style.paddingLeft))
			* window.devicePixelRatio / this.simulationResultsScale;

		let maxWidth =
			(ProjectileThrowSimulation.camera.canvasSize.x - 20 * window.devicePixelRatio);
		let scale: number = maxWidth / (elementWidth * this.simulationResultsScale);
		scale = Math.min(scale, 1); //Limit the scale from 0 to 1

		document.documentElement.style.setProperty("--simulation-results-scale", scale.toString());
		this.simulationResultsScale = scale;
	}
	
	static showSimulationResults() {
		this.scaleSimulationResults();
	
		//Blur the background and show the popup with the results
		ProjectileThrowSimulation.renderer.canvas.classList.add("blur");
		document.getElementById("simulation-interaction-div").classList.add("blur");
		document.body.classList.add("no-interaction");
	
		document.getElementById("simulation-results").classList.remove("hidden");
	
		ProjectileThrowSimulation.state = ProjectileThrowState.showingSimulationResults;
	}
	
	static hideSimulationResults() {
		//Un-blur the background and hide the window
		ProjectileThrowSimulation.renderer.canvas.classList.remove("blur");
		document.getElementById("simulation-interaction-div").classList.remove("blur");
		document.body.classList.remove("no-interaction");
	
		document.getElementById("simulation-results").classList.add("hidden");
	
		ProjectileThrowSimulation.state = ProjectileThrowState.projectileStopped;
	}
}