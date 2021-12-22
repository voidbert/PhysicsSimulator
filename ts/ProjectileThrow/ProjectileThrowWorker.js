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
let bufferSize;
let allowedBuffers;

//Keep track of the maximum height of the projectile
let maxHeight = 0;

self.addEventListener("message", (e) => {
	//This is initialization data
	if (e.data.projectile)
		projectile = convertBody(e.data.projectile);
	if (e.data.simulationQuality)
		simulationQuality = e.data.simulationQuality;
	if (e.data.heightReference)
		heightReference = e.data.heightReference;
	if (e.data.bufferSize)
		bufferSize = e.data.bufferSize;
	if (e.data.allowedBuffers)
		allowedBuffers = e.data.allowedBuffers;

	let buffer = new ArrayBuffer(bufferSize * 16); // sizeof(number) = 8 bytes, Vec2 has 2 numbers
	let view = new DataView(buffer, 0, bufferSize * 16);
	let bufferUsedVec2s = 0; //The number of Vec2s written to the buffer
	let fullyUsedBuffers = 0; //The number of buffers posted

	while (fullyUsedBuffers < allowedBuffers) {
		view.setFloat64(bufferUsedVec2s * 16, projectile.r.x, true);
		view.setFloat64(bufferUsedVec2s * 16 + 8, projectile.r.y, true);
		bufferUsedVec2s++;
	
		if (projectile.r.y > maxHeight) {
			maxHeight = projectile.r.y;
		}
	
		if (bufferUsedVec2s === bufferSize) {
			//Buffer is full. Message it and recreate it.
			postMessage(buffer, [buffer]);
			buffer = new ArrayBuffer(bufferSize * 16);
			view = new DataView(buffer, 0, bufferSize * 16);
			bufferUsedVec2s = 0;
			fullyUsedBuffers++;
		}
	
		if (ProjectileThrowTrajectory.bodyReachedGround(projectile, heightReference)) {
			postMessage(buffer, [buffer]);
	
			let results = new ProjectileThrowResults();
			results.time = //-1 removes the point at t = 0
				(fullyUsedBuffers * bufferSize + bufferUsedVec2s - 1) * simulationQuality;
			results.distance = projectile.r.x;
			results.maxHeight = maxHeight;
	
			postMessage(results);
			break;
		}
	
		projectile.step(simulationQuality);

		//This loop doesn't allow the message to arrive
	}
});