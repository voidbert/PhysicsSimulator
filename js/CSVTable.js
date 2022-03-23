var CSVTable = (function () {
    function CSVTable(worker, horizontalStep, frameParserCallback, verticalAxisName, horizontalAxisName) {
        if (horizontalAxisName === void 0) { horizontalAxisName = "t (s)"; }
        this.text = horizontalAxisName + "," + verticalAxisName + "\n";
        var index = 0;
        while (true) {
            var frame = worker.getFrame(index);
            if (frame === null) {
                return;
            }
            var number = frameParserCallback(frame);
            this.text += (index * horizontalStep).toString() + "," + number.toString() + "\n";
            index++;
        }
    }
    CSVTable.prototype.toBlob = function () {
        return new Blob([this.text], { type: "text/csv" });
    };
    return CSVTable;
}());
