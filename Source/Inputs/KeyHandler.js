var KEY_MAP = require('./keymap.js');
var KeyHandler = {};

KeyHandler.init = function init() {
	this._pressed = {};
	this._handlers = {};

	this.boundKeyDown = registerKeyDown.bind(this);
	this.boundKeyUp = registerKeyUp.bind(this);

	document.onkeydown = this.boundKeyDown;
	document.onkeyup = this.boundKeyUp;
}

KeyHandler.update = function update() {
	var handlers;
	var handlersLength;
	var i;
	
	for(var key in this._pressed){
		if(this._pressed[key] === true){
			handlers = this._handlers[key];
			handlersLength = handlers.length;
			for (i = 0; i < handlersLength; i++) {
				handlers[i]();
			}
		}
	}
}

KeyHandler.on = function on(key, callback) {
	if(!this._handlers[key]) this._handlers[key] = [];
	this._handlers[key].push(callback);
}

KeyHandler.off = function off(key, callback) {
	var callbackIndex;
	var callbacks;

	if(this._handlers[key]) {
		callbacks = this._handlers[key];
		callbackIndex = callbacks.indexOf(callback);
		if(callbackIndex !== -1) {
			callbacks.splice(callbackIndex, 1);
			if(!callbacks.length) {
				delete callbacks;
				delete this._pressed[key];
			}
		}
	}
}

function registerKeyDown(event) {
	var keyName = KEY_MAP[event.keyCode];
	if (this._handlers[keyName]) this._pressed[keyName] = true;
}

function registerKeyUp(event) {
	var keyName = KEY_MAP[event.keyCode];
	if (this._handlers[keyName]) this._pressed[keyName] = false;
}

module.exports = KeyHandler;