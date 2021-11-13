//Responsible for calculating the theoretical outcome of the projectile's launch.
var ProjectileTheoreticalOutcome = /** @class */ (function () {
    function ProjectileTheoreticalOutcome(projectile, bodyApothem, settings) {
        //Calculate the resultant of the forces and the acceleration
        var Fr = new Vec2();
        for (var i = 0; i < projectile.forces.length; ++i) {
            Fr = Fr.add(projectile.forces[i]);
        }
        var a = Fr.scale(1 / projectile.mass);
        //y = y0 + vy * t + 0.5 * a * t^2 (y = 0 -> ground reached). y = bodyApothem if the body
        //base is used as reference.
        var solutions = undefined;
        if (settings.heightReference === HeightReference.BodyCM) {
            solutions = ExtraMath.solveQuadratic(0.5 * a.y, projectile.v.y, projectile.r.y);
        }
        else {
            solutions =
                ExtraMath.solveQuadratic(0.5 * a.y, projectile.v.y, projectile.r.y - bodyApothem);
        }
        if (solutions.length === 0) {
            //No solutions. This shouldn't happen under any circumstance but let's make sure the
            //program doesn't catch on fire if it does happen.
            alert("Falha no cálculo de resultados teóricos - quadrática sem soluções!");
            this.time = 0;
            this.maxHeight = 0;
            this.distance = 0;
            return;
        }
        //Choose the largest solution. The smaller one can be negative or 0 (if the body starts
        //from the ground)
        this.time = Math.max.apply(Math, solutions);
        //The distance the body reached is the x position when the body touched the ground
        //x = vx * t
        this.distance = projectile.v.x * this.time;
        //The body reaches max height when the height derivative (velocity) is 0.
        //vy = vy0 + a * t => 0 = vy0 + a * t, then y = y0 + vy * t + 0.5 * a * t^2
        var maxHeightTime = -projectile.v.y / a.y;
        if (projectile.v.y > 0) {
            this.maxHeight =
                projectile.r.y +
                    projectile.v.y * maxHeightTime +
                    0.5 * a.y * (maxHeightTime * maxHeightTime);
        }
        else {
            //The body was launched down. maxHeight is height at launch
            this.maxHeight = projectile.r.y;
        }
    }
    //Puts the real and theoretical values in the simulation-results div. 
    ProjectileTheoreticalOutcome.prototype.applyToPage = function (realTime, bodyDistance, maxHeight) {
        //Converts a number to a string, returning user-readable results for NaN and infinity
        function toString(n) {
            if (isNaN(n) || n === Infinity || n === -Infinity) {
                //In this case, NaN and Infinity can only originate in a division by 0:
                //0 / 0 or other / 0, respectively
                return "Divisão por 0";
            }
            return n.toString();
        }
        //Fill the table with the values
        document.getElementById("simulated-time").textContent =
            toString(ExtraMath.round(realTime * 0.001, 2)); // * 0.001 -> s to ms
        document.getElementById("real-time").textContent =
            toString(ExtraMath.round(this.time, 2));
        document.getElementById("error-time").textContent =
            toString(ExtraMath.round(ExtraMath.relativeError(realTime * 0.001, this.time) * 100, 2));
        document.getElementById("simulated-distance").textContent =
            toString(ExtraMath.round(bodyDistance, 2));
        document.getElementById("real-distance").textContent =
            toString(ExtraMath.round(this.distance, 2));
        document.getElementById("error-distance").textContent =
            toString(ExtraMath.round(ExtraMath.relativeError(bodyDistance, this.distance) * 100, 2));
        document.getElementById("simulated-height").textContent =
            toString(ExtraMath.round(maxHeight, 2));
        document.getElementById("real-height").textContent =
            toString(ExtraMath.round(this.maxHeight, 2));
        document.getElementById("error-height").textContent =
            toString(ExtraMath.round(ExtraMath.relativeError(maxHeight, this.maxHeight) * 100, 2));
    };
    return ProjectileTheoreticalOutcome;
}());
