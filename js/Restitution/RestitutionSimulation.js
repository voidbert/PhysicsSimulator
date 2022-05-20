const BODY_MASS = 1;
var RestitutionState;
(function (RestitutionState) {
    RestitutionState[RestitutionState["BeforeStart"] = 0] = "BeforeStart";
    RestitutionState[RestitutionState["OnAir"] = 1] = "OnAir";
    RestitutionState[RestitutionState["Ended"] = 2] = "Ended";
})(RestitutionState || (RestitutionState = {}));
class RestitutionSimulation {
    static startSimulation() {
        this.body.forces = [new Vec2(0, -BODY_MASS * GRAVITY)];
        this.graph = new RestitutionGraph();
        RestitutionSettings.addEvents();
        this.settings = this.settings.getFromPage();
        this.settings.updatePage();
        let newWorker = () => {
            if (!this.workerStopped) {
                if (this.parallelWorker) {
                    this.parallelWorker.terminate();
                }
                this.parallelWorker = new WorkerWrapper("../../js/Restitution/RestitutionWorker.js", RestitutionSimulation.settings.simulationQuality, (w, data) => {
                    if (data === "DONE") {
                        this.workerStopped = true;
                        let downloadButton = document.getElementById("download-button");
                        downloadButton.disabled = false;
                        downloadButton.onclick = () => {
                            let csv = new CSVTable(this.parallelWorker, this.settings.simulationQuality * 0.001, (buf) => {
                                return new Float64Array(buf)[0];
                            }, restitutionGraphPropertyToString(this.settings.graphProperty));
                            let a = document.createElement("a");
                            a.href = window.URL.createObjectURL(csv.toBlob());
                            a.download = "Gráfico.csv";
                            a.click();
                            setTimeout(() => {
                                window.URL.revokeObjectURL(a.href);
                            }, 10000);
                        };
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
            if (this.state === RestitutionState.OnAir) {
                newWorker();
            }
            this.state = RestitutionState.BeforeStart;
            RestitutionSettings.enableSettingsElements();
            document.getElementById("download-button").disabled = true;
        });
        document.getElementById("start-button").addEventListener("click", () => {
            this.settings.updatePage();
            this.workerStopped = false;
            this.bufferCount = 0;
            this.state = RestitutionState.OnAir;
            this.graph.elapsedSimulationTime = 0;
            if (this.state === RestitutionState.OnAir) {
                newWorker();
            }
            this.parallelWorker.start({ body: this.body, settings: this.settings }, this.settings.simulationQuality);
            RestitutionSettings.disableSettingsElements();
        });
    }
}
RestitutionSimulation.body = new Body(BODY_MASS, [], new Vec2(0, 1));
RestitutionSimulation.settings = new RestitutionSettings();
RestitutionSimulation.workerStopped = false;
RestitutionSimulation.bufferCount = 0;
RestitutionSimulation.state = RestitutionState.BeforeStart;
window.addEventListener("load", () => {
    RestitutionSimulation.startSimulation();
});
