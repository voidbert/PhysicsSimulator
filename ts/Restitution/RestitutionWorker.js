importScripts("../WebWorkerUtils.js");
importScripts("../../pages/Restitution/compiledJS.js");

let body;
let settings;

let simulationQuality;
let bufferSize;
let allowedBuffers;
let totalSimulationTicks;

//Creates a settings object with data from the window. Not all properties will be copied
//(only physics related ones).
function convertRestitutionSettings(settings) {
	//Creating the object in the worker allows access to getters and setters
	let converted = new RestitutionSettings();

	converted._h0 = settings._h0;
	converted._coefficient = settings._coefficient;

	converted._simulationQuality = settings._simulationQuality;
	converted._graphProperty = settings._graphProperty;

	return converted;
}

//-1 is return if an error occurs
function calculateNextTheoreticalCollision(body, lastCollision) {
	//y = y0 + vy * t + 0.5 * a * t^2 (y = 0 -> ground reached)
	let solutions = ExtraMath.solveQuadratic(-0.5 * GRAVITY, body.v.y, body.r.y);
	if (solutions.length === 0) {
		//Fatal error. Communicate it to the main thread.
		postMessage(new Error("Falha no cálculo de resultados teóricos - quadrática sem soluções!"));
		return -1;
	} else {
		return Math.max(...solutions) + lastCollision;
	}
}

self.addEventListener("message", (e) => {
	if ("body" in e.data) {
		body = convertBody(e.data.body);
		totalSimulationTicks = 0;
		errorAvg = 0;
	}
	if ("settings" in e.data) {
		settings = convertRestitutionSettings(e.data.settings);
	}
		
	if ("simulationQuality" in e.data)
		simulationQuality = e.data.simulationQuality;
	if ("bufferSize" in e.data)
		bufferSize = e.data.bufferSize;
	if ("allowedBuffers" in e.data)
		allowedBuffers = e.data.allowedBuffers;

	//Create the buffers with the body graph y axis values that will be sent
	// sizeof(number) * 2 (theoretical & simulated) = 16 bytes
	let buffer = new ArrayBuffer(bufferSize * 16);
	let view = new Float64Array(buffer);
	let bufferUsedPoints = 0; //The number of numbers written to the buffer
	let sessionUsedBuffers = 0; //The number of buffers posted since allowedBuffers was updated

	let lastCollision = 0; //The time when the last collision happened

	let lastTheoreticalCollision = 0;
	let nextTheoreticalCollision = 0;

	let theoreticalBody = new Body(body.mass, [], body.r);
	theoreticalBody.v = body.v;
	theoreticalBody.forces = body.forces;

	nextTheoreticalCollision =
		calculateNextTheoreticalCollision(theoreticalBody, lastTheoreticalCollision);
	if (nextTheoreticalCollision === -1) {
		return;
	}

	while (sessionUsedBuffers < allowedBuffers) { //While not all allowed buffers were sent
		let point, theoreticalPoint;

		let time = totalSimulationTicks * simulationQuality * 0.001;
		while (time > nextTheoreticalCollision) {
			lastTheoreticalCollision = nextTheoreticalCollision;

			// At height = 0, the body only has kinetic energy. So:
			// E_kinetic = E_potential + E_kineticTop 
			// 0.5 * m * v^2 = m * g * h + 0.5 * m * v_initial^2
			// 0.5 * v^2 = g * h + 0.5 * v_initial^2
			// v = sqrt( 2 * g * h + v_initial^2 )

			let v = Math.sqrt(2 * GRAVITY * theoreticalBody.r.y + theoreticalBody.v.y * theoreticalBody.v.y);
			theoreticalBody.r = new Vec2(0, 0);
			theoreticalBody.v = new Vec2(0, v * settings._coefficient);

			nextTheoreticalCollision =
				calculateNextTheoreticalCollision(theoreticalBody, lastTheoreticalCollision);
			if (nextTheoreticalCollision === -1) {
				return;
			}
		}
		time -= lastTheoreticalCollision;

		switch (settings._graphProperty) {
			case RestitutionGraphProperty.Y:
				point = body.r.y;
				theoreticalPoint = -0.5 * GRAVITY * time * time + theoreticalBody.v.y * time +
					theoreticalBody.r.y;
				break;

			case RestitutionGraphProperty.Velocity:
				point = Math.abs(body.v.y);
				theoreticalPoint = Math.abs(-GRAVITY * time + theoreticalBody.v.y);
				break;
		}

		//Add the current body property to the buffer
		view[bufferUsedPoints * 2] = point;
		view[bufferUsedPoints * 2 + 1] = theoreticalPoint;

		bufferUsedPoints++;

		if (bufferUsedPoints === bufferSize) {
			//Buffer is full. Message it to the window and recreate it.
			postMessage({ size: bufferUsedPoints * 16, buf: buffer }, [buffer]);

			buffer = new ArrayBuffer(bufferSize * 16);
			view = new Float64Array(buffer);
			bufferUsedPoints = 0;
			sessionUsedBuffers++;
		}

		//Collided with the floor. Change the object's velocity.
		if (body.r.y <= 0) {
			body.v = new Vec2(0, -body.v.y * settings._coefficient);
			body.r = new Vec2(0, 0);

			if (totalSimulationTicks * settings._simulationQuality - lastCollision <= 50) {
				//The ball is almost stopping (collisions too close to each other in time). End the
				//simulation.
				postMessage({ size: bufferUsedPoints * 16, buf: buffer }, [buffer]);
				break;
			}

			lastCollision = totalSimulationTicks * settings._simulationQuality;
		}

		body.step(simulationQuality);
		totalSimulationTicks++;
	}

	postMessage("DONE");
});