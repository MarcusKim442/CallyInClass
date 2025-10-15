class RoomManager {
	static __addRoom(name, room) {
		RoomManager.__rooms[name] = room;
	}

	/**
	 * Adds a new room to the room manager, typically a new asset created at runtime.
	 *
	 * @param {Room} room The room to add to RoomManager
	 */
	static addRoom(room) {
		RoomManager.__addRoom(room.name, room);
	}

	/**
	 * Gets the room associated with the specified name, or null if not found.
	 *
	 * @param {String} name The name of the room to get
	 * @returns {Room} The room
	 */
	static getRoom(name) {
		return RoomManager.__rooms[name] || null;
	}

	static __loadRoom(name) {
		var room = RoomManager.getRoom(name);
		if (room === undefined) {
			throw new Error("Room " + name + " does not exist.");
		}

		$engine.__currentRoom = room;
		room.loadRoom();
		return room;
	}

	/**
	 * Checks if the specified room exists or not.
	 *
	 * @param {String} name The name of the room to check
	 * @returns {Boolean} True if the room exists, false otherwise
	 */
	static roomExists(name) {
		return RoomManager.__rooms[name] !== undefined;
	}

	/**
	 * Gets the current room
	 *
	 * @returns {Room} The current room
	 */
	static currentRoom() {
		return $engine.__currentRoom;
	}

	/**
	 * Alias for $engine.setRoom
	 *
	 * @param {String} name The name of the room to switch to
	 */
	static changeRooms(name) {
		$engine.setRoom(name);
	}

	/**
	 * Gets the list of the names of all known rooms
	 * @returns {String[]} The list of known rooms
	 */
	static listRooms() {
		return Object.keys(RoomManager.__rooms);
	}

	static defaultRoom() {
		return RoomManager.getRoom(RoomManager.__DEFAULT_ROOM_NAME);
	}

	static __init() {
		for (const key in RoomManager.__rooms) {
			RoomManager.__rooms[key].__init();
		}
	}
}

RoomManager.__rooms = {};
RoomManager.__DEFAULT_ROOM_NAME = "$__ENGINE_DEFAULT_ROOM";
