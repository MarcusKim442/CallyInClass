class Level3IntroCutscene extends Cutscene {
	onCutsceneCreate() {
		// ----------   SWAMP/LEVEL 3 DIALOGUE LINES   ----------

		this.dialogue_lines = [
			new DialogueLine("This place doesn't look very friendly…", LARAYA_PORTRAITS.HAPPY), //happens in swamp shot 1
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to swamp shot 2
			new DialogueLine("Ah! I heard something! Who goes there! Show yourself!", LARAYA_PORTRAITS.SCARED), //need AUDIO to occur just before this in swamp shot 2
			new DialogueLine("Well, just please don't eat my hand!", LARAYA_PORTRAITS.SCARED),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to swamp shot 3
			new DialogueLine(
				"Oh! An axodile! Out of the water? And injured? What happened to you? Let's get you back in the water!",
				LARAYA_PORTRAITS.SURPRISED
			), //cutscene ends
		];

		this.audioSound = "Level3IntroCutScene";
		this.cutsceneFrames = ["level3cutsceneframe1", "level3cutsceneframe2", "level3cutsceneframe3"];
		this.nextRoom = "Level3";
	}

	dialogueEnd() {}

	step() {
		super.step();
	}

	draw() {
		super.draw();
	}
}
 