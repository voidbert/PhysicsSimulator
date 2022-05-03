class SolarSystemPlanetCharacteristics {
	public radius: number; //In meters
	public color: string; //CSS / canvas color

	constructor(radius: number = 1, color: string = "#fff") {
		this.radius = radius;
		this.color = color;
	}
}

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
			SIMULATION_QUALITY, 
			(w: Worker, data: any) => {
				this.parallelWorker.addBuffer(
					new NumberedBuffer(this.bufferCount, data.size, data.buf, bodies.length * 16));
				this.bufferCount++;
			},
			128, 8
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

		this.parallelWorker.start({ bodies: this.bodies }, SIMULATION_QUALITY);
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
		for (let i = 0; i < this.bodies.length; ++i) {
			let scale = i === 0 ? 1 : 1000; //TODO - option radius multiplier

			//Draw planet
			let geometry = this.bodies[i].geometry.map((point: Vec2) => {
				return camera.pointToScreenPosition(this.bodies[i].transformVertex(
					point.scale(this.bodyCharacteristics[i].radius * scale)));
			});
			renderer.renderPolygon(geometry, this.bodyCharacteristics[i].color);

			//Draw orbit
			let frameNumber: number = Math.floor(time / SIMULATION_QUALITY);
			let frame = this.parallelWorker.getFrame(frameNumber);

			renderer.ctx.strokeStyle = "#fff";
			renderer.ctx.beginPath();
			let position = camera.pointToScreenPosition(this.bodies[i].r);
			renderer.ctx.moveTo(position.x, position.y);

			while (frame !== null) {
				let positionFloats = new Float64Array(frame);
				position = new Vec2(positionFloats[i * 2], positionFloats[i * 2 + 1]);
				position = camera.pointToScreenPosition(position);

				renderer.ctx.lineTo(position.x, position.y);

				frameNumber++;
				frame = this.parallelWorker.getFrame(frameNumber);
			}

			renderer.ctx.stroke();
		}
	}
}