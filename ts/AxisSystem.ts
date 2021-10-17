const MAX_GRID_SIZE: number = 64;

//A class made to render the x and y axes to the screen.
class AxisSystem {
	camera: Camera;

	drawArrows: boolean;
	axisColor: string;
	axisWidth: number;

	showGrid: boolean;
	gridColor: string;
	gridWidth: number;

	showAxisLabels: boolean;
	showUnitLabels: boolean;
	labelFont: string;

	pageBackgroundColor: string;

	onlyPositive: boolean;

	//The AxisSystem keeps the coordinates of the lines to be drawn cached, so that these don't have
	//to be generated every frame. See AxisSystem.updateCaches().
	private cachedAxesBaseLines: Vec2[] = [];
	private cachedArrowPolygons: Vec2[][] = [];
	private cachedAxesScale: { gridWorldSize: number, gridScreenSize: number };
	private cachedAxesScaleLines: Vec2[] = [];
	private cachedGridLines: Vec2[] = [];

	//margin -> the number of pixels from the end of the axis (positive and negative) and the
	//borders of the camera's rendering area.
	//drawArrows -> whether or not to draw arrows showing the positive orientation
	//onlyPositive -> if true, only the positive parts of the axes.
	//
	//labelFont MUST BE in px or in rem.
	//
	//The constructor doesn't generate the axes' caches. Do that when you are sure the camera has a
	//set canvasSize
	constructor(camera: Camera, drawArrows: boolean = false, axisColor: string = "#000000",
		axisWidth = 2, showGrid: boolean = false, gridColor: string = "#cccccc",
		gridWidth: number = 1, showAxisLabels: boolean = false, showUnitLabels: boolean = false,
		labelFont: string, pageBackgroundColor: string = "#ffffff", onlyPositive: boolean = true) {

		this.camera = camera;

		this.drawArrows = drawArrows;
		this.axisColor = axisColor;
		this.axisWidth = axisWidth;

		this.showGrid = showGrid;
		this.gridColor = gridColor;
		this.gridWidth = gridWidth;

		this.showAxisLabels = showAxisLabels;
		this.showUnitLabels = showUnitLabels;
		this.labelFont = labelFont;

		this.pageBackgroundColor = pageBackgroundColor;

		this.onlyPositive = onlyPositive;
	}

	//Generates the points to renderer the axes' base lines (without any scaling marks or labeling)
	private generateAxesBaseLines(): Vec2[] {
		//Get the points of the lines to be rendered (based on the screen coordinates of the origin)
		let linePoints: Vec2[] = [];
		let origin: Vec2 = this.camera.pointToScreenPosition(new Vec2(0, 0));

		if (this.onlyPositive) {
			linePoints = [
				/* X */ origin, new Vec2(this.camera.canvasSize.x, origin.y),
				/* Y */ origin, new Vec2(origin.x, 0)
			];
		} else {
			linePoints = [
				/* X */ new Vec2(0, origin.y), new Vec2(this.camera.canvasSize.x, origin.y),
				/* Y */ new Vec2(origin.x, 0), new Vec2(origin.x, this.camera.canvasSize.y),
			];
		}

		return linePoints;
	}

	//Returns the ideal scaling for the axes with the current camera settings. The returned object
	//contains the number of pixels of each axis division (gridScreenSize) and its equivalent in
	//world size (gridWorldSize).
	private generateAxesScale(): { gridWorldSize: number, gridScreenSize: number } {
		//Calculate the grid division (O(1))
		let maxGridWorldSize = MAX_GRID_SIZE / this.camera.scale;
		let realGridWorldSize = Math.floor(maxGridWorldSize);

		//If the scale is less than 1, flooring it would make it 0 and the app would crash. Let the
		//scale assume values in the sequence 0.5^n.
		if (realGridWorldSize === 0) {
			let multiplier = Math.round(Math.log(maxGridWorldSize) / Math.log(0.5));
			realGridWorldSize = Math.pow(0.5, multiplier);

			//Prevention measure. I think this won't happen but its better to get a wrong axis scale
			//than a complete program crash.
			if (realGridWorldSize === 0) {
				realGridWorldSize = 0.5;
			}
		}

		return {
			gridWorldSize: realGridWorldSize,
			gridScreenSize: realGridWorldSize * this.camera.scale
		};
	}

	//Generates the two triangles at the end of the axes (x and y).
	private generateArrows(): Vec2[][] {
		let origin: Vec2 = this.camera.pointToScreenPosition(new Vec2(0, 0));

		let arrows: Vec2[][] = [[
			//X axis arrow
			new Vec2(this.camera.canvasSize.x, origin.y),
			new Vec2(
				this.camera.canvasSize.x - this.axisWidth * 3.5,
				origin.y - this.axisWidth * 3.5
			),
			new Vec2(
				this.camera.canvasSize.x - this.axisWidth * 3.5,
				origin.y + this.axisWidth * 3.5
			),
		], [
			//Y axis arrow
			new Vec2(origin.x, 0),
			new Vec2(origin.x - this.axisWidth * 3.5, this.axisWidth * 3.5),
			new Vec2(origin.x + this.axisWidth * 3.5, this.axisWidth * 3.5),
		]];
		return arrows;
	}

	//Generates where each vertical grid line (or axis split should be).
	private generateGridAndAxesXSplits(gridScreenSize: number, callback: (x: number) => any) {
		let origin: Vec2 = this.camera.pointToScreenPosition(new Vec2(0, 0));

		if (!this.onlyPositive) {
			//Start from the origin and fill the negative parts of the axes
			for (let x: number = origin.x; x >= 0; x -= gridScreenSize) {
				callback(x);
			}
		}
		//Start from the origin and determine the positive positions of the splits
		for (let x: number = origin.x; x <= this.camera.canvasSize.x; x += gridScreenSize) {	
			callback(x);
		}
	}

	//Generates where each horizontal grid line (or axis split should be).
	private generateGridAndAxesYSplits(gridScreenSize: number, callback: (y: number) => any) {
		let origin: Vec2 = this.camera.pointToScreenPosition(new Vec2(0, 0));

		if (!this.onlyPositive) {
			//Start from the origin and fill the negative parts of the axes
			for (let y: number = origin.y; y <= this.camera.canvasSize.y; y += gridScreenSize) {
				callback(y);
			}
		}
		//Start from the origin and determine the positive positions of the splits
		for (let y: number = origin.y; y >= 0; y -= gridScreenSize) {	
			callback(y);
		}
	}

	//Generates the tiny lines that are responsible for showing the scale of the axes.
	private generateAxesScaleLines(gridScreenSize: number): Vec2[] {
		//Get the points of the lines to be rendered (based on the screen coordinates of the origin)
		let linePoints: Vec2[] = [];
		let origin: Vec2 = this.camera.pointToScreenPosition(new Vec2(0, 0));

		this.generateGridAndAxesXSplits(gridScreenSize, (x: number) => {
			linePoints.push(
				new Vec2(x, origin.y - this.axisWidth), 
				new Vec2(x, origin.y + this.axisWidth)
			);
		});

		this.generateGridAndAxesYSplits(gridScreenSize, (y: number) => {
			linePoints.push(
				new Vec2(origin.x - this.axisWidth, y), 
				new Vec2(origin.x + this.axisWidth, y)
			);
		});

		return linePoints;
	}

	private generateGridLines(gridScreenSize: number): Vec2[] {
		//Get the points of the lines to be rendered (based on the screen coordinates of the origin)
		let linePoints: Vec2[] = [];
		let origin: Vec2 = this.camera.pointToScreenPosition(new Vec2(0, 0));

		this.generateGridAndAxesXSplits(gridScreenSize, (x: number) => {
			if (this.onlyPositive) {
				linePoints.push(
					new Vec2(x, 0),
					new Vec2(x, origin.y)
				);
			} else {
				linePoints.push(
					new Vec2(x, 0),
					new Vec2(x, this.camera.canvasSize.y)
				);
			}
		});

		this.generateGridAndAxesYSplits(gridScreenSize, (y: number) => {
			if (this.onlyPositive) {
				linePoints.push(
					new Vec2(origin.x, y), 
					new Vec2(this.camera.canvasSize.x, y)
				);
			} else {
				linePoints.push(
					new Vec2(0, y), 
					new Vec2(this.camera.canvasSize.x, y)
				);
			}
		});

		return linePoints;
	}

	//This class caches the coordinates of the axis. These need to be updated when anything in the
	//camera is updated (position, scale, canvas size, ...) or when either showGrid, showArrows or
	//onlyPositive is changed.
	updateCaches() {
		this.cachedAxesBaseLines = this.generateAxesBaseLines();

		if (this.drawArrows)
			this.cachedArrowPolygons = this.generateArrows();

		this.cachedAxesScale = this.generateAxesScale();
		this.cachedAxesScaleLines =
			this.generateAxesScaleLines(this.cachedAxesScale.gridScreenSize);
		
		if (this.showGrid)
			this.cachedGridLines = this.generateGridLines(this.cachedAxesScale.gridScreenSize);
	}

	drawAxes(renderer: Renderer) {
		//Draw the grid
		renderer.renderLines(this.cachedGridLines, this.gridColor, this.gridWidth);

		//Draw the axis lines (base and unit separator)
		renderer.renderLines(this.cachedAxesBaseLines, this.axisColor, this.axisWidth);
		renderer.renderLines(this.cachedAxesScaleLines, this.axisColor, this.axisWidth);

		//Draw the arrows
		for (let i: number = 0; i < this.cachedArrowPolygons.length; ++i) {
			renderer.renderPolygon(this.cachedArrowPolygons[i], this.axisColor);
		}

		let origin: Vec2 = this.camera.pointToScreenPosition(new Vec2(0, 0));

		//Unit labels
		if (this.showUnitLabels) {
			renderer.ctx.fillStyle = this.axisColor;

			//x axis labels
			renderer.ctx.textAlign = "center";
			renderer.ctx.textBaseline = "top";
			this.generateGridAndAxesXSplits(this.cachedAxesScale.gridScreenSize, (x: number) => {
				if (x === origin.x) //Don't draw 0 in the origin
					return;

				//Round the number to 2 decimal places (toFixed(2)) and don't have excess 0s
				//(conversion to Number and back to string).
				let text: string = Number((
					((x - origin.x) * this.cachedAxesScale.gridWorldSize) /
					this.cachedAxesScale.gridScreenSize
				).toFixed(2)).toString();

				renderer.ctx.fillText(text, x, origin.y + 10);
			});

			//y axis labels
			renderer.ctx.textAlign = "right";
			renderer.ctx.textBaseline = "middle";
			this.generateGridAndAxesYSplits(this.cachedAxesScale.gridScreenSize, (y: number) => {
				if (y === origin.y) //Don't draw 0 in the origin
					return;

				//Round the number to 2 decimal places (toFixed(2)) and don't have excess 0s
				//(conversion to Number and back to string).
				let text: string = Number((
					((origin.y - y) * this.cachedAxesScale.gridWorldSize) /
					this.cachedAxesScale.gridScreenSize
				).toFixed(2)).toString();

				renderer.ctx.fillText(text, origin.x - 10, y);
			});
		}

		//Axis labels
		if (this.showAxisLabels) {
			renderer.ctx.textAlign = "right";
			renderer.ctx.textBaseline = "top";
			renderer.ctx.font = this.labelFont;

			//Render squares behind the text so that it is visible.
			renderer.ctx.fillStyle = this.pageBackgroundColor;

			//x
			let measure = renderer.ctx.measureText("x").width;
			renderer.ctx.fillRect(
				this.camera.canvasSize.x - 10 - measure, origin.y + this.axisWidth * 3.5 + 5,
				measure, renderer.fontHeight()
			);

			//y
			measure = renderer.ctx.measureText("y").width;
			renderer.ctx.fillRect(
				origin.x - this.axisWidth * 3.5 - 5 - measure, 10,
				measure, renderer.fontHeight()
			);

			//It isn't expected for there to be text under the origin of the axis system. Therefore,
			//don't draw the rectangle.

			//Render the text
			renderer.ctx.fillStyle = this.axisColor;
			renderer.ctx.fillText(
				"x", this.camera.canvasSize.x - 10,
				origin.y + this.axisWidth * 3.5 + 5
			);
			renderer.ctx.fillText("y", origin.x - this.axisWidth * 3.5 - 5, 10);
			renderer.ctx.fillText("O", origin.x - 10, origin.y + 10);
		}	
	}
}