/*

let cam: Camera = new Camera(new Vec2(-2, -2), 32);
let axes: AxisSystem = new AxisSystem(
    cam,
    true, "#000000", 2,
    true, "#00dddd", 1,
    true, true, "1rem sans-serif",
    "#ffffff",
    false
);

let bodyGeometry: Vec2[] = [
    new Vec2(-0.5, -0.5),
    new Vec2( 0.5, -0.5),
    new Vec2( 0.5,  0.5),
    new Vec2(-0.5,  0.5)
];

let bodies: Body[] = [
    new Body(1, bodyGeometry, new Vec2(0, 0)),
];
let stepper: TimeStepper;

let mousePos = new Vec2();

function render(renderer: Renderer): void {
    axes.drawAxes(renderer);

    //Camera.polygonToScreenPosition test
    for (let i: number = 0; i < bodies.length; ++i) {
        renderer.renderPolygon(
            cam.polygonToScreenPosition(bodies[i].transformGeometry()), "#00FF00"
        );
    }

    //Camera.pointToWorldPosition test
    let worldPosition: Vec2 = cam.pointToWorldPosition(mousePos);
    renderer.ctx.textAlign = "left";
    renderer.renderText(
        "Camera position: " + cam.r.x + ", " + cam.r.y + "\n" +
        "Mouse position: " + mousePos.x + ", " + mousePos.y + "\n" +
        "World position: " + worldPosition.x + ", " + worldPosition.y,
        mousePos, 1.5, "#000000", "1.0rem sans-serif"
    );
}

window.addEventListener("mousemove", function(e) {
    mousePos = new Vec2(e.x, e.y);
});

//Move the camera with WASD and with the arrow keys
window.addEventListener("keydown", function(e) {
    let movement = new Vec2(0, 0);
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        movement = new Vec2(-1, 0);
    } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        movement = new Vec2(1, 0);
    } else if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        movement = new Vec2(0, 1); //Inverted because the camera's position is in world coordinates
    } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        movement = new Vec2(0, -1); //Inverted because the camera's position is in world coordinates
    }
    cam.r = cam.r.add(movement.scale(0.5));
    axes.updateCaches();
});

//Zoom in and out by scrolling the mouse wheel
document.addEventListener("wheel", function(e: WheelEvent) {
    cam.scale += e.deltaY * -0.05;
    if (cam.scale <= 10) {
        cam.scale = 10;
    }
    axes.updateCaches();
})

//Update the canvas size in the camera when the window is resized (and set it for the first time
//too when the window loads).
function resizeHandler() {
    cam.canvasSize = new Vec2(
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio
    );
    axes.updateCaches();
}
window.addEventListener("resize", resizeHandler);

window.addEventListener("load", function() {
    resizeHandler();

    //Start rendering the scene
    let renderer: Renderer =
        new Renderer(window, document.getElementById("canvas") as HTMLCanvasElement, render);
    renderer.renderLoop();

    //Add gravity to all the bodies
    for (let i: number = 0; i < bodies.length; ++i) {
        bodies[i].forces = [ new Vec2(0, -bodies[i].mass * 9.8) ];
    }
    bodies[0].v = new Vec2(10, 10); //Launch the body - test

    //Start running the simulation
    let reachedZeroOnce = false;
    stepper = new TimeStepper(function(dt) {
        for (let i: number = 0; i < bodies.length; ++i) {
            bodies[i].step(dt);
            if (!reachedZeroOnce && bodies[i].r.y <= 0) {
                //Pause the simulation. Don't pause the simulation again if the developer unpauses
                //the simulation through the dev tools (reachedZeroOnce).
                alert(bodies[i].r.x);
                stepper.stopPause();
                reachedZeroOnce = true;
            }
        }
    }, SimulationQuality.VeryLow);
    //setTimeout(() => { stepper.changeTimeout(1); }, 500);
});

*/ 