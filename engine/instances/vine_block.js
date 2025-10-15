class VineBlock extends SolidObject {
	onEngineCreate() {
		this.setHitbox(new Hitbox(this, new RectangleHitbox(0, 0, 48, 48)));
		this.sprite = $engine.createRenderable(this, new PIXI.Sprite($engine.getTexture("vine_block")), true);
	}

	onCreate(x, y) {
		this.onEngineCreate();
		this.x = x;
		this.y = y;
		this.isBurning = false;
		this.burnTimer = -1;
	}

	step() {
		if (this.isBurning) {
			if (this.burnTimer > 0) {
				this.burnTimer--;
			} else {
				// Before destroying self, set adjacent vines on fire
				var vineBlock = IM.instancePlace(this, this.x, this.y - 48, VineBlock);
				if (vineBlock !== undefined) {
					vineBlock.startBurning(true);
				}
				vineBlock = IM.instancePlace(this, this.x, this.y + 48, VineBlock);
				if (vineBlock !== undefined) {
					vineBlock.startBurning(false);
				}

				this.destroy();
				// Vine Burn Sound Effect
				$engine.audioPlaySound("VineBurnSoundEffect", 1, false, 0.24, 0.29);
			}
		}
	}

	// The burnFromBottom variable controls the sprite of the burning vine to show it's burning from the bottom or top
	startBurning(burnFromBottom) {
		if (!this.isBurning) {
			this.isBurning = true;

			// Determine which direction the vine is burning from
			if (burnFromBottom) {
				this.sprite.texture = $engine.getTexture("burning_vine_block_bottom");
			} else {
				this.sprite.texture = $engine.getTexture("burning_vine_block_top");
			}
			this.burnTimer = 7;
		}
	}

	draw(gui, camera) {
		// EngineDebugUtils.drawHitbox(camera, this);
	}
}
