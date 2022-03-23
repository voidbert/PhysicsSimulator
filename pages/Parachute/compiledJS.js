var ExtraMath = (function () {
    function ExtraMath() {
    }
    ExtraMath.solveQuadratic = function (a, b, c) {
        var discriminant = (b * b) - (4 * a * c);
        if (discriminant === 0) {
            return [(-b) / (2 * a)];
        }
        else if (discriminant > 0) {
            return [
                ((-b) + Math.sqrt(discriminant)) / (2 * a),
                ((-b) - Math.sqrt(discriminant)) / (2 * a),
            ];
        }
        return [];
    };
    ExtraMath.round = function (value, decimalPlaces) {
        if (decimalPlaces === void 0) { decimalPlaces = 0; }
        return Math.round(value * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
    };
    ExtraMath.relativeError = function (experimental, real) {
        return Math.abs((experimental - real) / real);
    };
    ExtraMath.linearInterpolation = function (a, b, dt, t) {
        if (dt === 0) {
            return (a + b) / 2;
        }
        var m = (b - a) / dt;
        return a + m * t;
    };
    ExtraMath.linearInterpolationVec2 = function (a, b, dt, t) {
        return new Vec2(this.linearInterpolation(a.x, b.x, dt, t), this.linearInterpolation(a.y, b.y, dt, t));
    };
    ExtraMath.generatePolygon = function (n, radius, startAngle) {
        if (startAngle === void 0) { startAngle = 0; }
        var points = [];
        var internalAngle = (2 * Math.PI) / n;
        for (var i = 0; i < n; ++i) {
            points.push(new Vec2(Math.cos(internalAngle * i + startAngle) * radius, Math.sin(internalAngle * i + startAngle) * radius));
        }
        return points;
    };
    return ExtraMath;
}());
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
var TimeStepper = (function () {
    function TimeStepper(callbackFunction, timeout) {
        var _this = this;
        this.callbackFunction = callbackFunction;
        this.timeout = timeout;
        this._isRunning = true;
        this.lastTime = Date.now();
        this.interval = setInterval(function () { _this.setIntervalCallback(); }, timeout);
    }
    Object.defineProperty(TimeStepper.prototype, "isRunning", {
        get: function () {
            return this._isRunning;
        },
        enumerable: false,
        configurable: true
    });
    TimeStepper.prototype.changeTimeout = function (timeout) {
        var _this = this;
        this.timeout = timeout;
        if (this.isRunning) {
            clearInterval(this.interval);
            this.interval = setInterval(function () { _this.setIntervalCallback(); }, timeout);
        }
    };
    TimeStepper.prototype.resume = function () {
        var _this = this;
        if (!this.isRunning) {
            this.lastTime = Date.now();
            this._isRunning = true;
            this.interval = setInterval(function () { _this.setIntervalCallback(); }, this.timeout);
        }
    };
    TimeStepper.prototype.stopPause = function () {
        if (this._isRunning) {
            clearInterval(this.interval);
            this._isRunning = false;
        }
    };
    TimeStepper.prototype.setIntervalCallback = function () {
        var lastLastTime = this.lastTime;
        this.lastTime = Date.now();
        this.callbackFunction(this.lastTime - lastLastTime);
    };
    return TimeStepper;
}());
var GRAVITY = 9.8;
var AIR_DENSITY = 1.225;
var Body = (function () {
    function Body(mass, geometry, r) {
        if (r === void 0) { r = new Vec2(); }
        this.mass = mass;
        this.r = r;
        this.v = new Vec2(0, 0);
        this.forces = [];
        this.geometry = geometry;
    }
    Body.prototype.transformVertex = function (vec) {
        return vec.add(this.r);
    };
    Body.prototype.transformGeometry = function (geometry) {
        var _this = this;
        if (geometry === void 0) { geometry = this.geometry; }
        return geometry.map(function (v) { return _this.transformVertex(v); });
    };
    Body.prototype.step = function (dt) {
        dt *= 0.001;
        var Fr = new Vec2();
        for (var i = 0; i < this.forces.length; ++i) {
            Fr = Fr.add(this.forces[i]);
        }
        var a = Fr.scale(1 / this.mass);
        this.v = this.v.add(a.scale(dt));
        this.r = this.r.add(this.v.scale(dt));
    };
    return Body;
}());
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
var AxisSystem = (function () {
    function AxisSystem(camera, showAxes, showArrows, onlyPositiveAxes, showUnitSeparationsX, showUnitLabelsX, showUnitSeparationsY, showUnitLabelsY, showHorizontalGrid, showVerticalGrid, onlyPositiveGrid, autoScaleX, autoScaleY, maxGridSizeX, maxGridSizeY, axesScale, horizontalAxisName, verticalAxisName, axesColor, axesWidth, labelFont, gridColor, gridWidth, pageColor) {
        this.camera = camera;
        this.showAxes = showAxes;
        this.showArrows = showArrows;
        this.onlyPositiveAxes = onlyPositiveAxes;
        this.showUnitSeparationsX = showUnitSeparationsX;
        this.showUnitLabelsX = showUnitLabelsX;
        this.showUnitSeparationsY = showUnitSeparationsY;
        this.showUnitLabelsY = showUnitLabelsY;
        this.showHorizontalGrid = showHorizontalGrid;
        this.showVerticalGrid = showVerticalGrid;
        this.onlyPositiveGrid = onlyPositiveGrid;
        this.autoScaleX = autoScaleX;
        this.autoScaleY = autoScaleY;
        this.maxGridSizeX = maxGridSizeX;
        this.maxGridSizeY = maxGridSizeY;
        this.axesScale = axesScale;
        this.horizontalAxisName = horizontalAxisName;
        this.verticalAxisName = verticalAxisName;
        this.axesColor = axesColor;
        this.axesWidth = axesWidth;
        this.labelFont = labelFont;
        this.gridColor = gridColor;
        this.gridWidth = gridWidth;
        this.pageColor = pageColor;
    }
    AxisSystem.prototype.getBoundingRect = function () {
        return new Rect(this.camera.pointToWorldPosition(new Vec2(0, 0)), this.camera.pointToWorldPosition(this.camera.canvasSize));
    };
    AxisSystem.prototype.drawXAxisBaseLine = function (renderer, screenOrigin) {
        var minX;
        var maxX;
        if (this.onlyPositiveAxes) {
            minX = Math.max(0, screenOrigin.x);
            maxX = this.camera.canvasSize.x;
        }
        else {
            minX = 0;
            maxX = this.camera.canvasSize.x;
        }
        if (maxX > minX) {
            renderer.renderLines([new Vec2(minX, screenOrigin.y), new Vec2(maxX, screenOrigin.y)], this.axesColor, this.axesWidth);
            return true;
        }
        return false;
    };
    AxisSystem.prototype.drawYAxisBaseLine = function (renderer, screenOrigin) {
        var minY;
        var maxY;
        if (this.onlyPositiveAxes) {
            minY = 0;
            maxY = Math.min(screenOrigin.y, this.camera.canvasSize.y);
        }
        else {
            minY = 0;
            maxY = this.camera.canvasSize.y;
        }
        if (maxY > minY) {
            renderer.renderLines([new Vec2(screenOrigin.x, minY), new Vec2(screenOrigin.x, maxY)], this.axesColor, this.axesWidth);
            return true;
        }
        return false;
    };
    AxisSystem.prototype.drawXArrow = function (renderer, screenOrigin) {
        renderer.renderPolygon([
            new Vec2(this.camera.canvasSize.x, screenOrigin.y),
            new Vec2(this.camera.canvasSize.x - this.axesWidth * 3.5, screenOrigin.y - this.axesWidth * 3.5),
            new Vec2(this.camera.canvasSize.x - this.axesWidth * 3.5, screenOrigin.y + this.axesWidth * 3.5),
        ], this.axesColor);
    };
    AxisSystem.prototype.drawYArrow = function (renderer, screenOrigin) {
        renderer.renderPolygon([
            new Vec2(screenOrigin.x, 0),
            new Vec2(screenOrigin.x - this.axesWidth * 3.5, this.axesWidth * 3.5),
            new Vec2(screenOrigin.x + this.axesWidth * 3.5, this.axesWidth * 3.5),
        ], this.axesColor);
    };
    AxisSystem.prototype.drawXName = function (renderer, screenOrigin) {
        var measure = new Vec2(renderer.ctx.measureText(this.horizontalAxisName).width, renderer.fontHeight);
        var position = new Vec2(this.camera.canvasSize.x - measure.x - 10, screenOrigin.y + 10 + this.axesWidth * 3.5);
        renderer.renderTextWithBackground(this.horizontalAxisName, position, this.pageColor, measure, this.axesColor, this.labelFont);
    };
    AxisSystem.prototype.drawYName = function (renderer, screenOrigin) {
        var measure = new Vec2(renderer.ctx.measureText(this.verticalAxisName).width, renderer.fontHeight);
        var position = new Vec2(screenOrigin.x - measure.x - 10 - this.axesWidth * 3.5, 10);
        renderer.renderTextWithBackground(this.verticalAxisName, position, this.pageColor, measure, this.axesColor, this.labelFont);
    };
    AxisSystem.prototype.autoScale = function (maxGridSize, axis) {
        var maxGridWorldSize = maxGridSize / this.camera.scale[axis];
        var gridWorldSize = Math.floor(maxGridWorldSize);
        if (gridWorldSize === 0) {
            var multiplier = Math.round(Math.log(maxGridWorldSize) / Math.log(0.5));
            gridWorldSize = Math.pow(0.5, multiplier);
            if (gridWorldSize === 0) {
                gridWorldSize = 0.5;
            }
        }
        return gridWorldSize;
    };
    AxisSystem.prototype.loopScale = function (scale, start, end, callback) {
        start -= start % scale;
        for (; start < end; start += scale) {
            callback(start);
        }
    };
    AxisSystem.prototype.drawXAxisUnitSeparator = function (renderer, screenOrigin, point) {
        var screenX = this.camera.pointToScreenPosition(new Vec2(point, 0)).x;
        renderer.renderLines([
            new Vec2(screenX, screenOrigin.y - this.axesWidth),
            new Vec2(screenX, screenOrigin.y + this.axesWidth),
        ], this.axesColor, this.axesWidth);
    };
    AxisSystem.prototype.drawYAxisUnitSeparator = function (renderer, screenOrigin, point) {
        var screenY = this.camera.pointToScreenPosition(new Vec2(0, point)).y;
        renderer.renderLines([
            new Vec2(screenOrigin.x - this.axesWidth, screenY),
            new Vec2(screenOrigin.x + this.axesWidth, screenY),
        ], this.axesColor, this.axesWidth);
    };
    AxisSystem.prototype.drawXUnitLabels = function (renderer, screenOrigin, point) {
        var measure = new Vec2(renderer.ctx.measureText(point.toString()).width, renderer.fontHeight);
        var screenX = this.camera.pointToScreenPosition(new Vec2(point, 0)).x;
        var position = new Vec2(screenX - measure.x / 2, screenOrigin.y + this.axesWidth + 10);
        renderer.renderTextWithBackground(point.toString(), position, this.pageColor, measure, this.axesColor, this.labelFont);
    };
    AxisSystem.prototype.drawYUnitLabels = function (renderer, screenOrigin, point) {
        var measure = new Vec2(renderer.ctx.measureText(point.toString()).width, renderer.fontHeight);
        var screenY = this.camera.pointToScreenPosition(new Vec2(0, point)).y;
        var position = new Vec2(screenOrigin.x - this.axesWidth - measure.x - 10, screenY - measure.y / 2);
        renderer.renderTextWithBackground(point.toString(), position, this.pageColor, measure, this.axesColor, this.labelFont);
    };
    AxisSystem.prototype.drawAxes = function (renderer) {
        var _this = this;
        renderer.ctx.font = this.labelFont;
        var boundingRect = this.getBoundingRect();
        var screenOrigin = this.camera.pointToScreenPosition(new Vec2(0, 0));
        if (this.autoScaleX) {
            this.axesScale.x = this.autoScale(this.maxGridSizeX, "x");
        }
        if (this.autoScaleY) {
            this.axesScale.y = this.autoScale(this.maxGridSizeY, "y");
        }
        if (this.showHorizontalGrid &&
            !(this.onlyPositiveGrid && screenOrigin.y < 0)) {
            var bottom = boundingRect.bottom;
            var left_1 = 0;
            if (this.onlyPositiveGrid) {
                bottom = Math.max(bottom, 0);
                left_1 = screenOrigin.x;
            }
            this.loopScale(this.axesScale.y, bottom, boundingRect.top, function (point) {
                var screenY = _this.camera.pointToScreenPosition(new Vec2(0, point)).y;
                renderer.renderLines([new Vec2(left_1, screenY), new Vec2(_this.camera.canvasSize.x, screenY)], _this.gridColor, _this.gridWidth);
            });
        }
        if (this.showVerticalGrid &&
            !(this.onlyPositiveGrid && screenOrigin.x > this.camera.canvasSize.x)) {
            var left = boundingRect.left;
            var bottom_1 = this.camera.canvasSize.y;
            if (this.onlyPositiveGrid) {
                left = Math.max(left, 0);
                bottom_1 = Math.min(bottom_1, screenOrigin.y);
            }
            this.loopScale(this.axesScale.x, left, boundingRect.right, function (point) {
                var screenX = _this.camera.pointToScreenPosition(new Vec2(point, 0)).x;
                renderer.renderLines([new Vec2(screenX, 0), new Vec2(screenX, bottom_1)], _this.gridColor, _this.gridWidth);
            });
        }
        if (this.showAxes) {
            if (screenOrigin.y >= 0 && screenOrigin.y <= this.camera.canvasSize.y) {
                var canRenderArrow = this.drawXAxisBaseLine(renderer, screenOrigin);
                if (this.showUnitSeparationsX) {
                    var left = boundingRect.left;
                    if (this.onlyPositiveAxes) {
                        left = Math.max(left, 0);
                    }
                    this.loopScale(this.axesScale.x, left, boundingRect.right, function (point) {
                        if (point != 0) {
                            _this.drawXAxisUnitSeparator(renderer, screenOrigin, point);
                            if (_this.showUnitLabelsX)
                                _this.drawXUnitLabels(renderer, screenOrigin, point);
                        }
                    });
                }
                if (canRenderArrow) {
                    this.drawXName(renderer, screenOrigin);
                    if (this.showArrows)
                        this.drawXArrow(renderer, screenOrigin);
                }
            }
            if (screenOrigin.x >= 0 && screenOrigin.x <= this.camera.canvasSize.x) {
                var canRenderArrow = this.drawYAxisBaseLine(renderer, screenOrigin);
                if (this.showUnitSeparationsY) {
                    var bottom = boundingRect.bottom;
                    if (this.onlyPositiveAxes) {
                        bottom = Math.max(bottom, 0);
                    }
                    this.loopScale(this.axesScale.y, bottom, boundingRect.top, function (point) {
                        if (point != 0) {
                            _this.drawYAxisUnitSeparator(renderer, screenOrigin, point);
                            if (_this.showUnitLabelsY)
                                _this.drawYUnitLabels(renderer, screenOrigin, point);
                        }
                    });
                }
                if (canRenderArrow) {
                    this.drawYName(renderer, screenOrigin);
                    if (this.showArrows)
                        this.drawYArrow(renderer, screenOrigin);
                }
            }
        }
    };
    return AxisSystem;
}());
var NumberedBuffer = (function () {
    function NumberedBuffer(index, size, buffer, frameSize) {
        this.index = index;
        this.size = size;
        this.buffer = buffer;
        this.frameSize = frameSize;
    }
    NumberedBuffer.prototype.getFrame = function (index) {
        if (index * this.frameSize >= this.size) {
            return null;
        }
        var bufferView = new Uint8Array(this.buffer);
        var ret = new Uint8Array(this.frameSize);
        for (var i = 0; i < this.frameSize; ++i) {
            ret[i] = bufferView[index * this.frameSize + i];
        }
        return ret.buffer;
    };
    return NumberedBuffer;
}());
var WorkerWrapper = (function () {
    function WorkerWrapper(url, simulationQuality, callback, bufferSize, bufferLimit) {
        var _this = this;
        if (bufferSize === void 0) { bufferSize = 512; }
        if (bufferLimit === void 0) { bufferLimit = 16; }
        this.buffers = [];
        this.bufferSize = bufferSize;
        this.bufferLimit = bufferLimit;
        this.simulationQuality = simulationQuality;
        this.worker = new Worker(url);
        this.worker.onmessage = function (e) {
            callback(_this.worker, e.data);
        };
    }
    WorkerWrapper.prototype.start = function (data, simulationQuality) {
        if (simulationQuality === void 0) { simulationQuality = this.simulationQuality; }
        this.buffers = [];
        this.simulationQuality = simulationQuality;
        data.bufferSize = Math.max(this.bufferSize, 1);
        data.allowedBuffers = this.bufferLimit;
        data.simulationQuality = this.simulationQuality;
        this.worker.postMessage(data);
    };
    WorkerWrapper.prototype.addBuffer = function (buffer) {
        if (this.buffers.length >= this.bufferLimit) {
            for (var i = 0; i < this.buffers.length; ++i) {
                if (this.buffers[i] === null) {
                    this.buffers[i] = buffer;
                    return;
                }
            }
            throw new Error("There is no free space for this buffer");
        }
        else {
            this.buffers.push(buffer);
        }
    };
    WorkerWrapper.prototype.clearBuffer = function (index) {
        for (var i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === index) {
                this.buffers[i] = null;
                this.worker.postMessage({ allowedBuffers: 1 });
                return;
            }
        }
    };
    WorkerWrapper.prototype.getBoundaryBuffers = function (time, autoClear) {
        if (autoClear === void 0) { autoClear = false; }
        var frameNumber0 = Math.floor(time / this.simulationQuality);
        var frameNumber1 = Math.ceil(time / this.simulationQuality);
        var bufferNumber0 = Math.floor(frameNumber0 / this.bufferSize);
        var bufferNumber1 = Math.floor(frameNumber1 / this.bufferSize);
        var buffer0 = null;
        var buffer1 = null;
        for (var i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === bufferNumber0) {
                buffer0 = this.buffers[i];
            }
            if (this.buffers[i] && this.buffers[i].index === bufferNumber1) {
                buffer1 = this.buffers[i];
            }
        }
        if (buffer0 === null || buffer1 === null) {
            return [];
        }
        frameNumber0 -= bufferNumber0 * this.bufferSize;
        frameNumber1 -= bufferNumber1 * this.bufferSize;
        var frame0 = buffer0.getFrame(frameNumber0);
        var frame1 = buffer1.getFrame(frameNumber1);
        if (frame0 === null || frame1 === null) {
            return [];
        }
        if (autoClear) {
            var clearCount = 0;
            for (var i = 0; i < this.buffers.length; i++) {
                if (bufferNumber0 === bufferNumber1) {
                    if (this.buffers[i] && this.buffers[i].index < buffer0.index) {
                        this.buffers[i] = null;
                        clearCount++;
                    }
                }
                else {
                    if (this.buffers[i] && this.buffers[i].index < buffer1.index) {
                        this.buffers[i] = null;
                        clearCount++;
                    }
                }
            }
            if (clearCount !== 0)
                this.worker.postMessage({ allowedBuffers: clearCount });
        }
        return [frame0, frame1];
    };
    WorkerWrapper.prototype.terminate = function () {
        this.worker.terminate();
    };
    WorkerWrapper.prototype.getFrame = function (index) {
        var buffer = Math.floor(index / this.bufferSize);
        var frame = index - buffer * this.bufferSize;
        for (var i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === buffer) {
                return this.buffers[i].getFrame(frame);
            }
        }
        return null;
    };
    WorkerWrapper.prototype.getLastFrame = function () {
        var maxIndex = 0;
        var bufferIndex = -1;
        for (var i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index >= maxIndex) {
                maxIndex = this.buffers[i].index;
                bufferIndex = i;
            }
        }
        if (bufferIndex === -1) {
            throw new Error("No buffers stored");
        }
        else {
            var buf = this.buffers[bufferIndex];
            return buf.getFrame(buf.size / buf.frameSize - 1);
        }
    };
    return WorkerWrapper;
}());
var isTouchScreenAvailable = "ontouchstart" in window || navigator.maxTouchPoints > 0;
function parseInputNumber(id, min, max) {
    if (min === void 0) { min = -Infinity; }
    if (max === void 0) { max = Infinity; }
    var text = document.getElementById(id).value;
    var number = Number(text);
    if (isNaN(number) || (!isNaN(number) && min <= number && number <= max)) {
        return number;
    }
    return NaN;
}
function isPortrait() {
    return window.matchMedia("(orientation: portrait)").matches;
}
function smoothScroll(x, y, callback, timeout) {
    if (callback === void 0) { callback = function () { }; }
    if (timeout === void 0) { timeout = 500; }
    if (window.scrollX === x && window.scrollY === y) {
        callback();
        return;
    }
    var positionReached = false;
    function onScroll() {
        if (window.scrollX === x && window.scrollY === y) {
            window.removeEventListener("scroll", onScroll);
            positionReached = true;
            callback();
        }
    }
    window.addEventListener("scroll", onScroll);
    window.scrollTo({ left: x, top: y, behavior: "smooth" });
    if (timeout !== 0) {
        setTimeout(function () {
            if (!positionReached) {
                window.scrollTo(x, y);
                window.removeEventListener("scroll", onScroll);
                callback();
            }
        }, timeout);
    }
}
var CSVTable = (function () {
    function CSVTable(worker, horizontalStep, frameParserCallback, verticalAxisName, horizontalAxisName) {
        if (horizontalAxisName === void 0) { horizontalAxisName = "t (s)"; }
        this.text = horizontalAxisName + "," + verticalAxisName + "\n";
        var index = 0;
        while (true) {
            var frame = worker.getFrame(index);
            if (frame === null) {
                return;
            }
            var number = frameParserCallback(frame);
            this.text += (index * horizontalStep).toString() + "," + number.toString() + "\n";
            index++;
        }
    }
    CSVTable.prototype.toBlob = function () {
        return new Blob([this.text], { type: "text/csv" });
    };
    return CSVTable;
}());
var ParachuteResults = (function () {
    function ParachuteResults() {
    }
    ParachuteResults.calculateTheoreticalResults = function (settings) {
        var ret = new ParachuteResults();
        function rIntegral(t) {
            return ((2 * settings.mass) / (AIR_DENSITY * settings.A0 * settings.cd0)) *
                Math.log(Math.abs(2 * Math.cosh(Math.sqrt(GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0 /
                    (2 * settings.mass)) * t)));
        }
        ret.r = function (t) {
            return rIntegral(t) - rIntegral(0);
        };
        ret.y = function (t) {
            return settings.h0 - ret.r(t);
        };
        ret.v = function (t) {
            return Math.sqrt((2 * settings.mass * GRAVITY) /
                (AIR_DENSITY * settings.A0 * settings.cd0)) * Math.tanh(Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0) / (2 * settings.mass)) * t);
        };
        ret.a = function (t) {
            return GRAVITY / Math.pow(Math.cosh(Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0) /
                (2 * settings.mass)) * t), 2);
        };
        ret.Fr = function (t) {
            return ret.a(t) * settings.mass;
        };
        ret.Rair = function (t) {
            var v = ret.v(t);
            return 0.5 * settings.cd0 * AIR_DENSITY * settings.A0 * v * v;
        };
        ret.timeParachuteOpens = Math.acosh(0.5 * Math.exp(((settings.h0 - settings.hopening + rIntegral(0)) * AIR_DENSITY * settings.A0 *
            settings.cd0) / (2 * settings.mass))) / Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 *
            settings.cd0) / (2 * settings.mass));
        return ret;
    };
    ParachuteResults.applyToPage = function (theoreticalResults, errorAvg, openedInstant) {
        function strigify(n) {
            var parts = n.toExponential().split("e");
            parts[0] = Number(parts[0]).toFixed(2);
            var superscript = "";
            for (var i = 0; i < parts[1].length; ++i) {
                switch (parts[1][i]) {
                    case "-":
                        superscript += "⁻";
                        break;
                    case "1":
                        superscript += "¹";
                    case "2":
                        superscript += "²";
                        break;
                    case "3":
                        superscript += "³";
                        break;
                    default:
                        superscript += String.fromCodePoint(0x2074 + parts[1].codePointAt(i) - 52);
                        break;
                }
            }
            return parts[0] + " x 10" + superscript;
        }
        document.getElementById("error-graph").textContent = strigify(errorAvg);
        document.getElementById("simulated-opened").textContent = openedInstant.toFixed(2);
        document.getElementById("real-opened").textContent =
            theoreticalResults.timeParachuteOpens.toFixed(2);
        if (theoreticalResults.timeParachuteOpens === 0) {
            document.getElementById("error-opened").textContent = "Divisão por 0";
        }
        else {
            var error = ExtraMath.relativeError(openedInstant, theoreticalResults.timeParachuteOpens) * 100;
            document.getElementById("error-opened").textContent = strigify(error);
        }
    };
    return ParachuteResults;
}());
var ParachuteState;
(function (ParachuteState) {
    ParachuteState[ParachuteState["BeforeRelease"] = 0] = "BeforeRelease";
    ParachuteState[ParachuteState["Released"] = 1] = "Released";
    ParachuteState[ParachuteState["ReachedGround"] = 2] = "ReachedGround";
    ParachuteState[ParachuteState["ShowingSimulationResults"] = 3] = "ShowingSimulationResults";
})(ParachuteState || (ParachuteState = {}));
var ParachuteStateManager = (function () {
    function ParachuteStateManager() {
    }
    ParachuteStateManager.scaleSimulationResults = function () {
        var style = window.getComputedStyle(document.getElementById("simulation-results"));
        var elementWidth = (parseFloat(style.width) + 2 * parseFloat(style.paddingLeft))
            * window.devicePixelRatio / this.simulationResultsScale;
        var maxWidth = (window.innerWidth - 20) * window.devicePixelRatio;
        var scale = maxWidth / (elementWidth * this.simulationResultsScale);
        scale = Math.min(scale, 1);
        document.documentElement.style.setProperty("--simulation-results-scale", scale.toString());
        this.simulationResultsScale = scale;
    };
    ParachuteStateManager.showSimulationResults = function () {
        this.scaleSimulationResults();
        document.getElementById("settings-grid").classList.add("blur");
        document.getElementById("graph-container").classList.add("blur");
        document.body.classList.add("no-interaction");
        document.getElementById("simulation-results").classList.remove("hidden");
        ParachuteSimulation.state = ParachuteState.ShowingSimulationResults;
        smoothScroll(0, 0);
    };
    ParachuteStateManager.hideSimulationResults = function () {
        this.scaleSimulationResults();
        document.getElementById("settings-grid").classList.remove("blur");
        document.getElementById("graph-container").classList.remove("blur");
        document.body.classList.remove("no-interaction");
        document.getElementById("simulation-results").classList.add("hidden");
        ParachuteSimulation.state = ParachuteState.BeforeRelease;
    };
    ParachuteStateManager.simulationResultsScale = 1;
    return ParachuteStateManager;
}());
var PARACHUTE_SIMULATION_SKIPPED_FACTOR = 10;
var FAST_FORWARD_FACTOR = 2;
var ParachuteGraph = (function () {
    function ParachuteGraph() {
        var _this = this;
        this.camera = new Camera(new Vec2(-2, -1), new Vec2(32, 32));
        this.axes = new AxisSystem(this.camera, true, true, true, true, true, true, true, false, false, false, true, true, 64, 64, new Vec2(), "t", "y (m)", "black", 2, "0.9rem sans-serif", "#555555", 1, "white");
        var elapsedSimulationTime = 0;
        var lastRendererTick = Date.now();
        this.renderer = new Renderer(window, document.getElementById("graph"), function () {
            function getTheoreticalPoint(time) {
                switch (ParachuteSimulation.settings.graphProperty) {
                    case ParachuteGraphProperty.Y:
                        return ParachuteSimulation.theoreticalResults.y(time);
                    case ParachuteGraphProperty.R:
                        return ParachuteSimulation.theoreticalResults.r(time);
                    case ParachuteGraphProperty.Velocity:
                        return ParachuteSimulation.theoreticalResults.v(time);
                    case ParachuteGraphProperty.AirResistance:
                        return ParachuteSimulation.theoreticalResults.Rair(time);
                    case ParachuteGraphProperty.ResultantForce:
                        return ParachuteSimulation.theoreticalResults.Fr(time);
                    case ParachuteGraphProperty.Acceleration:
                        return ParachuteSimulation.theoreticalResults.a(time);
                }
            }
            ParachuteSettings.adjustUI();
            if (ParachuteSimulation.state === ParachuteState.BeforeRelease) {
                elapsedSimulationTime = 0;
                lastRendererTick = Date.now();
                _this.maxY = 0;
                _this.camera.scale = new Vec2(32, 32);
                _this.camera.forcePosition(new Vec2(0, 0), new Vec2(96, _this.renderer.canvas.height - 32));
                _this.axes.drawAxes(_this.renderer);
                return;
            }
            _this.scaleCamera(elapsedSimulationTime * 0.001, _this.maxY + 1);
            _this.axes.drawAxes(_this.renderer);
            var lackOfData = false;
            var frame = ParachuteSimulation.parallelWorker.getFrame(0);
            if (frame === null) {
                lackOfData = true;
            }
            if (!lackOfData) {
                var lastPoint = _this.camera.pointToScreenPosition(new Vec2(0, new Float64Array(frame)[0]));
                _this.renderer.ctx.strokeStyle = "#00ff00";
                _this.renderer.ctx.lineWidth = 2;
                _this.renderer.ctx.beginPath();
                _this.renderer.ctx.moveTo(lastPoint.x, lastPoint.y);
                var maxi = elapsedSimulationTime / (ParachuteSimulation.settings.simulationQuality *
                    PARACHUTE_SIMULATION_SKIPPED_FACTOR);
                var reachedi = -1;
                for (var i = 1; i < maxi; i++) {
                    frame = ParachuteSimulation.parallelWorker.getFrame(i);
                    if (frame === null) {
                        lackOfData = true;
                        reachedi = i;
                        break;
                    }
                    var y = new Float64Array(frame)[0];
                    var point = _this.camera.pointToScreenPosition(new Vec2(i * ParachuteSimulation.settings.simulationQuality *
                        PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001, y));
                    if (y > _this.maxY) {
                        _this.maxY = y;
                    }
                    _this.renderer.ctx.lineTo(point.x, point.y);
                    lastPoint = point;
                }
                _this.renderer.ctx.stroke();
                if (reachedi === -1) {
                    reachedi = maxi;
                }
                var lastTheoreticalPoint = _this.camera.pointToScreenPosition(new Vec2(0, getTheoreticalPoint(0)));
                if (ParachuteSimulation.settings.seeTheoretical) {
                    _this.renderer.ctx.beginPath();
                    _this.renderer.ctx.strokeStyle = "#ff0000aa";
                    _this.renderer.ctx.lineWidth = 2;
                    _this.renderer.ctx.moveTo(lastTheoreticalPoint.x, lastTheoreticalPoint.y);
                    maxi = Math.min(reachedi, ParachuteSimulation.theoreticalResults.timeParachuteOpens /
                        (ParachuteSimulation.settings.simulationQuality * PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001));
                    for (var i = 1; i < maxi; i++) {
                        var time = i * ParachuteSimulation.settings.simulationQuality *
                            PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001;
                        var theoreticalPoint = _this.camera.pointToScreenPosition(new Vec2(time, getTheoreticalPoint(time)));
                        _this.renderer.ctx.lineTo(theoreticalPoint.x, theoreticalPoint.y);
                        lastTheoreticalPoint = theoreticalPoint;
                    }
                }
                _this.renderer.ctx.stroke();
            }
            if (lackOfData) {
                if (ParachuteSimulation.workerStopped &&
                    ParachuteSimulation.state === ParachuteState.Released) {
                    if (ParachuteSimulation.settings.simulationResults) {
                        ParachuteStateManager.showSimulationResults();
                    }
                    else {
                        ParachuteSimulation.state = ParachuteState.ReachedGround;
                    }
                    ParachuteSettings.enableSettingsElements();
                }
                lastRendererTick = Date.now();
            }
            else {
                if (ParachuteSimulation.settings.fastForward) {
                    elapsedSimulationTime += (Date.now() - lastRendererTick) * FAST_FORWARD_FACTOR;
                }
                else {
                    elapsedSimulationTime += Date.now() - lastRendererTick;
                }
                lastRendererTick = Date.now();
            }
        }, function () {
            var rect = _this.renderer.canvas.getBoundingClientRect();
            _this.renderer.canvas.width = rect.width * window.devicePixelRatio;
            _this.renderer.canvas.height = rect.height * window.devicePixelRatio;
            _this.camera.canvasSize = new Vec2(_this.renderer.canvas.width, _this.renderer.canvas.height);
            if (ParachuteSimulation.state === ParachuteState.BeforeRelease) {
                _this.maxY = _this.camera.pointToWorldPosition(new Vec2(0, 0)).y;
            }
            ParachuteStateManager.scaleSimulationResults();
        });
        this.renderer.renderLoop();
    }
    ParachuteGraph.prototype.scaleCamera = function (maxX, maxY) {
        this.camera.fitMaxX(maxX);
        this.camera.scale.x = Math.min(this.camera.scale.x, 32);
        this.camera.fitMaxY(maxY);
        this.camera.scale.y = Math.min(this.camera.scale.y, 32);
        this.camera.forcePosition(new Vec2(0, 0), new Vec2(96, this.renderer.canvas.height - 32));
    };
    return ParachuteGraph;
}());
var ParachuteSimulationQuality;
(function (ParachuteSimulationQuality) {
    ParachuteSimulationQuality[ParachuteSimulationQuality["VeryLow"] = 10] = "VeryLow";
    ParachuteSimulationQuality[ParachuteSimulationQuality["Low"] = 5] = "Low";
    ParachuteSimulationQuality[ParachuteSimulationQuality["Medium"] = 2] = "Medium";
    ParachuteSimulationQuality[ParachuteSimulationQuality["High"] = 1] = "High";
    ParachuteSimulationQuality[ParachuteSimulationQuality["VeryHigh"] = 0.5] = "VeryHigh";
})(ParachuteSimulationQuality || (ParachuteSimulationQuality = {}));
var ParachuteGraphProperty;
(function (ParachuteGraphProperty) {
    ParachuteGraphProperty[ParachuteGraphProperty["Y"] = 0] = "Y";
    ParachuteGraphProperty[ParachuteGraphProperty["R"] = 1] = "R";
    ParachuteGraphProperty[ParachuteGraphProperty["Velocity"] = 2] = "Velocity";
    ParachuteGraphProperty[ParachuteGraphProperty["AirResistance"] = 3] = "AirResistance";
    ParachuteGraphProperty[ParachuteGraphProperty["ResultantForce"] = 4] = "ResultantForce";
    ParachuteGraphProperty[ParachuteGraphProperty["Acceleration"] = 5] = "Acceleration";
})(ParachuteGraphProperty || (ParachuteGraphProperty = {}));
function parachuteGraphPropertyToString(property) {
    switch (property) {
        case ParachuteGraphProperty.Y:
            return "y (m)";
        case ParachuteGraphProperty.R:
            return "r (m)";
        case ParachuteGraphProperty.Velocity:
            return "v (m s⁻¹)";
        case ParachuteGraphProperty.AirResistance:
            return "Rar (N)";
        case ParachuteGraphProperty.ResultantForce:
            return "Fr (N)";
        case ParachuteGraphProperty.Acceleration:
            return "a (m s⁻²)";
    }
}
var ParachuteSettings = (function () {
    function ParachuteSettings() {
        this._mass = 80;
        this._h0 = 2000;
        this._hopening = 500;
        this._openingTime = 5.0;
        this._cd0 = 0.4;
        this._A0 = 0.5;
        this._cd1 = 1.6;
        this._A1 = 5;
        this._simulationQuality = ParachuteSimulationQuality.VeryHigh;
        this._graphProperty = ParachuteGraphProperty.Velocity;
        this._seeTheoretical = true;
        this._simulationResults = true;
        this._fastForward = false;
    }
    Object.defineProperty(ParachuteSettings.prototype, "mass", {
        get: function () { return this._mass; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "h0", {
        get: function () { return this._h0; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "hopening", {
        get: function () { return this._hopening; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "openingTime", {
        get: function () { return this._openingTime; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "cd0", {
        get: function () { return this._cd0; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "A0", {
        get: function () { return this._A0; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "cd1", {
        get: function () { return this._cd1; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "A1", {
        get: function () { return this._A1; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "simulationQuality", {
        get: function () { return this._simulationQuality; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "graphProperty", {
        get: function () { return this._graphProperty; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "seeTheoretical", {
        get: function () { return this._seeTheoretical; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "simulationResults", {
        get: function () { return this._simulationResults; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ParachuteSettings.prototype, "fastForward", {
        get: function () { return this._fastForward; },
        enumerable: false,
        configurable: true
    });
    ParachuteSettings.prototype.getFromPage = function () {
        var _this = this;
        var settings = new ParachuteSettings();
        settings._simulationQuality = {
            "vl": ParachuteSimulationQuality.VeryLow,
            "l": ParachuteSimulationQuality.Low,
            "m": ParachuteSimulationQuality.Medium,
            "h": ParachuteSimulationQuality.High,
            "vh": ParachuteSimulationQuality.VeryHigh
        }[document.getElementById("simulation-quality").value];
        settings._graphProperty = {
            "y": ParachuteGraphProperty.Y,
            "r": ParachuteGraphProperty.R,
            "v": ParachuteGraphProperty.Velocity,
            "Rar": ParachuteGraphProperty.AirResistance,
            "Fr": ParachuteGraphProperty.ResultantForce,
            "a": ParachuteGraphProperty.Acceleration
        }[document.getElementById("graph-property").value];
        settings._seeTheoretical =
            document.getElementById("see-theoretical").checked;
        settings._simulationResults =
            document.getElementById("simulation-results-check").checked;
        settings._fastForward =
            document.getElementById("fast-checkbox").checked;
        var parseWithSettingsUpdate = function (id, property, validProperty, min, max) {
            if (max === void 0) { max = Infinity; }
            settings[property] = parseInputNumber(id, min, max);
            if (isNaN(settings[property])) {
                settings[validProperty] = false;
                settings[property] = _this[property];
            }
            else {
                settings[validProperty] = true;
            }
        };
        parseWithSettingsUpdate("mass", "_mass", "_validMass", Number.MIN_VALUE);
        parseWithSettingsUpdate("h0", "_h0", "_validH0", Number.MIN_VALUE);
        parseWithSettingsUpdate("hopening", "_hopening", "_validHopening", Number.MIN_VALUE, settings._h0);
        parseWithSettingsUpdate("opening-time", "_openingTime", "_validOpeningTime", 0);
        parseWithSettingsUpdate("cd0", "_cd0", "_validCd0", Number.MIN_VALUE);
        parseWithSettingsUpdate("A0", "_A0", "_validA0", Number.MIN_VALUE);
        parseWithSettingsUpdate("cd1", "_cd1", "_validCd1", Number.MIN_VALUE);
        parseWithSettingsUpdate("A1", "_A1", "_validA1", Number.MIN_VALUE);
        return settings;
    };
    ParachuteSettings.prototype.updatePage = function () {
        ParachuteSimulation.state = ParachuteState.BeforeRelease;
        ParachuteSimulation.graph.axes.verticalAxisName =
            parachuteGraphPropertyToString(this._graphProperty);
        function adjustColor(error, id, n) {
            var element = document.getElementById(id);
            for (; n > 0; n--) {
                element = element.parentElement;
            }
            if (error) {
                element.classList.remove("red");
            }
            else {
                element.classList.add("red");
            }
        }
        adjustColor(this._validMass, "mass", 2);
        adjustColor(this._validH0, "h0", 2);
        adjustColor(this._validHopening, "hopening", 2);
        adjustColor(this._validOpeningTime, "opening-time", 2);
        adjustColor(this._validCd0, "cd0", 1);
        adjustColor(this._validA0, "A0", 1);
        adjustColor(this._validCd1, "cd1", 1);
        adjustColor(this._validA1, "A1", 1);
        ParachuteSimulation.body.mass = this._mass;
        ParachuteSimulation.body.r = new Vec2(0, this._h0);
        document.getElementById("download-button").disabled = true;
    };
    ParachuteSettings.addEvents = function () {
        function onUpdate() {
            ParachuteSimulation.settings = ParachuteSimulation.settings.getFromPage();
            ParachuteSimulation.settings.updatePage();
        }
        var settingsElements = [
            "simulation-quality", "graph-property", "fast-checkbox"
        ];
        for (var i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("change", onUpdate);
        }
        settingsElements = [
            "mass", "h0", "hopening", "opening-time", "cd0", "A0", "cd1", "A1"
        ];
        for (var i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
        }
        var seeTheoreticalCheckbox = document.getElementById("see-theoretical");
        seeTheoreticalCheckbox.addEventListener("change", function () {
            ParachuteSimulation.settings._seeTheoretical = seeTheoreticalCheckbox.checked;
        });
        var simulationResults = document.getElementById("simulation-results-check");
        simulationResults.addEventListener("change", function () {
            ParachuteSimulation.settings._simulationResults = simulationResults.checked;
        });
    };
    ParachuteSettings.adjustUI = function () {
        var gridElements = document.getElementsByClassName("settings-grid-item");
        var gridElementsY = [];
        var hiddenElementY = document.getElementById("buttons-centerer").getBoundingClientRect().y;
        for (var i = 0; i < gridElements.length; ++i) {
            gridElementsY.push(gridElements[i].getBoundingClientRect().y);
        }
        if (gridElementsY[0] === gridElementsY[1] && gridElementsY[0] === gridElementsY[2] &&
            gridElementsY[0] !== gridElementsY[3] && gridElementsY[0] !== hiddenElementY) {
            document.getElementById("buttons-centerer").style.display = "initial";
        }
        else {
            document.getElementById("buttons-centerer").style.display = "none";
        }
    };
    ParachuteSettings.disableSettingsElements = function () {
        document.getElementById("mass").disabled = true;
        document.getElementById("h0").disabled = true;
        document.getElementById("hopening").disabled = true;
        document.getElementById("opening-time").disabled = true;
        document.getElementById("cd0").disabled = true;
        document.getElementById("A0").disabled = true;
        document.getElementById("cd1").disabled = true;
        document.getElementById("A1").disabled = true;
        document.getElementById("fast-checkbox").disabled = true;
        document.getElementById("simulation-quality").disabled = true;
        document.getElementById("graph-property").disabled = true;
        document.getElementById("download-button").disabled = true;
    };
    ParachuteSettings.enableSettingsElements = function () {
        document.getElementById("mass").disabled = false;
        document.getElementById("h0").disabled = false;
        document.getElementById("hopening").disabled = false;
        document.getElementById("opening-time").disabled = false;
        document.getElementById("cd0").disabled = false;
        document.getElementById("A0").disabled = false;
        document.getElementById("cd1").disabled = false;
        document.getElementById("A1").disabled = false;
        document.getElementById("fast-checkbox").disabled = false;
        document.getElementById("simulation-quality").disabled = false;
        document.getElementById("graph-property").disabled = false;
    };
    return ParachuteSettings;
}());
var ParachuteSimulation = (function () {
    function ParachuteSimulation() {
    }
    ParachuteSimulation.startSimulation = function () {
        var _this = this;
        this.graph = new ParachuteGraph();
        ParachuteSettings.addEvents();
        this.settings = this.settings.getFromPage();
        this.settings.updatePage();
        var newWorker = function () {
            if (!_this.workerStopped) {
                if (_this.parallelWorker) {
                    _this.parallelWorker.terminate();
                }
                _this.parallelWorker = new WorkerWrapper("../../js/Parachute/ParachuteWorker.js", _this.settings.simulationQuality, function (w, data) {
                    if ("errorAvg" in data && "openedInstant" in data) {
                        var downloadButton = document.getElementById("download-button");
                        downloadButton.disabled = false;
                        downloadButton.onclick = function () {
                            var csv = new CSVTable(_this.parallelWorker, _this.settings.simulationQuality * PARACHUTE_SIMULATION_SKIPPED_FACTOR, function (buf) {
                                return new Float64Array(buf)[0];
                            }, parachuteGraphPropertyToString(_this.settings.graphProperty));
                            var a = document.createElement("a");
                            a.href = window.URL.createObjectURL(csv.toBlob());
                            a.download = "Gráfico.csv";
                            a.click();
                            setTimeout(function () {
                                window.URL.revokeObjectURL(a.href);
                            }, 10000);
                        };
                        ParachuteResults.applyToPage(_this.theoreticalResults, data.errorAvg, data.openedInstant);
                        _this.workerStopped = true;
                    }
                    else {
                        _this.parallelWorker.addBuffer(new NumberedBuffer(_this.bufferCount, data.size, data.buf, 8));
                        _this.bufferCount++;
                    }
                }, 1024, 100000);
            }
        };
        newWorker();
        document.getElementById("reset-button").addEventListener("click", function () {
            if (_this.state === ParachuteState.Released) {
                newWorker();
            }
            _this.state = ParachuteState.BeforeRelease;
            ParachuteSettings.enableSettingsElements();
            document.getElementById("download-button").disabled = true;
        });
        document.getElementById("start-button").addEventListener("click", function () {
            _this.settings.updatePage();
            _this.theoreticalResults = ParachuteResults.calculateTheoreticalResults(_this.settings);
            var y = _this.graph.renderer.canvas.getBoundingClientRect().top + window.scrollY;
            smoothScroll(0, y, function () {
                _this.workerStopped = false;
                _this.bufferCount = 0;
                _this.state = ParachuteState.Released;
                _this.parallelWorker.start({ body: _this.body, settings: _this.settings }, _this.settings.simulationQuality);
            });
            ParachuteSettings.disableSettingsElements();
        });
        document.getElementById("simulation-results-ok").addEventListener("click", function () {
            ParachuteStateManager.hideSimulationResults();
        });
    };
    ParachuteSimulation.body = new Body(80, [], new Vec2());
    ParachuteSimulation.workerStopped = false;
    ParachuteSimulation.bufferCount = 0;
    ParachuteSimulation.settings = new ParachuteSettings();
    ParachuteSimulation.state = ParachuteState.BeforeRelease;
    return ParachuteSimulation;
}());
window.addEventListener("load", function () {
    ParachuteSimulation.startSimulation();
});
