class ParachuteResults {
    constructor() {
    }
    static calculateTheoreticalResults(settings) {
        let ret = new ParachuteResults();
        function rIntegral(t) {
            return ((2 * settings.mass) / (AIR_DENSITY * settings.A0 * settings.cd0)) *
                Math.log(Math.abs(2 * Math.cosh(Math.sqrt(GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0 /
                    (2 * settings.mass)) * t)));
        }
        ret.r = (t) => {
            return rIntegral(t) - rIntegral(0);
        };
        ret.y = (t) => {
            return settings.h0 - ret.r(t);
        };
        ret.v = (t) => {
            return Math.sqrt((2 * settings.mass * GRAVITY) /
                (AIR_DENSITY * settings.A0 * settings.cd0)) * Math.tanh(Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0) / (2 * settings.mass)) * t);
        };
        ret.a = (t) => {
            return GRAVITY / Math.pow(Math.cosh(Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 * settings.cd0) /
                (2 * settings.mass)) * t), 2);
        };
        ret.Fr = (t) => {
            return ret.a(t) * settings.mass;
        };
        ret.Rair = (t) => {
            let v = ret.v(t);
            return 0.5 * settings.cd0 * AIR_DENSITY * settings.A0 * v * v;
        };
        ret.timeParachuteOpens = Math.acosh(0.5 * Math.exp(((settings.h0 - settings.hopening + rIntegral(0)) * AIR_DENSITY * settings.A0 *
            settings.cd0) / (2 * settings.mass))) / Math.sqrt((GRAVITY * AIR_DENSITY * settings.A0 *
            settings.cd0) / (2 * settings.mass));
        return ret;
    }
    static applyToPage(theoreticalResults, errorAvg, openedInstant) {
        function strigify(n) {
            let parts = n.toExponential().split("e");
            parts[0] = Number(parts[0]).toFixed(2);
            let superscript = "";
            for (let i = 0; i < parts[1].length; ++i) {
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
            let error = ExtraMath.relativeError(openedInstant, theoreticalResults.timeParachuteOpens) * 100;
            document.getElementById("error-opened").textContent = strigify(error);
        }
    }
}
