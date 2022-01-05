class Camera {
	public r: Vec2; //The position vector of the camera (in world coordinates)
	public scale: Vec2;
	public canvasSize: Vec2;

	constructor(position: Vec2 = new Vec2(0, 0), scale: Vec2 = new Vec2(1, 1)) {
		this.r = position;
		this.scale = scale;
	}

	//Converts a position in world space to a coordinate in the screen.
	pointToScreenPosition(worldPosition: Vec2): Vec2 {
		return worldPosition
			.subtract(this.r)
			.scale2(this.scale)
			.scale2(new Vec2(1, -1))
			.add(new Vec2(0, this.canvasSize.y));
	}

	//Converts a position on the screen to a position in the world (for selecting an object, for
	//example)
	pointToWorldPosition(screenPosition: Vec2): Vec2 {
		return screenPosition
			.subtract(new Vec2(0, this.canvasSize.y))
			.scale2(new Vec2(1, -1))
			.scale2(this.scale.invert())
			.add(this.r);
	}

	//Executes pointToScreenPosition on a set of points.
	polygonToScreenPosition(vertices: Vec2[]): Vec2[] {
		return vertices.map( (v: Vec2): Vec2 => {
			return this.pointToScreenPosition(v);
		});
	}

	//Adjusts the camera position so that a certain position is transformed into a given screen
	//position.
	forcePosition(worldPosition: Vec2, screenPosition: Vec2) {
		this.r = new Vec2(
			worldPosition.x - screenPosition.x / this.scale.x,
			(screenPosition.y - this.canvasSize.y) / this.scale.y + worldPosition.y
		);
	}

	//Adjusts the camera scale to fit the horizontal position provided (in a way that it will be at
	//the canvas' right side)
	fitMaxX(x: number): void {
		this.scale.x = this.canvasSize.x / (x - this.r.x);
	}

	//Adjusts the camera scale to fit the vertical position provided (in a way that it will be at
	//the canvas' top)
	fitMaxY(y: number): void {
		this.scale.y = this.canvasSize.y / (y - this.r.y);
	}
}