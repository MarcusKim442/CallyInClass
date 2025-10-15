class Dialogue extends EngineInstance {
  // Swap Engine Instance with SoildObject if you want collision
  onEngineCreate(lines, pause_level = false) {
    // Dialogue
    this.portrait_angry = $engine.getTexture("dial_laraya_angry");
    this.portrait_hurt = $engine.getTexture("dial_laraya_hurt");
    this.portrait_happy = $engine.getTexture("dial_laraya_happy");
    this.portrait_scared = $engine.getTexture("dial_laraya_scared");
    this.portrait_surprised = $engine.getTexture("dial_laraya_surprised");
    this.portrait_textures = [];
    this.portrait_textures[LARAYA_PORTRAITS.HAPPY] = this.portrait_happy;
    this.portrait_textures[LARAYA_PORTRAITS.ANGRY] = this.portrait_angry;
    this.portrait_textures[LARAYA_PORTRAITS.HURT] = this.portrait_hurt;
    this.portrait_textures[LARAYA_PORTRAITS.SCARED] = this.portrait_scared;
    this.portrait_textures[LARAYA_PORTRAITS.SURPRISED] =
      this.portrait_surprised;

    // Non-laraya's
    this.portrait_textures[XIMARA_PORTRAITS.NEUTRAL] =
      $engine.getTexture("dial_ximara");
    this.portrait_textures[MARALAN_PORTRAITS.NEUTRAL] =
      $engine.getTexture("dial_maralan");
    this.portrait_textures[FLICKOW_PORTRAITS.NEUTRAL] =
      $engine.getTexture("dial_flickow");
    this.portrait_textures[AXODILE_PORTRAITS.HAPPY] =
      $engine.getTexture("dial_axodile_happy");
    this.portrait_textures[AXODILE_PORTRAITS.HURT] =
      $engine.getTexture("dial_axodile_hurt");
    this.portrait_textures[ELDER_PORTRAITS.NEUTRAL] =
      $engine.getTexture("dial_elder");
    this.portrait_textures[TUTORIAL_PORTRAITS.MOUSE] =
      $engine.getTexture("dial_mouse");
    this.portrait_textures[TUTORIAL_PORTRAITS.SPACE] =
      $engine.getTexture("dial_space");
    this.portrait_textures[TUTORIAL_PORTRAITS.Z] =
      $engine.getTexture("dial_z");
    this.portrait_textures[TUTORIAL_PORTRAITS.QE] =
      $engine.getTexture("dial_qe");
    this.portrait_textures[TUTORIAL_PORTRAITS.WASD] =
      $engine.getTexture("dial_wasd");

    this.dialogue = $engine.createManagedRenderable(this, new PIXI.Container());
    this.dialogue_sprite = $engine.createManagedRenderable(
      this,
      new PIXI.Sprite($engine.getTexture("dial_box"))
    );
    this.dialogue_portrait = $engine.createManagedRenderable(
      this,
      new PIXI.Sprite(this.portrait_angry)
    );
    this.dialogue_char_name = $engine.createManagedRenderable(
      this,
      new PIXI.Text("Laraya", { ...$engine.getDefaultTextStyle() })
    );
    // {
    // 	fontFamily : 'Arial',
    // 	fontSize: 40,
    // 	fill : 0x000000,
    // 	align : 'center',
    // }));
    this.dialogue_text = $engine.createManagedRenderable(
      this,
      new PIXI.Text("Laraya", {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0x000000,
        align: "left",
        wordWrap: true,
        wordWrapWidth: 500,
      })
    );
    this.dialogue_z_continue = $engine.createManagedRenderable(
      this,
      new PIXI.Text("Press 'Z' to continue", {
        ...$engine.getDefaultTextStyle(),
      })
    );
    this.dialogue.addChild(this.dialogue_sprite);
    this.dialogue.addChild(this.dialogue_portrait);
    this.dialogue.addChild(this.dialogue_char_name);
    this.dialogue.addChild(this.dialogue_text);
    this.dialogue.addChild(this.dialogue_z_continue);

    // The BOX
    const w = 18;
    this.dialogue_sprite.scale.set(w, 5);
    // this.dialogue_sprite.scale.set(2.7, 3.5);
    this.dialogue_sprite.x = (1008 - w * 48) / 2;
    this.dialogue_sprite.y = 48 * 11;

    // The FACE
    const scale = 0.22;
    this.dialogue_portrait.scale.set(scale, scale);
    this.dialogue_portrait.x = this.dialogue_sprite.x - 100;
    this.dialogue_portrait.y = this.dialogue_sprite.y - 160;

    // Char Name
    this.dialogue_char_name.x = this.dialogue_sprite.x + 300;
    this.dialogue_char_name.y = this.dialogue_sprite.y + 15;

    // Dialogue text
    this.dialogue_text.x = this.dialogue_sprite.x + 330;
    this.dialogue_text.y = this.dialogue_sprite.y + 65;

    // Press Z to Continue
    this.dialogue_z_continue.x = this.dialogue_sprite.x + 530;
    this.dialogue_z_continue.y = this.dialogue_sprite.y + 200;
    this.dial_z_adj_filter = new PIXI.filters.AdjustmentFilter();
    this.dial_z_adj_filter.alpha = 0;
    this.dialogue_z_continue.filters = [this.dial_z_adj_filter];

    // Params
    this.time_per_char = 2;
    this.timer = 0;
    this.filter_timer = 0;

    // Conversation
    this.lines = lines;
    // [
    // 	new DialogueLine("Hey! Why are you me!? You look evil, though.", this.portrait_angry),
    // 	new DialogueLine("Press W to jump, and press Q and E to swap between spells:", this.portrait_surprised),
    // 	new DialogueLine("Click on the screen while using FIRE to shoot a fireball,", this.portrait_scared),
    // 	new DialogueLine("Walk on water by freezing it while using WATER,", this.portrait_angry),
    // 	new DialogueLine("Hold toward a wall while using EARTH to slide down and jump off of it,", this.portrait_happy),
    // 	new DialogueLine("And finally, jump while airborne using AIR to double jump!", this.portrait_surprised),
    // 	new DialogueLine("Ack... too many instructions!", this.portrait_hurt),
    // ];
    // this.dialogue_text = this.lines[0].text;
    this.dialogue_portrait.texture =
      this.portrait_textures[this.lines[0].image];

    this.line_on = 0;
    this.first_frame = true;

    if (pause_level) {
      this.pause_level = true;
      $engine.pauseGameSpecial(this);
    }
  }

  onCreate(x, y, lines, pause_level = false, func = null) {
    this.onEngineCreate(lines, pause_level);
    this.callback = func;
    this.x = x;
    this.y = y;
    // do stuff
  }

  step() {
    this.filter_timer++;
    if (this.first_frame) {
      this.first_frame = false;
    } else {
      if (this.timer !== -1) {
        this.timer++;
        this.dialogue_text.text = this.lines[this.line_on].text.substr(
          0,
          this.timer / this.time_per_char
        );
        if (IN.keyCheckPressed("KeyZ")) {
          this.timer = -1;
          $engine.audioStopSound("DialogueSoundEffect");
        }
        if (
          this.timer / this.time_per_char >
          this.lines[this.line_on].text.length
        ) {
          this.timer = -1;
          $engine.audioStopSound("DialogueSoundEffect");
        }
      } else {
        this.dialogue_text.text = this.lines[this.line_on].text;
        if (IN.keyCheckPressed("KeyZ")) {
          // Change to next slide
          if (this.line_on === this.lines.length - 1) {
            // Dialogue ends
            this.dialogueEnd();
          } else {
            this.filter_timer = 0;
            this.dial_z_adj_filter.alpha = 0;
            this.timer = 0;
            this.line_on++;
            if (
              this.lines[this.line_on].text ===
              DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE
            ) {
              // Switch to the next image in the cutscene
              var cutscene = Cutscene.first;
              cutscene.nextImage();

              this.dialogue.visible = false;
              // this.line_on++;
            } else {
              this.dialogue.visible = true;
              $engine.audioPlaySound("DialogueSoundEffect", 0.07, true);
            }
            this.dialogue_portrait.texture =
              this.portrait_textures[this.lines[this.line_on].image];
            this.dialogue_char_name.text = this.lines[this.line_on].name;
            this.dialogue_text.text = "";
          }
        }
      }
    }
    const wait_time = 120;
    const loop_time = 20;
    if (this.filter_timer > wait_time) {
      this.dial_z_adj_filter.alpha = Math.sin(
        (this.filter_timer - wait_time) / loop_time
      );
    }
  }

  draw(gui, camera) {
    $engine.requestRenderOnGUI(this.dialogue);
  }

  dialogueEnd() {
    if (this.pause_level) {
      $engine.unpauseGameSpecial();
    }
    if (this.callback) {
      this.callback();
    }
    this.destroy();
  }
}

class DialogueLine {
  constructor(text, image, name = "Laraya") {
    this.text = text;
    this.image = image; //Integer, e.g. LARAYA_PORTRAITS.HAPPY
    this.name = name;
  }
}

/*

// ----------   INTRO CUTSCENE DIALOGUE LINES   ----------

	this.introlines = [
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //should be intro shot 1 here
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 2
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to intro shot 3
		new DialogueLine("And what have we here? Guards!", XIMARA_PORTRAITS.NEUTRAL), //happens in intro shot 3
		new DialogueLine("This sorceress has been experimenting on rare species! Look at all of this! Scales and feathers and fur!", XIMARA_PORTRAITS.NEUTRAL),
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to next shot (intro shot 4) here
		new DialogueLine("Laraya, Asu sorceress of Calchara, for crimes against this Tribunal you are hereby banished from the city of Ishana.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("From now until evermore, you shall be unwelcome in Ishana and all its surrounding lands.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("But I didn't even do anything wr-", LARAYA_PORTRAITS.SCARED),
		new DialogueLine("Silence. Maralan, remember the rest.", XIMARA_PORTRAITS.NEUTRAL),
		new DialogueLine("Of course. Furthermore, in accordance with our most sacred laws, your wand must be snapped.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("Your banishment begins today. Give me your wand." , MARALAN_PORTRAITS.NEUTRAL), 
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to next shot (intro shot 5) here
		new DialogueLine("But I need my stuff! Everything I own is here!", LARAYA_PORTRAITS.SURPRISED),
		new DialogueLine("Your wand, Laraya.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("You're making a mistake. I didn't - oof!", LARAYA_PORTRAITS.SURPRISED), 
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to next shot (intro shot 6) here
	];


// ----------   JUNGLE/TUTORIAL/LEVEL 1 DIALOGUE LINES   ----------

	this.junglelines = [
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //should be jungle shot 1
		new DialogueLine("Aaaaaaaaaaaaaahhh!", LARAYA_PORTRAITS.SCARED), //happens in jungle shot 1, then cutscene ends
		new DialogueLine("Ouch! That hurt.", LARAYA_PORTRAITS.HURT), //tutorial info appears on screen (different black dialogue box?), keys to move left, right, jump, and talk to NPC's
		new DialogueLine("Alright then. Now all I need to do is find the pieces of my wand and portal back home! Once I know how to prove my innocence, I suppose…", LARAYA_PORTRAITS.HAPPY),
		new DialogueLine("I didn't even break that law, the Tribunal knows that! Why would they do this?", LARAYA_PORTRAITS.ANGRY),
		new DialogueLine("I've lived at the Spire my whole life, the Tribunal knows I didn't do it!", LARAYA_PORTRAITS.ANGRY),
		new DialogueLine("Hang on, what's over there? Something's glowing!", LARAYA_PORTRAITS.HAPPY), //fire wand piece is on the ground, nowhere else to go but interact with it. Lore appears on screen (see LORE section of dialogue) when clicked
		new DialogueLine("One step closer to getting home! Once my wand is complete, I can make a portal and go back!", LARAYA_PORTRAITS.HAPPY), //tutorial obstacle, then she goes in the cave
	];


// ----------   CAVE/LEVEL 2 DIALOGUE LINES   ----------

	this.cavelines = [
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //should be cave shot 1
		new DialogueLine("Would you look at that! There was a point coming down here after all!", LARAYA_PORTRAITS.HAPPY),
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to cave shot 2
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to cave shot 3
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to cave shot 4
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to cave shot 5
		new DialogueLine("Oh no! Maybe this cave is going to be less helpful than I thought…", LARAYA_PORTRAITS.SCARED), //happens in cave shot 5, then cutscene ends
		new DialogueLine("Well, if I leave them alone, they'll leave me alone. Right?", LARAYA_PORTRAITS.SCARED),
		new DialogueLine("“I think I remember now. They're lazy and don't like to move much, but they'll definitely move if something comes and disturbs them.", LARAYA_PORTRAITS.SCARED),
		new DialogueLine("Which, in this case, would be me…", LARAYA_PORTRAITS.SCARED),
	];


// ----------   TREES/LEVEL 3 DIALOGUE LINES   ----------

	this.treeslines = [
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //should be trees shot 1
		new DialogueLine("Where am I? Woah! The ground is really, really far away! That's probably not good!", LARAYA_PORTRAITS.SURPRISED), //happens in trees shot 1
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to trees shot 2
		new DialogueLine("Wow! A flickow! It's gorgeous! I've read that they like collecting things, maybe it's picked up a part of my wand?", LARAYA_PORTRAITS.HAPPY), //happens in trees shot 2, then cutscene ends
		new DialogueLine("I can't believe I'm seeing a flickow for real! What do you say, buddy, can I have it?", LARAYA_PORTRAITS.HAPPY), //triggers when player is close to nest/flickow sprite?
		new DialogueLine("I promise not to touch anything else, I know how defensive you can get about your nest!", LARAYA_PORTRAITS.HAPPY),
		new DialogueLine("Chirp!", FLICKOW_PORTRAITS.NEUTRAL),
		new DialogueLine("How about I give you this stick instead? It's a lot better, wouldn't you say?", LARAYA_PORTRAITS.HAPPY),
		new DialogueLine("Chirp! Chirp!", FLICKOW_PORTRAITS.NEUTRAL),
		new DialogueLine("You've got yourself a deal, little guy! I get my wand piece, and you get these two sticks!", LARAYA_PORTRAITS.HAPPY),
		new DialogueLine("Chirp! Chirp! Tweet!", FLICKOW_PORTRAITS.NEUTRAL), //interact with water wand piece, lore (from LORE section) appears on screen
	];


// ----------   SWAMP/LEVEL 4 DIALOGUE LINES   ----------

	this.swamplines = [
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //should be swamp shot 1
		new DialogueLine("This place doesn't look very friendly…", LARAYA_PORTRAITS.HAPPY), //happens in swamp shot 1
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to swamp shot 2
		new DialogueLine("Ah! What was that! Who goes there! Show yourself!", LARAYA_PORTRAITS.SCARED), //need audio to occur just before this in swamp shot 2
		new DialogueLine("Well, just please don't eat my hand!", LARAYA_PORTRAITS.SCARED), 
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to swamp shot 3
		new DialogueLine("Oh! An axodile! Out of the water? And injured? What happened to you?", LARAYA_PORTRAITS.SURPRISED), //cutscene ends
		new DialogueLine("I've read about your kind, buddy, and I think I know how to help! You can regenerate naturally, but you need to be in water for that.", LARAYA_PORTRAITS.HAPPY),
		new DialogueLine("So all I have to do is get you into that pool over there, and you'll be right as rain… theoretically.", LARAYA_PORTRAITS.HAPPY),
		new DialogueLine("The books I've read say it's just a myth, but I hope for your sake it's not.", LARAYA_PORTRAITS.HAPPY),
		new DialogueLine("Raaaar!", AXODILE_PORTRAITS.HAPPY),
		new DialogueLine("What's all this? Scale fragments… Drag marks… Cleanly cut rope bindings… And an Asu tool someone left behind!", LARAYA_PORTRAITS.SURPRISED),
		new DialogueLine("Argh! Someone did this on purpose, and tried to make it look like an accident if anyone came by! But who… Ximara!", LARAYA_PORTRAITS.ANGRY),
		new DialogueLine("Grrrr… I saw these scales in her despicable workshop.", LARAYA_PORTRAITS.ANGRY),
	];


// ----------   MUSHROOM VILLAGE CUTSCENE DIALOGUE LINES   ----------

	this.villagelines = [
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //should be village shot 1
		new DialogueLine("Wow! This is beautiful! This must be a Dwargin village, I've seen signs of them nearby. Is anyone home?", LARAYA_PORTRAITS.HAPPY), //happens in village shot 1
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to village shot 2
		new DialogueLine("Ahh! Calm down, everyone, I mean you no harm! What's going on? I haven't done anything wrong!", LARAYA_PORTRAITS.SCARED),
		new DialogueLine("Evil Asu sorceress is not welcome here. Leave!"), //villagers speaking, no portrait
		new DialogueLine("What? Evil? I'm not evil, why would you…", LARAYA_PORTRAITS.SURPRISED),
		new DialogueLine("Ximara. You have to understand, I'm not her!", LARAYA_PORTRAITS.SURPRISED),
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to village shot 3
		new DialogueLine("The sorceress speaks the truth. You must relax."), //elder speaking, portrait added for gold release?
		new DialogueLine("She is not the one we fear, and I sense she may be on our side."), //elder speaking, portrait added for gold release?
		new DialogueLine("Thank you, Elder. You speak true, for I am in search of ways to bring down her evil.", LARAYA_PORTRAITS.HAPPY),
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to village shot 4
		new DialogueLine("In that case, you may be needing this. Do not let her actions go unanswered."), //elder speaking, portrait added for gold release?
		new DialogueLine("Thank you, Elder. With this, I can finally get back to the Spire and make them see the truth.", LARAYA_PORTRAITS.HAPPY),
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to village shot 5
	];


// ----------   ENDING CUTSCENE DIALOGUE LINES   ----------

	this.allendingstarts = [
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //should be ending shot 1
		new DialogueLine("I demand an audience with the Tribunal! I bring with me evidence to confirm my innocence and declare the true law-breaker... Ximara!", LARAYA_PORTRAITS.ANGRY),
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to ending shot 2
		new DialogueLine("Guards, at ease. Ximara, calm yourself.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("Speak, Laraya. Tell us what you have found, but know that we are not easily convinced.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine(DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE), //cut to ending shot 3, segue into appropriate ending
	];

// 100% collectibles gathered ending
	this.hundredpercentlines = [
		new DialogueLine("Look at all of this! Conclusive proof that Ximara is the owner of that horrific workshop, not me, and that she is behind everything happening to the beings on Calchara!", LARAYA_PORTRAITS.ANGRY),
		new DialogueLine("Outstanding, Laraya! This is everything you could have possibly found to prove yourself innocent and show us Ximara's true nature! Ximara, do you have any last words?", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("Foolish girl! You should not have dared to spy on me, and banishment is what you deserved!", XIMARA_PORTRAITS.NEUTRAL),
		new DialogueLine("The animals on Calchara are more valuable as objects than beings. I was making huge strides in my research until you came medding!", XIMARA_PORTRAITS.NEUTRAL),
		new DialogueLine("We are Asu! We are the most intelligent life on this planet and should act as such!", XIMARA_PORTRAITS.NEUTRAL),
		new DialogueLine("Ximara, you are hereby removed from the Tribunal and shall be sentenced to prison for the remainder of your lifetime.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("I am truly appalled that someone I worked so closely with to form laws for the preservation of Calcharan beings would so easily betray them.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("Guards, take her away. I believe I know someone who is much more deserving of her place on the Tribunal", MARALAN_PORTRAITS.NEUTRAL), //fade to black, credits roll, game ends
	];

// 70%+ collectibles gathered (good ending)
	this.goodendinglines = [
		new DialogueLine("Look at all of this! Conclusive proof that Ximara is the owner of that horrific workshop, not me, and that she is behind everything happening in Calchara!", LARAYA_PORTRAITS.ANGRY),
		new DialogueLine("Very impressive, Laraya. The other Tribunal members and I agree that this is conclusive proof. Ximara, what do you have to say for yourself?", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("Foolish girl! My research was going so well before you messed everything up!", XIMARA_PORTRAITS.NEUTRAL),
		new DialogueLine("We are Asu, the most intelligent life on the planet, and we should act as such!", XIMARA_PORTRAITS.NEUTRAL),
		new DialogueLine("Well then. Ximara, you are hereby removed from the Tribunal. Guards, take her away.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("Thank you, Laraya, for uncovering the truth. Your banishment is lifted and you will find your room unchanged. Welcome home.", MARALAN_PORTRAITS.NEUTRAL), //fade to black, credits roll, game ends
	];

// 40%+ collectibles gathered (mediocre ending)
	this.okayendinglines = [
		new DialogueLine("Look at this! Solid proof that Ximara is the owner of that horrific workshop, not me! It's all her fault!", LARAYA_PORTRAITS.ANGRY),
		new DialogueLine("There is a lot here, Laraya, but unfortunately this Tribunal cannot determine who is at fault right now.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("To ensure fairness for all parties, you shall both be imprisoned until our investigation uncovers a definite culprit. Ximara, do you have anything to say", XIMARA_PORTRAITS.NEUTRAL),
		new DialogueLine("I think this is a pitiful last-ditch attempt at Laraya's salvation, but I will play along.", XIMARA_PORTRAITS.NEUTRAL),
		new DialogueLine("I have no idea what she is talking about, and you will find nothing in your search.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("Then it is decided. Guards, take them away.", MARALAN_PORTRAITS.NEUTRAL), //fade to black, credits roll, game ends
	];

// 0%+ collectibles gathered (bad ending)
	this.badendinglines = [
		new DialogueLine("Look at this! Ximara owns that workshop, not me! It's all her fault! I didn't do anything wrong!", LARAYA_PORTRAITS.ANGRY),
		new DialogueLine("I'm sorry, Laraya, but there is not enough here to indicate that Ximara is at fault for anything you have described. This means your banishment is still in effect.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("Ximara, do you have anything you want to add?", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("I am only sorry Laraya thought unfounded accusations against me would help prove her innocence.", XIMARA_PORTRAITS.NEUTRAL),
		new DialogueLine("However, since she seems unable to take her punishment nobly, I feel the only way to ensure no one else is falsely accused is to take her wand... permanently this time.", XIMARA_PORTRAITS.NEUTRAL),
		new DialogueLine("Unfortunately, Ximara, I agree with you.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("Laraya, Asu sorceress of Calchara, you are once again banished from Ishana and its surrounding lands from now until evermore.", MARALAN_PORTRAITS.NEUTRAL),
		new DialogueLine("Guards, bring her wand to me and escort her to the border.", MARALAN_PORTRAITS.NEUTRAL), //fade to black, credits roll, game ends
	];


// EVIDENCE/ARTIFACTS/COLLECTIBLES/GLOWY ORBS POPUP DIALOGUE (JUNGLE)
	

	this.jungleevidence = [
		new DialogueLine("Long, narrow footsteps lie here, likely Asu. The measured and unhurried gait conveys a sinister message."),
	];


// EVIDENCE/ARTIFACTS/COLLECTIBLES/GLOWY ORBS POPUP DIALOGUE (CAVE)
	this.caveevidence = [
		new DialogueLine("Long, narrow footsteps lie here, likely Asu. The measured and unhurried gait conveys a sinister message."),
		new DialogueLine("A pair of scissors lie discarded in the dust, fragments of red scale scattered around the heavy, sharp Asu blades."),
		new DialogueLine("These are drag marks from something that didn't want to leave its home.")
		// random rotation upon getting a collectible to determine which will show
	];


// EVIDENCE/ARTIFACTS/COLLECTIBLES/GLOWY ORBS POPUP DIALOGUE (TREES)
	this.treesevidence = [
		new DialogueLine("Long, narrow footsteps lie here, likely Asu. The measured and unhurried gait conveys a sinister message."),
		new DialogueLine("A flickow feather is suspended in the foliage. A flickow would never willingly leave a feather so close to their nest."),
		new DialogueLine("A length of rope manufactured in Ishana is caught on a branch, roughly cut edges where the bindings were broken."),
		new DialogueLine("A chunk of fur is caught on the branch, its mottled nature painting it as Leota fur. Leotas are sure-footed in all terrain, this was not caused by a simple misstep."),
	];


// EVIDENCE/ARTIFACTS/COLLECTIBLES/GLOWY ORBS POPUP DIALOGUE (SWAMP)
	this.swampevidence = [
		new DialogueLine("Long, narrow footsteps lie here, likely Asu. The measured and unhurried gait conveys a sinister message."),
		new DialogueLine("Wide, stunted footsteps lie here, likely Dwargin. Large paces and scuffs in the dirt show that they were running, something a Dwargin would never do if given the option."),
		new DialogueLine("A knife lies on the ground, its long and slender blade coated in dried blood. This design is favoured by Asu sorcerers."),
		new DialogueLine("A flickow feather gathers dust on the ground. Flickows never leave feathers behind, meaning it had no choice."),
		new DialogueLine("Shards of blue-green scales are strewn throughout the area. Axodiles lose whole scales at a time, and usually in the water, meaning this was a maleficent occurrence."),
	];


// WAND PIECE GATHERED - FIRE
	this.fireelement = [
		new DialogueLine("This element is fierce. The user can throw fireballs to kill enemies, burn plant life, and melt ice.")
	];


// WAND PIECE GATHERED - FIRE
	this.earthelement = [
		new DialogueLine("This element is brutal. It allows the user to throw boulders for both squishing and scaling, and walls become soft so the user can grip and jump off of them - for a time.")
	];


// WAND PIECE GATHERED - WATER
	this.waterelement = [
		new DialogueLine("This element is flexible. It allows the user to freeze water on touch, and summon a wave that sweeps them forwards at fast speeds.")
	];

// WAND PIECE GATHERED - AIR
	this.airelement = [
		new DialogueLine("This element is temperamental. It can move objects upwards and lessen the effects of gravity with strong gusts, and allow the user to jump again in midair as if on a cloud.")
	];


//ALL ENEMIES ENCOUNTED IN THE GAME, DIALOGUE SHOULD APPEAR THE FIRST TIME THEY ARE ON SCREEN

// ENEMY ENCOUNTERED - RED COMPRIMIA
	this.redcomprimia = [
		new DialogueLine("Small beings with sharp teeth and talons that have evolved to live underground.")
	];


// ENEMY ENCOUNTERED - GREEN COMPRIMIA
	this.greencomprimia = [
		new DialogueLine("Small beings with sharp teeth and talons that have evolved to easily scale trees.")
	];


// ENEMY ENCOUNTERED - PURPLE COMPRIMIA
	this.purplecomprimia = [
		new DialogueLine("Small beings with sharp teeth and talons that have evolved to live in wetland ecosystems.")
	];


// FRIENDLY ENCOUNTERED - FLICKOW
	this.flickow = [
		new DialogueLine("Friendly, rare birds with glow-tipped feathers that live in tall trees.")
	];


// FRIENDLY ENCOUNTERED - AXODILE
	this.axodile = [
		new DialogueLine("Friendly, midsize reptiles that can survive on land for a time, but prefer long periods underwater")
	];

*/

class LARAYA_PORTRAITS {}
LARAYA_PORTRAITS.HAPPY = "laraya_happy";
LARAYA_PORTRAITS.ANGRY = "laraya_angry";
LARAYA_PORTRAITS.SURPRISED = "laraya_surprised";
LARAYA_PORTRAITS.SCARED = "laraya_scared";
LARAYA_PORTRAITS.HURT = "laraya_hurt";

class XIMARA_PORTRAITS {}
XIMARA_PORTRAITS.NEUTRAL = "ximara";

class MARALAN_PORTRAITS {}
MARALAN_PORTRAITS.NEUTRAL = "maralan";

class FLICKOW_PORTRAITS {}
FLICKOW_PORTRAITS.NEUTRAL = "flickow";

class AXODILE_PORTRAITS {}
AXODILE_PORTRAITS.HAPPY = "axodile_happy";
AXODILE_PORTRAITS.HURT = "axodile_hurt";

class ELDER_PORTRAITS {}
ELDER_PORTRAITS.NEUTRAL = "elder";

class TUTORIAL_PORTRAITS {}
TUTORIAL_PORTRAITS.MOUSE = "mouse";
TUTORIAL_PORTRAITS.SPACE = "space";
TUTORIAL_PORTRAITS.Z = "z";
TUTORIAL_PORTRAITS.QE = "qe";
TUTORIAL_PORTRAITS.WASD = "wasd";

class DIALOGUE_COMMANDS {}
DIALOGUE_COMMANDS.NEXT_CUTSCENE_IMAGE = "COMMAND_NEXT_CUTSCENE_IMAGE";
