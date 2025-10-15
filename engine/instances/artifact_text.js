class ArtifactText extends EngineInstance {
	onEngineCreate() {
		// EVIDENCE/ARTIFACTS/COLLECTIBLES/GLOWY ORBS POPUP DIALOGUE (JUNGLE)
		this.jungleevidence = [
			new DialogueLine(
				"Long, narrow footsteps lie here, likely Asu. The measured and unhurried gait conveys a sinister message."
			),
		];
		// EVIDENCE/ARTIFACTS/COLLECTIBLES/GLOWY ORBS POPUP DIALOGUE (CAVE)
		this.caveevidence = [
			new DialogueLine(
				"Long, narrow footsteps lie here, likely Asu. The measured and unhurried gait conveys a sinister message."
			),
			new DialogueLine(
				"A pair of scissors lie discarded in the dust, fragments of red scale scattered around the heavy, sharp Asu blades."
			),
			new DialogueLine("These are drag marks from something that didn't want to leave its home."),
			// random rotation upon getting a collectible to determine which will show
		];
		// EVIDENCE/ARTIFACTS/COLLECTIBLES/GLOWY ORBS POPUP DIALOGUE (TREES)
		this.treesevidence = [
			new DialogueLine(
				"Long, narrow footsteps lie here, likely Asu. The measured and unhurried gait conveys a sinister message."
			),
			new DialogueLine(
				"A flickow feather is suspended in the foliage. A flickow would never willingly leave a feather so close to their nest."
			),
			new DialogueLine(
				"A length of rope manufactured in Ishana is caught on a branch, roughly cut edges where the bindings were broken."
			),
			new DialogueLine(
				"A chunk of fur is caught on the branch, its mottled nature painting it as Leota fur. Leotas are sure-footed in all terrain, this was not caused by a simple misstep."
			),
			// random rotation upon getting a collectible to determine which will show
		];

		// EVIDENCE/ARTIFACTS/COLLECTIBLES/GLOWY ORBS POPUP DIALOGUE (SWAMP)
		this.swampevidence = [
			new DialogueLine(
				"Long, narrow footsteps lie here, likely Asu. The measured and unhurried gait conveys a sinister message."
			),
			new DialogueLine(
				"Wide, stunted footsteps lie here, likely Dwargin. Large paces and scuffs in the dirt show that they were running, something a Dwargin would never do if given the option."
			),
			new DialogueLine(
				"A knife lies on the ground, its long and slender blade coated in dried blood. This design is favoured by Asu sorcerers."
			),
			new DialogueLine(
				"A flickow feather gathers dust on the ground. Flickows never leave feathers behind, meaning it had no choice."
			),
			new DialogueLine(
				"Shards of blue-green scales are strewn throughout the area. Axodiles lose whole scales at a time, and usually in the water, meaning this was a maleficent occurrence."
			),
			// random rotation upon getting a collectible to determine which will show
		];

		this.x_loc = 500;
		this.y_loc = 700;
		this.fade = false;
		this.fade_time = 0.001;
		this.fade_value = 1;
		this.dialogue_text = $engine.createManagedRenderable(
			this,
			new PIXI.Text("", {
				fontFamily: "Arial",
				fontSize: 15,
				fill: 0xffffff,
				align: "center",
				wordWrap: true,
				wordWrapWidth: 300,
			})
		);
		this.dialogue = $engine.createManagedRenderable(this, new PIXI.Container());
		this.bg_box = $engine.createManagedRenderable(this, new PIXI.Sprite($engine.getTexture("msgbox")));
		this.bg_box.scale.set(1.25, 1.25);
	}

	step() {
		if (this.fade) {
			this.fade_value += this.fade_time;
			this.dialogue.alpha = EngineUtils.interpolate(this.fade_value, 1, 0, EngineUtils.INTERPOLATE_OUT);
			if (this.dialogue.alpha < 0) {
				this.fade = false;
			}
		}
	}

	collected() {
		this.fade = true;
		this.fade_value = 0;
		if (RoomManager.currentRoom().name === "Tutorial") {
			this.dialogue_text.text = this.jungleevidence[EngineUtils.irandomRange(0, this.jungleevidence.length - 1)].text;
		} else if (RoomManager.currentRoom().name === "Level1") {
			this.dialogue_text.text = this.caveevidence[EngineUtils.irandomRange(0, this.caveevidence.length - 1)].text;
		} else if (RoomManager.currentRoom().name === "Level2") {
			this.dialogue_text.text = this.treesevidence[EngineUtils.irandomRange(0, this.treesevidence.length - 1)].text;
		} else if (RoomManager.currentRoom().name === "Level3") {
			this.dialogue_text.text = this.swampevidence[EngineUtils.irandomRange(0, this.swampevidence.length - 1)].text;
		} else {
			this.dialogue_text.text = "Collected!";
		}

		this.bg_box.x = -50;
		this.bg_box.y = -15;
		this.dialogue.x = this.x_loc - 160;

		this.dialogue.y = this.y_loc;

		this.dialogue.addChild(this.bg_box);
		this.dialogue.addChild(this.dialogue_text);
	}
	draw() {
		$engine.requestRenderOnGUI(this.dialogue);
	}
}
