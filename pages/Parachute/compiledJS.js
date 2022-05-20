class ExtraMath {
    static solveQuadratic(a, b, c) {
        let discriminant = (b * b) - (4 * a * c);
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
    }
    static round(value, decimalPlaces = 0) {
        return Math.round(value * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
    }
    static relativeError(experimental, real) {
        return Math.abs((experimental - real) / real);
    }
    static linearInterpolation(a, b, dt, t) {
        if (dt === 0) {
            return (a + b) / 2;
        }
        let m = (b - a) / dt;
        return a + m * t;
    }
    static linearInterpolationVec2(a, b, dt, t) {
        return new Vec2(this.linearInterpolation(a.x, b.x, dt, t), this.linearInterpolation(a.y, b.y, dt, t));
    }
    static generatePolygon(n, radius, startAngle = 0) {
        let points = [];
        let internalAngle = (2 * Math.PI) / n;
        for (let i = 0; i < n; ++i) {
            points.push(new Vec2(Math.cos(internalAngle * i + startAngle) * radius, Math.sin(internalAngle * i + startAngle) * radius));
        }
        return points;
    }
}
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
class Rect {
    constructor(topLeft, bottomRight) {
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
class TimeStepper {
    constructor(callbackFunction, timeout) {
        this.callbackFunction = callbackFunction;
        this.timeout = timeout;
        this._isRunning = true;
        this.lastTime = Date.now();
        this.interval = setInterval(() => { this.setIntervalCallback(); }, timeout);
    }
    get isRunning() {
        return this._isRunning;
    }
    changeTimeout(timeout) {
        this.timeout = timeout;
        if (this.isRunning) {
            clearInterval(this.interval);
            this.interval = setInterval(() => { this.setIntervalCallback(); }, timeout);
        }
    }
    resume() {
        if (!this.isRunning) {
            this.lastTime = Date.now();
            this._isRunning = true;
            this.interval = setInterval(() => { this.setIntervalCallback(); }, this.timeout);
        }
    }
    stopPause() {
        if (this._isRunning) {
            clearInterval(this.interval);
            this._isRunning = false;
        }
    }
    setIntervalCallback() {
        let lastLastTime = this.lastTime;
        this.lastTime = Date.now();
        this.callbackFunction(this.lastTime - lastLastTime);
    }
}
const GRAVITY = 9.8;
const AIR_DENSITY = 1.225;
const GRAVITATIONAL_CONSTANT = 6.67430e-11;
class Body {
    constructor(mass, geometry, r = new Vec2()) {
        this.mass = mass;
        this.r = r;
        this.v = new Vec2(0, 0);
        this.forces = [];
        this.geometry = geometry;
    }
    transformVertex(vec) {
        return vec.add(this.r);
    }
    transformGeometry(geometry = this.geometry) {
        return geometry.map((v) => { return this.transformVertex(v); });
    }
    step(dt) {
        dt *= 0.001;
        let Fr = new Vec2();
        for (let i = 0; i < this.forces.length; ++i) {
            Fr = Fr.add(this.forces[i]);
        }
        let a = Fr.scale(1 / this.mass);
        this.v = this.v.add(a.scale(dt));
        this.r = this.r.add(this.v.scale(dt));
    }
}
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
class Renderer {
    constructor(window, canvas, renderCallback, resizeCallback) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.renderCallback = renderCallback;
        this.resizeCallback = resizeCallback;
        window.addEventListener("resize", () => {
            resizeCallback(this);
        });
        this.lastDevicePixelRatio = window.devicePixelRatio;
    }
    renderPolygon(vertices, color = "") {
        if (vertices.length === 0) {
            return;
        }
        if (color !== "") {
            this.ctx.fillStyle = color;
        }
        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; ++i) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        this.ctx.closePath();
        this.ctx.fill();
    }
    renderLines(vertices, color = "", lineWidth = -1) {
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
        for (let i = 0; i < vertices.length; i += 2) {
            this.ctx.moveTo(vertices[i].x, vertices[i].y);
            this.ctx.lineTo(vertices[i + 1].x, vertices[i + 1].y);
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }
    renderLinesStrip(vertices, color = "", lineWidth = -1) {
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
        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        this.ctx.stroke();
    }
    renderText(text, position, lineSpacing = 1.5, color = "", font = "") {
        if (color !== "") {
            this.ctx.fillStyle = color;
        }
        if (font !== "") {
            this.ctx.font = font;
        }
        this.ctx.textBaseline = "top";
        let lineHeight = this.fontHeight;
        let lines = text.split("\n");
        for (let i = 0; i < lines.length; ++i) {
            this.ctx.fillText(lines[i], position.x, position.y);
            position = position.add(new Vec2(0, lineHeight * lineSpacing));
        }
    }
    renderTextWithBackground(text, position, backgroundColor, textMeasurements = new Vec2(Infinity, Infinity), color = "", font = "") {
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
    }
    get fontHeight() {
        let height = 0;
        let fontSplit = this.ctx.font.split(" ");
        for (let i = 0; i < fontSplit.length; ++i) {
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
    }
    renderLoop() {
        this.resizeCallback(this);
        let canRenderFrame = true;
        setInterval(() => {
            if (canRenderFrame) {
                canRenderFrame = false;
                requestAnimationFrame(() => {
                    if (window.devicePixelRatio !== this.lastDevicePixelRatio) {
                        this.lastDevicePixelRatio = window.devicePixelRatio;
                        this.resizeCallback(this);
                    }
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.renderCallback(this);
                    canRenderFrame = true;
                });
            }
        }, 10);
    }
}
class AxisSystem {
    constructor(camera, showAxes, showArrows, onlyPositiveAxes, showUnitSeparationsX, showUnitLabelsX, showUnitSeparationsY, showUnitLabelsY, showHorizontalGrid, showVerticalGrid, onlyPositiveGrid, autoScaleX, autoScaleY, maxGridSizeX, maxGridSizeY, axesScale, horizontalAxisName, verticalAxisName, axesColor, axesWidth, labelFont, gridColor, gridWidth, pageColor) {
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
    getBoundingRect() {
        return new Rect(this.camera.pointToWorldPosition(new Vec2(0, 0)), this.camera.pointToWorldPosition(this.camera.canvasSize));
    }
    drawXAxisBaseLine(renderer, screenOrigin) {
        let minX;
        let maxX;
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
    }
    drawYAxisBaseLine(renderer, screenOrigin) {
        let minY;
        let maxY;
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
    }
    drawXArrow(renderer, screenOrigin) {
        renderer.renderPolygon([
            new Vec2(this.camera.canvasSize.x, screenOrigin.y),
            new Vec2(this.camera.canvasSize.x - this.axesWidth * 3.5, screenOrigin.y - this.axesWidth * 3.5),
            new Vec2(this.camera.canvasSize.x - this.axesWidth * 3.5, screenOrigin.y + this.axesWidth * 3.5),
        ], this.axesColor);
    }
    drawYArrow(renderer, screenOrigin) {
        renderer.renderPolygon([
            new Vec2(screenOrigin.x, 0),
            new Vec2(screenOrigin.x - this.axesWidth * 3.5, this.axesWidth * 3.5),
            new Vec2(screenOrigin.x + this.axesWidth * 3.5, this.axesWidth * 3.5),
        ], this.axesColor);
    }
    drawXName(renderer, screenOrigin) {
        let measure = new Vec2(renderer.ctx.measureText(this.horizontalAxisName).width, renderer.fontHeight);
        let position = new Vec2(this.camera.canvasSize.x - measure.x - 10, screenOrigin.y + 10 + this.axesWidth * 3.5);
        renderer.renderTextWithBackground(this.horizontalAxisName, position, this.pageColor, measure, this.axesColor, this.labelFont);
    }
    drawYName(renderer, screenOrigin) {
        let measure = new Vec2(renderer.ctx.measureText(this.verticalAxisName).width, renderer.fontHeight);
        let position = new Vec2(screenOrigin.x - measure.x - 10 - this.axesWidth * 3.5, 10);
        renderer.renderTextWithBackground(this.verticalAxisName, position, this.pageColor, measure, this.axesColor, this.labelFont);
    }
    autoScale(maxGridSize, axis) {
        let maxGridWorldSize = maxGridSize / this.camera.scale[axis];
        let gridWorldSize = Math.floor(maxGridWorldSize);
        if (gridWorldSize === 0) {
            let multiplier = Math.round(Math.log(maxGridWorldSize) / Math.log(0.5));
            gridWorldSize = Math.pow(0.5, multiplier);
            if (gridWorldSize === 0) {
                gridWorldSize = 0.5;
            }
        }
        return gridWorldSize;
    }
    loopScale(scale, start, end, callback) {
        start -= start % scale;
        for (; start < end; start += scale) {
            callback(start);
        }
    }
    drawXAxisUnitSeparator(renderer, screenOrigin, point) {
        let screenX = this.camera.pointToScreenPosition(new Vec2(point, 0)).x;
        renderer.renderLines([
            new Vec2(screenX, screenOrigin.y - this.axesWidth),
            new Vec2(screenX, screenOrigin.y + this.axesWidth),
        ], this.axesColor, this.axesWidth);
    }
    drawYAxisUnitSeparator(renderer, screenOrigin, point) {
        let screenY = this.camera.pointToScreenPosition(new Vec2(0, point)).y;
        renderer.renderLines([
            new Vec2(screenOrigin.x - this.axesWidth, screenY),
            new Vec2(screenOrigin.x + this.axesWidth, screenY),
        ], this.axesColor, this.axesWidth);
    }
    drawXUnitLabels(renderer, screenOrigin, point) {
        let measure = new Vec2(renderer.ctx.measureText(point.toString()).width, renderer.fontHeight);
        let screenX = this.camera.pointToScreenPosition(new Vec2(point, 0)).x;
        let position = new Vec2(screenX - measure.x / 2, screenOrigin.y + this.axesWidth + 10);
        renderer.renderTextWithBackground(point.toString(), position, this.pageColor, measure, this.axesColor, this.labelFont);
    }
    drawYUnitLabels(renderer, screenOrigin, point) {
        let measure = new Vec2(renderer.ctx.measureText(point.toString()).width, renderer.fontHeight);
        let screenY = this.camera.pointToScreenPosition(new Vec2(0, point)).y;
        let position = new Vec2(screenOrigin.x - this.axesWidth - measure.x - 10, screenY - measure.y / 2);
        renderer.renderTextWithBackground(point.toString(), position, this.pageColor, measure, this.axesColor, this.labelFont);
    }
    drawAxes(renderer) {
        renderer.ctx.font = this.labelFont;
        let boundingRect = this.getBoundingRect();
        let screenOrigin = this.camera.pointToScreenPosition(new Vec2(0, 0));
        if (this.autoScaleX) {
            this.axesScale.x = this.autoScale(this.maxGridSizeX, "x");
        }
        if (this.autoScaleY) {
            this.axesScale.y = this.autoScale(this.maxGridSizeY, "y");
        }
        if (this.showHorizontalGrid &&
            !(this.onlyPositiveGrid && screenOrigin.y < 0)) {
            let bottom = boundingRect.bottom;
            let left = 0;
            if (this.onlyPositiveGrid) {
                bottom = Math.max(bottom, 0);
                left = screenOrigin.x;
            }
            this.loopScale(this.axesScale.y, bottom, boundingRect.top, (point) => {
                let screenY = this.camera.pointToScreenPosition(new Vec2(0, point)).y;
                renderer.renderLines([new Vec2(left, screenY), new Vec2(this.camera.canvasSize.x, screenY)], this.gridColor, this.gridWidth);
            });
        }
        if (this.showVerticalGrid &&
            !(this.onlyPositiveGrid && screenOrigin.x > this.camera.canvasSize.x)) {
            let left = boundingRect.left;
            let bottom = this.camera.canvasSize.y;
            if (this.onlyPositiveGrid) {
                left = Math.max(left, 0);
                bottom = Math.min(bottom, screenOrigin.y);
            }
            this.loopScale(this.axesScale.x, left, boundingRect.right, (point) => {
                let screenX = this.camera.pointToScreenPosition(new Vec2(point, 0)).x;
                renderer.renderLines([new Vec2(screenX, 0), new Vec2(screenX, bottom)], this.gridColor, this.gridWidth);
            });
        }
        if (this.showAxes) {
            if (screenOrigin.y >= 0 && screenOrigin.y <= this.camera.canvasSize.y) {
                let canRenderArrow = this.drawXAxisBaseLine(renderer, screenOrigin);
                if (this.showUnitSeparationsX) {
                    let left = boundingRect.left;
                    if (this.onlyPositiveAxes) {
                        left = Math.max(left, 0);
                    }
                    this.loopScale(this.axesScale.x, left, boundingRect.right, (point) => {
                        if (point != 0) {
                            this.drawXAxisUnitSeparator(renderer, screenOrigin, point);
                            if (this.showUnitLabelsX)
                                this.drawXUnitLabels(renderer, screenOrigin, point);
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
                let canRenderArrow = this.drawYAxisBaseLine(renderer, screenOrigin);
                if (this.showUnitSeparationsY) {
                    let bottom = boundingRect.bottom;
                    if (this.onlyPositiveAxes) {
                        bottom = Math.max(bottom, 0);
                    }
                    this.loopScale(this.axesScale.y, bottom, boundingRect.top, (point) => {
                        if (point != 0) {
                            this.drawYAxisUnitSeparator(renderer, screenOrigin, point);
                            if (this.showUnitLabelsY)
                                this.drawYUnitLabels(renderer, screenOrigin, point);
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
    }
}
class NumberedBuffer {
    constructor(index, size, buffer, frameSize) {
        this.index = index;
        this.size = size;
        this.buffer = buffer;
        this.frameSize = frameSize;
    }
    getFrame(index) {
        if (index * this.frameSize >= this.size) {
            return null;
        }
        let bufferView = new Uint8Array(this.buffer);
        let ret = new Uint8Array(this.frameSize);
        for (let i = 0; i < this.frameSize; ++i) {
            ret[i] = bufferView[index * this.frameSize + i];
        }
        return ret.buffer;
    }
}
class WorkerWrapper {
    constructor(url, simulationQuality, callback, bufferSize = 512, bufferLimit = 16) {
        this.buffers = [];
        this._bufferSize = bufferSize;
        this.bufferLimit = bufferLimit;
        this._simulationQuality = simulationQuality;
        this.worker = new Worker(url);
        this.worker.onmessage = (e) => {
            callback(this.worker, e.data);
        };
    }
    get bufferSize() { return this._bufferSize; }
    get simulationQuality() { return this._simulationQuality; }
    start(data, simulationQuality = this._simulationQuality) {
        this.buffers = [];
        this._simulationQuality = simulationQuality;
        data.bufferSize = Math.max(this._bufferSize, 1);
        data.allowedBuffers = this.bufferLimit;
        data.simulationQuality = this._simulationQuality;
        this.worker.postMessage(data);
    }
    addBuffer(buffer) {
        if (this.buffers.length >= this.bufferLimit) {
            for (let i = 0; i < this.buffers.length; ++i) {
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
    }
    clearBuffer(index) {
        for (let i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === index) {
                this.buffers[i] = null;
                this.worker.postMessage({ allowedBuffers: 1 });
                return;
            }
        }
    }
    getBoundaryBuffers(time, autoClear = false, sleepProtection = false) {
        let frameNumber0 = Math.floor(time / this._simulationQuality);
        let frameNumber1 = Math.ceil(time / this._simulationQuality);
        let bufferNumber0 = Math.floor(frameNumber0 / this._bufferSize);
        let bufferNumber1 = Math.floor(frameNumber1 / this._bufferSize);
        let buffer0 = null;
        let buffer1 = null;
        let maxBufferNumber = -1;
        for (let i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === bufferNumber0) {
                buffer0 = this.buffers[i];
            }
            if (this.buffers[i] && this.buffers[i].index === bufferNumber1) {
                buffer1 = this.buffers[i];
            }
            if (this.buffers[i] && this.buffers[i].index > maxBufferNumber) {
                maxBufferNumber = this.buffers[i].index;
            }
        }
        if (buffer0 === null || buffer1 === null) {
            if (sleepProtection && bufferNumber0 >= maxBufferNumber) {
                let bufferCount = 0;
                for (let i = 0; i < this.buffers.length; ++i) {
                    if (this.buffers[i] && this.buffers[i].index < bufferNumber0) {
                        this.buffers[i] = null;
                        bufferCount++;
                    }
                }
                this.worker.postMessage({ allowedBuffers: bufferCount });
            }
            return [];
        }
        frameNumber0 -= bufferNumber0 * this._bufferSize;
        frameNumber1 -= bufferNumber1 * this._bufferSize;
        let frame0 = buffer0.getFrame(frameNumber0);
        let frame1 = buffer1.getFrame(frameNumber1);
        if (frame0 === null || frame1 === null) {
            return [];
        }
        if (autoClear) {
            let clearCount = 0;
            for (let i = 0; i < this.buffers.length; i++) {
                if (bufferNumber0 === bufferNumber1) {
                    if (this.buffers[i] && this.buffers[i].index < buffer0.index) {
                        this.buffers[i] = null;
                        clearCount++;
                    }
                }
            }
            if (clearCount !== 0)
                this.worker.postMessage({ allowedBuffers: clearCount });
        }
        return [frame0, frame1];
    }
    terminate() {
        this.worker.terminate();
    }
    getFrame(index) {
        let buffer = Math.floor(index / this._bufferSize);
        let frame = index - buffer * this._bufferSize;
        for (let i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === buffer) {
                return this.buffers[i].getFrame(frame);
            }
        }
        return null;
    }
    getBuffer(index) {
        for (let i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index === index) {
                return this.buffers[i];
            }
        }
        return null;
    }
    getLastFrame() {
        let maxIndex = 0;
        let bufferIndex = -1;
        for (let i = 0; i < this.buffers.length; ++i) {
            if (this.buffers[i] && this.buffers[i].index >= maxIndex) {
                maxIndex = this.buffers[i].index;
                bufferIndex = i;
            }
        }
        if (bufferIndex === -1) {
            throw new Error("No buffers stored");
        }
        else {
            let buf = this.buffers[bufferIndex];
            return buf.getFrame(buf.size / buf.frameSize - 1);
        }
    }
}
var isTouchScreenAvailable = "ontouchstart" in window || navigator.maxTouchPoints > 0;
function parseInputNumber(id, min = -Infinity, max = Infinity) {
    let text = document.getElementById(id).value;
    let number = Number(text);
    if (isNaN(number) || (!isNaN(number) && min <= number && number <= max)) {
        return number;
    }
    return NaN;
}
function isPortrait() {
    return window.matchMedia("(orientation: portrait)").matches;
}
function smoothScroll(x, y, callback = () => { }, timeout = 500) {
    if (window.scrollX === x && window.scrollY === y) {
        callback();
        return;
    }
    let positionReached = false;
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
        setTimeout(() => {
            if (!positionReached) {
                window.scrollTo(x, y);
                window.removeEventListener("scroll", onScroll);
                callback();
            }
        }, timeout);
    }
}
var mouseScreenPosition = new Vec2();
if (window) {
    window.addEventListener("mousemove", (e) => {
        mouseScreenPosition = new Vec2(e.clientX, e.clientY).scale(window.devicePixelRatio);
    });
}
class CSVTable {
    constructor(worker, horizontalStep, frameParserCallback, verticalAxisName, horizontalAxisName = "t (s)") {
        this.text = horizontalAxisName + "," + verticalAxisName + "\n";
        let index = 0;
        while (true) {
            let frame = worker.getFrame(index);
            if (frame === null) {
                return;
            }
            let number = frameParserCallback(frame);
            this.text += (index * horizontalStep).toString() + "," + number.toString() + "\n";
            index++;
        }
    }
    toBlob() {
        return new Blob([this.text], { type: "text/csv" });
    }
}
class ParachuteResults {
    constructor() {
    }
    static calculateTheoreticalResults(settings) {
        let ret = new ParachuteResults();
        function rIntegral(t) {
            return ((2 * settings.mass) / (AIR_DENSITY * settings.A0 * settings.cd0)) *
                Math.log(Math.abs(2 * Math.cosh(Math.sqrt(GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0 /
                    (2 * settings.mass)) * t)));
        }
        ret.r = (t) => {
            return rIntegral(t) - rIntegral(0);
        };
        ret.y = (t) => {
            return settings.h0 - ret.r(t);
        };
        ret.v = (t) => {
            return Math.sqrt((2 * settings.mass * GRAVITY) /
                (AIR_DENSITY * settings.A0 * settings.cd0)) * Math.tanh(Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0) / (2 * settings.mass)) * t);
        };
        ret.a = (t) => {
            return GRAVITY / Math.pow(Math.cosh(Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0) /
                (2 * settings.mass)) * t), 2);
        };
        ret.Fr = (t) => {
            return ret.a(t) * settings.mass;
        };
        ret.Rair = (t) => {
            let v = ret.v(t);
            return 0.5 * settings.cd0 * AIR_DENSITY * settings.A0 * v * v;
        };
        ret.timeParachuteOpens = Math.acosh(0.5 * Math.exp(((settings.h0 - settings.hopening + rIntegral(0)) * AIR_DENSITY * settings.A0 *
            settings.cd0) / (2 * settings.mass))) / Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 *
            settings.cd0) / (2 * settings.mass));
        return ret;
    }
    static applyToPage(theoreticalResults, errorAvg, openedInstant) {
        function strigify(n) {
            let parts = n.toExponential().split("e");
            parts[0] = Number(parts[0]).toFixed(2);
            let superscript = "";
            for (let i = 0; i < parts[1].length; ++i) {
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
            let error = ExtraMath.relativeError(openedInstant, theoreticalResults.timeParachuteOpens) * 100;
            document.getElementById("error-opened").textContent = strigify(error);
        }
    }
}
var ParachuteState;
(function (ParachuteState) {
    ParachuteState[ParachuteState["BeforeRelease"] = 0] = "BeforeRelease";
    ParachuteState[ParachuteState["Released"] = 1] = "Released";
    ParachuteState[ParachuteState["ReachedGround"] = 2] = "ReachedGround";
    ParachuteState[ParachuteState["ShowingSimulationResults"] = 3] = "ShowingSimulationResults";
})(ParachuteState || (ParachuteState = {}));
class ParachuteStateManager {
    static scaleSimulationResults() {
        let style = window.getComputedStyle(document.getElementById("simulation-results"));
        let elementWidth = (parseFloat(style.width) + 2 * parseFloat(style.paddingLeft))
            * window.devicePixelRatio / this.simulationResultsScale;
        let maxWidth = (window.innerWidth - 20) * window.devicePixelRatio;
        let scale = maxWidth / (elementWidth * this.simulationResultsScale);
        scale = Math.min(scale, 1);
        document.documentElement.style.setProperty("--simulation-results-scale", scale.toString());
        this.simulationResultsScale = scale;
    }
    static showSimulationResults() {
        this.scaleSimulationResults();
        document.getElementById("settings-grid").classList.add("blur");
        document.getElementById("graph-container").classList.add("blur");
        document.body.classList.add("no-interaction");
        document.getElementById("simulation-results").classList.remove("hidden");
        ParachuteSimulation.state = ParachuteState.ShowingSimulationResults;
        smoothScroll(0, 0);
    }
    static hideSimulationResults() {
        this.scaleSimulationResults();
        document.getElementById("settings-grid").classList.remove("blur");
        document.getElementById("graph-container").classList.remove("blur");
        document.body.classList.remove("no-interaction");
        document.getElementById("simulation-results").classList.add("hidden");
        ParachuteSimulation.state = ParachuteState.BeforeRelease;
    }
}
ParachuteStateManager.simulationResultsScale = 1;
const PARACHUTE_SIMULATION_SKIPPED_FACTOR = 10;
const FAST_FORWARD_FACTOR = 2;
class ParachuteGraph {
    constructor() {
        this.camera = new Camera(new Vec2(-2, -1), new Vec2(32, 32));
        this.axes = new AxisSystem(this.camera, true, true, true, true, true, true, true, false, false, false, true, true, 64, 64, new Vec2(), "t", "y (m)", "black", 2, "0.9rem sans-serif", "#555555", 1, "white");
        let elapsedSimulationTime = 0;
        let lastRendererTick = Date.now();
        this.renderer = new Renderer(window, document.getElementById("graph"), () => {
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
                this.maxY = 0;
                this.camera.scale = new Vec2(32, 32);
                this.camera.forcePosition(new Vec2(0, 0), new Vec2(96, this.renderer.canvas.height - 32));
                this.axes.drawAxes(this.renderer);
                return;
            }
            this.scaleCamera(elapsedSimulationTime * 0.001, this.maxY + 1);
            this.axes.drawAxes(this.renderer);
            let lackOfData = false;
            let frame = ParachuteSimulation.parallelWorker.getFrame(0);
            if (frame === null) {
                lackOfData = true;
            }
            if (!lackOfData) {
                let lastPoint = this.camera.pointToScreenPosition(new Vec2(0, new Float64Array(frame)[0]));
                this.renderer.ctx.strokeStyle = "#00ff00";
                this.renderer.ctx.lineWidth = 2;
                this.renderer.ctx.beginPath();
                this.renderer.ctx.moveTo(lastPoint.x, lastPoint.y);
                let maxi = elapsedSimulationTime / (ParachuteSimulation.settings.simulationQuality *
                    PARACHUTE_SIMULATION_SKIPPED_FACTOR);
                let reachedi = -1;
                for (let i = 1; i < maxi; i++) {
                    frame = ParachuteSimulation.parallelWorker.getFrame(i);
                    if (frame === null) {
                        lackOfData = true;
                        reachedi = i;
                        break;
                    }
                    let y = new Float64Array(frame)[0];
                    let point = this.camera.pointToScreenPosition(new Vec2(i * ParachuteSimulation.settings.simulationQuality *
                        PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001, y));
                    if (y > this.maxY) {
                        this.maxY = y;
                    }
                    this.renderer.ctx.lineTo(point.x, point.y);
                    lastPoint = point;
                }
                this.renderer.ctx.stroke();
                if (reachedi === -1) {
                    reachedi = maxi;
                }
                let lastTheoreticalPoint = this.camera.pointToScreenPosition(new Vec2(0, getTheoreticalPoint(0)));
                if (ParachuteSimulation.settings.seeTheoretical) {
                    this.renderer.ctx.beginPath();
                    this.renderer.ctx.strokeStyle = "#ff0000aa";
                    this.renderer.ctx.lineWidth = 2;
                    this.renderer.ctx.moveTo(lastTheoreticalPoint.x, lastTheoreticalPoint.y);
                    maxi = Math.min(reachedi, ParachuteSimulation.theoreticalResults.timeParachuteOpens /
                        (ParachuteSimulation.settings.simulationQuality * PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001));
                    for (let i = 1; i < maxi; i++) {
                        let time = i * ParachuteSimulation.settings.simulationQuality *
                            PARACHUTE_SIMULATION_SKIPPED_FACTOR * 0.001;
                        let theoreticalPoint = this.camera.pointToScreenPosition(new Vec2(time, getTheoreticalPoint(time)));
                        this.renderer.ctx.lineTo(theoreticalPoint.x, theoreticalPoint.y);
                        lastTheoreticalPoint = theoreticalPoint;
                    }
                }
                this.renderer.ctx.stroke();
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
        }, () => {
            let rect = this.renderer.canvas.getBoundingClientRect();
            this.renderer.canvas.width = rect.width * window.devicePixelRatio;
            this.renderer.canvas.height = rect.height * window.devicePixelRatio;
            this.camera.canvasSize = new Vec2(this.renderer.canvas.width, this.renderer.canvas.height);
            if (ParachuteSimulation.state === ParachuteState.BeforeRelease) {
                this.maxY = this.camera.pointToWorldPosition(new Vec2(0, 0)).y;
            }
            ParachuteStateManager.scaleSimulationResults();
        });
        this.renderer.renderLoop();
    }
    scaleCamera(maxX, maxY) {
        this.camera.fitMaxX(maxX);
        this.camera.scale.x = Math.min(this.camera.scale.x, 32);
        this.camera.fitMaxY(maxY);
        this.camera.scale.y = Math.min(this.camera.scale.y, 32);
        this.camera.forcePosition(new Vec2(0, 0), new Vec2(96, this.renderer.canvas.height - 32));
    }
}
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
class ParachuteSettings {
    constructor() {
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
    get mass() { return this._mass; }
    get h0() { return this._h0; }
    get hopening() { return this._hopening; }
    get openingTime() { return this._openingTime; }
    get cd0() { return this._cd0; }
    get A0() { return this._A0; }
    get cd1() { return this._cd1; }
    get A1() { return this._A1; }
    get simulationQuality() { return this._simulationQuality; }
    get graphProperty() { return this._graphProperty; }
    get seeTheoretical() { return this._seeTheoretical; }
    get simulationResults() { return this._simulationResults; }
    get fastForward() { return this._fastForward; }
    getFromPage() {
        let settings = new ParachuteSettings();
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
        let parseWithSettingsUpdate = (id, property, validProperty, min, max = Infinity) => {
            settings[property] = parseInputNumber(id, min, max);
            if (isNaN(settings[property])) {
                settings[validProperty] = false;
                settings[property] = this[property];
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
    }
    updatePage() {
        ParachuteSimulation.state = ParachuteState.BeforeRelease;
        ParachuteSimulation.graph.axes.verticalAxisName =
            parachuteGraphPropertyToString(this._graphProperty);
        function adjustColor(error, id, n) {
            let element = document.getElementById(id);
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
    }
    static addEvents() {
        function onUpdate() {
            ParachuteSimulation.settings = ParachuteSimulation.settings.getFromPage();
            ParachuteSimulation.settings.updatePage();
        }
        let settingsElements = [
            "simulation-quality", "graph-property", "fast-checkbox"
        ];
        for (let i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("change", onUpdate);
        }
        settingsElements = [
            "mass", "h0", "hopening", "opening-time", "cd0", "A0", "cd1", "A1"
        ];
        for (let i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
        }
        let seeTheoreticalCheckbox = document.getElementById("see-theoretical");
        seeTheoreticalCheckbox.addEventListener("change", () => {
            ParachuteSimulation.settings._seeTheoretical = seeTheoreticalCheckbox.checked;
        });
        let simulationResults = document.getElementById("simulation-results-check");
        simulationResults.addEventListener("change", () => {
            ParachuteSimulation.settings._simulationResults = simulationResults.checked;
        });
    }
    static adjustUI() {
        let gridElements = document.getElementsByClassName("settings-grid-item");
        let gridElementsY = [];
        let hiddenElementY = document.getElementById("buttons-centerer").getBoundingClientRect().y;
        for (let i = 0; i < gridElements.length; ++i) {
            gridElementsY.push(gridElements[i].getBoundingClientRect().y);
        }
        if (gridElementsY[0] === gridElementsY[1] && gridElementsY[0] === gridElementsY[2] &&
            gridElementsY[0] !== gridElementsY[3] && gridElementsY[0] !== hiddenElementY) {
            document.getElementById("buttons-centerer").style.display = "initial";
        }
        else {
            document.getElementById("buttons-centerer").style.display = "none";
        }
    }
    static disableSettingsElements() {
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
    }
    static enableSettingsElements() {
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
    }
}
class ParachuteSimulation {
    static startSimulation() {
        this.graph = new ParachuteGraph();
        ParachuteSettings.addEvents();
        this.settings = this.settings.getFromPage();
        this.settings.updatePage();
        let newWorker = () => {
            if (!this.workerStopped) {
                if (this.parallelWorker) {
                    this.parallelWorker.terminate();
                }
                this.parallelWorker = new WorkerWrapper("../../js/Parachute/ParachuteWorker.js", this.settings.simulationQuality, (w, data) => {
                    if ("errorAvg" in data && "openedInstant" in data) {
                        let downloadButton = document.getElementById("download-button");
                        downloadButton.disabled = false;
                        downloadButton.onclick = () => {
                            let csv = new CSVTable(this.parallelWorker, this.settings.simulationQuality * PARACHUTE_SIMULATION_SKIPPED_FACTOR, (buf) => {
                                return new Float64Array(buf)[0];
                            }, parachuteGraphPropertyToString(this.settings.graphProperty));
                            let a = document.createElement("a");
                            a.href = window.URL.createObjectURL(csv.toBlob());
                            a.download = "Gráfico.csv";
                            a.click();
                            setTimeout(() => {
                                window.URL.revokeObjectURL(a.href);
                            }, 10000);
                        };
                        ParachuteResults.applyToPage(this.theoreticalResults, data.errorAvg, data.openedInstant);
                        this.workerStopped = true;
                    }
                    else {
                        this.parallelWorker.addBuffer(new NumberedBuffer(this.bufferCount, data.size, data.buf, 8));
                        this.bufferCount++;
                    }
                }, 1024, 100000);
            }
        };
        newWorker();
        document.getElementById("reset-button").addEventListener("click", () => {
            if (this.state === ParachuteState.Released) {
                newWorker();
            }
            this.state = ParachuteState.BeforeRelease;
            ParachuteSettings.enableSettingsElements();
            document.getElementById("download-button").disabled = true;
        });
        document.getElementById("start-button").addEventListener("click", () => {
            this.settings.updatePage();
            this.theoreticalResults = ParachuteResults.calculateTheoreticalResults(this.settings);
            let y = this.graph.renderer.canvas.getBoundingClientRect().top + window.scrollY;
            smoothScroll(0, y, () => {
                this.workerStopped = false;
                this.bufferCount = 0;
                this.state = ParachuteState.Released;
                this.parallelWorker.start({ body: this.body, settings: this.settings }, this.settings.simulationQuality);
            });
            ParachuteSettings.disableSettingsElements();
        });
        document.getElementById("simulation-results-ok").addEventListener("click", () => {
            ParachuteStateManager.hideSimulationResults();
        });
    }
}
ParachuteSimulation.body = new Body(80, [], new Vec2());
ParachuteSimulation.workerStopped = false;
ParachuteSimulation.bufferCount = 0;
ParachuteSimulation.settings = new ParachuteSettings();
ParachuteSimulation.state = ParachuteState.BeforeRelease;
window.addEventListener("load", () => {
    ParachuteSimulation.startSimulation();
});
