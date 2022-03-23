var Camera = (function () {
    function Camera(position, scale) {
        if (position === void 0) { position = new Vec2(0, 0); }
        if (scale === void 0) { scale = new Vec2(1, 1); }
        this.r = position;
        this.scale = scale;
    }
    Camera.prototype.pointToScreenPosition = function (worldPosition) {
        return worldPosition
            .subtract(this.r)
            .scale2(this.scale)
            .scale2(new Vec2(1, -1))
            .add(new Vec2(0, this.canvasSize.y));
    };
    Camera.prototype.pointToWorldPosition = function (screenPosition) {
        return screenPosition
            .subtract(new Vec2(0, this.canvasSize.y))
            .scale2(new Vec2(1, -1))
            .scale2(this.scale.invert())
            .add(this.r);
    };
    Camera.prototype.polygonToScreenPosition = function (vertices) {
        var _this = this;
        return vertices.map(function (v) {
            return _this.pointToScreenPosition(v);
        });
    };
    Camera.prototype.forcePosition = function (worldPosition, screenPosition) {
        this.r = new Vec2(worldPosition.x - screenPosition.x / this.scale.x, (screenPosition.y - this.canvasSize.y) / this.scale.y + worldPosition.y);
    };
    Camera.prototype.fitMaxX = function (x) {
        this.scale.x = this.canvasSize.x / (x - this.r.x);
    };
    Camera.prototype.fitMaxY = function (y) {
        this.scale.y = this.canvasSize.y / (y - this.r.y);
    };
    return Camera;
}());
