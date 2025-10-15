class TutorialHandler extends LevelHandler {
	onEngineCreate() {
		$engine.getEngineGlobalData().myVar = 0;
		var extern = RoomManager.currentRoom().getAllExtern();
		if (extern.Music) {
			var music = extern.Music;
			music[1] = Number(music[1]);
			this.audioSound = $engine.audioPlaySound(music[0], music[1], true);
		}

		this.room_width = RoomManager.currentRoom().getRPGRoomWidth() / 48;
		this.room_height = RoomManager.currentRoom().getRPGRoomHeight() / 48;
		this.camera_dimensions = [1008, 816];

		this.camera = $engine.getCamera();
		// this.camera.setScaleX(0.5);
		// this.camera.setScaleY(0.5);
		this.camera.setDimensions(this.camera_dimensions[0], this.camera_dimensions[1]);
		//this.camera.setY(2 * 48);
		$engine.setBackground(new PIXI.extras.TilingSprite($engine.getTexture("bglevel2")));
		this.background = $engine.getBackground();
		this.background.tileScale.set(1, 1);
		this.background.width = this.camera_dimensions[0];
		this.background.height = this.camera_dimensions[1];

		this.foreground = new EmptyInstance();
		this.foreground.setSprite(new PIXI.extras.TilingSprite($engine.getTexture("fglevel2")));
		this.foreground.depth = -1000;
		this.fgSprite = this.foreground.getSprite();
		this.fgSprite.tileScale.set(2, 2);
		this.fgSprite.width = this.room_width * 48;
		this.fgSprite.height = 360;

		// this.rayFilter = new PIXI.filters.GodrayFilter();
		// this.rayFilter.gain = 0.4;
		// this.rayFilter.lucanarity = 2;
		// this.rayFilter.alpha = 0.5;
		// this.rayFilter_offset = EngineUtils.random(1000);
		// this.camera.addFilter(this.rayFilter);

		const leafFilter = new PIXI.filters.AdvancedBloomFilter();
		leafFilter.bloomScale = 1.5;
		this.fgSprite.filters = [leafFilter];
		this.add_collectible = true;

		this.spellWheel = $engine.createManagedRenderable(this, new PIXI.Container());
		this.spellWheel_sprite = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("spellwheel0")));
		this.spellWheel_sprite.scale.set(2, 2);
		this.spellWheel_sprite.x = this.camera_dimensions[0] - this.spellWheel_sprite.width / 2 - 5;
		this.spellWheel_sprite.y = this.camera_dimensions[1] - this.spellWheel_sprite.height / 2 - 5;
		this.spellWheel.addChild(this.spellWheel_sprite);
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

		this.wand_piece = new WandPiece(1752, 1704, "fire_wand");
		this.nextRoom = "Level1Intro";

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
		this.player.spells_learned = 0;
		// ----------   JUNGLE DIALOGUE LINES   ----------
		this.junglelines = [
			new DialogueLine("Ouch! That hurt.", LARAYA_PORTRAITS.HURT),
			new DialogueLine("Use A and D to move left and right and SPACE or W to jump.", TUTORIAL_PORTRAITS.WASD, ""),
			new DialogueLine(
				"Some platforms, such as tree leaves or branches, can be dropped through by holding S.",
				TUTORIAL_PORTRAITS.WASD,
				""
			),
			new DialogueLine(
				"Press Z to continue dialogue and cutscenes, and / to skip cutscenes altogether.",
				TUTORIAL_PORTRAITS.Z,
				""
			),
			new DialogueLine(
				"Q and E will switch your equipped wand piece while LEFT CLICK will use the active ability associated with them. Use the wand pieces you recover to explore the world, find evidence against Ximara, and make it back home!",
				TUTORIAL_PORTRAITS.QE,
				""
			),
			new DialogueLine(
				"Alright then. So all I need to do is find the pieces of my wand and I can portal back home! Once I know how to prove my innocence, I suppose…",
				LARAYA_PORTRAITS.HAPPY
			),
			new DialogueLine(
				"That horrid workshop isn't mine, the Tribunal knows that! Why would they do this?",
				LARAYA_PORTRAITS.ANGRY
			),
		];
		this.dialogue_instance = new Dialogue(0, 0, this.junglelines);
		/**@type {Global} */

		this.global = Global.first;
	}

	step() {
		// Dialogue trigger for seeing the artifact
		if (!this.see_artifact_trigger && 24 * 48 <= this.player.x && this.player.x <= 25 * 48) {
			this.see_artifact_trigger = true;
			this.artifactline = [
				new DialogueLine("Hang on, what's over there? Something's glowing!", LARAYA_PORTRAITS.HAPPY), //fire wand piece is on the ground, nowhere else to go but interact with it. Lore appears on screen (see WAND PIECE GATHERED section of dialogue) when clicked
			];
			this.dialogue_instance = new Dialogue(0, 0, this.artifactline, true);
		}

		// Dialogue trigger for collecting the artifact
		if (!this.get_artifact_trigger && 30 * 48 <= this.player.x && this.player.x <= 32 * 48) {
			this.get_artifact_trigger = true;
			this.artifactline = [
				new DialogueLine(
					"Oh! They look like magically preserved footsteps! Evidence that an Asu sorcerer was here before me!",
					LARAYA_PORTRAITS.SURPRISED
				),
				new DialogueLine(
					"If I can find more, maybe I can prove that it was Ximara behind everything!",
					LARAYA_PORTRAITS.HAPPY
				),
				new DialogueLine(
					"I'll need a lot of evidence to have my banishment lifted, though I'm sure if I only get some the Tribunal will start investigating.",
					LARAYA_PORTRAITS.HAPPY
				),
				new DialogueLine(
					"But if I go back with close to nothing, they'll just throw me out again!",
					LARAYA_PORTRAITS.SCARED
				),
			];
			this.dialogue_instance = new Dialogue(0, 0, this.artifactline, true);
		}

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

			// this.rayFilter.time = this.camera.getX() / 300 + $engine.getGameTimer() / 200 + this.rayFilter_offset;
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
			if (this.player.x >= (this.room_width - 3) * 48) {
				//$engine.setRoom(RoomManager.currentRoom().name);
				this.winLevel();
			}
		} else {
			// this.timer2++;
			// const fadeTime = 220;
			// if (this.timer2 < fadeTime) {
			// 	this.adjustFilter.brightness = 1 - this.timer2 / fadeTime;
			// 	this.adjustFilter2.alpha = this.timer2 / fadeTime;
			// 	return;
			// }
			if (this.add_collectible) {
				this.add_collectible = false;
				this.global.saveCollectible();
			}
			this.winLevelStep();
			// this.timer2++;

			// const fadeTime = 220;

			// if (this.timer2 < fadeTime) {
			// 	this.adjustFilter.brightness = 1 - this.timer2 / fadeTime;
			// 	//return;
			// } else {
			// 	this.camera.removeFilter(this.adjustFilter);
			// 	$engine.setRoom(this.nextRoom);
			// }
			// // console.log("why");
		}

		if (this.wand_piece_collected) {
			let collection_line = [
				new DialogueLine(
					"This element is fierce. The user can throw fireballs to kill enemies, melt ice, or burn plant life.",
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

	// winLevel() {
	// 	$engine.pauseGameSpecial(this);
	// 	this.beatLevel = true;
	// 	this.winScreenSprite = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("cutscene_1")));
	// 	this.winScreenSprite.width = $engine.getCamera().getWidth();
	// 	this.winScreenSprite.height = $engine.getCamera().getHeight();

	// 	this.winMessage = $engine.createManagedRenderable(
	// 		this,
	// 		new PIXI.Text("You Win! Thank you for playing the Vertical Slice", { ...$engine.getDefaultTextStyle() })
	// 	);
	// 	this.winMessage.x = 200;
	// 	this.winMessage.y = 100;

	// 	this.camera = $engine.getCamera();
	// 	this.adjustFilter = new PIXI.filters.AdjustmentFilter();
	// 	this.adjustFilter.brightness = 1;
	// 	this.camera.addFilter(this.adjustFilter);

	// 	this.adjustFilter2 = new PIXI.filters.AdjustmentFilter();
	// 	this.adjustFilter2.alpha = 0;
	// 	this.winScreenSprite.filters = [this.adjustFilter2];
	// 	this.winMessage.filters = [this.adjustFilter2];
	// }
}
