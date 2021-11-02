//Responsible for calculating the theoretical outcome of the projectile's launch.
class ProjectileTheoreticalOutcome {
	public time: number; //Time of flight
	public distance: number; //Maximum distance from starting point
	public maxHeight: number;

	constructor(projectile: Body, bodyApothem: number, settings: ProjectileThrowSettings) {
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
			solutions = ExtraMath.solveQuadratic(0.5 * a.y, projectile.v.y, projectile.r.y);
		} else {
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
		this.time = Math.max(...solutions);

		//The distance the body reached is the x position when the body touched the ground
		//x = vx * t
		this.distance = projectile.v.x * this.time;

		//The body reaches max height when the height derivative (velocity) is 0.
		//vy = vy0 + a * t => 0 = vy0 + a * t, then y = y0 + vy * t + 0.5 * a * t^2
		let maxHeightTime = - projectile.v.y / a.y;
		if (projectile.v.y > 0) {
			this.maxHeight =
				projectile.r.y +
				projectile.v.y * maxHeightTime +
				0.5 * a.y * (maxHeightTime * maxHeightTime);
		} else {
			//The body was launched down. maxHeight is height at launch
			this.maxHeight = projectile.r.y;
		}
	}

	//Puts the real and theoretical values in the simulation-results div. 
	applyToPage(realTime: number, bodyDistance: number, maxHeight: number) {
		//Fill the table with the values
		document.getElementById("simulated-time").textContent =
			ExtraMath.round(realTime * 0.001, 2).toString(); // * 0.001 -> s to ms
		document.getElementById("real-time").textContent =
			ExtraMath.round(this.time, 2).toString();
		document.getElementById("error-time").textContent =
			ExtraMath.round(
				ExtraMath.relativeError(realTime * 0.001, this.time) * 100, 2
			).toString();
		
		document.getElementById("simulated-distance").textContent =
			ExtraMath.round(bodyDistance, 2).toString();
		document.getElementById("real-distance").textContent =
			ExtraMath.round(this.distance, 2).toString();
		document.getElementById("error-distance").textContent =
			ExtraMath.round(
				ExtraMath.relativeError(bodyDistance, this.distance) * 100, 2
			).toString();

		document.getElementById("simulated-height").textContent =
			ExtraMath.round(maxHeight, 2).toString();
		document.getElementById("real-height").textContent =
			ExtraMath.round(this.maxHeight, 2).toString();
		document.getElementById("error-height").textContent =
			ExtraMath.round(
				ExtraMath.relativeError(maxHeight, this.maxHeight) * 100, 2
			).toString();
	}
}