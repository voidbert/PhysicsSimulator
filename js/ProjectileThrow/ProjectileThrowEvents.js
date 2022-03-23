var ProjectileThrowEvents = (function () {
    function ProjectileThrowEvents() {
    }
    ProjectileThrowEvents.addEvents = function () {
        var _this = this;
        var moveCallback = function (x, y) {
            _this.mousePosition = new Vec2(x * window.devicePixelRatio, y * window.devicePixelRatio);
            if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
                var v = ProjectileThrowSimulation.camera.pointToWorldPosition(_this.mousePosition)
                    .subtract(ProjectileThrowSimulation.projectile.r)
                    .scale(3);
                v = new Vec2(ExtraMath.round(v.x, 2), ExtraMath.round(v.y, 2));
                ProjectileThrowSettings.updatePageVelocity(v);
                var proj = Object.create(ProjectileThrowSimulation.projectile);
                proj.v = v;
                ProjectileThrowSimulation.trajectory = ProjectileThrowTrajectory.
                    generateLimitedTrajectory(proj, ProjectileThrowSimulation.settings);
            }
        };
        window.addEventListener("mousemove", function (e) { moveCallback(e.x, e.y); });
        window.addEventListener("touchmove", function (e) {
            if (e.touches.length === 1) {
                moveCallback(e.touches[0].clientX, e.touches[0].clientY);
            }
        });
        document.getElementById("no-script-div").addEventListener("pointerup", function () {
            if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
                ProjectileThrowStateManager.exitChoosingVelocityMode();
            }
        });
        window.addEventListener("keydown", function (e) {
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
    };
    ProjectileThrowEvents.mousePosition = new Vec2(0, 0);
    return ProjectileThrowEvents;
}());
