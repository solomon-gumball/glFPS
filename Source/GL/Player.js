function Player(options) {
	this.position = options.position;
	this.rotation = 0;
	this.rotationRate = 0;
	this.zSpeed = 0;
	this.xSpeed = 0;
}

module.exports = Player;