class Body {
	public mass: number; //The mass of the body
	public r: Vec2; //The position of the body
	public v: Vec2; //The velocity of the body
	public forces: Vec2[]; //The list of forces applied to the body

	constructor(mass: number, r: Vec2 = new Vec2()) {
		this.mass = mass;
		this.r = r;
		this.v = new Vec2(0, 0);
		this.forces = [];
	}

	//Advances the simulation after some time (dt IN SECONDS) has passed
	step(dt: number) {
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