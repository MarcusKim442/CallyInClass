class Level3EndCutscene extends Cutscene {
	onCutsceneCreate() {
		// ----------   MUSHROOM VILLAGE CUTSCENE DIALOGUE LINES   ----------

		this.dialogue_lines = [
			new DialogueLine(
				"Wow! This is beautiful! This must be a Dwargin village, I've seen signs of them nearby. Is anyone home?",
				LARAYA_PORTRAITS.HAPPY
			), //in village shot 1
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //village shot 2
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //village shot 3
			new DialogueLine(
				"Ahh! Calm down, everyone, I mean you no harm! What's going on? I haven't done anything wrong!",
				LARAYA_PORTRAITS.SCARED
			),
			new DialogueLine("Evil Asu sorceress is not welcome here. Leave!", undefined, "Villagers"), //villagers speaking
			new DialogueLine("What? Evil? I'm not evil, why would you…", LARAYA_PORTRAITS.SURPRISED),
			new DialogueLine("Ximara. You have to understand, I'm not her!", LARAYA_PORTRAITS.SURPRISED),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //village shot 4
			new DialogueLine("The sorceress speaks the truth. You must relax.", ELDER_PORTRAITS.NEUTRAL, "Elder"),
			new DialogueLine(
				"She is not the one we fear, and I sense she may be on our side.",
				ELDER_PORTRAITS.NEUTRAL,
				"Elder"
			), //elder speaking
			new DialogueLine(
				"Thank you, Elder. You speak true, for I am in search of ways to bring down her evil.",
				LARAYA_PORTRAITS.HAPPY
			),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //village shot 5
			new DialogueLine(
				"In that case, you may be needing this. One of our scouts found it and said you were helping an axodile earlier.",
				ELDER_PORTRAITS.NEUTRAL,
				"Elder"
			),
			new DialogueLine(
				"That is why I trust you with this. Do not let her actions go unanswered.",
				ELDER_PORTRAITS.NEUTRAL,
				"Elder"
			),
			new DialogueLine(
				"The last piece of my wand, it's imperative for the portal spell! Thank you so much, Elder!",
				LARAYA_PORTRAITS.HAPPY
			),
			new DialogueLine(
				"With this, I can finally get back to the Spire and hopefully, show the Tribunal the truth!",
				LARAYA_PORTRAITS.HAPPY
			),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //village shot 6
		];

		this.audioSound = "Level3EndCutScene";
		this.cutsceneFrames = [
			"endlv3cutsceneframe1",
			"endlv3cutsceneframe2",
			"endlv3cutsceneframe3",
			"endlv3cutsceneframe4",
			"endlv3cutsceneframe5",
			"endlv3cutsceneframe6",
		];
		this.nextRoom = "EndingScene";
	}

	dialogueEnd() {}

	step() {
		super.step();
	}

	draw() {
		super.draw();
	}
}
