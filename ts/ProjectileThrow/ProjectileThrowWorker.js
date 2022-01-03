importScripts("../WebWorkerUtils.js");
importScripts("../../pages/ProjectileThrow/compiledJS.js");

let projectile;
let simulationQuality;
let heightReference;
let maxHeight = 0; //Keep track of the maximum height of the projectile

let bufferSize;
let allowedBuffers;
let totalSimulationTicks;

self.addEventListener("message", (e) => {
	//Types of messages:
	// - Object will all the data (projectile, simulationQuality, etc.)
	// - Permission to process and send more buffers (only allowedBuffers)
	if ("projectile" in e.data) {
		projectile = convertBody(e.data.projectile);
		totalSimulationTicks = -1; // -1 not not count t = 0
		maxHeight = 0;
	}	
	if ("simulationQuality" in e.data)
		simulationQuality = e.data.simulationQuality;
	if ("heightReference" in e.data)
		heightReference = e.data.heightReference;
	if ("bufferSize" in e.data)
		bufferSize = e.data.bufferSize;
	if ("allowedBuffers" in e.data)
		allowedBuffers = e.data.allowedBuffers;

	//Create the buffers with the body positions that will be sent
	let buffer = new ArrayBuffer(bufferSize * 16); // sizeof(number) = 8 bytes, Vec2 has 2 numbers
	let view = new Float64Array(buffer);
	let bufferUsedVec2s = 0; //The number of Vec2s written to the buffer
	let sessionUsedBuffers = 0; //The number of buffers posted since allowedBuffers was updated

	while (sessionUsedBuffers < allowedBuffers) { //While not all allowed buffers were sent
		//Add the current projectile position to the buffer
		view[bufferUsedVec2s * 2] = projectile.r.x;
		view[bufferUsedVec2s * 2 + 1] = projectile.r.y;
		bufferUsedVec2s++;
		totalSimulationTicks++;

		//Check if a new maximum height has been reached
		if (projectile.r.y > maxHeight) {
			maxHeight = projectile.r.y;
		}
	
		if (bufferUsedVec2s === bufferSize) {
			//Buffer is full. Message it to the window and recreate it.
			postMessage({ size: bufferUsedVec2s * 16, buf: buffer }, [buffer]);

			buffer = new ArrayBuffer(bufferSize * 16);
			view = new Float64Array(buffer);
			bufferUsedVec2s = 0;

			sessionUsedBuffers++;
		}
	
		if (ProjectileThrowTrajectory.bodyReachedGround(projectile, heightReference) &&
			totalSimulationTicks !== 0) { //totalSimulationTicks !== 0 -> allow launch height of 0m
			//The body reached the ground. Stop the simulation and send any data left unsent
			postMessage({ size: bufferUsedVec2s * 16, buf: buffer }, [buffer]);

			//Send the experimental theoretical results and stop the loop
			let experimentalResults = new ProjectileThrowResults();
			experimentalResults.time = (totalSimulationTicks - 1) * simulationQuality;
			experimentalResults.distance = projectile.r.x;
			experimentalResults.maxHeight = maxHeight;
	
			postMessage(experimentalResults);
			break;
		}
	
		projectile.step(simulationQuality);
	}
});