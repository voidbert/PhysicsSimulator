//A class to handle mouse and keyboard events of the ProjectileThrow.ts simulation
class ProjectileThrowEvents {
	//mousePosition needs to be public for things like rendering the velocity vector while it's
	//being chosen.
	static mousePosition: Vec2 = new Vec2(0, 0);

	public static isTouchScreenAvailable = "ontouchstart" in window || navigator.maxTouchPoints > 0;

	static addEvents() {
		window.addEventListener("pointermove", (e: MouseEvent) => {
			this.mousePosition = new Vec2(e.clientX, e.clientY);

			//If the user is choosing the velocity, update the velocity inputs
			if (ProjectileThrowSimulation.state === ApplicationState.choosingVelocity) {
				let v: Vec2 =
					ProjectileThrowSimulation.camera.pointToWorldPosition(this.mousePosition)
					.subtract(ProjectileThrowSimulation.projectile.r)
					.scale(3);
				//Max of 2 decimal places in the velocity inputs
				v = new Vec2(ExtraMath.round(v.x, 2),　ExtraMath.round(v.y, 2));
				ProjectileThrowSettings.updatePageVelocity(v);

				//Update the trajectory. Create a copy of the body with the new initial velocity
				let proj: Body = Object.create(ProjectileThrowSimulation.projectile);
				proj.v = v;

				ProjectileThrowSimulation.trajectory = new ProjectileTrajectory(
					proj, ProjectileThrowSimulation.settings);
			}
		});

		//If the user clicks on top of the canvas while choosing the body's velocity, stop choosing
		//the velocity (setting its value to the chosen one)
		document.getElementById("no-script-div").addEventListener("pointerup", () => {
			if (ProjectileThrowSimulation.state === ApplicationState.choosingVelocity) {
				ProjectileThrowSimulation.exitChoosingVelocityMode();
			}
		});

		//When ESC is pressed, exit velocity selection mode or simulation results (depending on the
		//state)
		window.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (ProjectileThrowSimulation.state === ApplicationState.choosingVelocity) {
					
					//Update the velocity input boxes to have the values before the action was
					//cancelled
					ProjectileThrowSettings.updatePageVelocity(
						ProjectileThrowSimulation.velocityBeforeChoosing);
					ProjectileThrowSimulation.exitChoosingVelocityMode();

				} else if (ProjectileThrowSimulation.state ===
					ApplicationState.showingSimulationResults) {

					ProjectileThrowSimulation.hideSimulationResults();
				}
			}
		});
	}
}