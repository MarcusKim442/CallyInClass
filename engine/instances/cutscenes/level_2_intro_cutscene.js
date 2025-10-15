class Level2IntroCutscene extends Cutscene {
	onCutsceneCreate() {
		// ----------   CAVE/LEVEL 2 DIALOGUE LINES   ----------

		this.dialogue_lines = [
			new DialogueLine(
				"Where am I? Woah! The ground is really, really far away! That's probably not good!",
				LARAYA_PORTRAITS.SURPRISED
			), //happens in trees shot 1
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to trees shot 2
			new DialogueLine(
				"Wow! A flickow! It's gorgeous! I've read that they like collecting things, maybe it's picked up a part of my wand?",
				LARAYA_PORTRAITS.HAPPY
			), //happens in trees shot 2, then cutscene ends
		];

		this.audioSound = "JungleAmbience";
		this.cutsceneFrames = ["level2cutsceneframe1", "level2cutsceneframe2"];
		this.nextRoom = "Level2";
	}

	dialogueEnd() {}

	step() {
		super.step();
	}

	draw() {
		super.draw();
	}
}
