const GRAVITY = 9.8;
const AIR_DENSITY = 1.225;
const GRAVITATIONAL_CONSTANT = 6.67430e-11;
class Body {
    constructor(mass, geometry, r = new Vec2()) {
        this.mass = mass;
        this.r = r;
        this.v = new Vec2(0, 0);
        this.forces = [];
        this.geometry = geometry;
    }
    transformVertex(vec) {
        return vec.add(this.r);
    }
    transformGeometry(geometry = this.geometry) {
        return geometry.map((v) => { return this.transformVertex(v); });
    }
    step(dt) {
        dt *= 0.001;
        let Fr = new Vec2();
        for (let i = 0; i < this.forces.length; ++i) {
            Fr = Fr.add(this.forces[i]);
        }
        let a = Fr.scale(1 / this.mass);
        this.v = this.v.add(a.scale(dt));
        this.r = this.r.add(this.v.scale(dt));
    }
}
