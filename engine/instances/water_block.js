class WaterBlock extends EngineInstance {
	onEngineCreate() {
		this.setHitbox(new Hitbox(this, new RectangleHitbox(0, 0, 48, 48)));
        this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("water_block")), true);
		this.alpha = 0.5
		// this.x *= 48;
		// this.y *= 48;
	}

	onCreate(x, y) {
		this.onEngineCreate();
		this.x = x;
		this.y = y;
		// do stuff
	}

	step() {
	}

	draw(gui, camera) {
		// EngineDebugUtils.drawHitbox(camera, this);
	}
}
