/**
 * Collision checking and general interactions with other instances.
 * All collision functions take in one of 4 possible values for ...targets:
 * (EngineInstance, instance of EngineInstance, instance.id, instance.oid).
 * It is recommended to only use the first two options.
 */
class IM {
	constructor() {
		throw "Cannot instantiate static class.";
	}

	static __initializeVariables() {
		IM.__objects = [];
		IM.__stepList = [];
		IM.__pauseList = [];
		IM.__drawList = [];
		IM.__preDrawList = [];
		IM.__implicitList = [];
		IM.__interpolationList = [];
		IM.__postStepList = [];
		for (var i = 0; i <= IM.__numRegisteredClasses; i++) {
			IM.__accessMap[i + 1] = []; // OID starts at 1
		}
		IM.__alteredLists[i] = false;
		IM.ind = 100000;
		IM.__spatialLookup = new Array(256 * 256);
		for (var i = 0; i < 256 * 256; i++) {
			IM.__spatialLookup[i] = new Array();
		}
		for (const instance of IM.__persistentObjects) {
			IM.__add(instance);
			instance.__updateHitbox();
		}
	}

	static __init(instances) {
		// assumed instances is a list of classes.
		IM.__numRegisteredClasses = instances.length; // DOES NOT INCLUDE ENGINEINSTANCE!
		IM.__accessMap = [null, []]; // 0th index is unused because OID starts at 1
		IM.__oidToClass = [null, EngineInstance];
		EngineInstance.__oid = 1;
		IM.__childMap = [undefined];
		IM.__childMap[1] = IM.__childTree;
		var id = 2;
		for (const x of instances) {
			IM.__accessMap.push([]);
			IM.__oidToClass.push(x);
			x.__oid = id++;
		}

		// find the deepest instance in the tree that is a parent of target
		var returnDeepest = function (target, result) {
			if (result.__children === undefined) {
				return result;
			}
			for (const tree of result.__children) {
				if (target.prototype instanceof tree.__oid) {
					return returnDeepest(target, tree);
				}
			}

			return result;
		};

		// check if any child in children is a subclass of newParent, if it is, bind it to the
		// newParent instead of it's previous parent (ensure only direct subclasses are in __children)
		var rebind = function (newParent, children) {
			for (let i = 0; i < children.length; i++) {
				if (children[i].__oid.prototype instanceof newParent.__oid) {
					let t = children[i];
					children.splice(i--, 1);
					if (newParent.__children === undefined) {
						newParent.__children = [];
					}
					newParent.__children.push(t);
				}
			}
		};

		instances.forEach((x) => {
			// manage children
			if (x.prototype instanceof EngineInstance) {
				var result = returnDeepest(x, IM.__childTree); // result is the lowest superclass of x

				var r = {
					__oid: x,
					__children: undefined,
				};

				if (result.__children === undefined) {
					result.__children = [];
				} else {
					// check if any children on this level are children of us.
					rebind(r, result.__children);
				}
				result.__children.push(r);
				IM.__childMap[IM.__oidFrom(x)] = r;
			} else {
				throw new Error("Attemping to add non EngineInstance subclass(" + String(x) + ") to IM");
			}
		});

		var rangeLookupId = -1;
		// final step, replace classes with their OID for faster lookup
		var recurseLoop = function (input) {
			if (input === undefined) {
				return;
			}
			for (const x of input) {
				const cls = x.__oid;
				x.__oid = IM.__oidFrom(x.__oid);
				cls.__childHigh = rangeLookupId--;
				recurseLoop(x.__children);
				cls.__childLow = rangeLookupId--;
			}
		};
		EngineInstance.__childHigh = rangeLookupId--;
		recurseLoop(IM.__childTree.__children);
		EngineInstance.__childLow = rangeLookupId--;
		IM.__childTree.__oid = 1;
		for (const x of instances) {
			IM.__getFunctions(x);
		}

		var flatRecurse = function (array, data) {
			array.push(data.__oid);
			if (data.__children) {
				for (const d of data.__children) {
					flatRecurse(array, d);
				}
			}
			return array;
		};

		IM.__flatChildMap = new Array(instances.length + 2);
		IM.__flatChildMap[0] = null;
		for (var i = 1; i < IM.__flatChildMap.length; i++) {
			IM.__flatChildMap[i] = flatRecurse([], IM.__childMap[i]);
		}
	}

	static __checkHasUserFunc(inst, name) {
		if (inst === EngineInstance) {
			return false;
		}
		if (inst.prototype.hasOwnProperty(name)) {
			return true;
		}
		return IM.__checkHasUserFunc(Object.getPrototypeOf(inst), name);
	}

	static __getFunctions(inst) {
		inst.__userStep = IM.__checkHasUserFunc(inst, "step");
		inst.__userPause = IM.__checkHasUserFunc(inst, "pause");
		inst.__userPreDraw = IM.__checkHasUserFunc(inst, "preDraw");
		inst.__userDraw = IM.__checkHasUserFunc(inst, "draw");
		inst.__userImplicit = IM.__checkHasUserFunc(inst, "__implicit");
	}

	static __fastDeleteDead(arr) {
		var a = new Array(arr.length);
		var idx = 0;
		for (var i = 0; i < arr.length; i++) {
			var obj = arr[i];
			if (obj.__alive) {
				a[idx++] = obj;
			}
		}
		a.length = idx;
		return a;
	}

	static __doSimTick(lastFrame) {
		var mode = $engine.__getPauseMode();
		if (lastFrame) {
			$engine.__logPerformance($__enginePerformanceOptions.TIMESCALE, IM.__timescaleImplicit, IM);
			if (mode === 0) {
				// normal mode
				$engine.__logPerformance($__enginePerformanceOptions.ENGINE_FUNCTIONS, IM.__deleteFromObjects, IM);
				$engine.__logPerformance($__enginePerformanceOptions.ENGINE_FUNCTIONS, IM.__cleanup, IM);
				$engine.__logPerformance($__enginePerformanceOptions.ENGINE_FUNCTIONS, IM.__implicit, IM);
				$engine.__logPerformance($__enginePerformanceOptions.STEP, IM.__step, IM);
				$engine.__logPerformance($__enginePerformanceOptions.POST_STEP, IM.__postStep, IM);
				$engine.__logPerformance($__enginePerformanceOptions.PRE_DRAW, IM.__preDraw, IM);
				$engine.__logPerformance($__enginePerformanceOptions.ENGINE_FUNCTIONS, IM.__interpolate, IM);
				$engine.__logPerformance($__enginePerformanceOptions.DRAW, IM.__draw, IM);
			} else if (mode === 1) {
				// pause
				$engine.__logPerformance($__enginePerformanceOptions.PAUSE, IM.__pause, IM);
				$engine.__logPerformance($__enginePerformanceOptions.DRAW, IM.__draw, IM);
			} else {
				// special pause (mode===2)
				$engine.__logPerformance($__enginePerformanceOptions.PAUSE, IM.__pause, IM);
				$engine.__logPerformance(
					$__enginePerformanceOptions.STEP,
					$engine.__pauseSpecialInstance.step,
					$engine.__pauseSpecialInstance
				); // run the special instance's step.
				$engine.__logPerformance($__enginePerformanceOptions.DRAW, IM.__draw, IM);
			}
		} else {
			if (mode === 0) {
				$engine.__logPerformance($__enginePerformanceOptions.ENGINE_FUNCTIONS, IM.__deleteFromObjects, IM);
				$engine.__logPerformance($__enginePerformanceOptions.ENGINE_FUNCTIONS, IM.__cleanup, IM);
				$engine.__logPerformance($__enginePerformanceOptions.STEP, IM.__step, IM);
			}
		}
	}

	static __fullClean(obj) {
		obj.cleanup();
		IM.__freeBuckets(obj);
		$engine.__disposeHandles(obj);
	}

	static __cleanup() {
		for (var i = 0; i < IM.__cleanupList.length; i++) {
			IM.__fullClean(IM.__cleanupList[i]);
		}
		IM.__cleanupList = [];
	}

	static __deleteFromObjects() {
		if (IM.__cleanupList.length !== 0) {
			// don't waste CPU if there's nothing to update...
			IM.__objects = IM.__fastDeleteDead(IM.__objects);
			IM.__stepList = IM.__fastDeleteDead(IM.__stepList);
			IM.__pauseList = IM.__fastDeleteDead(IM.__pauseList);
			IM.__preDrawList = IM.__fastDeleteDead(IM.__preDrawList);
			IM.__drawList = IM.__fastDeleteDead(IM.__drawList);
			IM.__implicitList = IM.__fastDeleteDead(IM.__implicitList);
			IM.__interpolationList = IM.__fastDeleteDead(IM.__interpolationList);
			IM.__postStepList = IM.__fastDeleteDead(IM.__postStepList);
			for (var i = 1; i <= IM.__numRegisteredClasses + 1; i++) {
				// only filter lists that were changed
				if (IM.__alteredLists[i]) {
					IM.__accessMap[i] = IM.__fastDeleteDead(IM.__accessMap[i]);
				}
				IM.__alteredLists[i] = false;
			}
		}
	}

	static __implicit() {
		for (var i = 0; i < IM.__implicitList.length; i++) {
			IM.__implicitList[i].__implicit();
		}
	}

	static __step() {
		for (var i = 0; i < IM.__stepList.length; i++) {
			IM.__stepList[i].step();
		}
	}

	static __postStep() {
		for (var i = 0; i < IM.__postStepList.length; i++) {
			IM.__postStepList[i].__postStep();
		}
	}

	static __preDraw() {
		for (var i = 0; i < IM.__preDrawList.length; i++) {
			// this is where you can prepare for draw by checking collisions and such -- draw should only draw
			IM.__preDrawList[i].preDraw();
		}
	}

	static __pause() {
		for (var i = 0; i < IM.__pauseList.length; i++) {
			IM.__pauseList[i].pause();
		}
	}

	static __draw() {
		var gui = $engine.__GUIgraphics;
		var camera = $engine.getCamera().getCameraGraphics();
		gui.clear();
		camera.clear();
		// does not actually render anything to the canvas
		for (var i = 0; i < IM.__drawList.length; i++) {
			IM.__drawList[i].draw(gui, camera);
		}
	}

	static __timescaleImplicit() {
		// called once per step.
		if ($engine.isTimeScaled()) {
			for (var i = 0; i < IM.__objects.length; i++) {
				IM.__objects[i].__timescaleImplicit();
			}
		}
	}

	static __timescaleImmuneStep() {
		for (var i = 0; i < IM.__objects.length; i++) {
			IM.__objects[i].timescaleImmuneStep();
		}
	}

	static __interpolate() {
		// called once per frame, no matter what
		var frac = $engine.isTimeScaled() ? $engine.getTimescaleFraction() : 1.0;
		for (var i = 0; i < IM.__interpolationList.length; i++) {
			IM.__interpolationList[i].__applyInterpolations(frac);
		}
	}

	static __findAll(oid) {
		if (IM.__childMap[oid].__children === undefined) {
			return IM.__accessMap[oid];
		}
		var result = [];
		result.push(...IM.__accessMap[oid]);
		for (const child of IM.__childMap[oid].__children) {
			result.push(...IM.__findAll(child.__oid));
		}
		return result;
	}

	static __findById(wantedId) {
		var left = 0;
		var right = IM.__objects.length;
		var c = 0;
		while (left <= right) {
			c = Math.floor((right + left) / 2);
			var obj = IM.__objects[c];
			var centerId = obj.id;
			if (centerId === wantedId) {
				return obj;
			}

			if (wantedId > centerId) {
				left = c + 1;
			} else {
				right = c - 1;
			}
		}
		return null;
	}

	static __oidFrom(cl) {
		return cl.__oid;
	}

	static __addToWorld(inst) {
		IM.__register(inst);
		IM.__add(inst);
		return inst;
	}

	static __register(inst) {
		var oid = IM.__oidFrom(inst.constructor);
		var low = inst.constructor.__childLow;
		var high = inst.constructor.__childHigh;
		inst.__childLow = low;
		inst.__childHigh = high;
		// readonly
		Object.defineProperty(inst, "oid", { value: oid });
		Object.defineProperty(inst, "id", { value: IM.ind });
		IM.ind++;
	}

	static __registerInterpolator(inst) {
		if (!inst.__interpolateRegistered) {
			inst.__interpolateRegistered = true;
			IM.__interpolationList.push(inst);
			IM.__interpolationList.sort((a, b) => a.id - b.id);
		}
	}

	static __registerPostStep(inst) {
		if (!inst.__postStepRegistered) {
			inst.__postStepRegistered = true;
			IM.__postStepList.push(inst);
			IM.__postStepList.sort((a, b) => a.id - b.id);
		}
	}

	static __add(inst) {
		const cons = inst.constructor;
		if (inst.constructor.__ENGINE_ORDER_FIRST) {
			IM.__objects.unshift(inst);
			if (cons.__userStep) IM.__stepList.unshift(inst);
			if (cons.__userPause) IM.__pauseList.unshift(inst);
			if (cons.__userPreDraw) IM.__preDrawList.unshift(inst);
			if (cons.__userDraw) IM.__drawList.unshift(inst);
			if (cons.__userImplicit) IM.__implicitList.unshift(inst);
		} else {
			IM.__objects.push(inst);
			if (cons.__userStep) IM.__stepList.push(inst);
			if (cons.__userPause) IM.__pauseList.push(inst);
			if (cons.__userPreDraw) IM.__preDrawList.push(inst);
			if (cons.__userDraw) IM.__drawList.push(inst);
			if (cons.__userImplicit) IM.__implicitList.push(inst);
		}
		//IM.__objectsSorted.push(inst);
		IM.__accessMap[inst.oid].push(inst);
	}

	static __newRuntimeId() {
		return IM.__runtimeId++;
	}

	static __runtimeIdExists(id) {
		return IM.__persistentStore.has(id);
	}

	static __newCollisionIdFor(inst) {
		const cid = IM.__collisionId++;
		if (inst) {
			inst.__collisionId = cid;
		}

		return cid;
	}

	static __endGame() {
		for (const obj of IM.__objects) {
			obj.onRoomEnd();
		}
		for (const obj of IM.__objects) {
			obj.onGameEnd();
		}
		for (const obj of IM.__objects) {
			IM.destroy(obj);
		}
		IM.__cleanup();
	}

	static __startRoom() {
		for (const obj of IM.__objects) {
			obj.__updateHitbox();
		}
		for (const obj of IM.__objects) {
			obj.onRoomStart();
		}
	}

	static __endRoom() {
		for (const obj of IM.__objects) {
			obj.onRoomEnd();
		}
		for (const obj of IM.__objects) {
			if (!obj.__persistent) {
				IM.destroy(obj);
			}
		}
		IM.__cleanup();
		IM.__initializeVariables(); // clear IM
	}

	static __queryObjects(target) {
		// returns an array containing the objects requested, if the request is invalid the return is an empty array.
		if (target.__oid) {
			return IM.__findAll(IM.__oidFrom(target));
		} else if (target.id) {
			return [target];
		} else {
			if (target < 100000) {
				return IM.__findAll(target); // oid
			}
			var v = IM.__findById(target); // id
			if (v) {
				return [v];
			}
			return [];
		}
	}

	static __queryLookupData(target) {
		if (target.__oid) {
			return { checkLow: target.__childLow, checkHigh: target.__childHigh, checkId: 0 };
		}
		if (target.id) {
			return { checkLow: 0, checkHigh: 0, checkId: target.id };
		} else {
			// we have an OID
			if (target < 100000) {
				const cls = IM.__oidToClass[target];
				return { checkLow: cls.__childLow, checkHigh: cls.__childHigh, checkId: 0 };
			} else {
				return { checkLow: 0, checkHigh: 0, checkId: target };
			}
		}
	}

	static __queryCollider(target) {
		if (target.__oid) {
			// class (instances do not have __oid)
			return { oid: target.__oid, targetInstance: null };
		}
		if (target.id) {
			// instance
			return { oid: null, targetInstance: target };
		}
		if (target < 100000) {
			return { oid: target, targetInstance: null };
		} else {
			return { oid: null, targetInstance: IM.__findById(target) };
		}
	}

	static __getOrMakeBucket(x, y) {
		var loc = ((x & 0xff) << 8) | (y & 0xff);
		var data = IM.__spatialLookup[loc];
		for (var i = 0; i < data.length; i++) {
			var d = data[i];
			if (d.x === x && d.y === y) {
				return d.map;
			}
		}
		var newData = {
			x: x,
			y: y,
			map: new FastIterationCollisionSet(),
		};
		data.push(newData);
		return newData.map;
	}

	static __freeBuckets(obj) {
		for (const entry of obj.__hashbuckets) {
			entry.delete(obj);
		}
	}

	static __hashObjectLocationFullInvalidate(obj, bounds, oldBuckets) {
		for (var i = 0; i < oldBuckets.length; i++) {
			oldBuckets[i].delete(obj);
		}
		var buckets = IM.__getBucketsForBounds(bounds);
		for (var i = 0; i < buckets.length; i++) {
			buckets[i].add(obj);
		}
		return buckets;
	}

	static __hashObjectLocation(obj, bounds, oldBuckets) {
		for (var i = 0; i < oldBuckets.length; i++) {
			oldBuckets[i].__deleteTarget = obj;
		}
		var buckets = IM.__getBucketsForBounds(bounds);
		for (var i = 0; i < buckets.length; i++) {
			// only add if we are not marked for deletion (not in the bucket already)
			var b = buckets[i];
			if (b.__deleteTarget === null) {
				b.add(obj);
			} else {
				// marked for deletion, but already deleted
				b.__deleteTarget = null;
			}
		}
		for (var i = 0; i < oldBuckets.length; i++) {
			var b = oldBuckets[i];
			if (b.__deleteTarget === obj) {
				b.delete(obj);
				b.__deleteTarget = null;
			}
		}
		return buckets;
	}

	static __getBucketsForObject(obj, x, y) {
		var dx = x - obj._x;
		var dy = y - obj._y;
		var bounds = obj.__hitbox.getBoundingBox();
		if (dy || dx) {
			bounds.x1 += dx;
			bounds.x2 += dx;
			bounds.y1 += dy;
			bounds.y2 += dy;
		}

		return IM.__getBucketsForBounds(bounds);
	}

	static getCollisionHashFactor() {
		// mirrors below value, but hard coded for speed.
		return 128;
	}

	static __getBucketsForBounds(bounds) {
		var x1 = Math.floor(bounds.x1) >> 7;
		var y1 = Math.floor(bounds.y1) >> 7;
		var x2 = Math.floor(bounds.x2) >> 7;
		var y2 = Math.floor(bounds.y2) >> 7;
		var newBuckets = new Array((x2 - x1 + 1) * (y2 - y1 + 1));
		var idx = 0;
		for (var xx = x1; xx <= x2; xx++) {
			for (var yy = y1; yy <= y2; yy++) {
				newBuckets[idx++] = IM.__getOrMakeBucket(xx, yy);
			}
		}
		return newBuckets;
	}

	/**
	 * Makes the specified instance persistent, meaning it will not be destroyed on room change
	 * and will only spawn once during the entire runtime of the engine if it was created by a room
	 *
	 * @param  {EngineInstance} inst The instance to make persistent
	 */
	static makePersistent(inst) {
		if (inst.__persistent) {
			return;
		}
		inst.__persistent = true;
		IM.__persistentObjects.push(inst);
		if (inst.__runtimeId) {
			IM.__persistentStore.set(inst.__runtimeId, true);
		}
	}

	/**
	 * restores a persistent instance created by makePersistent back to a non persistent form, meaning it will be
	 * destroyed on room change. If the persistent instace was made by a room, the flag to prevent it from spawning again
	 * can also be cleared.
	 *
	 * @param  {EngineInstance} inst The instance to make persistent
	 * @param  {Boolean} allowRespawn Whether or not to allow this instance to spawn again
	 */
	static clearPersistent(inst, allowRespawn = false) {
		if (!inst.__persistent) {
			return;
		}
		inst.__persistent = false;
		IM.__persistentObjects = IM.__persistentObjects.filter((x) => x !== inst);
		if (allowRespawn && inst.__runtimeId) {
			IM.__persistentStore.delete(inst.__runtimeId);
		}
	}

	/**
	 * Queries all targets instanes and then marks them for deletion. Also calls the onDestroy() method immediately.
	 *
	 * Calling destroy on an object that is already destroyed has no effect.
	 *
	 * @param  {...EngineInstance} targets N instances of EngineInstance or classes
	 */
	static destroy(...targets) {
		for (const input of targets) {
			for (const inst of IM.__queryObjects(input)) {
				if (inst.__alive) {
					inst.__alive = false;
					inst.onDestroy();

					IM.__cleanupList.push(inst);
					IM.__alteredLists[inst.oid] = true;

					if (inst.__persistent) {
						const idx = IM.__persistentObjects.indexOf(inst);
						IM.__persistentObjects.splice(idx, 1);
					}
				}
			}
		}
	}

	/**
	 * Checks if any of the specified inputs exist.
	 *
	 * @param  {...EngineInstance} targets N instances of EngineInstance or classes
	 * @returns {Boolean} True if any target could be found, false otherwise.
	 */
	static exists(...targets) {
		for (const input of targets) {
			for (const inst of IM.__queryObjects(input)) {
				if (inst.__alive) {
					return true;
				}
			}
		}
		return false;
	}

	// returns the first target instance that was collided with, or undefined if there were none.
	static __performCollision(source, x, y, targets) {
		var hitbox = source.__hitbox;
		const buckets = IM.__getBucketsForObject(source, x, y);
		for (var i = 0; i < targets.length; i++) {
			var { oid, targetInstance } = IM.__queryCollider(targets[i]);

			if (targetInstance) {
				if (targetInstance.__alive && hitbox.doCollision(targetInstance.__hitbox, x, y)) {
					return targetInstance.ref;
				}
			} else {
				var oids = IM.__flatChildMap[oid];
				for (var k = 0; k < buckets.length; k++) {
					var data = buckets[k];
					for (var j = 0; j < oids.length; j++) {
						var arr = data.getArrayForOid(oids[j]);
						for (var l = 0; l < arr.length; l++) {
							if (hitbox.doCollision(arr[l].__hitbox, x, y)) {
								return arr[l].ref;
							}
						}
					}
				}
			}
		}
		return undefined;
	}

	/**
	 * Performs a collision with source against the specified targets.
	 * When you call this function, you are asking the engine to move source to x,y and then check if it's colliding with any objects, then move it back
	 * @param {EngineInstance} source The source instance to collide with
	 * @param {Number} x The x position to collide at
	 * @param {Number} y the y position to collide at
	 * @param  {...EngineInstance} targets N instances of EngineInstance or classes
	 * @returns {Boolean} True if there is a collision, false otherwise
	 */
	static instanceCollision(source, x, y, ...targets) {
		return IM.__performCollision(source, x, y, targets) !== undefined;
	}

	/**
	 * Performs a collision with source against the specified targets.
	 * When you call this function, you are asking the engine to move source to x,y and then check if it's colliding with any objects, then move it back
	 * @param {EngineInstance} source The source instance to collide with
	 * @param {Number} x The x position to collide at
	 * @param {Number} y the y position to collide at
	 * @param  {...EngineInstance} targets N instances of EngineInstance or classes
	 * @returns {EngineInstance} The first EngineInstance that is collided with, or undefined if there are none.
	 */
	static instancePlace(source, x, y, ...targets) {
		return IM.__performCollision(source, x, y, targets);
	}

	/**
	 * Performs a collision with source against the specified targets and returns a list of all instances which are colliding with source.
	 * This function is slow because the engine is forced to check all instances. consider other options if you don't need a list.
	 * When you call this function, you are asking the engine to move source to x, y, then check if it's colliding with any objects, then move it back
	 * @param {EngineInstance} source The source instance to collide with
	 * @param {Number} x The x position to collide at
	 * @param {Number} y the y position to collide at
	 * @param  {...EngineInstance} targets N instances of EngineInstance or classes
	 * @returns {EngineInstance} A non null list of all instances that collide with source
	 */
	static instanceCollisionList(source, x, y, ...targets) {
		var results = [];
		var hitbox = source.__hitbox;
		const buckets = IM.__getBucketsForObject(source, x, y);
		for (var i = 0; i < targets.length; i++) {
			var { oid, targetInstance } = IM.__queryCollider(targets[i]);

			if (targetInstance) {
				if (targetInstance.__alive && hitbox.doCollision(targetInstance.__hitbox, x, y)) {
					results.push(targetInstance);
				}
			} else {
				var oids = IM.__flatChildMap[oid];
				for (var k = 0; k < buckets.length; k++) {
					var data = buckets[k];
					for (var j = 0; j < oids.length; j++) {
						var arr = data.getArrayForOid(oids[j]);
						for (var l = 0; l < arr.length; l++) {
							if (hitbox.doCollision(arr[l].__hitbox, x, y)) {
								results.push(arr[l].ref);
							}
						}
					}
				}
			}
		}
		return results;
	}

	/**
	 * Performs a collision at the specified location using exact hitboxes and finds the first instance of targets which contains that point.
	 * @param {Number} x The x position to collide at
	 * @param {Number} y the y position to collide at
	 * @param  {...EngineInstance} targets N instances of EngineInstance or classes
	 * @returns {EngineInstance} The first EngineInstance that is collided with, or undefined if there is none.
	 */
	static instancePosition(x, y, ...targets) {
		const bucket = IM.__getBucketsForBounds({ x1: x, y1: y, x2: x, y2: y })[0];
		for (var i = 0; i < targets.length; i++) {
			var { oid, targetInstance } = IM.__queryCollider(targets[i]);

			if (targetInstance) {
				if (targetInstance.__alive && targetInstance.__hitbox.containsPoint(x, y)) {
					return targetInstance.ref;
				}
			} else {
				var oids = IM.__flatChildMap[oid];
				for (var j = 0; j < oids.length; j++) {
					var arr = bucket.getArrayForOid(oids[j]);
					for (var l = 0; l < arr.length; l++) {
						if (arr[l].__hitbox.containsPoint(x, y)) {
							return arr[l].ref;
						}
					}
				}
			}
		}
		return undefined;
	}

	/**
	 * Performs a collision at the specified location using exact hitboxes and determines if any instance of targets contains that point
	 * @param {Number} x The x position to collide at
	 * @param {Number} y the y position to collide at
	 * @param  {...EngineInstance} targets N instances of EngineInstance or classes
	 * @returns {Boolean} True if any instance collides with the point, false otherwise
	 */
	static instanceCollisionPoint(x, y, ...targets) {
		return IM.instancePosition(x, y, ...targets) !== undefined;
	}
	/**
	 * Performs a collision at the specified location using exact hitboxes and returns a list of all instances which are contain x, y.
	 * This function is slow because the engine is forced to check all instances. consider other options if you don't need a list.
	 * @param {Number} x The x position to collide at
	 * @param {Number} y the y position to collide at
	 * @param  {...EngineInstance} targets N instances of EngineInstance or classes
	 * @returns {...EngineInstance} A non null list of all instances that collide with source
	 */
	static instanceCollisionPointList(x, y, ...targets) {
		var result = [];
		const bucket = IM.__getBucketsForBounds({ x1: x, y1: y, x2: x, y2: y })[0];
		for (var i = 0; i < targets.length; i++) {
			var { oid, targetInstance } = IM.__queryCollider(targets[i]);

			if (targetInstance) {
				if (targetInstance.__alive && targetInstance.__hitbox.containsPoint(x, y)) {
					result.push(targetInstance.ref);
				}
			} else {
				var oids = IM.__flatChildMap[oid];
				for (var j = 0; j < oids.length; j++) {
					var arr = bucket.getArrayForOid(oids[j]);
					for (var l = 0; l < arr.length; l++) {
						if (arr[l].__hitbox.containsPoint(x, y)) {
							result.push(arr[l].ref);
						}
					}
				}
			}
		}
		return result;
	}

	/**
	 * Queries targets and finds the nearest instance to source. The distance determined is exact and uses hitboxes to find the nearest position on two instances.
	 * As a result, this function is slow. If you don't need exact distance, use instanceNearestPoint.
	 * When you call this function, you are asking the engine to move source to x, y, then find the nearest instance, then move it back
	 * @param {EngineInstance} source The source instance to collide with
	 * @param {Number} x The x position to collide at
	 * @param {Number} y the y position to collide at
	 * @param  {...EngineInstance} targets N instances of EngineInstance or classes
	 * @returns {EngineInstance} The nearest instance of targets, or undefined if no targets exist.
	 */
	static instanceNearest(source, x, y, ...targets) {
		var ox = source._x;
		var oy = source._y;
		source._x = x;
		source.y = y;

		var nearest = undefined;
		var dst = 99999999;
		var listTargets = [];
		for (var i = 0; i < targets.length; i++) {
			var { oid, targetInstance } = IM.__queryCollider(targets[i]);
			if (targetInstance) {
				if (targetInstance.__alive) {
					listTargets.push([targetInstance]);
				}
			} else {
				listTargets.push(IM.__accessMap[oid]);
			}
		}
		for (var i = 0; i < listTargets.length; i++) {
			var lst = listTargets[i];
			for (var k = 0; k < lst.length; k++) {
				var inst = lst[k];
				var nDst = source.__hitbox.distanceToHitboxSq(inst.__hitbox);
				if (nDst < dst) {
					dst = nDst;
					nearest = inst;
					if (nDst === 0) {
						source._x = ox;
						source.y = oy;
						return nearest;
					}
				}
			}
		}
		source._x = ox;
		source.y = oy;
		return nearest;
	}

	/**
	 * Queries targets and finds the nearest instance the point x,y.
	 * Distance is calculated using exact distance to hitboxes.
	 * @param {EngineInstance} source The source instance to collide with
	 * @param {Number} x The x position to collide at
	 * @param {Number} y the y position to collide at
	 * @param  {...EngineInstance} targets N instances of EngineInstance or classes
	 * @returns {EngineInstance} The nearest instance of targets, or undefined if no targets exist.
	 */
	static instanceNearestPoint(x, y, ...targets) {
		var nearest = undefined;
		var dst = 99999999;
		var listTargets = [];
		for (var i = 0; i < targets.length; i++) {
			var { oid, targetInstance } = IM.__queryCollider(targets[i]);
			if (targetInstance) {
				if (targetInstance.__alive) {
					listTargets.push([targetInstance]);
				}
			} else {
				listTargets.push(IM.__accessMap[oid]);
			}
		}
		for (var i = 0; i < listTargets.length; i++) {
			var lst = listTargets[i];
			for (var k = 0; k < lst.length; k++) {
				var inst = lst[k];
				var nDst = inst.__hitbox.distanceToPointSq(x, y);
				if (nDst < dst) {
					dst = nDst;
					nearest = inst;
					if (nDst === 0) {
						return nearest;
					}
				}
			}
		}
	}

	/**
	 * Performs a collision along the line defined by x1,y1,x2,y2. If the line intersects any instance of targets, then the function returns true.
	 * @param {Number} x1 The x coord of the first point
	 * @param {Number} y1 the y coord of the first point
	 * @param {Number} x2 the x coord of the second point
	 * @param {Number} y2 the y coord of the second point
	 * @param  {...EngineInstance} targets N instances of EngineInstance or classes
	 * @returns {EngineInstance} The first EngineInstance that was collided with, or undefined if no targets exist.
	 */
	static instanceCollisionLine(x1, y1, x2, y2, ...targets) {
		var p1 = new EngineLightweightPoint(x1, y1);
		var p2 = new EngineLightweightPoint(x2, y2);
		// slow
		const buckets = IM.__getBucketsForBounds({
			x1: Math.min(x1, x2),
			y1: Math.min(y1, y2),
			x2: Math.max(x1, x2),
			y2: Math.max(y1, y2),
		});
		for (var i = 0; i < targets.length; i++) {
			var { oid, targetInstance } = IM.__queryCollider(targets[i]);
			if (targetInstance) {
				return targetInstance.__alive && targetInstance.__hitbox.checkLineCollision(p1, p2);
			} else {
				var oids = IM.__flatChildMap[oid];
				for (var k = 0; k < buckets.length; k++) {
					var data = buckets[k];
					for (var j = 0; j < oids.length; j++) {
						var arr = data.getArrayForOid(oids[j]);
						for (var l = 0; l < arr.length; l++) {
							if (arr[l].__hitbox.checkLineCollision(p1, p2)) {
								return arr[l].ref;
							}
						}
					}
				}
			}
		}
		return undefined;
	}

	/**
	 * Performs a collision along the line defined by x1,y1,x2,y2. Returns a non null list
	 * of all the instances that collided with the line.
	 *
	 * @param {Number} x1 The x coord of the first point
	 * @param {Number} y1 the y coord of the first point
	 * @param {Number} x2 the x coord of the second point
	 * @param {Number} y2 the y coord of the second point
	 * @param  {...EngineInstance} targets N instances of EngineInstance or classes
	 * @returns {...EngineInstance} A non null list of all instances that collide with source
	 */
	static instanceCollisionLineList(x1, y1, x2, y2, ...targets) {
		var result = [];
		var p1 = new EngineLightweightPoint(x1, y1);
		var p2 = new EngineLightweightPoint(x2, y2);
		// slow
		const buckets = IM.__getBucketsForBounds({
			x1: Math.min(x1, x2),
			y1: Math.min(y1, y2),
			x2: Math.max(x1, x2),
			y2: Math.max(y1, y2),
		});
		for (var i = 0; i < targets.length; i++) {
			var { oid, targetInstance } = IM.__queryCollider(targets[i]);
			if (targetInstance) {
				if (targetInstance.__alive && targetInstance.__hitbox.checkLineCollision(p1, p2)) {
					result.push(targetInstance);
				}
			} else {
				var oids = IM.__flatChildMap[oid];
				for (var k = 0; k < buckets.length; k++) {
					var data = buckets[k];
					for (var j = 0; j < oids.length; j++) {
						var arr = data.getArrayForOid(oids[j]);
						for (var l = 0; l < arr.length; l++) {
							if (arr[l].__hitbox.checkLineCollision(p1, p2)) {
								result.push(arr[l].ref);
							}
						}
					}
				}
			}
		}
		return result;
	}

	/**
	 * Queries the InstanceManager's internal list of objects and returns the nth instance of type obj, not including subclasses
	 *
	 * This is a constant time operation.
	 * @param {EngineInstance} obj  the class to query
	 * @param {Number} [ind=0] the nth instance to find.
	 * @returns {EngineInstance} The requested instance, or undefined if unvailable.
	 */
	static findExact(obj, ind = 0) {
		var oid = IM.__oidFrom(obj);
		return IM.__accessMap[oid][ind];
	}

	/**
	 * Finds the nth instance of type obj or a sublcass, ordered by creation time.
	 *
	 * This is a linear time operation
	 *
	 * @param {EngineInstance} obj  the class to query
	 * @param {Number} [ind=0] the nth instance to find.
	 * @returns {EngineInstance} The requested instance, or undefined if unvailable.
	 */
	static find(obj, ind = 0) {
		const { checkLow, checkHigh, checkId } = IM.__queryLookupData(obj);
		var current = 0;
		var len = IM.__objects.length;
		for (var i = 0; i < len; i++) {
			const obj = IM.__objects[i];
			if ((obj.__childLow >= checkLow && obj.__childHigh <= checkHigh) || obj.id === checkId) {
				if (current === ind) {
					return obj;
				}
				current++;
			}
		}
		return undefined;
	}

	/**
	 * Runs the specified function as func(target,other) on all instances that match target.
	 *
	 * Note that 'this' will be undefined in the script. This is done for clarity purposes.
	 * You can still supply the calling instance using other.
	 *
	 * @param {EngineInstance} target The target instance, or class.
	 * @param {Function} script The script to execute
	 * @param {EngineInstance} [other] the calling instance (usually this)
	 */
	static with(target, script, other = undefined) {
		var instances = IM.__queryObjects(target);
		for (const inst of instances) {
			script(inst, other);
		}
	}

	/**
	 * Queries the InstanceManager's internal list of objects and returns all instances that are
	 * of type target or a child or target. The order of the returned instances is that of their creation order.
	 *
	 * This means that the 0th instance will be the oldest instance in the room of type target, and the
	 * n-1th instance is the newest instance.
	 *
	 * @param {...EngineInstance} targets The target instance or class.
	 * @returns A non null array of all the instances that match the specified query.
	 */
	static findAll(...targets) {
		var list = [];
		for (var target of targets) {
			list.push(...IM.__queryObjects(target));
		}
		list.sort((x, y) => x.id - y.id);
		return list;
	}
}

class FastIterationCollisionSet {
	constructor() {
		this.__map = new WeakMap();
		this.__arr = new Array(IM.__numRegisteredClasses + 2); // + null + EngineInstance;
		this.__arr[0] = null;
		for (var i = 0; i <= IM.__numRegisteredClasses; i++) {
			this.__arr[i + 1] = [];
		}
		this.__deleteTarget = null;
	}

	getArrayForOid(idx) {
		return this.__arr[idx];
	}

	add(instance) {
		// This code prevents a deoptimization from occuring and results in a massive performance gain.
		// It took me 3 hours to figure this out.
		var p = {
			__collisionId: 0,
			__childLow: instance.__childLow,
			__childHigh: instance.__childHigh,
			id: instance.id,
			__hitbox: instance.__hitbox, // requires a full remove / add on hitbox change
			ref: instance,
		};
		var arr = this.__arr[instance.oid];
		this.__map.set(instance, arr.length);
		arr.push(p);
	}

	delete(instance) {
		var arr = this.__arr[instance.oid];
		var idx = this.__map.get(instance);
		var obj = arr.pop();
		if (obj.ref !== instance) {
			arr[idx] = obj;
			this.__map.set(obj.ref, idx);
		}
	}
}

IM.__accessMap = []; // indexes every single instance with oid being the key and an array of all those instances being the value
IM.__alteredLists = []; // whether or not this specific OID has had instances removed (lets us skip filtering objects which haven't been touched)
IM.__childMap = []; // maps each oid to a tree containting all children oid
IM.__childTree = {
	__oid: EngineInstance,
	__children: undefined,
};
IM.__flatChildMap = [];
IM.__numRegisteredClasses = -1;
IM.__oidToClass = undefined;
IM.__cleanupList = [];
IM.__persistentObjects = [];
IM.__persistentStore = new Map();
IM.__collisionId = 0;
IM.__runtimeId = 1;
IM.__initializeVariables();

/*
class Instance {

}

class t extends Instance{

}

class f extends t {
}

class z extends f {

}

class h extends z {
}

IM.__init([t,h,z,f]);

console.log(IM.__children(IM.__oidFrom(Instance)));
*/
