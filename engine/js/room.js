/**
 * Container for a room in the engine.
 */
class Room {
	constructor(name) {
		this.name = name || "DEFAULT_ROOM_NAME";
		this.__instances = [];
		this.__extern = {};
		this.__settings = {
			cameraX: 0,
			cameraY: 0,
			cameraWidth: $engine.getWindowSizeX(),
			cameraHeight: $engine.getWindowSizeY(),
			cameraRotation: 0,
			backgroundColour: 0x000000,
			rpgRoom: null,
			rpgCollider: null,
			rpgIgnoreEmptyTiles: 0,
			rpgColliderOriginX: 0,
			rpgColliderOriginY: 0,
		};
		this.__rpgRoomData = null;
		this.__rpgTilemap = null;
		this.__onLoad = [];
		this.__initialized = false;
	}

	/**
	 * Loads the assets of this room into the game. Calling this method does not change rooms, use ``$engine.setRoom()`` for that.
	 */
	loadRoom() {
		const camera = $engine.getCamera();
		const settings = this.__settings;
		if (this.__rpgTilemap) {
			camera.setTilemapBackground(this.__rpgTilemap);
		} else {
			camera.setBackgroundColour(settings.backgroundColour);
		}
		camera.setLocation(settings.cameraX, settings.cameraY);
		camera.setDimensions(settings.cameraWidth, settings.cameraHeight);
		camera.setRotation(settings.cameraRotation);
		for (const inst of this.__instances) {
			if (!IM.__runtimeIdExists(inst.runtimeId)) {
				inst.create();
			}
		}
	}

	/**
	 * Gets all known external data from this room
	 * @returns {Object} The external data, where the keys are the names of the external data
	 */
	getAllExtern() {
		return { ...this.__extern };
	}

	/**
	 * Check if this room has the specified external data
	 * @param {String} name The name of the external data
	 * @returns {Boolean} Whether or not the room has the external data
	 */
	hasExtern(name) {
		return name in this.__extern;
	}

	/**
	 * Find and load some external data of this room
	 *
	 * @param {String} name The name of the external data to load
	 * @param {Boolean | false} oneLine Is the data a single line?
	 * @param {Boolean | false} safe Throw an error if not found?
	 * @returns {Array | String} The external data, or a sring if oneLine is true
	 */
	getExtern(name, oneLine = false, safe = false) {
		var data = this.__extern[name];
		if (data === undefined) {
			if (safe) {
				throw new Error("External data " + name + " not found");
			} else {
				return null;
			}
		}
		if (oneLine) {
			return data[0];
		}
		return [...data];
	}

	/**
	 * Gets the room settings
	 * @returns {Object} The room settings
	 */
	getSettings() {
		return { ...this.__settings };
	}

	/**
	 * Gets the RPG maker room data associated with this room, if rpgroom is set.
	 * @returns {Object} The raw data or null if rpgRoom is not set
	 */
	getRpgRoom() {
		return this.__rpgRoomData;
	}
	/**
	 * Gets the RPG maker tileset data associated with this room
	 * @returns {Object} The RPG tilemap object, or null if rpgRoom is not set
	 */
	getRpgTilemap() {
		return this.__rpgTilemap;
	}

	/**
	 * Gets the width of the RPG maker map associated with this room.
	 *
	 * @returns {Number} The size (in pixels) of the room.
	 */
	getRPGRoomWidth() {
		if (!this.__rpgRoomData) {
			return 0;
		}
		return this.__rpgRoomData.width * 48;
	}

	/**
	 * Gets the height of the RPG maker map associated with this room.
	 *
	 * @returns {Number} The size (in pixels) of the room.
	 */
	getRPGRoomHeight() {
		if (!this.__rpgRoomData) {
			return 0;
		}
		return this.__rpgRoomData.height * 48;
	}

	/**
	 * Gets the raw data this room uses to populate the world when it is loaded
	 * @returns {Array} A list of ``RoomInstance``
	 */
	getInstanceData() {
		return [...this.__instances];
	}

	__putExtern(name, data) {
		this.__extern[name] = data;
	}

	__init() {
		// prevent default room double init
		if (this.__initialized) {
			return;
		}
		this.__initialized = true;
		for (const x of this.__instances) {
			x.__evaluate();
		}
	}

	// copies of RPG map
	__RPGtileId(x, y, z) {
		var width = this.__rpgRoomData.width;
		var height = this.__rpgRoomData.height;
		return this.__rpgRoomData.data[(z * height + y) * width + x] || 0;
	}

	__layeredRPGTiles(x, y) {
		var tiles = [];
		for (var i = 0; i < 4; i++) {
			tiles.push(this.__RPGtileId(x, y, 3 - i));
		}
		return tiles;
	}

	__isRPGTilePassable(x, y) {
		const flags = $dataTilesets[this.__rpgRoomData.tilesetId].flags;
		const tiles = this.__layeredRPGTiles(x, y);
		const options = [
			Game_Character.ROUTE_MOVE_DOWN,
			Game_Character.ROUTE_MOVE_RIGHT,
			Game_Character.ROUTE_MOVE_UP,
			Game_Character.ROUTE_MOVE_LEFT,
		];
		for (const dir of options) {
			const bit = 1 << (dir / 2 - 1); // 0, 1, 2, 3
			for (var i = 0; i < tiles.length; i++) {
				if (this.__settings.rpgIgnoreEmptyTiles && tiles[i] === 0) {
					continue;
				}
				var flag = flags[tiles[i]];
				if (flag & 0x10) {
					continue;
				}
				return (flag & bit) !== bit;
			}
		}

		return true;
	}

	__handleRPGCollisions() {
		if (!this.__settings.rpgCollider) {
			return;
		}
		const w = this.__rpgRoomData.width;
		const h = this.__rpgRoomData.height;
		const ox = 48 * this.__settings.rpgColliderOriginX;
		const oy = 48 * this.__settings.rpgColliderOriginY;
		for (var yy = 0; yy < h; yy++) {
			for (var xx = 0; xx < w; xx++) {
				if (!this.__isRPGTilePassable(xx, yy)) {
					const rid = IM.__newRuntimeId();
					const inst = new RoomInstance(this.__settings.rpgCollider, rid, xx * 48 + ox, yy * 48 + oy, 0, 0, 1, 1);
					inst.generated = true;
					this.__instances.push(inst);
				}
			}
		}
	}

	__handleRPGEvents() {
		for (const event of this.__rpgRoomData.events) {
			if (event === null) {
				continue;
			}
			if (event.name.startsWith("inst=")) {
				const instData = event.name.substring(5);
				const instance = Room.__parseEngineInstance(instData);
				instance.x += event.x * 48;
				instance.y += event.y * 48;
				instance.generated = true;

				this.__instances.push(instance);
			}
		}
	}

	// modified RPG maker code
	__createRPGTilemap(map) {
		var tilemap;
		if (Graphics.isWebGL()) {
			tilemap = new ShaderTilemap();
		} else {
			tilemap = new Tilemap();
		}
		tilemap.tileWidth = map.tileWidth();
		tilemap.tileHeight = map.tileHeight();
		tilemap.setData(map.width(), map.height(), map.data());
		tilemap.horizontalWrap = map.isLoopHorizontal();
		tilemap.verticalWrap = map.isLoopVertical();
		this.__loadRPGTileset(tilemap, map);
		this.__rpgTilemap = tilemap;
		this.__handleRPGCollisions();
		this.__handleRPGEvents();
	}

	__loadRPGTileset(tilemap, map) {
		const tileset = $dataTilesets[this.__rpgRoomData.tilesetId];
		if (tileset) {
			var tilesetNames = tileset.tilesetNames;
			for (var i = 0; i < tilesetNames.length; i++) {
				tilemap.bitmaps[i] = ImageManager.loadTileset(tilesetNames[i]);
			}
			var newTilesetFlags = map.tilesetFlags();
			tilemap.refreshTileset();
			if (!tilemap.flags.equals(newTilesetFlags)) {
				tilemap.refresh();
			}
			tilemap.flags = newTilesetFlags;
		}
	}

	/**
	 *
	 * Asynchronously creates a new room for use later. Runtime generated rooms are not saved on engine quit and have no source
	 *
	 * @param {String} name The name of the room
	 * @param {String} data A string representing a room file
	 * @param {Function} callback A callback for when the room is done being created.
	 */
	static parseRoomFile(name, data, callback) {
		Room.__roomFromData(name, EngineUtils.strToArrNewline(data), (room) => {
			room.__init();
			callback(room);
		});
	}

	static __roomFromData(name, data, callback) {
		var room = new Room();
		room.name = name;
		const iter = data.entries();
		Room.__parseData(room, iter);
		if (room.__settings.rpgRoom !== null) {
			var filename = "Map%1.json".format(room.__settings.rpgRoom.padZero(3));
			EngineUtils.readLocalFileAsync("data/" + filename, (data) => {
				room.__rpgRoomData = JSON.parse(data);
				$dataMap = room.__rpgRoomData;
				room.__createRPGTilemap(new Game_Map());
				callback(room);
			});
		} else {
			callback(room);
		}
	}

	static __parseData(room, iter) {
		while (true) {
			var n = iter.next();
			if (n.done) break;

			const data = n.value;
			const line = data[1]; // do not combine.

			if (line.startsWith("//")) {
				continue;
			} else if (line.startsWith("block")) {
				const arr = EngineUtils.strToArrWhitespace(line);
				let type = arr[1];
				let name = "$ENGINE_DEFAULT";
				if (arr.length >= 2) {
					name = arr[2];
				}
				const blockData = Room.__parseAsLines(iter);
				if (type === "room_data") {
					Room.__parseKV(room, blockData);
				} else if (type === "instances") {
					Room.__parseInstances(room, blockData);
				} else if (type === "extern") {
					room.__putExtern(name, blockData);
				} else {
					throw new Error("Unknown room key " + type);
				}
			}
		}
	}

	static __parseInstances(room, data) {
		for (const x of data) {
			room.__instances.push(Room.__parseEngineInstance(x));
		}
	}

	static __parseEngineInstance(data) {
		const arr = EngineUtils.strToArrWhitespace(data); // Instance1 <xPos> <yPos> <depth> <rotation> <scaleX> <scaleY>
		var inst = arr[0];
		var xx = arr.length > 1 ? parseInt(arr[1]) : 0;
		var yy = arr.length > 2 ? parseInt(arr[2]) : 0;
		var depth = arr.length > 3 ? parseInt(arr[3]) : 0;
		var rot = arr.length > 4 ? parseFloat(arr[4]) : 0;
		var scaleX = arr.length > 5 ? parseFloat(arr[5]) : 1;
		var scaleY = arr.length > 6 ? parseFloat(arr[6]) : 1;
		return new RoomInstance(inst, IM.__newRuntimeId(), xx, yy, depth, rot, scaleX, scaleY);
	}

	static __castInput(val) {
		const n = Number(val);
		if (isNaN(n)) {
			if (val === "null") {
				return null;
			} else if (val === "undefined") {
				return undefined;
			}
			return val;
		}
		return n;
	}

	static __parseKV(room, data) {
		for (const x of data) {
			const arr = EngineUtils.strToArrWhitespace(x);
			var key = arr[0];
			var val = arr[1];
			room.__settings[key] = Room.__castInput(val);
		}
	}

	static __parseAsLines(iter) {
		var arr = [];
		while (true) {
			var n = iter.next();
			if (n.done) {
				break;
			}

			const data = n.value;
			const line = data[1];
			if (line === "endblock") {
				return arr;
			} else {
				arr.push(line);
			}
		}
		throw "Unexpected EOF";
	}
}

class RoomInstance {
	constructor(inst, runtimeId, x, y, depth, angle, sx, sy) {
		this.inst = inst;
		this.runtimeId = runtimeId;
		this.x = x;
		this.y = y;
		this.depth = depth;
		this.angle = angle;
		this.xScale = sx;
		this.yScale = sy;
		this.generated = false;
	}

	__evaluate() {
		this.inst = eval(this.inst);
	}

	create() {
		return new this.inst(
			$engine.__instanceCreationSpecial,
			this.runtimeId,
			this.x,
			this.y,
			this.depth,
			this.angle,
			this.xScale,
			this.yScale
		);
	}
}
