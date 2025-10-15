class WandPiece extends EngineInstance {
	onCreate(x, y, sprite) {
		this.onEngineCreate();
		this.x = x;
		this.y = y;
		this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture(sprite)), true);
	}

	onEngineCreate() {
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-12, -12, 12, 12)));
	}

	step() {
		if (IM.instanceCollision(this, this.x, this.y, PlayerInstance)) {
			this.destroy();
			// Wand Piece Collection Sound Effect
			$engine.audioPlaySound("ArtifactCollectibleSoundEffect", 0.05, false);
		}
	}
}
