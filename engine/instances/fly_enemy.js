class FlyEnemy extends EngineInstance {
	onRoomStart() {
		this.player = PlayerInstance.first;
	}
	onEngineCreate() {
		this.hit = 2;
		this.speed = 3;
		this.bound = 400;
		this.left = this.x - this.bound;
		this.right = this.x + this.bound;
		this.damage = 100;
		this.xScale = 0.2;
		this.yScale = 0.2;
		this.wait = false;
		this.wait_time = 60;
		this.bomb_reload = 90;
		this.bomb_drop = true;
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-180, -100, 180, 100)));
		this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("flying_enemy")), true);
	}
	step() {
		if (!this.bomb_drop) {
			this.bomb_reload -= 1;
			if (!this.bomb_reload) {
				this.bomb_drop = true;
				this.bomb_reload = 90;
			}
		}
		var fireball = IM.instancePlace(this, this.x, this.y, Fireball);
		if (fireball !== undefined) {
			fireball.destroy();
			this.hit -= 1;
			this.alpha = 0.5;
		}

		if (this.hit === 0) {
			this.destroy();
		}

		if (this.x - this.bound < this.player.x && this.x + this.bound > this.x) {
			var offset = 0;
			if (this.x > this.player.x && this.x > this.left) {
				offset -= this.speed;
			}
			if (this.x < this.player.x && this.x < this.right) {
				offset += this.speed;
			}

			if (Math.abs(this.x - this.player.x) < 3) {
				offset = 0;
			}

			if (!IM.instanceCollision(this, this.x + offset, this.y, SolidObject)) {
				this.x += offset;
			}

			if (Math.abs(this.x - this.player.x) < 50 && this.bomb_drop) {
				new EnemyBomb(this.x, this.y);
				this.bomb_drop = false;
			}
		}
	}
}
