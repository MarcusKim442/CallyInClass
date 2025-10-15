class Artifact extends EngineInstance {
	onEngineCreate() {
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-12, -12, 12, 12)));
		this.bound = 0;
		this.speed = 0.5;
		this.move = 1;
		this.limit = 8;
		this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("artifact")), true);
	}

	onRoomStart() {
		this.global = Global.first;
	}

	step() {
		if (IM.instanceCollision(this, this.x, this.y, PlayerInstance)) {
			this.global.artifact_count += 1;
			ArtifactText.first.collected();
			this.destroy();
			// Artifact Collectile Sound Effect
			$engine.audioPlaySound("ArtifactCollectibleSoundEffect", 0.06, false);
		}
		if (this.bound > this.limit) {
			this.move = -1;
		} else if (this.bound < -this.limit) {
			this.move = 1;
		}

		this.y += this.move * this.speed;
		this.bound += this.move * this.speed;
	}
}
