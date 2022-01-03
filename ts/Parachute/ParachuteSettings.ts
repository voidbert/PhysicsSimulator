//Simulation quality - the number of milliseconds between calculating the positions of bodies (dt)
enum ParachuteSimulationQuality {
	VeryLow = 1000,
	Low = 500,
	Medium = 200,
	High = 100,
	VeryHigh = 50
}

//What is represented in the y axis of the graph
enum GraphProperty {
	Y, R, Velocity, AirResistance, ResultantForce, Acceleration
}

class ParachuteSettings {
	private _mass: number = 80;
	private _h0: number = 1000; //Initial height
	private _hopening: number = 500; //The height at which the parachute is opened

	private _cd0: number = 0.2; private _A0: number = 0.5;
	private _cd1: number = 1.6; private _A1: number = 10;

	private _simulationQuality: ParachuteSimulationQuality = ParachuteSimulationQuality.VeryHigh;
	private _graphProperty: GraphProperty = GraphProperty.Velocity;
	private _simulationResults: boolean = true;
	private _generateCSV: boolean = true;

	get mass() { return this._mass; }
	get h0() { return this._h0; }
	get hopening() { return this._hopening; }

	get cd0() { return this._cd0; } get A0() { return this._A0; } 
	get cd1() { return this._cd1; } get A1() { return this._A1; } 

	get simulationQuality() { return this._simulationQuality; }
	get graphProperty() { return this._graphProperty; }
	get simulationResults() { return this._simulationResults; }
	get generateCSV() { return this._generateCSV; }

	constructor() {}

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