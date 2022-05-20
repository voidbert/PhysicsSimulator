class CSVTable {
    constructor(worker, horizontalStep, frameParserCallback, verticalAxisName, horizontalAxisName = "t (s)") {
        this.text = horizontalAxisName + "," + verticalAxisName + "\n";
        let index = 0;
        while (true) {
            let frame = worker.getFrame(index);
            if (frame === null) {
                return;
            }
            let number = frameParserCallback(frame);
            this.text += (index * horizontalStep).toString() + "," + number.toString() + "\n";
            index++;
        }
    }
    toBlob() {
        return new Blob([this.text], { type: "text/csv" });
    }
}
