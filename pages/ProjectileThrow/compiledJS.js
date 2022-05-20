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
var ProjectileThrowState;
(function (ProjectileThrowState) {
    ProjectileThrowState[ProjectileThrowState["choosingVelocity"] = 0] = "choosingVelocity";
    ProjectileThrowState[ProjectileThrowState["projectileInLaunchPosition"] = 1] = "projectileInLaunchPosition";
    ProjectileThrowState[ProjectileThrowState["projectileMoving"] = 2] = "projectileMoving";
    ProjectileThrowState[ProjectileThrowState["projectileStopped"] = 3] = "projectileStopped";
    ProjectileThrowState[ProjectileThrowState["showingSimulationResults"] = 4] = "showingSimulationResults";
})(ProjectileThrowState || (ProjectileThrowState = {}));
class ProjectileThrowStateManager {
    static enterChoosingVelocityMode() {
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
        smoothScroll(0, 0, () => {
            ProjectileThrowSimulation.state = ProjectileThrowState.choosingVelocity;
        });
    }
    static exitChoosingVelocityMode() {
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
    }
    static scaleSimulationResults() {
        let style = window.getComputedStyle(document.getElementById("simulation-results"));
        let elementWidth = (parseFloat(style.width) + 2 * parseFloat(style.paddingLeft))
            * window.devicePixelRatio / this.simulationResultsScale;
        let maxWidth = (ProjectileThrowSimulation.camera.canvasSize.x - 20 * window.devicePixelRatio);
        let scale = maxWidth / (elementWidth * this.simulationResultsScale);
        scale = Math.min(scale, 1);
        document.documentElement.style.setProperty("--simulation-results-scale", scale.toString());
        this.simulationResultsScale = scale;
    }
    static showSimulationResults() {
        this.scaleSimulationResults();
        ProjectileThrowSimulation.renderer.canvas.classList.add("blur");
        document.getElementById("simulation-interaction-div").classList.add("blur");
        document.body.classList.add("no-interaction");
        let toShow;
        let toHide;
        if (ProjectileThrowSimulation.settings.airResistance) {
            toShow = document.getElementsByClassName("air-resistance-simulation-results-th");
            toHide = document.getElementsByClassName("default-simulation-results-th");
        }
        else {
            toShow = document.getElementsByClassName("default-simulation-results-th");
            toHide = document.getElementsByClassName("air-resistance-simulation-results-th");
        }
        for (let i = 0; i < toShow.length; ++i) {
            toShow[i].style.removeProperty("display");
        }
        for (let i = 0; i < toHide.length; ++i) {
            toHide[i].style.display = "none";
        }
        document.getElementById("simulation-results").classList.remove("hidden");
        ProjectileThrowSimulation.state = ProjectileThrowState.showingSimulationResults;
    }
    static hideSimulationResults() {
        ProjectileThrowSimulation.renderer.canvas.classList.remove("blur");
        document.getElementById("simulation-interaction-div").classList.remove("blur");
        document.body.classList.remove("no-interaction");
        document.getElementById("simulation-results").classList.add("hidden");
        ProjectileThrowSimulation.state = ProjectileThrowState.projectileStopped;
    }
}
ProjectileThrowStateManager.simulationResultsScale = 1;
class ProjectileThrowResults {
    constructor() {
        this.time = 0;
        this.distance = 0;
        this.maxHeight = 0;
    }
    static calculateTheoreticalResults(projectile, settings) {
        let results = new ProjectileThrowResults();
        let Fr = new Vec2();
        for (let i = 0; i < projectile.forces.length; ++i) {
            Fr = Fr.add(projectile.forces[i]);
        }
        let a = Fr.scale(1 / projectile.mass);
        let solutions = undefined;
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
        results.time = Math.max(...solutions);
        results.distance = projectile.v.x * results.time;
        let maxHeightTime = -projectile.v.y / a.y;
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
    }
    static applyToPage(theoreticalValues, experimentalValues) {
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
    }
}
const MAX_TRAJECTORY_POINTS = 1000;
class ProjectileThrowTrajectory {
    constructor(projectile = undefined, simulationQuality = 0, bodyRadius = 0, heightReference = HeightReference.BodyCM) {
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
    static bodyReachedGround(projectile, bodyRadius, heightReference) {
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
    }
    static generateLimitedTrajectory(projectile, settings) {
        let flightTime = ProjectileThrowResults.calculateTheoreticalResults(projectile, settings).time;
        let dt = flightTime / ((MAX_TRAJECTORY_POINTS * 0.95)) * 1000;
        dt = Math.max(dt, settings.simulationQuality);
        return new ProjectileThrowTrajectory(projectile, dt, settings.radius, settings.heightReference);
    }
}
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
class ProjectileThrowSettings {
    constructor() {
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
    get showAxes() { return this._showAxes; }
    get showAxesLabels() { return this._showAxesLabels; }
    get showGrid() { return this._showGrid; }
    get showTrajectory() { return this._showTrajectory; }
    get showSimulationResults() { return this._showSimulationResults; }
    get simulationQuality() { return this._simulationQuality; }
    get heightReference() { return this._heightReference; }
    get mass() { return this._mass; }
    get radius() { return this._radius; }
    get height() { return this._height; }
    get launchVelocity() { return this._launchVelocity; }
    get airResistance() { return this._airResistance; }
    getFromPage() {
        let settings = new ProjectileThrowSettings();
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
        let parseWithSettingsUpdate = (id, property, validProperty, min = -Infinity, max = Infinity) => {
            settings[property] = parseInputNumber(id, min, max);
            if (isNaN(settings[property])) {
                settings[validProperty] = false;
                settings[property] = this[property];
            }
            else {
                settings[validProperty] = true;
            }
        };
        parseWithSettingsUpdate("mass-input", "_mass", "_validMass", Number.MIN_VALUE);
        parseWithSettingsUpdate("radius-input", "_radius", "_validRadius", Number.MIN_VALUE);
        parseWithSettingsUpdate("height-input", "_height", "_validHeight", 0);
        let stringVx = document.getElementById("vx-input").value;
        let stringVy = document.getElementById("vy-input").value;
        let numberVx = Number(stringVx);
        let numberVy = Number(stringVy);
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
    }
    updatePage() {
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
        let showArrowsCheckbox = document.getElementById("axes-labels");
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
        adjustColor(this._validMass, "mass-input", 2);
        adjustColor(this._validRadius, "radius-input", 2);
        adjustColor(this._validHeight, "height-input", 2);
        adjustColor(this._validVelocity, "vx-input", 2);
        let trajectoryCheckbox = document.getElementById("trajectory");
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
    }
    static updatePageVelocity(velocity) {
        document.getElementById("vx-input").value = velocity.x.toString();
        document.getElementById("vy-input").value = velocity.y.toString();
    }
    static addEvents() {
        let settingsElements = [
            "axes", "axes-labels", "grid", "trajectory", "simulation-results-checkbox",
            "simulation-quality", "body-base", "body-cm", "air-res"
        ];
        function onUpdate() {
            ProjectileThrowSimulation.settings = ProjectileThrowSimulation.settings.getFromPage();
            ProjectileThrowSimulation.settings.updatePage();
        }
        for (let i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("change", onUpdate);
        }
        settingsElements = [
            "mass-input", "radius-input", "height-input", "vx-input", "vy-input"
        ];
        for (let i = 0; i < settingsElements.length; ++i) {
            document.getElementById(settingsElements[i]).addEventListener("input", onUpdate);
        }
    }
    static disableSettingsElements() {
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
    }
    static enableSettingsElements() {
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
    }
}
class ProjectileThrowEvents {
    static addEvents() {
        let moveCallback = (x, y) => {
            this.mousePosition = new Vec2(x * window.devicePixelRatio, y * window.devicePixelRatio);
            if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
                let v = ProjectileThrowSimulation.camera.pointToWorldPosition(this.mousePosition)
                    .subtract(ProjectileThrowSimulation.projectile.r)
                    .scale(3);
                v = new Vec2(ExtraMath.round(v.x, 2), ExtraMath.round(v.y, 2));
                ProjectileThrowSettings.updatePageVelocity(v);
                let proj = Object.create(ProjectileThrowSimulation.projectile);
                proj.v = v;
                ProjectileThrowSimulation.trajectory = ProjectileThrowTrajectory.
                    generateLimitedTrajectory(proj, ProjectileThrowSimulation.settings);
            }
        };
        window.addEventListener("mousemove", (e) => { moveCallback(e.x, e.y); });
        window.addEventListener("touchmove", (e) => {
            if (e.touches.length === 1) {
                moveCallback(e.touches[0].clientX, e.touches[0].clientY);
            }
        });
        document.getElementById("no-script-div").addEventListener("pointerup", () => {
            if (ProjectileThrowSimulation.state === ProjectileThrowState.choosingVelocity) {
                ProjectileThrowStateManager.exitChoosingVelocityMode();
            }
        });
        window.addEventListener("keydown", (e) => {
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
    }
}
ProjectileThrowEvents.mousePosition = new Vec2(0, 0);
var _a;
const BODY_GEOMETRY = ExtraMath.generatePolygon(20, 0.5);
class ProjectileThrowSimulation {
    static parseFrame(frame) {
        let view = new Float64Array(frame);
        return new Vec2(view[0], view[1]);
    }
    static startSimulation() {
        this.projectile.forces = [new Vec2(0, -GRAVITY * 1)];
        ProjectileThrowSettings.addEvents();
        ProjectileThrowEvents.addEvents();
        let theoreticalResults = null;
        let bufferCount = 0;
        let newWorker = () => {
            if (!this.workerStopped) {
                if (this.parallelWorker) {
                    this.parallelWorker.terminate();
                }
                this.parallelWorker = new WorkerWrapper("../../js/ProjectileThrow/ProjectileThrowWorker.js", this.settings.simulationQuality, (w, data) => {
                    let keys = Object.keys(data);
                    if (keys.indexOf("time") !== -1 && keys.indexOf("distance") !== -1 &&
                        keys.indexOf("maxHeight") !== -1) {
                        let results = new ProjectileThrowResults();
                        results.time = data.time;
                        results.distance = data.distance;
                        results.maxHeight = data.maxHeight;
                        ProjectileThrowResults.applyToPage(theoreticalResults, results);
                        this.workerStopped = true;
                    }
                    else {
                        this.parallelWorker.addBuffer(new NumberedBuffer(bufferCount, data.size, data.buf, 16));
                        bufferCount++;
                    }
                }, 512, 16);
            }
        };
        newWorker();
        this.settings = this.settings.getFromPage();
        this.settings.updatePage();
        let elapsedSimulationTime = 0;
        let lastRendererTick = Date.now();
        this.renderer = new Renderer(window, document.getElementById("canvas"), () => {
            let bodyFrame = [];
            if (this.state === ProjectileThrowState.projectileMoving)
                bodyFrame = this.parallelWorker.getBoundaryBuffers(elapsedSimulationTime, true);
            if (bodyFrame.length === 0) {
                if (this.workerStopped && this.state === ProjectileThrowState.projectileMoving) {
                    this.state = ProjectileThrowState.projectileStopped;
                    ProjectileThrowSettings.enableSettingsElements();
                    this.projectile.r = this.parseFrame(this.parallelWorker.getLastFrame());
                    if (this.settings.showSimulationResults) {
                        ProjectileThrowStateManager.showSimulationResults();
                    }
                }
                lastRendererTick = Date.now();
            }
            else {
                this.projectile.r = ExtraMath.linearInterpolationVec2(this.parseFrame(bodyFrame[0]), this.parseFrame(bodyFrame[1]), this.settings.simulationQuality, elapsedSimulationTime % this.settings.simulationQuality);
                elapsedSimulationTime += Date.now() - lastRendererTick;
                lastRendererTick = Date.now();
            }
            this.camera.forcePosition(this.projectile.r, this.camera.canvasSize.scale(0.5));
            this.axes.drawAxes(this.renderer);
            this.renderer.renderPolygon(this.camera.polygonToScreenPosition(this.projectile.transformGeometry()), "red");
            if (this.state === ProjectileThrowState.choosingVelocity) {
                this.renderer.renderLines([
                    this.camera.pointToScreenPosition(this.projectile.transformVertex(new Vec2())),
                    ProjectileThrowEvents.mousePosition
                ], "#00ff00", 2);
            }
            if (this.settings.showTrajectory && this.trajectory) {
                this.renderer.renderLinesStrip(this.camera.polygonToScreenPosition(this.trajectory.points), "white", 2);
            }
        }, () => {
            this.renderer.canvas.width = window.innerWidth * window.devicePixelRatio;
            this.renderer.canvas.height = window.innerHeight * window.devicePixelRatio;
            let renderingSurfaceSize = new Vec2();
            if (isPortrait()) {
                renderingSurfaceSize = new Vec2(window.innerWidth, window.innerHeight)
                    .scale(window.devicePixelRatio);
            }
            else {
                renderingSurfaceSize = new Vec2(window.innerWidth -
                    document.getElementById("simulation-interaction-div").clientWidth, window.innerHeight).scale(window.devicePixelRatio);
            }
            this.camera.canvasSize = renderingSurfaceSize;
            ProjectileThrowStateManager.scaleSimulationResults();
        });
        this.renderer.renderLoop();
        document.getElementById("choose-screen-velocity").addEventListener("click", () => {
            if (this.state === ProjectileThrowState.projectileInLaunchPosition ||
                this.state === ProjectileThrowState.projectileStopped) {
                ProjectileThrowStateManager.enterChoosingVelocityMode();
            }
        });
        document.getElementById("simulation-results-ok").addEventListener("click", () => {
            ProjectileThrowStateManager.hideSimulationResults();
        });
        document.getElementById("reset-button").addEventListener("click", () => {
            if (this.state === ProjectileThrowState.projectileMoving) {
                newWorker();
                ProjectileThrowSettings.enableSettingsElements();
            }
            if (this.state === ProjectileThrowState.choosingVelocity)
                ProjectileThrowStateManager.exitChoosingVelocityMode();
            this.state = ProjectileThrowState.projectileInLaunchPosition;
            this.settings.updatePage();
        });
        document.getElementById("launch-button").addEventListener("click", () => {
            if (this.state === ProjectileThrowState.projectileMoving) {
                newWorker();
            }
            if (this.state === ProjectileThrowState.choosingVelocity)
                ProjectileThrowStateManager.exitChoosingVelocityMode();
            ProjectileThrowSimulation.state = ProjectileThrowState.projectileInLaunchPosition;
            this.settings = this.settings.getFromPage();
            this.settings.updatePage();
            smoothScroll(0, 0, () => {
                elapsedSimulationTime = 0;
                lastRendererTick = Date.now();
                this.workerStopped = false;
                theoreticalResults = ProjectileThrowResults.calculateTheoreticalResults(this.projectile, this.settings);
                bufferCount = 0;
                this.parallelWorker.start({
                    projectile: ProjectileThrowSimulation.projectile,
                    bodyRadius: ProjectileThrowSimulation.settings.radius,
                    airResistance: ProjectileThrowSimulation.settings.airResistance,
                    heightReference: ProjectileThrowSimulation.settings.heightReference
                }, this.settings.simulationQuality);
                this.state = ProjectileThrowState.projectileMoving;
                ProjectileThrowSettings.disableSettingsElements();
            });
        });
    }
}
_a = ProjectileThrowSimulation;
ProjectileThrowSimulation.state = ProjectileThrowState.projectileInLaunchPosition;
ProjectileThrowSimulation.workerStopped = false;
ProjectileThrowSimulation.trajectory = new ProjectileThrowTrajectory();
ProjectileThrowSimulation.projectile = new Body(1, BODY_GEOMETRY, new Vec2(0, 0));
ProjectileThrowSimulation.settings = new ProjectileThrowSettings();
ProjectileThrowSimulation.velocityBeforeChoosing = new Vec2();
ProjectileThrowSimulation.camera = new Camera(new Vec2(), new Vec2(32, 32));
ProjectileThrowSimulation.axes = new AxisSystem(_a.camera, true, true, false, true, true, true, true, false, false, false, true, true, 64, 64, new Vec2(), "x", "y", "white", 2, "1rem sans-serif", "#555555", 1, "black");
window.addEventListener("load", () => {
    ProjectileThrowSimulation.startSimulation();
});
