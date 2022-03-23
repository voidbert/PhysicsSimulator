importScripts("../WebWorkerUtils.js");
importScripts("../../pages/SolarSystem/compiledJS.js");

let bodies;

let simulationQuality;
let bufferSize;
let allowedBuffers;
let totalSimulationTicks = 0;

self.addEventListener("message", (e) => {

	if ("bodies" in e.data) {
		bodies = Array(e.data.bodies.length);
		for (let i = 0; i < e.data.bodies.length; ++i) {
			bodies[i] = convertBody(e.data.bodies[i]);
		}
	}
	if ("simulationQuality" in e.data)
		simulationQuality = e.data.simulationQuality;
	if ("bufferSize" in e.data)
		bufferSize = e.data.bufferSize;
	if ("allowedBuffers" in e.data)
		allowedBuffers = e.data.allowedBuffers;

	const SNAPSHOT_SIZE = bodies.length * 16; // sizeof(Vec2) = 16 bytes

	//Create the buffers with the body positions that will be sent
	let buffer = new ArrayBuffer(bufferSize * SNAPSHOT_SIZE);
	let view = new Float64Array(buffer);
	//The number of snapshots written to the buffer (a snapshot contains the position of all bodies)
	let bufferUsedSnapshots = 0;
	let sessionUsedBuffers = 0; //The number of buffers posted since allowedBuffers was updated

	while (sessionUsedBuffers < allowedBuffers) { //While not all allowed buffers were sent

		//Write the current snapshot to the buffer
		let snapshotStart = bufferUsedSnapshots * bodies.length * 2; //2 numbers (1 Vec2) per body
		for (let i = 0; i < bodies.length; ++i) {
			view[snapshotStart + i * 2] = bodies[i].r.x;
			view[snapshotStart + i * 2 + 1] = bodies[i].r.y;
		}
		bufferUsedSnapshots++;

		if (bufferUsedSnapshots === bufferSize) {
			//Buffer is full. Message it to the window and recreate it.
			postMessage({ size: bufferUsedSnapshots * SNAPSHOT_SIZE, buf: buffer }, [buffer]);

			buffer = new ArrayBuffer(bufferSize * 8);
			view = new Float64Array(buffer);
			bufferUsedSnapshots = 0;
			sessionUsedBuffers++;
		}

		for (let i = 0; i < bodies.length; ++i) {
			bodies[i].step(simulationQuality);
		}

		totalSimulationTicks++;
	}
});