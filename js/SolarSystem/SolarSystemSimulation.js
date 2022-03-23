var PLANET_GEOMETRY = ExtraMath.generatePolygon(30, 1);
var SIMULATION_QUALITY = 100;
var SolarSystemSimulation = (function () {
    function SolarSystemSimulation() {
    }
    SolarSystemSimulation.startSimulation = function () {
        var _this = this;
        var b1 = new Body(1, PLANET_GEOMETRY, new Vec2(0, 0));
        b1.v = new Vec2(0, 1);
        var b2 = new Body(1, PLANET_GEOMETRY, new Vec2(0, 0));
        b2.v = new Vec2(0, -1);
        this.bodyManager = new SolarSystemBodyManager([b1, b2]);
        this.timeManager = new SolarSystemTimeManager();
        this.timeManager.start();
        this.renderer = new Renderer(window, document.getElementById("canvas"), function () {
            _this.renderer.renderText("Hello, world!", new Vec2(), 0, "white", "60px sans-serif");
            _this.bodyManager.updatePositions(_this.timeManager.getTime(), SIMULATION_QUALITY);
            _this.bodyManager.renderBodies(_this.renderer, _this.camera);
        }, function () {
            _this.renderer.canvas.width = window.innerWidth * window.devicePixelRatio;
            _this.renderer.canvas.height = window.innerHeight * window.devicePixelRatio;
            _this.camera.canvasSize =
                new Vec2(_this.renderer.canvas.width, _this.renderer.canvas.height);
        });
        this.renderer.renderLoop();
    };
    SolarSystemSimulation.camera = new Camera(new Vec2(), new Vec2(32, 32));
    return SolarSystemSimulation;
}());
window.addEventListener("load", function () {
    SolarSystemSimulation.startSimulation();
});
