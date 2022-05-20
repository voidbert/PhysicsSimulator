class Camera {
    constructor(position = new Vec2(0, 0), scale = new Vec2(1, 1)) {
        this.r = position;
        this.scale = scale;
    }
    pointToScreenPosition(worldPosition) {
        return worldPosition
            .subtract(this.r)
            .scale2(this.scale)
            .scale2(new Vec2(1, -1))
            .add(new Vec2(0, this.canvasSize.y));
    }
    pointToWorldPosition(screenPosition) {
        return screenPosition
            .subtract(new Vec2(0, this.canvasSize.y))
            .scale2(new Vec2(1, -1))
            .scale2(this.scale.invert())
            .add(this.r);
    }
    polygonToScreenPosition(vertices) {
        return vertices.map((v) => {
            return this.pointToScreenPosition(v);
        });
    }
    forcePosition(worldPosition, screenPosition) {
        this.r = new Vec2(worldPosition.x - screenPosition.x / this.scale.x, (screenPosition.y - this.canvasSize.y) / this.scale.y + worldPosition.y);
    }
    fitMaxX(x) {
        this.scale.x = this.canvasSize.x / (x - this.r.x);
    }
    fitMaxY(y) {
        this.scale.y = this.canvasSize.y / (y - this.r.y);
    }
}
