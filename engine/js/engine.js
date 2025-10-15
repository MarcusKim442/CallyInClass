// this is a central file for the engine, RPG maker overrides, and any custom code that interacts with the overworld

const $ENGINE_VERSION = "1.2.0";
const $ENGINE_NAME = "FallEngine";

/** @type {Engine} */
var $engine;

/** @type {Object} */
var $__engineData = {};
$__engineData.__textureCache = {};
$__engineData.__textureAnimationCache = {};
$__engineData.__soundCache = {};
$__engineData.__spritesheets = {};
$__engineData.__defaultSprites = {};
$__engineData.__classLookup = {};
$__engineData.__performanceData = { frameTimes: [] };
$__engineData.__assetSources = new WeakMap();
$__engineData.__haltAndReturn = false;
$__engineData.__ready = false;
$__engineData.__fullyReady = false;
$__engineData.__overrideRoom = undefined;
$__engineData.__overrideRoomChange = undefined;
$__engineData.__readyOverride = true;
$__engineData.__deferredAssets = -1;
$__engineData.__loadedDeferredAssets = -1;
$__engineData.__assetCount = 0;
$__engineData.__loadedAssetCount = 0;
$__engineData.__loadRoom = null;

$__engineData.__debugRequireTextures = false;
$__engineData.__debugRequireSounds = false;
$__engineData.__debugPreventReturn = false;
$__engineData.__debugLogFrameTime = false;
$__engineData.__debugRequireAllTextures = false;
$__engineData.__debugRequireAllSounds = false;
$__engineData.__debugDrawAllHitboxes = false;
$__engineData.__debugDrawAllBoundingBoxes = false;
$__engineData.__debugDrawPerformanceOverlay = false;

/** @type {Object} */
var $__enginePerformanceOptions = {};
$__enginePerformanceOptions.PAUSE = { name: "pause", colour: 0xffffff };
$__enginePerformanceOptions.STEP = { name: "step", colour: 0x1cc71c };
$__enginePerformanceOptions.POST_STEP = { name: "post-step", colour: 0x8ce681 };
$__enginePerformanceOptions.PRE_DRAW = { name: "pre-draw", colour: 0x8e90e8 };
$__enginePerformanceOptions.DRAW = { name: "draw", colour: 0x2b30cc };
$__enginePerformanceOptions.ENGINE_FUNCTIONS = { name: "engine-functions", colour: 0xf06e00 };
$__enginePerformanceOptions.TIMESCALE = { name: "timescale", colour: 0xffe100 };
$__enginePerformanceOptions.RENDER = { name: "render", colour: 0xf691ff };

/** @type {Object} */
var $__engineSaveData = {}; // this data is automatically read and written by RPG maker when you load a save.

/** @type {Object} */
var $__engineGlobalSaveData = {}; // data that are saved globally. Loaded at the end of the file because it relies on overrides.

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST; // set PIXI to render as nearest neighbour

// convenience functions for overworld progammers.
const SET_ENGINE_ROOM = function (room) {
	$__engineData.__loadRoom = room;
};
const ENGINE_START = function () {
	SceneManager.push(Engine);
	$gameMap._interpreter._index--;
	$engine.performEmergencySave();
	$gameMap._interpreter._index++;
};

const ENGINE_START_PARALLEL = function (forceWait = true) {
	$engine.startOverworld();
	if (forceWait) {
		$gameMap._interpreter._waitMode = "engine";
	}
};

class Engine extends Scene_Base {
	create() {
		super.create();
		if ($__engineData.__overworldMode) {
			$__engineData.__overworldMode = false;
			$engine.endOverworld(); // still refers to old engine at this point
		}
		this.__initEngine();
	}

	__initEngine() {
		$engine = this;
		this.__pauseMode = 0; // 0 = not paused, 1 = paused, 2 = pause special.
		this.__pauseSpecialInstance = undefined;
		this.__filters = [];
		this.__gameCanvas = new PIXI.Container();
		this.__gameCanvas.filters = []; // PIXI
		this.__debugLayer = new PIXI.Graphics();
		this.__enabledCameras = [true]; // Multi cameras don't work like this, but can still be done with render textures!
		this.__cameras = [new Camera(0, 0, Graphics.boxWidth, Graphics.boxHeight, 0)];
		this.__GUIgraphics = new PIXI.Graphics();
		this.__shouldChangeRooms = false;
		this.__isChangingRooms = false;
		this.__nextRoom = "";
		this.__currentRoom = undefined;
		this.__globalTimer = 0;
		this.__gameTimer = 0;
		this.__instanceCreationSpecial = {}; // it doesn't matter what this is so long as it's an object.
		this.__timescale = 1;
		this.__timescaleFraction = 0;
		this.__ceilTimescale = false;
		this.__sounds = [];

		this.__physicsEngine = undefined;

		// place everything into a container so that the GUIScreen is not effected by game effects.
		this.addChild(this.__gameCanvas);
		this.addChild(this.__debugLayer);
		this.__gameCanvas.addChild(this.__cameras[0]);
		this.__gameCanvas.addChild(this.__GUIgraphics);
		this.__setupDebugLayer();
		IM.__initializeVariables();
	}

	__setupDebugLayer() {
		this.__debugLayer.visible = false;
		const fps = 60;
		const segments = 4;
		const t = new PIXI.Text("FPS: 0", { fill: 0xffffff, fontSize: 12 });
		const t2 = new PIXI.Text("AVG: 0", { fill: 0xffffff, fontSize: 12 });
		const t3 = new PIXI.Text("MAX: 0", { fill: 0xffffff, fontSize: 12 });
		t.y = 10;
		t.x = 3;
		t2.y = 20;
		t2.x = 2;
		t3.y = 30;
		this.__debugLayer.addChild(t, t2, t3);
		for (var i = 0; i < segments - 1; i++) {
			var xx = (this.getWindowSizeX() / segments) * (i + 1);
			const t = new PIXI.Text(Number(fps / Math.pow(2, i)).toFixed(0), { fill: 0xffffff, fontSize: 12 });
			t.anchor.x = 0.5;
			t.x = xx;
			t.y = 10;
			this.__debugLayer.addChild(t);
		}
	}

	startOverworld() {
		// interestingly enough, RPG maker sprites and scenes share a common "update" method
		// so if you add a scene as a child of another scene, it runs like normal.
		$__engineData.__overworldMode = true;
		$engine.alpha = 1;
		this.removeChildren();
		this.__initEngine();
		this.__startEngine();
		this.__bindEngine();
		this.__sceneChangeListener = function () {
			// undeclared in create.
			if (UwU.sceneIsOverworld()) {
				$engine.__bindEngine();
			}
		};
		UwU.addSceneChangeListener(this.__sceneChangeListener);
	}

	__bindEngine() {
		if ($__engineData.__overworldMode) {
			SceneManager._scene.addChild(this);
		}
	}

	endOverworld() {
		$__engineData.__overworldMode = false;
		this.__cleanup();
		SceneManager._scene.removeChild(this);
		UwU.removeSceneChangeListener(this.__sceneChangeListener);
	}

	isOverworld() {
		return $__engineData.__overworldMode; // true if the engine is in overworld mode *and* running.
	}

	/**
	 * RPG Maker functions.
	 */
	start() {
		super.start();
		this.__saveAudio();
		this.__startEngine();
	}

	__saveAudio() {
		this.prevBgm = AudioManager.saveBgm();
		this.prevBgs = AudioManager.saveBgs();
		AudioManager.fadeOutBgm(1);
		AudioManager.fadeOutBgs(1);
	}

	__startEngine() {
		this.__setRoom($__engineData.__loadRoom);
		IN.__forceClear();
	}

	/**
	 * Enables matter.js physics engine. After calling this method, all EnginePhysicsInstances will be physically simulated.
	 */
	physicsEnable() {
		if (!this.__physicsEngine) {
			this.__physicsEngine = new Matter.Engine.create();
		}
	}

	physicsAddBodyToWorld(...bodies) {
		Matter.World.add(this.__physicsEngine.world, bodies);
	}

	physicsRemoveBodyFromWorld(body) {
		Matter.World.remove(this.__physicsEngine.world, body);
	}

	physicsDestroy() {
		if (!this.__physicsEngine) {
			return;
		}
		Matter.World.clear(this.__physicsEngine.world);
		Matter.Engine.clear(this.__physicsEngine);
		this.__physicsEngine = undefined;
	}

	setTimescale(scale) {
		const old = this.__timescale;
		this.__timescale = scale;
		if (scale === 1) {
			this.resetTimescale();
		}
		if (scale === 0 && this.__ceilTimescale) {
			this.__timescaleFraction = 0.9999;
		} // force full interp.
		if (scale !== old && old === 1) {
			IM.__timescaleImplicit();
		}
	}

	/**
	 * If set to true, the engine will round the timescale fraction up to 1 when
	 * the game is stopped completely.
	 *
	 * @param {Boolean} bool Whether or not to clip timescale
	 */
	setCeilTimescale(bool) {
		this.__ceilTimescale = bool;
	}

	/**
	 * Resets the timescale of the engine back to one 1.0
	 */
	resetTimescale() {
		this.__timescale = 1;
		this.__timescaleFraction = 0;
	}

	/**
	 * @returns True if the engine is not running at base speed, false otherwise.
	 */
	isTimeScaled() {
		return this.__timescale !== 1;
	}

	/**
	 * When time is scaled, the engine may be in between two frames, a and b.
	 * This function provides the percentage of the way between frames a and b we are.
	 *
	 * @returns The fractional component of the frame
	 */
	getTimescaleFraction() {
		return this.__timescaleFraction % 1;
	}

	/**
	 * @returns The current timescale of the engine.
	 */
	getTimescale() {
		return this.__timescale;
	}

	update() {
		// RPG MAKER
		super.update();

		// ENGINE
		if (this.__shouldChangeRooms && !this.isBusy()) {
			if (!this.__setRoom(this.__nextRoom)) {
				return;
			}
		}

		this.__timescaleFraction += this.__timescale;

		this.__doSimTick();

		this.__globalTimer++;

		if ($__engineData.__haltAndReturn && !this.isBusy()) {
			this.__endAndReturn();
		}
	}

	/**
	 * Creates and returns an AudioReference for use in AudioManager.
	 * @param {String} audioName the name of the file, excluding the extension.
	 */
	generateRPGAudioReference(audioName) {
		var ref = {
			name: audioName,
			pan: 0,
			pitch: 100,
			volume: 100,
			pos: 0,
		};
		return ref;
	}

	/**
	 * Plays the specified sound with arguments. snd can either be a PIXI.Sound from audioGetSound() or it
	 * may be a String with the alias of the sound to play.
	 *
	 * If loop is specified, then the sound will never stop playing. You
	 * must manually stop the sound when you are done with it using audioStopSound() or audioFadeSound()
	 *
	 * Note that by specifying the loop points here, the sound will start at 'start'.
	 * If you want to loop only part of a sound, use audioSetLoopPoints() after starting the sound using this method.
	 *
	 * @param {PIXI.Sound | String} snd The sound instance to play or a string alias to reference.
	 * @param {Number | 1} volume The source volume to set
	 * @param {Boolean | false} loop Whether or not to loop
	 * @param {Number | 0} start The start loop point
	 * @param {Number | 0} end The end loop point
	 * @returns The IMediaInstance generated by PIXI.Sound
	 */
	audioPlaySound(snd, volume = 1, loop = false, start = 0, end = 0) {
		if (typeof snd === "string") {
			snd = this.audioGetSound(snd);
		}
		if (snd === undefined) {
			return;
		}
		var retSnd = undefined;
		if (end) {
			retSnd = snd.play({
				loop: loop,
				start: start,
				end: end,
				volume: volume,
			});
		} else {
			retSnd = snd.play({
				loop: loop,
				volume: volume,
			});
		}
		this.__audioSetupSound(snd, retSnd);
		return retSnd;
	}

	/**
	 * Directly plays a sound given the specified arguments. For advanced options that audioPlaySound
	 * cannot account for directly.
	 *
	 * @param {PIXI.Sound | String} snd The sound instance to play or a string alias to reference.
	 * @param {Object} args The arguments to pass to the sound constructor.
	 * @returns The IMediaInstance generated by PIXI.Sound
	 */
	audioPlaySoundDirect(snd, args) {
		if (typeof snd === "string") {
			snd = this.audioGetSound(snd);
		}
		if (snd === undefined) {
			return;
		}
		var retSnd = snd.play(args);
		this.__audioSetupSound(snd, retSnd);
		return retSnd;
	}

	__audioSetupSound(snd, sound) {
		var volume = sound.volume;
		sound.__rootVolume = volume;
		sound.__type = snd.__type;
		this.audioSetVolume(sound, volume); // volume for a sound, but because you can't change volume in engine i don't have to improve this.
		sound.__tick = function (self) {}; // nothing for now
		this.__sounds.push(sound);
		sound.__pauseTime = -1;
		sound.__sourceSound = snd;
		sound.__destroyed = false;
		sound.addListener("end", function () {
			// for cleanup purposes
			sound.__destroyed = true;
		});
	}

	/**
	 * Gets a sound from the cache and returns a PIXI.Sound object for playback.
	 *
	 * Note that the returned PIXI sound object should ***ALWAYS*** be
	 * played using either audioPlaySound() or audioPlaySoundDirect().
	 *
	 * This method exists mainly for the purpose of filters. Getting a sound resets the filters applied to it.
	 *
	 * @param {String} alias The name of the sound as specified in sounds_manifest.txt
	 * @returns The PIXI.Sound instance
	 */
	audioGetSound(alias) {
		var sound = $__engineData.__soundCache[alias];
		if (!sound) {
			var str =
				"Unable to find sound for name: " + String(alias) + ". Did you remember to include the sound in the manifest?";
			if ($__engineData.__debugRequireSounds) {
				throw new Error(str);
			}
			console.error(str);
			return undefined;
		}
		sound.filters = []; // reset the filters.
		return sound;
	}

	/**
	 * Stops the specified sound or all instances of the sound if snd is a PIXI.Sound object
	 * @param {IMediaInstance | PIXI.Sound} snd The sound to stop
	 */
	audioStopSound(snd) {
		for (const sound of this.__lookupSounds(snd)) {
			$engine.__audioDestroy(sound);
		}
	}

	/**
	 * Sets the volume of the sound, taking into account volume settings
	 *
	 * @param {IMediaInstance} snd The sound
	 * @param {Number} volume The normalized new volume
	 */
	audioSetVolume(snd, volume) {
		snd.__rootVolume = volume;
		var newVol = volume * this.audioGetTypeVolume(snd.__type);

		if (newVol < 0) {
			newVol = 0;
		}

		snd.volume = newVol;
	}

	/**
	 * Sets the loop points of ths specified sound. The start time does not need to be
	 * before the current time of playback of the sound.
	 *
	 * The sound must have been initialized with loop=true in audioPlaySound()
	 *
	 * If end is < start, the sound will not loop.
	 *
	 *
	 * @param {IMediaInstance} snd The sound to set the loop points for
	 * @param {Number} start The start time
	 * @param {Number} end The end time
	 */
	audioSetLoopPoints(snd, start, end) {
		snd._source.loopStart = start;
		snd._source.loopEnd = end;
	}

	/**
	 * Immediately stops all currently playing sounds.
	 */
	audioStopAll() {
		this.__audioCleanup();
	}

	/**
	 * Queries the internal list of sounds and stops all that match the type
	 *
	 * Type can be one of BGM, BGS, ME, or SE (case sensitive)
	 *
	 * @param {String} type The type of sound to stop
	 */
	audioStopType(type) {
		for (const sound of this.__sounds) {
			if (sound.__sourceSound.__type === type) {
				$engine.__audioDestroy(sound);
			}
		}
	}

	__lookupSounds(snd) {
		var sounds = [];
		if (snd.__sourceSound) {
			// IMediaInstance
			if (snd.__destroyed) {
				return [];
			}
			return [snd];
		}
		var target = snd.__engineAlias || snd; // String alias
		for (const sound of this.__sounds) {
			// Sound Instances
			if (sound.__sourceSound.__engineAlias === target && !sound.__destroyed) sounds.push(sound);
		}
		return sounds;
	}

	/**
	 * Finds and returns all playing sounds of that specific type
	 *
	 * Type can be one of BGM, BGS, ME, or SE (case sensitive)
	 *
	 * @param {String} type The type of sound to get
	 * @returns A non null array of all sounds matching that type
	 */
	audioGetSoundsOfType(type) {
		var sounds = [];
		for (const sound of this.__sounds) {
			if (sound.__sourceSound.__type === type) sounds.push(sound);
		}
		return sounds;
	}

	/**
	 * Pauses the specified sound or all instances of that specific sound if it is a PIXI.Sound
	 *
	 * @param {IMediaInstance | PIXI.Sound} snd The sound to pause
	 */
	audioPauseSound(snd) {
		for (const sound of this.__lookupSounds(snd)) {
			if (sound._source) {
				// remember our loop points, they get erased when you pause
				sound.__loopStart = sound._source.loopStart;
				sound.__loopEnd = sound._source.loopEnd;
			} else {
				sound.__loopStart = undefined;
				sound.__loopEnd = undefined;
			}
			sound.paused = true;
		}
	}

	/**
	 * @param {ImediaInstance | PIXI.Sound} snd The sound to pause
	 * @param {Number} time The time, in seconds, to pause the music at
	 */
	audioPauseSoundAt(snd, time) {
		for (const sound of this.__lookupSounds(snd)) {
			sound.__pauseTime = time;
			sound.__tick = function (self) {
				// console.log(self._source.context.currentTime)
				if (self._source.context.currentTime > self.__pauseTime) {
					$engine.audioPauseSound(self);

					self.__tick = function (self) {}; // reset the function
				}
			};
		}
	}

	/**
	 * Resumes a previously paused sound or all instances of that specific sound if it is a PIXI.Sound
	 *
	 * @param {IMediaInstance | PIXI.Sound} snd The sound to pause
	 */
	audioResumeSound(snd) {
		for (const sound of this.__lookupSounds(snd)) {
			sound.paused = false;
			if (sound.__loopStart !== undefined) {
				sound._source.loopStart = sound.__loopStart;
				sound._source.loopEnd = sound.__loopEnd;
			}
			if (sound.__pauseTime !== -1) {
				// was awaiting pause, but we want to resume it now.
				sound.__pauseTime = -1;
			}
		}
	}

	/**
	 * Checks whether or not the specified sound, or any instance of that sound if it is a PIXI.Sound is
	 * currently playing
	 *
	 * Note that 'playing' does not mean it is unpaused, only that it is registered as a sound currently.
	 *
	 * @param {IMediaInstance | PIXI.Sound} snd The sound to check
	 * @returns True if any instance of the Sound is registered, false otherwise
	 */
	audioIsSoundPlaying(snd) {
		return this.__lookupSounds(snd).length !== 0;
	}

	/**
	 * Attempts to find a playing instance of the sound.
	 *
	 * @param {String | PIXI.Sound} snd The sound to find
	 * @returns The first instnace of the sound, or undefined.
	 */
	audioFindSound(snd) {
		return this.__lookupSounds(snd)[0];
	}

	/**
	 * Fades out the specified sound across the specified number of frames.
	 *
	 * The volume is faded from the current volume down to zero.
	 *
	 * @param {IMediaInstance} snd The sound to fade out
	 * @param {Number | 30} [time=30] The amount of frames to fade over
	 */
	audioFadeSound(snd, time = 30) {
		snd.__timeToFade = time;
		snd.__timer = 0;
		snd.__tick = function (self) {
			self.volume = (1 - self.__timer / self.__timeToFade) * self.__rootVolume;
			if (self.__timer >= self.__timeToFade) $engine.__audioDestroy(self);
			self.__timer++;
		};
	}

	/**
	 * Fades in the specified sound across the specified number of frames.
	 *
	 * The volume is faded from the current volume up to the sound's max
	 * as specified in audioPlaySound()
	 *
	 * @param {IMediaInstance} snd The sound to fade in
	 * @param {Number | 30} time The amount of frames to fade over
	 */
	audioFadeInSound(snd, time = 30) {
		snd.__timeToFade = time;
		snd.__timer = 0;
		snd.volume = 0;
		snd.__tick = function (self) {
			if (self.__timer > self.__timeToFade) return;
			self.volume = (self.__timer / self.__timeToFade) * self.__rootVolume;
			self.__timer++;
		};
	}

	__audioDestroy(audio) {
		if (audio.__destroyed) return;
		audio.stop();
		audio.__destroyed = true; // as a safeguard, this is also set via a listener.
	}

	/**
	 * Fades out all sounds across the specified number of frames.
	 * @param {Number | 30} [time=30] The amount of frames to fade over
	 */
	audioFadeAll(time = 30) {
		for (const sound of this.__sounds) {
			this.audioFadeSound(sound, time);
		}
	}
	/**
	 * Fades out all sounds of the specified type across the specified number of frames.
	 *
	 * Type can be one of BGM, BGS, ME, or SE (case sensitive)
	 *
	 * @param {String | "SE"} [type=SE] The type of sound to fade
	 * @param {Number | 30} [time=30] The amount of frames to fade over
	 */
	audioFadeAllOfType(type = "SE", time = 30) {
		for (const sound of this.__sounds) {
			if (sound.__sourceSound.__type === type) this.audioFadeSound(audio, time);
		}
	}

	/**
	 * Queries RPG maker and reutrns the volume of sound that RPG maker's settings specify.
	 *
	 * Type can be one of BGM, BGS, ME, or SE (case sensitive)
	 *
	 * @param {String} type The type of sound to get the volume of
	 * @returns The volume as specified by RPG maker
	 */
	audioGetTypeVolume(type) {
		var masterVolume = AudioManager.masterVolume;
		switch (type) {
			case "BGM":
				return (AudioManager.bgmVolume / 100) * masterVolume;
			case "BGS":
				return (AudioManager.bgsVolume / 100) * masterVolume;
			case "ME":
				return (AudioManager.meVolume / 100) * masterVolume;
			case "SE":
				return (AudioManager.seVolume / 100) * masterVolume;
		}
		console.error("Audio type " + type + " is not defined, please use one of: BGM, BGS, ME, SE");
		return 1;
	}

	/**
	 * Sets the master volume of all audio effects.
	 *
	 * @param {Number} volume The normalized master volume
	 */
	audioSetMasterVolume(volume) {
		AudioManager.masterVolume = volume;
		ConfigManager.save();
		this.__updateVolumeOfActiveSounds();
	}

	audioGetMasterVolume() {
		return AudioManager.masterVolume;
	}

	/**
	 * Sets the volume of the specified type of audio
	 *
	 * Type can be one of BGM, BGS, ME, or SE (case sensitive)
	 *
	 * @param {String} type The type of sound to get the volume of
	 * @returns The volume as specified by RPG maker
	 */
	audioSetTypeVolume(type, volume) {
		switch (type) {
			case "BGM":
				AudioManager.bgmVolume = volume * 100;
			case "BGS":
				AudioManager.bgsVolume = volume * 100;
			case "ME":
				AudioManager.meVolume = volume * 100;
			case "SE":
				AudioManager.seVolume = volume * 100;
		}
		ConfigManager.save();
		this.__updateVolumeOfActiveSounds();
	}

	__updateVolumeOfActiveSounds() {
		for (const sound of this.__sounds) {
			this.audioSetVolume(sound, sound.__rootVolume);
		}
	}

	__audioTick() {
		for (const sound of this.__sounds) {
			sound.__tick(sound);
		}
		this.__sounds = this.__sounds.filter((x) => !x.__destroyed);
	}

	__audioCleanup() {
		// at the end of the game, delete all sounds.
		for (const sound of this.__sounds) {
			sound.stop();
		}
		this.__sounds = [];
	}

	/**
	 * The next time the engine tries to return, override the request and instead go to the specified room.
	 *
	 * This does not affect a room change request. Only a return to overworld request. However, if an override room
	 * is specified and the room changes, then this request is ignored.
	 *
	 * This function is mutually exclusive with overrideRoomChange. If both are set, only one will be run and the other request will be dropped
	 *
	 * The engine will completely restart itself in this situation,
	 * and it will act as if the engine terminated and then immediately started in the new room.
	 * @param {String} newRoom The room to go to instead
	 */
	overrideReturn(newRoom) {
		$__engineData.__overrideRoom = newRoom;
	}

	/**
	 * The next time the engine tries to go to a new room, override the request and instead go to the specified room.
	 *
	 * If a request is made that the engine be terminated, then the request to override a room change will be ignored
	 *
	 * This function is mutually exclusive with overrideReturn. If both are set, only one will be run and the other request will be dropped
	 *
	 * @param {String} newRoom The room to go to instead
	 */
	overrideRoomChange(newRoom) {
		$__engineData.__overrideRoomChange = newRoom;
	}

	/**
	 * Requests that at the start of the next frame, the current room be changed to
	 * the specified room.
	 *
	 * If a call was already made to change rooms, the new request will be ignored.
	 *
	 * @param {String} newRoom The name of the room to go to
	 */
	setRoom(newRoom) {
		if ($__engineData.__overrideRoomChange) {
			// override room change
			newRoom = $__engineData.__overrideRoomChange;
			$__engineData.__overrideRoom = undefined;
			$__engineData.__overrideRoomChange = undefined;
		}
		if (!RoomManager.roomExists(newRoom)) {
			throw new Error("Attemping to change to non existent room " + newRoom);
		}
		if (this.__shouldChangeRooms) {
			return;
		}
		this.__shouldChangeRooms = true;
		this.__nextRoom = newRoom;
	}

	__setRoom(roomName) {
		if (!this.__isChangingRooms) {
			IM.__endRoom();
			for (var i = this.__filters.length - 1; i >= 0; i--) {
				if (this.__filters[i].remove) {
					this.removeFilter(this.__filters[i].filter);
				}
			}
			this.getCamera().reset();
			this.getCamera().__roomChange();
			this.setTimescale(1);
		}

		if (this.isReady()) {
			this.__isChangingRooms = false;
			$__engineData.__readyOverride = false;
			Graphics.endLoading();
			RoomManager.__loadRoom(roomName); // also sets current room
			IM.__startRoom();
			this.__shouldChangeRooms = false;
			return true;
		} else if (!this.__isChangingRooms) {
			Graphics.startLoading();
			this.__isChangingRooms = true;
		} else {
			// not ready and changing rooms
			Graphics.updateLoading();
		}
		return false;
	}

	/** @returns {Camera} The camera */
	getCamera() {
		return this.__cameras[0];
	}

	getRenderer() {
		// for low level PIXI operations
		return Graphics._renderer;
	}

	/**
	 * Requests that the engine is terminated and control is returned back
	 * to the overworld at the start of the next frame.
	 */
	endGame() {
		$__engineData.__haltAndReturn = true;
	}

	/**
	 * Pauses the game.
	 *
	 * During pause mode, only the draw() and pause() methods of EngineInstances will be called
	 */
	pauseGame() {
		this.__pauseMode = 1;
	}

	/**
	 * Unpauses the game after it has been set to pause mode.
	 */
	unpauseGame() {
		this.__pauseMode = 0;
	}

	/**
	 * Pauses the game for every single instance except for the specified instance, which will have it's step method called in addition to pause and draw.
	 *
	 * During pause mode, only the draw() and pause() methods of EngineInstances will be called
	 * @param {EngineInstance} instance The immune instance
	 */
	pauseGameSpecial(instance) {
		if (!instance) {
			throw new Error("PauseGameSpecial requires a target instance to keep running");
		}
		this.__pauseSpecialInstance = instance;
		this.__pauseMode = 2;
	}

	/**
	 * Unpauses the game after it has been set to pause special mode.
	 */
	unpauseGameSpecial() {
		// alias for unpauseGame.
		this.__pauseMode = 0;
	}

	isGamePaused() {
		return this.__pauseMode === 1;
	}

	isGamePausedSpecial() {
		return this.__pauseMode === 2;
	}

	__getPauseMode() {
		return this.__pauseMode;
	}

	/**
	 * Saves the game into the specificed RPG maker save file ID.
	 *
	 * It is **highly recommended** to use `$engine.findSaveFile` to
	 * get the index as it will append engine specific code to the save, making it easier to operate on later.
	 *
	 * @param {Number} index The file id to save to
	 * @returns {Boolean} Whether or not the save was successful
	 */
	saveGame(index) {
		$gameSystem.onBeforeSave(); // just saves audio
		if (DataManager.saveGame(index)) {
			StorageManager.cleanBackup(index);
			return true;
		} else {
			console.error("Failed to save!");
			return false;
		}
		// GUIScreen.showSave();
	}

	/**
	 * Find a specified save file and return it's ID
	 *
	 * @param {String | Number} identifier An identifier for the save file to find
	 * @param {Boolean | true} create Whether or not the engine may create this save file if it cannot find it
	 * @returns {Number | null} The index of the save file, or null if it does not exist and create is false
	 */
	findSaveFile(identifier, create = true) {
		var globalInfo = DataManager.loadGlobalInfo();
		for (var i = 1; i < globalInfo.length; i++) {
			const info = globalInfo[i];
			if (!info) {
				continue;
			}

			if (
				StorageManager.isLocalMode() ||
				(info.globalId === DataManager._globalId &&
					info.title === $dataSystem.gameTitle &&
					info.fallenId === String(identifier))
			) {
				return i;
			}
		}

		if (!create) {
			return null;
		}

		for (var i = 1; ; i++) {
			const info = globalInfo[i];
			if (!info) {
				globalInfo[i] = DataManager.makeSavefileInfo(String(identifier));
				DataManager.saveGlobalInfo(globalInfo);
				return i;
			}
		}
	}

	/**
	 *
	 * Finds and returns an array of all saves files the engine knows of.
	 *
	 * Each save files has the following properties: ``index, identifier, playtime, timestamp``
	 *
	 * @returns {Array} A list of all save files associated with this game
	 */
	findAllSaves() {
		var saves = [];
		var globalInfo = DataManager.loadGlobalInfo();
		for (var i = 1; i < globalInfo.length; i++) {
			const info = globalInfo[i];
			if (!info) {
				continue;
			}
			if (
				StorageManager.isLocalMode() ||
				(info.globalId === DataManager._globalId && info.title === $dataSystem.gameTitle && "fallenId" in info)
			) {
				saves.push({ index: i, identifier: info.fallenId, playtime: info.playtime, timestamp: info.timestamp });
			}
		}
		return saves;
	}

	/**
	 * Load the specified save file into memory. This function only loads the data and does not do anything with the data.
	 *
	 * Use `$engine.findSaveFile` to find an appropriate index
	 *
	 * @param {Number} index The file id to load
	 * @returns {Boolean} Whether or not the load was successful
	 */
	loadSave(index) {
		if (DataManager.loadGame(index)) {
			if ($gameSystem.versionId() !== $dataSystem.versionId) {
				$gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y);
				$gamePlayer.requestMapReload();
			}
			$gameSystem.onAfterLoad();
			return true;
		}
		return false;
	}

	/**
	 * Deletes the specified save file if it exists.
	 *
	 * @param {Number} index The file id to delete
	 * @returns {Boolean} Whether or not the save could be deleted
	 */
	deleteSave(index) {
		if (DataManager.isThisGameFile(index)) {
			var info = DataManager.loadGlobalInfo();
			delete info[index];
			DataManager.saveGlobalInfo(info);
			return true;
		}
		return false;
	}

	/**
	 * Gets the engine save data associated with the current save file.
	 *
	 * The object returned will always store the current save data, even if you load a new save.
	 *
	 * @returns The save data associated with this file.
	 */
	getSaveData() {
		return $__engineSaveData;
	}

	/**
	 * Gets the engine's global save data. If direct is false, the object returned is a proxy which
	 * will immediately save the data on edit
	 *
	 * @param {Boolean | false} direct Return the raw global save object?
	 * @returns The engine's global save data
	 */
	getEngineGlobalData(direct = false) {
		if (direct) {
			return $__engineGlobalSaveData;
		}
		return new Proxy($__engineGlobalSaveData, {
			set(obj, prop, value) {
				if (obj[prop] !== value) {
					obj[prop] = value;
					$engine.saveEngineGlobalData();
				}
				return true;
			},
		});
	}

	/**
	 * Saves the engine's global save data. All operations that write to global data should immediately save as well.
	 */
	saveEngineGlobalData() {
		StorageManager.save(-2, JSON.stringify($__engineGlobalSaveData));
	}

	/**
	 * Deletes the engine's global save data.
	 */
	deleteEngineGlobalData() {
		Object.keys($__engineGlobalSaveData).forEach((x) => delete $__engineGlobalSaveData[x]);
		this.saveEngineGlobalData();
	}
	__endAndReturn() {
		$__engineData.__haltAndReturn = false;

		if ($__engineData.__overworldMode) {
			this.endOverworld();
			return;
		}

		if ($__engineData.__overrideRoom) {
			// completely restart the engine if we override room.
			this.__cleanup(); // after all the intention of the programmer at this point is that the engine is to be terminated.
			this.removeChildren();
			this.__initEngine();
			$__engineData.__loadRoom = $__engineData.__overrideRoom;
			this.__startEngine();
			$__engineData.__overrideRoom = undefined;
			$__engineData.__overrideRoomChange = undefined; // engine would have returned, disregard
			this.startFadeIn();
			return;
		}

		// for testing minigames.
		if ($__engineData.__debugPreventReturn) {
			this.__cleanup();
			this.removeChildren();
			this.__initEngine();
			this.__startEngine();
			return;
		}

		SceneManager.pop(); // calls terminate
	}

	// called exclusively by terminate, which is called from RPG maker.
	__cleanup() {
		IM.__endGame(); // frees all renderables associated with instances
		for (const camera of this.__cameras) {
			camera.__free();
			this.freeRenderable(camera);
		}
		if (this.getCamera().__autoDestroyBackground) {
			for (const child of this.getCamera().__cameraBackground.children) {
				this.freeRenderable(child);
			}
		}
		this.__GUIgraphics.removeChildren(); // prevent bug if you rendered to the GUI
		this.getCamera().getCameraGraphics().removeChildren(); // prevent bug if you rendered to the Camera
		this.freeRenderable(this.__GUIgraphics);
		this.freeRenderable(this.__gameCanvas);
		for (const child of this.__debugLayer.children) {
			this.freeRenderable(child);
		}
		this.freeRenderable(this.__debugLayer);
		this.__audioCleanup();
		this.physicsDestroy();
		if (this._fadeSprite) {
			this.freeRenderable(this._fadeSprite);
			this._fadeSprite = undefined;
		}
	}

	__applyBlendModes() {
		// applies the khas blend modes every time the engine quits. Fixes a bug with khas.
		var renderer = this.getRenderer();
		var gl = renderer.gl;
		PIXI.BLEND_MODES.KHAS_LIGHT = 31;
		PIXI.BLEND_MODES.KHAS_LIGHTING = 32;
		renderer.state.blendModes[PIXI.BLEND_MODES.KHAS_LIGHT] = [gl.SRC_ALPHA, gl.ONE];
		renderer.state.blendModes[PIXI.BLEND_MODES.KHAS_LIGHTING] = [gl.ZERO, gl.SRC_COLOR];
	}

	/**
	 * RPG maker functions, do not call. If you want to end the game, use endGame().
	 */
	terminate() {
		super.terminate();
		this.__cleanup();
		this.__applyBlendModes();
		this.__resumeRPGAudio();
		$__engineData.__haltAndReturn = false;
	}

	/**
	 * RPG maker functions, do not call.
	 *
	 * Allows for the engine to wait until fully ready to prevent errors from early start.
	 *
	 * @returns True if the engine is fully ready to start, or if early start is enabled and is early ready
	 */
	isReady() {
		return super.isReady() && ($__engineData.__fullyReady || $__engineData.__readyOverride);
	}

	/**
	 * Causes the engine to skip it's ready check for the next room change, preventing
	 * the engine from waiting for async assets to load before changing rooms.
	 */
	skipReady() {
		$__engineData.__readyOverride = true;
	}

	__resumeRPGAudio() {
		if (this.prevBgm.name !== "") {
			AudioManager.replayBgm(this.prevBgm);
		}
		if (this.prevBgs.name !== "") {
			AudioManager.replayBgs(this.prevBgs);
		}
	}

	__doSimTick() {
		var start = window.performance.now();

		var simulatedOnce = this.__timescaleFraction - 1 >= 0;

		if (!simulatedOnce && this.__timescale === 0)
			// Input is timescale aligned, unless timescale is zero, then it's frame aligned (this call)
			IN.__update();

		while (this.__timescaleFraction - 1 >= 0) {
			this.__timescaleFraction--;

			var lastFrame = this.__timescaleFraction - 1 < 0;

			IN.__update();

			this.__updateGraphics();
			this.__doPhysicsTick();
			IM.__doSimTick(lastFrame);

			if (this.__pauseMode !== 1) {
				this.__gameTimer++;
			}
		}

		if (this.isTimeScaled()) {
			this.__logPerformance($__enginePerformanceOptions.TIMESCALE, IM.__timescaleImmuneStep, IM);
		}

		if (!simulatedOnce) {
			// some actions are called exactly once per frame no matter what.
			this.__logPerformance($__enginePerformanceOptions.ENGINE_FUNCTIONS, IM.__interpolate, IM);
			this.__logPerformance($__enginePerformanceOptions.DRAW, IM.__draw, IM);
			this.__updateGraphics();
		}

		this.__logPerformance($__enginePerformanceOptions.ENGINE_FUNCTIONS, this.__prepareRenderToCameras, this);
		this.__audioTick();

		if ($__engineData.__debugDrawPerformanceOverlay) {
			this.__drawDebugOverlay();
			this.__resetPerformanceData(); // because we draw the data, we have to carry the render time over to next frame
		}

		var time = window.performance.now() - start;
		if ($__engineData.__debugLogFrameTime) {
			console.log("Time taken for this frame: " + time + " ms");
		}
	}

	__doPhysicsTick() {
		if (this.__physicsEngine === undefined || this.__pauseMode !== 0) {
			return;
		}
		Matter.Engine.update(this.__physicsEngine);
	}

	/**
	 * Adds a filter to the game which applies in screen space
	 * @param {PIXI.filter} screenFilter The filter to add
	 * @param {Boolean | true} removeOnRoomChange Whether or not to automatically remove this filter when the engine changes rooms
	 * @param {String} name A unique identifier for this filter, which may be used later to find it.
	 */
	addFilter(screenFilter, removeOnRoomChange = true, name = "ENGINE_DEFAULT_FILTER_NAME") {
		this.__filters.push({ filter: screenFilter, remove: removeOnRoomChange, filterName: name });
		var filters = this.__gameCanvas.filters; // PIXI requires reassignment
		filters.push(screenFilter);
		this.__gameCanvas.filters = filters;
	}

	/**
	 * Removes the specified filter from the screen.
	 * @param {PIXI.filter | String} filter The filter or string id of filter to remove
	 */
	removeFilter(filter) {
		var index = -1;
		for (var i = 0; i < this.__filters.length; i++) {
			if (filter === this.__filters[i].filter || filter === this.__filters[i].filterName) {
				index = i;
				break;
			}
		}
		if (index === -1) {
			console.error("Cannot find filter " + filter);
			return;
		}
		var filterObj = this.__filters[i];

		var filters = this.__gameCanvas.filters; // PIXI requirments.
		filters.splice(this.__gameCanvas.filters.indexOf(filterObj.filter), 1);
		this.__gameCanvas.filters = filters;

		this.__filters.splice(index, 1);
	}

	/**
	 * Finds and returns the class with the specified name, or null if it is not defined.
	 *
	 * @param {String} name The name of the class as defined in instances_manifest.txt
	 * @returns {EngineInstace} The requested class
	 */
	getClassByName(name) {
		var cls = $__engineData.__classLookup[name];
		if (!cls) {
			var str =
				"Unable to find class for name: " +
				String(name) +
				". Did you remember to include the instance in the manifest?";
			console.error(str);
			return null;
		}
		return cls;
	}

	/**
	 * Returns a list of all registered classes
	 *
	 * @returns {EngineInstace[]} The list of all known classes
	 */
	getAllRegisteredClasses() {
		return Object.values($__engineData.__classLookup);
	}

	/**
	 * Finds and returns the texture with the specified name from the texture cache. If you want an image from a spritesheet,
	 * use the name in textures manifest followed by _n where n is the 0 based index of the frame you want.
	 * @param {String} name The name of the texture as defined in textures_manifest.txt
	 * @returns {PIXI.Texture} The texture requested, or null if not defined
	 */
	getTexture(name) {
		var tex = $__engineData.__textureCache[name];
		if (!tex) {
			var str =
				"Unable to find texture for name: " +
				String(name) +
				". Did you remember to include the texture in the manifest?";
			if ($__engineData.__debugRequireTextures) {
				throw new Error(str);
			}
			console.error(str);
			return null;
		}
		return tex;
	}

	/**
	 * Returns the default texture associated with this EngineInstance as defined in instances_manifest.txt, or null if there is none.
	 *
	 * @param {EngineInstance} cls The class to find the default texture for
	 * @returns {PIXI.Texture} The default texture for the class, or null if there is none.
	 */
	getDefaultTextureForClass(cls) {
		const oid = IM.__oidFrom(cls);
		var texName = $__engineData.__defaultSprites[oid];
		if (!texName) {
			return null;
		}
		return this.getTexture(texName);
	}

	/**
	 * Returns the path to the source file of the specified asset.
	 *
	 * @param {Any} asset
	 * @returns {String} The path to the asset's source, or null if there is no source.
	 */
	getAssetSource(asset) {
		const source = $__engineData.__assetSources.get(asset);
		return source || null;
	}

	/**
	 * Finds and returns an array of textures with the specified name from the texture animation cache.
	 * @param {String} name The name of the animation as defined in textures_manifest.txt
	 * @returns {PIXI.Texture[]} An array of textures for use in an AnimatedSprite, or null if not found.
	 */
	getAnimation(name) {
		var anim = $__engineData.__textureAnimationCache[name];
		if (!anim) {
			var str =
				"Unable to find animation for name: " +
				String(name) +
				". Did you remember to include the animation in the manifest?";
			if ($__engineData.__debugRequireTextures) {
				throw new Error(str);
			}

			console.error(str);
			return null;
		}
		return anim;
	}

	/**
	 * Returns a random texture from a spritesheet that was loaded using the spritesheet command
	 * in textures_manifest
	 * @param {String} name The name of the spritesheet
	 * @returns {PIXI.Texture} A random texture from the specified spritesheet, or null if not found
	 */
	getRandomTextureFromSpritesheet(name) {
		var sheetData = $__engineData.__spritesheets[name];
		if (!sheetData) {
			var str =
				"Unable to find spritesheet for name: " + String(name) + ". Was this texture initialized as a spritesheet?";
			if ($__engineData.__debugRequireTextures) {
				throw new Error(str);
			}
			console.error(str);
			return null;
		}
		var idx = EngineUtils.irandomRange(0, sheetData - 1);
		return this.getTexture(name + "_" + String(idx));
	}

	/**
	 * Returns the number of textures stored in this spritesheet. For this function to work, 'name' must refer
	 * to a texture loaded using the spritesheet command in textures_manifest
	 *
	 * @param {String} name The name of the spritesheet
	 * @returns {Number} The length of the spritesheet, or -1 if not found.
	 */
	getSpritesheetLength(name) {
		var sheetData = $__engineData.__spritesheets[name];
		if (!sheetData) {
			var str =
				"Unable to find texture for name: " +
				String(name) +
				". Did you remember to include the texture in the manifest?";
			if ($__engineData.__debugRequireTextures) {
				throw new Error(str);
			}
			console.error(str);
			return -1;
		}
		return sheetData;
	}

	/**
	 * Returns an array of textures from a spritesheet. For this function to work, you must
	 * load the texture using the spritesheet command in textures_manifest.
	 *
	 * If any of the specified frames of the spritesheet do not exist, they will be replaced with null
	 *
	 * @param {String} name The name of the spritesheet
	 * @param {Number} startIdx The first index, inclusive
	 * @param {Number} endIdx The last index, exclusive
	 * @returns {PIXI.Texture[]} The array of textures from the spritesheet
	 */
	getTexturesFromSpritesheet(name, startIdx, endIdx) {
		var textures = [];
		for (var i = startIdx; i < endIdx; i++) {
			textures.push(this.getTexture(name + "_" + String(i)));
		}
		return textures;
	}

	/**
	 * @returns {Number} The amount of frames the game has executed (timescale aware), excluding time paused, and including special time paused.
	 */
	getGameTimer() {
		return this.__gameTimer;
	}

	/**
	 * @returns {Number} The amount of frames the engine has been running.
	 */
	getGlobalTimer() {
		return this.__globalTimer;
	}

	/**
	 * @returns The width, in pixels, of the display window
	 */
	getWindowSizeX() {
		return Graphics.boxWidth;
	}

	/**
	 * @returns The height, in pixels, of the display window
	 */
	getWindowSizeY() {
		return Graphics.boxHeight;
	}

	/**
	 * RPG Maker functions.
	 */
	isFading() {
		return this._fadeDuration > 0;
	}

	/**
	 * Creates and returns a new Object which may be passed in to a PIXI.Text as the style.
	 *
	 * @returns {Object} Default text settings
	 */
	getDefaultSubTextStyle() {
		return {
			fontFamily: "GameFont",
			fontSize: 20,
			fontVariant: "bold",
			fill: "#FFFFFF",
			align: "center",
			stroke: "#363636",
			strokeThickness: 5,
		};
	}

	/**
	 * Creates and returns a new Object which may be passed in to a PIXI.Text as the style.
	 *
	 * @returns {Object} Default text settings
	 */
	getDefaultTextStyle() {
		return {
			fontFamily: "GameFont",
			fontSize: 30,
			fontVariant: "bold",
			fill: "#FFFFFF",
			align: "center",
			stroke: "#363636",
			strokeThickness: 5,
		};
	}

	/**
	 * Attaches a renderable to an instance and automatically renders it every frame. When the instance is destroyed, the engine will
	 * also destroy the renderable along with it.
	 *
	 * This function also applies the default anchor of the texture as defined in the manifest.
	 *
	 * The major difference between this and createManagedRenderable is that this will also cause the engine to automatically render it, createManagedRenderable
	 * will only tell the engine to keep track of it for you.
	 * @param {EngineInstance} parent The parent to attach the renderable to
	 * @param {PIXI.DisplayObject} renderable The renderable to auto dispose of
	 * @param {Boolean | false} [align=false] Whether or not to automatically move the renderable to match the parent instance's x, y, scale, rotation, and alpha (default false)
	 * @returns {PIXI.DisplayObject} The passed in renderable
	 */
	createRenderable(parent, renderable, align = false) {
		renderable.__depth = parent.depth;
		renderable.__parent = parent;
		renderable.__align = align;
		renderable.dx = 0;
		renderable.dy = 0;
		renderable.__idx = parent.__renderables.length;
		parent.__renderables.push(renderable);
		this.getCamera().__getRenderContainer().addChild(renderable);
		return renderable;
	}

	/**
	 * Attaches the lifetime of the specified renderable to the instance in question. When the instance is destroyed, the engine will
	 * also destroy the renderable along with it.
	 *
	 * The major difference between this and createRenderable is that createRenderable will also cause the engine to automatically render it, while
	 * this function will only tell the engine to keep track of it for you.
	 * @param {EngineInstance} parent The parent to attach the renderable to
	 * @param {PIXI.DisplayObject} renderable The renderable to auto dispose of
	 * @returns {PIXI.DisplayObject} The passed in renderable
	 */
	createManagedRenderable(parent, renderable) {
		parent.__pixiDestructables.push(renderable);
		return renderable;
	}

	/**
	 * Frees the resources associated with the specified renderable. If you registered the renderble using createRenderable
	 * or createManagedRenderable this will be called automicatcally by the engine when the parent instance is destroyed
	 *
	 * Use this method only if you want to destroy a renderable that was not registered with the engine.
	 * @param {PIXI.DisplayObject} renderable The renderable to destroy
	 */
	freeRenderable(renderable) {
		if (!renderable._destroyed) {
			renderable.destroy();
		}
	}

	/**
	 * Removes a renderable that was previsouly created with createRenderable() from it's parent and then destroys it.
	 * @param {PIXI.DisplayObject} renderable The renderable to remove
	 */
	removeRenderable(renderable) {
		var parent = renderable.__parent;
		renderable.__parent.__renderables.splice(renderable.__parent.__renderables.indexOf(renderable), 1); // remove from parent
		renderable.__parent = null; // leave it to be cleaned up eventually
		this.getCamera().__getRenderContainer().removeChild(renderable);
		this.freeRenderable(renderable);
		this.__recalculateRenderableIndices(parent);
	}

	/**
	 * Changes the internal index of the specified renderable, which changes the order that it is drawn in
	 * relative to other sprites in this isntance.
	 *
	 * @param {EngineInstance} parent The parent EngineInstance that was used to create the Renderable
	 * @param {PIXI.DisplayObject} renderable The renderable to move
	 * @param {Number} newIndex The new index to place this renderable at.
	 */
	changeRenderableIndex(parent, renderable, newIndex) {
		var currentIdx = parent.__renderables.indexOf(renderable);
		if (currentIdx === -1) {
			throw new Error("Cannot change index of renderable that does not belong to the target instance.");
		}
		if (newIndex >= parent.__renderables.length) {
			throw new Error("New index for renderable is outside the range of valid range");
		}

		parent.__renderables.splice(currentIdx, 1); // remove
		parent.__renderables.splice(newIndex, 0, renderable); // place at index

		this.__recalculateRenderableIndices(parent);
	}

	/**
	 * This function rebuilds all the indexes of renderables for a specific parent, which fixes the draw order if a renderable
	 * index was changed.
	 *
	 * @param {EngineInstance} parent The instance which owns the renderables.
	 */
	__recalculateRenderableIndices(parent) {
		for (var i = 0; i < parent.__renderables.length; i++) {
			parent.__renderables[i].__idx = i;
		}
	}

	__requestRenderOnDisplayObject(obj, renderable) {
		renderable.__indexRef = obj.__indexRef;
		if (renderable.parent !== obj) {
			obj.addChild(renderable);
		}
		obj.__indexRef++;
	}

	/**
	 * Requests that on this frame, the renderable be rendered to the GUI layer.
	 *
	 * Renderables added to the GUI will render in the order they are added.
	 * @param {PIXI.Container} renderable
	 */
	requestRenderOnGUI(renderable) {
		this.__requestRenderOnDisplayObject(this.__GUIgraphics, renderable);
	}

	/**
	 * Requests that on this frame, the renderable be rendered to the Camera layer.
	 *
	 * This is useful because if the camera has a special renderer like a 2d projection renderer on it,
	 * you may still render in camera space as usual using this method.
	 *
	 * Renderables added to the Camera will render in the order they are added.
	 * @param {PIXI.Container} renderable
	 */
	requestRenderOnCamera(renderable) {
		this.__requestRenderOnDisplayObject(this.getCamera().getCameraGraphics(), renderable);
	}

	/**
	 * Alias for getCamera().getBackground().
	 *
	 * @returns The current background renderable for the camera.
	 */
	getBackground() {
		return this.getCamera().getBackground();
	}

	/**
	 * Alias for getCamera().setBackground().
	 *
	 * Sets a renderable to be rendered in the background.
	 * @param {PIXI.DisplayObject} background The background to use
	 * @param {Boolean | true} autoDestroy Whether or not to auto destroy this background when the game ends or a new background is set.
	 */
	setBackground(background, autoDestroy = true) {
		// expects any PIXI renderable. renders first.
		this.getCamera().setBackground(background, autoDestroy);
	}

	/**
	 * Alias for getCamera().setBackgroundColour().
	 *
	 * Removes the current background if any exists.
	 * @param {Number} col The hex code for the background colour
	 */
	setBackgroundColour(col) {
		this.getCamera().setBackgroundColour(col);
	}

	/**
	 * Alias for getCamera().getBackgroundColour().
	 *
	 * @returns The current background colour.
	 */
	getBackgroundColour() {
		return this.getCamera().getBackgroundColour();
	}

	__prepareRenderToCameras() {
		for (var i = 0; i < 1; i++) {
			// a relic from a time long gone. more than one camera wouldn't work like this, you'd have to call the renderer directly.
			if (!this.__enabledCameras[i]) {
				continue;
			}
			var camera = this.__cameras[i];

			// The following code ONLY works because it was checked against PIXIJS containers.
			var renderContainer = camera.__getRenderContainer();
			var children = renderContainer.children;

			// sort our array.
			children.sort((a, b) => {
				const x = a.__parent;
				const y = b.__parent;
				var d = y.depth - x.depth; // first, try depth
				if (d === 0) {
					var d2 = x.id - y.id; // next, try instance creation order
					if (d2 === 0) {
						return a.__idx - b.__idx; // finally, the renderable order
					}
					return d2;
				}
				return d;
			});

			var cameraGraphics = this.getCamera().getCameraGraphics();

			if ($__engineData.__debugDrawAllHitboxes) {
				const bb = this.getCamera().getBoundingBox();
				for (const inst of IM.__objects) {
					if (inst.__hitbox && EngineUtils.boxesIntersect(inst.__hitbox.getBoundingBox(), bb)) {
						EngineDebugUtils.drawHitbox(cameraGraphics, inst);
					}
				}
			}

			if ($__engineData.__debugDrawAllBoundingBoxes) {
				const bb = this.getCamera().getBoundingBox();
				for (const inst of IM.__objects) {
					if (inst.__hitbox && EngineUtils.boxesIntersect(inst.__hitbox.getBoundingBox(), bb)) {
						EngineDebugUtils.drawBoundingBox(cameraGraphics, inst);
					}
				}
			}
		}
		this.__removeChildrenAfterRequest(this.__GUIgraphics);
		this.__removeChildrenAfterRequest(this.getCamera().getCameraGraphics());
	}

	__drawDebugOverlay() {
		const g = this.__debugLayer;
		g.clear();
		const data = $__engineData.__performanceData;
		const targetFps = 60;
		const h = 10;
		var x = 0;
		const xMax = this.getWindowSizeX();
		const msPerFrame = 1000 / targetFps;
		const msToPixels = xMax / 4 / msPerFrame;
		var total = 0;
		for (const option of Object.values($__enginePerformanceOptions)) {
			const time = data[option.name];
			if (time === undefined) {
				continue;
			}
			total += time;
			const w = time * msToPixels;
			const col = option.colour;
			g.beginFill(col);
			g.drawRect(x, 0, w, h);
			x += w;
		}
		data.frameTimes.push(total);
		if (data.frameTimes.length > 30) {
			data.frameTimes.shift();
		}
		const t = g.children[0]; // FPS text
		const fps = Number((msPerFrame / total) * targetFps).toFixed(0);
		t.text = "FPS: " + fps;
		const t2 = g.children[1]; // AVG text
		const t3 = g.children[2]; // MIN text
		var avg = 0;
		var min = 0;
		for (const t of data.frameTimes) {
			avg += t;
			min = Math.max(t, min); // higher is worse
		}
		const fps2 = Number((msPerFrame / (avg / data.frameTimes.length)) * targetFps).toFixed(0);
		t2.text = "AVG: " + fps2;
		t3.text = "MAX: " + Number(min).toFixed(1) + " ms";
	}

	__removeChildrenAfterRequest(object) {
		const children = object.children;

		// This code has been tested against our version of PIXIJS and for Graphics specifically.
		children.sort((a, b) => a.__indexRef - b.__indexRef);

		var end = 0;
		for (var k = 0; k < children.length; k++) {
			var child = children[k];
			if (child.__indexRef < 0) {
				end = k + 1;
			}
			child.__indexRef = -1;
		}

		if (end !== 0) {
			object.removeChildren(0, end);
		}

		object.__indexRef = 0;
	}

	__updateGraphics() {
		this.__GUIgraphics.clear();

		this.getCamera().getCameraGraphics().clear();
		this.getCamera().__tickUpdate();
	}

	__disposeHandles(instance) {
		for (const renderable of instance.__renderables) {
			this.freeRenderable(renderable);
		}
		for (const renderable of instance.__pixiDestructables) {
			this.freeRenderable(renderable);
		}
	}

	__resetPerformanceData() {
		$__engineData.__performanceData = { frameTimes: $__engineData.__performanceData.frameTimes };
	}

	__logPerformance(data, func, thisArg) {
		if (!$__engineData.__debugDrawPerformanceOverlay) {
			func.apply(thisArg);
			return;
		}
		var t = window.performance.now();
		func.apply(thisArg);
		var newPerf = ($__engineData.__performanceData[data.name] || 0) + window.performance.now() - t;
		$__engineData.__performanceData[data.name] = newPerf;
	}

	/**
	 * Enables or disables the debug overlay.
	 *
	 * White - Pause
	 *
	 * Green - Step
	 *
	 * Light Green - Post Step
	 *
	 * Light Blue - Pre Draw
	 *
	 * Blue - Draw
	 *
	 * Yellow - Timescale
	 *
	 * Orange - Engine
	 *
	 * Pink - Render
	 * @param {Boolean} bool Whether or not to show the debug overlay
	 */
	showDebugOverlay(bool) {
		this.__debugLayer.visible = bool;
		$__engineData.__debugDrawPerformanceOverlay = bool;
	}
}

$engine = new Engine(); // create so we always have access to $engine

// Unwrap Utilities
// A utility class that provides access to and hooks into low level RPG maker functions.
// it "unwraps" RPG maker's internals. (also I wanted an excuse to have UwU after I made OwO i'm sorry.)
class UwU {
	constructor() {
		throw new Error("Unwrap Utilities cannot be instantiated");
	}

	static onSceneStart(previousClass, scene) {
		UwU.__lastMapId = UwU.__currentMapId;
		UwU.__currentMapId = $gameMap.mapId();
		UwU.__notifyListenersOfSceneChange(previousClass, scene);
	}

	static onSceneCreate(scene) {
		for (const func of UwU.__onSceneCreateListeners) func(scene);
	}

	static mapIdChanged() {
		return UwU.__lastMapId !== UwU.__currentMapId;
	}

	static __notifyListenersOfSceneChange(previousClass, scene) {
		for (const func of UwU.__onSceneChangeListeners) func(previousClass, scene);
	}

	static lastSceneWasMenu() {
		// .prototype returns the object from the constructor (_previousClass).
		if (!SceneManager._previousClass) return false;
		return SceneManager._previousClass.prototype instanceof Scene_MenuBase;
	}

	static lastSceneWasEngine() {
		// .prototype returns the object from the constructor (_previousClass).
		if (!SceneManager._previousClass) return false;
		return SceneManager._previousClass === Engine;
	}

	static addSceneCreateListener(func) {
		UwU.__onSceneCreateListeners.push(func);
	}

	static removeSceneCreateListener(func) {
		UwU.__onSceneCreateListeners = UwU.__onSceneCreateListeners.filter((x) => x !== func);
	}

	static addSceneChangeListener(func) {
		UwU.__onSceneChangeListeners.push(func);
	}

	static removeSceneChangeListener(func) {
		UwU.__onSceneChangeListeners = UwU.__onSceneChangeListeners.filter((x) => x !== func);
	}

	static sceneIsMenu() {
		return SceneManager._scene instanceof Scene_MenuBase;
	}

	static sceneIsEngine() {
		return SceneManager._scene instanceof Engine;
	}

	static sceneIsOverworld() {
		return SceneManager._scene instanceof Scene_Map;
	}

	static onBeforeSnap(scene) {
		GUIScreen.onBeforeSnap(scene);
	}

	static onAfterSnap(scene) {
		GUIScreen.onAfterSnap(scene);
	}

	static onBeforeRenderScene() {
		for (const listener of UwU.__onBeforeRenderListeners) listener();
	}

	static addRenderListener(func) {
		UwU.__onBeforeRenderListeners.push(func);
	}

	static removeRenderListener(func) {
		var idx = UwU.__onBeforeRenderListeners.indexOf(func);
		if (idx === -1) throw new Error("Cannot remove listener that was not added.");
		UwU.__onBeforeRenderListeners.splice(idx, 1);
	}

	static tick() {
		OwO.tick();
		GUIScreen.tick();
	}
}

UwU.__onSceneChangeListeners = [];
UwU.__onSceneCreateListeners = [];
UwU.__lastMapId = 0;
UwU.__currentMapId = 0;
UwU.__onBeforeRenderListeners = [];

// Overworld Organizer
// I hate myself too.
class OwO {
	constructor() {
		throw new Error("Overworld Organizer cannot be instantiated");
	}

	static __init() {
		UwU.addSceneChangeListener(function (lastClass, newScene) {
			OwO.__spriteMapValid = false;
			if (UwU.mapIdChanged()) {
				OwO.__applyUntilMapChanged();
			}
			if (UwU.sceneIsOverworld()) {
				// any transition into overworld, from any other scene.
				if (UwU.mapIdChanged()) {
					// changed to a new map level
					OwO.__deallocateRenderLayer();
					$gamePlayer._touchTarget = null; // reset the target why doesn't altimit do this like really.
				}
				if (OwO.__renderLayer) {
					OwO.__rebindRenderLayer();
				}

				OwO.__rebindSpecialRenderLayer();
			}
			if (OwO.__renderLayer) {
				OwO.__syncRenderLayer();
			}
		});

		UwU.addRenderListener(function () {
			if (UwU.sceneIsOverworld() && OwO.__renderLayer) {
				OwO.__syncRenderLayer();
			}
		});

		OwO.__specialRenderLayer = new PIXI.Container();

		OwO.__setupRenderLayer();
	}

	static __setupRenderLayer() {
		OwO.__areaNameText = new PIXI.Text("", $engine.getDefaultTextStyle());
		OwO.__areaNameText.anchor.x = 0.5;
		OwO.__areaNameText.anchor.y = 1;
		OwO.__areaNameText.__update = function () {}; // needed for special render layer
		OwO.__specialRenderLayer.addChild(OwO.__areaNameText);
	}

	static __applyUntilTick() {
		for (const obj of OwO.__applyFunctions) {
			obj.resolved = obj.func(obj.data);
		}
		OwO.__applyFunctions = OwO.__applyFunctions.filter((x) => !x.resolved);
	}

	static __applyUntilMapChanged() {
		OwO.__applyFunctions = OwO.__applyFunctions.filter((x) => !x.mapOnly);
	}

	// continually calls func with data as the arg until it returns true, then removes it from it's list
	// mapOnly will cause it to be removed on map change if it wasn't resolved in time.
	static applyUntil(func, data, mapOnly = true) {
		var obj = {
			func: func,
			data: data,
			mapOnly: mapOnly,
			resolved: false,
		};
		OwO.__applyFunctions.push(obj);
	}

	static __getWorldSprites() {
		// this is an array of PIXI objects containing all of the rendered sprites on the world.
		var worldSprites = OwO.getSpriteset().children[0].children[2].children;
		return worldSprites;
	}

	static getSpriteset() {
		return SceneManager._scene._spriteset;
	}

	static forwardInterpreter(eventId) {
		$gameMap._interpreter.setup(OwO.getEvent(eventId).list(), eventId);
	}

	static activateEvent(eventId) {
		OwO.getEvent(eventId)._starting = true;
	}

	static multiEvent(eventId) {
		if ($gameMap._interpreter._lastEventId === eventId) {
			// it already ran, don't do it again.
			return;
		}
		OwO.activateEvent(eventId);
	}

	static randomizeEventLocation(evId, ...locations) {
		if (locations.length % 2 !== 0)
			throw new Error("Supplied location must be in pairs (provided length = " + String(locations.length) + ")");

		var loc = [];
		for (var i = 0; i < locations.length; i += 2) {
			loc.push(new EngineLightweightPoint(locations[i], locations[i + 1]));
		}

		var loc = loc[EngineUtils.irandom(loc.length - 1)];
		var obj = {
			eventId: evId,
			location: loc,
		};

		var data = OwO.__getMapData($gameMap._mapId);
		data.eventLocations.push(obj);

		if (!OwO.__isAutorunSwitchSet()) {
			// convenience.
			OwO.applyEventLocations();
		}
	}

	static getMap() {
		return SceneManager._scene;
	}

	static __buildSpriteMap() {
		// returns an object where an eventId will map to a sprite.
		if (OwO.__spriteMapValid)
			// furthermore, _character will give access to the event that owns the sprite.
			return OwO.__spriteMap;
		// reset event map
		OwO.__spriteMap = {};
		var worldSprites = OwO.__getWorldSprites();
		for (const child of worldSprites) {
			let character = child._character;
			if (character === undefined) continue; // no event attached
			//if(character._eventId===undefined)
			//    throw new Error("No such event ID");
			OwO.__spriteMap[character._eventId] = child;
		}
		OwO.__spriteMapValid = true;
		return OwO.__spriteMap;
	}

	static debugDumpEvents() {
		console.log(OwO.__buildSpriteMap());
	}

	static initializeRenderLayer() {
		OwO.__renderLayerIndex = 0;
		OwO.__deallocateRenderLayer();
		OwO.__renderLayer = new PIXI.particles.ParticleContainer();
		OwO.__rebindRenderLayer();
		OwO.__syncRenderLayer();
	}

	static __deallocateRenderLayer() {
		if (OwO.__renderLayer) {
			OwO.__destroyRenderLayer();
			OwO.getSpriteset().children[0].removeChild(OwO.__renderLayer);
		}
		OwO.__renderLayer = undefined;
	}

	static __rebindRenderLayer() {
		OwO.getSpriteset().children[0].addChild(OwO.__renderLayer);
	}

	static __rebindSpecialRenderLayer() {
		SceneManager._scene.addChild(OwO.__specialRenderLayer);
	}

	static __applyParticleInit() {
		var init = OwO.__getMapData($gameMap._mapId).particleInit;
		if (init === 1) {
			OwO.initializeRenderLayer();
			OwO.leafParticleInit();
		}
	}

	static __renderLayerTick() {
		if (!OwO.__renderLayer || !UwU.sceneIsOverworld()) return;

		if (OwO.__renderLayerController) OwO.__renderLayerController();

		for (const child of OwO.__renderLayer.children) {
			child.__updateFunction(child);
		}
		var children = [];
		for (const child of OwO.__renderLayer.children) children.push(child);

		OwO.__renderLayer.removeChildren();
		children = children.filter((child) => !child._destroyed);
		if (children.length !== 0) {
			children.sort((x, y) => {
				var d = y.depth - x.depth;
				if (d === 0) {
					return x.__id - y.__id;
				}
				return d;
			});
			OwO.__renderLayer.addChild(...children);
		}

		if (OwO.__areaNameTimer < 200) {
			// in
			OwO.__areaNameText.y = EngineUtils.interpolate(
				(OwO.__areaNameTimer - 24) / 30,
				-30,
				45,
				EngineUtils.INTERPOLATE_OUT_EXPONENTIAL
			);
			OwO.__areaNameText.rotation = EngineUtils.interpolate(
				(OwO.__areaNameTimer - 24) / 30,
				0.2,
				0,
				EngineUtils.INTERPOLATE_OUT
			);
			OwO.__areaNameText.scale.y = EngineUtils.interpolate(
				(OwO.__areaNameTimer - 24) / 24,
				1.5,
				1,
				EngineUtils.INTERPOLATE_OUT_BACK
			);
		} else {
			// out
			OwO.__areaNameText.y = EngineUtils.interpolate(
				(OwO.__areaNameTimer - 200) / 60,
				45,
				-10,
				EngineUtils.INTERPOLATE_IN_BACK
			);
			OwO.__areaNameText.rotation = EngineUtils.interpolate(
				(OwO.__areaNameTimer - 200) / 60,
				0,
				-0.1,
				EngineUtils.INTERPOLATE_IN
			);
			OwO.__areaNameText.scale.y = EngineUtils.interpolate(
				(OwO.__areaNameTimer - 200) / 60,
				1,
				1.5,
				EngineUtils.INTERPOLATE_IN_BACK
			);
		}

		if (OwO.__areaNameTimer < 260) {
			OwO.__areaNameText.scale.x = Math.sin(OwO.__RPGgameTimer / 32) / 32 + 1;
			OwO.__areaNameText.y += Math.cos(OwO.__RPGgameTimer / 13);
			OwO.__areaNameText.x = $engine.getWindowSizeX() / 2 + Math.sin(OwO.__RPGgameTimer / 27) * 2;
		}

		if (OwO.__specialRenderLayer.children.length === 1) {
			// if the area text is the only text, render it
			OwO.__areaNameTimer++;
		} else if (OwO.__areaNameTimer < 30) {
			// reset if interrupted
			OwO.__areaNameTimer = 0;
		} else {
			OwO.__areaNameTimer = 260; // end
		}
	}

	static __specialRenderLayerTick() {
		if (!UwU.sceneIsOverworld() && !UwU.sceneIsEngine()) {
			return;
		}
		for (const child of OwO.__specialRenderLayer.children) {
			child.__update(child);
		}
		for (var i = OwO.__specialRenderLayer.children.length - 1; i >= 0; i--) {
			if (OwO.__specialRenderLayer.children._destroyed) {
				OwO.__specialRenderLayer.removeChildAt(i);
			}
		}
	}

	static addTooltip(tip, time = 400) {
		var style = $engine.getDefaultTextStyle();
		var text = new PIXI.Text(tip, style);
		text.x = $engine.getWindowSizeX() / 2;
		text.y = 0 - text.height;
		text.anchor.x = 0.5;
		text.anchor.y = 0.5;
		text.__timer = 0;
		text.__lifetime = time;
		text.__y1 = -50;
		var last = OwO.__specialRenderLayer.children[OwO.__specialRenderLayer.children.length - 1];
		if (last && last.__y2 !== undefined) {
			last = last.__y2;
		} else {
			last = 0;
		}
		text.__y2 = 30 + last;
		text.__update = function (self) {
			var sinFac1 = Math.sin(OwO.getGameTimer() / 26);
			var sinFac2 = Math.sin((OwO.getGameTimer() + 9) / 23);

			self.scale.x = 1 + sinFac1 / 32;
			self.scale.y = 1 + sinFac2 / 32;
			self.rotation = 0;

			if (self.__timer <= 75) {
				var fac = self.__timer / 75;
				fac = EngineUtils.interpolate(fac, self.__y1, self.__y2, EngineUtils.INTERPOLATE_IN_ELASTIC);
				self.y = fac;
				self.rotation = (1 - fac / self.__y2) / 16;
			}

			var num = self.__lifetime - 40;
			if (self.__timer >= num) {
				var fac = (self.__timer - num) / (self.__lifetime - num);
				fac = EngineUtils.interpolate(fac, self.__y2, self.__y1, EngineUtils.INTERPOLATE_IN_QUAD);
				self.y = fac;
				self.alpha = fac / self.height;
				self.rotation = -(1 - fac / self.__y2) / 16;
			}

			self.rotation += sinFac2 / 64;

			if (self.__timer > self.__lifetime) $engine.freeRenderable(self);
			self.__timer++;
		};
		OwO.__specialRenderLayer.addChild(text);
	}

	static __syncRenderLayer() {
		OwO.__renderLayer.x = -$gameMap.displayX() * 48;
		OwO.__renderLayer.y = -$gameMap.displayY() * 48;
	}

	static addToRenderLayer(pixiObj, updateFunc = function () {}) {
		pixiObj.__updateFunction = updateFunc;
		OwO.__renderLayer.addChild(pixiObj);
		pixiObj.depth = 0;
		pixiObj.__id = OwO.__renderLayerIndex++;
		return pixiObj;
	}

	static setRenderLayerController(func) {
		OwO.__renderLayerController = func;
	}

	static leafParticleInit() {
		var createLeaf = function (xx, yy) {
			var obj = OwO.addToRenderLayer(
				new PIXI.Sprite($engine.getRandomTextureFromSpritesheet("leaf_particles_small")),
				function (spr) {
					spr.x += spr.randX;
					spr.y += spr.randY;
					spr.randY += spr.dy;
					spr.rotation = Math.sin(spr.randOffset + OwO.getGameTimer() / spr.randRotSpeed) + spr.randRotOffset;
					spr.scale.y = Math.sin(spr.randFlipOffset + OwO.getGameTimer() / spr.randFlipSpeed) * spr.origScaleY;
					if (Math.abs(spr.scale.y) < 0.1) spr.scale.y = 0.1 * Math.sign(spr.scale.y);
					if (spr.x >= OwO.getRenderLayerRight() + 512) OwO.destroyObject(spr);
				}
			);
			obj.scale.x = EngineUtils.randomRange(0.5, 1);
			obj.origScaleY = EngineUtils.randomRange(0.5, 1);
			obj.randX = EngineUtils.randomRange(3, 7);
			obj.randY = EngineUtils.randomRange(-2, 2);
			obj.randOffset = EngineUtils.random(Math.PI);
			obj.randRotSpeed = EngineUtils.randomRange(20, 64);
			obj.randRotOffset = EngineUtils.random(Math.PI * 2);
			obj.randFlipSpeed = EngineUtils.randomRange(10, 24);
			obj.randFlipOffset = EngineUtils.random(Math.PI * 2);
			obj.dy = EngineUtils.randomRange(-0.02, 0.02);
			obj.x = xx;
			obj.y = yy;
		};

		var controller = function () {
			if (OwO.getGameTimer() % 3 === 0) {
				var xx = OwO.getRenderLayerLeft() - 128;
				var yy = EngineUtils.randomRange(OwO.getRenderLayerTop() - 512, OwO.getRenderLayerBottom() + 512);
				createLeaf(xx, yy);
			}
		};
		for (var i = 0; i < 100; i++) {
			var xx = EngineUtils.randomRange(OwO.getRenderLayerLeft() - 128, OwO.getRenderLayerRight() + 512);
			var yy = EngineUtils.randomRange(OwO.getRenderLayerTop() - 512, OwO.getRenderLayerBottom() + 512);
			createLeaf(xx, yy);
		}
		OwO.setRenderLayerController(controller);
		OwO.__getMapData($gameMap._mapId).particleInit = 1;
	}

	static destroyObject(obj) {
		obj.destroy();
		obj._destroyed = true;
	}

	static __destroyRenderLayer() {
		OwO.__renderLayer.destroy({ children: true }); // free the entire layer
	}

	static getBoxWidth() {
		return Graphics.boxWidth;
	}

	static getRenderLayerLeft() {
		return -OwO.__renderLayer.x;
	}

	static getRenderLayerTop() {
		return -OwO.__renderLayer.y;
	}

	static getRenderLayerRight() {
		return -OwO.__renderLayer.x + OwO.getBoxWidth();
	}

	static getRenderLayerBottom() {
		return -OwO.__renderLayer.y + OwO.getBoxHeight();
	}

	static getBoxHeight() {
		return Graphics.boxWidth;
	}

	static getGameTimer() {
		return OwO.__RPGgameTimer;
	}

	// alias.
	static getPlayer() {
		return $gamePlayer;
	}

	// gets an event.
	static getEvent(id) {
		var event = $gameMap.event(id);
		if (!event) {
			throw new Error("Attempting to find non existent event " + String(id));
		}
		return event;
	}

	static distanceToPlayer(event) {
		var player = OwO.getPlayer();
		return V2D.distance(event._x, event._y, player._x, player._y);
	}

	// this method runs once per frame no matter what
	static tick() {
		OwO.__renderLayerTick();
		OwO.__specialRenderLayerTick();
		if (!UwU.sceneIsMenu()) {
			OwO.__RPGgameTimer++;
		}
		OwO.__applyUntilTick();
	}

	static __defaultFilterUpdateFunc(filter, event) {
		var dist = 5;
		var strength = 4;
		var newStrength = EngineUtils.interpolate(
			(dist - EngineUtils.clamp(OwO.distanceToPlayer(event), 0, dist)) / dist,
			0,
			strength,
			EngineUtils.INTERPOLATE_OUT
		);
		var correction = Math.sin(OwO.getGameTimer() / 18) * 0.25 + 0.75; // between 0.5 and 1
		filter.thickness = newStrength * correction;
		filter.enabled = filter.thickness !== 0;
	}

	static __getDefaultOutlineShader() {
		return new PIXI.filters.OutlineFilter(4, 0xffffff);
	}
}
OwO.__renderLayerIndex = 0;
OwO.__renderLayer = undefined;
OwO.__specialRenderLayer = undefined;
OwO.__renderLayerController = undefined;
OwO.__spriteMapValid = false;
OwO.__spriteMap = {};
OwO.__applyFunctions = [];
OwO.__RPGgameTimer = 0;
OwO.__areaNameTimer = 99999;
OwO.__hungerColourFilter = new PIXI.filters.AdjustmentFilter();
OwO.__timeOfDayFilter = new PIXI.filters.AdjustmentFilter();
OwO.__zoomBlurFilter = new PIXI.filters.ZoomBlurFilter();
OwO.__hudRedGlowFilter = new PIXI.filters.GlowFilter();
OwO.__zoomBlurFilter.center = new PIXI.Point(816 / 2, 624 / 2);
OwO.__zoomBlurFilter.strength = 0;
OwO.__zoomBlurFilter.innerRadius = 300;
OwO.__gameFilters = [OwO.__hungerColourFilter, OwO.__zoomBlurFilter];
OwO.__timeOfDayIndex = 11;
OwO.__ignoreHpChanges = false;
OwO.__init();
UwU.addSceneCreateListener(OwO.__rebindSpecialRenderLayer);
UwU.addSceneChangeListener(OwO.__rebindSpecialRenderLayer);

OwO.__hudRedGlowFilter.color = 0xff0000;

class GUIScreen {
	// static class for stuff like the custom cursor. always running.

	static tick() {
		GUIScreen.__updateMouseLocation();
		// GUIScreen.__renderMouse();
		GUIScreen.__saveTextTick();
		GUIScreen.__loadingTextTick();
		GUIScreen.__timer++;
	}

	static __sceneCreate(scene) {
		GUIScreen.__bindContainer();
	}

	static __sceneStart(scene) {
		GUIScreen.__bindContainer();
	}

	static __bindContainer() {
		SceneManager._scene.addChild(GUIScreen.__container); // bind directly to the scene
		// must do it late because Graphics doesn't exist yet
		GUIScreen.__saveText.x = $engine.getWindowSizeX();
		GUIScreen.__saveText.y = 0;
		GUIScreen.__saveImage.x = $engine.getWindowSizeX();
		GUIScreen.__saveImage.y = GUIScreen.__saveImage.height / 2;

		GUIScreen.__loadingText.x = $engine.getWindowSizeX();
		GUIScreen.__loadingText.y = $engine.getWindowSizeY();

		GUIScreen.__saveImage.dirty = true;
		/*if($engine.isLow()) {
            GUIScreen.__graphics.filters = []
        } else {
            GUIScreen.__graphics.filters = [GUIScreen.__filter]
        }*/
	}

	static __init() {
		GUIScreen.__filter = new PIXI.filters.OutlineFilter(1, 0xffffff);
		GUIScreen.__graphics.filters = [GUIScreen.__filter];

		var style = $engine.getDefaultSubTextStyle();
		GUIScreen.__saveText = new PIXI.Text("", style);
		GUIScreen.__saveText.anchor.x = 1;
		GUIScreen.__saveText.anchor.y = 0;
		GUIScreen.__saveTextIndex = 999;

		GUIScreen.__saveImage = new PIXI.Text("Saving", style);
		GUIScreen.__saveImage.anchor.x = 1;
		GUIScreen.__saveImage.anchor.y = 0.5;
		GUIScreen.__saveImage.alpha = 0;
		//GUIScreen.__container.addChild(GUIScreen.__graphics); // unused because render is delayed
		GUIScreen.__graphics.filters = [GUIScreen.__filter];
		GUIScreen.__container.addChild(GUIScreen.__saveText, GUIScreen.__saveImage);

		GUIScreen.__loadingText = new PIXI.Text("", style);
		GUIScreen.__loadingText.anchor.set(1);
		GUIScreen.__loadingText.alpha = 0.2;
		GUIScreen.__loadingTextTimer = 0;
		GUIScreen.__container.addChild(GUIScreen.__loadingText);
	}

	static __loadingTextTick() {
		if ($__engineData.__loadedDeferredAssets === -1) {
			if ($__engineData.__assetCount === 0) {
				GUIScreen.__loadingText.text = "Starting...";
			} else {
				GUIScreen.__loadingText.text =
					Number(($__engineData.__loadedAssetCount / $__engineData.__assetCount) * 100).toFixed(2) + "%";
			}

			return;
		}

		if ($__engineData.__loadedDeferredAssets === $__engineData.__deferredAssets) {
			if (GUIScreen.__loadingTextTimer >= 36) {
				return;
			}
			GUIScreen.__loadingTextTimer++;
			GUIScreen.__loadingText.alpha = 0.2 - GUIScreen.__loadingTextTimer / 180;
		}

		GUIScreen.__loadingText.text =
			String($__engineData.__loadedDeferredAssets) +
			" / " +
			String($__engineData.__deferredAssets) +
			" assets loaded...";
	}

	static __saveTextTick() {
		GUIScreen.__saveTextTimer++;
		// fake save screen. Done to make yevhen happy.
		// show a 'saving' image for a 0.5 - 1 second before saying game saved.
		if (GUIScreen.__saveTextStartTime >= GUIScreen.__saveTextTimer) {
			var alphaFac = EngineUtils.interpolate(
				GUIScreen.__saveTextTimer / 35,
				0,
				0.66666,
				EngineUtils.INTERPOLATE_SMOOTH
			);
			var scaleFac = Math.sin(GUIScreen.__saveTextTimer / 12) / 35 + 1;
			GUIScreen.__saveImage.alpha = alphaFac;
			GUIScreen.__saveImage.scale.set(scaleFac);

			var endOffset = 4;
			if (GUIScreen.__saveTextTimer >= GUIScreen.__saveTextStartTime - endOffset) {
				var fac2 = EngineUtils.interpolate(
					(GUIScreen.__saveTextStartTime - GUIScreen.__saveTextTimer) / endOffset,
					0,
					0.66666,
					EngineUtils.INTERPOLATE_OUT
				);
				GUIScreen.__saveImage.alpha = fac2;
			}

			if (GUIScreen.__saveTextStartTime === GUIScreen.__saveTextTimer) {
				GUIScreen.__saveTextTimer = 0;
				GUIScreen.__saveTextStartTime = -1;
				GUIScreen.__saveImage.alpha = 0;
				GUIScreen.__saveText.alpha = 0.666666;
				GUIScreen.__saveText.text = "";
			} else {
				return;
			}
		}
		if (GUIScreen.__saveTextIndex < GUIScreen.__saveGameString.length) {
			if (GUIScreen.__saveTextTimer % 5 === 0) {
				GUIScreen.__saveTextIndex++;
				GUIScreen.__saveText.text = GUIScreen.__saveGameString.substring(0, GUIScreen.__saveTextIndex);
			}
		}
		if (GUIScreen.__saveTextTimer <= 6) {
			var fac = EngineUtils.interpolate(GUIScreen.__saveTextTimer / 6, 0, 0.66666, EngineUtils.INTERPOLATE_IN);
			GUIScreen.__saveText.alpha = fac;
		}
		if (GUIScreen.__saveTextTimer > 240 + GUIScreen.__saveTextStartTime) {
			var fac = EngineUtils.interpolate(
				(GUIScreen.__saveTextTimer - 240) / 60,
				0.666666,
				0,
				EngineUtils.INTERPOLATE_OUT
			);
			GUIScreen.__saveText.alpha = fac;
		}
	}

	static showSave() {
		GUIScreen.__saveTextIndex = 0;
		GUIScreen.__saveTextTimer = 0;
		GUIScreen.__saveTextStartTime = EngineUtils.irandomRange(40, 90); // fake save screen
		GUIScreen.__saveText.alpha = 0;
		GUIScreen.__saveImage.alpha = 0;
	}

	static __renderMouse() {
		var graphics = GUIScreen.__graphics;
		var locations = GUIScreen.__mousePoints;
		var length = GUIScreen.__mousePoints.length;
		if (length === 0) return;
		//graphics.cursor = undefined
		graphics.clear();
		graphics.moveTo(locations[0].x, locations[0].y);
		var size = length;
		var points = [];
		// code by Homan, https://stackoverflow.com/users/793454/homan
		// source: https://stackoverflow.com/a/7058606
		for (var i = 0; i < length - 1; i++) {
			graphics.lineStyle(size - i, 0);
			var xc = (locations[i].x + locations[i + 1].x) / 2;
			var yc = (locations[i].y + locations[i + 1].y) / 2;
			points.push(new EngineLightweightPoint(xc, yc));
			graphics.quadraticCurveTo(locations[i].x, locations[i].y, xc, yc);
		}
		graphics.lineStyle(0);
		graphics.beginFill(0);
		graphics.drawCircle(locations[0].x, locations[0].y, (size - 1) / 2);
		for (var i = 0; i < length - 1; i++) {
			graphics.drawCircle(points[i].x, points[i].y, (size - i) / 2);
		}
		graphics.endFill();
	}

	static __mouseMoveHandler(event) {
		GUIScreen.__mouseDirect = new EngineLightweightPoint(event.clientX, event.clientY);
	}

	static __updateMouseLocation() {
		if (!GUIScreen.__mouseDirect) return;
		if (!Graphics._renderer) return;
		var locCorrected = Graphics._renderer.plugins.interaction.mouse.getLocalPosition(
			GUIScreen.__graphics,
			GUIScreen.__mouseDirect
		);
		GUIScreen.__mouse = locCorrected;

		GUIScreen.__mousePoints.unshift(new EngineLightweightPoint(GUIScreen.__mouse.x, GUIScreen.__mouse.y));
		if (GUIScreen.__mousePoints.length > GUIScreen.__maxMousePoints) GUIScreen.__mousePoints.pop();
	}

	static onBeforeSnap(scene) {
		scene.removeChild(GUIScreen.__graphics);
	}

	static onAfterSnap(scene) {
		GUIScreen.__bindContainer();
	}
}

GUIScreen.__container = new PIXI.Container();
GUIScreen.__graphics = new PIXI.Graphics();
GUIScreen.__mouse = undefined;
GUIScreen.__updateMouseLocation();
GUIScreen.__mousePoints = [];
GUIScreen.__maxMousePoints = 10;
GUIScreen.__maxMouseTrailLength = 10;
GUIScreen.__timer = 0;
GUIScreen.__saveTextTimer = 0;
GUIScreen.__saveTextStartTime = -1;
GUIScreen.__saveGameString = "Game saved. . . ";
GUIScreen.__init();
// UwU.addRenderListener(GUIScreen.tick);
document.addEventListener("pointermove", GUIScreen.__mouseMoveHandler); // fix one frame lag.
UwU.addSceneCreateListener(GUIScreen.__sceneCreate);
UwU.addSceneChangeListener(GUIScreen.__sceneStart);

(function () {
	// calling of this is defered until scene boot. If we call it any earlier,
	// the engine early start won't work because it has to wait for RPG maker
	__initialize = function () {
		var obj = {
			deferredTextures: [],
			deferredSounds: [],
			instanceRef: [],
			count: 0,
			scripts: 0,
			textures: 0,
			rooms: 0,
			instances: 0,
			sounds: 0,
			elements: 0,
			time: window.performance.now(),
			total: 0,
			deferredAssets: 0,
			valid: false, // don't let the engine falsely think it's ready
			onNextLoaded: function () {
				this.count++;
				$__engineData.__loadedAssetCount++;
				this.testComplete();
			},
			testComplete: function () {
				if (this.count === this.total && this.valid && this.elements === 5)
					// all loaded
					this.onComplete();
			},
			onComplete: function () {
				__initializeDone(this);
			},
			validate: function () {
				this.valid = true;
				if (this.count === this.total && this.elements === 5)
					// already loaded everything, proceed. 5 = (scripts, rooms, textures, instances, sounds)
					this.onComplete();
			},
		};
		__prepareScripts("engine/scripts_manifest.txt", obj);
		__readInstances("engine/instances_manifest.txt", obj);
		__readRooms("engine/rooms_manifest.txt", obj);
		__readTextures("engine/textures_manifest.txt", obj);
		__readSounds("engine/sounds_manifest.txt", obj);
		obj.validate();
	};

	let __initializeDone = function (obj) {
		IM.__init(obj.instanceRef);
		__setupInternalData(obj);
		RoomManager.__init();
		console.log("Loaded all required assets! ->", window.performance.now() - obj.time, "ms");
		$__engineData.__ready = true;
		__finishReading(obj);
	};

	let __setupInternalData = function (obj) {
		// defalt sprites
		const o = {};
		for (const inst of obj.instanceRef) {
			const spr = $__engineData.__defaultSprites[inst];
			if (!spr) {
				continue;
			}
			o[IM.__oidFrom(inst)] = spr;
		}
		$__engineData.__defaultSprites = o;
		// class lookup
		for (const inst of obj.instanceRef) {
			$__engineData.__classLookup[inst.name] = inst;
		}
	};

	let __finishReading = function (obj) {
		$__engineData.__deferredAssets = 0;
		$__engineData.__loadedDeferredAssets = 0;

		const isDone = function () {
			if (++$__engineData.__loadedDeferredAssets === $__engineData.__deferredAssets) {
				var msg =
					"(" +
					String(obj.scripts) +
					(obj.scripts !== 1 ? " scripts, " : " script, ") +
					String(obj.textures) +
					(obj.textures !== 1 ? " textures, " : " texture, ") +
					String(obj.rooms) +
					(obj.rooms !== 1 ? " rooms, " : " room, ") +
					String(obj.sounds) +
					(obj.sounds !== 1 ? " sounds, " : " sound, ") +
					String(obj.instances) +
					(obj.instances !== 1 ? " instances) ->" : " instance) ->");
				console.log(
					"Loaded remaining " + String(obj.deferredAssets) + " assets! Asset summary:",
					msg,
					window.performance.now() - obj.time,
					" ms"
				);
				$__engineData.__fullyReady = true;
			}
		};

		for (const soundObj of obj.deferredSounds) {
			$__engineData.__deferredAssets++;
			__loadSound(obj, soundObj, () => {
				isDone();
			});
		}
		for (const texObj of obj.deferredTextures) {
			$__engineData.__deferredAssets++;
			__loadTexture(obj, texObj, () => {
				isDone();
			});
		}
	};

	let __defineAssetSource = function (asset, source) {
		$__engineData.__assetSources.set(asset, source);
	};

	let __prepareScripts = function (script_file, obj) {
		// code by Matt Ball, https://stackoverflow.com/users/139010/matt-ball
		// Source: https://stackoverflow.com/a/4634669
		const callback = function (fileData) {
			var data = EngineUtils.strToArrNewline(fileData);
			for (const x of data) {
				obj.total++;
				obj.scripts++;
				obj.assetCount++;
				$__engineData.__assetCount++;
				EngineUtils.attachScript(x, obj.onNextLoaded.bind(obj));
			}
			obj.elements++;
			obj.testComplete(); // update the obj
		};
		EngineUtils.readLocalFileAsync(script_file, callback);
	};

	let __readRooms = function (room_file, obj) {
		const callback = function (fileData) {
			var data = EngineUtils.strToArrNewline(fileData);
			for (const x of data) {
				const arr = EngineUtils.strToArrWhitespace(x); // 0 = name, 1 = file
				const name = arr[0];
				const roomPath = arr[1];
				obj.rooms++;
				obj.total++;
				obj.assetCount++;
				$__engineData.__assetCount++;
				const isDefault = arr.length > 2 && arr[2] === "default";
				if (isDefault) {
					$__engineData.__loadRoom = name;
				}
				const callback_full_load = function (room) {
					RoomManager.__addRoom(name, room);
					RoomManager.__addRoom(name, room);
					__defineAssetSource(room, roomPath);
					if (isDefault) {
						RoomManager.__addRoom(RoomManager.__DEFAULT_ROOM_NAME, room);
					}
					obj.onNextLoaded();
				};
				const callback_room = function (text) {
					const roomData = EngineUtils.strToArrNewline(text);
					Room.__roomFromData(name, roomData, callback_full_load);
				};
				EngineUtils.readLocalFileAsync(roomPath, callback_room);
			}
			obj.elements++;
			obj.testComplete(); // update the obj
		};
		EngineUtils.readLocalFileAsync(room_file, callback);
	};

	let __readInstances = function (instance_file, obj) {
		var callback = function (fileData) {
			const data = EngineUtils.strToArrNewline(fileData);

			for (const x of data) {
				const arr = EngineUtils.strToArrWhitespace(x);
				const instanceCount = arr.length - 1;
				obj.total++;
				obj.scripts++;
				$__engineData.__assetCount++;
				for (let i = 0; i < instanceCount; i++) {
					if (!arr[i].startsWith("spr=")) {
						obj.instances++;
						obj.total++;
						$__engineData.__assetCount++;
					}
				}
				obj.onNextLoaded(); // count the script
				var lastInst = undefined;
				var c = function () {
					for (let i = 0; i < instanceCount; i++) {
						if (arr[i].startsWith("spr=")) {
							const spr = arr[i].substring(4);
							if (!lastInst) {
								throw new Error("Defining default sprite without supplying instance");
							}
							$__engineData.__defaultSprites[lastInst] = spr;
							continue;
						}
						const inst = eval(arr[i]);
						__defineAssetSource(inst, arr[instanceCount]);

						obj.instanceRef.push(inst);
						lastInst = inst;
						obj.onNextLoaded();
					}
				};
				EngineUtils.attachScript(arr[instanceCount], c);
			}

			obj.elements++;
			obj.testComplete(); // update the obj
		};
		EngineUtils.readLocalFileAsync(instance_file, callback);
	};

	let __readSounds = function (sound_file, obj) {
		var callback = function (fileData) {
			const data = EngineUtils.strToArrNewline(fileData);

			var required = [];

			for (const x of data) {
				const arr = EngineUtils.strToArrWhitespace(x);
				obj.sounds++;
				obj.assetCount++;
				var soundObj = {
					alias: arr[arr.length - 3],
					path: arr[arr.length - 2],
					type: arr[arr.length - 1],
				};

				if ((arr.length > 3 && arr[0] === "require") || $__engineData.__debugRequireAllSounds) {
					required.push(soundObj);
				} else {
					obj.deferredSounds.push(soundObj);
					obj.deferredAssets++;
				}
			}

			for (const soundObj of required) {
				obj.total++;
				$__engineData.__assetCount++;
				__loadSound(obj, soundObj, () => {
					obj.onNextLoaded();
				});
			}

			obj.elements++;
			obj.testComplete(); // update the obj
		};
		EngineUtils.readLocalFileAsync(sound_file, callback);
	};

	let __loadSound = function (obj, soundObj, callback) {
		var options = {
			url: soundObj.path,
			preload: true,
			autoPlay: false,
			loaded: callback,
			volume: 1,
		};
		const sound = PIXI.sound.Sound.from(options);
		sound.__type = soundObj.type;
		$__engineData.__soundCache[soundObj.alias] = sound;
		__defineAssetSource(sound, soundObj.path);
		sound.__engineAlias = soundObj.alias;
	};

	let __readTextures = function (texture_file, obj) {
		// already sync
		const callback = function (fileData) {
			var data = EngineUtils.strToArrNewline(fileData);
			var texData = [];
			// parse raw data into objects
			for (const d of data) {
				const arr = EngineUtils.strToArrWhitespace(d);

				if (arr.length < 4) throw new Error('Texture command "' + String(d) + '" contains less than 4 tokens.');

				const type = arr[0];
				let len = arr.length;
				let name = undefined;
				let path = undefined;
				let dx = undefined;
				let dy = undefined;
				if (type.toLowerCase() === "animate") {
					name = arr[len - 1];
				} else {
					name = arr[len - 4];
					path = arr[len - 3];
					dx = parseFloat(arr[len - 2]);
					dy = parseFloat(arr[len - 1]);
					arr.length = arr.length - 4; // remove the last 4 elements from the array
				}

				var texObj = {
					texArgs: arr,
					texName: name,
					texPath: path,
					texOrigX: dx,
					texOrigY: dy,
				};

				texData.push(texObj);
			}

			// parse the textObjs
			var required = [];
			for (const texObj of texData) {
				__parseTextureObject(texObj);
				if (__queryTextureObject(texObj, "require") || $__engineData.__debugRequireAllTextures) {
					required.push(texObj);
				} else {
					obj.deferredTextures.push(texObj);
					obj.deferredAssets++;
				}
			}
			for (const texObj of required) {
				__loadTexture(obj, texObj, () => {
					obj.onNextLoaded();
				});
			}

			obj.elements++;
			obj.testComplete(); // update the obj
		};
		EngineUtils.readLocalFileAsync(texture_file, callback);
	};

	let __setAnchor = function (tex, x, y) {
		if (x === -1) x = 0.5;
		if (y === -1) y = 0.5;
		if (x > 1) x = x / tex.width;
		if (y > 1) y = y / tex.height;
		tex.defaultAnchor = new PIXI.Point(x, y);
	};

	let __loadTexture = function (obj, texObj, update) {
		var spritesheet = __queryTextureObject(texObj, "spritesheet");
		var animate = __queryTextureObject(texObj, "animate");
		if (spritesheet) {
			obj.textures++;
			obj.total++;
			$__engineData.__assetCount++;
			const tex = PIXI.Texture.from(texObj.texPath);
			__defineAssetSource(tex, texObj.texPath);
			tex.on("update", () => {
				__generateTexturesFromSheet(tex, texObj, spritesheet);
				__generateAnimationsFromSheet(texObj, spritesheet);
				__generateAliasesFromSheet(texObj, spritesheet);
				update();
			});
		} else if (animate) {
			var frames = [];
			for (const tex of animate.textures) {
				var frameTexture = $__engineData.__textureCache[tex];
				if (!frameTexture)
					throw new Error(
						"Texture " + tex + " cannot be found! make sure the texture is referenced before the animation"
					);
				frames.push(frameTexture);
			}
			$__engineData.__textureAnimationCache[texObj.texName] = frames;
			__defineAssetSource(frames, texObj.texPath);
			obj.textures++;
			obj.total++;
			$__engineData.__assetCount++;
			update();
		} else {
			obj.textures++;
			obj.total++;
			$__engineData.__assetCount++;
			const tex = PIXI.Texture.from(texObj.texPath);
			__defineAssetSource(tex, texObj.texPath);
			tex.on("update", () => {
				__setAnchor(tex, texObj.texOrigX, texObj.texOrigY);
				update();
			});
			$__engineData.__textureCache[texObj.texName] = tex;
		}
	};

	let __generateTexturesFromSheet = function (texture, texObj, spritesheet) {
		// replaces PIXI's internal spritesheet generator, which does more or less the same thing
		// note: texture is guaranteed to have been loaded when this is called.
		var cols = spritesheet.numColumns;
		var rows = spritesheet.numRows;
		var dx = spritesheet.xSize / spritesheet.numColumns; // normalized
		var dy = spritesheet.ySize / spritesheet.numRows;
		var baseName = texObj.texName + "_";
		var idx = 0;
		for (var y = 0; y < rows; y++) {
			for (var x = 0; x < cols; x++) {
				if (spritesheet.frameLimit[y] !== undefined && x >= spritesheet.frameLimit[y]) {
					break;
				}
				let rect = new PIXI.Rectangle(dx * x, dy * y, dx, dy);
				let tex = new PIXI.Texture(texture, rect);
				__setAnchor(tex, texObj.texOrigX, texObj.texOrigY);
				$__engineData.__textureCache[baseName + String(idx++)] = tex;
				__defineAssetSource(tex, texObj.texPath);
			}
		}
		$__engineData.__spritesheets[texObj.texName] = idx; // store the amount fo frames on a spritesheet
	};

	let __generateAnimationsFromSheet = function (texObj, spritesheet) {
		var baseName = texObj.texName + "_";
		for (const anim of spritesheet.anims) {
			var frames = [];
			var name = anim.animName;
			for (const idx of anim.animFrames) frames.push($engine.getTexture(baseName + String(idx)));
			$__engineData.__textureAnimationCache[name] = frames;
			__defineAssetSource(frames, texObj.texPath);
		}
	};

	let __generateAliasesFromSheet = function (texObj, spritesheet) {
		var baseName = texObj.texName + "_";
		for (const alias of spritesheet.aliases) {
			var targetName = baseName + String(alias.index);
			var target = $__engineData.__textureCache[baseName + String(alias.index)];
			if (!target) {
				throw new Error(
					'Alias target "' + targetName + '" for spritesheet "' + texObj.texName + '" does not exist in texture cache.'
				);
			}
			$__engineData.__textureCache[alias.name] = target;
		}
	};

	let __parseTextureObject = function (texObj) {
		var argsParsed = [];
		var args = texObj.texArgs;
		for (var i = 0; i < args.length; i++) {
			var arg = args[i].toLowerCase();
			if (arg === "require") {
				argsParsed.push({ key: "require", value: true });
			} else if (arg === "animate") {
				i = __parseAnimation(argsParsed, args, i);
			} else if (arg === "spritesheet") {
				i = __parseSpritesheet(argsParsed, args, i);
			}
		}
		texObj.texArgs = argsParsed;
	};

	let __parseAnimation = function (argsParsed, args, i) {
		var texNames = [];
		i++;
		for (; i < args.length - 1; i++) {
			texNames.push(args[i]);
		}
		argsParsed.push({
			key: "animate",
			value: {
				textures: texNames,
			},
		});
		return i;
	};

	let __parseSpritesheet = function (argsParsed, args, i) {
		var dimensionX = -1;
		var dimensionY = -1;
		var columns = -1;
		var rows = -1;
		var limit = [];
		var animations = [];
		var aliases = [];
		i++;
		for (; i < args.length; i++) {
			var arg = args[i].toLowerCase();
			if (arg === "dimensions") {
				dimensionX = parseInt(args[++i]);
				dimensionY = parseInt(args[++i]);
				columns = parseInt(args[++i]);
				rows = parseInt(args[++i]);
			} else if (arg === "limit") {
				if (rows === -1) throw new Error("Cannot limit before supplying dimensions");
				for (var k = 0; k < rows; k++) {
					limit.push(parseInt(args[++i]));
				}
			} else if (arg === "animate") {
				const animationName = args[++i];
				const animationLength = parseInt(args[++i]);
				const animationFrames = [];
				for (var j = 0; j < animationLength; j++) {
					animationFrames.push(parseInt(args[++i]));
				}
				animations.push({
					animName: animationName,
					animFrames: animationFrames,
				});
			} else if (arg === "alias") {
				const texIndex = args[++i];
				const alias = args[++i];
				aliases.push({
					index: texIndex,
					name: alias,
				});
			} else {
				throw new Error('Unknown argument in spritesheet "' + String(arg) + '" at token index ' + String(i));
			}
		}
		argsParsed.push({
			key: "spritesheet",
			value: {
				xSize: dimensionX,
				ySize: dimensionY,
				numColumns: columns,
				numRows: rows,
				frameLimit: limit,
				anims: animations,
				aliases: aliases,
			},
		});
		return i;
	};

	let __queryTextureObject = function (texObj, key) {
		for (var i = 0; i < texObj.texArgs.length; i++) {
			if (texObj.texArgs[i].key === key) {
				return texObj.texArgs[i].value;
			}
		}
		return undefined;
	};

	Scene_Boot.prototype.start = function () {
		// load the engine global save data
		let json = StorageManager.load(-2);
		if (json) {
			$__engineGlobalSaveData = JSON.parse(json);
		} else {
			$__engineGlobalSaveData = {};
		}
		// Go to engine on boot
		Scene_Base.prototype.start.call(this);
		SoundManager.preloadImportantSounds();
		if (DataManager.isBattleTest()) {
			DataManager.setupBattleTest();
			SceneManager.goto(Scene_Battle);
		} else if (DataManager.isEventTest()) {
			DataManager.setupEventTest();
			SceneManager.goto(Scene_Map);
		} else {
			this.checkPlayerLocation();
			DataManager.setupNewGame();
			if ($__engineData.__loadRoom !== null) {
				SceneManager.goto(Engine);
			} else {
				SceneManager.goto(Scene_Title);
			}

			Window_TitleCommand.initCommandPosition();
		}
		this.updateDocumentTitle();
	};

	// Scene_Gameover.prototype.gotoTitle = function () {
	// 	$__engineData.__loadRoom = "MenuIntro";
	// 	SceneManager.goto(Engine);
	// };

	// // take over menu
	// Scene_GameEnd.prototype.commandToTitle = function () {
	// 	this.fadeOutAll();
	// 	$__engineData.__loadRoom = "MenuIntro";
	// 	SceneManager.goto(Engine);
	// };

	Scene_Boot.prototype.create = function () {
		// defer loading of the engine until as late as possible so that RPG maker calls are evaluated first.
		Scene_Base.prototype.create.call(this);
		DataManager.loadDatabase();
		ConfigManager.load();
		this.loadSystemWindowImage();
		this.__hasCalledInit = false;
	};

	Scene_Boot.prototype.isReady = function () {
		if (DataManager.isDatabaseLoaded() && !this.__hasCalledInit) {
			this.__hasCalledInit = true;
			__initialize();
		}
		if (Scene_Base.prototype.isReady.call(this)) {
			return DataManager.isDatabaseLoaded() && this.isGameFontLoaded() && $__engineData.__ready;
		} else {
			return false;
		}
	};

	// 10 frames is 10 frames too many.
	Window_Message.prototype.startPause = function () {
		this.startWait(0); // this.startWait(10);
		this.pause = true;
	};

	SceneManager.snap = function () {
		UwU.onBeforeSnap(this._scene);
		var snap = Bitmap.snap(this._scene);
		UwU.onAfterSnap(this._scene);
		return snap;
	};

	// make allow the player to hit zero correctly.
	Game_Interpreter.prototype.changeHp = function (target, value, allowDeath) {
		if (target.isAlive()) {
			if (target.hp < -value) value = -target.hp;
			target.gainHp(value);
		}
	};

	// hook a in a global update.
	let updateScene = SceneManager.updateScene;
	SceneManager.updateScene = function () {
		updateScene.call(this);
		UwU.tick();
	};

	// jank support for 1x1 spritesheet characters.
	// Doesn't work with anims. Must select top left of sprite. (prefix with @):
	ImageManager.isObjectCharacter = function (filename) {
		var sign = filename.match(/^[\!\$\@]+/);
		return sign && sign[0].contains("!");
	};

	ImageManager.isBigCharacter = function (filename) {
		var sign = filename.match(/^[\!\$\@]+/);
		return sign && sign[0].contains("$");
	};

	ImageManager.isReallyBigCharacter = function (filename) {
		var sign = filename.match(/^[\!\$\@]+/);
		return sign && sign[0].contains("@");
	};

	Sprite_Character.prototype.patternWidth = function () {
		if (this._tileId > 0) {
			return $gameMap.tileWidth();
		} else if (this._isReallyBigCharacter) {
			return this.bitmap.width;
		} else if (this._isBigCharacter) {
			return this.bitmap.width / 3;
		} else {
			return this.bitmap.width / 12;
		}
	};

	Sprite_Character.prototype.patternHeight = function () {
		if (this._tileId > 0) {
			return $gameMap.tileHeight();
		} else if (this._isReallyBigCharacter) {
			return this.bitmap.height;
		} else if (this._isBigCharacter) {
			return this.bitmap.height / 4;
		} else {
			return this.bitmap.height / 8;
		}
	};

	Sprite_Character.prototype.setCharacterBitmap = function () {
		this.bitmap = ImageManager.loadCharacter(this._characterName);
		this._isBigCharacter = ImageManager.isBigCharacter(this._characterName);
		this._isReallyBigCharacter = ImageManager.isReallyBigCharacter(this._characterName);
	};

	// add an extra one for the engine specifically
	StorageManager.localFilePath = function (savefileId) {
		var name;
		if (savefileId === -2) {
			name = "fallenglobal.rpgsave";
		} else if (savefileId === -1) {
			name = "config.rpgsave";
		} else if (savefileId === 0) {
			name = "global.rpgsave";
		} else {
			name = "file%1.rpgsave".format(savefileId);
		}
		return this.localFileDirectoryPath() + name;
	};

	StorageManager.webStorageKey = function (savefileId) {
		if (savefileId === -2) {
			return $ENGINE_NAME + $dataSystem.gameTitle + "Global";
		} else if (savefileId === -1) {
			return "RPG Config";
		} else if (savefileId === 0) {
			return "RPG Global";
		} else {
			return "RPG File%1".format(savefileId);
		}
	};

	// also save engine data.
	DataManager.saveGlobalInfo = function (info) {
		StorageManager.save(0, JSON.stringify(info));
		$engine.saveEngineGlobalData();
	};

	DataManager.makeSavefileInfo = function (identifier = undefined) {
		var info = {};
		info.globalId = this._globalId;
		info.title = $dataSystem.gameTitle;
		info.characters = $gameParty.charactersForSavefile();
		info.faces = $gameParty.facesForSavefile();
		info.playtime = $gameSystem.playtimeText();
		info.timestamp = Date.now();
		if (identifier !== undefined) {
			info.fallenId = identifier;
		}
		return info;
	};

	DataManager.saveGameWithoutRescue = function (savefileId) {
		var json = JsonEx.stringify(this.makeSaveContents());
		if (json.length >= 200000) {
			console.warn("Save data too big!");
		}
		StorageManager.save(savefileId, json);
		this._lastAccessedId = savefileId;
		var globalInfo = this.loadGlobalInfo() || [];
		var id = undefined;
		if (globalInfo[savefileId]) {
			id = globalInfo[savefileId].fallenId;
		}
		globalInfo[savefileId] = this.makeSavefileInfo(id);
		this.saveGlobalInfo(globalInfo);
		return true;
	};

	// record the last event id for multi events.
	Game_Interpreter.prototype.clear = function () {
		this._lastEventId = this._eventId;
		this._mapId = 0;
		this._eventId = 0;
		this._list = null;
		this._index = 0;
		this._waitCount = 0;
		this._waitMode = "";
		this._comments = "";
		this._character = null;
		this._childInterpreter = null;
	};

	// append to the save system.
	let replaceObject = function (baseObject, newValue) {
		for (const key in baseObject) {
			delete baseObject[key];
		}
		for (const key in newValue) {
			if (newValue.hasOwnProperty(key)) {
				baseObject[key] = newValue[key];
			}
		}
	};

	let makeSaveContents1 = DataManager.makeSaveContents;
	DataManager.makeSaveContents = function () {
		var result = makeSaveContents1.call(this);
		result.engineSave = $__engineSaveData;
		return result;
	};

	let extractSaveContents1 = DataManager.extractSaveContents;
	DataManager.extractSaveContents = function (contents) {
		extractSaveContents1.call(this, contents);
		replaceObject($__engineSaveData, contents.engineSave);
	};

	let setupNewGame1 = DataManager.setupNewGame;
	DataManager.setupNewGame = function () {
		setupNewGame1.call(this);
		replaceObject($__engineSaveData, {});
	};

	StorageManager.backup = function (savefileId) {
		if (this.exists(savefileId)) {
			if (this.isLocalMode()) {
				var data = this.loadFromLocalFile(savefileId);
				var compressed = LZString.compressToBase64(data);
				var fs = require("fs");
				var dirPath = this.localFileDirectoryPath();
				var filePath = this.localFilePath(savefileId) + ".bak";
				if (!fs.existsSync(dirPath)) {
					fs.mkdirSync(dirPath);
				}
				fs.writeFileSync(filePath, compressed);
			} else {
				var key = this.webStorageKey(savefileId);
				localStorage.setItem(key + "bak", localStorage.getItem(key));
			}
		}
	};

	// increase performance by replacing 'for in' with Object.keys()
	JsonEx._encode = function (value, circular, depth) {
		depth = depth || 0;
		if (++depth >= this.maxDepth) {
			throw new Error("Object too deep");
		}
		var type = Object.prototype.toString.call(value);
		if (type === "[object Object]" || type === "[object Array]") {
			value["@c"] = JsonEx._generateId();

			var constructorName = this._getConstructorName(value);
			if (constructorName !== "Object" && constructorName !== "Array") {
				value["@"] = constructorName;
			}
			const keys = Object.keys(value);
			const len = keys.length;
			for (var i = 0; i < len; i++) {
				var key = keys[i];
				if (value.hasOwnProperty(key) && !key.match(/^@./)) {
					if (value[key] && typeof value[key] === "object") {
						if (value[key]["@c"]) {
							circular.push([key, value, value[key]]);
							value[key] = { "@r": value[key]["@c"] };
						} else {
							value[key] = this._encode(value[key], circular, depth + 1);

							if (value[key] instanceof Array) {
								//wrap array
								circular.push([key, value, value[key]]);

								value[key] = {
									"@c": value[key]["@c"],
									"@a": value[key],
								};
							}
						}
					} else {
						value[key] = this._encode(value[key], circular, depth + 1);
					}
				}
			}
		}
		depth--;
		return value;
	};

	SceneManager.updateMainOriginal = SceneManager.updateMain;
	SceneManager.updateMainStable = function () {
		this.updateInputData();
		this.changeScene();
		this.updateScene();
		this.renderScene();
		this.requestUpdate();
	};

	SceneManager.updateMain = function () {
		if (SceneManager.useStableUpdate) {
			SceneManager.updateMainStable.call(this);
		} else {
			SceneManager.updateMainOriginal.call(this);
		}
	};

	SceneManager.useStableUpdate = false;

	let processStack = function (stack) {
		const elements = stack.split("\n").map((x) => x.replace(/\(.*\//, "("));
		const start = elements.shift().replace(/.*: /, "");
		return (
			'<font style="font-weight: bold; color:#f06e00">' +
			start +
			"</font><br><br>" +
			elements.map((x) => "<font>" + x + "</font>").join("<br>")
		);
	};

	Graphics._makeErrorHtml = function (name, message) {
		var footer =
			'<br><br><font style="color: #8a7e75">' +
			$ENGINE_NAME +
			" - v" +
			$ENGINE_VERSION +
			"<br>RMMV - " +
			$dataSystem.gameTitle +
			" v" +
			$dataSystem.versionId +
			"</font>";
		return (
			'<span style="font-size:1.25em; background-color: #201b19a5;' +
			'padding: 2em; border: 5px solid #f06e00; user-select: text">' +
			'<font style="font-size:2em" color="#f06e00"><b>' +
			name +
			"</b></font><br>" +
			'<font color="#8a7e75">' +
			message +
			"</font><br><br>" +
			'<font color="#f06e00"><b>' +
			"Press F5 to reload the game" +
			"</b></font>" +
			footer +
			"</span>"
		);
	};

	let oldUpdate = Graphics._updateErrorPrinter;

	Graphics._updateErrorPrinter = function () {
		oldUpdate.call(this);
		this._errorPrinter.style.display = "flex";
		this._errorPrinter.style.alignItems = "center";
		this._errorPrinter.style.justifyContent = "center";
	};

	SceneManager.catchException = function (e) {
		if (e instanceof Error) {
			Graphics.printError(e.name, processStack(e.stack));
			console.error(e.stack);
		} else {
			Graphics.printError("UnknownError", e);
		}
		AudioManager.stopAll();
		this.stop();
	};

	// since we upgraded our PIXIJS, the way that renderers are created was changed slightly.
	Graphics._createRenderer = function () {
		// PIXI.dontSayHello = true; // the actual line is PIXI.utils.skipHello(), but we don't use it anyway becuse: http://pixijs.download/next/docs/PIXI.utils.html#sayHello
		var width = this._width;
		var height = this._height;
		var options = {
			view: this._canvas,
			powerPreference: "high-performance",
			width: width,
			height: height,
			transparent: true,
		};
		try {
			switch (this._rendererType) {
				case "canvas":
					this._renderer = new PIXI.CanvasRenderer(options);
					break;
				case "webgl":
					this._renderer = new PIXI.WebGLRenderer(options);
					break;
				default:
					this._renderer = PIXI.autoDetectRenderer(options);
					break;
			}

			if (this._renderer && this._renderer.textureGC) this._renderer.textureGC.maxIdle = 1;
		} catch (e) {
			this._renderer = null;
		}
	};

	let render = Graphics.render;
	Graphics.render = function (stage) {
		$engine.__logPerformance($__enginePerformanceOptions.RENDER, render.bind(this, stage));
	};

	// webGL context loss can sometimes happen (specifically in drawing minigame).
	let _createCanvas = Graphics._createCanvas;
	Graphics._createCanvas = function () {
		_createCanvas.call(this);
		this._canvas.addEventListener(
			"webglcontextlost",
			function (event) {
				throw new Error(
					"WebGL rendering context lost.<br><br>" +
						"Please refresh the page to restart the game." +
						"<br><br>If you are consistently experiencing this and you are running a dual GPU system, " +
						"the error is likely due to your system swapping GPU to the discrete card."
				);
			},
			false
		);
	};

	// override default to be WASD
	// Input.keyMapper = {
	// 	9: "tab",
	// 	13: "ok",
	// 	16: "shift",
	// 	17: "control",
	// 	18: "control",
	// 	27: "escape",
	// 	32: "ok",
	// 	33: "pageup",
	// 	34: "pagedown",
	// 	37: "left",
	// 	38: "up",
	// 	39: "right",
	// 	40: "down",
	// 	87: "up",
	// 	65: "left",
	// 	83: "down",
	// 	68: "right",
	// 	74: "ok",
	// 	75: "escape",
	// 	77: "menu",
	// 	219: "pageup",
	// 	221: "pagedown",
	// 	45: "escape",
	// 	46: "ok",
	// 	35: "escape",
	// 	36: "menu",
	// 	96: "escape",
	// 	98: "down",
	// 	100: "left",
	// 	102: "right",
	// 	104: "up",
	// 	120: "debug",
	// };

	// add support for engine waiting
	Game_Interpreter.prototype.updateWaitMode = function () {
		var waiting = false;
		switch (this._waitMode) {
			case "message":
				waiting = $gameMessage.isBusy();
				break;
			case "transfer":
				waiting = $gamePlayer.isTransferring();
				break;
			case "scroll":
				waiting = $gameMap.isScrolling();
				break;
			case "route":
				waiting = this._character.isMoveRouteForcing();
				break;
			case "animation":
				waiting = this._character.isAnimationPlaying();
				break;
			case "balloon":
				waiting = this._character.isBalloonPlaying();
				break;
			case "gather":
				waiting = $gamePlayer.areFollowersGathering();
				break;
			case "action":
				waiting = BattleManager.isActionForced();
				break;
			case "video":
				waiting = Graphics.isVideoPlaying();
				break;
			case "image":
				waiting = !ImageManager.isReady();
				break;
			case "engine":
				waiting = $__engineData.__overworldMode;
				break;
		}

		if (!waiting) {
			this._waitMode = "";
		}
		return waiting;
	};

	// make sure our progress text is rendered.
	Graphics._paintUpperCanvas = function () {
		this._clearUpperCanvas();
		if (this._loadingImage && this._loadingCount >= 20) {
			var context = this._upperCanvas.getContext("2d");
			var dx = (this._width - this._loadingImage.width) / 2;
			var dy = (this._height - this._loadingImage.height) / 2;
			var alpha = ((this._loadingCount - 20) / 30).clamp(0, 1);
			context.save();
			context.globalAlpha = alpha;
			context.drawImage(this._loadingImage, dx, dy);
			context.restore();
			Graphics.render(GUIScreen.__loadingText);
		}
	};

	// add passive check to wheel
	TouchInput._setupEventHandlers = function () {
		var isSupportPassive = Utils.isSupportPassiveEvent();
		document.addEventListener("mousedown", this._onMouseDown.bind(this));
		document.addEventListener("mousemove", this._onMouseMove.bind(this));
		document.addEventListener("mouseup", this._onMouseUp.bind(this));
		document.addEventListener("wheel", this._onWheel.bind(this), isSupportPassive ? { passive: false } : false);
		document.addEventListener(
			"touchstart",
			this._onTouchStart.bind(this),
			isSupportPassive ? { passive: false } : false
		);
		document.addEventListener("touchmove", this._onTouchMove.bind(this), isSupportPassive ? { passive: false } : false);
		document.addEventListener("touchend", this._onTouchEnd.bind(this));
		document.addEventListener("touchcancel", this._onTouchCancel.bind(this));
		document.addEventListener("pointerdown", this._onPointerDown.bind(this));
	};

	let sceneManagerOnSceneStart = SceneManager.onSceneStart;
	SceneManager.onSceneStart = function () {
		sceneManagerOnSceneStart.call(this);
		UwU.onSceneStart(SceneManager._previousClass, SceneManager._scene);
	};

	let sceneManagerOnSceneCreate = SceneManager.onSceneCreate;
	SceneManager.onSceneCreate = function () {
		sceneManagerOnSceneCreate.call(this);
		UwU.onSceneCreate(SceneManager._scene);
	};

	// support for multiple common events
	Game_Temp.prototype.initialize = function () {
		this._isPlaytest = Utils.isOptionValid("test");
		this._commonEventId = [];
		this._destinationX = null;
		this._destinationY = null;
	};

	Game_Temp.prototype.reserveCommonEvent = function (commonEventId) {
		this._commonEventId.push(commonEventId);
	};

	Game_Temp.prototype.clearCommonEvent = function () {
		this._commonEventId.pop();
	};

	Game_Temp.prototype.isCommonEventReserved = function () {
		return this._commonEventId.length > 0;
	};

	Game_Temp.prototype.reservedCommonEvent = function () {
		return $dataCommonEvents[this._commonEventId[this._commonEventId.length - 1]];
	};
})();
