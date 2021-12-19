//A class to handle mouse and keyboard events of the ProjectileThrow.ts simulation
class ProjectileThrowEvents {
	//mousePosition needs to be public for things like rendering the velocity vector while it's
	//being chosen.
	static mousePosition: Vec2 = new Vec2(0, 0);
	static isTouchScreenAvailable = "ontouchstart" in window || navigator.maxTouchPoints > 0;

	static addEvents() {
		let moveCallback: (x: number, y: number) => void = (x: number, y: number) => {
			this.mousePosition = new Vec2(
				x * window.devicePixelRatio, y * window.devicePixelRatio
			);

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

		//Hide the "scroll down for more" message on portrait mode
		function onScroll() {
			document.getElementById("scroll-down").style.bottom = "150vh";
			window.removeEventListener("scroll", onScroll)
		}
		window.addEventListener("scroll", onScroll);
	}

	//Smoothly scrolls to a point in the page and calls back when that point is reached. If the
	//position isn't reached in the desired time, it will be forcefully set (no smooth animation)
	//and callback will be called. If timeout === 0, this won't happen.
	static smoothScroll(x: number, y: number, callback: () => any = () => {},
		timeout: number = 500) {

		if (window.scrollX === x && window.scrollY === y) {
			//Already in the desired position.
			callback();
			return;
		}

		let positionReached: boolean = false;

		function onScroll() {
			//Check if the position has been reached. If so, call back.
			if (window.scrollX === x && window.scrollY === y) {
				window.removeEventListener("scroll", onScroll);
				positionReached = true;
				callback();
			}
		}
		window.addEventListener("scroll", onScroll);
		window.scrollTo({ left: x, top: y, behavior: "smooth" });

		if (timeout !== 0) {
			setTimeout(() => {
				if (!positionReached) {
					window.scrollTo(x, y);
					window.removeEventListener("scroll", onScroll);
					callback();
				}
			}, timeout);
		}
	}
}