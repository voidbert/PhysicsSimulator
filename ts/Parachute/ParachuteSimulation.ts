class ParachuteSimulation {
	static renderer: Renderer;

	static startSimulation() {
		this.renderer = new Renderer(window, document.getElementById("graph") as HTMLCanvasElement,
			() => {

			ParachuteSettings.adjustUI();
		});
		this.renderer.renderLoop();
	}
}

window.addEventListener("load", () => {
	ParachuteSimulation.startSimulation();
});