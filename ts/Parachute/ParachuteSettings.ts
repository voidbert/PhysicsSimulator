class ParachuteSettings {
	//Centers the buttons in case the grid is 3 elements wide. This could be achieved with a media
	//query but that would fail for transitioning window sizes (I theorize it's due to rem to px
	//conversions with approximations). This must be called every render loop, as window.onresize
	//is called before elements' positions are updated.
	static adjustUI() {
		let gridElements: HTMLCollectionOf<HTMLElement> =
			document.getElementsByClassName("settings-grid-item") as HTMLCollectionOf<HTMLElement>;
		let gridElementsY: number[] = [];
		let hiddenElementY = document.getElementById("buttons-centerer").getBoundingClientRect().y;

		//Get the elements' vertical position
		for (let i = 0; i < gridElements.length; ++i) {
			gridElementsY.push(gridElements[i].getBoundingClientRect().y);
		}

		//If only three elements have the same vertical position, the grid is 3 elements wide
		if (gridElementsY[0] === gridElementsY[1] && gridElementsY[0] === gridElementsY[2] &&
			gridElementsY[0] !== gridElementsY[3] && gridElementsY[0] !== hiddenElementY) {

			//Make an element visible to center the buttons
			document.getElementById("buttons-centerer").style.display = "initial";
		} else {
			document.getElementById("buttons-centerer").style.display = "none";
		}
	}
}