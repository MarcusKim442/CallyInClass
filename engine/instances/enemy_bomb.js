class EnemyBomb extends EngineInstance {
	onCreate(x, y) {
		this.x = x;
		this.y = y;
		this.speed = 8;
		this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("bomb")), true);
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-140, -140, 140, 140)));
		this.xScale = 0.12;
		this.yScale = 0.12;
		this.damage = 100;
	}
	step() {
		this.y += this.speed;
		if (IM.instanceCollision(this, this.x, this.y, SolidObject, SemiSolid)) {
			this.destroy();
		}

		if (IM.instanceCollision(this, this.x, this.y, PlayerInstance)) {
			PlayerInstance.first.player_health -= 100;
		}
	}
}
