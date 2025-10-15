class TestInstance extends InstanceMover {
	onEngineCreate() {
		super.onEngineCreate();
		this.dy = 0;
		this.dx = 0;
		this.grav = 0;
		this.shouldDie = false;
		this.dz = 0.01; //EngineUtils.randomRange(-Math.PI/16,Math.PI/16)
		this.setSprite(new PIXI.Sprite($engine.getTexture("default")));
		this.hitbox = new Hitbox(
			this,
			new PolygonHitbox(new Vertex(-32, -32), new Vertex(32, -32), new Vertex(32, 32), new Vertex(-32, 32))
		);
		// this.graphics = $engine.createRenderable(this, new PIXI.Graphics());
		this.turnLagStop = 8;
		this.snapDistance = 8;
		this.xScale = 0.75;
		this.yScale = 0.75;
		IM.makePersistent(this);
	}

	onCreate(x, y) {
		this.x = x;
		this.y = y;
		this.onEngineCreate();
	}

	step() {
		super.step();
		/*
        if(IM.instanceCollision(this,this.x,this.y,TestInstance2)) { // touching
            if(this.dy===0) {
                while(IM.instanceCollision(this,this.x,this.y,TestInstance2))
                    this.y-=1;
            }
        }

        while(IM.instanceCollisionLine(0,0,200,200,this)) { // touching
            this.y-=1;
        }

        if(IM.instanceCollision(this,this.x+this.dx,this.y,TestInstance2)) {
            while(!IM.instanceCollision(this,this.x+Math.sign(this.dx),this.y,TestInstance2))
                this.x+=Math.sign(this.dx);
            this.dx = 0;
        }*/
		if (IN.keyCheckPressed("KeyE")) {
			$__engineData.__debugLogFrameTime = true;
			for (var i = 0; i < 250; i++) {
				new TestInstance2(
					IM.findExact(TestInstance2).x + EngineUtils.irandomRange(-1024, 1024),
					IM.findExact(TestInstance2).y + EngineUtils.irandomRange(-1024, 1024)
				);
			}
		}
		if (IN.keyCheckPressed("KeyP")) {
			RoomManager.changeRooms("TestRoom2");
		}
		if (IN.keyCheckPressed("KeyO")) {
			RoomManager.changeRooms("TestRoom");
		}
		var accel = [0, 0];
		if (IN.keyCheck("ArrowRight")) {
			accel[0] += 2;
		} else if (IN.keyCheck("ArrowLeft")) {
			accel[0] -= 2;
		}
		if (IN.keyCheck("ArrowUp")) {
			accel[1] -= 2;
		} else if (IN.keyCheck("ArrowDown")) {
			accel[1] += 2;
		}

		this.move(accel, this.vel);

		//this.angle += this.dz;
		/*
        if(IM.instanceCollision(this,this.x,this.y+this.dy,TestInstance2)) {
            while(!IM.instanceCollision(this,this.x,this.y+Math.sign(this.dy),TestInstance2))
                this.y+=Math.sign(this.dy);
            this.dy = 0;
            this.dx/=1.1
            if(this.shouldDie) {
                this.destroy();
            }
            //$engine.endGame();
        }*/

		//if(Input.isPressed('down'))
		//this.y+=5;
	}

	canControl() {
		return true;
	}

	collisionCheck(x, y) {
		return IM.instanceCollision(this, x, y, TestInstance2);
	}

	draw(gui, camera) {
		return;
		// EngineDebugUtils.drawHitbox(camera, this);
		// EngineDebugUtils.drawBoundingBox(camera, this);

		var graphics = this.graphics;
		graphics.clear();
		var touching = EngineUtils.linesCollide(
			new Vertex(0, 0),
			new Vertex(200, 200),
			new Vertex(500, 300),
			new Vertex(this.x, this.y)
		);
		// var touching = this.hitbox.containsPoint(200, 200);
		graphics
			.lineStyle(1, 0xe74c3c)
			.moveTo(0, 0)
			.lineTo(200, 200)
			.moveTo(500, 300)
			.lineStyle(1, touching ? 0xffffff : 0xe74c3c)
			.lineTo(this.x, this.y);

		graphics.lineStyle(0, 0);
		graphics.beginFill(0xffffff);
		graphics.drawRect(IN.getMouseX() - 32, IN.getMouseY() - 32, 64, 64);
		graphics.endFill();
	}

	drawExtras(gui, camera) {
		//EngineDebugUtils.drawHitbox(camera,this);
		//EngineDebugUtils.drawBoundingBox(camera,this);
	}
}
