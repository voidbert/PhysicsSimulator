var ParachuteSimulation = (function () {
    function ParachuteSimulation() {
    }
    ParachuteSimulation.startSimulation = function () {
        var _this = this;
        this.graph = new ParachuteGraph();
        ParachuteSettings.addEvents();
        this.settings = this.settings.getFromPage();
        this.settings.updatePage();
        var newWorker = function () {
            if (!_this.workerStopped) {
                if (_this.parallelWorker) {
                    _this.parallelWorker.terminate();
                }
                _this.parallelWorker = new WorkerWrapper("../../js/Parachute/ParachuteWorker.js", _this.settings.simulationQuality, function (w, data) {
                    if ("errorAvg" in data && "openedInstant" in data) {
                        var downloadButton = document.getElementById("download-button");
                        downloadButton.disabled = false;
                        downloadButton.onclick = function () {
                            var csv = new CSVTable(_this.parallelWorker, _this.settings.simulationQuality * PARACHUTE_SIMULATION_SKIPPED_FACTOR, function (buf) {
                                return new Float64Array(buf)[0];
                            }, parachuteGraphPropertyToString(_this.settings.graphProperty));
                            var a = document.createElement("a");
                            a.href = window.URL.createObjectURL(csv.toBlob());
                            a.download = "Gráfico.csv";
                            a.click();
                            setTimeout(function () {
                                window.URL.revokeObjectURL(a.href);
                            }, 10000);
                        };
                        ParachuteResults.applyToPage(_this.theoreticalResults, data.errorAvg, data.openedInstant);
                        _this.workerStopped = true;
                    }
                    else {
                        _this.parallelWorker.addBuffer(new NumberedBuffer(_this.bufferCount, data.size, data.buf, 8));
                        _this.bufferCount++;
                    }
                }, 1024, 100000);
            }
        };
        newWorker();
        document.getElementById("reset-button").addEventListener("click", function () {
            if (_this.state === ParachuteState.Released) {
                newWorker();
            }
            _this.state = ParachuteState.BeforeRelease;
            ParachuteSettings.enableSettingsElements();
            document.getElementById("download-button").disabled = true;
        });
        document.getElementById("start-button").addEventListener("click", function () {
            _this.settings.updatePage();
            _this.theoreticalResults = ParachuteResults.calculateTheoreticalResults(_this.settings);
            var y = _this.graph.renderer.canvas.getBoundingClientRect().top + window.scrollY;
            smoothScroll(0, y, function () {
                _this.workerStopped = false;
                _this.bufferCount = 0;
                _this.state = ParachuteState.Released;
                _this.parallelWorker.start({ body: _this.body, settings: _this.settings }, _this.settings.simulationQuality);
            });
            ParachuteSettings.disableSettingsElements();
        });
        document.getElementById("simulation-results-ok").addEventListener("click", function () {
            ParachuteStateManager.hideSimulationResults();
        });
    };
    ParachuteSimulation.body = new Body(80, [], new Vec2());
    ParachuteSimulation.workerStopped = false;
    ParachuteSimulation.bufferCount = 0;
    ParachuteSimulation.settings = new ParachuteSettings();
    ParachuteSimulation.state = ParachuteState.BeforeRelease;
    return ParachuteSimulation;
}());
window.addEventListener("load", function () {
    ParachuteSimulation.startSimulation();
});
