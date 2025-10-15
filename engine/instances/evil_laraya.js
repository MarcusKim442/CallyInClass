class EvilLaraya extends EngineInstance {
	// Swap Engine Instance with SoildObject if you want collision
	onEngineCreate() {
		this.depth = 1;
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-34, -40, 34, 0)));
		this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("evil_laraya")), true);
		this.xScale = -2;
		this.yScale = 2;

		this.talking = false;
		this.dialogue_instance = null;

		this.char_z = $engine.createRenderable(this, new PIXI.Text("Z", { ...$engine.getDefaultTextStyle() }));
		this.char_z.x = this.x + -8;
	}

	onCreate(x, y) {
		this.onEngineCreate();
		this.x = x;
		this.y = y;
		// do stuff
	}

	step() {
		this.char_z.y = this.y - 120 + Math.sin($engine.getGameTimer() / 20) * 5;
		this.char_z.alpha = Math.max(1 - Math.abs((this.x - PlayerInstance.first.x) / 200), 0.1);

		if (IM.instanceCollision(this, this.x, this.y, PlayerInstance)) {
			if (!this.talking && IN.keyCheckPressed("KeyZ")) {
				// Initiate talking
				const lines = [
					new DialogueLine("Hey! Why are you me!? You look too evil, though.", LARAYA_PORTRAITS.ANGRY),
					new DialogueLine("Press W to jump, and press Q and E to swap between spells:", LARAYA_PORTRAITS.SURPRISED),
					new DialogueLine("Click on the screen while using FIRE to shoot a fireball,", LARAYA_PORTRAITS.HAPPY),
					new DialogueLine("Walk on water by freezing it while using WATER,", LARAYA_PORTRAITS.SCARED),
					new DialogueLine(
						"Hold toward a wall while using EARTH to slide down and jump off of it,",
						LARAYA_PORTRAITS.ANGRY
					),
					new DialogueLine("And finally, jump while airborne using AIR to double jump!", LARAYA_PORTRAITS.HAPPY),
					new DialogueLine("Ack... too many instructions!", LARAYA_PORTRAITS.HURT),
				];
				this.dialogue_instance = new Dialogue(0, 0, lines);
				this.talking = true;
			}
		} else {
			if (this.talking) {
				// STOP TALKING!!!
				this.dialogue_instance.destroy();
				this.talking = false;
			}
		}
	}
}
