// WARNING: This class should always have a vine_block above it if you want it to float.

class BoulderBlock extends SolidObject {
	onEngineCreate() {
		this.setHitbox(new Hitbox(this, new RectangleHitbox(-24, -24, 24, 24)));
		this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("boulder_block")), true);
		this.isFalling = false;
		this.vsp = 0;
	}

	onCreate(x, y) {
		this.onEngineCreate();
		this.x = x;
		this.y = y;
	}

	step() {
		var vineBlock = IM.instancePlace(this, this.x, this.y - 48, VineBlock);
		// Start falling
		if (vineBlock === undefined) {
			if (!IM.instanceCollision(this, this.x, this.y + 1, SolidObject)) {
				this.vsp += 0.4;
				if (!this.isFalling) {
					// Boulder Drop Sound Effect
					$engine.audioPlaySound("BoulderDropSoundEffect", 0.3, false);
					this.isFalling = true;
				}
				var belowBlock = IM.instancePlace(this, this.x, this.y + Math.floor(this.vsp), SolidObject);
				if (belowBlock === undefined) {
					this.y += Math.floor(this.vsp);
				} else {
					while (IM.instancePlace(this, this.x, this.y + 1, SolidObject) === undefined) {
						this.y++;
					}
					this.vsp = 0;
					this.isFalling = false;
				}
			}
		}
	}

	draw(gui, camera) {
		// EngineDebugUtils.drawHitbox(camera, this);
	}
}
