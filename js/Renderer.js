var Renderer = /** @class */ (function () {
    //This constructor should only be called after the window loaded. The provided <canvas> will be
    //resized to fill the window whenever it is resized.
    function Renderer(window, canvas, renderCallback) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.renderCallback = renderCallback;
        canvas.width = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;
        window.addEventListener("resize", function () {
            canvas.width = window.innerWidth * window.devicePixelRatio;
            canvas.height = window.innerHeight * window.devicePixelRatio;
        });
    }
    //A helper function that renders a polygon (set of vertices) to the canvas. If the color is left
    //unset, ctx.fillStyle will be used to fill the polygon.
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
    //Renders a set of lines to the screen. For example, given the vertices {A, B, C, D, E, F}, the
    //following lines will be drawn: (A, B), (C, D), (E, F), meaning that the last point from a line
    //isn't used as the first point for the next one. If the color is left unset, ctx.strokeStyle
    //will be used to draw the line. If lineWidth is -1, ctx.lineWidth will be used.
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
        //Draw the lines
        this.ctx.beginPath();
        for (var i = 0; i < vertices.length; i += 2) {
            this.ctx.moveTo(vertices[i].x, vertices[i].y);
            this.ctx.lineTo(vertices[i + 1].x, vertices[i + 1].y);
        }
        this.ctx.closePath();
        this.ctx.stroke();
    };
    //Renders (single- or multi-line) text to the canvas using textBaseline = "top". If the color or
    //the font is left unset, the rendering context's color and font font will be used. The font
    //size must be provided in px or in rem.
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
        var lineHeight = this.fontHeight();
        var lines = text.split("\n");
        for (var i = 0; i < lines.length; ++i) {
            this.ctx.fillText(lines[i], position.x, position.y);
            position = position.add(new Vec2(0, lineHeight * lineSpacing));
        }
    };
    //Measures the height of the canvas font (if it is in px or in rem). The canvas' font will be
    //set to "10px sans-serif" if the provided font isn't in px or rem.
    Renderer.prototype.fontHeight = function () {
        //Split the canvas font and find its size (px or rem). Convert from rem to px if needed.
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
            //Unknown height. Write an error to the console and use the default font.
            console.log("Unknown font size: using 10px sans-serif");
            height = 10;
            this.ctx.font = "10px sans-serif";
        }
        return height;
    };
    //Starts the rendering loop.
    Renderer.prototype.renderLoop = function () {
        var _this = this;
        //Weird trick to avoid stack overflows (requestAnimationFrame and wait until the frame is
        //rendered).
        var canRenderFrame = true;
        setInterval(function () {
            //Wait until the next frame is rendered before asking to render another one.
            if (canRenderFrame) {
                canRenderFrame = false;
                requestAnimationFrame(function () {
                    _this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
                    _this.renderCallback(_this);
                    canRenderFrame = true;
                });
            }
        }, 10);
    };
    return Renderer;
}());
