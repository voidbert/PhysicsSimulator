//A class to generate CSV files with data from a simulation (WorkerWrapper)
class CSVTable {
	public text: string;

	//Creates a CSV file with data from a WorkerWrapper (worker). horizontalStep is the distance
	//between data points on the x axis. frameParserCallback is called to parse a frame from the
	//worker and return a number to place in the table.
	constructor(worker: WorkerWrapper, horizontalStep: number,
		frameParserCallback: (buf: ArrayBuffer) => number,
		verticalAxisName: string, horizontalAxisName: string = "t (s)") {

		this.text = horizontalAxisName + "," + verticalAxisName + "\n";

		let index = 0;
		while (true) {
			let frame = worker.getFrame(index);
			if (frame === null) {
				return; //Out of data
			}
			let number = frameParserCallback(frame);

			this.text += (index * horizontalStep).toString() + "," + number.toString() + "\n";

			index++;
		}
	}

	//Creates a blob from the text THAT YOU SHOULD DELETE LATER
	toBlob(): Blob {
		return new Blob([ this.text ], { type: "text/csv" });
	}
}