class WaterDashParticle extends EngineInstance {
	onCreate(x, y, size = 1, angle = 0) {
		const spd = 3;

		this.sprite_scale = 0.5 * size;
		this.time = 0;
		this.ended = false;

		this.x = x;
		this.y = y;
		this.angle = angle;
		this.hsp = Math.cos(angle) * spd * 1.2;
		this.vsp = Math.sin(angle) * spd;

		if (Math.abs(angle) > Math.PI / 2) this.yScale *= -1;
		this.waterdashparticle = $engine.getAnimation("waterdashparticle_animation");
		this.animation = $engine.createRenderable(this, new PIXI.extras.AnimatedSprite(this.waterdashparticle), true);
		this.animation.animationSpeed = 0.45;

		// const rot_range = 0.1;
		// this.rot = EngineUtils.randomRange(-rot_range, rot_range);

		const filter = new PIXI.filters.PixelateFilter();
		filter.size.x = 2;
		filter.size.y = 2;
		this.animation.filters = [filter];

		// this.xOrig = this.x;
		// this.yOrig = this.y;
		// const hdist_range = 6;
		// this.hdist = this.xOrig + EngineUtils.randomRange(-hdist_range, hdist_range);
		// this.vdist = this.yOrig + EngineUtils.randomRange(5, -10);

		this.animation.onLoop = () => {
			this.alpha = 0;
			this.ended = true;
			this.destroy();
		};
	}

	step() {
		this.animation.update(1);

		//this.time++;

		//const scale = EngineUtils.interpolate(this.time / this.lifetime, this.sprite_scale, 0, EngineUtils.INTERPOLATE_IN);
		//this.xScale = scale;
		//this.yScale = scale;
		// this.alpha = scale + 0.2;
		//this.angle += this.rot;

		//this.x = EngineUtils.interpolate(this.time / this.lifetime, this.xOrig, this.hdist, EngineUtils.INTERPOLATE_OUT);
		//this.y = EngineUtils.interpolate(this.time / this.lifetime, this.yOrig, this.vdist, EngineUtils.INTERPOLATE_OUT);

		if (!this.ended) {
			// const lifetime = 3;
			this.time++;
			// this.alpha = EngineUtils.interpolate(this.time / this.lifetime, 1, 0, EngineUtils.INTERPOLATE_OUT);
			if (this.time > 8) {
				this.vsp += 0.2;
				this.alpha *= 0.93;
			}
		}

		this.x += this.hsp;
		this.y += this.vsp;
		const decay = 0.95;
		this.hsp *= decay;
		this.vsp *= decay;
	}
}
