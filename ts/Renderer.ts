class Renderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private renderCallback: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => any;

	//This constructor should only be called after the window loaded. The provided <canvas> will be
	//resized to fill the window whenever it is resized.
	constructor(window: Window, canvas: HTMLCanvasElement,
		renderCallback: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => any) {

		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.renderCallback = renderCallback;

		canvas.width  = window.innerWidth;
		canvas.height = window.innerHeight;
		window.addEventListener("resize", function() {
			canvas.width  = window.innerWidth;
			canvas.height = window.innerHeight;
		});
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
					this.renderCallback(this.canvas, this.ctx);
					canRenderFrame = true;
				});
			}
		}, 5);
	}
}