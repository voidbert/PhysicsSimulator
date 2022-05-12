class SolarSystemEvents {
	//A object with boolean values that tell whether a key is pressed or not. If the key isn't in
	//this list, it was never pressed.
	private static keysDown = {};

	//Checks if a key is currently pressed
	private static isKeyDown(key: string): boolean {
		return this.keysDown[key] ?? false;
	}

	//Returns the list of keys currently pressed.
	private static getKeysDown(): string[] {
		let ret: string[] = [];

		let keys = Object.keys(this.keysDown);
		for (let i = 0; i < keys.length; ++i) {
			if (this.keysDown[keys[i]]) {
				ret.push(keys[i]);
			}
		}

		return ret;
	}

	static addEvents() {
		window.addEventListener("keypress", (e: KeyboardEvent) => {
			//Pause / resume
			if (e.key == " " && SolarSystemSimulation.timeManager) { // == comparison required
				if (SolarSystemSimulation.timeManager.isPaused) {
					SolarSystemSimulation.timeManager.resume();
				} else {
					SolarSystemSimulation.timeManager.pause(SolarSystemPauseReason.UserAction);
				}
			}
		});

		//Zoom in and out
		window.addEventListener("wheel", (e: WheelEvent) => {
			let mouseWorldPosition =
				SolarSystemSimulation.camera.pointToWorldPosition(mouseScreenPosition);

			SolarSystemSimulation.camera.scale =
				SolarSystemSimulation.camera.scale.scale(e.deltaY > 0 ? 0.85 : 1.15);
			SolarSystemSimulation.camera.forcePosition(mouseWorldPosition, mouseScreenPosition);
		});

		window.addEventListener("keydown", (e: KeyboardEvent) => {
			this.keysDown[e.key.toLocaleLowerCase()] = true;
		});
		window.addEventListener("keyup", (e: KeyboardEvent) => {
			this.keysDown[e.key.toLocaleLowerCase()] = false;
		});
		window.addEventListener("blur", () => {
			//When the focus leaves the window, "unpress" all keys. This way, you won't get a key
			//"stuck" after you leave the window.
			this.keysDown = {};
		});

		//Every 50ms, check if a movement key (WASD) is pressed. If so, move the camera.
		window.setInterval(() => {
			//Camera movement
			const MOVEMENT_SPEED = 20;
			const movementKeyTable = {
				"w": new Vec2(0, MOVEMENT_SPEED),
				"s": new Vec2(0, -MOVEMENT_SPEED),
				"a": new Vec2(-MOVEMENT_SPEED, 0),
				"d": new Vec2(MOVEMENT_SPEED, 0),
				"arrowup": new Vec2(0, MOVEMENT_SPEED),
				"arrowdown": new Vec2(0, -MOVEMENT_SPEED),
				"arrowleft": new Vec2(-MOVEMENT_SPEED, 0),
				"arrowright": new Vec2(MOVEMENT_SPEED, 0)
			};

			let keys = this.getKeysDown();
			let movementVector: Vec2 = new Vec2();
			//Combine the movement from all pressed movement keys.
			for (let i = 0; i < keys.length; ++i) {
				movementVector = 
					movementVector.add(movementKeyTable[keys[i].toLocaleLowerCase()] ?? new Vec2());
			}
			SolarSystemSimulation.camera.r = SolarSystemSimulation.camera.r.add(
				movementVector.scale2(SolarSystemSimulation.camera.scale.invert())
			);

		}, 50);

		document.getElementById("canvas").addEventListener("click", () => {
			if (isPortrait() && SolarSystemSimulation.state === SolarSystemState.ShowingSettings) {
				SolarSystemStateManager.leaveShowingSettingsMode();
			}
		});

		document.getElementById("settings-icon-container").addEventListener("click", () => {
			if (isPortrait()) {
				if (SolarSystemSimulation.state === SolarSystemState.NormalSimulation) {
					SolarSystemStateManager.enterShowingSettingsMode();
				} else {
					SolarSystemStateManager.leaveShowingSettingsMode();
				}
			}
		});

		document.getElementById("quality-confirm-button").addEventListener("click", () => {
			SolarSystemStateManager.leaveChoosingSimulationQualityMode();
		});
	}
}