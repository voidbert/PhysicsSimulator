//Utilities needed for web workers (they should import this script)

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