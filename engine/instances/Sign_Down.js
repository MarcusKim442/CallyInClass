class SignDown extends EngineInstance {
	// Swap Engine Instance with SoildObject if you want collision
	onEngineCreate() {
		this.depth = 1;
		this.setHitbox(new Hitbox(this, new RectangleHitbox(0, 0, 48, 48)));
		this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("sign_down")), true);
		// this.x *= 48;
		// this.y *= 48;
	}

	onCreate(x, y) {
		this.onEngineCreate();
		this.x = x;
		this.y = y;
		// do stuff
	}

	step() {}

	draw(gui, camera) {
		// EngineDebugUtils.drawHitbox(camera, this);
	}
}
