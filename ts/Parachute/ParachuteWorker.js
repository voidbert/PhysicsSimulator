importScripts("../WebWorkerUtils.js");
importScripts("../../pages/Parachute/compiledJS.js");

let body;
let settings;

let theoreticalResults;
let errorAvg;
let parachuteOpenedInstant = -1; //In seconds

let simulationQuality;
let bufferSize;
let allowedBuffers;
let totalSimulationTicks;

//Creates a settings object with data from the window. Not all properties will be copied
//(only physics related ones).
function convertParachuteSettings(settings) {
	//Creating the object in the worker allows access to getters and setters
	let converted = new ParachuteSettings();
	
	converted._mass = settings._mass;
	converted._h0   = settings._h0;
	converted._hopening = settings._hopening;
	converted._openingTime = settings._openingTime;

	converted._cd0 = settings._cd0; converted._A0 = settings._A0;
	converted._cd1 = settings._cd1; converted._A1 = settings._A1;

	converted._simulationQuality = settings._simulationQuality;
	converted._graphProperty = settings._graphProperty;

	return converted;
}

self.addEventListener("message", (e) => {
	if ("body" in e.data) {
		body = convertBody(e.data.body);
		totalSimulationTicks = 0;
		errorAvg = 0;
		parachuteOpenedInstant = -1;
	}
	if ("settings" in e.data) {
		settings = convertParachuteSettings(e.data.settings);
		theoreticalResults = ParachuteResults.calculateTheoreticalResults(settings);
	}
		
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

		let experimentalPoint, theoreticalPoint;

		switch (settings._graphProperty) {
			case ParachuteGraphProperty.Y:
				experimentalPoint = body.r.y;
				theoreticalPoint =
					theoreticalResults.y(totalSimulationTicks * simulationQuality * 0.001);
				break;

			case ParachuteGraphProperty.R:
				experimentalPoint = settings._h0 - body.r.y;
				theoreticalPoint =
					theoreticalResults.r(totalSimulationTicks * simulationQuality * 0.001);
				break;

			case ParachuteGraphProperty.Velocity:
				experimentalPoint = -body.v.y;
				theoreticalPoint =
					theoreticalResults.v(totalSimulationTicks * simulationQuality * 0.001);
				break;

			case ParachuteGraphProperty.AirResistance:
				experimentalPoint = body.forces[1].y;
				theoreticalPoint =
					theoreticalResults.Rair(totalSimulationTicks * simulationQuality * 0.001);
				break;

			case ParachuteGraphProperty.ResultantForce:
				experimentalPoint = Math.abs(settings._mass * GRAVITY - body.forces[1].y);
				theoreticalPoint =
					theoreticalResults.Fr(totalSimulationTicks * simulationQuality * 0.001);
				break;

			case ParachuteGraphProperty.Acceleration:
				experimentalPoint = Math.abs(settings._mass * GRAVITY - body.forces[1].y) / body.mass;
				theoreticalPoint =
					theoreticalResults.a(totalSimulationTicks * simulationQuality * 0.001);
				break;
		}

		//Only send one tenth of the points to the page (window context)
		if (totalSimulationTicks % PARACHUTE_SIMULATION_SKIPPED_FACTOR === 0) {
			//Add the current body property to the buffer
			view[bufferUsedFloats] = experimentalPoint;
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
			//Before the parachute is opened
			body.forces[1] =
				new Vec2(0, 0.5 * settings._cd0 * AIR_DENSITY * settings._A0 * body.v.y * body.v.y);

			//The theoretical results are only applicable before the parachute is opened

			//Compare the real and theoretical value for this point, calculating the error
			let error = ExtraMath.relativeError(experimentalPoint, theoreticalPoint);
			/// 0 -> consider the error to be 0
			if (theoreticalPoint === 0)
				error = 0;
			errorAvg = (errorAvg * totalSimulationTicks + error) / (totalSimulationTicks + 1);
		} else {
			//Register this instant if it is the first when the parachute's opened
			if (parachuteOpenedInstant === -1) {
				parachuteOpenedInstant = totalSimulationTicks * simulationQuality * 0.001;
			}

			let elapsedSinceOpening;

			if (settings._openingTime === 0) {
				//No parachute opening transition.
				body.forces[1] = new Vec2(0, 0.5 * settings._cd1 * AIR_DENSITY * settings._A1
					* body.v.y * body.v.y);
			} else {
				elapsedSinceOpening = totalSimulationTicks * simulationQuality * 0.001 -
				parachuteOpenedInstant;
					elapsedSinceOpening = Math.min(settings._openingTime, elapsedSinceOpening);

				body.forces[1] = new Vec2(0, 0.5 * AIR_DENSITY * body.v.y * body.v.y *
					ExtraMath.linearInterpolation(settings._cd0, settings._cd1, settings._openingTime, elapsedSinceOpening) *
					ExtraMath.linearInterpolation(settings._A0, settings._A1, settings._openingTime, elapsedSinceOpening));
			}
		}

		body.step(simulationQuality);
		totalSimulationTicks++;
	}

	//Post the simulation results
	postMessage({ errorAvg: errorAvg * 100 /*percentage*/, openedInstant: parachuteOpenedInstant });
});