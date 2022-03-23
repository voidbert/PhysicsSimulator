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
