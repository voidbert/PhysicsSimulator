var Vec2 = (function () {
    function Vec2(x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        this.x = x;
        this.y = y;
    }
    Vec2.prototype.norm = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Vec2.prototype.add = function (vec) {
        return new Vec2(this.x + vec.x, this.y + vec.y);
    };
    Vec2.prototype.subtract = function (vec) {
        return new Vec2(this.x - vec.x, this.y - vec.y);
    };
    Vec2.prototype.scale = function (scale) {
        return new Vec2(this.x * scale, this.y * scale);
    };
    Vec2.prototype.invert = function () {
        return new Vec2(1 / this.x, 1 / this.y);
    };
    Vec2.prototype.scale2 = function (scale) {
        return new Vec2(this.x * scale.x, this.y * scale.y);
    };
    Vec2.prototype.dotProduct = function (vec) {
        return (this.x * vec.x) + (this.y * vec.y);
    };
    return Vec2;
}());
