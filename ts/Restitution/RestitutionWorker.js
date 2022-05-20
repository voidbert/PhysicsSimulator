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
	let buffer = new ArrayBuffer(bufferSize * 8); // sizeof(number) = 8 bytes
	let view = new Float64Array(buffer);
	let bufferUsedFloats = 0; //The number of numbers written to the buffer
	let sessionUsedBuffers = 0; //The number of buffers posted since allowedBuffers was updated

	let lastCollision = 0; //The time when the last collision happened

	while (sessionUsedBuffers < allowedBuffers) { //While not all allowed buffers were sent
		let point;

		switch (settings._graphProperty) {
			case RestitutionGraphProperty.Y:
				point = body.r.y;
				break;

			case RestitutionGraphProperty.Velocity:
				point = Math.abs(body.v.y);
				break;
		}

		//Only send one tenth of the points to the page (window context)
		if (totalSimulationTicks % RESTITUTION_SIMULATION_SKIPPED_FACTOR === 0) {
			//Add the current body property to the buffer
			view[bufferUsedFloats] = point;
			bufferUsedFloats++;
		}

		if (bufferUsedFloats === bufferSize) {
			//Buffer is full. Message it to the window and recreate it.
			postMessage({ size: bufferUsedFloats * 8, buf: buffer }, [buffer]);

			buffer = new ArrayBuffer(bufferSize * 8);
			view = new Float64Array(buffer);
			bufferUsedFloats = 0;
			sessionUsedBuffers++;
		}

		//Collided with the floor. Change the object's velocity.
		if (body.r.y <= 0) {
			body.v = new Vec2(0, -body.v.y * settings._coefficient);
			body.r = new Vec2(0, 0);

			if (totalSimulationTicks * settings._simulationQuality - lastCollision <= 50) {
				//The ball is almost stopping (collisions too close to each other in time). End the
				//simulation.
				postMessage({ size: bufferUsedFloats * 8, buf: buffer }, [buffer]);
				break;
			}

			lastCollision = totalSimulationTicks * settings._simulationQuality;
		}

		body.step(simulationQuality);
		totalSimulationTicks++;
	}

	postMessage("DONE");
});