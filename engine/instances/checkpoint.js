class Checkpoint extends EngineInstance {
	// Swap Engine Instance with SoildObject if you want collision
	onEngineCreate() {
		this.depth = 1;
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-20, -20, 20, 20)));

		// Update image later?
		// this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("IMAGE NAME")), true);
		this.butterfly_animation = $engine.getAnimation("butterfly_animation");
		this.animation = $engine.createRenderable(this, new PIXI.extras.AnimatedSprite(this.butterfly_animation), true);
		this.animation.animationSpeed = 0.1;
		this.xScale = 2;
		this.yScale = 2;

		// this.talking = false;
		// this.dialogue_instance = null;

		// this.char_z = $engine.createRenderable(this, new PIXI.Text("Z", { ...$engine.getDefaultTextStyle() }));
		// this.char_z.x = this.x + -8;
	}

	onCreate(x, y) {
		this.onEngineCreate();
		this.x = x;
		this.y = y;
		// do stuff
	}

	step() {
		this.animation.update(1);
		var player = IM.instancePlace(this, this.x, this.y, PlayerInstance);
		if (player !== undefined) {
			player.saveX = this.x;
			player.saveY = this.y;
		}
	}
}
