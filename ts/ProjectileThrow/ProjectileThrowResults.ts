//Stores results from the projectile throw experience (flight time, horizontal distance and maximum
//height). These can be the theoretical values or the measured ones.
class ProjectileThrowResults {
	public time: number; //Time of flight
	public distance: number; //Maximum distance from starting point
	public maxHeight: number;

	constructor() {
		this.time = 0;
		this.distance = 0;
		this.maxHeight = 0;
	}

	//Calculates the theoretical results based on data from ProjectileThrowSimulation
	static calculateTheoreticalResults(projectile: Body, settings: ProjectileThrowSettings)
		: ProjectileThrowResults {

		let results = new ProjectileThrowResults(); //Value to be returned

		//Calculate the resultant of the forces and the acceleration
		let Fr: Vec2 = new Vec2();
		for (let i: number = 0; i < projectile.forces.length; ++i) {
			Fr = Fr.add(projectile.forces[i]);
		}
		let a = Fr.scale(1 / projectile.mass);

		//y = y0 + vy * t + 0.5 * a * t^2 (y = 0 -> ground reached). y = bodyApothem if the body
		//base is used as reference.
		let solutions = undefined;
		if (settings.heightReference === HeightReference.BodyCM) {
			solutions = ExtraMath.solveQuadratic(0.5 * a.y,
				projectile.v.y, projectile.r.y);
		} else {
			solutions =
				ExtraMath.solveQuadratic(0.5 * a.y, projectile.v.y,
				projectile.r.y - BODY_APOTHEM);
		}

		if (solutions.length === 0) {
			//No solutions. This shouldn't happen under any circumstance but let's make sure the
			//program doesn't catch on fire if it does happen.
			alert("Falha no cálculo de resultados teóricos - quadrática sem soluções!");
			results.time = 0;
			results.maxHeight = 0;
			results.distance = 0;
			return;
		}

		//Choose the largest solution. The smaller one can be negative or 0 (if the body starts
		//from the ground)
		results.time = Math.max(...solutions);

		//The distance the body reached is the x position when the body touched the ground
		//x = vx * t
		results.distance = projectile.v.x * results.time;

		//The body reaches max height when the height derivative (velocity) is 0.
		//vy = vy0 + a * t => 0 = vy0 + a * t, then y = y0 + vy * t + 0.5 * a * t^2
		let maxHeightTime = - projectile.v.y / a.y;
		if (projectile.v.y > 0) {
			results.maxHeight =
				projectile.r.y +
				projectile.v.y * maxHeightTime +
				0.5 * a.y * (maxHeightTime * maxHeightTime);
		} else {
			//The body was launched down. maxHeight is height at launch
			results.maxHeight = projectile.r.y;
		}

		return results;
	}

	//Puts the real and theoretical values in the simulation-results div. 
	static applyToPage(
		theoreticalValues: ProjectileThrowResults,
		experimentalValues: ProjectileThrowResults) {

		//Converts a number to a string, returning user-readable results for NaN and infinity
		function toString(n: number) {
			if (isNaN(n) || n === Infinity || n === -Infinity) {
				//In this case, NaN and Infinity can only originate in a division by 0:
				//0 / 0 or other / 0, respectively
				return "Divisão por 0";
			}
			return n.toString();
		}

		//Fill the table with the values
		document.getElementById("simulated-time").textContent =
			toString(ExtraMath.round(experimentalValues.time * 0.001, 2)); // * 0.001 -> s to ms
		document.getElementById("real-time").textContent =
			toString(ExtraMath.round(theoreticalValues.time, 2));
		document.getElementById("error-time").textContent =
			toString(ExtraMath.round(ExtraMath.relativeError(
			experimentalValues.time * 0.001, theoreticalValues.time) * 100, 2));
		
		document.getElementById("simulated-distance").textContent =
			toString(ExtraMath.round(experimentalValues.distance, 2));
		document.getElementById("real-distance").textContent =
			toString(ExtraMath.round(theoreticalValues.distance, 2));
		document.getElementById("error-distance").textContent =
			toString(ExtraMath.round(ExtraMath.relativeError(
			experimentalValues.distance, theoreticalValues.distance) * 100, 2));

		document.getElementById("simulated-height").textContent =
			toString(ExtraMath.round(experimentalValues.maxHeight, 2));
		document.getElementById("real-height").textContent =
			toString(ExtraMath.round(theoreticalValues.maxHeight, 2));
		document.getElementById("error-height").textContent =
			toString(ExtraMath.round(ExtraMath.relativeError(
			experimentalValues.maxHeight, theoreticalValues.maxHeight) * 100, 2));
	}
}