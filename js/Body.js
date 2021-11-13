var Body = /** @class */ (function () {
    function Body(mass, geometry, r) {
        if (r === void 0) { r = new Vec2(); }
        this.mass = mass;
        this.r = r;
        this.v = new Vec2(0, 0);
        this.forces = [];
        this.geometry = geometry;
    }
    //Transforms a vector in body coordinates into a vector in world coordinates.
    Body.prototype.transformVertex = function (vec) {
        return vec.add(this.r);
    };
    //Transforms a set of vectors (by default, the body's geometry) into vectors in world
    //coordinates.
    Body.prototype.transformGeometry = function (geometry) {
        var _this = this;
        if (geometry === void 0) { geometry = this.geometry; }
        return geometry.map(function (v) { return _this.transformVertex(v); });
    };
    //Advances the simulation after some time (dt in milliseconds) has passed
    Body.prototype.step = function (dt) {
        dt *= 0.001; //ms -> s
        //Calculate the resultant of the forces and the acceleration
        var Fr = new Vec2();
        for (var i = 0; i < this.forces.length; ++i) {
            Fr = Fr.add(this.forces[i]);
        }
        var a = Fr.scale(1 / this.mass);
        //Add the acceleration to the the velocity and the velocity to the position
        this.v = this.v.add(a.scale(dt));
        this.r = this.r.add(this.v.scale(dt));
    };
    return Body;
}());
