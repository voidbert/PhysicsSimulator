var Camera = /** @class */ (function () {
    function Camera(position, scale) {
        if (position === void 0) { position = new Vec2(0, 0); }
        if (scale === void 0) { scale = 1; }
        this.r = position;
        this.scale = scale;
    }
    //Converts a position in world space to a coordinate in the screen.
    Camera.prototype.pointToScreenPosition = function (worldPosition) {
        return worldPosition
            .subtract(this.r)
            .scale(this.scale)
            .scale2(new Vec2(1, -1))
            .add(new Vec2(0, this.canvasSize.y));
    };
    //Converts a position on the screen to a position in the world (for selecting an object, for
    //example)
    Camera.prototype.pointToWorldPosition = function (screenPosition) {
        return screenPosition
            .subtract(new Vec2(0, this.canvasSize.y))
            .scale2(new Vec2(1, -1))
            .scale(1 / this.scale)
            .add(this.r);
    };
    //Executes pointToScreenPosition on a set of points.
    Camera.prototype.polygonToScreenPosition = function (vertices) {
        var _this = this;
        return vertices.map(function (v) {
            return _this.pointToScreenPosition(v);
        });
    };
    return Camera;
}());
