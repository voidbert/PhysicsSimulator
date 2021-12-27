const MAX_GRID_SIZE: number = 64 * window.devicePixelRatio;

//A class made to render the x and y axes to the screen.
class AxisSystem {
	camera: Camera;

	showAxes: boolean; showArrows: boolean; onlyPositiveAxes: boolean;

	showUnitSeparationsX: boolean; showUnitLabelsX: boolean;
	showUnitSeparationsY: boolean; showUnitLabelsY: boolean;

	showHorizontalGrid: boolean; showVerticalGrid: boolean; onlyPositiveGrid: boolean;

	autoScaleX: boolean; autoScaleY: boolean;
	maxGridSizeX: number; maxGridSizeY: number;
	axesScale: Vec2;

	horizontalAxisName: string; verticalAxisName: string;

	axesColor: string; axesWidth: number; labelFont: string;
	gridColor: string; gridWidth: number;
	pageColor: string;

	// NOTES:
	// axesWidth is the width of the axis line in pixels
	//
	// showArrows, showUnitSeparations, showUnitLabels, showAxesLabels and onlyPositiveAxes will
	// only take effect if showAxes is true. Also, showUnitLabels will only take effect if
	// showUnitSeparations is true (for X and Y).
	//
	// axesScale will be modified if either autoScaleX or autoScaleY is on. axesScale must be in
	// world coordinates maxGridSizeX (and Y) will be used to calculate automatic axis scaling
	// (maximum size of a division).
	//
	// pageColor is the background color of the canvas. It is used to fill a rectangle behind axis
	// and unit labels.
	constructor(
		camera: Camera,
		showAxes: boolean, showArrows: boolean, onlyPositiveAxes: boolean,

		showUnitSeparationsX: boolean, showUnitLabelsX: boolean,
		showUnitSeparationsY: boolean, showUnitLabelsY: boolean,

		showHorizontalGrid: boolean, showVerticalGrid: boolean, onlyPositiveGrid: boolean,

		autoScaleX: boolean, autoScaleY: boolean,
		maxGridSizeX: number, maxGridSizeY: number, axesScale: Vec2,

		horizontalAxisName: string, verticalAxisName: string,

		axesColor: string, axesWidth: number, labelFont: string,
		gridColor: string, gridWidth: number,
		pageColor: string, ) {

		this.camera = camera;

		this.showAxes = showAxes;
		this.showArrows = showArrows;
		this.onlyPositiveAxes = onlyPositiveAxes;

		this.showUnitSeparationsX = showUnitSeparationsX; this.showUnitLabelsX = showUnitLabelsX;
		this.showUnitSeparationsY = showUnitSeparationsY; this.showUnitLabelsY = showUnitLabelsY;

		this.showHorizontalGrid = showHorizontalGrid; this.showVerticalGrid = showVerticalGrid;
		this.onlyPositiveGrid = onlyPositiveGrid;

		this.autoScaleX = autoScaleX; this.autoScaleY = autoScaleY;
		this.maxGridSizeX = maxGridSizeX; this.maxGridSizeY = maxGridSizeY;
		this.axesScale = axesScale;

		this.horizontalAxisName = horizontalAxisName; this.verticalAxisName = verticalAxisName;

		this.axesColor = axesColor;
		this.axesWidth = axesWidth;
		this.labelFont = labelFont;

		this.gridColor = gridColor;
		this.gridWidth = gridWidth;

		this.pageColor = pageColor;
	}

	//Gets the surface area (in world coordinates) that will be drawn to.
	private getBoundingRect(): Rect {
		return new Rect(
			this.camera.pointToWorldPosition(new Vec2(0, 0)),
			this.camera.pointToWorldPosition(this.camera.canvasSize)
		);
	}

	//True is returned if the line is rendered; false is returned otherwise.
	private drawXAxisBaseLine(renderer: Renderer, screenOrigin: Vec2): boolean {
		let minX: number; let maxX: number;

		if (this.onlyPositiveAxes) {
			minX = Math.max(0, screenOrigin.x); maxX = this.camera.canvasSize.x;
		} else {
			minX = 0; maxX = this.camera.canvasSize.x;
		}

		if (maxX > minX) {
			renderer.renderLines([ new Vec2(minX, screenOrigin.y), new Vec2(maxX, screenOrigin.y) ],
				this.axesColor, this.axesWidth);
			return true;
		}

		return false;
	}

	//True is returned if the line is rendered; false is returned otherwise.
	private drawYAxisBaseLine(renderer: Renderer, screenOrigin: Vec2): boolean {
		let minY: number; let maxY: number;

		if (this.onlyPositiveAxes) {
			minY = 0; maxY = Math.min(screenOrigin.y, this.camera.canvasSize.y);
		} else {
			minY = 0; maxY = this.camera.canvasSize.y;
		}

		if (maxY > minY) {
			renderer.renderLines([ new Vec2(screenOrigin.x, minY), new Vec2(screenOrigin.x, maxY) ],
				this.axesColor, this.axesWidth);
			return true;
		}

		return false;
	}

	private drawXArrow(renderer: Renderer, screenOrigin: Vec2) {
		renderer.renderPolygon([
			new Vec2(this.camera.canvasSize.x, screenOrigin.y),
			new Vec2(
				this.camera.canvasSize.x - this.axesWidth * 3.5,
				screenOrigin.y - this.axesWidth * 3.5
			),
			new Vec2(
				this.camera.canvasSize.x - this.axesWidth * 3.5,
				screenOrigin.y + this.axesWidth * 3.5
			),
		], this.axesColor);
	}

	private drawYArrow(renderer: Renderer, screenOrigin: Vec2) {
		renderer.renderPolygon([
			new Vec2(screenOrigin.x, 0),
			new Vec2(screenOrigin.x - this.axesWidth * 3.5, this.axesWidth * 3.5),
			new Vec2(screenOrigin.x + this.axesWidth * 3.5, this.axesWidth * 3.5),
		], this.axesColor);
	}

	private drawXName(renderer: Renderer, screenOrigin: Vec2) {
		//Measure the text to place it correctly
		let measure = new Vec2(
			renderer.ctx.measureText(this.horizontalAxisName).width,
			renderer.fontHeight
		);

		let position = new Vec2(
			this.camera.canvasSize.x - measure.x - 10, screenOrigin.y + 10 + this.axesWidth * 3.5
		);

		renderer.renderTextWithBackground(this.horizontalAxisName, position, this.pageColor,
			measure, this.axesColor, this.labelFont);
	}

	private drawYName(renderer: Renderer, screenOrigin: Vec2) {
		//Measure the text to place it correctly
		let measure = new Vec2(
			renderer.ctx.measureText(this.verticalAxisName).width, renderer.fontHeight
		);

		let position = new Vec2(screenOrigin.x - measure.x - 10 - this.axesWidth * 3.5, 10);

		renderer.renderTextWithBackground(this.verticalAxisName, position, this.pageColor, measure,
			this.axesColor, this.labelFont);
	}

	//Determines the automatic scaling for an axis (in world coordinates)
	private autoScale(maxGridSize: number): number {
		//Calculate the grid division
		let maxGridWorldSize = maxGridSize / this.camera.scale;
		let gridWorldSize = Math.floor(maxGridWorldSize);

		//If the scale is less than 1, flooring it would make it 0 and the app would crash. Let the
		//scale assume values in the sequence 0.5^n.
		if (gridWorldSize === 0) {
			let multiplier = Math.round(Math.log(maxGridWorldSize) / Math.log(0.5)); //log base 0.5
			gridWorldSize = Math.pow(0.5, multiplier);

			//Prevention measure. I think this won't happen but its better to get a wrong axis scale
			//than a complete program crash.
			if (gridWorldSize === 0) {
				gridWorldSize = 0.5;
			}
		}

		return gridWorldSize;
	}

	//Loops through all scale divisions between a range. The callback is called for every scale
	//division found in world coordinates. scale, start and end should also be provided in world
	//coordinates.
	private loopScale(scale: number, start: number, end: number, callback: (point: number) => any) {
		start -= start % scale; //Find first scale unit
		for (; start < end; start += scale) {
			callback(start);
		}
	}

	//point -> result from loopScale, a world coordinate value of x
	private drawXAxisUnitSeparator(renderer: Renderer, screenOrigin: Vec2, point: number) {
		let screenX: number = this.camera.pointToScreenPosition(new Vec2(point, 0)).x;

		renderer.renderLines([
			new Vec2(screenX, screenOrigin.y - this.axesWidth),
			new Vec2(screenX, screenOrigin.y + this.axesWidth),
		], this.axesColor, this.axesWidth);
	}

	//point -> result from loopScale, a world coordinate value of y
	private drawYAxisUnitSeparator(renderer: Renderer, screenOrigin: Vec2, point: number) {
		let screenY: number = this.camera.pointToScreenPosition(new Vec2(0, point)).y;

		renderer.renderLines([
			new Vec2(screenOrigin.x - this.axesWidth, screenY),
			new Vec2(screenOrigin.x + this.axesWidth, screenY),
		], this.axesColor, this.axesWidth);
	}

	//point -> result from loopScale, a world coordinate value of x
	private drawXUnitLabels(renderer: Renderer, screenOrigin: Vec2, point: number) {
		let measure = new Vec2(
			renderer.ctx.measureText(point.toString()).width, renderer.fontHeight);

		let screenX: number = this.camera.pointToScreenPosition(new Vec2(point, 0)).x;
		let position = new Vec2(screenX - measure.x / 2, screenOrigin.y + this.axesWidth + 10);

		renderer.renderTextWithBackground(point.toString(), position, this.pageColor,
			measure, this.axesColor, this.labelFont);
	}

	//point -> result from loopScale, a world coordinate value of y
	private drawYUnitLabels(renderer: Renderer, screenOrigin: Vec2, point: number) {
		let measure = new Vec2(
			renderer.ctx.measureText(point.toString()).width, renderer.fontHeight);

		let screenY: number = this.camera.pointToScreenPosition(new Vec2(0, point)).y;
		let position = new Vec2(
			screenOrigin.x - this.axesWidth - measure.x - 10, screenY - measure.y / 2
		);

		renderer.renderTextWithBackground(point.toString(), position, this.pageColor,
			measure, this.axesColor, this.labelFont);
	}

	drawAxes(renderer: Renderer) {
		//Text rendering parameters
		renderer.ctx.font = this.labelFont;

		//Not to draw out unnecessarily out of the canvas (boundingRect)
		let boundingRect: Rect = this.getBoundingRect();
		let screenOrigin: Vec2 = this.camera.pointToScreenPosition(new Vec2(0, 0));

		//Axes' auto scale if requested
		if (this.autoScaleX) {
			this.axesScale.x = this.autoScale(this.maxGridSizeX);
		}
		if (this.autoScaleY) {
			this.axesScale.y = this.autoScale(this.maxGridSizeY);
		}

		//Draw grid
		if (this.showHorizontalGrid &&
			!(this.onlyPositiveGrid && screenOrigin.y < 0)) {

			let bottom = boundingRect.bottom;
			let left = 0;
			if (this.onlyPositiveGrid) {
				bottom = Math.max(bottom, 0);
				left = screenOrigin.x;
			}

			this.loopScale(this.axesScale.y, bottom, boundingRect.top, (point) => {
				let screenY: number = this.camera.pointToScreenPosition(new Vec2(0, point)).y;

				//Draw a horizontal grid line
				renderer.renderLines(
					[new Vec2(left, screenY), new Vec2(this.camera.canvasSize.x, screenY)],
					this.gridColor, this.gridWidth
				);
			});
		}

		if (this.showVerticalGrid &&
			!(this.onlyPositiveGrid && screenOrigin.x > this.camera.canvasSize.x)) {

			let left = boundingRect.left;
			let bottom = this.camera.canvasSize.y;
			if (this.onlyPositiveGrid) {
				left = Math.max(left, 0);
				bottom = Math.min(bottom, screenOrigin.y);
			}

			//Don't draw grid lines if they're out of the screen
			this.loopScale(this.axesScale.x, left, boundingRect.right, (point) => {
				let screenX: number = this.camera.pointToScreenPosition(new Vec2(point, 0)).x;

				//Draw a vertical grid line
				renderer.renderLines(
					[new Vec2(screenX, 0), new Vec2(screenX, bottom)],
					this.gridColor, this.gridWidth
				);
			});		
		}

		//Draw axes
		if (this.showAxes) {
			//Only draw the X axis if it isn't out of the screen
			if (screenOrigin.y >= 0 && screenOrigin.y <= this.camera.canvasSize.y) {
				let canRenderArrow: boolean = this.drawXAxisBaseLine(renderer, screenOrigin);

				if (this.showUnitSeparationsX) {
					//Determine the first division to be drawn. Ignore negative ones if
					//onlyPositiveAxes is true
					let left = boundingRect.left;
					if (this.onlyPositiveAxes) {
						left = Math.max(left, 0);
					}

					this.loopScale(this.axesScale.x, left, boundingRect.right, (point) => {
						if (point != 0) //Don't draw at the origin
						{
							this.drawXAxisUnitSeparator(renderer, screenOrigin, point);

							if (this.showUnitLabelsX)
								this.drawXUnitLabels(renderer, screenOrigin, point);
						}
					});
				}

				if (canRenderArrow) {
					this.drawXName(renderer, screenOrigin);
					if (this.showArrows)
						this.drawXArrow(renderer, screenOrigin);
				}
			}

			//Only draw the Y axis if it isn't out of the screen
			if (screenOrigin.x >= 0 && screenOrigin.x <= this.camera.canvasSize.x) {

				let canRenderArrow: boolean = this.drawYAxisBaseLine(renderer, screenOrigin);

				if (this.showUnitSeparationsY) {
					//Determine the first division to be drawn. Ignore negative ones if
					//onlyPositiveAxes is true
					let bottom = boundingRect.bottom;
					if (this.onlyPositiveAxes) {
						bottom = Math.max(bottom, 0);
					}

					this.loopScale(this.axesScale.y, bottom, boundingRect.top, (point) => {
						if (point != 0) //Don't draw at the origin
						{
							this.drawYAxisUnitSeparator(renderer, screenOrigin, point);

							if (this.showUnitLabelsY)
								this.drawYUnitLabels(renderer, screenOrigin, point);
						}
					});
				}

				if (canRenderArrow) {
					this.drawYName(renderer, screenOrigin);
					if (this.showArrows)
						this.drawYArrow(renderer, screenOrigin);
				}
			}
		}
	}
}