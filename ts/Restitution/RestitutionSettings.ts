//Simulation quality - the number of milliseconds between calculating the positions of bodies (dt)
enum RestitutionSimulationQuality {
	VeryLow = 50,
	Low = 30,
	Medium = 20,
	High = 10,
	VeryHigh = 5
}

//What is represented in the y axis of the graph
enum RestitutionGraphProperty {
	Y, Velocity
}

function restitutionGraphPropertyToString(property: RestitutionGraphProperty): string {
	switch (property) {
		case RestitutionGraphProperty.Y:
			return "y (m)";

		case RestitutionGraphProperty.Velocity:
			return "v (m s⁻¹)";
	}
}

class RestitutionSettings {

}