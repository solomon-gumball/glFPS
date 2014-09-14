(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/joseph/code/FPS/Source/Events/EventEmitter.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* Owner: mark@famo.us
* @license MPL 2.0
* @copyright Famous Industries, Inc. 2014
*/

/**
 * EventEmitter represents a channel for events.
 *
 * @class EventEmitter
 * @constructor
 */
function EventEmitter() {
    this.listeners = {};
    this._owner = this;
}

/**
 * Trigger an event, sending to all downstream handlers
 *   listening for provided 'type' key.
 *
 * @method emit
 *
 * @param {string} type event type key (for example, 'click')
 * @param {Object} event event data
 * @return {EventHandler} this
 */
EventEmitter.prototype.emit = function emit(type, event) {
    var handlers = this.listeners[type];
    if (handlers) {
        for (var i = 0; i < handlers.length; i++) {
            handlers[i].call(this._owner, event);
        }
    }
    return this;
};

/**
 * Bind a callback function to an event type handled by this object.
 *
 * @method "on"
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function(string, Object)} handler callback
 * @return {EventHandler} this
 */
EventEmitter.prototype.on = function on(type, handler) {
    if (!(type in this.listeners)) this.listeners[type] = [];
    var index = this.listeners[type].indexOf(handler);
    if (index < 0) this.listeners[type].push(handler);
    return this;
};

/**
 * Alias for "on".
 * @method addListener
 */
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

/**
 * Unbind an event by type and handler.
 *   This undoes the work of "on".
 *
 * @method removeListener
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function} handler function object to remove
 * @return {EventEmitter} this
 */
EventEmitter.prototype.removeListener = function removeListener(type, handler) {
    var index = this.listeners[type].indexOf(handler);
    if (index >= 0) this.listeners[type].splice(index, 1);
    return this;
};

/**
 * Call event handlers with this set to owner.
 *
 * @method bindThis
 *
 * @param {Object} owner object this EventEmitter belongs to
 */
EventEmitter.prototype.bindThis = function bindThis(owner) {
    this._owner = owner;
};

module.exports = EventEmitter;
},{}],"/Users/joseph/code/FPS/Source/Events/EventHandler.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* Owner: mark@famo.us
* @license MPL 2.0
* @copyright Famous Industries, Inc. 2014
*/

var EventEmitter = require('./EventEmitter');

/**
 * EventHandler forwards received events to a set of provided callback functions.
 * It allows events to be captured, processed, and optionally piped through to other event handlers.
 *
 * @class EventHandler
 * @extends EventEmitter
 * @constructor
 */
function EventHandler() {
    EventEmitter.apply(this, arguments);

    this.downstream = []; // downstream event handlers
    this.downstreamFn = []; // downstream functions

    this.upstream = []; // upstream event handlers
    this.upstreamListeners = {}; // upstream listeners
}
EventHandler.prototype = Object.create(EventEmitter.prototype);
EventHandler.prototype.constructor = EventHandler;

/**
 * Assign an event handler to receive an object's input events.
 *
 * @method setInputHandler
 * @static
 *
 * @param {Object} object object to mix trigger, subscribe, and unsubscribe functions into
 * @param {EventHandler} handler assigned event handler
 */
EventHandler.setInputHandler = function setInputHandler(object, handler) {
    object.trigger = handler.trigger.bind(handler);
    if (handler.subscribe && handler.unsubscribe) {
        object.subscribe = handler.subscribe.bind(handler);
        object.unsubscribe = handler.unsubscribe.bind(handler);
    }
};

/**
 * Assign an event handler to receive an object's output events.
 *
 * @method setOutputHandler
 * @static
 *
 * @param {Object} object object to mix pipe, unpipe, on, addListener, and removeListener functions into
 * @param {EventHandler} handler assigned event handler
 */
EventHandler.setOutputHandler = function setOutputHandler(object, handler) {
    if (handler instanceof EventHandler) handler.bindThis(object);
    object.pipe = handler.pipe.bind(handler);
    object.unpipe = handler.unpipe.bind(handler);
    object.on = handler.on.bind(handler);
    object.addListener = object.on;
    object.removeListener = handler.removeListener.bind(handler);
};

/**
 * Trigger an event, sending to all downstream handlers
 *   listening for provided 'type' key.
 *
 * @method emit
 *
 * @param {string} type event type key (for example, 'click')
 * @param {Object} event event data
 * @return {EventHandler} this
 */
EventHandler.prototype.emit = function emit(type, event) {
    EventEmitter.prototype.emit.apply(this, arguments);
    var i = 0;
    for (i = 0; i < this.downstream.length; i++) {
        if (this.downstream[i].trigger) this.downstream[i].trigger(type, event);
    }
    for (i = 0; i < this.downstreamFn.length; i++) {
        this.downstreamFn[i](type, event);
    }
    return this;
};

/**
 * Alias for emit
 * @method addListener
 */
EventHandler.prototype.trigger = EventHandler.prototype.emit;

/**
 * Add event handler object to set of downstream handlers.
 *
 * @method pipe
 *
 * @param {EventHandler} target event handler target object
 * @return {EventHandler} passed event handler
 */
EventHandler.prototype.pipe = function pipe(target) {
    if (target.subscribe instanceof Function) return target.subscribe(this);

    var downstreamCtx = (target instanceof Function) ? this.downstreamFn : this.downstream;
    var index = downstreamCtx.indexOf(target);
    if (index < 0) downstreamCtx.push(target);

    if (target instanceof Function) target('pipe', null);
    else if (target.trigger) target.trigger('pipe', null);

    return target;
};

/**
 * Remove handler object from set of downstream handlers.
 *   Undoes work of "pipe".
 *
 * @method unpipe
 *
 * @param {EventHandler} target target handler object
 * @return {EventHandler} provided target
 */
EventHandler.prototype.unpipe = function unpipe(target) {
    if (target.unsubscribe instanceof Function) return target.unsubscribe(this);

    var downstreamCtx = (target instanceof Function) ? this.downstreamFn : this.downstream;
    var index = downstreamCtx.indexOf(target);
    if (index >= 0) {
        downstreamCtx.splice(index, 1);
        if (target instanceof Function) target('unpipe', null);
        else if (target.trigger) target.trigger('unpipe', null);
        return target;
    }
    else return false;
};

/**
 * Bind a callback function to an event type handled by this object.
 *
 * @method "on"
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function(string, Object)} handler callback
 * @return {EventHandler} this
 */
EventHandler.prototype.on = function on(type, handler) {
    EventEmitter.prototype.on.apply(this, arguments);
    if (!(type in this.upstreamListeners)) {
        var upstreamListener = this.trigger.bind(this, type);
        this.upstreamListeners[type] = upstreamListener;
        for (var i = 0; i < this.upstream.length; i++) {
            this.upstream[i].on(type, upstreamListener);
        }
    }
    return this;
};

/**
 * Alias for "on"
 * @method addListener
 */
EventHandler.prototype.addListener = EventHandler.prototype.on;

/**
 * Listen for events from an upstream event handler.
 *
 * @method subscribe
 *
 * @param {EventEmitter} source source emitter object
 * @return {EventHandler} this
 */
EventHandler.prototype.subscribe = function subscribe(source) {
    var index = this.upstream.indexOf(source);
    if (index < 0) {
        this.upstream.push(source);
        for (var type in this.upstreamListeners) {
            source.on(type, this.upstreamListeners[type]);
        }
    }
    return this;
};

/**
 * Stop listening to events from an upstream event handler.
 *
 * @method unsubscribe
 *
 * @param {EventEmitter} source source emitter object
 * @return {EventHandler} this
 */
EventHandler.prototype.unsubscribe = function unsubscribe(source) {
    var index = this.upstream.indexOf(source);
    if (index >= 0) {
        this.upstream.splice(index, 1);
        for (var type in this.upstreamListeners) {
            source.removeListener(type, this.upstreamListeners[type]);
        }
    }
    return this;
};

module.exports = EventHandler;
},{"./EventEmitter":"/Users/joseph/code/FPS/Source/Events/EventEmitter.js"}],"/Users/joseph/code/FPS/Source/Game/Engine.js":[function(require,module,exports){
var EventHandler       = require('../Events/EventHandler');

var Engine             = {};

Engine.eventInput      = new EventHandler();
Engine.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Engine, Engine.eventInput);
EventHandler.setOutputHandler(Engine, Engine.eventOutput);

Engine.currentState = null;

Engine.setState     = function setState(state)
{
	if (state.initialize) state.initialize();
	
	if (this.currentState)
	{
		this.currentState.unpipe(Engine.eventInput);
		this.currentState.hide();
	}

	state.pipe(this.eventInput);
	state.show();

	this.currentState = state;
};

Engine.step         = function step(time)
{
	var state = Engine.currentState;
	if (state)
	{
		if (state.update) state.update();
	}
};

module.exports = Engine;
},{"../Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js"}],"/Users/joseph/code/FPS/Source/Game/ImageLoader.js":[function(require,module,exports){
var ASSET_TYPE = 'image';

var EventHandler       = require('../Events/EventHandler');

var ImageLoader  = {};
var Images       = {};

ImageLoader.eventInput      = new EventHandler();
ImageLoader.eventOutput     = new EventHandler();

EventHandler.setInputHandler(ImageLoader, ImageLoader.eventInput);
EventHandler.setOutputHandler(ImageLoader, ImageLoader.eventOutput);

ImageLoader.load = function load(asset)
{
    var source = asset.source;
    if (!Images[source])
    {
        var image = new Image();
        image.src = source;
        image.onload = function() {
            finishedLoading(source);
        };
        Images[source] = image;
    }
};

ImageLoader.get  = function get(source)
{
    return Images[source];
};

ImageLoader.toString = function toString()
{
    return ASSET_TYPE;
};

function finishedLoading(source)
{
    ImageLoader.eventOutput.emit('doneLoading', {source: source, type: ASSET_TYPE});
}

module.exports = ImageLoader;
},{"../Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js"}],"/Users/joseph/code/FPS/Source/Game/Viewport.js":[function(require,module,exports){
var EventHandler       = require('../Events/EventHandler');

var Viewport = {};

Viewport.eventInput      = new EventHandler();
Viewport.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Viewport, Viewport.eventInput);
EventHandler.setOutputHandler(Viewport, Viewport.eventOutput);

window.onresize = handleResize;

function handleResize()
{
	Viewport.eventOutput.emit('resize');
}

module.exports = Viewport;
},{"../Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js"}],"/Users/joseph/code/FPS/Source/Inputs/KeyHandler.js":[function(require,module,exports){
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
},{"./keymap.js":"/Users/joseph/code/FPS/Source/Inputs/keymap.js"}],"/Users/joseph/code/FPS/Source/Inputs/keymap.js":[function(require,module,exports){
module.exports = 
{
  65 : 'A',
  66 : 'B',
  67 : 'C',
  68 : 'D',
  69 : 'E',
  70 : 'F',
  71 : 'G',
  72 : 'H',
  73 : 'I',
  74 : 'J',
  75 : 'K',
  76 : 'L',
  77 : 'M',
  78 : 'N',
  79 : 'O',
  80 : 'P',
  81 : 'Q',
  82 : 'R',
  83 : 'S',
  84 : 'T',
  85 : 'U',
  86 : 'V',
  87 : 'W',
  88 : 'X',
  89 : 'Y',
  90 : 'Z',
  13 : 'ENTER',
  16 : 'SHIFT',
  27 : 'ESC',
  32 : 'SPACE',
  37 : 'LEFT',
  38 : 'UP',
  39 : 'RIGHT',
  40 : 'DOWN'
};
},{}],"/Users/joseph/code/FPS/Source/States/Loading.js":[function(require,module,exports){
var COMPLETE = "complete";
var LOAD_STARTED = "startLoading";
var LOAD_COMPLETED = "doneLoading";
var NONE = 'none';
var VISIBLE = 'inline';

var EventHandler       = require('../Events/EventHandler');

var Loading          = {};
var bodyReady        = false;
var assetStack       = [];
var loaderRegistry   = {};
var container        = null;
var splashScreen     = new Image();
splashScreen.src     = '../../Assets/Loading....png';
splashScreen.width   = splashWidth = 500;
splashScreen.height  = splashHeight = 160;
Loading.eventInput      = new EventHandler();
Loading.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Loading, Loading.eventInput);
EventHandler.setOutputHandler(Loading, Loading.eventOutput);

Loading.eventInput.on(LOAD_COMPLETED, handleCompletedLoad);
Loading.eventInput.on('resize', handleResize);

Loading.initialize = function initialize()
{
    if (!container)
    {
        container = document.getElementById('loading');
        container.appendChild(splashScreen);
        splashScreen.style.position = 'absolute';
        splashScreen.style.top = (window.innerHeight * 0.5) - (splashHeight * 0.5) + 'px';
        splashScreen.style.left = (window.innerWidth * 0.5) - (splashWidth* 0.5) + 'px';
    }
    if (assetStack.length)
    {
        this.eventOutput.emit(LOAD_STARTED);
        for (var i = 0; i < assetStack.length; i++)
        {
            var asset  = assetStack[i];
            var loader = asset.type;
            loaderRegistry[loader].load(asset);
        }
    }
};

Loading.load       = function load(asset)
{
    assetStack.push(asset);
};

Loading.show       = function show()
{
    container.style.display = VISIBLE;
};

Loading.hide       = function hide()
{
    container.style.display = NONE;
};

Loading.register   = function register(loader)
{
    var loaderName             = loader.toString();
    loaderRegistry[loaderName] = loader;
    loader.pipe(this.eventInput);
};

function handleCompletedLoad(data)
{
    setTimeout(function()
    {
        var source = data.source;
        var location = assetStack.indexOf(source);
        if (location) assetStack.splice(location, 1);
        if (!assetStack.length) Loading.eventOutput.emit(LOAD_COMPLETED);
    }, 1000);
}

function handleResize()
{
    splashScreen.style.top = (window.innerHeight * 0.5) - (splashHeight * 0.5) + 'px';
    splashScreen.style.left = (window.innerWidth * 0.5) - (splashWidth* 0.5) + 'px';
}

module.exports = Loading;
},{"../Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js"}],"/Users/joseph/code/FPS/Source/States/Menu.js":[function(require,module,exports){
var NONE = 'none';
var VISIBLE = 'inline';

var EventHandler       = require('../Events/EventHandler');

var Menu          = {};

Menu.eventInput      = new EventHandler();
Menu.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Menu, Menu.eventInput);
EventHandler.setOutputHandler(Menu, Menu.eventOutput);

Menu.eventInput.on('resize', handleResize);

var menuElement = null,
container       = null,
newGame         = null;

Menu.initialize = function initialize()
{
    container = document.getElementById('menu');
    menuElement = document.createElement('div');
    menuElement.style.position = 'absolute';
    newGame     = document.createElement('div');
    newGame.onclick = startNewGame;
    newGame.innerHTML = 'New Game';
    newGame.style.fontSize = '50px';
    newGame.style.fontFamily = 'Helvetica';
    newGame.style.color = '#FFF';
    menuElement.appendChild(newGame);
    container.appendChild(menuElement);
    menuElement.style.top  = (window.innerHeight * 0.5) - (58 * 0.5) + 'px';
    menuElement.style.left = (window.innerWidth * 0.5) - (251 * 0.5) + 'px';
};

Menu.show       = function show()
{
    container.style.display = VISIBLE;
};

Menu.hide       = function hide()
{
    container.style.display = NONE;
};

function handleResize()
{
    menuElement.style.top = (window.innerHeight * 0.5) - (58 * 0.5) + 'px';
    menuElement.style.left = (window.innerWidth * 0.5) - (251 * 0.5) + 'px';
}

function startNewGame()
{
    Menu.eventOutput.emit('newGame');
}

module.exports = Menu;
},{"../Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js"}],"/Users/joseph/code/FPS/Source/States/Playing.js":[function(require,module,exports){
var NONE = 'none';
var VISIBLE = 'inline';

var EventHandler       = require('../Events/EventHandler');
var KeyHandler         = require('../Inputs/KeyHandler');

var Playing          = {};

Playing.eventInput      = new EventHandler();
Playing.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Playing, Playing.eventInput);
EventHandler.setOutputHandler(Playing, Playing.eventOutput);

Playing.initialize = function initialize()
{
	KeyHandler.init();
	KeyHandler.on('A', function () {
		console.log('a');
	});
	window.aba = KeyHandler;
};

Playing.update     = function update()
{
	KeyHandler.update();
};

Playing.show       = function show()
{
};

Playing.hide       = function hide()
{
};

module.exports = Playing;
},{"../Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js","../Inputs/KeyHandler":"/Users/joseph/code/FPS/Source/Inputs/KeyHandler.js"}],"/Users/joseph/code/FPS/Source/main.js":[function(require,module,exports){
var Engine  = require('./Game/Engine');
var Loading = require('./States/Loading');
var Menu    = require('./States/Menu');
var Playing = require('./States/Playing');
var EventHandler = require('./Events/EventHandler');
var ImageLoader  = require('./Game/ImageLoader');
var Viewport     = require('./Game/Viewport');

var Controller = new EventHandler();

Viewport.pipe(Menu);
Viewport.pipe(Loading);
Viewport.pipe(Playing);

Engine.pipe(Controller);
Menu.pipe(Controller);
Loading.pipe(Controller);

Controller.on('doneLoading', goToMenu);
Controller.on('newGame', startGame);

var spritesheet = {
	type: 'image',
	source: '../Assets/crate.gif',
	data: {}
};

Loading.register(ImageLoader);
Loading.load(spritesheet);

Engine.setState(Loading);

function goToMenu()
{
    Engine.setState(Menu);
}

function startGame()
{
	Engine.setState(Playing);
}

function loop()
{
    Engine.step();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
},{"./Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js","./Game/Engine":"/Users/joseph/code/FPS/Source/Game/Engine.js","./Game/ImageLoader":"/Users/joseph/code/FPS/Source/Game/ImageLoader.js","./Game/Viewport":"/Users/joseph/code/FPS/Source/Game/Viewport.js","./States/Loading":"/Users/joseph/code/FPS/Source/States/Loading.js","./States/Menu":"/Users/joseph/code/FPS/Source/States/Menu.js","./States/Playing":"/Users/joseph/code/FPS/Source/States/Playing.js"}]},{},["/Users/joseph/code/FPS/Source/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9FdmVudHMvRXZlbnRFbWl0dGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvRXZlbnRzL0V2ZW50SGFuZGxlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0dhbWUvRW5naW5lLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvR2FtZS9JbWFnZUxvYWRlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0dhbWUvVmlld3BvcnQuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9JbnB1dHMvS2V5SGFuZGxlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0lucHV0cy9rZXltYXAuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9TdGF0ZXMvTG9hZGluZy5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL1N0YXRlcy9NZW51LmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvU3RhdGVzL1BsYXlpbmcuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG4vKipcbiAqIEV2ZW50RW1pdHRlciByZXByZXNlbnRzIGEgY2hhbm5lbCBmb3IgZXZlbnRzLlxuICpcbiAqIEBjbGFzcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSB7fTtcbiAgICB0aGlzLl9vd25lciA9IHRoaXM7XG59XG5cbi8qKlxuICogVHJpZ2dlciBhbiBldmVudCwgc2VuZGluZyB0byBhbGwgZG93bnN0cmVhbSBoYW5kbGVyc1xuICogICBsaXN0ZW5pbmcgZm9yIHByb3ZpZGVkICd0eXBlJyBrZXkuXG4gKlxuICogQG1ldGhvZCBlbWl0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IGV2ZW50IGRhdGFcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUsIGV2ZW50KSB7XG4gICAgdmFyIGhhbmRsZXJzID0gdGhpcy5saXN0ZW5lcnNbdHlwZV07XG4gICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2ldLmNhbGwodGhpcy5fb3duZXIsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIFwib25cIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBoYW5kbGVyIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgICBpZiAoISh0eXBlIGluIHRoaXMubGlzdGVuZXJzKSkgdGhpcy5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5pbmRleE9mKGhhbmRsZXIpO1xuICAgIGlmIChpbmRleCA8IDApIHRoaXMubGlzdGVuZXJzW3R5cGVdLnB1c2goaGFuZGxlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBcIm9uXCIuXG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vKipcbiAqIFVuYmluZCBhbiBldmVudCBieSB0eXBlIGFuZCBoYW5kbGVyLlxuICogICBUaGlzIHVuZG9lcyB0aGUgd29yayBvZiBcIm9uXCIuXG4gKlxuICogQG1ldGhvZCByZW1vdmVMaXN0ZW5lclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGhhbmRsZXIgZnVuY3Rpb24gb2JqZWN0IHRvIHJlbW92ZVxuICogQHJldHVybiB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcih0eXBlLCBoYW5kbGVyKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5saXN0ZW5lcnNbdHlwZV0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICBpZiAoaW5kZXggPj0gMCkgdGhpcy5saXN0ZW5lcnNbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2FsbCBldmVudCBoYW5kbGVycyB3aXRoIHRoaXMgc2V0IHRvIG93bmVyLlxuICpcbiAqIEBtZXRob2QgYmluZFRoaXNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3duZXIgb2JqZWN0IHRoaXMgRXZlbnRFbWl0dGVyIGJlbG9uZ3MgdG9cbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5iaW5kVGhpcyA9IGZ1bmN0aW9uIGJpbmRUaGlzKG93bmVyKSB7XG4gICAgdGhpcy5fb3duZXIgPSBvd25lcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyOyIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnLi9FdmVudEVtaXR0ZXInKTtcblxuLyoqXG4gKiBFdmVudEhhbmRsZXIgZm9yd2FyZHMgcmVjZWl2ZWQgZXZlbnRzIHRvIGEgc2V0IG9mIHByb3ZpZGVkIGNhbGxiYWNrIGZ1bmN0aW9ucy5cbiAqIEl0IGFsbG93cyBldmVudHMgdG8gYmUgY2FwdHVyZWQsIHByb2Nlc3NlZCwgYW5kIG9wdGlvbmFsbHkgcGlwZWQgdGhyb3VnaCB0byBvdGhlciBldmVudCBoYW5kbGVycy5cbiAqXG4gKiBAY2xhc3MgRXZlbnRIYW5kbGVyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEhhbmRsZXIoKSB7XG4gICAgRXZlbnRFbWl0dGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmRvd25zdHJlYW0gPSBbXTsgLy8gZG93bnN0cmVhbSBldmVudCBoYW5kbGVyc1xuICAgIHRoaXMuZG93bnN0cmVhbUZuID0gW107IC8vIGRvd25zdHJlYW0gZnVuY3Rpb25zXG5cbiAgICB0aGlzLnVwc3RyZWFtID0gW107IC8vIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXJzXG4gICAgdGhpcy51cHN0cmVhbUxpc3RlbmVycyA9IHt9OyAvLyB1cHN0cmVhbSBsaXN0ZW5lcnNcbn1cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50RW1pdHRlci5wcm90b3R5cGUpO1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEV2ZW50SGFuZGxlcjtcblxuLyoqXG4gKiBBc3NpZ24gYW4gZXZlbnQgaGFuZGxlciB0byByZWNlaXZlIGFuIG9iamVjdCdzIGlucHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldElucHV0SGFuZGxlclxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb2JqZWN0IHRvIG1peCB0cmlnZ2VyLCBzdWJzY3JpYmUsIGFuZCB1bnN1YnNjcmliZSBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyID0gZnVuY3Rpb24gc2V0SW5wdXRIYW5kbGVyKG9iamVjdCwgaGFuZGxlcikge1xuICAgIG9iamVjdC50cmlnZ2VyID0gaGFuZGxlci50cmlnZ2VyLmJpbmQoaGFuZGxlcik7XG4gICAgaWYgKGhhbmRsZXIuc3Vic2NyaWJlICYmIGhhbmRsZXIudW5zdWJzY3JpYmUpIHtcbiAgICAgICAgb2JqZWN0LnN1YnNjcmliZSA9IGhhbmRsZXIuc3Vic2NyaWJlLmJpbmQoaGFuZGxlcik7XG4gICAgICAgIG9iamVjdC51bnN1YnNjcmliZSA9IGhhbmRsZXIudW5zdWJzY3JpYmUuYmluZChoYW5kbGVyKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEFzc2lnbiBhbiBldmVudCBoYW5kbGVyIHRvIHJlY2VpdmUgYW4gb2JqZWN0J3Mgb3V0cHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldE91dHB1dEhhbmRsZXJcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9iamVjdCB0byBtaXggcGlwZSwgdW5waXBlLCBvbiwgYWRkTGlzdGVuZXIsIGFuZCByZW1vdmVMaXN0ZW5lciBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlciA9IGZ1bmN0aW9uIHNldE91dHB1dEhhbmRsZXIob2JqZWN0LCBoYW5kbGVyKSB7XG4gICAgaWYgKGhhbmRsZXIgaW5zdGFuY2VvZiBFdmVudEhhbmRsZXIpIGhhbmRsZXIuYmluZFRoaXMob2JqZWN0KTtcbiAgICBvYmplY3QucGlwZSA9IGhhbmRsZXIucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC51bnBpcGUgPSBoYW5kbGVyLnVucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC5vbiA9IGhhbmRsZXIub24uYmluZChoYW5kbGVyKTtcbiAgICBvYmplY3QuYWRkTGlzdGVuZXIgPSBvYmplY3Qub247XG4gICAgb2JqZWN0LnJlbW92ZUxpc3RlbmVyID0gaGFuZGxlci5yZW1vdmVMaXN0ZW5lci5iaW5kKGhhbmRsZXIpO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VyIGFuIGV2ZW50LCBzZW5kaW5nIHRvIGFsbCBkb3duc3RyZWFtIGhhbmRsZXJzXG4gKiAgIGxpc3RlbmluZyBmb3IgcHJvdmlkZWQgJ3R5cGUnIGtleS5cbiAqXG4gKiBAbWV0aG9kIGVtaXRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgZXZlbnQgZGF0YVxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSwgZXZlbnQpIHtcbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5kb3duc3RyZWFtW2ldLnRyaWdnZXIpIHRoaXMuZG93bnN0cmVhbVtpXS50cmlnZ2VyKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbUZuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZG93bnN0cmVhbUZuW2ldKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBlbWl0XG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudHJpZ2dlciA9IEV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdDtcblxuLyoqXG4gKiBBZGQgZXZlbnQgaGFuZGxlciBvYmplY3QgdG8gc2V0IG9mIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKlxuICogQG1ldGhvZCBwaXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCBldmVudCBoYW5kbGVyIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcGFzc2VkIGV2ZW50IGhhbmRsZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24gcGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnN1YnNjcmliZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSByZXR1cm4gdGFyZ2V0LnN1YnNjcmliZSh0aGlzKTtcblxuICAgIHZhciBkb3duc3RyZWFtQ3R4ID0gKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/IHRoaXMuZG93bnN0cmVhbUZuIDogdGhpcy5kb3duc3RyZWFtO1xuICAgIHZhciBpbmRleCA9IGRvd25zdHJlYW1DdHguaW5kZXhPZih0YXJnZXQpO1xuICAgIGlmIChpbmRleCA8IDApIGRvd25zdHJlYW1DdHgucHVzaCh0YXJnZXQpO1xuXG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB0YXJnZXQoJ3BpcGUnLCBudWxsKTtcbiAgICBlbHNlIGlmICh0YXJnZXQudHJpZ2dlcikgdGFyZ2V0LnRyaWdnZXIoJ3BpcGUnLCBudWxsKTtcblxuICAgIHJldHVybiB0YXJnZXQ7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBoYW5kbGVyIG9iamVjdCBmcm9tIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICogICBVbmRvZXMgd29yayBvZiBcInBpcGVcIi5cbiAqXG4gKiBAbWV0aG9kIHVucGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgdGFyZ2V0IGhhbmRsZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHByb3ZpZGVkIHRhcmdldFxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnVucGlwZSA9IGZ1bmN0aW9uIHVucGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnVuc3Vic2NyaWJlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiB0YXJnZXQudW5zdWJzY3JpYmUodGhpcyk7XG5cbiAgICB2YXIgZG93bnN0cmVhbUN0eCA9ICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgPyB0aGlzLmRvd25zdHJlYW1GbiA6IHRoaXMuZG93bnN0cmVhbTtcbiAgICB2YXIgaW5kZXggPSBkb3duc3RyZWFtQ3R4LmluZGV4T2YodGFyZ2V0KTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICBkb3duc3RyZWFtQ3R4LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgdGFyZ2V0KCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgZWxzZSBpZiAodGFyZ2V0LnRyaWdnZXIpIHRhcmdldC50cmlnZ2VyKCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEJpbmQgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBhbiBldmVudCB0eXBlIGhhbmRsZWQgYnkgdGhpcyBvYmplY3QuXG4gKlxuICogQG1ldGhvZCBcIm9uXCJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbih0eXBlLCBoYW5kbGVyKSB7XG4gICAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykpIHtcbiAgICAgICAgdmFyIHVwc3RyZWFtTGlzdGVuZXIgPSB0aGlzLnRyaWdnZXIuYmluZCh0aGlzLCB0eXBlKTtcbiAgICAgICAgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSA9IHVwc3RyZWFtTGlzdGVuZXI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy51cHN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy51cHN0cmVhbVtpXS5vbih0eXBlLCB1cHN0cmVhbUxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIFwib25cIlxuICogQG1ldGhvZCBhZGRMaXN0ZW5lclxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5vbjtcblxuLyoqXG4gKiBMaXN0ZW4gZm9yIGV2ZW50cyBmcm9tIGFuIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXIuXG4gKlxuICogQG1ldGhvZCBzdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gc3Vic2NyaWJlKHNvdXJjZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMudXBzdHJlYW0uaW5kZXhPZihzb3VyY2UpO1xuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgdGhpcy51cHN0cmVhbS5wdXNoKHNvdXJjZSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLm9uKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdG9wIGxpc3RlbmluZyB0byBldmVudHMgZnJvbSBhbiB1cHN0cmVhbSBldmVudCBoYW5kbGVyLlxuICpcbiAqIEBtZXRob2QgdW5zdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiB1bnN1YnNjcmliZShzb3VyY2UpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnVwc3RyZWFtLmluZGV4T2Yoc291cmNlKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICB0aGlzLnVwc3RyZWFtLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEhhbmRsZXI7IiwidmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIEVuZ2luZSAgICAgICAgICAgICA9IHt9O1xuXG5FbmdpbmUuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuRW5naW5lLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihFbmdpbmUsIEVuZ2luZS5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKEVuZ2luZSwgRW5naW5lLmV2ZW50T3V0cHV0KTtcblxuRW5naW5lLmN1cnJlbnRTdGF0ZSA9IG51bGw7XG5cbkVuZ2luZS5zZXRTdGF0ZSAgICAgPSBmdW5jdGlvbiBzZXRTdGF0ZShzdGF0ZSlcbntcblx0aWYgKHN0YXRlLmluaXRpYWxpemUpIHN0YXRlLmluaXRpYWxpemUoKTtcblx0XG5cdGlmICh0aGlzLmN1cnJlbnRTdGF0ZSlcblx0e1xuXHRcdHRoaXMuY3VycmVudFN0YXRlLnVucGlwZShFbmdpbmUuZXZlbnRJbnB1dCk7XG5cdFx0dGhpcy5jdXJyZW50U3RhdGUuaGlkZSgpO1xuXHR9XG5cblx0c3RhdGUucGlwZSh0aGlzLmV2ZW50SW5wdXQpO1xuXHRzdGF0ZS5zaG93KCk7XG5cblx0dGhpcy5jdXJyZW50U3RhdGUgPSBzdGF0ZTtcbn07XG5cbkVuZ2luZS5zdGVwICAgICAgICAgPSBmdW5jdGlvbiBzdGVwKHRpbWUpXG57XG5cdHZhciBzdGF0ZSA9IEVuZ2luZS5jdXJyZW50U3RhdGU7XG5cdGlmIChzdGF0ZSlcblx0e1xuXHRcdGlmIChzdGF0ZS51cGRhdGUpIHN0YXRlLnVwZGF0ZSgpO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVuZ2luZTsiLCJ2YXIgQVNTRVRfVFlQRSA9ICdpbWFnZSc7XG5cbnZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbnZhciBJbWFnZUxvYWRlciAgPSB7fTtcbnZhciBJbWFnZXMgICAgICAgPSB7fTtcblxuSW1hZ2VMb2FkZXIuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuSW1hZ2VMb2FkZXIuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKEltYWdlTG9hZGVyLCBJbWFnZUxvYWRlci5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKEltYWdlTG9hZGVyLCBJbWFnZUxvYWRlci5ldmVudE91dHB1dCk7XG5cbkltYWdlTG9hZGVyLmxvYWQgPSBmdW5jdGlvbiBsb2FkKGFzc2V0KVxue1xuICAgIHZhciBzb3VyY2UgPSBhc3NldC5zb3VyY2U7XG4gICAgaWYgKCFJbWFnZXNbc291cmNlXSlcbiAgICB7XG4gICAgICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpbWFnZS5zcmMgPSBzb3VyY2U7XG4gICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZmluaXNoZWRMb2FkaW5nKHNvdXJjZSk7XG4gICAgICAgIH07XG4gICAgICAgIEltYWdlc1tzb3VyY2VdID0gaW1hZ2U7XG4gICAgfVxufTtcblxuSW1hZ2VMb2FkZXIuZ2V0ICA9IGZ1bmN0aW9uIGdldChzb3VyY2UpXG57XG4gICAgcmV0dXJuIEltYWdlc1tzb3VyY2VdO1xufTtcblxuSW1hZ2VMb2FkZXIudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpXG57XG4gICAgcmV0dXJuIEFTU0VUX1RZUEU7XG59O1xuXG5mdW5jdGlvbiBmaW5pc2hlZExvYWRpbmcoc291cmNlKVxue1xuICAgIEltYWdlTG9hZGVyLmV2ZW50T3V0cHV0LmVtaXQoJ2RvbmVMb2FkaW5nJywge3NvdXJjZTogc291cmNlLCB0eXBlOiBBU1NFVF9UWVBFfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VMb2FkZXI7IiwidmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIFZpZXdwb3J0ID0ge307XG5cblZpZXdwb3J0LmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblZpZXdwb3J0LmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihWaWV3cG9ydCwgVmlld3BvcnQuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihWaWV3cG9ydCwgVmlld3BvcnQuZXZlbnRPdXRwdXQpO1xuXG53aW5kb3cub25yZXNpemUgPSBoYW5kbGVSZXNpemU7XG5cbmZ1bmN0aW9uIGhhbmRsZVJlc2l6ZSgpXG57XG5cdFZpZXdwb3J0LmV2ZW50T3V0cHV0LmVtaXQoJ3Jlc2l6ZScpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdwb3J0OyIsInZhciBLRVlfTUFQID0gcmVxdWlyZSgnLi9rZXltYXAuanMnKTtcbnZhciBLZXlIYW5kbGVyID0ge307XG5cbktleUhhbmRsZXIuaW5pdCA9IGZ1bmN0aW9uIGluaXQoKSB7XG5cdHRoaXMuX3ByZXNzZWQgPSB7fTtcblx0dGhpcy5faGFuZGxlcnMgPSB7fTtcblxuXHR0aGlzLmJvdW5kS2V5RG93biA9IHJlZ2lzdGVyS2V5RG93bi5iaW5kKHRoaXMpO1xuXHR0aGlzLmJvdW5kS2V5VXAgPSByZWdpc3RlcktleVVwLmJpbmQodGhpcyk7XG5cblx0ZG9jdW1lbnQub25rZXlkb3duID0gdGhpcy5ib3VuZEtleURvd247XG5cdGRvY3VtZW50Lm9ua2V5dXAgPSB0aGlzLmJvdW5kS2V5VXA7XG59XG5cbktleUhhbmRsZXIudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuXHR2YXIgaGFuZGxlcnM7XG5cdHZhciBoYW5kbGVyc0xlbmd0aDtcblx0dmFyIGk7XG5cdFxuXHRmb3IodmFyIGtleSBpbiB0aGlzLl9wcmVzc2VkKXtcblx0XHRpZih0aGlzLl9wcmVzc2VkW2tleV0gPT09IHRydWUpe1xuXHRcdFx0aGFuZGxlcnMgPSB0aGlzLl9oYW5kbGVyc1trZXldO1xuXHRcdFx0aGFuZGxlcnNMZW5ndGggPSBoYW5kbGVycy5sZW5ndGg7XG5cdFx0XHRmb3IgKGkgPSAwOyBpIDwgaGFuZGxlcnNMZW5ndGg7IGkrKykge1xuXHRcdFx0XHRoYW5kbGVyc1tpXSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuXG5LZXlIYW5kbGVyLm9uID0gZnVuY3Rpb24gb24oa2V5LCBjYWxsYmFjaykge1xuXHRpZighdGhpcy5faGFuZGxlcnNba2V5XSkgdGhpcy5faGFuZGxlcnNba2V5XSA9IFtdO1xuXHR0aGlzLl9oYW5kbGVyc1trZXldLnB1c2goY2FsbGJhY2spO1xufVxuXG5LZXlIYW5kbGVyLm9mZiA9IGZ1bmN0aW9uIG9mZihrZXksIGNhbGxiYWNrKSB7XG5cdHZhciBjYWxsYmFja0luZGV4O1xuXHR2YXIgY2FsbGJhY2tzO1xuXG5cdGlmKHRoaXMuX2hhbmRsZXJzW2tleV0pIHtcblx0XHRjYWxsYmFja3MgPSB0aGlzLl9oYW5kbGVyc1trZXldO1xuXHRcdGNhbGxiYWNrSW5kZXggPSBjYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG5cdFx0aWYoY2FsbGJhY2tJbmRleCAhPT0gLTEpIHtcblx0XHRcdGNhbGxiYWNrcy5zcGxpY2UoY2FsbGJhY2tJbmRleCwgMSk7XG5cdFx0XHRpZighY2FsbGJhY2tzLmxlbmd0aCkge1xuXHRcdFx0XHRkZWxldGUgY2FsbGJhY2tzO1xuXHRcdFx0XHRkZWxldGUgdGhpcy5fcHJlc3NlZFtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiByZWdpc3RlcktleURvd24oZXZlbnQpIHtcblx0dmFyIGtleU5hbWUgPSBLRVlfTUFQW2V2ZW50LmtleUNvZGVdO1xuXHRpZiAodGhpcy5faGFuZGxlcnNba2V5TmFtZV0pIHRoaXMuX3ByZXNzZWRba2V5TmFtZV0gPSB0cnVlO1xufVxuXG5mdW5jdGlvbiByZWdpc3RlcktleVVwKGV2ZW50KSB7XG5cdHZhciBrZXlOYW1lID0gS0VZX01BUFtldmVudC5rZXlDb2RlXTtcblx0aWYgKHRoaXMuX2hhbmRsZXJzW2tleU5hbWVdKSB0aGlzLl9wcmVzc2VkW2tleU5hbWVdID0gZmFsc2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gS2V5SGFuZGxlcjsiLCJtb2R1bGUuZXhwb3J0cyA9IFxue1xuICA2NSA6ICdBJyxcbiAgNjYgOiAnQicsXG4gIDY3IDogJ0MnLFxuICA2OCA6ICdEJyxcbiAgNjkgOiAnRScsXG4gIDcwIDogJ0YnLFxuICA3MSA6ICdHJyxcbiAgNzIgOiAnSCcsXG4gIDczIDogJ0knLFxuICA3NCA6ICdKJyxcbiAgNzUgOiAnSycsXG4gIDc2IDogJ0wnLFxuICA3NyA6ICdNJyxcbiAgNzggOiAnTicsXG4gIDc5IDogJ08nLFxuICA4MCA6ICdQJyxcbiAgODEgOiAnUScsXG4gIDgyIDogJ1InLFxuICA4MyA6ICdTJyxcbiAgODQgOiAnVCcsXG4gIDg1IDogJ1UnLFxuICA4NiA6ICdWJyxcbiAgODcgOiAnVycsXG4gIDg4IDogJ1gnLFxuICA4OSA6ICdZJyxcbiAgOTAgOiAnWicsXG4gIDEzIDogJ0VOVEVSJyxcbiAgMTYgOiAnU0hJRlQnLFxuICAyNyA6ICdFU0MnLFxuICAzMiA6ICdTUEFDRScsXG4gIDM3IDogJ0xFRlQnLFxuICAzOCA6ICdVUCcsXG4gIDM5IDogJ1JJR0hUJyxcbiAgNDAgOiAnRE9XTidcbn07IiwidmFyIENPTVBMRVRFID0gXCJjb21wbGV0ZVwiO1xudmFyIExPQURfU1RBUlRFRCA9IFwic3RhcnRMb2FkaW5nXCI7XG52YXIgTE9BRF9DT01QTEVURUQgPSBcImRvbmVMb2FkaW5nXCI7XG52YXIgTk9ORSA9ICdub25lJztcbnZhciBWSVNJQkxFID0gJ2lubGluZSc7XG5cbnZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbnZhciBMb2FkaW5nICAgICAgICAgID0ge307XG52YXIgYm9keVJlYWR5ICAgICAgICA9IGZhbHNlO1xudmFyIGFzc2V0U3RhY2sgICAgICAgPSBbXTtcbnZhciBsb2FkZXJSZWdpc3RyeSAgID0ge307XG52YXIgY29udGFpbmVyICAgICAgICA9IG51bGw7XG52YXIgc3BsYXNoU2NyZWVuICAgICA9IG5ldyBJbWFnZSgpO1xuc3BsYXNoU2NyZWVuLnNyYyAgICAgPSAnLi4vLi4vQXNzZXRzL0xvYWRpbmcuLi4ucG5nJztcbnNwbGFzaFNjcmVlbi53aWR0aCAgID0gc3BsYXNoV2lkdGggPSA1MDA7XG5zcGxhc2hTY3JlZW4uaGVpZ2h0ICA9IHNwbGFzaEhlaWdodCA9IDE2MDtcbkxvYWRpbmcuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuTG9hZGluZy5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoTG9hZGluZywgTG9hZGluZy5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKExvYWRpbmcsIExvYWRpbmcuZXZlbnRPdXRwdXQpO1xuXG5Mb2FkaW5nLmV2ZW50SW5wdXQub24oTE9BRF9DT01QTEVURUQsIGhhbmRsZUNvbXBsZXRlZExvYWQpO1xuTG9hZGluZy5ldmVudElucHV0Lm9uKCdyZXNpemUnLCBoYW5kbGVSZXNpemUpO1xuXG5Mb2FkaW5nLmluaXRpYWxpemUgPSBmdW5jdGlvbiBpbml0aWFsaXplKClcbntcbiAgICBpZiAoIWNvbnRhaW5lcilcbiAgICB7XG4gICAgICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2FkaW5nJyk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChzcGxhc2hTY3JlZW4pO1xuICAgICAgICBzcGxhc2hTY3JlZW4uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBzcGxhc2hTY3JlZW4uc3R5bGUudG9wID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoc3BsYXNoSGVpZ2h0ICogMC41KSArICdweCc7XG4gICAgICAgIHNwbGFzaFNjcmVlbi5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtIChzcGxhc2hXaWR0aCogMC41KSArICdweCc7XG4gICAgfVxuICAgIGlmIChhc3NldFN0YWNrLmxlbmd0aClcbiAgICB7XG4gICAgICAgIHRoaXMuZXZlbnRPdXRwdXQuZW1pdChMT0FEX1NUQVJURUQpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFzc2V0U3RhY2subGVuZ3RoOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBhc3NldCAgPSBhc3NldFN0YWNrW2ldO1xuICAgICAgICAgICAgdmFyIGxvYWRlciA9IGFzc2V0LnR5cGU7XG4gICAgICAgICAgICBsb2FkZXJSZWdpc3RyeVtsb2FkZXJdLmxvYWQoYXNzZXQpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuTG9hZGluZy5sb2FkICAgICAgID0gZnVuY3Rpb24gbG9hZChhc3NldClcbntcbiAgICBhc3NldFN0YWNrLnB1c2goYXNzZXQpO1xufTtcblxuTG9hZGluZy5zaG93ICAgICAgID0gZnVuY3Rpb24gc2hvdygpXG57XG4gICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBWSVNJQkxFO1xufTtcblxuTG9hZGluZy5oaWRlICAgICAgID0gZnVuY3Rpb24gaGlkZSgpXG57XG4gICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBOT05FO1xufTtcblxuTG9hZGluZy5yZWdpc3RlciAgID0gZnVuY3Rpb24gcmVnaXN0ZXIobG9hZGVyKVxue1xuICAgIHZhciBsb2FkZXJOYW1lICAgICAgICAgICAgID0gbG9hZGVyLnRvU3RyaW5nKCk7XG4gICAgbG9hZGVyUmVnaXN0cnlbbG9hZGVyTmFtZV0gPSBsb2FkZXI7XG4gICAgbG9hZGVyLnBpcGUodGhpcy5ldmVudElucHV0KTtcbn07XG5cbmZ1bmN0aW9uIGhhbmRsZUNvbXBsZXRlZExvYWQoZGF0YSlcbntcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBkYXRhLnNvdXJjZTtcbiAgICAgICAgdmFyIGxvY2F0aW9uID0gYXNzZXRTdGFjay5pbmRleE9mKHNvdXJjZSk7XG4gICAgICAgIGlmIChsb2NhdGlvbikgYXNzZXRTdGFjay5zcGxpY2UobG9jYXRpb24sIDEpO1xuICAgICAgICBpZiAoIWFzc2V0U3RhY2subGVuZ3RoKSBMb2FkaW5nLmV2ZW50T3V0cHV0LmVtaXQoTE9BRF9DT01QTEVURUQpO1xuICAgIH0sIDEwMDApO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVSZXNpemUoKVxue1xuICAgIHNwbGFzaFNjcmVlbi5zdHlsZS50b3AgPSAod2luZG93LmlubmVySGVpZ2h0ICogMC41KSAtIChzcGxhc2hIZWlnaHQgKiAwLjUpICsgJ3B4JztcbiAgICBzcGxhc2hTY3JlZW4uc3R5bGUubGVmdCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuNSkgLSAoc3BsYXNoV2lkdGgqIDAuNSkgKyAncHgnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRpbmc7IiwidmFyIE5PTkUgPSAnbm9uZSc7XG52YXIgVklTSUJMRSA9ICdpbmxpbmUnO1xuXG52YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgTWVudSAgICAgICAgICA9IHt9O1xuXG5NZW51LmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbk1lbnUuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKE1lbnUsIE1lbnUuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihNZW51LCBNZW51LmV2ZW50T3V0cHV0KTtcblxuTWVudS5ldmVudElucHV0Lm9uKCdyZXNpemUnLCBoYW5kbGVSZXNpemUpO1xuXG52YXIgbWVudUVsZW1lbnQgPSBudWxsLFxuY29udGFpbmVyICAgICAgID0gbnVsbCxcbm5ld0dhbWUgICAgICAgICA9IG51bGw7XG5cbk1lbnUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uIGluaXRpYWxpemUoKVxue1xuICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51Jyk7XG4gICAgbWVudUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBtZW51RWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgbmV3R2FtZSAgICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBuZXdHYW1lLm9uY2xpY2sgPSBzdGFydE5ld0dhbWU7XG4gICAgbmV3R2FtZS5pbm5lckhUTUwgPSAnTmV3IEdhbWUnO1xuICAgIG5ld0dhbWUuc3R5bGUuZm9udFNpemUgPSAnNTBweCc7XG4gICAgbmV3R2FtZS5zdHlsZS5mb250RmFtaWx5ID0gJ0hlbHZldGljYSc7XG4gICAgbmV3R2FtZS5zdHlsZS5jb2xvciA9ICcjRkZGJztcbiAgICBtZW51RWxlbWVudC5hcHBlbmRDaGlsZChuZXdHYW1lKTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobWVudUVsZW1lbnQpO1xuICAgIG1lbnVFbGVtZW50LnN0eWxlLnRvcCAgPSAod2luZG93LmlubmVySGVpZ2h0ICogMC41KSAtICg1OCAqIDAuNSkgKyAncHgnO1xuICAgIG1lbnVFbGVtZW50LnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKDI1MSAqIDAuNSkgKyAncHgnO1xufTtcblxuTWVudS5zaG93ICAgICAgID0gZnVuY3Rpb24gc2hvdygpXG57XG4gICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBWSVNJQkxFO1xufTtcblxuTWVudS5oaWRlICAgICAgID0gZnVuY3Rpb24gaGlkZSgpXG57XG4gICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBOT05FO1xufTtcblxuZnVuY3Rpb24gaGFuZGxlUmVzaXplKClcbntcbiAgICBtZW51RWxlbWVudC5zdHlsZS50b3AgPSAod2luZG93LmlubmVySGVpZ2h0ICogMC41KSAtICg1OCAqIDAuNSkgKyAncHgnO1xuICAgIG1lbnVFbGVtZW50LnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKDI1MSAqIDAuNSkgKyAncHgnO1xufVxuXG5mdW5jdGlvbiBzdGFydE5ld0dhbWUoKVxue1xuICAgIE1lbnUuZXZlbnRPdXRwdXQuZW1pdCgnbmV3R2FtZScpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnU7IiwidmFyIE5PTkUgPSAnbm9uZSc7XG52YXIgVklTSUJMRSA9ICdpbmxpbmUnO1xuXG52YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xudmFyIEtleUhhbmRsZXIgICAgICAgICA9IHJlcXVpcmUoJy4uL0lucHV0cy9LZXlIYW5kbGVyJyk7XG5cbnZhciBQbGF5aW5nICAgICAgICAgID0ge307XG5cblBsYXlpbmcuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuUGxheWluZy5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoUGxheWluZywgUGxheWluZy5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKFBsYXlpbmcsIFBsYXlpbmcuZXZlbnRPdXRwdXQpO1xuXG5QbGF5aW5nLmluaXRpYWxpemUgPSBmdW5jdGlvbiBpbml0aWFsaXplKClcbntcblx0S2V5SGFuZGxlci5pbml0KCk7XG5cdEtleUhhbmRsZXIub24oJ0EnLCBmdW5jdGlvbiAoKSB7XG5cdFx0Y29uc29sZS5sb2coJ2EnKTtcblx0fSk7XG5cdHdpbmRvdy5hYmEgPSBLZXlIYW5kbGVyO1xufTtcblxuUGxheWluZy51cGRhdGUgICAgID0gZnVuY3Rpb24gdXBkYXRlKClcbntcblx0S2V5SGFuZGxlci51cGRhdGUoKTtcbn07XG5cblBsYXlpbmcuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xufTtcblxuUGxheWluZy5oaWRlICAgICAgID0gZnVuY3Rpb24gaGlkZSgpXG57XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXlpbmc7IiwidmFyIEVuZ2luZSAgPSByZXF1aXJlKCcuL0dhbWUvRW5naW5lJyk7XG52YXIgTG9hZGluZyA9IHJlcXVpcmUoJy4vU3RhdGVzL0xvYWRpbmcnKTtcbnZhciBNZW51ICAgID0gcmVxdWlyZSgnLi9TdGF0ZXMvTWVudScpO1xudmFyIFBsYXlpbmcgPSByZXF1aXJlKCcuL1N0YXRlcy9QbGF5aW5nJyk7XG52YXIgRXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG52YXIgSW1hZ2VMb2FkZXIgID0gcmVxdWlyZSgnLi9HYW1lL0ltYWdlTG9hZGVyJyk7XG52YXIgVmlld3BvcnQgICAgID0gcmVxdWlyZSgnLi9HYW1lL1ZpZXdwb3J0Jyk7XG5cbnZhciBDb250cm9sbGVyID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5WaWV3cG9ydC5waXBlKE1lbnUpO1xuVmlld3BvcnQucGlwZShMb2FkaW5nKTtcblZpZXdwb3J0LnBpcGUoUGxheWluZyk7XG5cbkVuZ2luZS5waXBlKENvbnRyb2xsZXIpO1xuTWVudS5waXBlKENvbnRyb2xsZXIpO1xuTG9hZGluZy5waXBlKENvbnRyb2xsZXIpO1xuXG5Db250cm9sbGVyLm9uKCdkb25lTG9hZGluZycsIGdvVG9NZW51KTtcbkNvbnRyb2xsZXIub24oJ25ld0dhbWUnLCBzdGFydEdhbWUpO1xuXG52YXIgc3ByaXRlc2hlZXQgPSB7XG5cdHR5cGU6ICdpbWFnZScsXG5cdHNvdXJjZTogJy4uL0Fzc2V0cy9jcmF0ZS5naWYnLFxuXHRkYXRhOiB7fVxufTtcblxuTG9hZGluZy5yZWdpc3RlcihJbWFnZUxvYWRlcik7XG5Mb2FkaW5nLmxvYWQoc3ByaXRlc2hlZXQpO1xuXG5FbmdpbmUuc2V0U3RhdGUoTG9hZGluZyk7XG5cbmZ1bmN0aW9uIGdvVG9NZW51KClcbntcbiAgICBFbmdpbmUuc2V0U3RhdGUoTWVudSk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0R2FtZSgpXG57XG5cdEVuZ2luZS5zZXRTdGF0ZShQbGF5aW5nKTtcbn1cblxuZnVuY3Rpb24gbG9vcCgpXG57XG4gICAgRW5naW5lLnN0ZXAoKTtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7XG59XG5cbnJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTsiXX0=
