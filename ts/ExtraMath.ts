//More useful mathematics functions
class ExtraMath {
	//Returns all REAL solutions to a quadratic equation of form ax^2 + bx + c = 0.
	static solveQuadratic(a: number, b: number, c: number): number[] {
		let discriminant = (b * b) - (4 * a * c);
		
		if (discriminant === 0) {
			//Discriminant = 0, one solution
			return [ (-b) / (2 * a) ];
		} else if (discriminant > 0) {
			//Discriminant > 0, two real solutions
			return [
				((-b) + Math.sqrt(discriminant)) / (2 * a),
				((-b) - Math.sqrt(discriminant)) / (2 * a),
			];
		}

		//Discriminant < 0. No real solutions
		return [];
	}

	//Rounds a number to n decimal places
	static round(value: number, decimalPlaces: number = 0): number {
		return Math.round(value * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
	}

	//Calculate the relative error (not percentage)
	static relativeError(experimental: number, real: number): number {
		return Math.abs((experimental - real) / real);
	}

	//Linear interpolation between two numbers dt apart. t is the horizontal distance from a to the
	//point to be known
	static linearInterpolation(a: number, b: number, dt: number, t: number) {
		if (dt === 0) {
			return (a + b) / 2; //No distance between the points. Average them out to get the result
		}

		let m = (b - a) / dt; //slope
		return a + m * t;
	}

	//See this.linearInterpolation for more info.
	static linearInterpolationVec2(a: Vec2, b: Vec2, dt: number, t: number) {
		return new Vec2(this.linearInterpolation(a.x, b.x, dt, t),
			this.linearInterpolation(a.y, b.y, dt, t));
	}
}