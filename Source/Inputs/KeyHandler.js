var KEY_MAP = require('./keymap.js');
var KeyHandler = {};

KeyHandler.init = function init() {
	this._activeKeys = {};
	this._handlers = {};
	this._updateFns = [];
	this._press = {};

	this.EVENTTYPES = {
		'PRESS' : this._press
	}

	this.boundKeyDown = registerKeyDown.bind(this);
	this.boundKeyUp = registerKeyUp.bind(this);

	document.onkeydown = this.boundKeyDown;
	document.onkeyup = this.boundKeyUp;
}

KeyHandler.update = function update() {
	var handlers;
	var handlersLength;
	var updatesLength = this._updateFns.length;
	var i;
	
	for(var key in this._activeKeys){
		if(this._activeKeys[key] === true){
			handlers = this._handlers[key];
			if(handlers) {
				handlersLength = handlers.length;
				for (i = 0; i < handlersLength; i++) {
					handlers[i]();
				}
			}
		}
	}

	for (var i = 0; i < updatesLength; i++) {
		this._updateFns[i](this._activeKeys);
	}
}

KeyHandler.on = function on(eventName, callback) {
	eventName = eventName.toUpperCase();
	if( eventName.indexOf(':') !== -1 ) {
		var eventName = eventName.split(':');
		var key = eventName[0];
		var type = eventName[1];
		var storage = this.EVENTTYPES[eventName[1]];
		if( !storage ) throw "invalid eventType";
		if( !storage[key] ) storage[key] = [];
		storage[key].push(callback);
	}
	else if( KEY_MAP.letters[eventName] ) {
		if(!this._handlers[eventName]) this._handlers[eventName] = [];
		this._handlers[eventName].push(callback);
	}
	else if (eventName === "UPDATE") {
		this._updateFns.push(callback);
	}
	else throw "invalid eventName";
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
				delete this._activeKeys[key];
			}
		}
	}
}

function registerKeyDown(event) {
	var keyName = KEY_MAP.keys[event.keyCode];
	var pressEvents = this._press[keyName];
	if (keyName) this._activeKeys[keyName] = true;
	if (pressEvents) {
		for (var i = 0; i < pressEvents.length; i++) {
			pressEvents[i]();
		}
	}
}

function registerKeyUp(event) {
	var keyName = KEY_MAP.keys[event.keyCode];
	if (keyName) this._activeKeys[keyName] = false;
}

module.exports = KeyHandler;