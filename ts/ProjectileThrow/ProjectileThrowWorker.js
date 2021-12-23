//Declare a window object (to avoid problems) and import the other script
window = { addEventListener: () => {}, devicePixelRatio: 1 };
importScripts("../../pages/ProjectileThrow/compiledJS.js");

//Objects coming from message events don't contain methods. Create objects with the needed function
//from the values in the original objects.
function convertVec2(value) {
	return new Vec2(value.x, value.y);
}

function convertVec2Array(values) {
	return values.map((v) => {
		return new Vec2(v.x, v.y);
	});
}

function convertBody(body) {
	let ret = new Body(body.mass, convertVec2Array(body.geometry), convertVec2(body.r));
	ret.v = convertVec2(body.v);
	ret.forces = convertVec2Array(body.forces);

	return ret;
}

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
	if (e.data.projectile) {
		projectile = convertBody(e.data.projectile);
		totalSimulationTicks = -1; // -1 not not count t = 0
		maxHeight = 0;
	}	
	if (e.data.simulationQuality)
		simulationQuality = e.data.simulationQuality;
	if (e.data.heightReference)
		heightReference = e.data.heightReference;
	if (e.data.bufferSize)
		bufferSize = e.data.bufferSize;
	if (e.data.allowedBuffers)
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