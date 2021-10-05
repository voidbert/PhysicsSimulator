let bodies: Body[] = [];

let mousePos = new Vec2();

function render(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
	ctx.fillStyle = "#FF0000";
	ctx.fillRect(mousePos.x - 32, mousePos.y - 32, 64, 64);
}

window.addEventListener("mousemove", function(e) {
	mousePos = new Vec2(e.x, e.y);
});

window.addEventListener("load", function() {
	let renderer: Renderer =
		new Renderer(window, document.getElementById("canvas") as HTMLCanvasElement, render);
	renderer.renderLoop();
});