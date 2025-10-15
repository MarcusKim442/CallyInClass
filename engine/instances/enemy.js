class Enemy extends EngineInstance {
	onEngineCreate() {
		this.speed = 2;
		this.damage = 100;
		this.no_damage_period = 0;
		this.damage_done = false;
		this.direction = 1;
		// this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("evil_laraya")), true);

		this.gaterwalk = $engine.getAnimation("gaterwalk_animation");
		this.gaterturn = $engine.getAnimation("gaterturn_animation");
		this.gaterhurt = [$engine.getTexture("gaterhurt")];
		this.animation = $engine.createRenderable(this, new PIXI.extras.AnimatedSprite(this.gaterwalk), true);
		this.animation.animationSpeed = 0.2;

		this.yScale = 2;
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-15, -36, 15, 0)));

		this.dying = false;
		this.turning = false;

		this.dying_timer = 0;
		this.dhsp = 0;
		this.dvsp = -8;

		this.animation.onLoop = () => {
			if (this.turning) {
				this.direction *= -1;
				this.turning = false;
				EngineUtils.setAnimation(this.animation, this.gaterwalk);
			}
		};
	}

	step() {
		this.animation.update(1);

		if (this.dying) {
			this.dying_timer++;
			this.x += this.dhsp;
			this.y += this.dvsp;
			this.dvsp += 0.3;
			this.dhsp *= 0.95;
			//this.angle += 0.2 * this.direction;

			if (this.dying_timer > 40) {
				new DustParticle(this.x + EngineUtils.irandom(-50, 50), this.y - 17 + EngineUtils.irandom(-50, 50), 1.5);
			}
			if (this.dying_timer === 45) {
				// for (var i = 0; i < 5; i++) {
				// 	console.log("works");
				// 	new DustParticle(this.x + EngineUtils.irandom(-50, 50), this.y - 17 + EngineUtils.irandom(-50, 50), 1.5);
				// }
				this.destroy();
			}
			return;
		}

		if (this.turning) {
			this.checkDying();
			return;
		}

		if (this.damage_done && this.no_damage_period > 0) {
			this.no_damage_period -= 1;
			if (!this.no_damage_period) {
				this.damage_done = false;
			}
		}
		this.x += this.speed * this.direction;
		this.xScale = -this.direction * 2;

		if (IM.instanceCollision(this, this.x, this.y, SolidObject)) {
			// this.direction *= -1;
			// this.turning = true;
			this.gotoTurning();
		}
		if (!IM.instanceCollision(this, this.x + 20 * this.direction, this.y + 5, SolidObject, SemiSolid)) {
			// this.direction *= -1;
			// this.turning = true;
			this.gotoTurning();
		}

		this.checkDying();

		if (IM.instanceCollision(this, this.x, this.y, PlayerInstance) && !this.damage_done) {
			var player = IM.instancePlace(this, this.x, this.y, PlayerInstance);
			player.player_health -= this.damage;
			// if (player.player_health === 0) {
			// 	$engine.setRoom(RoomManager.currentRoom().name);
			// }
			this.damage_done = true;
			this.no_damage_period = 90;
		}
	}

	gotoTurning() {
		this.turning = true;
		EngineUtils.setAnimation(this.animation, this.gaterturn);
	}

	checkDying() {
		if (IM.instanceCollision(this, this.x, this.y, Fireball)) {
			const fireball = IM.instancePlace(this, this.x, this.y, Fireball);
			this.dhsp = 8 * Math.sign(this.x - fireball.x);
			fireball.destroy();
			this.die();
			// this.destroy();
		}
	}

	die() {
		// Gater Death Sound Effect
		$engine.audioPlaySound("DinosaurDeathSoundEffect", 0.04, false);
		this.dying = true;
		EngineUtils.setAnimation(this.animation, this.gaterhurt);
	}
}
