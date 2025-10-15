/*:
 * @plugindesc Plugin used to set basic parameters.
 * @author Marcus Der
 *
 * @help This plugin does not provide plugin commands.
 *
* @param hello
* 
 */

(function() {
Game_Character.prototype.vsp = 0
Game_Character.prototype.ground_level = 7
	
Game_CharacterBase.prototype.update = function() {
    if (this.isStopping()) {
        this.updateStop();
    }
    if (this.isJumping()) {
        this.updateJump();
    } else if (this.isMoving()) {
		
		if(Input.isPressed("right")) {
			this._x += 0.15
			this._realX += 0.15
		}
		if(Input.isPressed("left")) {
			this._x -= 0.15
			this._realX -= 0.15
		}
		if(Input.isPressed("up") && this._y == this.ground_level)
		{
			this.vsp = -0.4
		}
		
		this._y += this.vsp
		this._realY += this.vsp
		
		if (this._y >= this.ground_level)
		{
			this._y = this.ground_level
			this._realY = this.ground_level
			this.vsp = 0
		} else
		{
			this.vsp += 0.03
		}
		
		/* if(Input.isPressed("down")) {
			this._y += 0.1
			this._realY += 0.1
		}*/ 
		/*if(Input.isPressed("up")) {
			this._y -= 0.1
			this._realY -= 0.1
		}*/ 
			//this.updateMove();
    }
    this.updateAnimation();
};
})()