class CreditsHandler extends Cutscene {
	onCutsceneCreate() {
		// ----------   INTRO CUTSCENE DIALOGUE LINES   ----------
		this.dialogue_lines = [
			new DialogueLine("I hope you have fun playing my game!", LARAYA_PORTRAITS.HAPPY),
			new DialogueLine("Thank you for making it all the way to the end", LARAYA_PORTRAITS.SURPRISED),
			new DialogueLine("Here, please meet my creators!", LARAYA_PORTRAITS.SURPRISED),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 2
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 3
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 4
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 5
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 6
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 7
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 8
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 9
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 10
			new DialogueLine("Thank you so much for playing!!", LARAYA_PORTRAITS.HAPPY),
			new DialogueLine("Have a great day, okay?", LARAYA_PORTRAITS.HAPPY),
		];

		this.audioSound = "BackgroundMusic_Credits";
		this.cutsceneFrames = [
			"creditsframe1",
			"creditsframe2",
			"creditsframe3",
			"creditsframe4",
			"creditsframe5",
			"creditsframe6",
			"creditsframe7",
			"creditsframe8",
			"creditsframe9",
			"creditsframe10",
		];
		this.nextRoom = "TitleScreen";
	}

	onDestroy() {
		$engine.audioStopSound(this.audioSound);
	}

	dialogueEnd() {}

	step() {
		super.step();
	}

	draw() {
		super.draw();
	}
}
