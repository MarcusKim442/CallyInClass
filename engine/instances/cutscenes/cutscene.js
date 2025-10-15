class Cutscene extends EngineInstance {
	onEngineCreate() {
		// These should be set in onCutsceneCreate()!! ------------
		this.dialogue_lines = [];
		this.audioSound = null;
		//this.title_sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture(background)));
		this.cutsceneFrames = [];
		this.nextRoom = "???";
		// --------------------------------------------------------

		//this.title_sprite.width = $engine.getCamera().getWidth();
		//this.title_sprite.height = $engine.getCamera().getHeight();

		this.camera = $engine.getCamera();
		this.adjustFilter = new PIXI.filters.AdjustmentFilter();
		this.adjustFilter.brightness = 0;
		this.camera.addFilter(this.adjustFilter);
		this.timer = 0;
		this.timer2 = 0;
		this.frameFadeTime = 120;
		this.frameFadeTimer = 0;
		// this.frameFadeFilter1 = new PIXI.filters.AdjustmentFilter();
		// this.frameFadeFilter2 = new PIXI.filters.AdjustmentFilter();

		this.startedTalking = false;
		this.visibleFrame = 0;
		this.renderableFrames = [];

		this.onCutsceneCreate();

		// Initialize renderableFrames
		for (var i = 0; i < this.cutsceneFrames.length; i++) {
			this.renderableFrames[i] = $engine.createManagedRenderable(
				this,
				new PIXI.Sprite($engine.getTexture(this.cutsceneFrames[i]))
			);
			this.renderableFrames[i].width = $engine.getCamera().getWidth();
			this.renderableFrames[i].height = $engine.getCamera().getHeight();
		}

		$engine.audioPlaySound(this.audioSound, 0.08, true);
	}

	onCreate(x, y) {
		this.onEngineCreate();
		this.x = 0;
		this.y = 0;
		// do stuff
	}

	onCutsceneCreate() {
		throw new Error("Why aren't you overriding my function!!! -Mini Marcus 😎");
		// CUTSCENES SHOULD HAVE THIS STUFF:
		// this.dialogue_lines = [];
		// this.audioSound = null;
		// this.cutsceneFrames = [];
		// this.nextRoom = "???";
	}

	step() {
		this.timer++;

		// Skip cutscene
		if (IN.keyCheckPressed("Slash")) {
			$engine.setRoom(this.nextRoom);
		}

		// Cutscene frame fading
		if (this.frameFadeTimer > 0) {
			this.renderableFrames[this.visibleFrame].alpha = EngineUtils.interpolate(
				(this.frameFadeTime - this.frameFadeTimer) / this.frameFadeTime,
				0,
				1,
				EngineUtils.INTERPOLATE_OUT
			);

			this.renderableFrames[this.visibleFrame - 1].alpha = EngineUtils.interpolate(
				(this.frameFadeTime - this.frameFadeTimer) / this.frameFadeTime,
				1,
				0,
				EngineUtils.INTERPOLATE_OUT
			);

			this.frameFadeTimer--;
		}

		// Long fade in
		const fadelength = 160;
		if (this.timer < fadelength) {
			this.adjustFilter.brightness = this.timer / fadelength;
			if (this.timer === fadelength) {
				// this.camera.removeFilter(this.adjustFilter);
				this.adjustFilter.enabled = false;
			}
			return;
		}

		// Dialogue. Detect for completion
		if (this.timer === fadelength + 80) {
			this.startedTalking = true;
			this.dialogue_instance = new Dialogue(0, 0, this.dialogue_lines, false, this.dialogueEnd.bind(this));
			return;
		}

		// Fade out into level
		if (this.startedTalking === true && !IM.exists(this.dialogue_instance)) {
			this.timer2++;
			this.adjustFilter.enabled = true;

			const delay = 100;
			if (this.timer2 > delay) {
				if (this.timer2 - delay < fadelength) {
					this.adjustFilter.brightness = 1 - (this.timer2 - delay) / fadelength;
					return;
				}
			}

			if (this.timer2 > delay + fadelength) {
				$engine.setRoom(this.nextRoom);
			}
		}
	}

	dialogueEnd() {}

	nextImage() {
		this.visibleFrame += 1;

		this.frameFadeTimer = this.frameFadeTime;
		this.renderableFrames[this.visibleFrame].alpha = 0;
	}

	onDestroy() {
		$engine.audioStopSound(this.audioSound);
	}

	draw(gui, camera) {
		$engine.requestRenderOnCamera(this.renderableFrames[this.visibleFrame]);

		if (this.frameFadeTimer > 0) {
			$engine.requestRenderOnCamera(this.renderableFrames[this.visibleFrame - 1]);
		}
	}
}
