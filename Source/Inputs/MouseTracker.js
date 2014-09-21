var MouseTracker = {};

MouseTracker.init = function init() {
	this._mousePosition = [0, 0];
	this._handlers = [];
	this._updateFns = [];
	this._currentVelocity = [0, 0];
	this._lastPosition = [0, 0];
	this._lastTime = Date.now();

	document.addEventListener('mousemove', this.handleMouseMove.bind(this));
}

MouseTracker.update = function update() {
	if (!this._updated) this._currentVelocity = [0, 0];

	for (var i = 0; i < this._updateFns.length; i++) {
		this._updateFns[i]( this._currentVelocity );
	}

	this._updated = false;
};

MouseTracker.on = function on(eventName, callback) {
	eventName = eventName.toUpperCase();
	if(eventName === 'UPDATE') this._updateFns.push(callback);
}

MouseTracker.getMousePosition = function getMousePosition() {
	return this._mousePosition;
}

MouseTracker.handleMouseMove = function handleMouseMove(event) {
	var currentTime = Date.now();
	var duration = currentTime - this._lastTime;

	var currentPosition = [
		(event.x / innerWidth) - 0.5,
		(event.y / innerHeight) - 0.5
	];

	this._currentVelocity = [
		(this._lastPosition[0] - currentPosition[0]) / (10.0 * duration),
		(this._lastPosition[1] - currentPosition[1]) / (10.0 * duration)
	];

	this._lastPosition = currentPosition;
	this._lastTime = currentTime;
	this._updated = true;
}

module.exports = MouseTracker;