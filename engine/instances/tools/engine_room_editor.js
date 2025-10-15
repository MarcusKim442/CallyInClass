// how to use:
// click + drag to select
// click + drag on handles / selection to move / scale / rotate
// ctrl + d to duplicate
// del to delete
// g to gridify
// r to reset rotation
// l to toggle labels
// [ to increase grid size
// ] to decrease grid size
// ` pulls up asset browser / type to change map
// shift + s to save
// shift + q / ins to live play
// ctrl + z to undo
// ctrl + y to redo

class EngineRoomEditor extends EngineInstance {
	onEngineCreate() {
		this.gridX = 48;
		this.gridY = 48;
		this.instances = [];
		this.labelId = 0;
		this.labels = [];
		this.gridGraphics = $engine.createRenderable(this, new PIXI.Graphics(), false);
		this.labelContainer = $engine.createRenderable(this, new PIXI.Container(), false);
		this.cameraOutlineGraphics = $engine.createRenderable(this, new PIXI.Graphics(), false);
		this.selectionGraphics = $engine.createRenderable(this, new PIXI.Graphics(), false);
		this.selectedObjectGraphics = $engine.createRenderable(this, new PIXI.Graphics(), false);
		this.assetBrowserLevelText = $engine.createManagedRenderable(
			this,
			new PIXI.Text("", $engine.getDefaultTextStyle())
		);
		this.assetBrowserLevelText2 = $engine.createManagedRenderable(
			this,
			new PIXI.Text("", $engine.getDefaultTextStyle())
		);
		this.assetBrowserLevelText2.alpha = 0.5;
		this.assetBrowserLevelTextValue = "";
		this.assetBrowserLevelTextAutocomplete = "";
		this.assetBrowserContainer = $engine.createManagedRenderable(this, new PIXI.Container());
		this.assetBrowserBackdrop = $engine.createManagedRenderable(this, new PIXI.Graphics());
		this.assetBrowserInstances = [];
		this.assetBrowserScroll = 0;
		this.assetBrowserScrollMax = 0;
		this.setGridScale(this.gridX, this.gridY);
		this.selectionX = 0;
		this.selectionY = 0;
		this.selectionWidth = 0;
		this.selectionHeight = 0;
		this.selectedObject = null;
		this.selectedObjectPath = [];
		this.selectionHandleData = [];
		this.selectionPolygon = null;
		this.selectedObjectBounds = null;
		this.actionType = EngineRoomEditor.ET_NONE;
		this.actionTypeSave = 0;
		this.handlePoints = [];
		this.dragging = false;
		this.labelsDisabled = false;
		this.moveSelectionData = {};
		this.transformData = {};
		this.lastX = 0;
		this.lastY = 0;
		this.isLivePlay = false;
		this.roomEditorRoomName = RoomManager.currentRoom().name;
		this.assetSource = null;
		this.lastCameraData = {};
		this.saveBuffer = [];
		this.saveBufferOffset = -1;
		this.loadSelectedRoom();
		this.setupAssetBrowser();
		this.depth = -99999999;
		$engine.getCamera().reset();
		IM.makePersistent(this);
		this.removeLingeringInstances();
		// cursed
		this.delayedAction(0, () => {
			this.setGridScale(this.gridX, this.gridY);
		});
	}

	clearSaveBuffer() {
		this.saveBuffer = [];
		this.saveBufferOffset = -1;
	}

	onCreate() {
		this.onEngineCreate();
	}

	removeLingeringInstances() {
		const instances = IM.findAll(EngineInstance);
		for (const inst of instances) {
			if (inst !== this) {
				inst.destroy();
			}
		}
	}

	storeCamera() {
		const camera = $engine.getCamera();
		const data = {};
		data.x = camera.getX();
		data.y = camera.getY();
		data.xScale = camera.getScaleX();
		data.yScale = camera.getScaleY();
		this.lastCameraData = data;
	}
	restoreCamera() {
		if (!this.lastCameraData) {
			return;
		}
		const camera = $engine.getCamera();
		const data = this.lastCameraData;
		camera.setLocation(data.x, data.y);
		const m = Math.max(data.xScale, data.yScale);
		camera.setScale(m, m);
		this.lastCameraData = null;
	}

	onRoomEnd() {
		if (!this.isLivePlay) {
			IM.clearPersistent(this, true);
			this.destroy();
		} else {
			this.removeLingeringInstances();
			this.storeCamera();
		}
	}

	onRoomStart() {
		if (RoomManager.currentRoom().name === this.roomEditorRoomName && this.isLivePlay) {
			this.isLivePlay = false;
			this.loadSelectedRoom(EngineRoomEditor.EDITOR_TEMP_ROOM_NAME);
			this.restoreCamera();
		}
	}

	onDestroy() {
		if (this.actionType === EngineRoomEditor.ET_LIVE_PLAY) {
			$engine.setRoom("EngineRoomEditor");
		}
	}

	cleanup() {
		if (this.actionType === EngineRoomEditor.ET_LIVE_PLAY) {
			OwO.addTooltip("Engine Room Editor died. Resetting.");
			new EngineRoomEditor();
		}
	}

	deloadRoom() {
		IM.destroy(EmptyInstance);
		for (const label of this.labels) {
			$engine.freeRenderable(label.label);
		}
		this.instances = [];
		this.labels = [];
		this.selectedObject = null;
		this.actionType = EngineRoomEditor.ET_NONE;
		$engine.getCamera().setTilemapBackground(null);
	}

	loadSelectedRoomFromData(roomData) {
		const oldRef = this.roomRef;
		this.roomRef = roomData;
		this.setupCamera();
		this.labelItem(this.selectionGraphics, "Selection");
		this.setupInstances();
		this.setupBackground();
		this.roomRef = oldRef;
	}

	loadSelectedRoom(roomName) {
		this.deloadRoom();
		if (roomName) {
			this.roomRef = RoomManager.getRoom(roomName);
			if (roomName !== EngineRoomEditor.EDITOR_TEMP_ROOM_NAME) {
				this.assetSource = $engine.getAssetSource(this.roomRef);
			}
		} else {
			this.roomRef = new Room(EngineRoomEditor.EDITOR_TEMP_ROOM_NAME);
			RoomManager.addRoom(this.roomRef);
			this.assetSource = null;
		}
		this.loadSelectedRoomFromData(this.roomRef);
	}

	getRoomString() {
		// room data is static for now
		var string = "";
		string += "block room_data\n";
		const settings = this.roomRef.getSettings();
		for (const k of Object.keys(settings)) {
			if (settings[k] !== null && settings[k] !== undefined) {
				string += "\t" + k + " " + String(settings[k]) + "\n";
			}
		}
		string += "endblock\n\n";

		string += "block instances\n";
		for (const inst of this.instances) {
			string +=
				"\t" +
				inst.name +
				" " +
				String(inst.x) +
				" " +
				String(inst.y) +
				" " +
				String(inst.depth) +
				" " +
				String(inst.angle) +
				" " +
				String(inst.xScale) +
				" " +
				String(inst.yScale) +
				"\n";
		}
		string += "endblock\n\n";

		const allExtern = this.roomRef.getAllExtern();
		for (const keyName of Object.keys(allExtern)) {
			string += "block extern " + keyName + "\n";
			for (const data of allExtern[keyName]) {
				string += String(data) + "\n";
			}

			string += "endblock\n\n";
		}

		return string;
	}

	saveRoom() {
		const str = this.getRoomString();
		if (!this.assetSource) {
			console.log(str);
			OwO.addTooltip("New room: Room contents output to console.");
		} else {
			if (!window.require) {
				console.log(str);
				OwO.addTooltip("Cannot save in web mode. Contents output to console.");
			} else {
				const fs = require("fs");
				fs.copyFileSync(this.assetSource, this.assetSource + ".bak");
				fs.writeFileSync(this.assetSource, str);
				OwO.addTooltip("Saved.");
			}
		}
	}

	saveRoomToBuffer() {
		const str = this.getRoomString();
		var extern = "block extern __selected\n";
		var counter = 0;
		var selected = [];
		for (const inst of this.instances) {
			if (inst.selected) {
				selected.push(counter);
			}

			counter++;
		}
		if (selected.length) {
			extern += selected.join(" ");
			extern += "\n";
		}
		extern += "endblock";
		const room = str + extern;
		// check if it's the same as the last
		if (this.saveBufferOffset >= 0 && this.saveBuffer[this.saveBufferOffset] === room) {
			return;
		}
		this.saveBufferOffset++;
		this.saveBuffer.length = this.saveBufferOffset + 1;
		this.saveBuffer[this.saveBufferOffset] = room;
	}

	loadRoomFromBuffer(offset) {
		const newIdx = this.saveBufferOffset + offset;
		if (newIdx < 0 || newIdx >= this.saveBuffer.length) {
			return;
		}
		this.saveBufferOffset = newIdx;
		const roomData = this.saveBuffer[newIdx];
		Room.parseRoomFile("Temp", roomData, (room) => {
			this.deloadRoom();
			this.loadSelectedRoomFromData(room);
			if (!room.hasExtern("__selected")) {
				return;
			}
			const extern = room.getExtern("__selected");
			if (extern.length !== 1) {
				return;
			}
			const selected = extern[0].split(" ");
			for (const idx of selected) {
				this.instances[idx].selected = true;
			}
			this.recalculateSelectonInfo();
		});
	}

	setupBackground() {
		const tilemap = this.roomRef.getRpgTilemap();
		if (tilemap) {
			$engine.getCamera().setTilemapBackground(tilemap);
		}
	}

	setupAssetBrowser() {
		const g = this.assetBrowserBackdrop;
		this.assetBrowserContainer.addChild(g);
		this.assetBrowserContainer.addChild(this.assetBrowserLevelText);
		this.assetBrowserContainer.addChild(this.assetBrowserLevelText2);
		this.assetBrowserLevelText.x = 32;
		this.assetBrowserLevelText2.x = 32;
		this.assetBrowserLevelText.y = 32;
		this.assetBrowserLevelText2.y = 32;
		var idx = 0;
		const size = 64;
		const cols = 8;
		const colWidth = $engine.getWindowSizeX() / cols;
		const rowHeight = 96;
		const rowOffset = 128;
		const colOffset = colWidth / 2;
		for (const cls of $engine.getAllRegisteredClasses()) {
			const tex = $engine.getDefaultTextureForClass(cls);
			var renderable;
			if (tex) {
				renderable = $engine.createManagedRenderable(this, new PIXI.Sprite(tex));
				renderable.anchor.x = 0.5;
				renderable.anchor.y = 0.5;
			} else {
				renderable = this.generateRandomDefaultSprite(cls.name);
			}
			const maxDimension = Math.max(renderable.width, renderable.height);
			const fac = size / maxDimension;
			renderable.width *= fac;
			renderable.height *= fac;
			const text = $engine.createManagedRenderable(
				this,
				new PIXI.Text(cls.name, { ...$engine.getDefaultSubTextStyle(), fontSize: 15 })
			);
			text.anchor.x = 0.5;
			text.anchor.y = 1;
			const xx = (idx % cols) * colWidth + colOffset;
			const yy = Math.floor(idx / cols) * rowHeight + rowOffset;
			renderable.x = xx;
			renderable.y = yy;
			text.x = xx;
			text.y = yy - 32;
			if (text.width > colWidth) {
				text.width = colWidth;
			}
			const obj = {
				cls: cls,
				tex: tex,
				renderable: renderable,
				nameRenderable: text,
				left: xx - size / 2,
				right: xx + size / 2,
				top: yy - size / 2,
				bottom: yy + size / 2,
			};
			this.assetBrowserScrollMax = Math.max(0, obj.bottom - $engine.getWindowSizeY());
			idx++;
			this.assetBrowserInstances.push(obj);
			this.assetBrowserContainer.addChild(renderable);
			this.assetBrowserContainer.addChild(text);
		}
		g.beginFill(0x0, 0.8);
		g.drawRect(0, 0, $engine.getWindowSizeX(), $engine.getWindowSizeY() + this.assetBrowserScrollMax);
	}

	setupInstances() {
		for (const roomInstance of this.roomRef.getInstanceData()) {
			if (roomInstance.generated) {
				continue;
			}
			const spr = $engine.getDefaultTextureForClass(roomInstance.inst);
			const inst = this.createObject(spr, roomInstance.x, roomInstance.y, roomInstance.inst.name);
			inst.angle = roomInstance.angle;
			inst.depth = roomInstance.depth;
			inst.xScale = roomInstance.xScale;
			inst.yScale = roomInstance.yScale;
		}
	}

	cloneObject(obj) {
		const x = obj.x;
		const y = obj.y;
		const name = obj.name;
		const tex = obj.getSprite().texture;
		const o = this.createObject(tex, x, y, name);
		o.angle = obj.angle;
		o.xScale = obj.xScale;
		o.yScale = obj.yScale;
		return o;
	}

	getObjectDimensions(obj) {
		const spr = obj.getSprite();
		if (!spr.anchor) {
			return { left: -24 * obj.xScale, top: -24 * obj.yScale, right: 24 * obj.xScale, bottom: 24 * obj.yScale };
		}
		const center = spr.anchor;
		const w = spr.width;
		const h = spr.height;
		return { left: -w * center.x, top: -h * center.y, right: w * (1 - center.x), bottom: h * (1 - center.y) };
	}

	getObjectImageDimensions(obj) {
		const spr = obj.getSprite();
		if (!spr.texture) {
			return { w: 48, h: 48 };
		}
		const t = spr.texture;
		return { w: t.width, h: t.height };
	}

	hashString(str) {
		var hash = 0;
		for (var i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		return hash;
	}

	generateRandomDefaultSprite(inString) {
		const r = inString ? Math.abs(this.hashString(inString) / 4294967295) : Math.random();
		const g = new PIXI.Graphics();
		g.lineStyle(1, 0xffffff);
		g.beginFill(Math.round(r * 0xffffff), 1);
		g.drawRect(-24, -24, 48, 48); // default size...
		return g;
	}

	createObject(tex, x, y, name) {
		const inst = new EmptyInstance();
		inst.x = x;
		inst.y = y;

		if (tex) {
			inst.setSprite(new PIXI.Sprite(tex));
			const center = inst.getSprite().anchor;
			const w = inst.getSprite().width;
			const h = inst.getSprite().height;
			inst.setHitbox(
				new Hitbox(inst, new RectangleHitbox(-w * center.x, -h * center.y, w * (1 - center.x), h * (1 - center.y)))
			);
		} else {
			inst.setSprite(this.generateRandomDefaultSprite(name));
			inst.setHitbox(new Hitbox(inst, new RectangleHitbox(-24, -24, 24, 24)));
		}
		inst.selected = false;
		inst.name = name;
		this.instances.push(inst);
		this.labelItem(inst.getSprite(), name, { fontSize: 10 }, 0, 15);
		return inst;
	}

	calculateMaxSelectedBounds() {
		var x1 = 1000000000;
		var y1 = 1000000000;
		var x2 = -1000000000;
		var y2 = -1000000000;
		var anySelect = false;
		for (const inst of this.instances) {
			if (inst.selected) {
				const hitbox = inst.getHitbox();
				anySelect = true;
				x1 = Math.min(hitbox.getBoundingBoxLeft(), x1);
				y1 = Math.min(hitbox.getBoundingBoxTop(), y1);
				x2 = Math.max(hitbox.getBoundingBoxRight(), x2);
				y2 = Math.max(hitbox.getBoundingBoxBottom(), y2);
			}
		}
		if (!anySelect) {
			return null;
		}
		return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
	}

	labelItem(item, text, overrides = {}, padding = 8, height = 40) {
		const style = { ...$engine.getDefaultTextStyle(), ...overrides };
		const label = this.labelContainer.addChild(new PIXI.Text(text, style));
		const labelData = { label: label, parentObj: item, padding: padding, heightOffset: height, id: this.labelId++ };
		item.labelData = labelData;
		this.labels.push(labelData);
	}

	deleteInstance(instance) {
		instance.destroy();
		const labelData = instance.getSprite().labelData;
		if (labelData) {
			this.labelContainer.removeChild(labelData.label);
			$engine.freeRenderable(labelData.label);
		}
		this.instances = this.instances.filter((x) => x !== instance);
		this.labels = this.labels.filter((x) => x !== labelData);
	}

	setupCamera() {
		const settings = this.roomRef.getSettings();
		const graphics = this.cameraOutlineGraphics;
		graphics.clear();
		graphics.lineStyle(4, 0xffffff);
		graphics.drawRect(settings.cameraX, settings.cameraY, settings.cameraWidth, settings.cameraHeight);
		graphics.rotation = settings.cameraRotation;
		this.labelItem(graphics, "Camera");
	}

	step() {
		this.handleLivePlay();
		if (this.actionType !== EngineRoomEditor.ET_LIVE_PLAY) {
			this.handleAssetBrowser();
			this.handleMouseCameraControls();
			this.handleScale();
			this.handleRotate();
			this.handleTranslateObject();
			this.handleSelection();
			this.selectedObjectBounds = this.calculateMaxSelectedBounds();
			this.drawSelectedBounds();
			this.drawHandles();
			this.handleGlobalHotkeys();
			this.handleLabels();
			this.handleGrid();
			this.lastX = this.currentX;
			this.lastY = this.currentY;
		}
	}

	startLivePlay() {
		const str = this.getRoomString();
		this.isLivePlay = true;

		Room.parseRoomFile(EngineRoomEditor.EDITOR_TEMP_ROOM_NAME, str, (room) => {
			this.deloadRoom();
			this.actionType = EngineRoomEditor.ET_LIVE_PLAY;
			RoomManager.addRoom(room);
			RoomManager.changeRooms(EngineRoomEditor.EDITOR_TEMP_ROOM_NAME);
			this.gridGraphics.visible = false;
			this.cameraOutlineGraphics.visible = false;
			this.selectedObjectGraphics.visible = false;
		});
	}

	endLivePlay() {
		this.actionType = EngineRoomEditor.ET_NONE;
		RoomManager.changeRooms(this.roomEditorRoomName);
		this.gridGraphics.visible = true;
		this.cameraOutlineGraphics.visible = true;
		this.selectedObjectGraphics.visible = true;
		this.delayedAction(0, () => {
			this.setGridScale(this.gridX, this.gridY);
		});
	}

	handleLivePlay() {
		if ((IN.keyCheck("Shift") && IN.keyCheckPressed("KeyQ")) || IN.keyCheckPressed("Insert")) {
			if (this.actionType === EngineRoomEditor.ET_LIVE_PLAY) {
				this.endLivePlay();
			} else {
				if (this.actionType === EngineRoomEditor.ET_NONE) {
					this.startLivePlay();
				}
			}
		}
	}

	closeAssetBrowser() {
		this.actionType = this.actionTypeSave;
	}

	handleAssetBrowser() {
		if (this.actionType === EngineRoomEditor.ET_ASSET_BROWSER) {
			const wheel = -IN.getWheel() / 2;
			this.assetBrowserScroll = EngineUtils.clamp(this.assetBrowserScroll + wheel, 0, this.assetBrowserScrollMax);
			this.assetBrowserContainer.y = -this.assetBrowserScroll;

			for (var i = 32; i <= 126; i++) {
				const str = String.fromCharCode(i);
				if (IN.keyCheckPressed(str)) {
					this.assetBrowserLevelTextValue += String.fromCharCode(i);
				}
			}

			if (IN.keyCheckPressed("Backspace")) {
				this.assetBrowserLevelTextValue = this.assetBrowserLevelTextValue.substring(
					0,
					IN.keyCheck("Control") ? 0 : this.assetBrowserLevelTextValue.length - 1
				);
			}
			const prepend = "Load room: ";

			this.assetBrowserLevelText.text = prepend + this.assetBrowserLevelTextValue;
			var anySet = false;
			var bestLen = 9999;
			if (this.assetBrowserLevelTextValue !== "") {
				for (const roomName of RoomManager.listRooms()) {
					if (roomName.startsWith(this.assetBrowserLevelTextValue)) {
						if (roomName.length < bestLen) {
							this.assetBrowserLevelText2.text = prepend + roomName;
							anySet = true;
							bestLen = roomName.length;
						}
					}
				}
			}

			if (!anySet) {
				this.assetBrowserLevelText2.text = this.assetBrowserLevelText.text;
			}
			this.assetBrowserLevelTextAutocomplete = this.assetBrowserLevelText2.text.substring(prepend.length);

			if (IN.keyCheckPressed("Escape")) {
				this.closeAssetBrowser();
			}

			if (IN.keyCheckPressed("Enter") && RoomManager.roomExists(this.assetBrowserLevelTextAutocomplete)) {
				this.closeAssetBrowser();
				this.loadSelectedRoom(this.assetBrowserLevelTextAutocomplete);
				this.clearSaveBuffer();
			}

			const mx = IN.getMouseXGUI();
			const my = IN.getMouseYGUI() + this.assetBrowserScroll;
			var selected = null;

			for (const data of this.assetBrowserInstances) {
				if (data.left < mx && data.right > mx && data.top < my && data.bottom > my) {
					if (IN.mouseCheckPressed(0)) {
						selected = data;
					}

					data.renderable.tint = 0x5f5f5f;
				} else {
					data.renderable.tint = 0xffffff;
				}
			}

			if (selected) {
				const camera = $engine.getCamera();
				const xx = camera.getX() + camera.getWidth() / 2;
				const yy = camera.getY() + camera.getHeight() / 2;
				this.createObject(selected.tex, xx, yy, selected.cls.name);
				this.closeAssetBrowser();
				this.saveRoomToBuffer();
			}

			$engine.requestRenderOnGUI(this.assetBrowserContainer);
		}

		if (IN.keyCheckPressed("Backquote")) {
			if (this.actionType !== EngineRoomEditor.ET_ASSET_BROWSER) {
				this.actionTypeSave = this.actionType;
			}

			this.actionType = EngineRoomEditor.ET_ASSET_BROWSER;
			this.assetBrowserLevelTextValue = "";
		}
	}

	handleRotate() {
		if (IN.mouseCheckPressed(0) && this.actionType === EngineRoomEditor.ET_NONE) {
			if (this.selectionHandleData.length === 0) {
				return;
			}
			const tolerance = 12 / Math.min(Math.sqrt($engine.getCamera().getScaleX()), 1);
			const closest = { dist: 100000, idx: -1 };
			const mx = IN.getMouseX();
			const my = IN.getMouseY();
			for (var i = 8; i < 12; i++) {
				const data = this.selectionHandleData[i];
				const d = V2D.calcMag(mx - data.x, my - data.y);
				if (d < tolerance) {
					if (closest.dist > d) {
						closest.dist = d;
						closest.idx = data.idx;
					}
				}
			}

			if (closest.idx !== -1) {
				this.actionType = EngineRoomEditor.ET_ROTATE_SELECTION;
				this.transformData = {
					anyMove: false,
					startX: IN.getMouseX(),
					startY: IN.getMouseY(),
					centerX: this.selectedObject
						? this.selectedObject.x
						: this.selectedObjectBounds.x + this.selectedObjectBounds.width / 2,
					centerY: this.selectedObject
						? this.selectedObject.y
						: this.selectedObjectBounds.y + this.selectedObjectBounds.height / 2,
				};
				this.transformData.originalAngle = V2D.calcDir(
					this.transformData.startX - this.transformData.centerX,
					this.transformData.startY - this.transformData.centerY
				);
				this.transformData.angleCorrection = this.selectedObject ? -this.selectedObject.angle % (Math.PI / 12) : 0;
				for (const obj of this.instances) {
					if (obj.selected) {
						obj.transformData = {
							x: obj.x,
							y: obj.y,
							angle: obj.angle,
						};
					}
				}
			}
		}
		if (this.actionType === EngineRoomEditor.ET_ROTATE_SELECTION) {
			const data = this.transformData;

			var xx = IN.getMouseX();
			var yy = IN.getMouseY();
			if (V2D.calcMag(xx - data.startX, yy - data.startY) > 0.5) {
				data.anyMove = true;
			}

			var angle = V2D.calcDir(xx - data.centerX, yy - data.centerY);
			var originalAngle = data.originalAngle;
			if (!IN.keyCheck("Shift")) {
				angle = this.toGrid(angle, Math.PI / 12) + data.angleCorrection;
				originalAngle = this.toGrid(originalAngle, Math.PI / 12);
			}

			const angleDiff = angle - originalAngle;

			if (data.anyMove) {
				for (const inst of this.instances) {
					if (inst.selected) {
						const dx = inst.transformData.x - data.centerX;
						const dy = inst.transformData.y - data.centerY;
						const v = new Vertex(dx, dy);
						v.rotate(angleDiff);
						inst.x = data.centerX + v.x;
						inst.y = data.centerY + v.y;
						inst.angle = inst.transformData.angle + angleDiff;
						if (Math.abs(inst.angle) < 0.001) {
							inst.angle = 0;
						}
					}
				}
			}

			if (IN.mouseCheckReleased(0)) {
				this.saveRoomToBuffer();
				this.actionType = EngineRoomEditor.ET_NONE;
			}
		}
	}

	handleScale() {
		if (IN.mouseCheckPressed(0) && this.actionType === EngineRoomEditor.ET_NONE) {
			if (this.selectionHandleData.length === 0) {
				return;
			}
			const tolerance = 12 / Math.min(Math.sqrt($engine.getCamera().getScaleX()), 1);
			const closest = { dist: 100000, idx: -1 };
			const mx = IN.getMouseX();
			const my = IN.getMouseY();
			for (var i = 0; i < 8; i++) {
				const data = this.selectionHandleData[i];
				const d = V2D.calcMag(mx - data.x, my - data.y);
				if (d < tolerance) {
					if (closest.dist > d) {
						closest.dist = d;
						closest.idx = data.idx;
					}
				}
			}

			if (
				closest.idx !== -1 &&
				(closest.idx % 2 === 1 || (this.selectedObject ? this.selectedObject.angle : 0) === 0)
			) {
				this.actionType = EngineRoomEditor.ET_SCALE_SELECTION;
				const scalePoint = this.selectionHandleData[(closest.idx + 4) % 8];
				const handlePoint = this.selectionHandleData[closest.idx];
				const idx = closest.idx;
				const lineDist = 1 << 14;
				const mx = (scalePoint.x + handlePoint.x) / 2;
				const my = (scalePoint.y + handlePoint.y) / 2;
				const dist = V2D.calcMag(scalePoint.x - handlePoint.x, scalePoint.y - handlePoint.y);
				const fac = lineDist / dist;
				const offX = mx - handlePoint.x;
				const offY = my - handlePoint.y;
				const line = {
					l1: new EngineLightweightPoint(scalePoint.x - offX * fac, scalePoint.y - offY * fac),
					l2: new EngineLightweightPoint(scalePoint.x + offX * fac, scalePoint.y + offY * fac),
				};
				const xFac = idx === 3 ? 1 : idx === 7 ? -1 : 0;
				const yFac = idx === 1 ? -1 : idx === 5 ? 1 : 0;
				this.transformData = {
					anyMove: false,
					startX: IN.getMouseX(),
					startY: IN.getMouseY(),
					scalePoint: scalePoint,
					originalDist: dist,
					originalWidth: scalePoint.x - handlePoint.x,
					originalHeight: scalePoint.y - handlePoint.y,
					line: line,
					scaleAngle: (this.selectedObject ? this.selectedObject.angle : 0) + ((idx - 3) / 8) * Math.PI * 2,
					yFac: yFac,
					xFac: xFac,
					cardinalHandle: idx % 2 === 1,
				};
				for (const obj of this.instances) {
					if (obj.selected) {
						const nearest = EngineUtils.nearestPositionOnLine(
							new EngineLightweightPoint(obj.x, obj.y),
							line.l1,
							line.l2
						);
						const dist2 = V2D.calcMag(scalePoint.x - nearest.x, scalePoint.y - nearest.y);
						const fraction = dist2 / dist;
						obj.transformData = {
							x: obj.x,
							y: obj.y,
							xScale: obj.xScale,
							yScale: obj.yScale,
							fraction: fraction || 0,
							xFraction: (obj.x - scalePoint.x) / this.selectedObjectBounds.width || 0,
							yFraction: (obj.y - scalePoint.y) / this.selectedObjectBounds.height || 0,
						};
					}
				}
			}
		}

		if (this.actionType === EngineRoomEditor.ET_SCALE_SELECTION) {
			var xx = IN.getMouseX();
			var yy = IN.getMouseY();
			if (!IN.keyCheck("Shift")) {
				xx = this.toGrid(xx, this.gridX);
				yy = this.toGrid(yy, this.gridY);
			}
			if (V2D.calcMag(xx - this.transformData.startX, yy - this.transformData.startY) > 0.5) {
				this.transformData.anyMove = true;
			}

			const data = this.transformData;

			if (this.transformData.anyMove) {
				if (data.cardinalHandle) {
					const point = EngineUtils.nearestPositionOnLine(
						new EngineLightweightPoint(xx, yy),
						data.line.l1,
						data.line.l2
					);
					const d1 = V2D.calcMag(data.line.l1.x - point.x, data.line.l1.y - point.y);
					const d2 = V2D.calcMag(data.line.l2.x - point.x, data.line.l2.y - point.y);
					const sign = d2 < d1 ? -1 : 1;
					const newDist = V2D.calcMag(data.scalePoint.x - point.x, data.scalePoint.y - point.y) * sign;

					const diff = newDist - data.originalDist;
					const fac = newDist / data.originalDist - 1;
					for (const inst of this.instances) {
						var v = new Vertex(data.xFac, data.yFac);
						if (inst.selected) {
							if (this.selectedObject) {
								v.rotate(inst.angle);
							}
							var correction = new V2D(
								diff * inst.transformData.fraction * v.x,
								diff * inst.transformData.fraction * v.y
							);
							if (this.selectedObject) {
								if (inst.transformData.xScale < 0) {
									correction.mirror(Math.PI / 2 + inst.angle);
								}
								if (inst.transformData.yScale < 0) {
									correction.mirror(inst.angle);
								}
							}

							inst.x = inst.transformData.x + correction.x;
							inst.y = inst.transformData.y + correction.y;
							inst.xScale = inst.transformData.xScale + inst.transformData.xScale * fac * Math.abs(data.xFac);
							inst.yScale = inst.transformData.yScale + inst.transformData.yScale * fac * Math.abs(data.yFac);
							if (inst.xScale === 0) {
								inst.xScale = 0.1;
							}
							if (inst.yScale === 0) {
								inst.yScale = 0.1;
							}
						}
					}
				} else {
					const point = new EngineLightweightPoint(xx, yy);
					const newWidth = data.scalePoint.x - point.x;

					const diffX = newWidth - data.originalWidth;
					const facX = newWidth / data.originalWidth - 1;
					const newHeight = data.scalePoint.y - point.y;
					const diffY = newHeight - data.originalHeight;
					const facY = newHeight / data.originalHeight - 1;
					const idx = data.scalePoint.idx;
					for (const inst of this.instances) {
						if (inst.selected) {
							const v = new Vertex(facX, facY * (Math.sign(((inst.angle + Math.PI / 2) % Math.PI) - Math.PI / 2) || 1));
							v.rotate(-(((inst.angle + Math.PI / 2) % Math.PI) - Math.PI / 2));
							if (this.selectedObject) {
								inst.x =
									inst.transformData.x +
									diffX * inst.transformData.xFraction * (idx === 2 || idx === 4 ? 1 : -1) * Math.sign(inst.xScale);
								inst.y =
									inst.transformData.y +
									diffY * inst.transformData.yFraction * (idx === 4 || idx === 6 ? 1 : -1) * Math.sign(inst.yScale);
							} else {
								inst.x =
									inst.transformData.x + diffX * inst.transformData.xFraction * (idx === 2 || idx === 4 ? 1 : -1);
								inst.y =
									inst.transformData.y + diffY * inst.transformData.yFraction * (idx === 4 || idx === 6 ? 1 : -1);
							}

							inst.xScale = inst.transformData.xScale + inst.transformData.xScale * v.x;
							inst.yScale = inst.transformData.yScale + inst.transformData.yScale * v.y;
							if (inst.xScale === 0) {
								inst.xScale = 0.1;
							}
							if (inst.yScale === 0) {
								inst.yScale = 0.1;
							}
						}
					}
				}
			}

			if (IN.mouseCheckReleased(0)) {
				this.saveRoomToBuffer();
				this.actionType = EngineRoomEditor.ET_NONE;
			}
		}
	}

	handleGlobalHotkeys() {
		if (this.actionType === EngineRoomEditor.ET_ASSET_BROWSER) {
			return;
		}
		if (IN.keyCheckPressed("BracketLeft")) {
			this.setGridScale(this.gridX * 2, this.gridY * 2);
		}

		if (IN.keyCheckPressed("BracketRight")) {
			this.setGridScale(this.gridX / 2, this.gridY / 2);
		}

		if (IN.keyCheck("Shift") && IN.keyCheckPressed("KeyD")) {
			const newObj = [];
			const bounds = this.selectedObjectBounds;
			for (const obj of this.instances) {
				if (obj.selected) {
					obj.selected = false;
					const o = this.cloneObject(obj);
					newObj.push(o);
					o.x += 32;
					o.y += bounds.height / 2;
				}
			}
			for (const o of newObj) {
				o.selected = true;
			}
			this.saveRoomToBuffer();
			this.recalculateSelectonInfo();
		}

		if (IN.keyCheckPressed("KeyL")) {
			this.labelsDisabled = !this.labelsDisabled;
			for (const label of this.labels) {
				label.label.alpha = !this.labelsDisabled;
			}
		}

		if (IN.keyCheck("ArrowRight")) {
			$engine.getCamera().translate(this.gridX, 0);
		}
		if (IN.keyCheck("ArrowUp")) {
			$engine.getCamera().translate(0, -this.gridY);
		}
		if (IN.keyCheck("ArrowLeft")) {
			$engine.getCamera().translate(-this.gridX, 0);
		}
		if (IN.keyCheck("ArrowDown")) {
			$engine.getCamera().translate(0, this.gridY);
		}

		if (IN.keyCheckPressed("KeyG")) {
			for (const obj of this.instances) {
				if (obj.selected) {
					const dimensions = this.getObjectDimensions(obj);
					const imgDimensions = this.getObjectImageDimensions(obj);
					const w = dimensions.right - dimensions.left;
					const scaledW = this.toGrid(w, this.gridX) || this.gridX;
					const diffX = (imgDimensions.w / (dimensions.right - dimensions.left) / imgDimensions.w) * scaledW;
					obj.xScale *= diffX;

					const h = dimensions.bottom - dimensions.top;
					const scaledH = this.toGrid(h, this.gridY) || this.gridY;
					const diffY = (imgDimensions.h / (dimensions.bottom - dimensions.top) / imgDimensions.h) * scaledH;
					obj.yScale *= diffY;

					const ox = dimensions.left * diffX;
					const oy = dimensions.top * diffY;
					const v = new Vertex(ox, oy);
					v.rotate(obj.angle);

					obj.x = this.toGrid(obj.x + v.x, this.gridX) - v.x;
					obj.y = this.toGrid(obj.y + v.y, this.gridY) - v.y;
				}
			}
			this.saveRoomToBuffer();
		}

		if (IN.keyCheckPressed("KeyR")) {
			for (const obj of this.instances) {
				if (obj.selected) {
					obj.angle = 0;
				}
			}
			this.saveRoomToBuffer();
		}

		if (IN.keyCheckPressed("Delete")) {
			for (const obj of this.instances) {
				if (obj.selected) {
					this.deleteInstance(obj);
				}
			}
			this.actionType = EngineRoomEditor.ET_NONE;
			this.saveRoomToBuffer();
			this.recalculateSelectonInfo();
		}

		if (IN.keyCheck("Control") && IN.keyCheckPressed("KeyZ")) {
			this.loadRoomFromBuffer(-1);
		}

		if (IN.keyCheck("Control") && IN.keyCheckPressed("KeyY")) {
			this.loadRoomFromBuffer(1);
		}

		if (IN.keyCheck("Shift") && IN.keyCheckPressed("KeyS")) {
			this.saveRoom();
		}
	}

	toGrid(value, scale) {
		return Math.round(value / scale) * scale;
	}

	handleTranslateObject() {
		if (this.selectionPolygon === null || !this.selectedObjectBounds) {
			return;
		}
		if (IN.mouseCheckPressed(0) && this.actionType === EngineRoomEditor.ET_NONE) {
			if (!this.selectionPolygon.contains(IN.getMouseX(), IN.getMouseY())) {
				this.actionType = EngineRoomEditor.ET_NONE;
			} else {
				this.actionType = EngineRoomEditor.ET_MOVE_SELECTION;
				this.moveSelectionData = {
					x: IN.getMouseX(),
					y: IN.getMouseY(),
					offX: IN.getMouseX() - this.selectedObjectBounds.x,
					offY: IN.getMouseY() - this.selectedObjectBounds.y,
				};
			}
		}
		if (this.actionType === EngineRoomEditor.ET_MOVE_SELECTION) {
			if (!IN.keyCheck("Shift")) {
				var tx = this.toGrid(IN.getMouseX() - this.moveSelectionData.offX, this.gridX);
				var ty = this.toGrid(IN.getMouseY() - this.moveSelectionData.offY, this.gridY);
			} else {
				var tx = IN.getMouseX() - this.moveSelectionData.offX;
				var ty = IN.getMouseY() - this.moveSelectionData.offY;
			}

			if (V2D.calcMag(IN.getMouseX() - this.moveSelectionData.x, IN.getMouseY() - this.moveSelectionData.y) > 0.5) {
				this.moveSelectionData.anyMove = true;
			}

			if (this.moveSelectionData.anyMove) {
				for (const obj of this.instances) {
					if (obj.selected) {
						const ox = obj.x - this.selectedObjectBounds.x;
						const oy = obj.y - this.selectedObjectBounds.y;
						obj.x = tx + ox;
						obj.y = ty + oy;
					}
				}
			}

			if (IN.mouseCheckReleased(0)) {
				this.saveRoomToBuffer();
				this.actionType = EngineRoomEditor.ET_NONE;
			}
		}
	}

	drawHandles() {
		this.selectionHandleData = [];
		const graphics = this.selectedObjectGraphics;
		const skipCorners = this.selectedObject && this.selectedObject.angle % (Math.PI * 2) !== 0;
		for (var i = 0; i < this.selectedObjectPath.length - 1; i++) {
			const p1 = this.selectedObjectPath[i];
			const p2 = this.selectedObjectPath[i + 1];
			if (!skipCorners) {
				graphics.drawCircle(p1.x, p1.y, 4);
			}

			const x2 = EngineUtils.interpolate(0.5, p1.x, p2.x, EngineUtils.INTERPOLATE_LINEAR);
			const y2 = EngineUtils.interpolate(0.5, p1.y, p2.y, EngineUtils.INTERPOLATE_LINEAR);
			graphics.drawCircle(x2, y2, 4);
			this.selectionHandleData.push({ x: p1.x, y: p1.y, idx: i * 2 });
			this.selectionHandleData.push({ x: x2, y: y2, idx: i * 2 + 1 });
		}

		const padding = 36;
		const multX = this.selectedObject ? Math.sign(this.selectedObject.xScale) : 1;
		const multY = this.selectedObject ? Math.sign(this.selectedObject.yScale) : 1;
		var angle = this.selectedObject ? this.selectedObject.angle * multX * multY : 0;
		angle += (Math.PI / 4) * 5;
		for (var i = 0; i < this.selectedObjectPath.length; i++) {
			const p1 = this.selectedObjectPath[i];
			const xx = p1.x + padding * Math.cos(angle) * multX;
			const yy = p1.y + padding * Math.sin(angle) * multY;
			angle += Math.PI / 2;
			graphics.drawCircle(xx, yy, 4);
			this.selectionHandleData.push({ x: xx, y: yy, idx: this.selectedObjectPath.length * 2 + i });
		}
	}

	drawSelectedBounds() {
		const graphics = this.selectedObjectGraphics;
		graphics.clear();
		graphics.lineStyle(Math.ceil(1 / $engine.getCamera().getScaleX()), 0xffffff);
		graphics.beginFill(0xffffff, 0.25);
		this.selectedObjectPath = [];
		if (this.selectedObject) {
			const hitbox = this.selectedObject.getHitbox().getPolygonHitbox();
			const points = hitbox.getPoints();
			for (const p of points) {
				p.x += this.selectedObject.x;
				p.y += this.selectedObject.y;
			}
			points.push(points[0]);
			graphics.drawPolygon(points);
			for (const p of points) {
				this.selectedObjectPath.push(new Vertex(p.x, p.y));
			}
			this.selectionPolygon = new PIXI.Polygon(this.selectedObjectPath);
		} else {
			const bounds = this.selectedObjectBounds;
			if (!bounds) {
				return;
			}
			graphics.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
			this.selectedObjectPath.push(new Vertex(bounds.x, bounds.y));
			this.selectedObjectPath.push(new Vertex(bounds.x + bounds.width, bounds.y));
			this.selectedObjectPath.push(new Vertex(bounds.x + bounds.width, bounds.y + bounds.height));
			this.selectedObjectPath.push(new Vertex(bounds.x, bounds.y + bounds.height));
			this.selectedObjectPath.push(new Vertex(bounds.x, bounds.y));
			this.selectionPolygon = new PIXI.Polygon(this.selectedObjectPath);
		}
	}

	recalculateSelectonInfo() {
		this.selectedObject = null;
		var numSelected = 0;
		for (const inst of this.instances) {
			if (inst.selected) {
				this.selectedObject = inst;
				numSelected++;
			}
		}
		this.selectedObjectBounds = this.calculateMaxSelectedBounds();
		if (numSelected !== 1) {
			this.selectedObject = null;
		}
	}

	handleSelectionStep() {
		const hitbox = new Hitbox(
			null,
			new RectangleHitbox(
				this.selectionX,
				this.selectionY,
				this.selectionX + this.selectionWidth,
				this.selectionY + this.selectionHeight
			)
		);

		for (var i = this.instances.length - 1; i >= 0; i--) {
			const inst = this.instances[i];
			if (IN.keyCheck("Shift")) {
				inst.selected = inst.selected || hitbox.doCollision(inst.getHitbox(), 0, 0);
			} else {
				inst.selected = hitbox.doCollision(inst.getHitbox(), 0, 0);
				if (inst.selected) {
					this.selectedObject = inst;
					if (this.actionType === EngineRoomEditor.ET_SELECT_REGION_START) {
						this.actionType = EngineRoomEditor.ET_MOVE_SELECTION;
						break;
					}
				}
			}
		}

		this.recalculateSelectonInfo();

		if (this.actionType === EngineRoomEditor.ET_MOVE_SELECTION) {
			this.moveSelectionData = {
				x: IN.getMouseX(),
				y: IN.getMouseY(),
				offX: IN.getMouseX() - this.selectedObjectBounds.x,
				offY: IN.getMouseY() - this.selectedObjectBounds.y,
			};
		}
	}

	clearSelections() {
		for (const inst of this.instances) {
			inst.selected = false;
		}
		this.selectedObjectPath = [];
		this.selectionPolygon = null;
	}

	checkSelectUnderMouse() {}

	handleSelection() {
		if (this.actionType === EngineRoomEditor.ET_NONE && IN.mouseCheckPressed(0)) {
			this.selectionX = IN.getMouseX();
			this.selectionY = IN.getMouseY();
			this.actionType = EngineRoomEditor.ET_SELECT_REGION_START;
			if (!IN.keyCheck("Shift")) {
				this.clearSelections();
			}
		}
		if (
			this.actionType === EngineRoomEditor.ET_SELECT_REGION_START ||
			this.actionType === EngineRoomEditor.ET_SELECT_REGION_STEP
		) {
			this.selectionWidth = IN.getMouseX() - this.selectionX;
			this.selectionHeight = IN.getMouseY() - this.selectionY;
			const graphics = this.selectionGraphics;
			graphics.clear();
			graphics.lineStyle(Math.ceil(1 / $engine.getCamera().getScaleX()), 0xffffff);
			graphics.beginFill(0xffffff, 0.25);
			graphics.drawRect(this.selectionX, this.selectionY, this.selectionWidth, this.selectionHeight);
			this.handleSelectionStep();

			if (this.actionType !== EngineRoomEditor.ET_SELECT_REGION_STEP) {
				graphics.clear();
				if (Math.sqrt(Math.pow(this.selectionWidth, 2), Math.pow(this.selectionHeight, 2)) > 1) {
					this.actionType = EngineRoomEditor.ET_SELECT_REGION_STEP;
				}
			}

			if (IN.mouseCheckReleased(0)) {
				graphics.clear();
				this.saveRoomToBuffer();
				this.actionType = EngineRoomEditor.ET_NONE;
			}
		}
	}

	handleLabels() {
		const camera = $engine.getCamera();
		for (const label of this.labels) {
			const padding = label.padding;
			const heightOffset = label.heightOffset;
			const txtObj = label.label;
			const obj = label.parentObj;
			const bounds = obj.getBounds();
			if (bounds.width === 0 && bounds.height === 0) {
				txtObj.visible = false;
				continue;
			} else {
				txtObj.visible = true;
			}
			const txtBounds = txtObj.getBounds();
			let wantedX = bounds.x / camera.getScaleX() + camera.getX() + padding;
			let wantedY = bounds.y / camera.getScaleY() + camera.getY() - heightOffset;
			if (txtBounds.width < bounds.width && wantedX < camera.getX() + padding) {
				wantedX = camera.getX() + padding;
				const off = (bounds.x + bounds.width - txtBounds.width) / camera.getScaleX() - padding;
				if (off < padding) {
					wantedX = camera.getX() + off;
				}
			}
			if (txtBounds.height < bounds.height && wantedY < camera.getY() + padding) {
				wantedY = camera.getY() + padding;
				const off = (bounds.y + bounds.height - txtBounds.height) / camera.getScaleY() - padding;
				if (off < padding) {
					wantedY = camera.getY() + off;
				}
			}
			txtObj.x = wantedX;
			txtObj.y = wantedY;
		}
	}

	handleGrid() {
		this.gridGraphics.x = $engine.getCamera().getX() - ($engine.getCamera().getX() % this.gridX);
		this.gridGraphics.y = $engine.getCamera().getY() - ($engine.getCamera().getY() % this.gridY);
	}

	handleMouseCameraControls() {
		if (this.actionType === EngineRoomEditor.ET_ASSET_BROWSER) {
			return;
		}
		const mx = IN.getMouseXGUI();
		const my = IN.getMouseYGUI();
		this.currentX = mx;
		this.currentY = my;
		if (!this.dragging && IN.mouseCheckPressed(1)) {
			this.dragging = true;
		}
		if (this.dragging) {
			if (IN.mouseCheckReleased(1)) {
				this.dragging = false;
			}
			const dx = mx - this.lastX;
			const dy = my - this.lastY;
			const sx = $engine.getCamera().getScaleX();
			const sy = $engine.getCamera().getScaleY();
			$engine.getCamera().translate(-dx / sx, -dy / sy);
		}

		const scroll = IN.getWheel();
		if (scroll !== 0) {
			const camera = $engine.getCamera();
			const realScroll = scroll / camera.getWidth();
			const oldW = camera.getWidth();
			const oldH = camera.getHeight();
			const sx = camera.getScaleX();
			const sy = camera.getScaleY();
			camera.setScale(sx + realScroll, sy + realScroll);
			const offX = oldW - camera.getWidth();
			const offY = oldH - camera.getHeight();
			const fx = mx / $engine.getWindowSizeX();
			const fy = my / $engine.getWindowSizeY();
			const moveFactor = 1.25;
			camera.translate(
				offX * (fx * moveFactor - (moveFactor - 1) / 2),
				offY * (fy * moveFactor - (moveFactor - 1) / 2)
			);
			this.setGridScale(this.gridX, this.gridY); // reclaculate
		}
	}

	setGridScale(x, y) {
		if (x < 1 || y < 1) {
			return;
		}
		this.gridX = x;
		this.gridY = y;
		const camera = $engine.getCamera();
		const w = 1 / Math.min(camera.getScaleX(), camera.getScaleY());
		const graphics = this.gridGraphics;
		graphics.clear();
		graphics.lineStyle(w, 0x3c3c3c);
		const sx = -this.gridX;
		const ex = sx + $engine.getCamera().getWidth() + this.gridX * 2;
		const sy = -this.gridY;
		const ey = sy + $engine.getCamera().getHeight() + this.gridY * 2;
		for (var xx = sx; xx <= ex; xx += this.gridX) {
			graphics.moveTo(xx, sy);
			graphics.lineTo(xx, ey);
		}
		for (var yy = sy; yy <= ey; yy += this.gridY) {
			graphics.moveTo(sx, yy);
			graphics.lineTo(ex, yy);
		}
		this.selectedObjectBounds = this.calculateMaxSelectedBounds();
	}
}
EngineRoomEditor.EDITOR_TEMP_ROOM_NAME = "ENGINE_ROOM_EDITOR_TEMP";
EngineRoomEditor.ET_LIVE_PLAY = -1;
EngineRoomEditor.ET_NONE = 0;
EngineRoomEditor.ET_SELECT_REGION_START = 1;
EngineRoomEditor.ET_SELECT_REGION_STEP = 2;
EngineRoomEditor.ET_MOVE_SELECTION = 3;
EngineRoomEditor.ET_SCALE_SELECTION = 4;
EngineRoomEditor.ET_ROTATE_SELECTION = 5;
EngineRoomEditor.ET_ASSET_BROWSER = 6;
