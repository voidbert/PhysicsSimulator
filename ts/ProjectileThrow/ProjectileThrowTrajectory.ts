const MAX_TRAJECTORY_POINTS: number = 1000;

//Calculates the trajectory (set of points that form a line) of a projectile
class ProjectileThrowTrajectory {
	public points: Vec2[];

	//Creates a new trajectory
	constructor(projectile: Body = undefined, simulationQuality: number = 0,
		heightReference: HeightReference = HeightReference.BodyCM) {

		//new ProjectileTrajectory() returns an empty trajectory
		if (!projectile && simulationQuality === 0 && heightReference === HeightReference.BodyCM) {
			this.points = [];
			return;
		}

		//Clone the body
		projectile = Object.create(projectile);

		this.points = [];
		this.points.push(projectile.r);
		do {
			projectile.step(simulationQuality);
			this.points.push(projectile.r);		
		} while (!ProjectileThrowTrajectory.bodyReachedGround(projectile, heightReference));
	}

	//Checks if the body has reached the ground
	public static bodyReachedGround(projectile: Body, heightReference: HeightReference): boolean {
		//Stop the body when it reaches the ground
		if (heightReference === HeightReference.BodyCM) {
			//Stop the body when its center of mass reaches the ground
			if (projectile.r.y <= 0) {
				return true;
			}
		} else {
			//Stop the body when its base reaches the ground (center of mass reaches 1 body
			//apothem above 0)
			if (projectile.r.y <= BODY_RADIUS) {
				return true;
			}
		}
		return false;
	}

	//Generates a trajectory (like "new ProjectileTrajectory()") but makes sure it is limited to
	//a maximum number of points (MAX_TRAJECTORY_POINTS). It might not have the desired quality (set
	//in the settings) because it may have a lower number of points.
	public static generateLimitedTrajectory(projectile: Body, settings: ProjectileThrowSettings)
		: ProjectileThrowTrajectory {

		//Based on physics theory, predict how the body is going to move in order to know the flight
		//time.
		let flightTime: number =
			ProjectileThrowResults.calculateTheoreticalResults(projectile, settings).time;

		//(max number of points) * update time = flight time
		//update time = flight time / (max number of points)
		//Consider the maximum number of points 95% of MAX_TRAJECTORY_POINTS not to risk going over
		//this number (simulation quality slightly changes the body's path, possibly making it
		//longer)

		let dt = flightTime / ((MAX_TRAJECTORY_POINTS * 0.95)) * 1000; // * 1000 -> s to ms
		//Don't make the trajectory more detailed than the desired simulation quality
		dt = Math.max(dt, settings.simulationQuality);

		return new ProjectileThrowTrajectory(projectile, dt, settings.heightReference);
	}
}