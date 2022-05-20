class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    norm() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    squareNorm() {
        return this.x * this.x + this.y * this.y;
    }
    add(vec) {
        return new Vec2(this.x + vec.x, this.y + vec.y);
    }
    subtract(vec) {
        return new Vec2(this.x - vec.x, this.y - vec.y);
    }
    scale(scale) {
        return new Vec2(this.x * scale, this.y * scale);
    }
    invert() {
        return new Vec2(1 / this.x, 1 / this.y);
    }
    scale2(scale) {
        return new Vec2(this.x * scale.x, this.y * scale.y);
    }
    dotProduct(vec) {
        return (this.x * vec.x) + (this.y * vec.y);
    }
}
