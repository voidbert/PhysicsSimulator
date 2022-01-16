//A class to handle mouse and keyboard events of the ProjectileThrow.ts simulation
class ProjectileThrowEvents {
	//mousePosition needs to be public for things like rendering the velocity vector while it's
	//being chosen.
	static mousePosition: Vec2 = new Vec2(0, 0);

	static addEvents() {
		let moveCallback: (x: number, y: number) => void = (x: number, y: number) => {
			this.mousePosition = new Vec2(
				x * window.devicePixelRatio, y * window.devicePixelRatio
			);

			//If the user is choosing the velocity, update the velocity inputs
			if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
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

				ProjectileThrowSimulation.trajectory = ProjectileThrowTrajectory.
					generateLimitedTrajectory(proj, ProjectileThrowSimulation.settings);
			}
		};

		window.addEventListener("mousemove", (e: MouseEvent) => { moveCallback(e.x, e.y); });
		window.addEventListener("touchmove", (e: TouchEvent) => {
			if (e.touches.length === 1) {
				moveCallback(e.touches[0].clientX, e.touches[0].clientY);
			} //Single touch support only
		});

		//If the user clicks on top of the canvas while choosing the body's velocity, stop choosing
		//the velocity (setting its value to the chosen one)
		document.getElementById("no-script-div").addEventListener("pointerup", () => {
			if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
				ProjectileThrowStateManager.exitChoosingVelocityMode();
			}
		});

		//When ESC is pressed, exit velocity selection mode or simulation results (depending on the
		//state)
		window.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
					
					//Update the velocity input boxes to have the values before the action was
					//cancelled
					ProjectileThrowSettings.updatePageVelocity(
						ProjectileThrowSimulation.velocityBeforeChoosing);
					ProjectileThrowStateManager.exitChoosingVelocityMode();

				} else if (ProjectileThrowSimulation.state ===
					ProjectileThrowState.showingSimulationResults) {

					ProjectileThrowStateManager.hideSimulationResults();
				}
			}
		});

		//Hide the "scroll down for more" message on portrait mode
		function onScroll() {
			document.getElementById("scroll-down").style.bottom = "150vh";
			window.removeEventListener("scroll", onScroll)
		}
		window.addEventListener("scroll", onScroll);
	}
}