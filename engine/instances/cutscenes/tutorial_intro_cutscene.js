class TutorialIntroCutscene extends Cutscene {
	onCutsceneCreate() {
		// ----------   JUNGLE/TUTORIAL DIALOGUE LINES   ----------
		this.dialogue_lines = [
			new DialogueLine("Aaaaaaaaaaaaaahhh!", LARAYA_PORTRAITS.SCARED), //happens in jungle shot 1, shots 2/3/4 play then cutscene ends
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE),
		];

		this.audioSound = "JungleAmbience";
		this.cutsceneFrames = ["tutorialcutsceneframe1", "tutorialcutsceneframe2", "tutorialcutsceneframe3"];
		this.nextRoom = "Tutorial";
	}

	dialogueEnd() {}

	step() {
		super.step();
	}

	draw() {
		super.draw();
	}
}
