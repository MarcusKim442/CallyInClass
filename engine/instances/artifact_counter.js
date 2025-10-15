class Counter extends EngineInstance {
	onRoomStart() {
		this.global = Global.first;
	}
	onEngineCreate() {
		this.line = "x ";
		this.counter_text = $engine.createManagedRenderable(
			this,
			new PIXI.Text("", {
				fontFamily: "Arial",
				fontSize: 35,
				fill: 0xffffff,
				align: "left",
				wordWrap: true,
				wordWrapWidth: 500,
			})
		);
		this.artifact_pic = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("artifact")));
		this.counter_text.text = this.line;
		this.artifact_pic.scale.set(3, 3);
		this.artifact_pic.x = 850;
		this.artifact_pic.y = 80;
		this.counter_text.x = 890;
		this.counter_text.y = 60;
	}

	step() {
		this.counter_text.text = this.line + this.global.artifact_count.toString();
	}
	draw(gui, camera) {
		$engine.requestRenderOnGUI(this.artifact_pic);
		$engine.requestRenderOnGUI(this.counter_text);
	}
}
