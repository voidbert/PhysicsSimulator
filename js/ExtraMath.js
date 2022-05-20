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
