class Proceed extends EngineInstance {
	onEngineCreate() {
		this.x_loc = 500;
		this.y_loc = 700;
		this.endGame = false;
		this.dialogue = $engine.createManagedRenderable(this, new PIXI.Container());
		this.dialogue_sprite = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("msgbox")));
		this.dialogue_text = $engine.createManagedRenderable(
			this,
			new PIXI.Text(
				"Are you sure you want to proceed? Press 'z' to go ahead. Be careful, once you leave you won’t be able to come back.",
				{
					fontFamily: "Arial",
					fontSize: 16,
					fill: 0xffffff,
					align: "center",
					wordWrap: true,
					wordWrapWidth: 300,
				}
			)
		);
		this.dialogue.x = this.x_loc - 160;
		this.dialogue.y = this.y_loc;

		this.dialogue_sprite.x = -10;
		this.dialogue_sprite.y = -5;

		this.dialogue.addChild(this.dialogue_sprite);
		this.dialogue.addChild(this.dialogue_text);
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-30, -30, 30, 30)));
	}

	step() {
		if (this.endGame) {
			if (IN.keyCheckPressed("KeyZ")) {
				this.destroy();
				$engine.setRoom(RoomManager.currentRoom().name);
			}
		}
	}

	checkComplete(x = false) {}

	draw(gui, camera) {
		if (this.endGame) {
			$engine.requestRenderOnGUI(this.dialogue);
		}
	}
}
