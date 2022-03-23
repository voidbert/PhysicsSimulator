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
