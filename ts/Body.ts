const GRAVITY = 9.8;
const AIR_DENSITY = 1.225;

class Body {
	public mass: number; //The mass of the body
	public r: Vec2; //The position of the body
	public v: Vec2; //The velocity of the body
	public forces: Vec2[]; //The list of forces applied to the body

	public geometry: Vec2[]; //The set of vertices representing the geometry of the body

	constructor(mass: number, geometry: Vec2[], r: Vec2 = new Vec2()) {
		this.mass = mass;
		this.r = r;
		this.v = new Vec2(0, 0);
		this.forces = [];
		this.geometry = geometry;
	}

	//Transforms a vector in body coordinates into a vector in world coordinates.
	transformVertex(vec: Vec2): Vec2 {
		return vec.add(this.r);
	}

	//Transforms a set of vectors (by default, the body's geometry) into vectors in world
	//coordinates.
	transformGeometry(geometry: Vec2[] = this.geometry): Vec2[] {
		return geometry.map((v) => { return this.transformVertex(v); });
	}

	//Advances the simulation after some time (dt in milliseconds) has passed
	step(dt: number): void {
		dt *= 0.001; //ms -> s

		//Calculate the resultant of the forces and the acceleration
		let Fr: Vec2 = new Vec2();
		for (let i: number = 0; i < this.forces.length; ++i) {
			Fr = Fr.add(this.forces[i]);
		}
		let a = Fr.scale(1 / this.mass);
		
		//Add the acceleration to the the velocity and the velocity to the position
		this.v = this.v.add(a.scale(dt));
		this.r = this.r.add(this.v.scale(dt));
	}
}