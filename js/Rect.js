var Rect = (function () {
    function Rect(topLeft, bottomRight) {
        this.topLeft = topLeft;
        this.bottomRight = bottomRight;
    }
    Object.defineProperty(Rect.prototype, "top", {
        get: function () { return this.topLeft.y; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "bottom", {
        get: function () { return this.bottomRight.y; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "left", {
        get: function () { return this.topLeft.x; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "right", {
        get: function () { return this.bottomRight.x; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "width", {
        get: function () { return this.bottomRight.x - this.topLeft.x; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "height", {
        get: function () { return this.bottomRight.y - this.topLeft.y; },
        enumerable: false,
        configurable: true
    });
    return Rect;
}());
