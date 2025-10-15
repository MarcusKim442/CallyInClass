class EnemyText extends EngineInstance {
	onRoomStart() {
		this.values = Global.first.values;
	}

	onEngineCreate() {
		//ALL ENEMIES ENCOUNTED IN THE GAME, DIALOGUE SHOULD APPEAR THE FIRST TIME THEY ARE ON SCREEN

		// ENEMY ENCOUNTERED - SNAKA
		this.snaka = [new DialogueLine("Scaled serpents that are lazy, but vicious when disturbed.")];

		// ENEMY ENCOUNTERED - RED COMPRIMIA
		this.redcomprimia = [
			new DialogueLine("Small beings with sharp teeth and talons that have evolved to live underground."),
		];

		// ENEMY ENCOUNTERED - LEOTA
		this.leota = [
			new DialogueLine(
				"Large felines that like high places, hiding in plain sight, and pouncing on unsuspecting prey."
			),
		];

		// ENEMY ENCOUNTERED - GREEN COMPRIMIA
		this.greencomprimia = [
			new DialogueLine("Small beings with sharp teeth and talons that have evolved to easily scale trees."),
		];

		// ENEMY ENCOUNTERED - MOSQUEETLE
		this.mosqueetle = [
			new DialogueLine(
				"Large insects with a hard exoskeleton that seek out warm-blooded creatures, often dropping large objects to stun them."
			),
		];

		// ENEMY ENCOUNTERED - PURPLE COMPRIMIA
		this.purplecomprimia = [
			new DialogueLine("Small beings with sharp teeth and talons that have evolved to live in wetland ecosystems"),
		];

		this.active_textbox = "";
		this.current = 0;
		this.display_count = 0;
		this.x_loc = 500;
		this.y_loc = 300;
		this.fade = false;
		this.fade_time = 0.004;
		this.fade_value = 1;
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-24, -24, 24, 24)));
		this.dialogue = $engine.createManagedRenderable(this, new PIXI.Container());
		this.dialogue_sprite = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("msgbox")));
		this.dialogue_text = $engine.createManagedRenderable(
			this,
			new PIXI.Text("", {
				fontFamily: "Arial",
				fontSize: 16,
				fill: 0xffffff,
				align: "center",
				wordWrap: true,
				wordWrapWidth: 300,
			})
		);
	}

	step() {
		if (IM.instanceCollision(this, this.x, this.y, PlayerInstance) && !this.fade) {
			this.active_textbox = IM.instancePlace(this, this.x, this.y, PlayerInstance);
			this.detect_enemy();
		}
		if (this.fade) {
			this.fade_value += this.fade_time;
			this.dialogue.alpha = EngineUtils.interpolate(this.fade_value, 1, 0, EngineUtils.INTERPOLATE_IN);
			if (this.dialogue.alpha <= 0) {
				this.remove_enemy(this.current);
				this.destroy();
			}
		}
	}

	detect_enemy() {
		this.fade = true;
		this.fade_value = 0;
		if (this.values[0] === "GREEN_COMPRIMIA") {
			this.add_enemy_text(this.greencomprimia);
			this.current = "GREEN_COMPRIMIA";
		}
		if (this.values[0] === "PURPLE_COMPRIMIA") {
			this.add_enemy_text(this.purplecomprimia, "PURPLE_COMPRIMIA");
			this.current = "PURPLE_COMPRIMIA";
		}
		if (this.values[0] === "RED_COMPRIMIA") {
			this.add_enemy_text(this.redcomprimia, "RED_COMPRIMIA");
			this.current = "RED_COMPRIMIA";
		}
		if (this.values[0] === "SNAKA") {
			this.add_enemy_text(this.snaka, "SNAKA");
			this.current = "SNAKA";
		}
		if (this.values[0] === "MOSQUEETLE") {
			this.add_enemy_text(this.mosqueetle, "MOSQUEETLE");
			this.current = "MOSQUEETLE";
		}
		if (this.values[0] === "LEOTA") {
			this.add_enemy_text(this.leota, "LEOTA");
			this.current = "LEOTA";
		}
		this.dialogue_sprite.x = -10;
		this.dialogue_sprite.y = -5;
		this.dialogue.x = this.x_loc - 160;

		this.dialogue.y = this.y_loc;

		this.dialogue.addChild(this.dialogue_sprite);
		this.dialogue.addChild(this.dialogue_text);
	}

	add_enemy_text(text) {
		this.dialogue_text.text = text[0].text;
	}

	remove_enemy(enemy_name) {
		this.values.splice(this.values.indexOf(enemy_name), 1);
	}

	draw() {
		$engine.requestRenderOnGUI(this.dialogue);
	}
}
