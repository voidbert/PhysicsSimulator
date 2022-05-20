class ParachuteSimulation {
    static startSimulation() {
        this.graph = new ParachuteGraph();
        ParachuteSettings.addEvents();
        this.settings = this.settings.getFromPage();
        this.settings.updatePage();
        let newWorker = () => {
            if (!this.workerStopped) {
                if (this.parallelWorker) {
                    this.parallelWorker.terminate();
                }
                this.parallelWorker = new WorkerWrapper("../../js/Parachute/ParachuteWorker.js", this.settings.simulationQuality, (w, data) => {
                    if ("errorAvg" in data && "openedInstant" in data) {
                        let downloadButton = document.getElementById("download-button");
                        downloadButton.disabled = false;
                        downloadButton.onclick = () => {
                            let csv = new CSVTable(this.parallelWorker, this.settings.simulationQuality * PARACHUTE_SIMULATION_SKIPPED_FACTOR, (buf) => {
                                return new Float64Array(buf)[0];
                            }, parachuteGraphPropertyToString(this.settings.graphProperty));
                            let a = document.createElement("a");
                            a.href = window.URL.createObjectURL(csv.toBlob());
                            a.download = "Gráfico.csv";
                            a.click();
                            setTimeout(() => {
                                window.URL.revokeObjectURL(a.href);
                            }, 10000);
                        };
                        ParachuteResults.applyToPage(this.theoreticalResults, data.errorAvg, data.openedInstant);
                        this.workerStopped = true;
                    }
                    else {
                        this.parallelWorker.addBuffer(new NumberedBuffer(this.bufferCount, data.size, data.buf, 8));
                        this.bufferCount++;
                    }
                }, 1024, 100000);
            }
        };
        newWorker();
        document.getElementById("reset-button").addEventListener("click", () => {
            if (this.state === ParachuteState.Released) {
                newWorker();
            }
            this.state = ParachuteState.BeforeRelease;
            ParachuteSettings.enableSettingsElements();
            document.getElementById("download-button").disabled = true;
        });
        document.getElementById("start-button").addEventListener("click", () => {
            this.settings.updatePage();
            this.theoreticalResults = ParachuteResults.calculateTheoreticalResults(this.settings);
            let y = this.graph.renderer.canvas.getBoundingClientRect().top + window.scrollY;
            smoothScroll(0, y, () => {
                this.workerStopped = false;
                this.bufferCount = 0;
                this.state = ParachuteState.Released;
                this.parallelWorker.start({ body: this.body, settings: this.settings }, this.settings.simulationQuality);
            });
            ParachuteSettings.disableSettingsElements();
        });
        document.getElementById("simulation-results-ok").addEventListener("click", () => {
            ParachuteStateManager.hideSimulationResults();
        });
    }
}
ParachuteSimulation.body = new Body(80, [], new Vec2());
ParachuteSimulation.workerStopped = false;
ParachuteSimulation.bufferCount = 0;
ParachuteSimulation.settings = new ParachuteSettings();
ParachuteSimulation.state = ParachuteState.BeforeRelease;
window.addEventListener("load", () => {
    ParachuteSimulation.startSimulation();
});
