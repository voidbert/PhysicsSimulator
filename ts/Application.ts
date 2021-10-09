let bodies: Body[] = [];

let bodyGeometry: Vec2[] = [
	new Vec2(32, 32),
	new Vec2(64, 32),
	new Vec2(64, 64),
	new Vec2(32, 64)
];

let mousePos = new Vec2();

function render(renderer: Renderer): void {
	renderer.renderPolygon(bodyGeometry, "#00FF00");
}

window.addEventListener("mousemove", function(e) {
	mousePos = new Vec2(e.x, e.y);
});

window.addEventListener("load", function() {
	let renderer: Renderer =
		new Renderer(window, document.getElementById("canvas") as HTMLCanvasElement, render);
	renderer.renderLoop();
});