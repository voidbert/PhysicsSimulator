var isTouchScreenAvailable = "ontouchstart" in window || navigator.maxTouchPoints > 0;
function parseInputNumber(id, min, max) {
    if (min === void 0) { min = -Infinity; }
    if (max === void 0) { max = Infinity; }
    var text = document.getElementById(id).value;
    var number = Number(text);
    if (isNaN(number) || (!isNaN(number) && min <= number && number <= max)) {
        return number;
    }
    return NaN;
}
function isPortrait() {
    return window.matchMedia("(orientation: portrait)").matches;
}
function smoothScroll(x, y, callback, timeout) {
    if (callback === void 0) { callback = function () { }; }
    if (timeout === void 0) { timeout = 500; }
    if (window.scrollX === x && window.scrollY === y) {
        callback();
        return;
    }
    var positionReached = false;
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
        setTimeout(function () {
            if (!positionReached) {
                window.scrollTo(x, y);
                window.removeEventListener("scroll", onScroll);
                callback();
            }
        }, timeout);
    }
}
