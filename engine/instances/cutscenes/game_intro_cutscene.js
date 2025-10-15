class GameIntroCutscene extends Cutscene {
	onCutsceneCreate() {
		// ----------   INTRO CUTSCENE DIALOGUE LINES   ----------
		this.dialogue_lines = [
			new DialogueLine("Hm hm hmm~ 🎵", LARAYA_PORTRAITS.HAPPY), //should be intro shot 1 here
			new DialogueLine("Wait, I'm missing a book!", LARAYA_PORTRAITS.HAPPY),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 2
			new DialogueLine("What's Ximara doing in this part of the Spire? Her rooms are up way higher!", LARAYA_PORTRAITS.SURPRISED),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 3
			new DialogueLine("Oh no! She's experimenting with parts of rare animals! Scales, feathers, fur... it's all illegal!", LARAYA_PORTRAITS.SURPRISED),
			new DialogueLine("What have we here? Guards!", XIMARA_PORTRAITS.NEUTRAL, "Ximara"), //happens in intro shot 3
			new DialogueLine(
				"This sorceress has been experimenting on rare species! Look at everything happening in this room! Absolutely horrible!",
				XIMARA_PORTRAITS.NEUTRAL,
				"Ximara"
			),
			new DialogueLine("No! This is your workshop and you know it!", LARAYA_PORTRAITS.ANGRY),
			new DialogueLine("How dare you insult a member of the Tribunal you serve? You must be tried immediately! Guards, take her to the court!", XIMARA_PORTRAITS.NEUTRAL),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to next shot (intro shot 4) here
			new DialogueLine("Some time later...", "", "",),
			new DialogueLine(
				"Laraya, Asu sorceress of Calchara, you have been found guilty for the crime of harming critically endangered species and are hereby banished from the city of Ishana.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine(
				"As High Sorcerer of this Tribunal, I declare that from now until evermore, you shall be unwelcome in the city of Ishana and all its surrounding lands.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine("But I didn't do anything wrong, I was jus-", LARAYA_PORTRAITS.SCARED),
			new DialogueLine("Silence. Maralan, remember the rest.", XIMARA_PORTRAITS.NEUTRAL, "Ximara"),
			new DialogueLine(
				"Of course. Furthermore, in accordance with the consequences for breaking our most sacred laws, your wand must be snapped.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine("Your banishment begins today. You will be portaled away from the city momentarily. Give me your wand.", MARALAN_PORTRAITS.NEUTRAL, "Maralan"),
			new DialogueLine("You can't do this! I won't be able to use magic! I need my belongings! Everything I own is here!", LARAYA_PORTRAITS.SCARED),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to next shot (intro shot 5) here
			new DialogueLine("Your wand, Laraya.", MARALAN_PORTRAITS.NEUTRAL, "Maralan"),
			new DialogueLine("You're making a mistake. The room is Xi- oof!", LARAYA_PORTRAITS.SURPRISED),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to next shot (intro shot 6) here
		];

		this.audioSound = "GameIntroCutScene";
		this.cutsceneFrames = [
			"gameintrocutsceneframe1",
			"gameintrocutsceneframe2",
			"gameintrocutsceneframe3",
			"gameintrocutsceneframe4",
			"gameintrocutsceneframe5",
			"gameintrocutsceneframe6",
		];
		this.nextRoom = "TutorialIntro";
	}

	dialogueEnd() {}

	step() {
		super.step();
	}

	draw() {
		super.draw();
	}
}
