class GameEndCutscene extends Cutscene {
	onCutsceneCreate() {
		// ----------   ENDING CUTSCENES DIALOGUE LINES ALL START HERE  ----------

		// 100% collectibles gathered ending
		this.hundredpercentlines = [
			new DialogueLine(
				"Look at all of this! Conclusive proof that Ximara is the owner of that horrific workshop, not me, and that she is behind everything happening to the beings on Calchara!",
				LARAYA_PORTRAITS.ANGRY
			),
			new DialogueLine(
				"Outstanding, Laraya! This is everything you could have possibly found to prove yourself innocent and show us Ximara's true nature! Ximara, do you have any last words?",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine(
				"Foolish girl! You should not have dared to spy on me, and banishment is what you deserved!",
				XIMARA_PORTRAITS.NEUTRAL,
				"Ximara"
			),
			new DialogueLine(
				"The animals on Calchara are more valuable as objects than beings. I was making huge strides in my research until you came medding!",
				XIMARA_PORTRAITS.NEUTRAL,
				"Ximara"
			),
			new DialogueLine(
				"We are Asu! We are the most intelligent life on this planet and should act as such!",
				XIMARA_PORTRAITS.NEUTRAL,
				"Ximara"
			),
			new DialogueLine(
				"Ximara, you are hereby removed from the Tribunal and shall be sentenced to prison for the remainder of your lifetime.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine(
				"I am truly appalled that someone I worked so closely with to form laws for the preservation of Calcharan beings would so easily betray them.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine(
				"Guards, take her away. I believe I know someone who is much more deserving of her place on the Tribunal.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			), //fade to black, credits roll, game ends
		];
		// 70%+ collectibles gathered (good ending)
		this.goodendinglines = [
			new DialogueLine(
				"Look at all of this! Conclusive proof that Ximara is the owner of that horrific workshop, not me, and that she is behind everything happening in Calchara!",
				LARAYA_PORTRAITS.ANGRY
			),
			new DialogueLine(
				"Very impressive, Laraya. The other Tribunal members and I agree that this is conclusive proof. Ximara, what do you have to say for yourself?",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine(
				"Foolish girl! My research was going so well before you messed everything up!",
				XIMARA_PORTRAITS.NEUTRAL,
				"Ximara"
			),
			new DialogueLine(
				"We are Asu, the most intelligent life on the planet, and we should act as such!",
				XIMARA_PORTRAITS.NEUTRAL,
				"Ximara"
			),
			new DialogueLine(
				"Well then. Ximara, you are hereby removed from the Tribunal. Guards, take her away.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine(
				"Thank you, Laraya, for uncovering the truth. Your banishment is lifted and you will find your room unchanged. Welcome home.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			), //fade to black, credits roll, game ends
		];
		// 40%+ collectibles gathered (mediocre ending)
		this.okayendinglines = [
			new DialogueLine(
				"Look at this! Solid proof that Ximara is the owner of that horrific workshop, not me! It's all her fault!",
				LARAYA_PORTRAITS.ANGRY
			),
			new DialogueLine(
				"There is a lot here, Laraya, but unfortunately this Tribunal cannot determine who is at fault right now.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine(
				"To ensure fairness for all parties, you shall both be imprisoned until our investigation uncovers a definite culprit. Ximara, do you have anything to say",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine(
				"I think this is a pitiful last-ditch attempt at Laraya's salvation, but I will play along.",
				XIMARA_PORTRAITS.NEUTRAL,
				"Ximara"
			),
			new DialogueLine(
				"I have no idea what she is talking about, and you will find nothing in your search.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine("Then it is decided. Guards, take them away.", MARALAN_PORTRAITS.NEUTRAL, "Maralan"), //fade to black, credits roll, game ends
		];
		// 0%+ collectibles gathered (bad ending)
		this.badendinglines = [
			new DialogueLine(
				"Look at this! Ximara owns that workshop, not me! It's all her fault! I didn't do anything wrong!",
				LARAYA_PORTRAITS.ANGRY
			),
			new DialogueLine(
				"I'm sorry, Laraya, but there is not enough here to indicate that Ximara is at fault for anything you have described. This means your banishment is still in effect.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine("Ximara, do you have anything you want to add?", MARALAN_PORTRAITS.NEUTRAL, "Maralan"),
			new DialogueLine(
				"I am only sorry Laraya thought unfounded accusations against me would help prove her innocence.",
				XIMARA_PORTRAITS.NEUTRAL,
				"Ximara"
			),
			new DialogueLine(
				"However, since she seems unable to take her punishment nobly, I feel the only way to ensure no one else is falsely accused is to take her wand... permanently this time.",
				XIMARA_PORTRAITS.NEUTRAL,
				"Ximara"
			),
			new DialogueLine("Unfortunately, Ximara, I agree with you.", MARALAN_PORTRAITS.NEUTRAL, "Maralan"),
			new DialogueLine(
				"Laraya, Asu sorceress of Calchara, you are once again banished from Ishana and its surrounding lands from now until evermore.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine(
				"Guards, bring her wand to me and escort her to the border.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			), //fade to black, credits roll, game ends
		];

		this.dialogue_lines = [
			new DialogueLine(
				"I demand an audience with the Tribunal! I bring with me evidence to confirm my innocence and declare the true law-breaker... Ximara!",
				LARAYA_PORTRAITS.ANGRY
			),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to ending shot 2
			new DialogueLine("Guards, at ease. Ximara, calm yourself.", MARALAN_PORTRAITS.NEUTRAL, "Maralan"),
			new DialogueLine(
				"Speak, Laraya. Tell us what you have found, but know that we are not easily convinced.",
				MARALAN_PORTRAITS.NEUTRAL,
				"Maralan"
			),
			new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to ending shot 3 and segue into appropriate ending
		];

		var data = $engine.getEngineGlobalData().myVar;
		// total number of artifacts is 33-35
		if (data >= 33) {
			this.dialogue_lines = this.dialogue_lines.concat(this.hundredpercentlines); // 100
		} else if (data > 23) {
			this.dialogue_lines = this.dialogue_lines.concat(this.goodendinglines); // 70
		} else if (data > 13) {
			this.dialogue_lines = this.dialogue_lines.concat(this.okayendinglines); // 40
		} else {
			this.dialogue_lines = this.dialogue_lines.concat(this.badendinglines); // 0
		}

		this.audioSound = "GameEndCutScene";
		this.cutsceneFrames = ["gameendcutsceneframe1", "gameendcutsceneframe2", "gameendcutsceneframe3"];
		this.nextRoom = "Credits";
	}

	dialogueEnd() {}

	step() {
		super.step();
	}

	draw() {
		super.draw();
	}
}
