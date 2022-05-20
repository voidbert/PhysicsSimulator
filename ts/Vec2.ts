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

	//Best suited for intensity comparisons (where the expensive square root isn't needed)
	squareNorm(): number {
		return this.x * this.x + this.y * this.y;
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

	//Given the vector (a, b), (1 / a, 1 / b) will be returned
	invert() {
		return new Vec2(1 / this.x, 1 / this.y);
	}

	//Given the vectors (a, b) and (c, d), this function will return (ac, bd)
	scale2(scale: Vec2): Vec2 {
		return new Vec2(this.x * scale.x, this.y * scale.y);
	}

	dotProduct(vec: Vec2): number {
		return (this.x * vec.x) + (this.y * vec.y);
	}
}