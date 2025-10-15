class RockBlock extends SemiSolid {
	onCreate(x, y, angle) {
		// Earth Sound Effect
		$engine.audioPlaySound("EarthSoundEffect", 0.07, false);
		this.spd = 10;
		this.x = x;
		this.y = y;
		this.xScale = 2;
		this.yScale = 2;
		this.grav = 0.5;
		this.grounded = false;
		this.player = PlayerInstance.first;
		this.player.rock_spell_count++;
		this.depth = 1000000;

		this.hsp = Math.cos(angle) * this.spd;
		this.vsp = (Math.sin(angle) * this.spd - 5) * 1.1;

		this.animation = [$engine.getTexture("rock_block")];
		this.sprite = $engine.createRenderable(this, new PIXI.extras.AnimatedSprite(this.animation), true);
		this.timer = 0;
		//this.animation.scale.set(2, 2);
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-23, -24, 23, 24)));

		if (this.collisionCheck(this.x, this.y)) {
			this.blockDestroy();
		}
	}

	step() {
		this.sprite.update(1);
		this.timer++;
		if (this.timer > 300) {
			this.blockDestroy();
		}

		if (this.grounded) {
			if (!this.collisionCheck(this.x, this.y + 1)) {
				this.grounded = false;
			}
		} else {
			this.vsp += this.grav;
			this.collision();

			if (this.collisionCheck(this.x, this.y + 1)) {
				//console.log("works");
				// Become Grounded
				this.hsp = 0;
				this.vsp = 0;
				this.grounded = true;

				const num = 4;
				for (var i = 0; i < num; i++) {
					new DustParticle(this.x - 44 + i * (100 / num), this.y + 48, 1);
				}

				// Squish enemies
				const enemList = IM.instanceCollisionList(this, this.x, this.y, Enemy);
				for (var i = 0; i < enemList.length; i++) {
					enemList[i].die();
				}
			}
		}
	}

	collisionCheckY() {
		var hit = false;
		var t = 0;
		if (this.vsp != 0 && this.collisionCheck(this.x, this.y + this.vsp)) {
			while (!this.collisionCheck(this.x, this.y + Math.sign(this.vsp)) && t < Math.abs(this.vsp)) {
				this.y += Math.sign(this.vsp);
				t++;
			}
			this.vsp = 0;
			hit = true;
		}
		return hit;
	}

	collisionCheckX() {
		var hit = false;
		var t = 0;
		if (this.hsp != 0 && this.collisionCheck(this.x + this.hsp, this.y)) {
			while (!this.collisionCheck(this.x + Math.sign(this.hsp), this.y) && t < Math.abs(this.hsp)) {
				this.x += Math.sign(this.hsp);
				t++;
			}
			this.hsp = 0;
			hit = true;
		}
		return hit;
	}

	collision() {
		if (Math.abs(this.hsp) > Math.abs(this.vsp)) {
			while (this.collisionCheckX());
			this.x += this.hsp;

			while (this.collisionCheckY());
			this.y += this.vsp;
		} else {
			while (this.collisionCheckY());
			this.y += this.vsp;

			while (this.collisionCheckX());
			this.x += this.hsp;
		}
	}

	collisionCheck(x, y) {
		var collided = IM.instanceCollision(this, x, y, SolidObject);
		if (collided) {
			return true;
		}

		if (this.vsp >= 0) {
			// Only collide if the semisolid is below you
			var collided_list = IM.instanceCollisionList(this, x, y, SemiSolid);
			for (const obj of collided_list) {
				if (obj.getHitbox().getBoundingBoxTop() > this.getHitbox().getBoundingBoxBottom()) {
					return true;
				}
			}
		}
	}

	blockDestroy() {
		const num = 3;
		const start = 44;
		const total = 88;

		for (var i = 0; i < num; i++) {
			for (var j = 0; j < num; j++) {
				new DustParticle(this.x - start + i * (total / (num - 1)), this.y - start + j * (total / (num - 1)), 1.5);
			}
		}
		this.player.rock_spell_count--;

		this.destroy();
	}
}
