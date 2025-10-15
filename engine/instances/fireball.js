class Fireball extends EngineInstance {
	onCreate(x, y, angle) {
		$engine.audioPlaySound("FireBallSoundEffect", 0.05, false, 0.3, 1.0);
		this.x = x;
		this.y = y;
		this.angle = angle;
		this.velocity = 10;
		this.xScale = 1;
		this.yScale = 1;
		this.lifespan = 600; // Set the lifespan of the Fireball to be 10 seconds
		this.animation = [$engine.getTexture("fireball")];
		this.sprite = $engine.createRenderable(this, new PIXI.extras.AnimatedSprite(this.animation), true);
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-30, -20, 30, 20)));
	}

	step() {
		this.lifespan--;
		if (this.lifespan == 0) {
			this.destroy();
		}

		this.sprite.update(1);
		this.x += Math.cos(this.angle) * this.velocity;
		this.y += Math.sin(this.angle) * this.velocity;

		if (IM.instanceCollision(this, this.x, this.y, SolidObject)) {
			this.destroy();
		}

		var iceBlock = IM.instancePlace(this, this.x, this.y, IceBlock);
		if (iceBlock !== undefined) {
			iceBlock.destroy();
		}

		var vineBlock = IM.instancePlace(this, this.x, this.y, VineBlock);
		if (vineBlock !== undefined) {
			vineBlock.startBurning();
		}
	}
}
