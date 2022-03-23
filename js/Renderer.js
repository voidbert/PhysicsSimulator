var Renderer = (function () {
    function Renderer(window, canvas, renderCallback, resizeCallback) {
        var _this = this;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.renderCallback = renderCallback;
        this.resizeCallback = resizeCallback;
        window.addEventListener("resize", function () {
            resizeCallback(_this);
        });
        this.lastDevicePixelRatio = window.devicePixelRatio;
    }
    Renderer.prototype.renderPolygon = function (vertices, color) {
        if (color === void 0) { color = ""; }
        if (vertices.length === 0) {
            return;
        }
        if (color !== "") {
            this.ctx.fillStyle = color;
        }
        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        for (var i = 1; i < vertices.length; ++i) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        this.ctx.closePath();
        this.ctx.fill();
    };
    Renderer.prototype.renderLines = function (vertices, color, lineWidth) {
        if (color === void 0) { color = ""; }
        if (lineWidth === void 0) { lineWidth = -1; }
        if (vertices.length < 2) {
            return;
        }
        if (color !== "") {
            this.ctx.strokeStyle = color;
        }
        if (lineWidth !== -1) {
            this.ctx.lineWidth = lineWidth;
        }
        this.ctx.beginPath();
        for (var i = 0; i < vertices.length; i += 2) {
            this.ctx.moveTo(vertices[i].x, vertices[i].y);
            this.ctx.lineTo(vertices[i + 1].x, vertices[i + 1].y);
        }
        this.ctx.closePath();
        this.ctx.stroke();
    };
    Renderer.prototype.renderLinesStrip = function (vertices, color, lineWidth) {
        if (color === void 0) { color = ""; }
        if (lineWidth === void 0) { lineWidth = -1; }
        if (vertices.length < 2) {
            return;
        }
        if (color !== "") {
            this.ctx.strokeStyle = color;
        }
        if (lineWidth !== -1) {
            this.ctx.lineWidth = lineWidth;
        }
        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        for (var i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        this.ctx.stroke();
    };
    Renderer.prototype.renderText = function (text, position, lineSpacing, color, font) {
        if (lineSpacing === void 0) { lineSpacing = 1.5; }
        if (color === void 0) { color = ""; }
        if (font === void 0) { font = ""; }
        if (color !== "") {
            this.ctx.fillStyle = color;
        }
        if (font !== "") {
            this.ctx.font = font;
        }
        this.ctx.textBaseline = "top";
        var lineHeight = this.fontHeight;
        var lines = text.split("\n");
        for (var i = 0; i < lines.length; ++i) {
            this.ctx.fillText(lines[i], position.x, position.y);
            position = position.add(new Vec2(0, lineHeight * lineSpacing));
        }
    };
    Renderer.prototype.renderTextWithBackground = function (text, position, backgroundColor, textMeasurements, color, font) {
        if (textMeasurements === void 0) { textMeasurements = new Vec2(Infinity, Infinity); }
        if (color === void 0) { color = ""; }
        if (font === void 0) { font = ""; }
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "top";
        if (color !== "") {
            this.ctx.fillStyle = color;
        }
        if (font !== "") {
            this.ctx.font = font;
        }
        if (textMeasurements.x === Infinity && textMeasurements.y === Infinity) {
            textMeasurements = new Vec2(this.ctx.measureText(text).width, this.fontHeight);
        }
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(position.x, position.y, textMeasurements.x, textMeasurements.y);
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, position.x, position.y);
    };
    Object.defineProperty(Renderer.prototype, "fontHeight", {
        get: function () {
            var height = 0;
            var fontSplit = this.ctx.font.split(" ");
            for (var i = 0; i < fontSplit.length; ++i) {
                if (fontSplit[i].endsWith("px")) {
                    height = parseFloat(fontSplit[i]);
                    break;
                }
                else if (fontSplit[i].endsWith("rem")) {
                    height = parseFloat(fontSplit[i]) *
                        parseFloat(getComputedStyle(document.documentElement).fontSize);
                    break;
                }
            }
            if (height === 0) {
                console.log("Unknown font size: using 10px sans-serif");
                height = 10;
                this.ctx.font = "10px sans-serif";
            }
            return height;
        },
        enumerable: false,
        configurable: true
    });
    Renderer.prototype.renderLoop = function () {
        var _this = this;
        this.resizeCallback(this);
        var canRenderFrame = true;
        setInterval(function () {
            if (canRenderFrame) {
                canRenderFrame = false;
                requestAnimationFrame(function () {
                    if (window.devicePixelRatio !== _this.lastDevicePixelRatio) {
                        _this.lastDevicePixelRatio = window.devicePixelRatio;
                        _this.resizeCallback(_this);
                    }
                    _this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
                    _this.renderCallback(_this);
                    canRenderFrame = true;
                });
            }
        }, 10);
    };
    return Renderer;
}());
