var MouseTracker = {};

MouseTracker.init = function init() {
	this._mousePosition = [0, 0];
	this._handlers = [];
	this._updateFns = [];

	document.addEventListener('mousemove', this.handleMouseMove.bind(this));
}

MouseTracker.update = function update() {

};

MouseTracker.on = function on(event, callback) {
	// if(event === 'update') {}
}

MouseTracker.getMousePosition = function getMousePosition() {
	return this._mousePosition;
}

MouseTracker.handleMouseMove = function handleMouseMove(event) {
	this._mousePosition = [
		(event.x / innerWidth) - 0.5,
		(event.y / innerHeight) - 0.5
	];
}

module.exports = MouseTracker;