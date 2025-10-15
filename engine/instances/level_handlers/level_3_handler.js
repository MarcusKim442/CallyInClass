class Level3Handler extends LevelHandler {
	onEngineCreate() {
		var extern = RoomManager.currentRoom().getAllExtern();
		if (extern.Music) {
			var music = extern.Music;
			music[1] = Number(music[1]);
			this.audioSound = $engine.audioPlaySound(music[0], music[1], true);
		}

		this.add_collectible = true;
		this.room_width = RoomManager.currentRoom().getRPGRoomWidth() / 48;
		this.room_height = RoomManager.currentRoom().getRPGRoomHeight() / 48;
		this.camera_dimensions = [1008, 816];

		this.camera = $engine.getCamera();
		// this.camera.setScaleX(0.5);
		// this.camera.setScaleY(0.5);
		this.camera.setDimensions(this.camera_dimensions[0], this.camera_dimensions[1]);
		//this.camera.setY(2 * 48);
		$engine.setBackground(new PIXI.extras.TilingSprite($engine.getTexture("bglevel3")));
		this.background = $engine.getBackground();
		this.background.tileScale.set(2, 3);
		this.background.width = this.camera_dimensions[0];
		this.background.height = this.camera_dimensions[1];

		this.foreground = new EmptyInstance();
		this.foreground.setSprite(new PIXI.extras.TilingSprite($engine.getTexture("bgleaves")));
		this.foreground.depth = -1000;
		this.fgSprite = this.foreground.getSprite();
		this.fgSprite.tileScale.set(2, 2);
		this.fgSprite.width = this.room_width * 48;
		this.fgSprite.height = 360;

		this.rayFilter = new PIXI.filters.GodrayFilter();
		this.rayFilter.gain = 0.4;
		this.rayFilter.lucanarity = 2;
		this.rayFilter.alpha = 0.5;
		this.rayFilter_offset = EngineUtils.random(1000);
		this.camera.addFilter(this.rayFilter);

		const leafFilter = new PIXI.filters.AdvancedBloomFilter();
		leafFilter.bloomScale = 1.5;
		this.fgSprite.filters = [leafFilter];

		this.spellWheel = $engine.createManagedRenderable(this, new PIXI.Container());
		this.spellWheel_sprite = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("spellwheel3")));
		this.spellWheel_sprite.scale.set(2, 2);
		this.spellWheel_sprite.x = this.camera_dimensions[0] - this.spellWheel_sprite.width / 2 - 5;
		this.spellWheel_sprite.y = this.camera_dimensions[1] - this.spellWheel_sprite.height / 2 - 5;
		this.spellWheel.addChild(this.spellWheel_sprite);
		this.spellWheelDirection_sprite = $engine.createManagedRenderable(
			this,
			new PIXI.Sprite($engine.getTexture("spellwheel_direction"))
		);
		this.spellWheelDirection_sprite.scale.set(2, 2);
		this.spellWheelDirection_sprite.x = this.camera_dimensions[0] - this.spellWheel_sprite.width / 2 - 5;
		this.spellWheelDirection_sprite.y = this.camera_dimensions[1] - this.spellWheel_sprite.height / 2 - 5;
		this.spellWheel.addChild(this.spellWheelDirection_sprite);
		this.spellWheel_rotating = false;
		this.spellWheel_origAngle = 0;
		this.spellWheel_targetAngle = 0;
		this.spellWheel_timer = 0;

		this.timer = 0;
		this.adjustFilter = new PIXI.filters.AdjustmentFilter();
		this.adjustFilter.brightness = 0;
		this.camera.addFilter(this.adjustFilter);

		this.see_artifact_trigger = false;
		this.get_artifact_trigger = false;

		this.wand_piece = new WandPiece(552, 2016, "air_wand");

		this.nextRoom = "Level3End";

		super.onEngineCreate();
		// this.beatLevel = false;
		// this.timer2 = 0;
	}

	onCreate() {
		this.onEngineCreate();

		// do stuff
	}

	onRoomStart() {
		this.player = PlayerInstance.first;
		this.player.spells_learned = 2;
		// ----------   SWAMP DIALOGUE LINES   ----------
		this.swamplines = [
			new DialogueLine(
				"Axodiles are so rare, but I love reading about them! I got him back in the water, where he should theoretically be able to regenerate! According to the myth, at least...",
				LARAYA_PORTRAITS.HAPPY
			),
			new DialogueLine(
				"What's all this that was under him? Scale fragments… Drag marks… Cleanly cut rope bindings… And an Asu tool someone left behind!",
				LARAYA_PORTRAITS.SURPRISED
			),
			new DialogueLine(
				"Argh! Someone did this on purpose, and tried to make it look like an accident if anyone came by! But who… Ximara!",
				LARAYA_PORTRAITS.ANGRY
			),
			new DialogueLine("Grrrr… I saw these scales in her despicable workshop.", LARAYA_PORTRAITS.ANGRY), //air wand piece should be nearby
		];
		this.dialogue_instance = new Dialogue(0, 0, this.swamplines);
		this.global = Global.first;
	}

	step() {
		// Dialogue trigger for seeing the artifact
		// if (!this.see_artifact_trigger && 24 * 48 <= this.player.x && this.player.x <= 25 * 48) {
		// 	this.see_artifact_trigger = true;
		// 	this.artifactline = [
		// 		new DialogueLine("Hang on, what's over there? Something's glowing!", LARAYA_PORTRAITS.HAPPY), //fire wand piece is on the ground, nowhere else to go but interact with it. Lore appears on screen (see WAND PIECE GATHERED section of dialogue) when clicked
		// 	];
		// 	this.dialogue_instance = new Dialogue(0, 0, this.artifactline, true);
		// }

		// Dialogue trigger for collecting the artifact
		// if (!this.get_artifact_trigger && 31 * 48 <= this.player.x && this.player.x <= 32 * 48) {
		// 	this.get_artifact_trigger = true;
		// 	this.artifactline = [
		// 		new DialogueLine(
		// 			"This is a piece of evidence! I need to collect as many of these as possible to prove my innocence!",
		// 			LARAYA_PORTRAITS.SURPRISED
		// 		),
		// 	];
		// 	this.dialogue_instance = new Dialogue(0, 0, this.artifactline, true);
		// }

		if (!this.beatLevel) {
			var camX = this.camera.getX();
			var camY = this.camera.getY();
			var divVal = 5;
			this.camera.setX(
				EngineUtils.clamp(
					camX - (camX - (this.player.x - this.camera_dimensions[0] / 2)) / divVal,
					0,
					this.room_width * 48 - this.camera_dimensions[0]
				)
			);
			this.camera.setY(
				EngineUtils.clamp(
					camY - (camY - (this.player.y - this.camera_dimensions[1] / 2)) / divVal,
					0,
					this.room_height * 48 - this.camera_dimensions[1]
				)
			);

			// This is responsible for moving the background
			this.background.tilePosition.x = -this.camera.getX() / 5;

			this.fgSprite.skew.x = Math.sin($engine.getGameTimer() / 60) / 20;
			this.fgSprite.tilePosition.x = -this.camera.getX() / 1.75;
			this.fgSprite.tilePosition.y = -this.camera.getY() / 1.75;

			this.rayFilter.time = this.camera.getX() / 300 + $engine.getGameTimer() / 200 + this.rayFilter_offset;
			// this.rayFilter.time = $engine.getGameTimer() / 200;

			// Spell wheel rotation
			if (this.spellWheel_rotating) {
				const rot_time_total = 20;
				this.spellWheel_sprite.rotation = EngineUtils.interpolate(
					this.spellWheel_timer / rot_time_total,
					this.spellWheel_origAngle,
					this.spellWheel_targetAngle,
					EngineUtils.INTERPOLATE_OUT
				);
				this.spellWheel_timer++;
				if (this.spellWheel_timer >= rot_time_total) {
					this.spellWheel_rotating = false;
				}
			}

			// Fade in
			if (this.timer < 60) {
				this.adjustFilter.brightness = this.timer / 60;
				this.timer++;
				if (this.timer === 60) {
					this.camera.removeFilter(this.adjustFilter);
				}
			}

			// Check for falling out of the map
			if (this.player.y >= this.room_height * 48) {
				$engine.setRoom(RoomManager.currentRoom().name);
			}

			// Check if player beats the level
			if (this.player.x >= (this.room_width - 3) * 48 && this.player.y <= 7 * 48) {
				//$engine.setRoom(RoomManager.currentRoom().name);
				this.winLevel();
			}
		} else {
			if (this.add_collectible) {
				this.add_collectible = false;
				this.global.saveCollectible();
			}
			this.winLevelStep();
		}

		if (this.wand_piece_collected) {
			let collection_line = [
				new DialogueLine(
					"This element is temperamental. It can blow objects upwards and lessen the effects of gravity with strong gusts, and allow the user to jump again in midair as if on a cloud.",
					LARAYA_PORTRAITS.SURPRISED
				),
			];
			this.dialogue_instance = new Dialogue(0, 0, collection_line, true);

			this.wand_piece_collected = false;
		}
	}

	onDestroy() {
		$engine.audioStopSound(this.audioSound);
	}

	draw(gui, camera) {
		// EngineDebugUtils.drawHitbox(camera, this);
		if (!this.beatLevel) {
			$engine.requestRenderOnGUI(this.spellWheel);
		} else {
			// $engine.requestRenderOnGUI(this.winScreenSprite);
			// $engine.requestRenderOnGUI(this.winMessage);
		}
	}
}

// class Level3Handler extends LevelHandler {
// 	onEngineCreate() {
// 		this.audioSound = $engine.audioPlaySound("Level1Background", 0.07, true);

// 		this.room_width = RoomManager.currentRoom().getRPGRoomWidth() / 48;
// 		this.room_height = RoomManager.currentRoom().getRPGRoomHeight() / 48;
// 		this.camera_dimensions = [1008, 816];

// 		this.camera = $engine.getCamera();
// 		// this.camera.setScaleX(0.5);
// 		// this.camera.setScaleY(0.5);
// 		this.camera.setDimensions(this.camera_dimensions[0], this.camera_dimensions[1]);
// 		//this.camera.setY(2 * 48);
// 		$engine.setBackground(new PIXI.extras.TilingSprite($engine.getTexture("bgfar")));
// 		this.background = $engine.getBackground();
// 		this.background.tileScale.set(2, 2);
// 		this.background.width = this.camera_dimensions[0];
// 		this.background.height = this.camera_dimensions[1];

// 		this.foreground = new EmptyInstance();
// 		this.foreground.setSprite(new PIXI.extras.TilingSprite($engine.getTexture("bgleaves")));
// 		this.foreground.depth = -1000;
// 		this.fgSprite = this.foreground.getSprite();
// 		this.fgSprite.tileScale.set(2, 2);
// 		this.fgSprite.width = this.room_width * 48;
// 		this.fgSprite.height = 360;

// 		this.rayFilter = new PIXI.filters.GodrayFilter();
// 		this.rayFilter.gain = 0.4;
// 		this.rayFilter.lucanarity = 2;
// 		this.rayFilter.alpha = 0.5;
// 		this.rayFilter_offset = EngineUtils.random(1000);
// 		this.camera.addFilter(this.rayFilter);

// 		const leafFilter = new PIXI.filters.AdvancedBloomFilter();
// 		leafFilter.bloomScale = 1.5;
// 		this.fgSprite.filters = [leafFilter];

// 		this.spellWheel = $engine.createManagedRenderable(this, new PIXI.Container());
// 		this.spellWheel_sprite = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("spellwheel")));
// 		this.spellWheel_sprite.scale.set(2, 2);
// 		this.spellWheel_sprite.x = this.camera_dimensions[0] - this.spellWheel_sprite.width / 2 - 5;
// 		this.spellWheel_sprite.y = this.camera_dimensions[1] - this.spellWheel_sprite.height / 2 - 5;
// 		this.spellWheel.addChild(this.spellWheel_sprite);
// 		this.spellWheel_rotating = false;
// 		this.spellWheel_origAngle = 0;
// 		this.spellWheel_targetAngle = 0;
// 		this.spellWheel_timer = 0;

// 		this.timer = 0;
// 		this.adjustFilter = new PIXI.filters.AdjustmentFilter();
// 		this.adjustFilter.brightness = 0;
// 		this.camera.addFilter(this.adjustFilter);
// 	}

// 	onCreate() {
// 		this.onEngineCreate();

// 		// do stuff
// 	}

// 	onRoomStart() {
// 		this.player = PlayerInstance.first;
// 	}

// 	step() {
// 		var camX = this.camera.getX();
// 		var camY = this.camera.getY();
// 		var divVal = 5;
// 		this.camera.setX(
// 			EngineUtils.clamp(
// 				camX - (camX - (this.player.x - this.camera_dimensions[0] / 2)) / divVal,
// 				0,
// 				this.room_width * 48 - this.camera_dimensions[0]
// 			)
// 		);
// 		this.camera.setY(
// 			EngineUtils.clamp(
// 				camY - (camY - (this.player.y - this.camera_dimensions[1] / 2)) / divVal,
// 				0,
// 				this.room_height * 48 - this.camera_dimensions[1]
// 			)
// 		);
// 		this.background.tilePosition.x = -this.camera.getX() / 5;
// 		this.background.tilePosition.y = -this.camera.getY() / 5;

// 		this.fgSprite.skew.x = Math.sin($engine.getGameTimer() / 60) / 20;
// 		this.fgSprite.tilePosition.x = -this.camera.getX() / 1.75;
// 		this.fgSprite.tilePosition.y = -this.camera.getY() / 1.75;

// 		this.rayFilter.time = this.camera.getX() / 300 + $engine.getGameTimer() / 200 + this.rayFilter_offset;
// 		// this.rayFilter.time = $engine.getGameTimer() / 200;

// 		// Spell wheel rotation
// 		if (this.spellWheel_rotating) {
// 			const rot_time_total = 20;
// 			this.spellWheel_sprite.rotation = EngineUtils.interpolate(
// 				this.spellWheel_timer / rot_time_total,
// 				this.spellWheel_origAngle,
// 				this.spellWheel_targetAngle,
// 				EngineUtils.INTERPOLATE_OUT
// 			);
// 			this.spellWheel_timer++;
// 			if (this.spellWheel_timer >= rot_time_total) {
// 				this.spellWheel_rotating = false;
// 			}
// 		}

// 		// Fade in
// 		if (this.timer < 60) {
// 			this.adjustFilter.brightness = this.timer / 60;
// 			this.timer++;
// 			if (this.timer === 60) {
// 				this.camera.removeFilter(this.adjustFilter);
// 			}
// 		}

// 		// Check for falling out of the map
// 		if (this.player.y >= this.room_height * 48) {
// 			$engine.setRoom(RoomManager.currentRoom().name);
// 		}

// 		// Check if player beats the level
// 		if (this.player.x >= (this.room_width - 3) * 48) {
// 			$engine.setRoom(RoomManager.currentRoom().name);
// 		}
// 	}

// 	onDestroy() {
// 		$engine.audioStopSound(this.audioSound);
// 	}

// 	draw(gui, camera) {
// 		// EngineDebugUtils.drawHitbox(camera, this);
// 		$engine.requestRenderOnGUI(this.spellWheel);
// 	}
// }
