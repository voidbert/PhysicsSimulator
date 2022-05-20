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
