class Spikes extends SolidObject {
	onEngineCreate() {
		this.xScale = 2;
		this.yScale = 2;
		this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("spikes")), true);
		this.hitbox = new Hitbox(this, new RectangleHitbox(-12, -12, 12, 12));
		this.killhitbox = new Hitbox(this, new RectangleHitbox(-13, -13, 13, 13));
		this.setHitbox(this.hitbox);
	}

	onCreate(x, y) {
		this.onEngineCreate();
		this.x = x;
		this.y = y;
	}

	step() {
		this.setHitbox(this.killhitbox);
		if (IM.instanceCollision(this, this.x, this.y - 1, PlayerInstance)) {
			PlayerInstance.first.player_health -= 999999;
			if (PlayerInstance.first.player_health === 0) {
				$engine.setRoom(RoomManager.currentRoom().name);
			}
		}
		this.setHitbox(this.hitbox);
	}
}
