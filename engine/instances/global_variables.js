class Global extends EngineInstance {
	onEngineCreate() {
		/* 
        For grass,
        grass direction >> (-1 left, 0 no wind, 1 right)
        grass_frequency >> lower value, more wind and high value, less wind
                            (7 for wind, 20 for no wind)
        grass_movement_span >> 5 ideal for now
         */
		var extern = RoomManager.currentRoom().getAllExtern();
		this.values = [];
		if (extern.Enemy) {
			this.values = extern.Enemy[0].split(",");
		}

		this.wind_direction = 1;
		this.timer = 300;
		this.clock = this.timer;
		this.artifact_count = 0;
		if (!("myVar" in $engine.getEngineGlobalData())) {
			var data = $engine.getEngineGlobalData();
			data.myVar = 0;
		}
		$engine.saveEngineGlobalData();
	}

	saveCollectible() {
		$engine.getEngineGlobalData().myVar += this.artifact_count;
		$engine.saveEngineGlobalData();
	}

	step() {
		this.clock--;
		if (this.clock === 0) {
			this.clock = this.timer;
			this.wind_direction = EngineUtils.irandomRange(-1, 1);
		}
	}
}
