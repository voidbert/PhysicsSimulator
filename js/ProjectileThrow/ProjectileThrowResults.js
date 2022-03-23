var ProjectileThrowResults = (function () {
    function ProjectileThrowResults() {
        this.time = 0;
        this.distance = 0;
        this.maxHeight = 0;
    }
    ProjectileThrowResults.calculateTheoreticalResults = function (projectile, settings) {
        var results = new ProjectileThrowResults();
        var Fr = new Vec2();
        for (var i = 0; i < projectile.forces.length; ++i) {
            Fr = Fr.add(projectile.forces[i]);
        }
        var a = Fr.scale(1 / projectile.mass);
        var solutions = undefined;
        if (settings.heightReference === HeightReference.BodyCM) {
            solutions = ExtraMath.solveQuadratic(0.5 * a.y, projectile.v.y, projectile.r.y);
        }
        else {
            solutions =
                ExtraMath.solveQuadratic(0.5 * a.y, projectile.v.y, projectile.r.y - settings.radius);
        }
        if (solutions.length === 0) {
            alert("Falha no cálculo de resultados teóricos - quadrática sem soluções!");
            results.time = 0;
            results.maxHeight = 0;
            results.distance = 0;
            return;
        }
        results.time = Math.max.apply(Math, solutions);
        results.distance = projectile.v.x * results.time;
        var maxHeightTime = -projectile.v.y / a.y;
        if (projectile.v.y > 0) {
            results.maxHeight =
                projectile.r.y +
                    projectile.v.y * maxHeightTime +
                    0.5 * a.y * (maxHeightTime * maxHeightTime);
        }
        else {
            results.maxHeight = projectile.r.y;
        }
        return results;
    };
    ProjectileThrowResults.applyToPage = function (theoreticalValues, experimentalValues) {
        function toString(n) {
            if (isNaN(n) || n === Infinity || n === -Infinity) {
                return "Divisão por 0";
            }
            return n.toString();
        }
        document.getElementById("simulated-time").textContent =
            toString(ExtraMath.round(experimentalValues.time * 0.001, 2));
        document.getElementById("real-time").textContent =
            toString(ExtraMath.round(theoreticalValues.time, 2));
        document.getElementById("error-time").textContent =
            toString(ExtraMath.round(ExtraMath.relativeError(experimentalValues.time * 0.001, theoreticalValues.time) * 100, 2));
        document.getElementById("simulated-distance").textContent =
            toString(ExtraMath.round(experimentalValues.distance, 2));
        document.getElementById("real-distance").textContent =
            toString(ExtraMath.round(theoreticalValues.distance, 2));
        document.getElementById("error-distance").textContent =
            toString(ExtraMath.round(ExtraMath.relativeError(experimentalValues.distance, theoreticalValues.distance) * 100, 2));
        document.getElementById("simulated-height").textContent =
            toString(ExtraMath.round(experimentalValues.maxHeight, 2));
        document.getElementById("real-height").textContent =
            toString(ExtraMath.round(theoreticalValues.maxHeight, 2));
        document.getElementById("error-height").textContent =
            toString(ExtraMath.round(ExtraMath.relativeError(experimentalValues.maxHeight, theoreticalValues.maxHeight) * 100, 2));
    };
    return ProjectileThrowResults;
}());
