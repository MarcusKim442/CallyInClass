class V2D extends PIXI.Point {
	constructor(x, y) {
		super(x, y);
		// delay setter
		this._x = x;
		this.y = y;
	}

	dot(other) {
		return this.x * other.x + this.y * other.y;
	}

	static dot(v1, v2) {
		return v1.x * v2.x + v1.y + v2.y;
	}

	add(...vertices) {
		var sx = x;
		var sy = y;
		for (const v of vertices) {
			sx += v.x;
			sy += v.y;
		}
		this._x = sx;
		this.y = sy;
	}

	abs() {
		return new V2D(Math.abs(this._x), Math.abs(this._y));
	}

	mirror(angle) {
		const newAngle = V2D.mirrorAngle(this._angle, angle);
		Vertex.prototype.rotate.call(this, this._angle - newAngle);
	}

	/**
	 * Mirrors input across the line projected out by mirror
	 *
	 * Note this method does not *reflect*, it mirrors it across the plane
	 *
	 * @param {Number} input The input angle
	 * @param {Number} mirror The mirror angle
	 * @returns Input mirrored across mirror
	 */
	static mirrorAngle(input, mirror) {
		var diff = V2D.angleDiff(input, mirror);
		return input + diff * 2;
	}

	/**
	 * Reflects input as if it struck a mirror. Convenience function.
	 *
	 * @param {Number} input The input angle
	 * @param {Number} mirror The mirror angle
	 * @returns Input reflected by mirror
	 */
	static reflectAngle(input, mirror) {
		return V2D.mirrorAngle(input, mirror + Math.PI / 2);
	}

	static lengthDirX(angle, distance) {
		return Math.cos(angle) * distance;
	}

	static lengthDirY(angle, distance) {
		return -Math.sin(angle) * distance;
	}

	static distance(x1, y1, x2, y2) {
		var dx = x2 - x1;
		var dy = y2 - y1;
		return Math.sqrt(dx * dx + dy * dy);
	}

	static distanceSq(x1, y1, x2, y2) {
		var dx = x2 - x1;
		var dy = y2 - y1;
		return dx * dx + dy * dy;
	}

	static angleDiff(ang1, ang2) {
		// code written by bennedich https://stackoverflow.com/users/352837/bennedich
		// source: https://stackoverflow.com/a/7869457
		var diff = ang2 - ang1;
		return ((((diff + Math.PI) % Math.TWO_PI) + Math.TWO_PI) % Math.TWO_PI) - Math.PI;
	}

	static calcMag(x, y) {
		return Math.sqrt(x * x + y * y);
	}

	static calcDir(x, y) {
		return Math.atan2(y, x);
	}
}
Object.defineProperty(V2D.prototype, "x", {
	set: function (x) {
		this._x = x;
		this._length = V2D.calcMag(this.x, this.y);
		this._angle = V2D.calcDir(this.x, this.y);
	},
	get: function () {
		return this._x;
	},
});
Object.defineProperty(V2D.prototype, "y", {
	set: function (y) {
		this._y = y;
		this._length = V2D.calcMag(this.x, this.y);
		this._angle = V2D.calcDir(this.x, this.y);
	},
	get: function () {
		return this._y;
	},
});
Object.defineProperty(V2D.prototype, "length", {
	set: function (len) {
		var l = Math.sqrt(this._x * this._x + this._y * this._y);
		const fac = len / l;
		this._x = this._x * fac;
		this._y = this._y * fac;
		this._length = len;
	},
	get: function () {
		return this._length;
	},
});
Object.defineProperty(V2D.prototype, "angle", {
	set: function (angle) {
		const len = this.length;
		this._x = Math.cos(angle) * len;
		this._y = Math.sin(angle) * len;
		this._angle = angle;
	},
	get: function () {
		return this._angle;
	},
});
Math.TWO_PI = Math.PI * 2;
