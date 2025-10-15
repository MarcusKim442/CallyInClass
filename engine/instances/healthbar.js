class HealthBar extends EngineInstance {
	onRoomStart() {
		this.player = PlayerInstance.first;
	}
	onEngineCreate() {
		this.healthbar = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("health")));
		this.healthbar.x = 40;
		this.healthbar.y = 80;
	}
	step() {
		this.healthbar.scale.set(3 * (this.player.player_health / 100), 2);
	}
	draw(gui, camera) {
		$engine.requestRenderOnGUI(this.healthbar);
	}
}
