//Some useful functions for controlling / analyzing page aspects.

//Checks if the display's orientation is portrait
function isPortrait(): boolean {
	return window.matchMedia("(orientation: portrait)").matches;
}

//Smoothly scrolls to a point in the page and calls back when that point is reached. If the
//position isn't reached in the desired time, it will be forcefully set (no smooth animation)
//and callback will be called. If timeout === 0, this won't happen.
function smoothScroll(x: number, y: number, callback: () => any = () => {},
	timeout: number = 500) {

	if (window.scrollX === x && window.scrollY === y) {
		//Already in the desired position.
		callback();
		return;
	}

	let positionReached: boolean = false;

	function onScroll() {
		//Check if the position has been reached. If so, call back.
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