const MAX_GRID_SIZE: number = 64;

//A class made to render the x and y axes to the screen.
class AxisSystem {
	camera: Camera;
	color: string;
	lineWidth: number;
	onlyPositive: boolean;

	//The AxisSystem keeps the coordinates of the lines to be drawn cached, so that these don't have
	//to be generated every frame. See AxisSystem.updateCaches().
	private cachedAxesBaseLines: Vec2[] = [];
	private cachedAxesScale: { gridWorldSize: number, gridScreenSize: number };
	private cachedAxesScaleLines: Vec2[] = [];

	//onlyPositive -> if true, only the positive parts of the axes.
	//The constructor doesn't generate the axes' caches. Do that when you are sure the camera has a
	//set canvasSize
	constructor(camera: Camera, color: string = "#000000", lineWidth = 2,
		onlyPositive: boolean = true) {

		this.camera = camera;
		this.color = color;
		this.lineWidth = lineWidth;
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

	//Generates the tiny lines that are responsible for showing the scale of the axes.
	private generateAxesScaleLines(gridScreenSize: number): Vec2[] {
		//Get the points of the lines to be rendered (based on the screen coordinates of the origin)
		let linePoints: Vec2[] = [];
		let origin: Vec2 = this.camera.pointToScreenPosition(new Vec2(0, 0));

		//Add the unit divisions to the axis lines. If the negative axes are drawn, scale them too.
		if (!this.onlyPositive) {
			//Start from the origin and add tiny unit division lines in the negative parts of the
			//axes
			for (let x: number = origin.x; x >= 0; x -= gridScreenSize) {
				linePoints.push(
					new Vec2(x, origin.y - this.lineWidth), 
					new Vec2(x, origin.y + this.lineWidth)
				);
			}

			for (let y: number = origin.y; y <= this.camera.canvasSize.y; y += gridScreenSize) {
				linePoints.push(
					new Vec2(origin.x - this.lineWidth, y), 
					new Vec2(origin.x + this.lineWidth, y)
				);
			}
		}

		//Scale the positive axis starting from the origin in increments of gridScreenSize
		for (let x: number = origin.x; x <= this.camera.canvasSize.x; x += gridScreenSize) {
			linePoints.push(
				new Vec2(x, origin.y - this.lineWidth), 
				new Vec2(x, origin.y + this.lineWidth)
			);
		}

		for (let y: number = origin.y; y >= 0; y -= gridScreenSize) {
			linePoints.push(
				new Vec2(origin.x - this.lineWidth, y), 
				new Vec2(origin.x + this.lineWidth, y)
			);
		}

		return linePoints;
	}

	//This class caches the coordinates of the axis. These need to be updated when anything in the
	//camera is updated (position, scale, canvas size, ...) or when onlyPositive is changed.
	updateCaches() {
		this.cachedAxesBaseLines = this.generateAxesBaseLines();
		this.cachedAxesScale = this.generateAxesScale();
		this.cachedAxesScaleLines =
			this.generateAxesScaleLines(this.cachedAxesScale.gridScreenSize);
	}

	drawAxes(renderer: Renderer) {
		//Draw the lines
		renderer.renderLines(this.cachedAxesBaseLines, this.color, this.lineWidth);
		renderer.renderLines(this.cachedAxesScaleLines, this.color, this.lineWidth);
	}
}