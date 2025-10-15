class TitleScreenHandler extends EngineInstance {
	onEngineCreate() {
		this.title_sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("title_screen")));
		this.title_sprite.scale.set(0.50551654964, 0.50551654964);

		this.waterFilter = new PIXI.filters.ReflectionFilter();
		this.waterFilter.boundary = 0.745;
		this.waterFilter.amplitude = [0, 20];
		this.waterFilter.waveLength = [30, 90];

		this.glowFilter = new PIXI.filters.AdvancedBloomFilter();
		this.glowFilter.bloomScale = 0;

		this.adjustFilter = new PIXI.filters.AdjustmentFilter();
		this.adjustFilter.brightness = 0;

		this.camera = $engine.getCamera();
		this.camera.addFilter(this.adjustFilter);
		this.camera.addFilter(this.waterFilter);
		this.camera.addFilter(this.glowFilter);

		this.timer = 0;
		this.fadeTime = 180;
		this.clicked = false;
	}

	onCreate(x, y) {
		this.onEngineCreate();
		this.x = x;
		this.y = y;
	}

	step() {
		this.waterFilter.time = $engine.getGameTimer() / 20;
		this.glowFilter.bloomScale = 0.1 + Math.sin($engine.getGameTimer() / 30) / 7;

		// Fade in
		if (!this.clicked) {
			this.timer++;
			this.adjustFilter.brightness = EngineUtils.interpolate(
				this.timer / this.fadeTime,
				0,
				1,
				EngineUtils.INTERPOLATE_IN
			);
			// Click to go to level
			if (IN.mouseCheckPressed(0) || IN.keyCheckPressed("KeyZ")) {
				this.clicked = true;
				this.timer = 0;
				this.adjustFilter.brightness = 1;

				this.shockwaveFilter = new PIXI.filters.ShockwaveFilter();
				this.shockwaveFilter.brightness = 1.5;
				this.shockwaveFilter.amplitude = 40;
				this.shockwaveFilter.waveLength = 240;
				this.shockwaveFilter.center = [$engine.getWindowSizeX() / 2, $engine.getWindowSizeY() / 2];

				this.zoomFilter = new PIXI.filters.ZoomBlurFilter();
				this.zoomFilter.strength = 0;
				this.zoomFilter.center = [$engine.getWindowSizeX() / 2, $engine.getWindowSizeY() / 2];

				this.camera.addFilter(this.shockwaveFilter);
				this.camera.addFilter(this.zoomFilter);

				// Play suspense sound
				this.audioSound = $engine.audioPlaySound("SuspenseSoundEffect", 0.07, false);
			}
		} else {
			// Fade out
			this.timer++;
			this.shockwaveFilter.time += EngineUtils.interpolate(this.timer / 30, 0.035, 0.0051, EngineUtils.INTERPOLATE_IN);
			this.adjustFilter.brightness = EngineUtils.interpolate(this.timer / 60, 1, 0, EngineUtils.INTERPOLATE_IN);
			this.zoomFilter.strength = EngineUtils.interpolate(this.timer / 50, 0, 0.3, EngineUtils.INTERPOLATE_IN);

			this.camera.setScaleX(EngineUtils.interpolate(this.timer / 70, 1, 1.5, EngineUtils.INTERPOLATE_IN));
			this.camera.setScaleY(EngineUtils.interpolate(this.timer / 70, 1, 1.5, EngineUtils.INTERPOLATE_IN));
			this.camera.setX(($engine.getWindowSizeX() - this.camera.getWidth()) / 2);
			this.camera.setY(($engine.getWindowSizeY() - this.camera.getHeight()) / 2);
			this.waterFilter.boundary =
				0.745 + ($engine.getWindowSizeY() - this.camera.getHeight()) / $engine.getWindowSizeY() / 4;

			if (this.timer == 80) {
				$engine.setRoom("GameIntro");
			}
		}
	}

	draw(gui, camera) {
		// $engine.requestRenderOnGUI(this.dialogue);
	}

	// onDestroy() {
	// 	$engine.audioStopSound(this.audioSound);
	// }
}
