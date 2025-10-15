class Leaf extends EngineInstance {
	onCreate(x, intercept, wind_dir, value) {
		this.wind_dir = wind_dir;
		this.global = Global.first;
		this.x = x;
		this.y = 0;
		this.max_velocity = EngineUtils.irandomRange(2 + value, 5 + value);
		this.speed = this.max_velocity * this.wind_dir;
		this.slope = EngineUtils.randomRange(-1, 1);
		this.intercept = intercept;

		this.xOffset = EngineUtils.randomRange(0.1, 0.3);
		this.yOffset = EngineUtils.randomRange(0.2, 0.4);
		this.setSprite(new PIXI.Sprite($engine.getTexture("leaf")), true);
		var extern = RoomManager.currentRoom().getAllExtern();
		var r = [20, 40];
		var g = [70, 204];
		var b = [20, 40];
		if (extern.GrassColor) {
			var values = extern.GrassColor[0].split(",").map((x) => Number(x));
			var r = [values[0], values[1]];
			var g = [values[2], values[3]];
			var b = [values[4], values[5]];
		}

		const red = Math.round(EngineUtils.irandomRange(r[0], r[1]));
		const green = Math.round(EngineUtils.irandomRange(g[0], g[1]));
		const blue = Math.round(EngineUtils.irandomRange(b[0], b[1]));
		this.getSprite().tint = (red << 16) | (green << 8) | blue;

		this.setHitbox(new Hitbox(this, new RectangleHitbox(0, 0, 36, 36)));
		this.timer = 500;
	}

	step() {
		var max = this.max_velocity;
		if (this.global.wind_direction !== this.wind_dir) {
			max /= 2;
		}
		var speed_change = 0.05;
		if (Math.abs(this.speed) <= max) {
			this.speed += speed_change * this.global.wind_direction;
		} else {
			this.speed -= speed_change * Math.sign(this.speed);
		}
		this.x += this.speed;
		this.y = this.slope * this.x + this.intercept;
		var scale = Math.sin(this.x / 50);
		this.xScale = this.xOffset - scale / 10;
		this.yScale = this.yOffset - scale / 10;
		this.timer--;
		if (this.timer === 0) {
			this.alpha -= 1;
			if (this.alpha === 0) {
				this.destroy();
			}
		}
	}
}

class LeafCreate extends EngineInstance {
	onEngineCreate() {
		this.wind_dir = 0;
		this.timer = 2;
		this.value = 3;
	}

	onRoomStart() {
		this.global = Global.first;
	}

	step() {
		this.timer--;
		if (this.timer === 0) {
			this.timer = 3;
			if (this.global.wind_direction !== 0) {
				this.wind_dir = this.global.wind_direction;
			}
			if (!this.wind_dir) {
				return;
			}
			//for (let i = 0; i < 30; i++) {
			var cam = $engine.getCamera().getBoundingBox();

			if (this.wind_dir === 1) {
				var x = cam.x1 - EngineUtils.irandom(200, 1000);
			} else if (this.wind_dir === -1) {
				var x = cam.x2 + EngineUtils.irandom(200, 1000);
			}
			var intercept = EngineUtils.irandomRange(cam.y1, cam.y2);
			new Leaf(x, intercept, this.wind_dir, this.value);
		}
	}
}
