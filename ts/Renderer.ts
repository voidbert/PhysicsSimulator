class Renderer {
	readonly canvas: HTMLCanvasElement;
	readonly ctx: CanvasRenderingContext2D;
	private renderCallback: (renderer: Renderer) => any;

	//This constructor should only be called after the window loaded. The provided <canvas> will be
	//resized to fill the window whenever it is resized.
	constructor(window: Window, canvas: HTMLCanvasElement,
		renderCallback: (renderer: Renderer) => any) {

		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.renderCallback = renderCallback;

		canvas.width  = window.innerWidth * window.devicePixelRatio;
		canvas.height = window.innerHeight * window.devicePixelRatio;
		window.addEventListener("resize", function() {
			canvas.width  = window.innerWidth * window.devicePixelRatio;
			canvas.height = window.innerHeight * window.devicePixelRatio;
		});
	}

	//A helper function that renders a polygon (set of vertices) to the canvas. If the color is left
	//unset, ctx.fillStyle will be used to fill the polygon.
	renderPolygon(vertices: Vec2[], color: string = "") {
		if (vertices.length === 0) {
			return;
		}

		if (color !== "") {
			this.ctx.fillStyle = color;
		}

		this.ctx.beginPath();

		this.ctx.moveTo(vertices[0].x, vertices[0].y);
		for (let i: number = 1; i < vertices.length; ++i) {
			this.ctx.lineTo(vertices[i].x, vertices[i].y);
		}
		this.ctx.moveTo(vertices[0].x, vertices[0].y);

		this.ctx.closePath();
		this.ctx.fill();
	}

	//Starts the rendering loop.
	renderLoop(): void {
		//Weird trick to avoid stack overflows (requestAnimationFrame and wait until the frame is
		//rendered).
		let canRenderFrame: boolean = true;
		setInterval(() => {
			//Wait until the next frame is rendered before asking to render another one.
			if (canRenderFrame) {
				canRenderFrame = false;
				requestAnimationFrame(() => {
					this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
					this.renderCallback(this);
					canRenderFrame = true;
				});
			}
		}, 10);
	}
}