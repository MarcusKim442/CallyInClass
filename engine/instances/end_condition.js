class EndCondition extends EngineInstance {
	onCreate() {
		this.total = 10;
		this.conditions = [0.1, 0.5, 0.8];

		if ($engine.getEngineGlobalData().myVar < this.conditions[0] * this.total) {
			console.log("Win1 >>");
		} else if ($engine.getEngineGlobalData().myVar < this.conditions[1] * this.total) {
			console.log("Win2");
		} else if ($engine.getEngineGlobalData().myVar < this.conditions[2] * this.total) {
			console.log("Win3");
		} else {
			console.log("Win4");
		}
	}
}
