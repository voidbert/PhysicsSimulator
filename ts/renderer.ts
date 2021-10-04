let canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
let ctx: CanvasRenderingContext2D = undefined;

//When called, this function will keep rendering contents to the canvas.
function renderLoop() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	requestAnimationFrame(renderLoop);
}

//Resize the canvas whenever the window is resized.
function resizeCallback() {
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCallback);

window.addEventListener("load", function() {
	ctx = canvas.getContext("2d", { alpha: false });
	resizeCallback(); //Initialize the canvas by simulating a resize.

	renderLoop();
});