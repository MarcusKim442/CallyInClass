class WindSpell extends EngineInstance {
	onCreate(x, y) {
		// Earth Sound Effect
		$engine.audioPlaySound("EarthSoundEffect", 0.07, false);
		// this.spd = 10;
		this.x = x;
		this.y = y;
		this.width = 300;
		this.height = 10000;

		this.timer = 0;

		// this.xScale = 1;
		// this.yScale = 1;
		// this.grav = 0.5;

		// this.hsp = Math.cos(angle) * this.spd;
		// this.vsp = (Math.sin(angle) * this.spd - 5) * 1.1;

		// this.animation = [$engine.getTexture("rock_block")];
		// this.sprite = $engine.createRenderable(this, new PIXI.extras.AnimatedSprite(this.animation), true);

		this.setHitbox(
			new Hitbox(this, new RectangleHitbox(-this.width / 2, -this.height / 2, this.width / 2, this.height / 2))
		);

		this.player = PlayerInstance.first;
	}

	step() {
		this.timer++;
		if (this.timer >= 290) {
			this.destroy();
		}
		const yrange = 500;

		if (this.timer % 2 === 0) {
			new WindParticle(
				EngineUtils.randomRange(this.x - this.width / 2, this.x + this.width / 2),
				EngineUtils.randomRange(this.player.y - yrange, this.player.y + yrange)
			);
		}
	}
}
