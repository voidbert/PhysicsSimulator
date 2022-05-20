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
var SolarSystemState;
(function (SolarSystemState) {
    SolarSystemState[SolarSystemState["ChoosingSimulationQuality"] = 0] = "ChoosingSimulationQuality";
    SolarSystemState[SolarSystemState["NormalSimulation"] = 1] = "NormalSimulation";
    SolarSystemState[SolarSystemState["ShowingSettings"] = 2] = "ShowingSettings";
})(SolarSystemState || (SolarSystemState = {}));
class SolarSystemStateManager {
    static leaveChoosingSimulationQualityMode() {
        document.getElementById("choose-simulation-quality").style.display = "none";
        document.documentElement.style.setProperty("--initial-ui-div-display", "block");
        SolarSystemSimulation.state = SolarSystemState.NormalSimulation;
    }
    static enterShowingSettingsMode() {
        document.documentElement.style.setProperty("--ui-div-display", "block");
        SolarSystemSimulation.state = SolarSystemState.ShowingSettings;
    }
    static leaveShowingSettingsMode() {
        document.documentElement.style.setProperty("--ui-div-display", "none");
        SolarSystemSimulation.state = SolarSystemState.NormalSimulation;
    }
}
var SolarSystemPauseReason;
(function (SolarSystemPauseReason) {
    SolarSystemPauseReason[SolarSystemPauseReason["LackOfData"] = 0] = "LackOfData";
    SolarSystemPauseReason[SolarSystemPauseReason["UserAction"] = 1] = "UserAction";
})(SolarSystemPauseReason || (SolarSystemPauseReason = {}));
const SIMULATION_SPEED_CORRESPONDENCE = [
    86400,
    172800,
    432000,
    864000,
    1728000,
    4320000,
    8640000
];
class SolarSystemTimeManager {
    constructor() { }
    start() {
        this.lastUpdate = Date.now();
        this.lastUpdateCorrespondence = 0;
        this.isPaused = false;
    }
    pause(reason) {
        this.lastUpdateCorrespondence += Date.now() - this.lastUpdate;
        this.lastUpdate = Date.now();
        this.isPaused = true;
        this.pauseReason = reason;
    }
    resume() {
        this.lastUpdate = Date.now();
        this.isPaused = false;
    }
    getTime() {
        if (this.isPaused) {
            return this.lastUpdateCorrespondence;
        }
        else {
            this.lastUpdateCorrespondence += (Date.now() - this.lastUpdate) *
                SIMULATION_SPEED_CORRESPONDENCE[SolarSystemSimulation.settings.simulationSpeed];
            this.lastUpdate = Date.now();
            return this.lastUpdateCorrespondence;
        }
    }
}
class SolarSystemPlanetCharacteristics {
    constructor(radius = 1, color = "#fff") {
        this.radius = radius;
        this.color = color;
    }
}
const SINGLE_ORBIT_ANGLE = {
    "VeryLow": Math.PI * 0.20,
    "Low": Math.PI * 0.08,
    "Medium": Math.PI * 0.03,
    "High": Math.PI * 0.01,
    "VeryHigh": Math.PI * 0.01
};
class SolarSystemBodyManager {
    constructor(bodies, characteristics) {
        var _a;
        this.bufferCount = 0;
        this.parallelWorker = new WorkerWrapper("../../js/SolarSystem/SolarSystemWorker.js", SolarSystemSimulation.settings.simulationQuality, (w, data) => {
            this.parallelWorker.addBuffer(new NumberedBuffer(this.bufferCount, data.size, data.buf, bodies.length * 16));
            this.bufferCount++;
        }, 1024, 16);
        this.bodies = bodies;
        this.bodyCharacteristics = characteristics;
        if (this.bodies.length > this.bodyCharacteristics.length) {
            console.error("SolarSystemBodyManager: different number of planets and characteristics");
            let newArray = new Array(this.bodies.length);
            for (let i = 0; i < this.bodies.length; ++i) {
                newArray[i] = (_a = characteristics[i]) !== null && _a !== void 0 ? _a : new SolarSystemPlanetCharacteristics();
            }
            this.bodyCharacteristics = newArray;
        }
        this.parallelWorker.start({ bodies: this.bodies }, SolarSystemSimulation.settings.simulationQuality);
    }
    updatePositions(instant, simulationQuality) {
        let buffers = this.parallelWorker.getBoundaryBuffers(instant, true, true);
        if (buffers.length === 0) {
            SolarSystemSimulation.timeManager.pause(SolarSystemPauseReason.LackOfData);
        }
        else {
            if (SolarSystemSimulation.timeManager.pauseReason ===
                SolarSystemPauseReason.LackOfData) {
                SolarSystemSimulation.timeManager.resume();
            }
            let buf1 = new Float64Array(buffers[0]);
            let buf2 = new Float64Array(buffers[1]);
            let length = Math.max(buf1.length, buf2.length, this.bodies.length * 2) / 2;
            for (let i = 0; i < length; ++i) {
                this.bodies[i].r = ExtraMath.linearInterpolationVec2(new Vec2(buf1[i * 2], buf1[i * 2 + 1]), new Vec2(buf2[i * 2], buf2[i * 2 + 1]), simulationQuality, instant % simulationQuality);
            }
        }
    }
    renderBodies(renderer, camera, time) {
        for (let i = 0; i < this.bodies.length; ++i) {
            let scale = 0;
            if (i === 0) {
                scale = 1 + 5 * SolarSystemSimulation.settings.bodyRadius;
            }
            else if (i <= 4) {
                scale = 1 + 200 * SolarSystemSimulation.settings.bodyRadius;
            }
            else {
                scale = 1 + 50 * SolarSystemSimulation.settings.bodyRadius;
            }
            let geometry = this.bodies[i].geometry.map((point) => {
                return camera.pointToScreenPosition(this.bodies[i].transformVertex(point.scale(this.bodyCharacteristics[i].radius * scale)));
            });
            renderer.renderPolygon(geometry, this.bodyCharacteristics[i].color);
        }
        if (!SolarSystemSimulation.settings.seeOrbits)
            return;
        renderer.ctx.strokeStyle = "#fff";
        renderer.ctx.lineWidth = 1;
        let limitAngleCosine = Math.cos(SINGLE_ORBIT_ANGLE[SolarSystemSimulationQuality[SolarSystemSimulation.settings.simulationQuality]]);
        for (let i = 0; i < this.bodies.length; ++i) {
            let vectorReal = this.bodies[i].r.subtract(this.bodies[0].r);
            let currentBuffer;
            let bufferArrayView;
            let currentBufferNumber;
            let currentFrameNumber;
            let updateFrame = () => {
                if (currentFrameNumber >= this.parallelWorker.bufferSize) {
                    currentFrameNumber -= this.parallelWorker.bufferSize;
                    currentBufferNumber++;
                    currentBuffer = this.parallelWorker.getBuffer(currentBufferNumber);
                }
                if (currentBuffer === null) {
                    return null;
                }
                else {
                    bufferArrayView = new Float64Array(currentBuffer.buffer);
                }
                return new Vec2(bufferArrayView[this.bodies.length * 2 * currentFrameNumber + i * 2], bufferArrayView[this.bodies.length * 2 * currentFrameNumber + i * 2 + 1]);
            };
            let frameNumber = Math.floor(time /
                SolarSystemSimulation.settings.simulationQuality) + 1;
            currentBufferNumber = Math.floor(frameNumber / this.parallelWorker.bufferSize);
            currentFrameNumber = frameNumber - currentBufferNumber * this.parallelWorker.bufferSize;
            currentBuffer = this.parallelWorker.getBuffer(currentBufferNumber);
            if (currentBuffer === null) {
                return;
            }
            else {
                bufferArrayView = new Float64Array(currentBuffer.buffer);
            }
            let frame = updateFrame();
            let elapsed = 0;
            renderer.ctx.beginPath();
            let cameraPosition = camera.pointToScreenPosition(frame);
            renderer.ctx.moveTo(cameraPosition.x, cameraPosition.y);
            while (frame !== null) {
                cameraPosition = camera.pointToScreenPosition(frame);
                renderer.ctx.lineTo(cameraPosition.x, cameraPosition.y);
                if (SolarSystemSimulation.settings.singleOrbits) {
                    if (i !== 0 &&
                        (elapsed >= 80 * 86400000 && i <= 4 || elapsed >= 4000 * 86400000 && i <= 7
                            || elapsed >= 60000 * 86400000)) {
                        let vectorOrbit = frame.subtract(this.bodies[0].r);
                        let angle = vectorOrbit.dotProduct(vectorReal) /
                            (Math.sqrt(vectorOrbit.squareNorm() * vectorReal.squareNorm()));
                        if (angle > limitAngleCosine)
                            break;
                    }
                }
                currentFrameNumber++;
                frame = updateFrame();
                elapsed += SolarSystemSimulation.settings.simulationQuality;
            }
            renderer.ctx.stroke();
        }
    }
}
var SolarSystemSimulationQuality;
(function (SolarSystemSimulationQuality) {
    SolarSystemSimulationQuality[SolarSystemSimulationQuality["VeryLow"] = 864000000] = "VeryLow";
    SolarSystemSimulationQuality[SolarSystemSimulationQuality["Low"] = 432000000] = "Low";
    SolarSystemSimulationQuality[SolarSystemSimulationQuality["Medium"] = 86400000] = "Medium";
    SolarSystemSimulationQuality[SolarSystemSimulationQuality["High"] = 43200000] = "High";
    SolarSystemSimulationQuality[SolarSystemSimulationQuality["VeryHigh"] = 8640000] = "VeryHigh";
})(SolarSystemSimulationQuality || (SolarSystemSimulationQuality = {}));
class SolarSystemSettings {
    constructor() {
        this._simulationQuality = SolarSystemSimulationQuality.High;
    }
    get simulationQuality() { return this._simulationQuality; }
    get simulationSpeed() { return this._simulationSpeed; }
    get seeOrbits() { return this._seeOrbits; }
    get singleOrbits() { return this._singleOrbits; }
    get bodyRadius() { return this._bodyRadius; }
    getFromPage() {
        let settings = new SolarSystemSettings();
        settings._simulationQuality = {
            "vl": SolarSystemSimulationQuality.VeryLow,
            "l": SolarSystemSimulationQuality.Low,
            "m": SolarSystemSimulationQuality.Medium,
            "h": SolarSystemSimulationQuality.High,
            "vh": SolarSystemSimulationQuality.VeryHigh
        }[document.getElementById("simulation-quality").value];
        settings._simulationSpeed =
            parseInt(document.getElementById("sim-speed").value);
        settings._seeOrbits = document.getElementById("orbits").checked;
        settings._singleOrbits =
            document.getElementById("single-orbit").checked;
        settings._bodyRadius =
            parseInt(document.getElementById("body-radius").value);
        return settings;
    }
    updatePage() {
        if (this.seeOrbits) {
            document.getElementById("single-orbit").disabled = false;
        }
        else {
            document.getElementById("single-orbit").disabled = true;
        }
    }
    static addEvents() {
        document.getElementById("quality-confirm-button").addEventListener("click", () => {
            SolarSystemSimulation.settings = SolarSystemSimulation.settings.getFromPage();
            SolarSystemSimulation.settings.updatePage();
            SolarSystemSimulation.startSimulation();
        });
        let elements = [
            document.getElementById("sim-speed"), document.getElementById("orbits"),
            document.getElementById("single-orbit"), document.getElementById("body-radius")
        ];
        for (let i = 0; i < elements.length; ++i) {
            elements[i].addEventListener("input", () => {
                SolarSystemSimulation.settings = SolarSystemSimulation.settings.getFromPage();
                SolarSystemSimulation.settings.updatePage();
            });
        }
    }
}
const PLANET_GEOMETRY = ExtraMath.generatePolygon(50, 1);
class SolarSystemSimulation {
    static generateSolarSystem() {
        let bodies = [
            new Body(1.988e30, PLANET_GEOMETRY, new Vec2(0, 0)),
            new Body(3.30e23, PLANET_GEOMETRY, new Vec2(0, 5.790e10)),
            new Body(4.87e24, PLANET_GEOMETRY, new Vec2(0, 1.082e11)),
            new Body(5.97e24, PLANET_GEOMETRY, new Vec2(0, 1.496e11)),
            new Body(6.42e23, PLANET_GEOMETRY, new Vec2(0, 2.280e11)),
            new Body(1.898e27, PLANET_GEOMETRY, new Vec2(0, 7.785e11)),
            new Body(5.68e26, PLANET_GEOMETRY, new Vec2(0, 1.432e12)),
            new Body(8.68e25, PLANET_GEOMETRY, new Vec2(0, 2.867e12)),
            new Body(1.02e26, PLANET_GEOMETRY, new Vec2(0, 4.515e12))
        ];
        bodies[1].v = new Vec2(-47400, 0);
        bodies[2].v = new Vec2(-35000, 0);
        bodies[3].v = new Vec2(-29800, 0);
        bodies[4].v = new Vec2(-24100, 0);
        bodies[5].v = new Vec2(-13100, 0);
        bodies[6].v = new Vec2(-9700, 0);
        bodies[7].v = new Vec2(-6800, 0);
        bodies[8].v = new Vec2(-5400, 0);
        let characteristics = [
            new SolarSystemPlanetCharacteristics(6.957e8, "#f59f00"),
            new SolarSystemPlanetCharacteristics(2439500, "#adb5bd"),
            new SolarSystemPlanetCharacteristics(6052000, "#ffc078"),
            new SolarSystemPlanetCharacteristics(6378000, "#1864ab"),
            new SolarSystemPlanetCharacteristics(3396000, "#d9480f"),
            new SolarSystemPlanetCharacteristics(71492000, "#e67700"),
            new SolarSystemPlanetCharacteristics(60268000, "#ffc078"),
            new SolarSystemPlanetCharacteristics(25559000, "#74c0fc"),
            new SolarSystemPlanetCharacteristics(24764000, "#1864ab"),
        ];
        this.bodyManager = new SolarSystemBodyManager(bodies, characteristics);
    }
    static startPage() {
        SolarSystemSettings.addEvents();
        SolarSystemEvents.addEvents();
    }
    static startSimulation() {
        this.generateSolarSystem();
        this.timeManager = new SolarSystemTimeManager();
        this.timeManager.start();
        this.renderer = new Renderer(window, document.getElementById("canvas"), () => {
            this.bodyManager.updatePositions(this.timeManager.getTime(), this.settings.simulationQuality);
            this.bodyManager.renderBodies(this.renderer, this.camera, this.timeManager.getTime());
            if (this.timeManager.isPaused &&
                this.timeManager.pauseReason == SolarSystemPauseReason.UserAction) {
                this.renderer.ctx.strokeStyle = "#f00";
                this.renderer.ctx.lineWidth = 5;
                this.renderer.ctx.strokeRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);
            }
        }, () => {
            this.renderer.canvas.width = window.innerWidth * window.devicePixelRatio;
            this.renderer.canvas.height = window.innerHeight * window.devicePixelRatio;
            this.camera.canvasSize =
                new Vec2(this.renderer.canvas.width, this.renderer.canvas.height);
            if (!isPortrait() && this.state === SolarSystemState.ShowingSettings) {
                SolarSystemStateManager.leaveShowingSettingsMode();
            }
        });
        this.renderer.renderLoop();
        this.camera.forcePosition(new Vec2(0, 0), this.camera.canvasSize.scale(0.5));
    }
}
SolarSystemSimulation.state = SolarSystemState.ChoosingSimulationQuality;
SolarSystemSimulation.settings = new SolarSystemSettings();
SolarSystemSimulation.camera = new Camera(new Vec2(), new Vec2(3e-9, 3e-9));
window.addEventListener("load", () => {
    document.getElementById("noscript-container").style.display = "none";
    SolarSystemSimulation.startPage();
});
class SolarSystemEvents {
    static isKeyDown(key) {
        var _a;
        return (_a = this.keysDown[key]) !== null && _a !== void 0 ? _a : false;
    }
    static getKeysDown() {
        let ret = [];
        let keys = Object.keys(this.keysDown);
        for (let i = 0; i < keys.length; ++i) {
            if (this.keysDown[keys[i]]) {
                ret.push(keys[i]);
            }
        }
        return ret;
    }
    static addEvents() {
        window.addEventListener("keypress", (e) => {
            if (e.key == " " && SolarSystemSimulation.timeManager) {
                if (SolarSystemSimulation.timeManager.isPaused) {
                    SolarSystemSimulation.timeManager.resume();
                }
                else {
                    SolarSystemSimulation.timeManager.pause(SolarSystemPauseReason.UserAction);
                }
            }
        });
        window.addEventListener("wheel", (e) => {
            let mouseWorldPosition = SolarSystemSimulation.camera.pointToWorldPosition(mouseScreenPosition);
            SolarSystemSimulation.camera.scale =
                SolarSystemSimulation.camera.scale.scale(e.deltaY > 0 ? 0.85 : 1.15);
            SolarSystemSimulation.camera.forcePosition(mouseWorldPosition, mouseScreenPosition);
        });
        window.addEventListener("keydown", (e) => {
            this.keysDown[e.key.toLocaleLowerCase()] = true;
        });
        window.addEventListener("keyup", (e) => {
            this.keysDown[e.key.toLocaleLowerCase()] = false;
        });
        window.addEventListener("blur", () => {
            this.keysDown = {};
        });
        window.setInterval(() => {
            var _a;
            const MOVEMENT_SPEED = 20;
            const movementKeyTable = {
                "w": new Vec2(0, MOVEMENT_SPEED),
                "s": new Vec2(0, -MOVEMENT_SPEED),
                "a": new Vec2(-MOVEMENT_SPEED, 0),
                "d": new Vec2(MOVEMENT_SPEED, 0),
                "arrowup": new Vec2(0, MOVEMENT_SPEED),
                "arrowdown": new Vec2(0, -MOVEMENT_SPEED),
                "arrowleft": new Vec2(-MOVEMENT_SPEED, 0),
                "arrowright": new Vec2(MOVEMENT_SPEED, 0)
            };
            let keys = this.getKeysDown();
            let movementVector = new Vec2();
            for (let i = 0; i < keys.length; ++i) {
                movementVector =
                    movementVector.add((_a = movementKeyTable[keys[i].toLocaleLowerCase()]) !== null && _a !== void 0 ? _a : new Vec2());
            }
            SolarSystemSimulation.camera.r = SolarSystemSimulation.camera.r.add(movementVector.scale2(SolarSystemSimulation.camera.scale.invert()));
        }, 50);
        document.getElementById("canvas").addEventListener("click", () => {
            if (isPortrait() && SolarSystemSimulation.state === SolarSystemState.ShowingSettings) {
                SolarSystemStateManager.leaveShowingSettingsMode();
            }
        });
        document.getElementById("settings-icon-container").addEventListener("click", () => {
            if (isPortrait()) {
                if (SolarSystemSimulation.state === SolarSystemState.NormalSimulation) {
                    SolarSystemStateManager.enterShowingSettingsMode();
                }
                else {
                    SolarSystemStateManager.leaveShowingSettingsMode();
                }
            }
        });
        document.getElementById("quality-confirm-button").addEventListener("click", () => {
            SolarSystemStateManager.leaveChoosingSimulationQualityMode();
        });
    }
}
SolarSystemEvents.keysDown = {};
