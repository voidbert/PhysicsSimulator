//More useful mathematics functions
var ExtraMath = /** @class */ (function () {
    function ExtraMath() {
    }
    //Returns all REAL solutions to a quadratic equation of form ax^2 + bx + c = 0.
    ExtraMath.solveQuadratic = function (a, b, c) {
        var discriminant = (b * b) - (4 * a * c);
        if (discriminant === 0) {
            //Discriminant = 0, one solution
            return [(-b) / (2 * a)];
        }
        else if (discriminant > 0) {
            //Discriminant > 0, two real solutions
            return [
                ((-b) + Math.sqrt(discriminant)) / (2 * a),
                ((-b) - Math.sqrt(discriminant)) / (2 * a),
            ];
        }
        //Discriminant < 0. No real solutions
        return [];
    };
    //Rounds a number to n decimal places
    ExtraMath.round = function (value, decimalPlaces) {
        if (decimalPlaces === void 0) { decimalPlaces = 0; }
        return Math.round(value * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
    };
    //Calculate the relative error (not percentage)
    ExtraMath.relativeError = function (experimental, real) {
        return Math.abs((experimental - real) / real);
    };
    return ExtraMath;
}());
