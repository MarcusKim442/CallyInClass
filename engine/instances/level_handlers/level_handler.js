class LevelHandler extends EngineInstance {
	onEngineCreate() {
		this.timer2 = 0;
		this.beatLevel = false;

		this.wand_piece_collected = false;

		// this.nextRoom = "OVERRIDE THIS";
	}

	spellWheelRotate(toSpellID) {
		// console.log("HLO");
		// this.spellWheel_sprite.rotation = toSpellID * (Math.PI / 2);
		this.spellWheel_rotating = true;
		this.spellWheel_origAngle = this.spellWheel_sprite.rotation;
		//this.spellWheel_targetAngle = -toSpellID * (Math.PI / 2);
		this.spellWheel_targetAngle =
			this.spellWheel_origAngle + V2D.angleDiff(this.spellWheel_origAngle, -toSpellID * (Math.PI / 2));
		this.spellWheel_timer = 0;
	}

	winLevel() {
		$engine.pauseGameSpecial(this);
		this.beatLevel = true;

		// this.winScreenSprite = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("cutscene_1")));
		// this.winScreenSprite.width = $engine.getCamera().getWidth();
		// this.winScreenSprite.height = $engine.getCamera().getHeight();

		// this.winMessage = $engine.createManagedRenderable(
		// 	this,
		// 	new PIXI.Text("You Win! Thank you for playing the Vertical Slice", { ...$engine.getDefaultTextStyle() })
		// );
		// this.winMessage.x = 200;
		// this.winMessage.y = 100;

		this.camera = $engine.getCamera();
		this.adjustFilter = new PIXI.filters.AdjustmentFilter();
		this.adjustFilter.brightness = 1;
		this.camera.addFilter(this.adjustFilter);

		// this.adjustFilter2 = new PIXI.filters.AdjustmentFilter();
		// this.adjustFilter2.alpha = 0;
		// this.winScreenSprite.filters = [this.adjustFilter2];
		// this.winMessage.filters = [this.adjustFilter2];
	}

	winLevelStep() {
		this.timer2++;

		const fadeTime = 220;

		if (this.timer2 < fadeTime) {
			this.adjustFilter.brightness = 1 - this.timer2 / fadeTime;
			return;
		}
		// console.log("why");

		$engine.unpauseGameSpecial();
		// this.camera.removeFilter(this.adjustFilter);
		$engine.setRoom(this.nextRoom);
	}

	onDestroy() {
		$engine.audioStopAll();
	}
}
