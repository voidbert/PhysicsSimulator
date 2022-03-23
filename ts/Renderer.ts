class Renderer {
	readonly canvas: HTMLCanvasElement;
	readonly ctx: CanvasRenderingContext2D;
	private renderCallback: (renderer: Renderer) => any;
	private resizeCallback: (renderer: Renderer) => any;
	
	private lastDevicePixelRatio: number; //Keep track of this 

	//This constructor should only be called after the window is loaded. resizeCallback will be
	//called on window.onresize and when the window is zoomed in / out (devicePixelRatio changes) if
	//the render loop is running.
	constructor(window: Window, canvas: HTMLCanvasElement,
		renderCallback: (renderer: Renderer) => any, resizeCallback: (renderer: Renderer) => any) {

		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.renderCallback = renderCallback;
		this.resizeCallback = resizeCallback;

		window.addEventListener("resize", () => {
			resizeCallback(this);
		});

		this.lastDevicePixelRatio = window.devicePixelRatio;
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

	//Renders a set of lines to the screen. For example, given the vertices {A, B, C, D, E, F}, the
	//following lines will be drawn: (A, B), (C, D), (E, F), meaning that the last point from a line
	//isn't used as the first point for the next one. If the color is left unset, ctx.strokeStyle
	//will be used to draw the line. If lineWidth is -1, ctx.lineWidth will be used.
	renderLines(vertices: Vec2[], color: string = "", lineWidth: number = -1) {
		if (vertices.length < 2) {
			return;
		}

		if (color !== "") {
			this.ctx.strokeStyle = color;
		}

		if (lineWidth !== -1) {
			this.ctx.lineWidth = lineWidth;
		}

		//Draw the lines
		this.ctx.beginPath();
		for (let i: number = 0; i < vertices.length; i += 2) {
			this.ctx.moveTo(vertices[i].x,     vertices[i].y);
			this.ctx.lineTo(vertices[i + 1].x, vertices[i + 1].y);
		}
		this.ctx.closePath();
		this.ctx.stroke();
	}

	//Renders a set of lines to the screen. For example, given the vertices {A, B, C, D}, the
	//following lines will be drawn: (A, B), (B, C), (C, D), meaning that the last point from a line
	//is used as the first point for the next one. If the color is left unset, ctx.strokeStyle will
	//be used to draw the line. If lineWidth is -1, ctx.lineWidth will be used.
	renderLinesStrip(vertices: Vec2[], color: string = "", lineWidth: number = -1) {
		if (vertices.length < 2) {
			return;
		}

		if (color !== "") {
			this.ctx.strokeStyle = color;
		}

		if (lineWidth !== -1) {
			this.ctx.lineWidth = lineWidth;
		}

		//Draw the lines
		this.ctx.beginPath();
		this.ctx.moveTo(vertices[0].x, vertices[0].y);
		for (let i: number = 1; i < vertices.length; i++) {
			this.ctx.lineTo(vertices[i].x, vertices[i].y);
		}
		this.ctx.stroke();
	}

	//Renders (single- or multi-line) text to the canvas using textBaseline = "top". If the color or
	//the font is left unset, the rendering context's color and font font will be used. The font
	//size must be provided in px or in rem.
	renderText(text: string, position: Vec2, lineSpacing: number = 1.5, color: string = "",
		font: string = "") {

		if (color !== "") {
			this.ctx.fillStyle = color;
		}

		if (font !== "") {
			this.ctx.font = font;
		}

		this.ctx.textBaseline = "top";

		let lineHeight = this.fontHeight;
		let lines: string[] = text.split("\n");
		for (let i: number = 0; i < lines.length; ++i) {
			this.ctx.fillText(lines[i], position.x, position.y);
			position = position.add(new Vec2(0, lineHeight * lineSpacing));
		}
	}

	//Renders (single-line) text to the canvas using textBaseline = "top" and renderer.ctx.textAlign
	//= "left". The font size must be provided in px or in rem. Before drawing the text, a rectangle
	//will be filled behind it. If text measurements aren't provided, they will be calculated.
	renderTextWithBackground(text: string, position: Vec2, backgroundColor: string,
		textMeasurements: Vec2 = new Vec2(Infinity, Infinity), color: string = "",
		font: string = "") {

		this.ctx.textAlign = "left";
		this.ctx.textBaseline = "top";

		if (color !== "") {
			this.ctx.fillStyle = color;
		}

		if (font !== "") {
			this.ctx.font = font;
		}

		if (textMeasurements.x === Infinity && textMeasurements.y === Infinity) {
			textMeasurements = new Vec2(this.ctx.measureText(text).width, this.fontHeight);
		}

		//Render a rectangle behind the text
		this.ctx.fillStyle = backgroundColor;
		this.ctx.fillRect(position.x, position.y, textMeasurements.x, textMeasurements.y);

		//Draw the text
		this.ctx.fillStyle = color;
		this.ctx.fillText(text, position.x, position.y);
	}

	//Measures the height of the canvas font (if it is in px or in rem). The canvas' font will be
	//set to "10px sans-serif" if the provided font isn't in px or rem.
	get fontHeight(): number {
		//Split the canvas font and find its size (px or rem). Convert from rem to px if needed.
		let height: number = 0;
		let fontSplit = this.ctx.font.split(" ");
		for (let i: number = 0; i < fontSplit.length; ++i) {
			if (fontSplit[i].endsWith("px")) {
				height = parseFloat(fontSplit[i]);
				break;
			} else if (fontSplit[i].endsWith("rem")) {
				height = parseFloat(fontSplit[i]) *
					parseFloat(getComputedStyle(document.documentElement).fontSize);
				break;
			}
		}
		if (height === 0) {
			//Unknown height. Write an error to the console and use the default font.
			console.log("Unknown font size: using 10px sans-serif");
			height = 10;
			this.ctx.font = "10px sans-serif";
		}

		return height;
	}

	//Starts the rendering loop (calls renderCallback). resizeCallback is also called in the
	//beginning.
	renderLoop(): void {
		this.resizeCallback(this);

		//Weird trick to avoid stack overflows (requestAnimationFrame and wait until the frame is
		//rendered).
		let canRenderFrame: boolean = true;
		setInterval(() => {
			//Wait until the next frame is rendered before asking to render another one.
			if (canRenderFrame) {
				canRenderFrame = false;
				requestAnimationFrame(() => {
					//Zoom handling
					if (window.devicePixelRatio !== this.lastDevicePixelRatio) {
						this.lastDevicePixelRatio = window.devicePixelRatio;
						this.resizeCallback(this);
					}

					this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
					this.renderCallback(this);
					canRenderFrame = true;
				});
			}
		}, 10);
	}
}