class DustParticle extends EngineInstance {
	onCreate(x, y, size = 1) {
		this.sprite_scale = 0.5 * size;
		this.time = 0;
		this.lifetime = 15;

		this.x = x;
		this.y = y;
		this.spr = $engine.createRenderable(
			this,
			new PIXI.Sprite($engine.getRandomTextureFromSpritesheet("dustparticle")),
			true
		);
		const rot_range = 0.1;
		this.rot = EngineUtils.randomRange(-rot_range, rot_range);

		const filter = new PIXI.filters.PixelateFilter();
		filter.size.x = 2;
		filter.size.y = 2;
		this.spr.filters = [filter];

		this.xOrig = this.x;
		this.yOrig = this.y;
		const hdist_range = 6;
		this.hdist = this.xOrig + EngineUtils.randomRange(-hdist_range, hdist_range);
		this.vdist = this.yOrig + EngineUtils.randomRange(5, -10);
	}

	step() {
		this.time++;

		const scale = EngineUtils.interpolate(this.time / this.lifetime, this.sprite_scale, 0, EngineUtils.INTERPOLATE_IN);
		this.xScale = scale;
		this.yScale = scale;
		// this.alpha = scale + 0.2;
		this.angle += this.rot;

		this.x = EngineUtils.interpolate(this.time / this.lifetime, this.xOrig, this.hdist, EngineUtils.INTERPOLATE_OUT);
		this.y = EngineUtils.interpolate(this.time / this.lifetime, this.yOrig, this.vdist, EngineUtils.INTERPOLATE_OUT);

		if (this.time == this.lifetime) {
			this.destroy();
		}
	}
}
