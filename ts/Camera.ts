class Camera {
	public r: Vec2; //The position vector of the camera (in world coordinates)
	public scale: number;
	public canvasSize: Vec2;

	constructor(position: Vec2 = new Vec2(0, 0), scale: number = 1) {
		this.r = position;
		this.scale = scale;
	}

	//Converts a position in world space to a coordinate in the screen.
	pointToScreenPosition(worldPosition: Vec2): Vec2 {
		return worldPosition
			.subtract(this.r)
			.scale(this.scale)
			.scale2(new Vec2(1, -1))
			.add(new Vec2(0, this.canvasSize.y));
	}

	//Converts a position on the screen to a position in the world (for selecting an object, for
	//example)
	pointToWorldPosition(screenPosition: Vec2): Vec2 {
		return screenPosition
			.subtract(new Vec2(0, this.canvasSize.y))
			.scale2(new Vec2(1, -1))
			.scale(1 / this.scale)
			.add(this.r);
	}

	//Executes pointToScreenPosition on a set of points.
	polygonToScreenPosition(vertices: Vec2[]): Vec2[] {
		return vertices.map( (v: Vec2): Vec2 => {
			return this.pointToScreenPosition(v);
		});
	} 
}