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
}