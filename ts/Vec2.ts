class Vec2 {
	public x: number;
	public y: number;

	constructor(x: number = 0, y: number = 0) {
		this.x = x;
		this.y = y;
	}

	norm(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	//Typescript doesn't have operator overloading (-_-)

	add(vec: Vec2): Vec2 {
		return new Vec2(this.x + vec.x, this.y + vec.y);
	}

	subtract(vec: Vec2): Vec2 {
		return new Vec2(this.x - vec.x, this.y - vec.y);
	}

	scale(scale: number): Vec2 {
		return new Vec2(this.x * scale, this.y * scale);
	}

	dotProduct(vec: Vec2): number {
		return (this.x * vec.x) + (this.y * vec.y);
	}
}