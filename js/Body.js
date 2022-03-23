var GRAVITY = 9.8;
var AIR_DENSITY = 1.225;
var Body = (function () {
    function Body(mass, geometry, r) {
        if (r === void 0) { r = new Vec2(); }
        this.mass = mass;
        this.r = r;
        this.v = new Vec2(0, 0);
        this.forces = [];
        this.geometry = geometry;
    }
    Body.prototype.transformVertex = function (vec) {
        return vec.add(this.r);
    };
    Body.prototype.transformGeometry = function (geometry) {
        var _this = this;
        if (geometry === void 0) { geometry = this.geometry; }
        return geometry.map(function (v) { return _this.transformVertex(v); });
    };
    Body.prototype.step = function (dt) {
        dt *= 0.001;
        var Fr = new Vec2();
        for (var i = 0; i < this.forces.length; ++i) {
            Fr = Fr.add(this.forces[i]);
        }
        var a = Fr.scale(1 / this.mass);
        this.v = this.v.add(a.scale(dt));
        this.r = this.r.add(this.v.scale(dt));
    };
    return Body;
}());
