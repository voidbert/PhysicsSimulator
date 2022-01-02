class ParachuteSimulation {
	static renderer: Renderer;

	static startSimulation() {
		this.renderer = new Renderer(window, document.getElementById("graph") as HTMLCanvasElement,
			() => {

			ParachuteSettings.adjustUI();
		}, () => {
			let rect = this.renderer.canvas.getBoundingClientRect();
			this.renderer.canvas.width = rect.width * window.devicePixelRatio;
			this.renderer.canvas.height = rect.height * window.devicePixelRatio;
		});
		this.renderer.renderLoop();
	}
}

window.addEventListener("load", () => {
	ParachuteSimulation.startSimulation();
});