//Calculates the trajectory (set of points that form a line) of a projectile
var ProjectileTrajectory = /** @class */ (function () {
    //Note - this function will run Body.step(). Make sure you feed it a copy of the projectile.
    function ProjectileTrajectory(projectile, settings) {
        if (projectile === void 0) { projectile = undefined; }
        if (settings === void 0) { settings = undefined; }
        //new ProjectileTrajectory() returns an empty trajectory
        if (!projectile && !settings) {
            this.points = [];
            return;
        }
        this.points = [];
        do {
            this.points.push(projectile.r);
            projectile.step(settings.simulationQuality);
            this.points.push(projectile.r);
        } while (!ProjectileTrajectory.bodyReachedGround(projectile, settings));
    }
    //Checks if the body has reached the ground
    ProjectileTrajectory.bodyReachedGround = function (projectile, settings) {
        //Stop the body when it reaches the ground
        if (settings.heightReference === HeightReference.BodyCM) {
            //Stop the body when its center of mass reaches the ground
            if (projectile.r.y <= 0) {
                return true;
            }
        }
        else {
            //Stop the body when its base reaches the ground (center of mass reaches 1 body
            //apothem above 0)
            if (projectile.r.y <= bodyApothem) {
                return true;
            }
        }
        return false;
    };
    return ProjectileTrajectory;
}());
