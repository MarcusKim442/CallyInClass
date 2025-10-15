class Camera extends PIXI.Container {
	constructor(x, y, w, h, r) {
		// these are the IN GAME camera variables.
		super();
		this.__canvasWidth = Graphics.boxWidth;
		this.__canvasHeight = Graphics.boxHeight;
		this.engineX = this.x;
		this.engineY = this.y;
		this.angle = 0;
		this.filters = [];
		this.__autoDestroyBackground = true;
		this.__background = undefined;
		this.__tilemap = undefined;
		this.__backgroundColour = 0;
		this.__filters = [];
		this.__cameraTilemapContainer = new PIXI.Container();
		this.__cameraBackgroundGraphics = new PIXI.Graphics();
		this.__cameraBackground = new PIXI.Container();
		this.__cameraRenderContainer = new PIXI.Container();
		this.__cameraGraphics = new PIXI.Graphics(); // shared graphics, always draws on top of everything.
		this.__renderContainer = new PIXI.Container();

		this.__cameraRenderContainer.addChild(this.__renderContainer);
		this.__cameraRenderContainer.addChild(this.__cameraGraphics);

		this.addChild(this.__cameraBackgroundGraphics); // colour
		this.addChild(this.__cameraBackground);
		this.addChild(this.__cameraTilemapContainer);
		this.addChild(this.__cameraRenderContainer);

		this.setLocation(x, y);
		this.setDimensions(w, h);
		this.setRotation(r);
	}

	__roomChange() {
		for (var i = this.__filters.length - 1; i >= 0; i--) {
			if (this.__filters[i].remove) {
				this.removeFilter(this.__filters[i].filter);
			}
		}
		this.setBackground(null);
		this.setTilemapBackground(null);
	}

	/**
	 * Adds a filter to the game which applies in screen space
	 * @param {PIXI.filter} screenFilter The filter to add
	 * @param {Boolean | true} removeOnRoomChange Whether or not to automatically remove this filter when the engine changes rooms
	 * @param {String} name A unique identifier for this filter, which may be used later to find it.
	 */
	addFilter(screenFilter, removeOnRoomChange = true, name = "ENGINE_DEFAULT_FILTER_NAME") {
		this.__filters.push({ filter: screenFilter, remove: removeOnRoomChange, filterName: name });
		var filters = this.filters; // PIXI requires reassignment
		filters.push(screenFilter);
		this.filters = filters;
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

		var filters = this.filters; // PIXI requirments.
		filters.splice(this.filters.indexOf(filterObj.filter), 1);
		this.filters = filters;

		this.__filters.splice(index, 1);
	}

	/**
	 * Sets a tileset background to be used.
	 * @param {Spriteset_Map} background The background to use
	 */
	setTilemapBackground(background) {
		this.__cameraTilemapContainer.removeChildren();
		if (background !== null) {
			this.__tilemap = background;
			this.__cameraTilemapContainer.addChild(background);
		}
	}

	/**
	 * Sets a renderable to be rendered in the background.
	 * @param {PIXI.DisplayObject} background The background to use
	 * @param {Boolean | true} autoDestroy Whether or not to auto destroy this background when the game ends or a new background is set.
	 */
	setBackground(background, autoDestroy = true) {
		// expects any PIXI renderable. renders first.
		if (this.__autoDestroyBackground) {
			for (const child of this.__cameraBackground.children) {
				$engine.freeRenderable(child);
			}
		}
		this.__background = background;
		this.__cameraBackground.removeChildren();
		if (background) {
			this.__cameraBackground.addChild(background);
		}
		this.__autoDestroyBackground = autoDestroy;
	}

	getBackground() {
		return this.__background;
	}

	getBackgroundColour() {
		return this.__backgroundColour;
	}

	/**
	 * Sets the background colour of the camera. Removes the current background if applicable.
	 * @param {Number} colour The new background colour
	 */
	setBackgroundColour(colour) {
		this.__backgroundColour = colour;
		this.__cameraBackgroundGraphics.beginFill(colour);
		this.__cameraBackgroundGraphics.drawRect(
			-128,
			-128,
			$engine.getWindowSizeX() + 256,
			$engine.getWindowSizeY() + 256
		);
		this.__cameraBackgroundGraphics.endFill();
		this.setBackground(undefined);
	}

	getCameraGraphics() {
		return this.__cameraGraphics;
	}

	__getRenderContainer() {
		return this.__renderContainer;
	}

	__getCameraRenderContainer() {
		return this.__cameraRenderContainer;
	}

	/**
	 * Sets the main container of this Camera. Useful for special rendering like PIXI.projection.Container2d.
	 * @param {PIXI.DisplayObject} renderable The new container
	 */
	setRenderContainer(renderable) {
		this.__renderContainer = renderable;
	}

	/**
	 * Resets the location, rotation, and scale fo the camera to 0
	 */
	reset() {
		this.setLocation(0, 0);
		this.setRotation(0);
		this.setScale(1, 1);
	}

	__free() {
		$engine.freeRenderable(this.getCameraGraphics());
		$engine.freeRenderable(this.__getCameraRenderContainer());
		$engine.freeRenderable(this.__renderContainer);
		$engine.freeRenderable(this.__cameraBackground);
		$engine.freeRenderable(this.__cameraBackgroundGraphics);
		$engine.freeRenderable(this.__cameraTilemapContainer);
	}

	__tickUpdate() {
		if (this.__tilemap) {
			this.__tilemap.update();
		}
	}

	setLocation(x, y) {
		// x and y are negative so that they represent where the camera would physically be.
		IN.__validMouse = false;
		this.engineX = x; // we use intermediates so that we can have our own coord. system.
		this.engineY = y;
		this.__applyLocation();
	}

	__applyLocation() {
		var dx = this.getWidth() / 2;
		var dy = this.getHeight() / 2;

		var off = new Vertex(dx + this.engineX, dy + this.engineY);
		off.rotate(this.angle);
		off.translate(-dx - this.engineX, -dy - this.engineY);

		this.__cameraRenderContainer.rotation = this.angle;
		this.__cameraRenderContainer.x = (-this.engineX - off.x) * this.__cameraRenderContainer.scale.x;
		this.__cameraRenderContainer.y = (-this.engineY - off.y) * this.__cameraRenderContainer.scale.y;
	}

	__getCenter() {
		return new EngineLightweightPoint(this.engineX + this.getWidth() / 2, this.engineY + this.getHeight() / 2);
	}

	getLocalBoundingBox() {
		const w = this.getWidth();
		const h = this.getHeight();
		const vertices = [
			new Vertex(-w / 2, -h / 2),
			new Vertex(w / 2, -h / 2),
			new Vertex(w / 2, h / 2),
			new Vertex(-2 / w, h / 2),
		];

		var minX = 999999999;
		var minY = 999999999;
		var maxX = -999999999;
		var maxY = -999999999;
		for (const v of vertices) {
			v.rotate(this.angle);
			minX = Math.min(minX, v.x);
			minY = Math.min(minY, v.y);
			maxX = Math.max(maxX, v.x);
			maxY = Math.max(maxY, v.y);
		}
		return { x1: minX, y1: minY, x2: maxX, y2: maxY };
	}

	getBoundingBox() {
		const w = this.getWidth();
		const h = this.getHeight();
		const bb = this.getLocalBoundingBox();
		bb.x1 += w / 2 + this.engineX;
		bb.x2 += w / 2 + this.engineX;
		bb.y1 += h / 2 + this.engineY;
		bb.y2 += h / 2 + this.engineY;
		return bb;
	}

	translate(dx, dy) {
		this.setLocation(this.getX() + dx, this.getY() + dy);
	}

	setX(x) {
		this.setLocation(x, this.getY());
	}

	setY(y) {
		this.setLocation(this.getX(), y);
	}

	getX() {
		return this.engineX;
	}

	getY() {
		return this.engineY;
	}

	setScaleX(sx) {
		IN.__validMouse = false;
		this.__cameraRenderContainer.scale.x = sx;
		this.__applyLocation();
	}

	getScaleX() {
		return this.__cameraRenderContainer.scale.x;
	}

	setScaleY(sy) {
		IN.__validMouse = false;
		this.__cameraRenderContainer.scale.y = sy;
		this.__applyLocation();
	}

	getScaleY() {
		return this.__cameraRenderContainer.scale.y;
	}

	setScale(sx, sy) {
		IN.__validMouse = false;
		this.__cameraRenderContainer.scale.x = sx;
		this.__cameraRenderContainer.scale.y = sy;
		this.__applyLocation();
	}

	setDimensions(w, h) {
		var sx = this.__canvasWidth / w;
		var sy = this.__canvasHeight / h;
		this.setScale(sx, sy);
	}

	setWidth(w) {
		var sx = this.__canvasWidth / w;
		this.setScaleX(sx);
	}

	setHeight(h) {
		var sy = this.__canvasHeight / h;
		this.setScaleY(sy);
	}

	getWidth() {
		return this.__canvasWidth / this.getScaleX();
	}

	getHeight() {
		return this.__canvasHeight / this.getScaleY();
	}

	setRotation(rot) {
		IN.__validMouse = false;
		this.angle = rot;
		this.__applyLocation();
	}

	getRotation() {
		return this.angle;
	}

	__match() {
		var len = this.__renderContainer.children.length;
		if (!$engine.isTimeScaled()) {
			for (var i = 0; i < len; i++) {
				var child = this.__renderContainer.children[i];
				if (!child.__align) {
					continue;
				}
				var parent = child.__parent;
				if (child.position._x !== parent._x) {
					child.position.x = parent._x;
					child.position.x += child.dx;
				}
				if (child.position._y !== parent._y) {
					child.position.y = parent._y;
					child.position.y += child.dy;
				}
				if (child.rotation !== parent._angle) {
					child.rotation = parent.angle;
				}
				if (child.scale._x !== parent._xScale) {
					child.scale.x = parent.xScale;
				}
				if (child.scale._y !== parent._yScale) {
					child.scale.y = parent.yScale;
				}
				if (child.alpha !== parent.alpha) {
					child.alpha = parent.alpha;
				}
			}
		} else {
			var fraction = $engine.getTimescaleFraction();
			for (var i = 0; i < len; i++) {
				var child = this.__renderContainer.children[i];
				if (!child.__align) {
					continue;
				}
				var parent = child.__parent;
				if (child.x !== parent.x) {
					child.x = parent.__lx + (parent.x - parent.__lx) * fraction;
					child.x += child.dx;
				}
				if (child.y !== parent.y) {
					child.y = parent.__ly + (parent.y - parent.__ly) * fraction;
					child.y += child.dy;
				}
				if (child.rotation !== parent.rotation) {
					child.rotation = parent.__langle + (parent.angle - parent.__langle) * fraction;
				}
				if (child.scale.x !== parent.xScale) {
					child.scale.x = parent.__lxScale + (parent.xScale - parent.__lxScale) * fraction;
				}
				if (child.scale.y !== parent.yScale) {
					child.scale.y = parent.__lyScale + (parent.yScale - parent.__lyScale) * fraction;
				}
				if (child.alpha !== parent.alpha) {
					child.alpha = parent.__lalpha + (parent.alpha - parent.__lalpha) * fraction;
				}
			}
		}
		if (this.__tilemap) {
			this.__matchTilemap();
		}
	}

	__matchTilemap() {
		const w = this.getWidth();
		const h = this.getHeight();
		const bb = this.getLocalBoundingBox();
		const minX = bb.x1;
		const minY = bb.y1;
		const maxX = bb.x2;
		const maxY = bb.y2;

		const bbWidth = maxX - minX;
		const bbHeight = maxY - minY;

		const offX = bbWidth * 1.41 - w;
		const offY = bbHeight * 1.41 - h;

		const dx = (w + offX) / 2;
		const dy = (h + offY) / 2;
		const off = new Vertex(dx, dy).rotate(this.angle).translate(-dx, -dy);

		this.__tilemap.rotation = this.angle;
		this.__tilemap.width = bbWidth * 1.41;
		this.__tilemap.height = bbHeight * 1.41;
		this.__tilemap.x = (-off.x - offX / 2) * this.__cameraRenderContainer.scale.x;
		this.__tilemap.y = (-off.y - offY / 2) * this.__cameraRenderContainer.scale.y;
		this.__tilemap.origin.x = this.engineX - offX / 2;
		this.__tilemap.origin.y = this.engineY - offY / 2;

		this.__tilemap.scale.x = this.__cameraRenderContainer.scale.x;
		this.__tilemap.scale.y = this.__cameraRenderContainer.scale.y;
	}

	__reportMouse(point, global) {
		return Graphics._renderer.plugins.interaction.mouse.getLocalPosition(this.__cameraRenderContainer, point, global);
	}

	updateTransform() {
		this.__match();
		super.updateTransform();
	}
}
