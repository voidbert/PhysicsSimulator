const MAX_TRAJECTORY_POINTS = 1000;
class ProjectileThrowTrajectory {
    constructor(projectile = undefined, simulationQuality = 0, bodyRadius = 0, heightReference = HeightReference.BodyCM) {
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
    static bodyReachedGround(projectile, bodyRadius, heightReference) {
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
    }
    static generateLimitedTrajectory(projectile, settings) {
        let flightTime = ProjectileThrowResults.calculateTheoreticalResults(projectile, settings).time;
        let dt = flightTime / ((MAX_TRAJECTORY_POINTS * 0.95)) * 1000;
        dt = Math.max(dt, settings.simulationQuality);
        return new ProjectileThrowTrajectory(projectile, dt, settings.radius, settings.heightReference);
    }
}
