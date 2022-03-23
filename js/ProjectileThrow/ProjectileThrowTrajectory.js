var MAX_TRAJECTORY_POINTS = 1000;
var ProjectileThrowTrajectory = (function () {
    function ProjectileThrowTrajectory(projectile, simulationQuality, bodyRadius, heightReference) {
        if (projectile === void 0) { projectile = undefined; }
        if (simulationQuality === void 0) { simulationQuality = 0; }
        if (bodyRadius === void 0) { bodyRadius = 0; }
        if (heightReference === void 0) { heightReference = HeightReference.BodyCM; }
        if (!projectile && simulationQuality === 0 && bodyRadius == 0 &&
            heightReference === HeightReference.BodyCM) {
            this.points = [];
            return;
        }
        projectile = Object.create(projectile);
        this.points = [];
        this.points.push(projectile.r);
        do {
            projectile.step(simulationQuality);
            this.points.push(projectile.r);
        } while (!ProjectileThrowTrajectory.
            bodyReachedGround(projectile, bodyRadius, heightReference));
    }
    ProjectileThrowTrajectory.bodyReachedGround = function (projectile, bodyRadius, heightReference) {
        if (heightReference === HeightReference.BodyCM) {
            if (projectile.r.y <= 0) {
                return true;
            }
        }
        else {
            if (projectile.r.y <= bodyRadius) {
                return true;
            }
        }
        return false;
    };
    ProjectileThrowTrajectory.generateLimitedTrajectory = function (projectile, settings) {
        var flightTime = ProjectileThrowResults.calculateTheoreticalResults(projectile, settings).time;
        var dt = flightTime / ((MAX_TRAJECTORY_POINTS * 0.95)) * 1000;
        dt = Math.max(dt, settings.simulationQuality);
        return new ProjectileThrowTrajectory(projectile, dt, settings.radius, settings.heightReference);
    };
    return ProjectileThrowTrajectory;
}());
