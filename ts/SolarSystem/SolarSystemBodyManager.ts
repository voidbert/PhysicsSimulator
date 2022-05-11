class SolarSystemPlanetCharacteristics {
	public radius: number; //In meters
	public color: string; //CSS / canvas color

	constructor(radius: number = 1, color: string = "#fff") {
		this.radius = radius;
		this.color = color;
	}
}

//For every simulation quality, the limit angle to stop drawing orbits. Lower qualities need a
//higher error margin.
const SINGLE_ORBIT_ANGLE = {
	"VeryLow": Math.PI * 0.20,
	"Low": Math.PI * 0.1,
	"Medium": Math.PI * 0.05,
	"High": Math.PI * 0.01,
	"VeryHigh": Math.PI * 0.01
};

class SolarSystemBodyManager {
	private parallelWorker: WorkerWrapper;
	private bufferCount: number;

	private bodies: Body[];
	private bodyCharacteristics: SolarSystemPlanetCharacteristics[];

	constructor(bodies: Body[], characteristics: SolarSystemPlanetCharacteristics[]) {
		//Creates a new worker.
		this.bufferCount = 0;
		this.parallelWorker = new WorkerWrapper(
			"../../js/SolarSystem/SolarSystemWorker.js",
			SolarSystemSimulation.settings.simulationQuality,
			(w: Worker, data: any) => {
				this.parallelWorker.addBuffer(
					new NumberedBuffer(this.bufferCount, data.size, data.buf, bodies.length * 16));
				this.bufferCount++;
			},
			1024, 16
		);

		this.bodies = bodies;
		this.bodyCharacteristics = characteristics;

		//These arrays must be the same length. If not, create needed planet characteristics.
		//There's no need to discard extra ones, as that won't cause out of bound scenarios.
		if (this.bodies.length > this.bodyCharacteristics.length) {
			console.error(
				"SolarSystemBodyManager: different number of planets and characteristics");

			let newArray: SolarSystemPlanetCharacteristics[] = new Array(this.bodies.length);
			for (let i = 0; i < this.bodies.length; ++i) {
				newArray[i] = characteristics[i] ?? new SolarSystemPlanetCharacteristics();
			}
			this.bodyCharacteristics = newArray;
		}

		this.parallelWorker.start({ bodies: this.bodies },
			SolarSystemSimulation.settings.simulationQuality);
	}

	//Sets the positions of the bodies to the ones of a certain instant processed by the worker.
	//instant must be in milliseconds.
	updatePositions(instant: number, simulationQuality: number) {
		let buffers = this.parallelWorker.getBoundaryBuffers(instant, true);

		if (buffers.length === 0) {
			//No data yet
			SolarSystemSimulation.timeManager.pause(SolarSystemPauseReason.LackOfData);
		} else {
			if (SolarSystemSimulation.timeManager.pauseReason ===
				SolarSystemPauseReason.LackOfData) {

				SolarSystemSimulation.timeManager.resume();
			}
			
			let buf1 = new Float64Array(buffers[0]);
			let buf2 = new Float64Array(buffers[1]);
			let length = Math.max(buf1.length, buf2.length, this.bodies.length * 2) / 2;
			for (let i = 0; i < length; ++i) {
				this.bodies[i].r = ExtraMath.linearInterpolationVec2(
					new Vec2(buf1[i * 2], buf1[i * 2 + 1]),
					new Vec2(buf2[i * 2], buf2[i * 2 + 1]),
					simulationQuality, instant % simulationQuality);
			}
		}
	}

	//The provided time must come from the SolarSystemTimeManager
	renderBodies(renderer: Renderer, camera: Camera, time: number) {
		//Draw planets
		for (let i = 0; i < this.bodies.length; ++i) {

			let scale = 0;
			if (i === 0) { //Use a different scale for the Sun so that it doesn't overlap planets
				scale = 1 + 5 * SolarSystemSimulation.settings.bodyRadius;
			} else if (i <= 4) {
				scale = 1 + 200 * SolarSystemSimulation.settings.bodyRadius;
			} else { //Use a different scale for gas (and ice) giants
				scale = 1 + 50 * SolarSystemSimulation.settings.bodyRadius;
			}

			let geometry = this.bodies[i].geometry.map((point: Vec2) => {
				return camera.pointToScreenPosition(this.bodies[i].transformVertex(
					point.scale(this.bodyCharacteristics[i].radius * scale)));
			});
			renderer.renderPolygon(geometry, this.bodyCharacteristics[i].color);
		}

		if (!SolarSystemSimulation.settings.seeOrbits)
			return;

		renderer.ctx.strokeStyle = "#fff";
		renderer.ctx.lineWidth = 1;

		//Draw orbits
		for (let i = 0; i < this.bodies.length; ++i) {
			let frameNumber: number = Math.floor(time /
				SolarSystemSimulation.settings.simulationQuality) + 1;
			let frame = this.parallelWorker.getFrame(frameNumber);
			let elapsed = 0;

			renderer.ctx.beginPath();
			let position: Vec2 = this.bodies[i].r;
			let cameraPosition = camera.pointToScreenPosition(position);
			renderer.ctx.moveTo(cameraPosition.x, cameraPosition.y);

			let limitAngle: number = SINGLE_ORBIT_ANGLE[SolarSystemSimulationQuality[
					SolarSystemSimulation.settings.simulationQuality]];	

			while (frame !== null) {
				let positionFloats = new Float64Array(frame);
				position = new Vec2(positionFloats[i * 2], positionFloats[i * 2 + 1]);
				cameraPosition = camera.pointToScreenPosition(position);

				renderer.ctx.lineTo(cameraPosition.x, cameraPosition.y);

				if (SolarSystemSimulation.settings.singleOrbits && i !== 0) {
					//Check if the planet has completed one orbit to stop drawing it
					if (elapsed >= 80 * 86400000 && i <= 4 || elapsed >= 4000 * 86400000) {
						let vectorOrbit = position.subtract(this.bodies[0].r);
						let vectorReal = this.bodies[i].r.subtract(this.bodies[0].r);

						//Angle from dot product between the vectors going from the Sun to the
						//current planet position and to the orbit point being drawn.
						let angle = Math.acos(vectorOrbit.dotProduct(vectorReal) /
							(vectorOrbit.norm() * vectorReal.norm()));

						//A small angle means close enough to the planet to stop drawing the orbit.
						if (angle < limitAngle)
							break;
					}
				}

				frameNumber++;
				frame = this.parallelWorker.getFrame(frameNumber); //TODO - can be optimized
				elapsed += SolarSystemSimulation.settings.simulationQuality;
			}

			renderer.ctx.stroke();
		}
	}
}