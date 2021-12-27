//A rectangle
class Rect {
	topLeft: Vec2; bottomRight: Vec2;

	constructor(topLeft: Vec2, bottomRight: Vec2) {
		this.topLeft = topLeft;
		this.bottomRight = bottomRight;
	}

	get top() { return this.topLeft.y; }
	get bottom() { return this.bottomRight.y; }
	get left() { return this.topLeft.x; }
	get right() { return this.bottomRight.x; }
	get width() { return this.bottomRight.x - this.topLeft.x; }
	get height() { return this.bottomRight.y - this.topLeft.y; }
}