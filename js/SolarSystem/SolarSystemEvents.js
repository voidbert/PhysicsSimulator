class SolarSystemEvents {
    static isKeyDown(key) {
        var _a;
        return (_a = this.keysDown[key]) !== null && _a !== void 0 ? _a : false;
    }
    static getKeysDown() {
        let ret = [];
        let keys = Object.keys(this.keysDown);
        for (let i = 0; i < keys.length; ++i) {
            if (this.keysDown[keys[i]]) {
                ret.push(keys[i]);
            }
        }
        return ret;
    }
    static addEvents() {
        window.addEventListener("keypress", (e) => {
            if (e.key == " " && SolarSystemSimulation.timeManager) {
                if (SolarSystemSimulation.timeManager.isPaused) {
                    SolarSystemSimulation.timeManager.resume();
                }
                else {
                    SolarSystemSimulation.timeManager.pause(SolarSystemPauseReason.UserAction);
                }
            }
        });
        window.addEventListener("wheel", (e) => {
            let mouseWorldPosition = SolarSystemSimulation.camera.pointToWorldPosition(mouseScreenPosition);
            SolarSystemSimulation.camera.scale =
                SolarSystemSimulation.camera.scale.scale(e.deltaY > 0 ? 0.85 : 1.15);
            SolarSystemSimulation.camera.forcePosition(mouseWorldPosition, mouseScreenPosition);
        });
        window.addEventListener("keydown", (e) => {
            this.keysDown[e.key.toLocaleLowerCase()] = true;
        });
        window.addEventListener("keyup", (e) => {
            this.keysDown[e.key.toLocaleLowerCase()] = false;
        });
        window.addEventListener("blur", () => {
            this.keysDown = {};
        });
        window.setInterval(() => {
            var _a;
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
            let movementVector = new Vec2();
            for (let i = 0; i < keys.length; ++i) {
                movementVector =
                    movementVector.add((_a = movementKeyTable[keys[i].toLocaleLowerCase()]) !== null && _a !== void 0 ? _a : new Vec2());
            }
            SolarSystemSimulation.camera.r = SolarSystemSimulation.camera.r.add(movementVector.scale2(SolarSystemSimulation.camera.scale.invert()));
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
                }
                else {
                    SolarSystemStateManager.leaveShowingSettingsMode();
                }
            }
        });
        document.getElementById("quality-confirm-button").addEventListener("click", () => {
            SolarSystemStateManager.leaveChoosingSimulationQualityMode();
        });
    }
}
SolarSystemEvents.keysDown = {};
