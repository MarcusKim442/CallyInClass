class TestInstance2 extends EngineInstance {
	onEngineCreate() {
		this.setSprite(new PIXI.Sprite($engine.getTexture("default")));
		this.velX = 0;
		this.accel = 1;
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-25, -25, 25, 25)));
		this.grabbed = false;
	}

	onCreate(x, y) {
		this.onEngineCreate();
		this.x = x;
		this.y = y;
		// do stuff
	}

	step() {
		if (IN.keyCheckPressed("KeyQ")) {
			$__engineData.__debugLogFrameTime = true;
			for (var i = 0; i < 100; i++) {
				new TestInstance(
					IM.find(TestInstance).x + EngineUtils.irandomRange(-1024, 1024),
					IM.find(TestInstance).y + EngineUtils.irandomRange(-1024, 1024)
				);
			}
		}
		if (IN.keyCheck("KeyA")) {
			this.velX -= this.accel;
		}
		if (IN.keyCheck("KeyD")) {
			this.velX += this.accel;
		}
		this.x += this.velX;
		if (this.x < 0 || this.x > $engine.getWindowSizeX()) {
			this.velX = 0;
		}
		this.x = EngineUtils.clamp(this.x, 0, $engine.getWindowSizeX());

		if (!this.grabbed && IN.mouseCheckPressed(0) && IM.instanceCollisionPoint(IN.getMouseX(), IN.getMouseY(), this)) {
			this.grabbed = true;
		}

		if (IN.mouseCheckReleased(0) && this.grabbed) {
			this.grabbed = false;
		}

		if (this.grabbed) {
			this.x = IN.getMouseX();
			this.y = IN.getMouseY();
		}
	}

	draw(gui, camera) {
		// EngineDebugUtils.drawHitbox(camera, this);
	}
}
