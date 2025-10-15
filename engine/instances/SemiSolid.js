class SemiSolid extends EngineInstance {
	onEngineCreate() {
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-24, -24, 24, 24)));
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
