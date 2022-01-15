//Used for generating the theoretical outcome of a parachute simulation (function over time)
class ParachuteResults {
	//r(t), v(t) and a(t) functions IN ABSOLUTE VALUE AND IN SECONDS. t is the time since the
	//beginning of the simulation. These are only valid until the instant the parachute is opened.
	r: (t: number) => number;
	y: (t: number) => number;
	v: (t: number) => number;
	a: (t: number) => number;
	Fr: (t: number) => number;
	Rair: (t: number) => number;

	//When the parachute is open. After this point, the functions r, y, v, etc. are no longer
	//applicable
	timeParachuteOpens: number;

	constructor() {

	}

	static calculateTheoreticalResults(settings: ParachuteSettings): ParachuteResults {
		let ret = new ParachuteResults();

		//Differential equation: (m * v'(t)) = -(m * g) + 0.5 * Cd * rho * A * v^2(t)
		//Solution:
		//v(t) = sqrt((2 * m * g) / (rho * A * Cd)) * tanh(t * sqrt((g * rho * A * Cd) / 2m))

		//Through integration and derivation, the r(t) and a(t) can be found.
		//
		//Intv(t) = ((2 * m) / (rho * A * Cd)) * ln| 2cosh(sqrt( (g * rho * A * C) / 2m ) * t) |
		//r(t) = Intv(t) - Intv(0)
		//y(t) = h0 - r(t)
		//
		//a(t) = g * sech^2(t * sqrt((g * rho * A * Cd) / 2m))

		function rIntegral(t: number): number {
			return ((2 * settings.mass) / (AIR_DENSITY * settings.A0 * settings.cd0)) *
				Math.log(Math.abs(2 * Math.cosh(
				Math.sqrt(GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0 /
				(2 * settings.mass)) * t)));
		}

		ret.r = (t: number): number => {
			return rIntegral(t) - rIntegral(0);
		}

		ret.y = (t: number): number => {
			return settings.h0 - ret.r(t);
		}

		ret.v = (t: number): number => {
			return Math.sqrt((2 * settings.mass * GRAVITY) /
				(AIR_DENSITY * settings.A0 * settings.cd0)) * Math.tanh(Math.sqrt(
				(GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0) / (2 * settings.mass)) * t);
		};

		ret.a = (t: number): number => {
			return GRAVITY / Math.pow(Math.cosh(
				Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0) /
				(2 * settings.mass)) * t), 2);
		}

		ret.Fr = (t: number): number => {
			return ret.a(t) * settings.mass; //F = ma
		}

		ret.Rair = (t: number): number => {
			let v = ret.v(t);
			return 0.5 * settings.cd0 * AIR_DENSITY * settings.A0 * v * v;
		}

		//Know when the sky diver opens the parachute (from that point onwards these functions are
		//invalid)
		ret.timeParachuteOpens = Math.acosh(0.5 * Math.exp(
			((settings.h0 - settings.hopening + rIntegral(0)) * AIR_DENSITY * settings.A0 *
			settings.cd0) / (2 * settings.mass))) / Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 *
			settings.cd0) / (2 * settings.mass));

		return ret;
	}
}