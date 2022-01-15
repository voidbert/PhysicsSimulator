importScripts("../WebWorkerUtils.js");
importScripts("../../pages/Parachute/compiledJS.js");

let body;
let settings;

let simulationQuality;
let bufferSize;
let allowedBuffers;
let totalSimulationTicks;

self.addEventListener("message", (e) => {
	if ("body" in e.data) {
		body = convertBody(e.data.body);
		totalSimulationTicks = 0;
	}
	if ("settings" in e.data)
		settings = e.data.settings;
	if ("simulationQuality" in e.data)
		simulationQuality = e.data.simulationQuality;
	if ("bufferSize" in e.data)
		bufferSize = e.data.bufferSize;
	if ("allowedBuffers" in e.data)
		allowedBuffers = e.data.allowedBuffers;

	//Create the buffers with the body positions that will be sent
	let buffer = new ArrayBuffer(bufferSize * 8); // sizeof(number) = 8 bytes
	let view = new Float64Array(buffer);
	let bufferUsedFloats = 0; //The number of numbers written to the buffer
	let sessionUsedBuffers = 0; //The number of buffers posted since allowedBuffers was updated

	while (sessionUsedBuffers < allowedBuffers) { //While not all allowed buffers were sent

		if (body.forces.length === 0) {
			body.forces = [ new Vec2(0, -settings._mass * GRAVITY), new Vec2() ];
		}

		//Only send one tenth of the points to the page (window context)
		if (totalSimulationTicks % PARACHUTE_SIMULATION_SKIPPED_FACTOR === 0) {

			//Add the current body property to the buffer (property added depends on the settings)
			switch (settings._graphProperty) {
				case ParachuteGraphProperty.Y:
					view[bufferUsedFloats] = body.r.y;
					break;

				case ParachuteGraphProperty.R:
					view[bufferUsedFloats] = settings._h0 - body.r.y;
					break;

				case ParachuteGraphProperty.Velocity:
					view[bufferUsedFloats] = -body.v.y;
					break;

				case ParachuteGraphProperty.AirResistance:
					view[bufferUsedFloats] = body.forces[1].y;
					break;

				case ParachuteGraphProperty.ResultantForce:
					view[bufferUsedFloats] = Math.abs(settings._mass * GRAVITY - body.forces[1].y);
					break;

				case ParachuteGraphProperty.Acceleration:
					view[bufferUsedFloats] = Math.abs(settings._mass * GRAVITY - body.forces[1].y)
						/ body.mass;
					break;
			}
	
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

		if (body.r.y <= 0) {
			//Reached the ground. Send the remaining data.
			postMessage({ size: bufferUsedFloats * 8, buf: buffer }, [buffer]);
			break;
		}

		body.forces = [ new Vec2(0, -settings._mass * GRAVITY), new Vec2() ];

		if (body.r.y >= settings._hopening) {
			//After the parachute is opened
			body.forces[1] =
				new Vec2(0, 0.5 * settings._cd0 * AIR_DENSITY * settings._A0 * body.v.y * body.v.y);
		} else {
			//Before the parachute is opened
			body.forces[1] =
				new Vec2(0, 0.5 * settings._cd1 * AIR_DENSITY * settings._A1 * body.v.y * body.v.y);
		}

		body.step(simulationQuality);
		totalSimulationTicks++;
	}

	postMessage("DONE");
});