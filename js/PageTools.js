var isTouchScreenAvailable = "ontouchstart" in window || navigator.maxTouchPoints > 0;
function parseInputNumber(id, min = -Infinity, max = Infinity) {
    let text = document.getElementById(id).value;
    let number = Number(text);
    if (isNaN(number) || (!isNaN(number) && min <= number && number <= max)) {
        return number;
    }
    return NaN;
}
function isPortrait() {
    return window.matchMedia("(orientation: portrait)").matches;
}
function smoothScroll(x, y, callback = () => { }, timeout = 500) {
    if (window.scrollX === x && window.scrollY === y) {
        callback();
        return;
    }
    let positionReached = false;
    function onScroll() {
        if (window.scrollX === x && window.scrollY === y) {
            window.removeEventListener("scroll", onScroll);
            positionReached = true;
            callback();
        }
    }
    window.addEventListener("scroll", onScroll);
    window.scrollTo({ left: x, top: y, behavior: "smooth" });
    if (timeout !== 0) {
        setTimeout(() => {
            if (!positionReached) {
                window.scrollTo(x, y);
                window.removeEventListener("scroll", onScroll);
                callback();
            }
        }, timeout);
    }
}
var mouseScreenPosition = new Vec2();
if (window) {
    window.addEventListener("mousemove", (e) => {
        mouseScreenPosition = new Vec2(e.clientX, e.clientY).scale(window.devicePixelRatio);
    });
}
