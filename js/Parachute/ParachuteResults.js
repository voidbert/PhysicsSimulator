var ParachuteResults = (function () {
    function ParachuteResults() {
    }
    ParachuteResults.calculateTheoreticalResults = function (settings) {
        var ret = new ParachuteResults();
        function rIntegral(t) {
            return ((2 * settings.mass) / (AIR_DENSITY * settings.A0 * settings.cd0)) *
                Math.log(Math.abs(2 * Math.cosh(Math.sqrt(GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0 /
                    (2 * settings.mass)) * t)));
        }
        ret.r = function (t) {
            return rIntegral(t) - rIntegral(0);
        };
        ret.y = function (t) {
            return settings.h0 - ret.r(t);
        };
        ret.v = function (t) {
            return Math.sqrt((2 * settings.mass * GRAVITY) /
                (AIR_DENSITY * settings.A0 * settings.cd0)) * Math.tanh(Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0) / (2 * settings.mass)) * t);
        };
        ret.a = function (t) {
            return GRAVITY / Math.pow(Math.cosh(Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0) /
                (2 * settings.mass)) * t), 2);
        };
        ret.Fr = function (t) {
            return ret.a(t) * settings.mass;
        };
        ret.Rair = function (t) {
            var v = ret.v(t);
            return 0.5 * settings.cd0 * AIR_DENSITY * settings.A0 * v * v;
        };
        ret.timeParachuteOpens = Math.acosh(0.5 * Math.exp(((settings.h0 - settings.hopening + rIntegral(0)) * AIR_DENSITY * settings.A0 *
            settings.cd0) / (2 * settings.mass))) / Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 *
            settings.cd0) / (2 * settings.mass));
        return ret;
    };
    ParachuteResults.applyToPage = function (theoreticalResults, errorAvg, openedInstant) {
        function strigify(n) {
            var parts = n.toExponential().split("e");
            parts[0] = Number(parts[0]).toFixed(2);
            var superscript = "";
            for (var i = 0; i < parts[1].length; ++i) {
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
            var error = ExtraMath.relativeError(openedInstant, theoreticalResults.timeParachuteOpens) * 100;
            document.getElementById("error-opened").textContent = strigify(error);
        }
    };
    return ParachuteResults;
}());
