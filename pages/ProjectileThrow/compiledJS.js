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
var ProjectileThrowState;
(function (ProjectileThrowState) {
    ProjectileThrowState[ProjectileThrowState["choosingVelocity"] = 0] = "choosingVelocity";
    ProjectileThrowState[ProjectileThrowState["projectileInLaunchPosition"] = 1] = "projectileInLaunchPosition";
    ProjectileThrowState[ProjectileThrowState["projectileMoving"] = 2] = "projectileMoving";
    ProjectileThrowState[ProjectileThrowState["projectileStopped"] = 3] = "projectileStopped";
    ProjectileThrowState[ProjectileThrowState["showingSimulationResults"] = 4] = "showingSimulationResults";
})(ProjectileThrowState || (ProjectileThrowState = {}));
var ProjectileThrowStateManager = (function () {
    function ProjectileThrowStateManager() {
    }
    ProjectileThrowStateManager.enterChoosingVelocityMode = function () {
        ProjectileThrowSimulation.settings.updatePage();
        ProjectileThrowSimulation.velocityBeforeChoosing =
            ProjectileThrowSimulation.settings.launchVelocity;
        if (isTouchScreenAvailable) {
            document.getElementById("choose-velocity-instructions-touch").
                classList.remove("hidden");
        }
        else {
            document.getElementById("choose-velocity-instructions-mouse").
                classList.remove("hidden");
        }
        document.body.classList.add("no-scrolling");
        smoothScroll(0, 0, function () {
            ProjectileThrowSimulation.state = ProjectileThrowState.choosingVelocity;
        });
    };
    ProjectileThrowStateManager.exitChoosingVelocityMode = function () {
        ProjectileThrowSimulation.state = ProjectileThrowState.projectileInLaunchPosition;
        if (isTouchScreenAvailable) {
            document.getElementById("choose-velocity-instructions-touch").classList.add("hidden");
        }
        else {
            document.getElementById("choose-velocity-instructions-mouse").classList.add("hidden");
        }
        ProjectileThrowSimulation.settings = ProjectileThrowSimulation.settings.getFromPage();
        ProjectileThrowSimulation.settings.updatePage();
        document.body.classList.remove("no-scrolling");
    };
    ProjectileThrowStateManager.scaleSimulationResults = function () {
        var style = window.getComputedStyle(document.getElementById("simulation-results"));
        var elementWidth = (parseFloat(style.width) + 2 * parseFloat(style.paddingLeft))
            * window.devicePixelRatio / this.simulationResultsScale;
        var maxWidth = (ProjectileThrowSimulation.camera.canvasSize.x - 20 * window.devicePixelRatio);
        var scale = maxWidth / (elementWidth * this.simulationResultsScale);
        scale = Math.min(scale, 1);
        document.documentElement.style.setProperty("--simulation-results-scale", scale.toString());
        this.simulationResultsScale = scale;
    };
    ProjectileThrowStateManager.showSimulationResults = function () {
        this.scaleSimulationResults();
        ProjectileThrowSimulation.renderer.canvas.classList.add("blur");
        document.getElementById("simulation-interaction-div").classList.add("blur");
        document.body.classList.add("no-interaction");
        var toShow;
        var toHide;
        if (ProjectileThrowSimulation.settings.airResistance) {
            toShow = document.getElementsByClassName("air-resistance-simulation-results-th");
            toHide = document.getElementsByClassName("default-simulation-results-th");
        }
        else {
            toShow = document.getElementsByClassName("default-simulation-results-th");
            toHide = document.getElementsByClassName("air-resistance-simulation-results-th");
        }
        for (var i = 0; i < toShow.length; ++i) {
            toShow[i].style.removeProperty("display");
        }
        for (var i = 0; i < toHide.length; ++i) {
            toHide[i].style.display = "none";
        }
        document.getElementById("simulation-results").classList.remove("hidden");
        ProjectileThrowSimulation.state = ProjectileThrowState.showingSimulationResults;
    };
    ProjectileThrowStateManager.hideSimulationResults = function () {
        ProjectileThrowSimulation.renderer.canvas.classList.remove("blur");
        document.getElementById("simulation-interaction-div").classList.remove("blur");
        document.body.classList.remove("no-interaction");
        document.getElementById("simulation-results").classList.add("hidden");
        ProjectileThrowSimulation.state = ProjectileThrowState.projectileStopped;
    };
    ProjectileThrowStateManager.simulationResultsScale = 1;
    return ProjectileThrowStateManager;
}());
var ProjectileThrowResults = (function () {
    function ProjectileThrowResults() {
        this.time = 0;
        this.distance = 0;
        this.maxHeight = 0;
    }
    ProjectileThrowResults.calculateTheoreticalResults = function (projectile, settings) {
        var results = new ProjectileThrowResults();
        var Fr = new Vec2();
        for (var i = 0; i < projectile.forces.length; ++i) {
            Fr = Fr.add(projectile.forces[i]);
        }
        var a = Fr.scale(1 / projectile.mass);
        var solutions = undefined;
        if (settings.heightReference === HeightReference.BodyCM) {
            solutions = ExtraMath.solveQuadratic(0.5 * a.y, projectile.v.y, projectile.r.y);
        }
        else {
            solutions =
                ExtraMath.solveQuadratic(0.5 * a.y, projectile.v.y, projectile.r.y - settings.radius);
        }
        if (solutions.length === 0) {
            alert("Falha no cálculo de resultados teóricos - quadrática sem soluções!");
            results.time = 0;
            results.maxHeight = 0;
            results.distance = 0;
            return;
        }
        results.time = Math.max.apply(Math, solutions);
        results.distance = projectile.v.x * results.time;
        var maxHeightTime = -projectile.v.y / a.y;
        if (projectile.v.y > 0) {
            results.maxHeight =
                projectile.r.y +
                    projectile.v.y * maxHeightTime +
                    0.5 * a.y * (maxHeightTime * maxHeightTime);
        }
        else {
            results.maxHeight = projectile.r.y;
        }
        return results;
    };
    ProjectileThrowResults.applyToPage = function (theoreticalValues, experimentalValues) {
        function toString(n) {
            if (isNaN(n) || n === Infinity || n === -Infinity) {
                return "Divisão por 0";
            }
            return n.toString();
        }
        document.getElementById("simulated-time").textContent =
            toString(ExtraMath.round(experimentalValues.time * 0.001, 2));
        document.getElementById("real-time").textContent =
            toString(ExtraMath.round(theoreticalValues.time, 2));
        document.getElementById("error-time").textContent =
            toString(ExtraMath.round(ExtraMath.relativeError(experimentalValues.time * 0.001, theoreticalValues.time) * 100, 2));
        document.getElementById("simulated-distance").textContent =
            toString(ExtraMath.round(experimentalValues.distance, 2));
        document.getElementById("real-distance").textContent =
            toString(ExtraMath.round(theoreticalValues.distance, 2));
        document.getElementById("error-distance").textContent =
            toString(ExtraMath.round(ExtraMath.relativeError(experimentalValues.distance, theoreticalValues.distance) * 100, 2));
        document.getElementById("simulated-height").textContent =
            toString(ExtraMath.round(experimentalValues.maxHeight, 2));
        document.getElementById("real-height").textContent =
            toString(ExtraMath.round(theoreticalValues.maxHeight, 2));
        document.getElementById("error-height").textContent =
            toString(ExtraMath.round(ExtraMath.relativeError(experimentalValues.maxHeight, theoreticalValues.maxHeight) * 100, 2));
    };
    return ProjectileThrowResults;
}());
var MAX_TRAJECTORY_POINTS = 1000;
var ProjectileThrowTrajectory = (function () {
    function ProjectileThrowTrajectory(projectile, simulationQuality, bodyRadius, heightReference) {
        if (projectile === void 0) { projectile = undefined; }
        if (simulationQuality === void 0) { simulationQuality = 0; }
        if (bodyRadius === void 0) { bodyRadius = 0; }
        if (heightReference === void 0) { heightReference = HeightReference.BodyCM; }
        if (!projectile && simulationQuality === 0 && bodyRadius == 0 &&
            heightReference === HeightReference.BodyCM) {
            this.points = [];
            return;
        }
        projectile = Object.create(projectile);
        this.points = [];
        this.points.push(projectile.r);
        do {
            projectile.step(simulationQuality);
            this.points.push(projectile.r);
        } while (!ProjectileThrowTrajectory.
            bodyReachedGround(projectile, bodyRadius, heightReference));
    }
    ProjectileThrowTrajectory.bodyReachedGround = function (projectile, bodyRadius, heightReference) {
        if (heightReference === HeightReference.BodyCM) {
            if (projectile.r.y <= 0) {
                return true;
            }
        }
        else {
            if (projectile.r.y <= bodyRadius) {
                return true;
            }
        }
        return false;
    };
    ProjectileThrowTrajectory.generateLimitedTrajectory = function (projectile, settings) {
        var flightTime = ProjectileThrowResults.calculateTheoreticalResults(projectile, settings).time;
        var dt = flightTime / ((MAX_TRAJECTORY_POINTS * 0.95)) * 1000;
        dt = Math.max(dt, settings.simulationQuality);
        return new ProjectileThrowTrajectory(projectile, dt, settings.radius, settings.heightReference);
    };
    return ProjectileThrowTrajectory;
}());
var ProjectileThrowSimulationQuality;
(function (ProjectileThrowSimulationQuality) {
    ProjectileThrowSimulationQuality[ProjectileThrowSimulationQuality["VeryLow"] = 50] = "VeryLow";
    ProjectileThrowSimulationQuality[ProjectileThrowSimulationQuality["Low"] = 30] = "Low";
    ProjectileThrowSimulationQuality[ProjectileThrowSimulationQuality["Medium"] = 20] = "Medium";
    ProjectileThrowSimulationQuality[ProjectileThrowSimulationQuality["High"] = 10] = "High";
    ProjectileThrowSimulationQuality[ProjectileThrowSimulationQuality["VeryHigh"] = 5] = "VeryHigh";
})(ProjectileThrowSimulationQuality || (ProjectileThrowSimulationQuality = {}));
var HeightReference;
(function (HeightReference) {
    HeightReference[HeightReference["BodyBase"] = 0] = "BodyBase";
    HeightReference[HeightReference["BodyCM"] = 1] = "BodyCM";
})(HeightReference || (HeightReference = {}));
var ProjectileThrowSettings = (function () {
    function ProjectileThrowSettings() {
        this._showAxes = true;
        this._showAxesLabels = true;
        this._showGrid = false;
        this._showTrajectory = true;
        this._simulationQuality = ProjectileThrowSimulationQuality.VeryHigh;
        this._heightReference = HeightReference.BodyBase;
        this._mass = 1;
        this._validMass = true;
        this._radius = 0.5;
        this._validRadius = true;
        this._height = 0;
        this._validHeight = true;
        this._launchVelocity = new Vec2(0, 0);
        this._validVelocity = true;
        this._airResistance = false;
    }
    Object.defineProperty(ProjectileThrowSettings.prototype, "showAxes", {
        get: function () { return this._showAxes; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "showAxesLabels", {
        get: function () { return this._showAxesLabels; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "showGrid", {
        get: function () { return this._showGrid; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "showTrajectory", {
        get: function () { return this._showTrajectory; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "showSimulationResults", {
        get: function () { return this._showSimulationResults; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "simulationQuality", {
        get: function () { return this._simulationQuality; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "heightReference", {
        get: function () { return this._heightReference; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "mass", {
        get: function () { return this._mass; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "radius", {
        get: function () { return this._radius; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "height", {
        get: function () { return this._height; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "launchVelocity", {
        get: function () { return this._launchVelocity; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProjectileThrowSettings.prototype, "airResistance", {
        get: function () { return this._airResistance; },
        enumerable: false,
        configurable: true
    });
    ProjectileThrowSettings.prototype.getFromPage = function () {
        var _this = this;
        var settings = new ProjectileThrowSettings();
        settings._showAxes = document.getElementById("axes").checked;
        if (settings._showAxes) {
            settings._showAxesLabels =
                document.getElementById("axes-labels").checked;
        }
        else {
            settings._showAxesLabels = false;
        }
        settings._showGrid = document.getElementById("grid").checked;
        settings._showSimulationResults =
            document.getElementById("simulation-results-checkbox").checked;
        settings._simulationQuality = {
            "vl": ProjectileThrowSimulationQuality.VeryLow,
            "l": ProjectileThrowSimulationQuality.Low,
            "m": ProjectileThrowSimulationQuality.Medium,
            "h": ProjectileThrowSimulationQuality.High,
            "vh": ProjectileThrowSimulationQuality.VeryHigh
        }[document.getElementById("simulation-quality").value];
        if (document.getElementById("body-base").checked) {
            settings._heightReference = HeightReference.BodyBase;
        }
        else {
            settings._heightReference = HeightReference.BodyCM;
        }
        var parseWithSettingsUpdate = function (id, property, validProperty, min, max) {
            if (min === void 0) { min = -Infinity; }
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
        parseWithSettingsUpdate("mass-input", "_mass", "_validMass", Number.MIN_VALUE);
        parseWithSettingsUpdate("radius-input", "_radius", "_validRadius", Number.MIN_VALUE);
        parseWithSettingsUpdate("height-input", "_height", "_validHeight", 0);
        var stringVx = document.getElementById("vx-input").value;
        var stringVy = document.getElementById("vy-input").value;
        var numberVx = Number(stringVx);
        var numberVy = Number(stringVy);
        if (isNaN(numberVx) || isNaN(numberVy)) {
            settings._launchVelocity = this._launchVelocity;
            settings._validVelocity = false;
        }
        else {
            settings._launchVelocity = new Vec2(numberVx, numberVy);
            settings._validVelocity = true;
        }
        settings._airResistance = document.getElementById("air-res").checked;
        settings._showTrajectory = !settings._airResistance &&
            document.getElementById("trajectory").checked;
        return settings;
    };
    ProjectileThrowSettings.prototype.updatePage = function () {
        ProjectileThrowSimulation.axes.showAxes = this._showAxes;
        ProjectileThrowSimulation.axes.showArrows = this._showAxes;
        ProjectileThrowSimulation.axes.showUnitLabelsX = this._showAxesLabels;
        ProjectileThrowSimulation.axes.showUnitLabelsY = this._showAxesLabels;
        if (this._showAxesLabels) {
            ProjectileThrowSimulation.axes.horizontalAxisName = "x";
            ProjectileThrowSimulation.axes.verticalAxisName = "y";
        }
        else {
            ProjectileThrowSimulation.axes.horizontalAxisName = "";
            ProjectileThrowSimulation.axes.verticalAxisName = "";
        }
        ProjectileThrowSimulation.axes.showHorizontalGrid = this._showGrid;
        ProjectileThrowSimulation.axes.showVerticalGrid = this._showGrid;
        var showArrowsCheckbox = document.getElementById("axes-labels");
        if (this._showAxes) {
            showArrowsCheckbox.disabled = false;
        }
        else {
            showArrowsCheckbox.disabled = true;
        }
        if (ProjectileThrowSimulation.state === ProjectileThrowState.projectileInLaunchPosition ||
            ProjectileThrowSimulation.state === ProjectileThrowState.projectileStopped) {
            if (this._heightReference === HeightReference.BodyCM)
                ProjectileThrowSimulation.projectile.r = new Vec2(0, this._height);
            else
                ProjectileThrowSimulation.projectile.r = new Vec2(0, this._height + this._radius);
        }
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
        adjustColor(this._validMass, "mass-input", 2);
        adjustColor(this._validRadius, "radius-input", 2);
        adjustColor(this._validHeight, "height-input", 2);
        adjustColor(this._validVelocity, "vx-input", 2);
        var trajectoryCheckbox = document.getElementById("trajectory");
        trajectoryCheckbox.disabled = this._airResistance;
        if (ProjectileThrowSimulation.state === ProjectileThrowState.projectileInLaunchPosition ||
            ProjectileThrowSimulation.state === ProjectileThrowState.projectileStopped) {
            ProjectileThrowSimulation.projectile.v = this._launchVelocity;
            ProjectileThrowSimulation.projectile.mass = this._mass;
            ProjectileThrowSimulation.projectile.forces = [new Vec2(0, -GRAVITY * this._mass)];
            ProjectileThrowSimulation.projectile.geometry =
                ExtraMath.generatePolygon(20, this._radius);
            ProjectileThrowSimulation.trajectory = ProjectileThrowTrajectory
                .generateLimitedTrajectory(ProjectileThrowSimulation.projectile, this);
        }
    };
    ProjectileThrowSettings.updatePageVelocity = function (velocity) {
        document.getElementById("vx-input").value = velocity.x.toString();
        document.getElementById("vy-input").value = velocity.y.toString();
    };
    ProjectileThrowSettings.addEvents = function () {
        var settingsElements = [
            "axes", "axes-labels", "grid", "trajectory", "simulation-results-checkbox",
            "simulation-quality", "body-base", "body-cm", "air-res"
        ];
        function onUpdate() {
            ProjectileThrowSimulation.settings = ProjectileThrowSimulation.settings.getFromPage();
            ProjectileThrowSimulation.settings.updatePage();
        }
        for (var i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("change", onUpdate);
        }
        settingsElements = [
            "mass-input", "radius-input", "height-input", "vx-input", "vy-input"
        ];
        for (var i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
        }
    };
    ProjectileThrowSettings.disableSettingsElements = function () {
        document.getElementById("simulation-quality").disabled = true;
        document.getElementById("body-base").disabled = true;
        document.getElementById("body-cm").disabled = true;
        document.getElementById("mass-input").disabled = true;
        document.getElementById("radius-input").disabled = true;
        document.getElementById("height-input").disabled = true;
        document.getElementById("vx-input").disabled = true;
        document.getElementById("vy-input").disabled = true;
        document.getElementById("choose-screen-velocity").disabled = true;
        document.getElementById("air-res").disabled = true;
    };
    ProjectileThrowSettings.enableSettingsElements = function () {
        document.getElementById("simulation-quality").disabled = false;
        document.getElementById("body-base").disabled = false;
        document.getElementById("body-cm").disabled = false;
        document.getElementById("mass-input").disabled = false;
        document.getElementById("radius-input").disabled = false;
        document.getElementById("height-input").disabled = false;
        document.getElementById("vx-input").disabled = false;
        document.getElementById("vy-input").disabled = false;
        document.getElementById("choose-screen-velocity").disabled = false;
        document.getElementById("air-res").disabled = false;
    };
    return ProjectileThrowSettings;
}());
var ProjectileThrowEvents = (function () {
    function ProjectileThrowEvents() {
    }
    ProjectileThrowEvents.addEvents = function () {
        var _this = this;
        var moveCallback = function (x, y) {
            _this.mousePosition = new Vec2(x * window.devicePixelRatio, y * window.devicePixelRatio);
            if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
                var v = ProjectileThrowSimulation.camera.pointToWorldPosition(_this.mousePosition)
                    .subtract(ProjectileThrowSimulation.projectile.r)
                    .scale(3);
                v = new Vec2(ExtraMath.round(v.x, 2), ExtraMath.round(v.y, 2));
                ProjectileThrowSettings.updatePageVelocity(v);
                var proj = Object.create(ProjectileThrowSimulation.projectile);
                proj.v = v;
                ProjectileThrowSimulation.trajectory = ProjectileThrowTrajectory.
                    generateLimitedTrajectory(proj, ProjectileThrowSimulation.settings);
            }
        };
        window.addEventListener("mousemove", function (e) { moveCallback(e.x, e.y); });
        window.addEventListener("touchmove", function (e) {
            if (e.touches.length === 1) {
                moveCallback(e.touches[0].clientX, e.touches[0].clientY);
            }
        });
        document.getElementById("no-script-div").addEventListener("pointerup", function () {
            if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
                ProjectileThrowStateManager.exitChoosingVelocityMode();
            }
        });
        window.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
                    ProjectileThrowSettings.updatePageVelocity(ProjectileThrowSimulation.velocityBeforeChoosing);
                    ProjectileThrowStateManager.exitChoosingVelocityMode();
                }
                else if (ProjectileThrowSimulation.state ===
                    ProjectileThrowState.showingSimulationResults) {
                    ProjectileThrowStateManager.hideSimulationResults();
                }
            }
        });
        function onScroll() {
            document.getElementById("scroll-down").style.bottom = "150vh";
            window.removeEventListener("scroll", onScroll);
        }
        window.addEventListener("scroll", onScroll);
    };
    ProjectileThrowEvents.mousePosition = new Vec2(0, 0);
    return ProjectileThrowEvents;
}());
var BODY_GEOMETRY = ExtraMath.generatePolygon(20, 0.5);
var ProjectileThrowSimulation = (function () {
    function ProjectileThrowSimulation() {
    }
    ProjectileThrowSimulation.parseFrame = function (frame) {
        var view = new Float64Array(frame);
        return new Vec2(view[0], view[1]);
    };
    ProjectileThrowSimulation.startSimulation = function () {
        var _this = this;
        this.projectile.forces = [new Vec2(0, -GRAVITY * 1)];
        ProjectileThrowSettings.addEvents();
        ProjectileThrowEvents.addEvents();
        var theoreticalResults = null;
        var bufferCount = 0;
        var newWorker = function () {
            if (!_this.workerStopped) {
                if (_this.parallelWorker) {
                    _this.parallelWorker.terminate();
                }
                _this.parallelWorker = new WorkerWrapper("../../js/ProjectileThrow/ProjectileThrowWorker.js", _this.settings.simulationQuality, function (w, data) {
                    var keys = Object.keys(data);
                    if (keys.indexOf("time") !== -1 && keys.indexOf("distance") !== -1 &&
                        keys.indexOf("maxHeight") !== -1) {
                        var results = new ProjectileThrowResults();
                        results.time = data.time;
                        results.distance = data.distance;
                        results.maxHeight = data.maxHeight;
                        ProjectileThrowResults.applyToPage(theoreticalResults, results);
                        _this.workerStopped = true;
                    }
                    else {
                        _this.parallelWorker.addBuffer(new NumberedBuffer(bufferCount, data.size, data.buf, 16));
                        bufferCount++;
                    }
                }, 512, 16);
            }
        };
        newWorker();
        this.settings = this.settings.getFromPage();
        this.settings.updatePage();
        var elapsedSimulationTime = 0;
        var lastRendererTick = Date.now();
        this.renderer = new Renderer(window, document.getElementById("canvas"), function () {
            var bodyFrame = [];
            if (_this.state === ProjectileThrowState.projectileMoving)
                bodyFrame = _this.parallelWorker.getBoundaryBuffers(elapsedSimulationTime, true);
            if (bodyFrame.length === 0) {
                if (_this.workerStopped && _this.state === ProjectileThrowState.projectileMoving) {
                    _this.state = ProjectileThrowState.projectileStopped;
                    ProjectileThrowSettings.enableSettingsElements();
                    _this.projectile.r = _this.parseFrame(_this.parallelWorker.getLastFrame());
                    if (_this.settings.showSimulationResults) {
                        ProjectileThrowStateManager.showSimulationResults();
                    }
                }
                lastRendererTick = Date.now();
            }
            else {
                _this.projectile.r = ExtraMath.linearInterpolationVec2(_this.parseFrame(bodyFrame[0]), _this.parseFrame(bodyFrame[1]), _this.settings.simulationQuality, elapsedSimulationTime % _this.settings.simulationQuality);
                elapsedSimulationTime += Date.now() - lastRendererTick;
                lastRendererTick = Date.now();
            }
            _this.camera.forcePosition(_this.projectile.r, _this.camera.canvasSize.scale(0.5));
            _this.axes.drawAxes(_this.renderer);
            _this.renderer.renderPolygon(_this.camera.polygonToScreenPosition(_this.projectile.transformGeometry()), "red");
            if (_this.state === ProjectileThrowState.choosingVelocity) {
                _this.renderer.renderLines([
                    _this.camera.pointToScreenPosition(_this.projectile.transformVertex(new Vec2())),
                    ProjectileThrowEvents.mousePosition
                ], "#00ff00", 2);
            }
            if (_this.settings.showTrajectory && _this.trajectory) {
                _this.renderer.renderLinesStrip(_this.camera.polygonToScreenPosition(_this.trajectory.points), "white", 2);
            }
        }, function () {
            _this.renderer.canvas.width = window.innerWidth * window.devicePixelRatio;
            _this.renderer.canvas.height = window.innerHeight * window.devicePixelRatio;
            var renderingSurfaceSize = new Vec2();
            if (isPortrait()) {
                renderingSurfaceSize = new Vec2(window.innerWidth, window.innerHeight)
                    .scale(window.devicePixelRatio);
            }
            else {
                renderingSurfaceSize = new Vec2(window.innerWidth -
                    document.getElementById("simulation-interaction-div").clientWidth, window.innerHeight).scale(window.devicePixelRatio);
            }
            _this.camera.canvasSize = renderingSurfaceSize;
            ProjectileThrowStateManager.scaleSimulationResults();
        });
        this.renderer.renderLoop();
        document.getElementById("choose-screen-velocity").addEventListener("click", function () {
            if (_this.state === ProjectileThrowState.projectileInLaunchPosition ||
                _this.state === ProjectileThrowState.projectileStopped) {
                ProjectileThrowStateManager.enterChoosingVelocityMode();
            }
        });
        document.getElementById("simulation-results-ok").addEventListener("click", function () {
            ProjectileThrowStateManager.hideSimulationResults();
        });
        document.getElementById("reset-button").addEventListener("click", function () {
            if (_this.state === ProjectileThrowState.projectileMoving) {
                newWorker();
                ProjectileThrowSettings.enableSettingsElements();
            }
            if (_this.state === ProjectileThrowState.choosingVelocity)
                ProjectileThrowStateManager.exitChoosingVelocityMode();
            _this.state = ProjectileThrowState.projectileInLaunchPosition;
            _this.settings.updatePage();
        });
        document.getElementById("launch-button").addEventListener("click", function () {
            if (_this.state === ProjectileThrowState.projectileMoving) {
                newWorker();
            }
            if (_this.state === ProjectileThrowState.choosingVelocity)
                ProjectileThrowStateManager.exitChoosingVelocityMode();
            ProjectileThrowSimulation.state = ProjectileThrowState.projectileInLaunchPosition;
            _this.settings = _this.settings.getFromPage();
            _this.settings.updatePage();
            smoothScroll(0, 0, function () {
                elapsedSimulationTime = 0;
                lastRendererTick = Date.now();
                _this.workerStopped = false;
                theoreticalResults = ProjectileThrowResults.calculateTheoreticalResults(_this.projectile, _this.settings);
                bufferCount = 0;
                _this.parallelWorker.start({
                    projectile: ProjectileThrowSimulation.projectile,
                    bodyRadius: ProjectileThrowSimulation.settings.radius,
                    airResistance: ProjectileThrowSimulation.settings.airResistance,
                    heightReference: ProjectileThrowSimulation.settings.heightReference
                }, _this.settings.simulationQuality);
                _this.state = ProjectileThrowState.projectileMoving;
                ProjectileThrowSettings.disableSettingsElements();
            });
        });
    };
    var _a;
    _a = ProjectileThrowSimulation;
    ProjectileThrowSimulation.state = ProjectileThrowState.projectileInLaunchPosition;
    ProjectileThrowSimulation.workerStopped = false;
    ProjectileThrowSimulation.trajectory = new ProjectileThrowTrajectory();
    ProjectileThrowSimulation.projectile = new Body(1, BODY_GEOMETRY, new Vec2(0, 0));
    ProjectileThrowSimulation.settings = new ProjectileThrowSettings();
    ProjectileThrowSimulation.velocityBeforeChoosing = new Vec2();
    ProjectileThrowSimulation.camera = new Camera(new Vec2(), new Vec2(32, 32));
    ProjectileThrowSimulation.axes = new AxisSystem(_a.camera, true, true, false, true, true, true, true, false, false, false, true, true, 64, 64, new Vec2(), "x", "y", "white", 2, "1rem sans-serif", "#555555", 1, "black");
    return ProjectileThrowSimulation;
}());
window.addEventListener("load", function () {
    ProjectileThrowSimulation.startSimulation();
});
