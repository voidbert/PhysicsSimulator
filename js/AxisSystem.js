var MAX_GRID_SIZE = 64;
//A class made to render the x and y axes to the screen.
var AxisSystem = /** @class */ (function () {
    //margin -> the number of pixels from the end of the axis (positive and negative) and the
    //borders of the camera's rendering area.
    //showArrows -> whether or not to draw arrows showing the positive orientation
    //onlyPositive -> if true, only the positive parts of the axes.
    //
    //labelFont MUST BE in px or in rem.
    //
    //The constructor doesn't generate the axes' caches. Do that when you are sure the camera has a
    //set canvasSize
    function AxisSystem(camera, showAxes, showArrows, axisColor, axisWidth, showGrid, gridColor, gridWidth, showAxisLabels, showUnitLabels, labelFont, pageBackgroundColor, onlyPositive) {
        if (showAxes === void 0) { showAxes = true; }
        if (showArrows === void 0) { showArrows = true; }
        if (axisColor === void 0) { axisColor = "#000000"; }
        if (axisWidth === void 0) { axisWidth = 2; }
        if (showGrid === void 0) { showGrid = false; }
        if (gridColor === void 0) { gridColor = "#cccccc"; }
        if (gridWidth === void 0) { gridWidth = 1; }
        if (showAxisLabels === void 0) { showAxisLabels = false; }
        if (showUnitLabels === void 0) { showUnitLabels = false; }
        if (pageBackgroundColor === void 0) { pageBackgroundColor = "#ffffff"; }
        if (onlyPositive === void 0) { onlyPositive = true; }
        //The AxisSystem keeps the coordinates of the lines to be drawn cached, so that these don't have
        //to be generated every frame. See AxisSystem.updateCaches().
        this.cachedAxesBaseLines = [];
        this.cachedArrowPolygons = [];
        this.cachedAxesScaleLines = [];
        this.cachedGridLines = [];
        this.camera = camera;
        this.showAxes = showAxes;
        this.showArrows = showArrows;
        this.axisColor = axisColor;
        this.axisWidth = axisWidth;
        this.showGrid = showGrid;
        this.gridColor = gridColor;
        this.gridWidth = gridWidth;
        this.showAxisLabels = showAxisLabels;
        this.showUnitLabels = showUnitLabels;
        this.labelFont = labelFont;
        this.pageBackgroundColor = pageBackgroundColor;
        this.onlyPositive = onlyPositive;
    }
    //Generates the points to renderer the axes' base lines (without any scaling marks or labeling)
    AxisSystem.prototype.generateAxesBaseLines = function () {
        //Get the points of the lines to be rendered (based on the screen coordinates of the origin)
        var linePoints = [];
        var origin = this.camera.pointToScreenPosition(new Vec2(0, 0));
        if (this.onlyPositive) {
            linePoints = [
                /* X */ origin, new Vec2(this.camera.canvasSize.x, origin.y),
                /* Y */ origin, new Vec2(origin.x, 0)
            ];
        }
        else {
            linePoints = [
                /* X */ new Vec2(0, origin.y), new Vec2(this.camera.canvasSize.x, origin.y),
                /* Y */ new Vec2(origin.x, 0), new Vec2(origin.x, this.camera.canvasSize.y),
            ];
        }
        return linePoints;
    };
    //Returns the ideal scaling for the axes with the current camera settings. The returned object
    //contains the number of pixels of each axis division (gridScreenSize) and its equivalent in
    //world size (gridWorldSize).
    AxisSystem.prototype.generateAxesScale = function () {
        //Calculate the grid division (O(1))
        var maxGridWorldSize = MAX_GRID_SIZE / this.camera.scale;
        var realGridWorldSize = Math.floor(maxGridWorldSize);
        //If the scale is less than 1, flooring it would make it 0 and the app would crash. Let the
        //scale assume values in the sequence 0.5^n.
        if (realGridWorldSize === 0) {
            var multiplier = Math.round(Math.log(maxGridWorldSize) / Math.log(0.5));
            realGridWorldSize = Math.pow(0.5, multiplier);
            //Prevention measure. I think this won't happen but its better to get a wrong axis scale
            //than a complete program crash.
            if (realGridWorldSize === 0) {
                realGridWorldSize = 0.5;
            }
        }
        return {
            gridWorldSize: realGridWorldSize,
            gridScreenSize: realGridWorldSize * this.camera.scale
        };
    };
    //Generates the two triangles at the end of the axes (x and y).
    AxisSystem.prototype.generateArrows = function () {
        var origin = this.camera.pointToScreenPosition(new Vec2(0, 0));
        var arrows = [[
                //X axis arrow
                new Vec2(this.camera.canvasSize.x, origin.y),
                new Vec2(this.camera.canvasSize.x - this.axisWidth * 3.5, origin.y - this.axisWidth * 3.5),
                new Vec2(this.camera.canvasSize.x - this.axisWidth * 3.5, origin.y + this.axisWidth * 3.5),
            ], [
                //Y axis arrow
                new Vec2(origin.x, 0),
                new Vec2(origin.x - this.axisWidth * 3.5, this.axisWidth * 3.5),
                new Vec2(origin.x + this.axisWidth * 3.5, this.axisWidth * 3.5),
            ]];
        return arrows;
    };
    //Generates where each vertical grid line (or axis split should be).
    AxisSystem.prototype.generateGridAndAxesXSplits = function (gridScreenSize, callback) {
        var origin = this.camera.pointToScreenPosition(new Vec2(0, 0));
        if (!this.onlyPositive) {
            //Start from the origin and fill the negative parts of the axes
            for (var x = origin.x; x >= 0; x -= gridScreenSize) {
                callback(x);
            }
        }
        //Start from the origin and determine the positive positions of the splits
        for (var x = origin.x; x <= this.camera.canvasSize.x; x += gridScreenSize) {
            callback(x);
        }
    };
    //Generates where each horizontal grid line (or axis split should be).
    AxisSystem.prototype.generateGridAndAxesYSplits = function (gridScreenSize, callback) {
        var origin = this.camera.pointToScreenPosition(new Vec2(0, 0));
        if (!this.onlyPositive) {
            //Start from the origin and fill the negative parts of the axes
            for (var y = origin.y; y <= this.camera.canvasSize.y; y += gridScreenSize) {
                callback(y);
            }
        }
        //Start from the origin and determine the positive positions of the splits
        for (var y = origin.y; y >= 0; y -= gridScreenSize) {
            callback(y);
        }
    };
    //Generates the tiny lines that are responsible for showing the scale of the axes.
    AxisSystem.prototype.generateAxesScaleLines = function (gridScreenSize) {
        var _this = this;
        //Get the points of the lines to be rendered (based on the screen coordinates of the origin)
        var linePoints = [];
        var origin = this.camera.pointToScreenPosition(new Vec2(0, 0));
        this.generateGridAndAxesXSplits(gridScreenSize, function (x) {
            linePoints.push(new Vec2(x, origin.y - _this.axisWidth), new Vec2(x, origin.y + _this.axisWidth));
        });
        this.generateGridAndAxesYSplits(gridScreenSize, function (y) {
            linePoints.push(new Vec2(origin.x - _this.axisWidth, y), new Vec2(origin.x + _this.axisWidth, y));
        });
        return linePoints;
    };
    AxisSystem.prototype.generateGridLines = function (gridScreenSize) {
        var _this = this;
        //Get the points of the lines to be rendered (based on the screen coordinates of the origin)
        var linePoints = [];
        var origin = this.camera.pointToScreenPosition(new Vec2(0, 0));
        this.generateGridAndAxesXSplits(gridScreenSize, function (x) {
            if (_this.onlyPositive) {
                linePoints.push(new Vec2(x, 0), new Vec2(x, origin.y));
            }
            else {
                linePoints.push(new Vec2(x, 0), new Vec2(x, _this.camera.canvasSize.y));
            }
        });
        this.generateGridAndAxesYSplits(gridScreenSize, function (y) {
            if (_this.onlyPositive) {
                linePoints.push(new Vec2(origin.x, y), new Vec2(_this.camera.canvasSize.x, y));
            }
            else {
                linePoints.push(new Vec2(0, y), new Vec2(_this.camera.canvasSize.x, y));
            }
        });
        return linePoints;
    };
    //This class caches the coordinates of the axis. These need to be updated when anything in the
    //camera is updated (position, scale, canvas size, ...) or when either showGrid, showArrows or
    //onlyPositive is changed.
    AxisSystem.prototype.updateCaches = function () {
        this.cachedAxesScale = this.generateAxesScale();
        this.cachedArrowPolygons = this.generateArrows();
        this.cachedAxesBaseLines = this.generateAxesBaseLines();
        this.cachedAxesScaleLines = this.generateAxesScaleLines(this.cachedAxesScale.gridScreenSize);
        this.cachedGridLines = this.generateGridLines(this.cachedAxesScale.gridScreenSize);
    };
    AxisSystem.prototype.drawAxes = function (renderer) {
        var _this = this;
        //Draw the grid
        if (this.showGrid) {
            renderer.renderLines(this.cachedGridLines, this.gridColor, this.gridWidth);
        }
        //Draw the axis lines (base and unit separators)
        if (this.showAxes) {
            renderer.renderLines(this.cachedAxesBaseLines, this.axisColor, this.axisWidth);
            renderer.renderLines(this.cachedAxesScaleLines, this.axisColor, this.axisWidth);
        }
        //Draw the arrows
        if (this.showArrows) {
            for (var i = 0; i < this.cachedArrowPolygons.length; ++i) {
                renderer.renderPolygon(this.cachedArrowPolygons[i], this.axisColor);
            }
        }
        var origin = this.camera.pointToScreenPosition(new Vec2(0, 0));
        //Unit labels
        if (this.showUnitLabels) {
            renderer.ctx.fillStyle = this.axisColor;
            //x axis labels
            renderer.ctx.textAlign = "center";
            renderer.ctx.textBaseline = "top";
            this.generateGridAndAxesXSplits(this.cachedAxesScale.gridScreenSize, function (x) {
                if (x === origin.x) //Don't draw 0 in the origin
                    return;
                //Round the number to 2 decimal places (toFixed(2)) and don't have excess 0s
                //(conversion to Number and back to string).
                var text = Number((((x - origin.x) * _this.cachedAxesScale.gridWorldSize) /
                    _this.cachedAxesScale.gridScreenSize).toFixed(2)).toString();
                renderer.ctx.fillText(text, x, origin.y + 10);
            });
            //y axis labels
            renderer.ctx.textAlign = "right";
            renderer.ctx.textBaseline = "middle";
            this.generateGridAndAxesYSplits(this.cachedAxesScale.gridScreenSize, function (y) {
                if (y === origin.y) //Don't draw 0 in the origin
                    return;
                //Round the number to 2 decimal places (toFixed(2)) and don't have excess 0s
                //(conversion to Number and back to string).
                var text = Number((((origin.y - y) * _this.cachedAxesScale.gridWorldSize) /
                    _this.cachedAxesScale.gridScreenSize).toFixed(2)).toString();
                renderer.ctx.fillText(text, origin.x - 10, y);
            });
        }
        //Axis labels
        if (this.showAxisLabels) {
            renderer.ctx.textAlign = "right";
            renderer.ctx.textBaseline = "top";
            renderer.ctx.font = this.labelFont;
            //Render squares behind the text so that it is visible.
            renderer.ctx.fillStyle = this.pageBackgroundColor;
            //x
            var measure = renderer.ctx.measureText("x").width;
            renderer.ctx.fillRect(this.camera.canvasSize.x - 10 - measure, origin.y + this.axisWidth * 3.5 + 5, measure, renderer.fontHeight());
            //y
            measure = renderer.ctx.measureText("y").width;
            renderer.ctx.fillRect(origin.x - this.axisWidth * 3.5 - 5 - measure, 10, measure, renderer.fontHeight());
            //It isn't expected for there to be text under the origin of the axis system. Therefore,
            //don't draw the rectangle.
            //Render the text
            renderer.ctx.fillStyle = this.axisColor;
            renderer.ctx.fillText("x", this.camera.canvasSize.x - 10, origin.y + this.axisWidth * 3.5 + 5);
            renderer.ctx.fillText("y", origin.x - this.axisWidth * 3.5 - 5, 10);
            renderer.ctx.fillText("O", origin.x - 10, origin.y + 10);
        }
    };
    return AxisSystem;
}());
