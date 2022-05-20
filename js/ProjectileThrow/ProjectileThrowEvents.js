class ProjectileThrowEvents {
    static addEvents() {
        let moveCallback = (x, y) => {
            this.mousePosition = new Vec2(x * window.devicePixelRatio, y * window.devicePixelRatio);
            if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
                let v = ProjectileThrowSimulation.camera.pointToWorldPosition(this.mousePosition)
                    .subtract(ProjectileThrowSimulation.projectile.r)
                    .scale(3);
                v = new Vec2(ExtraMath.round(v.x, 2), ExtraMath.round(v.y, 2));
                ProjectileThrowSettings.updatePageVelocity(v);
                let proj = Object.create(ProjectileThrowSimulation.projectile);
                proj.v = v;
                ProjectileThrowSimulation.trajectory = ProjectileThrowTrajectory.
                    generateLimitedTrajectory(proj, ProjectileThrowSimulation.settings);
            }
        };
        window.addEventListener("mousemove", (e) => { moveCallback(e.x, e.y); });
        window.addEventListener("touchmove", (e) => {
            if (e.touches.length === 1) {
                moveCallback(e.touches[0].clientX, e.touches[0].clientY);
            }
        });
        document.getElementById("no-script-div").addEventListener("pointerup", () => {
            if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
                ProjectileThrowStateManager.exitChoosingVelocityMode();
            }
        });
        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
                    ProjectileThrowSettings.updatePageVelocity(ProjectileThrowSimulation.velocityBeforeChoosing);
                    ProjectileThrowStateManager.exitChoosingVelocityMode();
                }
                else if (ProjectileThrowSimulation.state ===
                    ProjectileThrowState.showingSimulationResults) {
                    ProjectileThrowStateManager.hideSimulationResults();
                }
            }
        });
        function onScroll() {
            document.getElementById("scroll-down").style.bottom = "150vh";
            window.removeEventListener("scroll", onScroll);
        }
        window.addEventListener("scroll", onScroll);
    }
}
ProjectileThrowEvents.mousePosition = new Vec2(0, 0);
