class WindParticle extends EngineInstance {
	onCreate(x, y, size = 1) {
		this.sprite_scale = 0.5 * size;

		this.x = x;
		this.y = y;

		this.vsp = -4;

		this.windparticleanimation = $engine.getAnimation("windspell_animation");
		this.animation = $engine.createRenderable(this, new PIXI.extras.AnimatedSprite(this.windparticleanimation), true);
		this.animation.animationSpeed = EngineUtils.randomRange(0.2, 0.25);

		const filter = new PIXI.filters.PixelateFilter();
		filter.size.x = 2;
		filter.size.y = 2;
		this.animation.filters = [filter];

		this.animation.onLoop = () => {
			this.alpha = 0;
			this.destroy();
		};

		this.xScale = EngineUtils.randomRange(0.5, 1.5);
		this.yScale = 2 - this.xScale;

		this.timer = 0;
	}

	step() {
		this.animation.update(1);
		this.timer++;
		if (this.timer > 5) {
			this.alpha *= 0.9;
		}

		this.y += this.vsp;
		this.vsp *= 0.8;
	}
}
