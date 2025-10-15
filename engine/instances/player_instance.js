class PlayerInstance extends EngineInstance {
	onEngineCreate() {
		// Gameplay vars
		this.ground_accel = 0.5;
		this.jump_height = 15;
		this.gravity = 0.8;
		this.default_gravity = this.gravity;
		this.water_gravity = 0.12;
		this.max_run_speed = 5;
		this.decel_coeff = 0.8;
		this.decel_coeff_air = 0.98;
		this.decel_const = 0.1;

		this.snap_distance = 8;
		this.snap_move_factor = 0.5;
		this.allowSnapDown = false;
		this.allowSnapLeft = false;
		this.allowSnapRight = false;
		this.allowSnapUp = false;
		this.snap_enabled = false;

		// Player vars
		this.inside_water = false;
		this.player_health = 100;
		this.spr_width = 50;
		this.spr_height = 80;
		this.state_timer = 0;
		this.state = PLAYERSTATES.GROUNDED;
		this.state_funcs = {
			[PLAYERSTATES.DEVMODE]: {
				enter: this.enterGrounded.bind(this),
				step: this.stepDevmode.bind(this),
				exit: this.exitGrounded.bind(this),
			},
			[PLAYERSTATES.GROUNDED]: {
				enter: this.enterGrounded.bind(this),
				step: this.stepGrounded.bind(this),
				exit: this.exitGrounded.bind(this),
			},
			[PLAYERSTATES.AIRBORNE]: {
				enter: this.enterAirborne.bind(this),
				step: this.stepAirborne.bind(this),
				exit: this.exitAirborne.bind(this),
			},
			[PLAYERSTATES.INACTIVE]: {
				enter: this.enterInactive.bind(this),
				step: this.stepInactive.bind(this),
				exit: this.exitInactive.bind(this),
			},
			[PLAYERSTATES.WALLCLING]: {
				enter: this.enterWallCling.bind(this),
				step: this.stepWallCling.bind(this),
				exit: this.exitWallCling.bind(this),
			},
			[PLAYERSTATES.WATERDASH]: {
				enter: this.enterWaterDash.bind(this),
				step: this.stepWaterDash.bind(this),
				exit: this.exitWaterDash.bind(this),
			},
			[PLAYERSTATES.UNDERWATER]: {
				enter: this.enterUnderwater.bind(this),
				step: this.stepUnderwater.bind(this),
				exit: this.exitUnderwater.bind(this),
			},
			[PLAYERSTATES.DEATH]: {
				enter: this.enterDeath.bind(this),
				step: this.stepDeath.bind(this),
				exit: this.exitDeath.bind(this),
			},
		};
		this.vsp = 0;
		this.hsp = 0;
		this.facing = 1;
		this.has_doubleJump = true;
		this.has_waterdash = true;
		this.spells_learned = 0;
		this.current_spell = SPELLNAMES.FIRE;
		this.face_direction = 1;

		this.levelHandler = LevelHandler.first;

		this.animation_running = $engine.getAnimation("player_runanimation");
		this.animation_standing = [$engine.getTexture("baby2")];
		this.animation_jumping_up = [$engine.getTexture("jumping_up")];
		this.animation_jumping_down = [$engine.getTexture("jumping_down")];
		this.animation_wallcling = [$engine.getTexture("player_wallcling")];
		this.animation_death = [$engine.getTexture("player_death")];
		this.animation_nothing = [$engine.getTexture("nothing")];

		this.mainHitbox = new Hitbox(this, new RectangleHitbox(-20, 34 * -2, 20, 0));
		this.iceHitbox = new Hitbox(this, new RectangleHitbox(-25, 36 * -2, 25, 4));

		// this.setSprite(new PIXI.Sprite($engine.getTexture("default")));
		this.setHitbox(this.mainHitbox);
		this.animation = $engine.createRenderable(this, new PIXI.extras.AnimatedSprite(this.animation_standing), false);
		// this.spr_scale = 1.2;
		this.spr_scale = 2;
		this.animation.scale.set(this.spr_scale, this.spr_scale);
		// this.getSprite().anchor.y = 1;
		this.animation.anchor.y = 1;
		this.animation.animationSpeed = 0.1;

		this.fire_cooldown = 60;
		this.fire_cooldown_timer = 0;

		this.wind_cooldown = 300;
		this.wind_cooldown_timer = 0;

		this.rock_spell_count = 0;
		this.rock_spell_array = [];

		this.wall_jumped_times = 0;

		this.saveX = this.x;
		this.saveY = this.y;

		// Marcus cool code!!!!!!!!!!!!!!!!!!!!!!!!!
		// this.filter = new PIXI.filters.BlurFilter();
		// this.spr.filters = [this.filter];
	}

	onCreate(x, y) {
		this.onEngineCreate();
		this.x = x;
		this.y = y;
		// do stuff
	}

	step() {
		// Get controls
		this.jumped = IN.keyCheckPressed("KeyW") || IN.keyCheckPressed("Space");

		// Check for collision with the wand piece
		var wand_piece = IM.instancePlace(this, this.x, this.y, WandPiece);
		if (wand_piece !== undefined) {
			this.spells_learned++;

			// Change the sprite
			if (this.spells_learned === 4) {
				this.levelHandler.spellWheel_sprite.texture = $engine.getTexture("spellwheel");
			} else {
				this.levelHandler.spellWheel_sprite.texture = $engine.getTexture("spellwheel" + this.spells_learned);
			}

			// Wand Piece Collection Sound Effect
			$engine.audioPlaySound("ArtifactCollectibleSoundEffect", 0.07, false);

			this.levelHandler.wand_piece_collected = true;
		}

		if (this.player_health <= 0 && this.state !== PLAYERSTATES.DEATH) {
			// this.getCamera().reset();
			// this.getCamera().__roomChange();
			// this.setTimescale(1);
			// $engine.set
			this.switchState(PLAYERSTATES.DEATH);

			// this.x = this.saveX;
			// this.y = this.saveY;
			this.player_health = 100;
			// $engine.pauseGameSpecial(this);
			// $engine.setRoom(RoomManager.currentRoom().name);
		}
		//DEVMODE
		// if (IN.keyCheckPressed("Slash")) {
		// 	if (this.state === PLAYERSTATES.DEVMODE) {
		// 		this.switchState(PLAYERSTATES.AIRBORNE);
		// 	} else {
		// 		this.switchState(PLAYERSTATES.DEVMODE);
		// 	}
		// }

		this.fire_cooldown_timer--;
		this.wind_cooldown_timer--;
		if (IN.mouseCheckPressed(0) && this.spells_learned > 0) {
			if (this.current_spell === SPELLNAMES.FIRE && this.spells_learned >= 1) {
				// FIRE
				const offset = 40;
				if (this.fire_cooldown_timer <= 0) {
					const angle = V2D.calcDir(
						IN.getMouseX() - (this.x + this.face_direction * offset),
						IN.getMouseY() - (this.y - offset)
					);
					new Fireball(this.x + this.face_direction * offset, this.y - offset, angle);

					this.fire_cooldown_timer = this.fire_cooldown;
				} else {
					new DustParticle(this.x + this.face_direction * offset, this.y - offset, 0.7);
				}
			} else if (this.current_spell === SPELLNAMES.EARTH && this.spells_learned >= 2) {
				// EARTH
				const offset = 40;

				// Remove oldest rock if there are too many
				while (this.rock_spell_array.length >= 2) {
					this.rock_spell_array.shift().blockDestroy();
				}
				if (this.rock_spell_count < 2) {
					const angle = V2D.calcDir(
						IN.getMouseX() - (this.x + this.face_direction * offset),
						IN.getMouseY() - (this.y - offset)
					);
					this.rock_spell_array.push(new RockBlock(this.x + this.face_direction * offset, this.y - offset - 20, angle));
				} else {
					new DustParticle(this.x + this.face_direction * offset, this.y - offset, 0.7);
				}
			} else if (this.current_spell === SPELLNAMES.AIR && this.spells_learned === 4) {
				// AIR
				if (this.wind_cooldown_timer <= 0) {
					new WindSpell(IN.getMouseX(), IN.getMouseY());
					this.wind_cooldown_timer = this.wind_cooldown;
				}
			} else if (this.current_spell === SPELLNAMES.WATER && this.spells_learned >= 3) {
				// WATER
				if (this.has_waterdash) {
					this.has_waterdash = false;
					this.switchState(PLAYERSTATES.WATERDASH);

					const offset = 40;
					const angle = V2D.calcDir(
						IN.getMouseX() - (this.x + this.face_direction * offset),
						IN.getMouseY() - (this.y - offset)
					);
					const spd = 13;
					this.hsp = Math.cos(angle) * spd;
					this.vsp = Math.sin(angle) * spd;
					// if (this.vsp > 0) {
					// 	this.vsp *= 1.1;
					// } else {
					// 	this.vsp *= 0.8;
					// }
					// Water Dash Sound Effect
					$engine.audioPlaySound("WaterDashSoundEffect", 0.08, false);

					// Spawn water particle
					new WaterDashParticle(this.x - this.facing * 20, this.y + 1, 0.5, angle);
				}
			}
		}
		//this.getSprite().skew.x = this.hsp / 15;
		this.animation.update(1);
		this.state_timer++;
		this.getStateGroup().step();

		// You can always switch between spells (for now)
		const spell_inp = IN.keyCheckPressed("KeyE") - IN.keyCheckPressed("KeyQ");
		if (spell_inp != 0 && this.spells_learned > 1) {
			this.current_spell += spell_inp;
			if (this.current_spell < 0) {
				this.current_spell = this.spells_learned + this.current_spell;
			}
			this.current_spell = this.current_spell % this.spells_learned;
			this.levelHandler.spellWheelRotate(this.current_spell);
		}

		//  this.filter.blur = this.x / 120;

		// Check for water freezing
		if (this.current_spell === SPELLNAMES.WATER) {
			this.setHitbox(this.iceHitbox);
			var water_block = IM.instancePlace(this, this.x + this.hsp, this.y + this.vsp + 5, WaterBlock);
			this.setHitbox(this.mainHitbox);
			if (water_block !== undefined && !this.inside_water) {
				new IceBlock(water_block.x, water_block.y, 300);
				water_block.destroy();
			}
		}
	}

	draw(gui, camera) {
		// EngineDebugUtils.drawHitbox(camera, this);
		this.animation.scale.x = this.facing * (this.spr_scale - Math.abs(this.vsp) / 50);
		this.animation.scale.y = this.spr_scale + Math.abs(this.vsp) / 50;
		if (Math.abs(this.hsp) > 0.1) {
			this.animation.scale.x = Math.abs(this.animation.scale.x) * Math.sign(this.hsp);
		}
		this.animation.x = this.x;
		this.animation.y = this.y;
	}

	// My Functions -------------------------------------------------------

	getStateGroup() {
		return this.state_funcs[this.state];
	}

	switchState(_state) {
		this.getStateGroup().exit(this.state);
		this.state = _state;
		this.state_timer = 0;
		this.getStateGroup().enter(this.state);
	}

	// Step functions
	stepDevmode() {
		var spd = 16;
		if (IN.keyCheck("Shift")) {
			spd = 64;
		}
		if (IN.keyCheck("KeyD")) {
			this.x += spd;
		}
		if (IN.keyCheck("KeyA")) {
			this.x -= spd;
		}
		if (IN.keyCheck("KeyW")) {
			this.y -= spd;
		}
		if (IN.keyCheck("KeyS")) {
			this.y += spd;
		}
	}

	stepGrounded() {
		// Become airborne if no ground under you
		if (!this.collisionCheck(this.x, this.y + 1)) {
			this.switchState(PLAYERSTATES.AIRBORNE);
			this.moveCollide();
			return;
		}

		const inp = IN.keyCheck("KeyD") - IN.keyCheck("KeyA");
		if (inp) {
			this.face_direction = inp;
			this.facing = inp;
		}
		const part_from_center = 18;
		const part_from_ground = 5;
		if (inp !== 0) {
			this.hsp = EngineUtils.clamp(this.hsp + inp * this.ground_accel, -this.max_run_speed, this.max_run_speed);
			// Running clouds
			if (Math.abs(this.hsp) > this.max_run_speed / 5 && this.state_timer % 15 === 0) {
				new DustParticle(this.x - part_from_center * Math.sign(this.hsp), this.y - part_from_ground, 0.8);
			}
		} else {
			// Decel
			this.hsp *= this.decel_coeff;
			this.hsp -= Math.sign(this.hsp) * this.decel_const;
			if (Math.abs(this.hsp) < 0.05) this.hsp = 0;
		}
		if (this.jumped) {
			// Jump
			this.vsp -= this.jump_height;
			new DustParticle(this.x - part_from_center, this.y - part_from_ground);
			new DustParticle(this.x + part_from_center, this.y - part_from_ground);
			// Jump SoundEffect
			$engine.audioPlaySound("JumpSoundEffect", 0.3, false);
		}

		this.checkUnderwater();

		// Animate
		if (Math.abs(this.hsp) > 0.1) {
			EngineUtils.setAnimation(this.animation, this.animation_running);
			this.animation.animationSpeed = Math.abs(this.hsp) / 30;
		} else {
			EngineUtils.setAnimation(this.animation, this.animation_standing);
		}

		this.moveCollide();
	}
	stepAirborne() {
		// Become grounded if there is ground under you
		if (this.collisionCheck(this.x, this.y + 1)) {
			this.switchState(PLAYERSTATES.GROUNDED);
			this.moveCollide();
			return;
		}

		// Make shorthop lower
		if (this.vsp < 0) {
			if (!(IN.keyCheck("KeyW") || IN.keyCheck("Space"))) {
				this.vsp *= 0.9;
			}
		}

		// Apply gravity
		this.grav_real = this.gravity;
		if (IM.instanceCollision(this, this.x, this.y, WindSpell)) {
			// In the wind spell
			this.grav_real /= 2;
			this.vsp = Math.min(this.vsp, 5);
		} else {
			if (this.vsp > -0.5 && this.vsp < 1.5) this.vsp -= this.gravity / 1.4;
		}
		this.vsp += this.grav_real;

		// Decel
		this.hsp *= this.decel_coeff_air;
		if (Math.abs(this.hsp) < 0.03) this.hsp = 0;

		// INP
		const inp = IN.keyCheck("KeyD") - IN.keyCheck("KeyA");
		if (inp !== 0) {
			if (this.hsp > this.max_run_speed) {
				this.hsp = Math.min(this.hsp + inp * this.ground_accel, this.hsp);
			} else if (this.hsp < -this.max_run_speed) {
				this.hsp = Math.max(this.hsp + inp * this.ground_accel, this.hsp);
			} else {
				this.hsp = EngineUtils.clamp(this.hsp + inp * this.ground_accel, -this.max_run_speed, this.max_run_speed);
			}

			// Check wall cling
			var coll = IM.instancePlace(this, this.x + inp, this.y, SolidObject);
			if (this.vsp > 0 && this.collisionCheck(this.x + inp, this.y) && !(coll instanceof NoWallClingWall)) {
				if (this.current_spell === 1) {
					this.switchState(PLAYERSTATES.WALLCLING);
					this.facing = inp;
					// Wall Impact Sound Effect
					$engine.audioPlaySound("WallImpactSoundEffect", 0.07, false);
					return;
				}
			}
		}

		// Jumping Animation
		if (this.vsp < 0) {
			EngineUtils.setAnimation(this.animation, this.animation_jumping_up);
		} else {
			EngineUtils.setAnimation(this.animation, this.animation_jumping_down);
		}

		this.checkUnderwater();

		// Check Double Jump
		if (this.current_spell === SPELLNAMES.AIR) {
			if (this.jumped && this.has_doubleJump) {
				this.vsp = -this.jump_height;
				const part_from_center = 18;
				const part_from_ground = 5;
				new DustParticle(this.x - part_from_center, this.y - part_from_ground);
				new DustParticle(this.x + part_from_center, this.y - part_from_ground);
				this.has_doubleJump = false;
				// double jump sound effect
				$engine.audioPlaySound("DoubleJumpSoundEffect", 0.07, false);
			}
		}

		this.moveCollide();
	}
	stepInactive() {}
	stepWallCling() {
		if (this.jumped) {
			this.vsp -= this.jump_height / (1 + this.wall_jumped_times * 0.05);
			this.hsp = 6 * -this.facing;
			this.wall_jumped_times++;
			this.switchState(PLAYERSTATES.AIRBORNE);
			return;
		}
		var inp = 0;
		if (IN.keyCheck("KeyD")) {
			inp = 1;
		}
		if (IN.keyCheck("KeyA")) {
			inp = -1;
		}
		if (this.facing === -inp) {
			this.switchState(PLAYERSTATES.AIRBORNE);
			return;
		}

		if ($engine.getGameTimer() % 7 === 0) {
			new DustParticle(this.x + this.facing * 18, this.y - 64);
		}

		if (this.collisionCheck(this.x, this.y + 1)) {
			this.switchState(PLAYERSTATES.GROUNDED);
			return;
		}

		if (!this.collisionCheck(this.x + this.facing, this.y)) {
			this.switchState(PLAYERSTATES.AIRBORNE);
			return;
		}

		this.checkUnderwater();

		this.vsp = Math.min(this.vsp + 0.1, 3);
		this.moveCollide();
	}
	stepWaterDash() {
		if (this.state_timer >= 8) {
			this.switchState(PLAYERSTATES.AIRBORNE);
		}

		// if (this.state_timer % 2 === 0) new DustParticle(this.x, this.y);

		this.moveCollide();
	}
	stepUnderwater() {
		this.inside_water = true;

		if (this.vsp < 0) {
			if (!this.jumped) {
				this.vsp *= 0.98;
			}
		}

		// Apply gravity
		this.vsp += this.water_gravity; // this.gravity;
		this.vsp = Math.min(this.vsp, 5);
		//if (this.vsp > -0.2 && this.vsp < 0.8) this.vsp -= this.gravity / 1.2;

		// Decel
		this.hsp *= this.decel_coeff_air;
		if (Math.abs(this.hsp) < 0.03) this.hsp = 0;

		// INP
		const inp = IN.keyCheck("KeyD") - IN.keyCheck("KeyA");
		const mult = 0.7;
		if (inp !== 0) {
			this.hsp = EngineUtils.clamp(
				this.hsp + inp * this.ground_accel * mult,
				-this.max_run_speed * mult,
				this.max_run_speed * mult
			);
		}

		// Jumping Animation
		if (this.vsp < 0) {
			EngineUtils.setAnimation(this.animation, this.animation_jumping_up);
		} else {
			EngineUtils.setAnimation(this.animation, this.animation_jumping_down);
		}

		if (this.state_timer > 8) {
			// "Jump" infinitely
			if (this.jumped) {
				this.vsp -= this.jump_height / 6;
				const part_from_center = 18;
				const part_from_ground = 5;
				new DustParticle(this.x - part_from_center, this.y - part_from_ground);
				new DustParticle(this.x + part_from_center, this.y - part_from_ground);
				// this.has_doubleJump = false;
				// double jump sound effect
				// $engine.audioPlaySound("DoubleJumpSoundEffect", 1.0, false, 0.2, 0.5);
			}
		}

		// Leave underwater state
		if (!IM.instanceCollision(this, this.x, this.y, WaterBlock)) {
			this.switchState(PLAYERSTATES.AIRBORNE);
		}

		this.moveCollide();
	}
	stepDeath() {
		// Vibrate
		var moveAmount = 3;
		if (this.state_timer % 4 === 0) {
			moveAmount *= -1;
		}
		if (this.state_timer % 2 === 0) {
			this.x += moveAmount;
		}

		// Die in a second or so
		if (this.state_timer === 45) {
			EngineUtils.setAnimation(this.animation, this.animation_nothing);
			var from_center = 20;
			const size = 2;
			new DustParticle(this.x - from_center, this.y - 32 - from_center, size);
			new DustParticle(this.x - from_center, this.y - 32 + from_center, size);
			new DustParticle(this.x + from_center, this.y - 32 - from_center, size);
			new DustParticle(this.x + from_center, this.y - 32 + from_center, size);
			$engine.unpauseGameSpecial(this);
		}

		// "Respawn"
		if (this.state_timer === 120) {
			this.x = this.saveX;
			this.y = this.saveY;
			this.player_health = 100;
			this.switchState(PLAYERSTATES.AIRBORNE);
		}
	}

	// Transition functions
	enterGrounded() {
		this.has_doubleJump = true;
		this.has_waterdash = true;
		this.wall_jumped_times = 0;
	}
	enterAirborne() {}
	enterInactive() {}
	enterWallCling() {
		this.hsp = 0;
		this.vsp = 0;
		this.has_doubleJump = true;
		EngineUtils.setAnimation(this.animation, this.animation_wallcling);
		new DustParticle(this.x + this.facing * 18, this.y - 64);
		new DustParticle(this.x + this.facing * 18, this.y - 4);
	}
	enterWaterDash() {
		EngineUtils.setAnimation(this.animation, this.animation_running);
		this.animation.animationSpeed = 0;
	}
	enterUnderwater() {
		// this.gravity = this.water_gravity;
		this.has_waterdash = true;
		this.has_doubleJump = true;
		this.wall_jumped_times = 0;
	}
	enterDeath() {
		EngineUtils.setAnimation(this.animation, this.animation_death);
		this.vsp = 0;
		this.hsp = 0;
		$engine.pauseGameSpecial(this);
	}

	exitGrounded() {}
	exitAirborne() {
		this.vsp = 0;
	}
	exitInactive() {}
	exitWallCling() {}
	exitWaterDash() {}
	exitUnderwater() {
		this.inside_water = false;
		// this.gravity = this.default_gravity;
	}
	exitDeath() {}

	moveCollide() {
		// Move X
		// Move Y
		//this.__collision();
		this.collision();
	}

	// SNAPPING (commented for now) ----------------------------------------------------------------------
	// __collision() {
	// 	if (Math.abs(this.hsp) > Math.abs(this.vsp)) {
	// 		while (this.__collisionCheckX());
	// 		this.x += this.hsp;

	// 		while (this.__collisionCheckY());
	// 		this.y += this.vsp;
	// 	} else {
	// 		while (this.__collisionCheckY());
	// 		this.y += this.vsp;

	// 		while (this.__collisionCheckX());
	// 		this.x += this.hsp;
	// 	}
	// }

	// __snapX() {
	// 	if (this.snap_enabled) {
	// 		var vel2 = V2D.calcMag(this.hsp, this.vsp);
	// 		var fac = this.snap_move_factor;
	// 		var dist = this.snap_distance;
	// 		var lowerBound = Math.min(-dist + vel2 * fac * Math.sign(this.hsp), 0);
	// 		var upperBound = Math.max(dist + vel2 * fac * Math.sign(this.hsp), 0);
	// 		if (this.hsp > 0 || !this.allowSnapLeft)
	// 			// cannot snap in a direction you are not moving...
	// 			lowerBound = 0;
	// 		if (this.hsp < 0 || !this.allowSnapRight) upperBound = 0;
	// 		for (var i = 0; i < upperBound; i++) {
	// 			if (!this.collisionCheck(this.x + i, this.y + this.vsp)) {
	// 				this.x += i;
	// 				return true;
	// 			}
	// 		}
	// 		for (var i = 0; i > lowerBound; i--) {
	// 			if (!this.collisionCheck(this.x + i, this.y + this.vsp)) {
	// 				this.x += i;
	// 				return true;
	// 			}
	// 		}
	// 	}
	// 	return false;
	// }

	// __collisionCheckX() {
	// 	var hit = false;
	// 	var t = 0;
	// 	if (this.hsp != 0 && this.collisionCheck(this.x + this.hsp, this.y) && !this.__snapY()) {
	// 		while (!this.collisionCheck(this.x + Math.sign(this.hsp), this.y) && t < Math.abs(this.hsp)) {
	// 			this.x += Math.sign(this.hsp);
	// 			t++;
	// 		}
	// 		this.hsp = 0;
	// 		hit = true;
	// 	}
	// 	return hit;
	// }

	// __snapY() {
	// 	if (this.snap_enabled) {
	// 		var vel2 = V2D.calcMag(this.hsp, this.vsp);
	// 		var fac = this.snap_move_factor;
	// 		var dist = this.snap_distance;
	// 		var lowerBound = Math.min(-dist + vel2 * fac * Math.sign(this.vsp), 0);
	// 		var upperBound = Math.max(dist + vel2 * fac * Math.sign(this.vsp), 0);
	// 		if (this.vsp > 0 || !this.allowSnapUp)
	// 			// cannot snap in a direction you are not moving...
	// 			lowerBound = 0;
	// 		if (this.vsp < 0 || !this.allowSnapDown) upperBound = 0;
	// 		for (var i = 0; i < upperBound; i++) {
	// 			if (!this.collisionCheck(this.x + this.hsp, this.y + i)) {
	// 				this.y += i;
	// 				return true;
	// 			}
	// 		}
	// 		for (var i = 0; i > lowerBound; i--) {
	// 			if (!this.collisionCheck(this.x + this.hsp, this.y + i)) {
	// 				this.y += i;
	// 				return true;
	// 			}
	// 		}
	// 	}
	// 	return false;
	// }

	// __collisionCheckY() {
	// 	var hit = false;
	// 	var t = 0;
	// 	if (this.vsp != 0 && this.collisionCheck(this.x, this.y + this.vsp) && !this.__snapX()) {
	// 		while (!this.collisionCheck(this.x, this.y + Math.sign(this.vsp)) && t < Math.abs(this.vsp)) {
	// 			this.y += Math.sign(this.vsp);
	// 			t++;
	// 		}
	// 		this.vsp = 0;
	// 		hit = true;
	// 	}
	// 	return hit;
	// }

	collisionCheck(x, y) {
		var collided = IM.instanceCollision(this, x, y, SolidObject);
		if (collided) {
			return true;
		}

		// Dont collide with platforms if you are holding down
		if (!IN.keyCheck("KeyS")) {
			if (this.vsp >= 0) {
				// Only collide if the semisolid is below you
				var collided_list = IM.instanceCollisionList(this, x, y, SemiSolid);
				for (const obj of collided_list) {
					if (obj.getHitbox().getBoundingBoxTop() > this.getHitbox().getBoundingBoxBottom()) {
						return true;
					}
				}
			}
		}
		return false;
	}

	collisionCheckY() {
		var hit = false;
		var t = 0;
		if (this.vsp != 0 && this.collisionCheck(this.x, this.y + this.vsp)) {
			while (!this.collisionCheck(this.x, this.y + Math.sign(this.vsp)) && t < Math.abs(this.vsp)) {
				this.y += Math.sign(this.vsp);
				t++;
			}
			this.vsp = 0;
			hit = true;
		}
		return hit;
	}

	collisionCheckX() {
		var hit = false;
		var t = 0;
		if (this.hsp != 0 && this.collisionCheck(this.x + this.hsp, this.y)) {
			while (!this.collisionCheck(this.x + Math.sign(this.hsp), this.y) && t < Math.abs(this.hsp)) {
				this.x += Math.sign(this.hsp);
				t++;
			}
			this.hsp = 0;
			hit = true;
		}
		return hit;
	}

	collision() {
		if (Math.abs(this.hsp) > Math.abs(this.vsp)) {
			while (this.collisionCheckX());
			this.x += this.hsp;

			while (this.collisionCheckY());
			this.y += this.vsp;
		} else {
			while (this.collisionCheckY());
			this.y += this.vsp;

			while (this.collisionCheckX());
			this.x += this.hsp;
		}
	}

	checkUnderwater() {
		var collided = IM.instanceCollision(this, this.x, this.y - 30, WaterBlock);
		if (collided) {
			this.switchState(PLAYERSTATES.UNDERWATER);
		}
	}

	onRoomStart() {
		if (RoomManager.currentRoom().name == "Tutorial") {
			this.spells_learned = 0;
		} else if (RoomManager.currentRoom().name == "Level1") {
			this.spells_learned = 1;
		} else if (RoomManager.currentRoom().name == "Level2") {
			this.spells_learned = 2;
		} else if (RoomManager.currentRoom().name == "Level3") {
			this.spells_learned = 3;
		}
	}
}

class PLAYERSTATES {}
PLAYERSTATES.DEVMODE = -1;
PLAYERSTATES.GROUNDED = 0;
PLAYERSTATES.AIRBORNE = 1;
PLAYERSTATES.INACTIVE = 2;
PLAYERSTATES.WALLCLING = 3;
PLAYERSTATES.WATERDASH = 4;
PLAYERSTATES.UNDERWATER = 5;
PLAYERSTATES.DEATH = 6;

class SPELLNAMES {}
SPELLNAMES.FIRE = 0;
SPELLNAMES.EARTH = 1;
SPELLNAMES.WATER = 2;
SPELLNAMES.AIR = 3;
