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
},{"./EventEmitter":"/Users/joseph/code/FPS/Source/Events/EventEmitter.js"}],"/Users/joseph/code/FPS/Source/GL/Renderer.js":[function(require,module,exports){
var ImageLoader  = require('../Game/ImageLoader');
var XMLLoader    = require('../Game/XMLLoader');
var KeyHandler   = require('../Inputs/KeyHandler');
var MouseTracker = require('../Inputs/MouseTracker');

function Renderer (options) {
	this.canvas = document.getElementById('renderer');
    this.gl = this.canvas.getContext("webgl");
    this.gl.viewportWidth = this.canvas.width;
    this.gl.viewportHeight = this.canvas.height;

    this.lastFrame = 0;
    this.joggingAngle = 0;

    initMatrices.call(this);

    this.initShaders();
    this.initTexture(options.texture);
    this.handleLoadedWorld();

    KeyHandler.on('update', this.handleKeys.bind(this));

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
}

Renderer.prototype.update = function update () {
	this.drawScene();
	this.animate();
}

Renderer.prototype.animate = function animate() {
    var thisFrame = new Date().getTime();
    if (this.lastFrame !== 0) {
        var elapsed = thisFrame - this.lastFrame;
        if(zSpeed !== 0 || xSpeed !== 0) {
            xPos -= Math.sin(degToRad(yaw)) * zSpeed * elapsed;
            zPos -= Math.cos(degToRad(yaw)) * zSpeed * elapsed;

            xPos -= Math.sin(degToRad(yaw - 90)) * xSpeed * elapsed;
            zPos -= Math.cos(degToRad(yaw - 90)) * xSpeed * elapsed;

            this.joggingAngle += elapsed * 0.6;
            yPos = Math.sin(degToRad(this.joggingAngle)) / 20 + 0.4;
        }

        yaw += yawRate * elapsed;
        pitch += pitchRate * elapsed;
    }
    this.lastFrame = thisFrame;
}

var pitch = 0;
var pitchRate = 0;

var yaw = 0;
var yawRate = 0;

var xPos = 0;
var yPos = 0.4;
var zPos = 0;

var zSpeed = 0;
var xSpeed = 0;
Renderer.prototype.handleKeys = function handleKeys (keyPressed) {
    // if      ( keyPressed['UP'] )   pitchRate = 0.1;
    // else if ( keyPressed['DOWN'] ) pitchRate = -0.1;
    // else                           pitchRate = 0;

    // if      ( keyPressed['LEFT'] || keyPressed['A'] )  yawRate = 0.1;
    // else if ( keyPressed['RIGHT'] || keyPressed['D'] ) yawRate = -0.1;
    // else                                               yawRate = 0;

    if      ( keyPressed['LEFT'] || keyPressed['A'] )  xSpeed = 0.1;
    else if ( keyPressed['RIGHT'] || keyPressed['D'] ) xSpeed = -0.1;
    else                                               xSpeed = 0;

    if      ( keyPressed['UP'] || keyPressed['W'] )   zSpeed = 0.003;
    else if ( keyPressed['DOWN'] || keyPressed['S'] ) zSpeed = -0.003;
    else                                              zSpeed = 0;

    var mousePos = MouseTracker.getMousePosition()[0];
    if ( mousePos < 0.0 ) yawRate = 0.2 * Math.abs(mousePos);
    else if ( mousePos >= 0.0 ) yawRate = -0.2 * Math.abs(mousePos);
}

var xPos = 0;
var yPos = 0;
var zPos = 0;
var pitch = 0;
var yaw = 0;
Renderer.prototype.drawScene = function drawScene() {
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    if(worldVertexTextureCoordBuffer == null || worldVertexPositionBuffer == null) return;

    mat4.perspective(45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0, this.pMatrix);

    mat4.identity(this.mvMatrix);
    mat4.rotate(this.mvMatrix, degToRad(-pitch), [1, 0, 0]);
    mat4.rotate(this.mvMatrix, degToRad(-yaw),   [0, 1, 0]);
    mat4.translate(this.mvMatrix, [-xPos, -yPos, -zPos]);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.uniform1i(shaderProgram.samplerUniform, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
    this.gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, worldVertexTextureCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, worldVertexPositionBuffer);
    this.gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, worldVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.setMatrixUniforms();
    this.gl.drawArrays(this.gl.TRIANGLES, 0, worldVertexPositionBuffer.numItems);
}

var shaderProgram;
Renderer.prototype.initShaders = function initShaders(responseArray) {
	var vertexShaderData = XMLLoader.get('/Shaders/VertexShader.glsl');
	var fragmentShaderData = XMLLoader.get('/Shaders/FragmentShader.glsl');

    vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    this.gl.shaderSource(vertexShader, vertexShaderData);
    this.gl.compileShader(vertexShader);

    this.gl.shaderSource(fragmentShader, fragmentShaderData);
    this.gl.compileShader(fragmentShader);

    shaderProgram = this.gl.createProgram();
    this.gl.attachShader(shaderProgram, vertexShader);
    this.gl.attachShader(shaderProgram, fragmentShader);
    this.gl.linkProgram(shaderProgram);

    if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) console.log("Could not initialise shaders");

    this.gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(shaderProgram, "aVertexPosition");
    this.gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = this.gl.getAttribLocation(shaderProgram, "aTextureCoord");
    this.gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = this.gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = this.gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.colorUniform = this.gl.getUniformLocation(shaderProgram, "uColor");
}

Renderer.prototype.setMatrixUniforms = function setMatrixUniforms() {
    this.gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, this.pMatrix);
    this.gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, this.mvMatrix);
}


var worldVertexPositionBuffer = null;
var worldVertexTextureCoordBuffer = null;
Renderer.prototype.handleLoadedWorld = function handleLoadedWorld (response) {
	var data = XMLLoader.get('/GameData/world.txt');
    var lines = data.split("\n");
    var vertexCount = 0;
    var vertexPositions = [];
    var vertexTextureCoords = [];
    for (var i = 0; i < lines.length; i++) {
        var vals = lines[i].replace(/^\s+/, "").split(/\s+/);
        if (vals.length === 5 && vals[0] !== "//") {
            //It is a line describing a vertex; get X Y and Z first
            vertexPositions.push(parseFloat(vals[0]));
            vertexPositions.push(parseFloat(vals[1]));
            vertexPositions.push(parseFloat(vals[2]));

            // And then the texture coords
            vertexTextureCoords.push(parseFloat(vals[3]));
            vertexTextureCoords.push(parseFloat(vals[4]));

            vertexCount += 1;
        }
    }

    worldVertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, worldVertexPositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexPositions), this.gl.STATIC_DRAW);
    worldVertexPositionBuffer.itemSize = 3;
    worldVertexPositionBuffer.numItems = vertexCount;

    worldVertexTextureCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexTextureCoords), this.gl.STATIC_DRAW);
    worldVertexTextureCoordBuffer.itemSize = 2;
    worldVertexTextureCoordBuffer.numItems = vertexCount;
}


Renderer.prototype.initTexture = function initTexture(imageUrl) {
   	this.texture = this.gl.createTexture();
	this.texture.image = ImageLoader.get(imageUrl);

    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.texture.image);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
}

function initMatrices () {
	this.mvMatrix = mat4.create();
    this.mvMatrixStack = [];
    this.pMatrix = mat4.create();
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

module.exports = Renderer;
},{"../Game/ImageLoader":"/Users/joseph/code/FPS/Source/Game/ImageLoader.js","../Game/XMLLoader":"/Users/joseph/code/FPS/Source/Game/XMLLoader.js","../Inputs/KeyHandler":"/Users/joseph/code/FPS/Source/Inputs/KeyHandler.js","../Inputs/MouseTracker":"/Users/joseph/code/FPS/Source/Inputs/MouseTracker.js"}],"/Users/joseph/code/FPS/Source/Game/Engine.js":[function(require,module,exports){
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
},{"../Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js"}],"/Users/joseph/code/FPS/Source/Game/XMLLoader.js":[function(require,module,exports){
var ASSET_TYPE = 'xml';

var EventHandler       = require('../Events/EventHandler');

var XMLLoader  = {};
var Storage  = {};

XMLLoader.eventInput      = new EventHandler();
XMLLoader.eventOutput     = new EventHandler();

EventHandler.setInputHandler(XMLLoader, XMLLoader.eventInput);
EventHandler.setOutputHandler(XMLLoader, XMLLoader.eventOutput);

XMLLoader.load = function load(asset)
{
    var source = asset.source;
    if (!Storage[source])
    {
        var request = new XMLHttpRequest();
        request.open('GET', source);
        request.onreadystatechange = function(response){
            if(response.currentTarget.readyState === 4) {
                Storage[source] = response.currentTarget.responseText;
                finishedLoading(source);
            }
        }
        request.send();
    }
};

XMLLoader.get  = function get(source)
{
    return Storage[source];
};

XMLLoader.toString = function toString()
{
    return ASSET_TYPE;
};

function finishedLoading(source)
{
    XMLLoader.eventOutput.emit('doneLoading', {source: source, type: ASSET_TYPE});
}

module.exports = XMLLoader;
},{"../Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js"}],"/Users/joseph/code/FPS/Source/Inputs/KeyHandler.js":[function(require,module,exports){
var KEY_MAP = require('./keymap.js');
var KeyHandler = {};

KeyHandler.init = function init() {
	this._pressed = {};
	this._handlers = {};
	this._updateFns = [];

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
	
	for(var key in this._pressed){
		if(this._pressed[key] === true){
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
		this._updateFns[i](this._pressed);
	}
}

KeyHandler.on = function on(key, callback) {
	if( KEY_MAP[key] ) {
		if(!this._handlers[key]) this._handlers[key] = [];
		this._handlers[key].push(callback);
	}
	else if (key === "update") {
		this._updateFns.push(callback);
	}
	else throw "invalid key";
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
	if (keyName) this._pressed[keyName] = true;
}

function registerKeyUp(event) {
	var keyName = KEY_MAP[event.keyCode];
	if (keyName) this._pressed[keyName] = false;
}

module.exports = KeyHandler;
},{"./keymap.js":"/Users/joseph/code/FPS/Source/Inputs/keymap.js"}],"/Users/joseph/code/FPS/Source/Inputs/MouseTracker.js":[function(require,module,exports){
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
},{}],"/Users/joseph/code/FPS/Source/Inputs/keymap.js":[function(require,module,exports){
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
var MouseTracker       = require('../Inputs/MouseTracker');
var Renderer           = require('../GL/Renderer');
var ImageLoader        = require('../Game/ImageLoader');

var Playing            = {};

Playing.eventInput      = new EventHandler();
Playing.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Playing, Playing.eventInput);
EventHandler.setOutputHandler(Playing, Playing.eventOutput);

Playing.initialize = function initialize()
{
	KeyHandler.init();
	MouseTracker.init();
	this.renderer = new Renderer({ texture: '../Assets/crate.gif' });
};

Playing.update     = function update()
{
	KeyHandler.update();
	MouseTracker.update();
	this.renderer.update();
};

Playing.show       = function show()
{
};

Playing.hide       = function hide()
{
};

module.exports = Playing;
},{"../Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js","../GL/Renderer":"/Users/joseph/code/FPS/Source/GL/Renderer.js","../Game/ImageLoader":"/Users/joseph/code/FPS/Source/Game/ImageLoader.js","../Inputs/KeyHandler":"/Users/joseph/code/FPS/Source/Inputs/KeyHandler.js","../Inputs/MouseTracker":"/Users/joseph/code/FPS/Source/Inputs/MouseTracker.js"}],"/Users/joseph/code/FPS/Source/main.js":[function(require,module,exports){
var Engine  = require('./Game/Engine');
var Loading = require('./States/Loading');
var Menu    = require('./States/Menu');
var Playing = require('./States/Playing');
var EventHandler = require('./Events/EventHandler');
var ImageLoader  = require('./Game/ImageLoader');
var XMLLoader    = require('./Game/XMLLoader');
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

var vertexShader = {
	type: 'xml',
	source: '/Shaders/VertexShader.glsl',
	data: {}
};

var fragmentShader = {
	type: 'xml',
	source: '/Shaders/FragmentShader.glsl',
	data: {}
};

var worldData = {
	type: 'xml',
	source: '/GameData/world.txt',
	data: {}
}

Loading.register(ImageLoader);
Loading.register(XMLLoader);

Loading.load(spritesheet);
Loading.load(vertexShader);
Loading.load(fragmentShader);
Loading.load(worldData);

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
},{"./Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js","./Game/Engine":"/Users/joseph/code/FPS/Source/Game/Engine.js","./Game/ImageLoader":"/Users/joseph/code/FPS/Source/Game/ImageLoader.js","./Game/Viewport":"/Users/joseph/code/FPS/Source/Game/Viewport.js","./Game/XMLLoader":"/Users/joseph/code/FPS/Source/Game/XMLLoader.js","./States/Loading":"/Users/joseph/code/FPS/Source/States/Loading.js","./States/Menu":"/Users/joseph/code/FPS/Source/States/Menu.js","./States/Playing":"/Users/joseph/code/FPS/Source/States/Playing.js"}]},{},["/Users/joseph/code/FPS/Source/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvRXZlbnRzL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0V2ZW50cy9FdmVudEhhbmRsZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9HTC9SZW5kZXJlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0dhbWUvRW5naW5lLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvR2FtZS9JbWFnZUxvYWRlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0dhbWUvVmlld3BvcnQuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9HYW1lL1hNTExvYWRlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0lucHV0cy9LZXlIYW5kbGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvSW5wdXRzL01vdXNlVHJhY2tlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0lucHV0cy9rZXltYXAuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9TdGF0ZXMvTG9hZGluZy5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL1N0YXRlcy9NZW51LmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvU3RhdGVzL1BsYXlpbmcuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG4vKipcbiAqIEV2ZW50RW1pdHRlciByZXByZXNlbnRzIGEgY2hhbm5lbCBmb3IgZXZlbnRzLlxuICpcbiAqIEBjbGFzcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSB7fTtcbiAgICB0aGlzLl9vd25lciA9IHRoaXM7XG59XG5cbi8qKlxuICogVHJpZ2dlciBhbiBldmVudCwgc2VuZGluZyB0byBhbGwgZG93bnN0cmVhbSBoYW5kbGVyc1xuICogICBsaXN0ZW5pbmcgZm9yIHByb3ZpZGVkICd0eXBlJyBrZXkuXG4gKlxuICogQG1ldGhvZCBlbWl0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IGV2ZW50IGRhdGFcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUsIGV2ZW50KSB7XG4gICAgdmFyIGhhbmRsZXJzID0gdGhpcy5saXN0ZW5lcnNbdHlwZV07XG4gICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2ldLmNhbGwodGhpcy5fb3duZXIsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIFwib25cIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBoYW5kbGVyIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgICBpZiAoISh0eXBlIGluIHRoaXMubGlzdGVuZXJzKSkgdGhpcy5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5pbmRleE9mKGhhbmRsZXIpO1xuICAgIGlmIChpbmRleCA8IDApIHRoaXMubGlzdGVuZXJzW3R5cGVdLnB1c2goaGFuZGxlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBcIm9uXCIuXG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vKipcbiAqIFVuYmluZCBhbiBldmVudCBieSB0eXBlIGFuZCBoYW5kbGVyLlxuICogICBUaGlzIHVuZG9lcyB0aGUgd29yayBvZiBcIm9uXCIuXG4gKlxuICogQG1ldGhvZCByZW1vdmVMaXN0ZW5lclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGhhbmRsZXIgZnVuY3Rpb24gb2JqZWN0IHRvIHJlbW92ZVxuICogQHJldHVybiB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcih0eXBlLCBoYW5kbGVyKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5saXN0ZW5lcnNbdHlwZV0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICBpZiAoaW5kZXggPj0gMCkgdGhpcy5saXN0ZW5lcnNbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2FsbCBldmVudCBoYW5kbGVycyB3aXRoIHRoaXMgc2V0IHRvIG93bmVyLlxuICpcbiAqIEBtZXRob2QgYmluZFRoaXNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3duZXIgb2JqZWN0IHRoaXMgRXZlbnRFbWl0dGVyIGJlbG9uZ3MgdG9cbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5iaW5kVGhpcyA9IGZ1bmN0aW9uIGJpbmRUaGlzKG93bmVyKSB7XG4gICAgdGhpcy5fb3duZXIgPSBvd25lcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyOyIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnLi9FdmVudEVtaXR0ZXInKTtcblxuLyoqXG4gKiBFdmVudEhhbmRsZXIgZm9yd2FyZHMgcmVjZWl2ZWQgZXZlbnRzIHRvIGEgc2V0IG9mIHByb3ZpZGVkIGNhbGxiYWNrIGZ1bmN0aW9ucy5cbiAqIEl0IGFsbG93cyBldmVudHMgdG8gYmUgY2FwdHVyZWQsIHByb2Nlc3NlZCwgYW5kIG9wdGlvbmFsbHkgcGlwZWQgdGhyb3VnaCB0byBvdGhlciBldmVudCBoYW5kbGVycy5cbiAqXG4gKiBAY2xhc3MgRXZlbnRIYW5kbGVyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEhhbmRsZXIoKSB7XG4gICAgRXZlbnRFbWl0dGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmRvd25zdHJlYW0gPSBbXTsgLy8gZG93bnN0cmVhbSBldmVudCBoYW5kbGVyc1xuICAgIHRoaXMuZG93bnN0cmVhbUZuID0gW107IC8vIGRvd25zdHJlYW0gZnVuY3Rpb25zXG5cbiAgICB0aGlzLnVwc3RyZWFtID0gW107IC8vIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXJzXG4gICAgdGhpcy51cHN0cmVhbUxpc3RlbmVycyA9IHt9OyAvLyB1cHN0cmVhbSBsaXN0ZW5lcnNcbn1cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50RW1pdHRlci5wcm90b3R5cGUpO1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEV2ZW50SGFuZGxlcjtcblxuLyoqXG4gKiBBc3NpZ24gYW4gZXZlbnQgaGFuZGxlciB0byByZWNlaXZlIGFuIG9iamVjdCdzIGlucHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldElucHV0SGFuZGxlclxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb2JqZWN0IHRvIG1peCB0cmlnZ2VyLCBzdWJzY3JpYmUsIGFuZCB1bnN1YnNjcmliZSBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyID0gZnVuY3Rpb24gc2V0SW5wdXRIYW5kbGVyKG9iamVjdCwgaGFuZGxlcikge1xuICAgIG9iamVjdC50cmlnZ2VyID0gaGFuZGxlci50cmlnZ2VyLmJpbmQoaGFuZGxlcik7XG4gICAgaWYgKGhhbmRsZXIuc3Vic2NyaWJlICYmIGhhbmRsZXIudW5zdWJzY3JpYmUpIHtcbiAgICAgICAgb2JqZWN0LnN1YnNjcmliZSA9IGhhbmRsZXIuc3Vic2NyaWJlLmJpbmQoaGFuZGxlcik7XG4gICAgICAgIG9iamVjdC51bnN1YnNjcmliZSA9IGhhbmRsZXIudW5zdWJzY3JpYmUuYmluZChoYW5kbGVyKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEFzc2lnbiBhbiBldmVudCBoYW5kbGVyIHRvIHJlY2VpdmUgYW4gb2JqZWN0J3Mgb3V0cHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldE91dHB1dEhhbmRsZXJcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9iamVjdCB0byBtaXggcGlwZSwgdW5waXBlLCBvbiwgYWRkTGlzdGVuZXIsIGFuZCByZW1vdmVMaXN0ZW5lciBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlciA9IGZ1bmN0aW9uIHNldE91dHB1dEhhbmRsZXIob2JqZWN0LCBoYW5kbGVyKSB7XG4gICAgaWYgKGhhbmRsZXIgaW5zdGFuY2VvZiBFdmVudEhhbmRsZXIpIGhhbmRsZXIuYmluZFRoaXMob2JqZWN0KTtcbiAgICBvYmplY3QucGlwZSA9IGhhbmRsZXIucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC51bnBpcGUgPSBoYW5kbGVyLnVucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC5vbiA9IGhhbmRsZXIub24uYmluZChoYW5kbGVyKTtcbiAgICBvYmplY3QuYWRkTGlzdGVuZXIgPSBvYmplY3Qub247XG4gICAgb2JqZWN0LnJlbW92ZUxpc3RlbmVyID0gaGFuZGxlci5yZW1vdmVMaXN0ZW5lci5iaW5kKGhhbmRsZXIpO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VyIGFuIGV2ZW50LCBzZW5kaW5nIHRvIGFsbCBkb3duc3RyZWFtIGhhbmRsZXJzXG4gKiAgIGxpc3RlbmluZyBmb3IgcHJvdmlkZWQgJ3R5cGUnIGtleS5cbiAqXG4gKiBAbWV0aG9kIGVtaXRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgZXZlbnQgZGF0YVxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSwgZXZlbnQpIHtcbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5kb3duc3RyZWFtW2ldLnRyaWdnZXIpIHRoaXMuZG93bnN0cmVhbVtpXS50cmlnZ2VyKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbUZuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZG93bnN0cmVhbUZuW2ldKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBlbWl0XG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudHJpZ2dlciA9IEV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdDtcblxuLyoqXG4gKiBBZGQgZXZlbnQgaGFuZGxlciBvYmplY3QgdG8gc2V0IG9mIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKlxuICogQG1ldGhvZCBwaXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCBldmVudCBoYW5kbGVyIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcGFzc2VkIGV2ZW50IGhhbmRsZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24gcGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnN1YnNjcmliZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSByZXR1cm4gdGFyZ2V0LnN1YnNjcmliZSh0aGlzKTtcblxuICAgIHZhciBkb3duc3RyZWFtQ3R4ID0gKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/IHRoaXMuZG93bnN0cmVhbUZuIDogdGhpcy5kb3duc3RyZWFtO1xuICAgIHZhciBpbmRleCA9IGRvd25zdHJlYW1DdHguaW5kZXhPZih0YXJnZXQpO1xuICAgIGlmIChpbmRleCA8IDApIGRvd25zdHJlYW1DdHgucHVzaCh0YXJnZXQpO1xuXG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB0YXJnZXQoJ3BpcGUnLCBudWxsKTtcbiAgICBlbHNlIGlmICh0YXJnZXQudHJpZ2dlcikgdGFyZ2V0LnRyaWdnZXIoJ3BpcGUnLCBudWxsKTtcblxuICAgIHJldHVybiB0YXJnZXQ7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBoYW5kbGVyIG9iamVjdCBmcm9tIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICogICBVbmRvZXMgd29yayBvZiBcInBpcGVcIi5cbiAqXG4gKiBAbWV0aG9kIHVucGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgdGFyZ2V0IGhhbmRsZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHByb3ZpZGVkIHRhcmdldFxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnVucGlwZSA9IGZ1bmN0aW9uIHVucGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnVuc3Vic2NyaWJlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiB0YXJnZXQudW5zdWJzY3JpYmUodGhpcyk7XG5cbiAgICB2YXIgZG93bnN0cmVhbUN0eCA9ICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgPyB0aGlzLmRvd25zdHJlYW1GbiA6IHRoaXMuZG93bnN0cmVhbTtcbiAgICB2YXIgaW5kZXggPSBkb3duc3RyZWFtQ3R4LmluZGV4T2YodGFyZ2V0KTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICBkb3duc3RyZWFtQ3R4LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgdGFyZ2V0KCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgZWxzZSBpZiAodGFyZ2V0LnRyaWdnZXIpIHRhcmdldC50cmlnZ2VyKCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEJpbmQgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBhbiBldmVudCB0eXBlIGhhbmRsZWQgYnkgdGhpcyBvYmplY3QuXG4gKlxuICogQG1ldGhvZCBcIm9uXCJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbih0eXBlLCBoYW5kbGVyKSB7XG4gICAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykpIHtcbiAgICAgICAgdmFyIHVwc3RyZWFtTGlzdGVuZXIgPSB0aGlzLnRyaWdnZXIuYmluZCh0aGlzLCB0eXBlKTtcbiAgICAgICAgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSA9IHVwc3RyZWFtTGlzdGVuZXI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy51cHN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy51cHN0cmVhbVtpXS5vbih0eXBlLCB1cHN0cmVhbUxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIFwib25cIlxuICogQG1ldGhvZCBhZGRMaXN0ZW5lclxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5vbjtcblxuLyoqXG4gKiBMaXN0ZW4gZm9yIGV2ZW50cyBmcm9tIGFuIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXIuXG4gKlxuICogQG1ldGhvZCBzdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gc3Vic2NyaWJlKHNvdXJjZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMudXBzdHJlYW0uaW5kZXhPZihzb3VyY2UpO1xuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgdGhpcy51cHN0cmVhbS5wdXNoKHNvdXJjZSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLm9uKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdG9wIGxpc3RlbmluZyB0byBldmVudHMgZnJvbSBhbiB1cHN0cmVhbSBldmVudCBoYW5kbGVyLlxuICpcbiAqIEBtZXRob2QgdW5zdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiB1bnN1YnNjcmliZShzb3VyY2UpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnVwc3RyZWFtLmluZGV4T2Yoc291cmNlKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICB0aGlzLnVwc3RyZWFtLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEhhbmRsZXI7IiwidmFyIEltYWdlTG9hZGVyICA9IHJlcXVpcmUoJy4uL0dhbWUvSW1hZ2VMb2FkZXInKTtcbnZhciBYTUxMb2FkZXIgICAgPSByZXF1aXJlKCcuLi9HYW1lL1hNTExvYWRlcicpO1xudmFyIEtleUhhbmRsZXIgICA9IHJlcXVpcmUoJy4uL0lucHV0cy9LZXlIYW5kbGVyJyk7XG52YXIgTW91c2VUcmFja2VyID0gcmVxdWlyZSgnLi4vSW5wdXRzL01vdXNlVHJhY2tlcicpO1xuXG5mdW5jdGlvbiBSZW5kZXJlciAob3B0aW9ucykge1xuXHR0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZW5kZXJlcicpO1xuICAgIHRoaXMuZ2wgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIik7XG4gICAgdGhpcy5nbC52aWV3cG9ydFdpZHRoID0gdGhpcy5jYW52YXMud2lkdGg7XG4gICAgdGhpcy5nbC52aWV3cG9ydEhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodDtcblxuICAgIHRoaXMubGFzdEZyYW1lID0gMDtcbiAgICB0aGlzLmpvZ2dpbmdBbmdsZSA9IDA7XG5cbiAgICBpbml0TWF0cmljZXMuY2FsbCh0aGlzKTtcblxuICAgIHRoaXMuaW5pdFNoYWRlcnMoKTtcbiAgICB0aGlzLmluaXRUZXh0dXJlKG9wdGlvbnMudGV4dHVyZSk7XG4gICAgdGhpcy5oYW5kbGVMb2FkZWRXb3JsZCgpO1xuXG4gICAgS2V5SGFuZGxlci5vbigndXBkYXRlJywgdGhpcy5oYW5kbGVLZXlzLmJpbmQodGhpcykpO1xuXG4gICAgdGhpcy5nbC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDEuMCk7XG4gICAgdGhpcy5nbC5lbmFibGUodGhpcy5nbC5ERVBUSF9URVNUKTtcbn1cblxuUmVuZGVyZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSAoKSB7XG5cdHRoaXMuZHJhd1NjZW5lKCk7XG5cdHRoaXMuYW5pbWF0ZSgpO1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUuYW5pbWF0ZSA9IGZ1bmN0aW9uIGFuaW1hdGUoKSB7XG4gICAgdmFyIHRoaXNGcmFtZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIGlmICh0aGlzLmxhc3RGcmFtZSAhPT0gMCkge1xuICAgICAgICB2YXIgZWxhcHNlZCA9IHRoaXNGcmFtZSAtIHRoaXMubGFzdEZyYW1lO1xuICAgICAgICBpZih6U3BlZWQgIT09IDAgfHwgeFNwZWVkICE9PSAwKSB7XG4gICAgICAgICAgICB4UG9zIC09IE1hdGguc2luKGRlZ1RvUmFkKHlhdykpICogelNwZWVkICogZWxhcHNlZDtcbiAgICAgICAgICAgIHpQb3MgLT0gTWF0aC5jb3MoZGVnVG9SYWQoeWF3KSkgKiB6U3BlZWQgKiBlbGFwc2VkO1xuXG4gICAgICAgICAgICB4UG9zIC09IE1hdGguc2luKGRlZ1RvUmFkKHlhdyAtIDkwKSkgKiB4U3BlZWQgKiBlbGFwc2VkO1xuICAgICAgICAgICAgelBvcyAtPSBNYXRoLmNvcyhkZWdUb1JhZCh5YXcgLSA5MCkpICogeFNwZWVkICogZWxhcHNlZDtcblxuICAgICAgICAgICAgdGhpcy5qb2dnaW5nQW5nbGUgKz0gZWxhcHNlZCAqIDAuNjtcbiAgICAgICAgICAgIHlQb3MgPSBNYXRoLnNpbihkZWdUb1JhZCh0aGlzLmpvZ2dpbmdBbmdsZSkpIC8gMjAgKyAwLjQ7XG4gICAgICAgIH1cblxuICAgICAgICB5YXcgKz0geWF3UmF0ZSAqIGVsYXBzZWQ7XG4gICAgICAgIHBpdGNoICs9IHBpdGNoUmF0ZSAqIGVsYXBzZWQ7XG4gICAgfVxuICAgIHRoaXMubGFzdEZyYW1lID0gdGhpc0ZyYW1lO1xufVxuXG52YXIgcGl0Y2ggPSAwO1xudmFyIHBpdGNoUmF0ZSA9IDA7XG5cbnZhciB5YXcgPSAwO1xudmFyIHlhd1JhdGUgPSAwO1xuXG52YXIgeFBvcyA9IDA7XG52YXIgeVBvcyA9IDAuNDtcbnZhciB6UG9zID0gMDtcblxudmFyIHpTcGVlZCA9IDA7XG52YXIgeFNwZWVkID0gMDtcblJlbmRlcmVyLnByb3RvdHlwZS5oYW5kbGVLZXlzID0gZnVuY3Rpb24gaGFuZGxlS2V5cyAoa2V5UHJlc3NlZCkge1xuICAgIC8vIGlmICAgICAgKCBrZXlQcmVzc2VkWydVUCddICkgICBwaXRjaFJhdGUgPSAwLjE7XG4gICAgLy8gZWxzZSBpZiAoIGtleVByZXNzZWRbJ0RPV04nXSApIHBpdGNoUmF0ZSA9IC0wLjE7XG4gICAgLy8gZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpdGNoUmF0ZSA9IDA7XG5cbiAgICAvLyBpZiAgICAgICgga2V5UHJlc3NlZFsnTEVGVCddIHx8IGtleVByZXNzZWRbJ0EnXSApICB5YXdSYXRlID0gMC4xO1xuICAgIC8vIGVsc2UgaWYgKCBrZXlQcmVzc2VkWydSSUdIVCddIHx8IGtleVByZXNzZWRbJ0QnXSApIHlhd1JhdGUgPSAtMC4xO1xuICAgIC8vIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHlhd1JhdGUgPSAwO1xuXG4gICAgaWYgICAgICAoIGtleVByZXNzZWRbJ0xFRlQnXSB8fCBrZXlQcmVzc2VkWydBJ10gKSAgeFNwZWVkID0gMC4xO1xuICAgIGVsc2UgaWYgKCBrZXlQcmVzc2VkWydSSUdIVCddIHx8IGtleVByZXNzZWRbJ0QnXSApIHhTcGVlZCA9IC0wLjE7XG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeFNwZWVkID0gMDtcblxuICAgIGlmICAgICAgKCBrZXlQcmVzc2VkWydVUCddIHx8IGtleVByZXNzZWRbJ1cnXSApICAgelNwZWVkID0gMC4wMDM7XG4gICAgZWxzZSBpZiAoIGtleVByZXNzZWRbJ0RPV04nXSB8fCBrZXlQcmVzc2VkWydTJ10gKSB6U3BlZWQgPSAtMC4wMDM7XG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6U3BlZWQgPSAwO1xuXG4gICAgdmFyIG1vdXNlUG9zID0gTW91c2VUcmFja2VyLmdldE1vdXNlUG9zaXRpb24oKVswXTtcbiAgICBpZiAoIG1vdXNlUG9zIDwgMC4wICkgeWF3UmF0ZSA9IDAuMiAqIE1hdGguYWJzKG1vdXNlUG9zKTtcbiAgICBlbHNlIGlmICggbW91c2VQb3MgPj0gMC4wICkgeWF3UmF0ZSA9IC0wLjIgKiBNYXRoLmFicyhtb3VzZVBvcyk7XG59XG5cbnZhciB4UG9zID0gMDtcbnZhciB5UG9zID0gMDtcbnZhciB6UG9zID0gMDtcbnZhciBwaXRjaCA9IDA7XG52YXIgeWF3ID0gMDtcblJlbmRlcmVyLnByb3RvdHlwZS5kcmF3U2NlbmUgPSBmdW5jdGlvbiBkcmF3U2NlbmUoKSB7XG4gICAgdGhpcy5nbC52aWV3cG9ydCgwLCAwLCB0aGlzLmdsLnZpZXdwb3J0V2lkdGgsIHRoaXMuZ2wudmlld3BvcnRIZWlnaHQpO1xuICAgIHRoaXMuZ2wuY2xlYXIodGhpcy5nbC5DT0xPUl9CVUZGRVJfQklUIHwgdGhpcy5nbC5ERVBUSF9CVUZGRVJfQklUKTtcblxuICAgIGlmKHdvcmxkVmVydGV4VGV4dHVyZUNvb3JkQnVmZmVyID09IG51bGwgfHwgd29ybGRWZXJ0ZXhQb3NpdGlvbkJ1ZmZlciA9PSBudWxsKSByZXR1cm47XG5cbiAgICBtYXQ0LnBlcnNwZWN0aXZlKDQ1LCB0aGlzLmdsLnZpZXdwb3J0V2lkdGggLyB0aGlzLmdsLnZpZXdwb3J0SGVpZ2h0LCAwLjEsIDEwMC4wLCB0aGlzLnBNYXRyaXgpO1xuXG4gICAgbWF0NC5pZGVudGl0eSh0aGlzLm12TWF0cml4KTtcbiAgICBtYXQ0LnJvdGF0ZSh0aGlzLm12TWF0cml4LCBkZWdUb1JhZCgtcGl0Y2gpLCBbMSwgMCwgMF0pO1xuICAgIG1hdDQucm90YXRlKHRoaXMubXZNYXRyaXgsIGRlZ1RvUmFkKC15YXcpLCAgIFswLCAxLCAwXSk7XG4gICAgbWF0NC50cmFuc2xhdGUodGhpcy5tdk1hdHJpeCwgWy14UG9zLCAteVBvcywgLXpQb3NdKTtcblxuICAgIHRoaXMuZ2wuYWN0aXZlVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkUwKTtcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlKTtcbiAgICB0aGlzLmdsLnVuaWZvcm0xaShzaGFkZXJQcm9ncmFtLnNhbXBsZXJVbmlmb3JtLCAwKTtcblxuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkFSUkFZX0JVRkZFUiwgd29ybGRWZXJ0ZXhUZXh0dXJlQ29vcmRCdWZmZXIpO1xuICAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXJQcm9ncmFtLnRleHR1cmVDb29yZEF0dHJpYnV0ZSwgd29ybGRWZXJ0ZXhUZXh0dXJlQ29vcmRCdWZmZXIuaXRlbVNpemUsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkFSUkFZX0JVRkZFUiwgd29ybGRWZXJ0ZXhQb3NpdGlvbkJ1ZmZlcik7XG4gICAgdGhpcy5nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlclByb2dyYW0udmVydGV4UG9zaXRpb25BdHRyaWJ1dGUsIHdvcmxkVmVydGV4UG9zaXRpb25CdWZmZXIuaXRlbVNpemUsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgIHRoaXMuc2V0TWF0cml4VW5pZm9ybXMoKTtcbiAgICB0aGlzLmdsLmRyYXdBcnJheXModGhpcy5nbC5UUklBTkdMRVMsIDAsIHdvcmxkVmVydGV4UG9zaXRpb25CdWZmZXIubnVtSXRlbXMpO1xufVxuXG52YXIgc2hhZGVyUHJvZ3JhbTtcblJlbmRlcmVyLnByb3RvdHlwZS5pbml0U2hhZGVycyA9IGZ1bmN0aW9uIGluaXRTaGFkZXJzKHJlc3BvbnNlQXJyYXkpIHtcblx0dmFyIHZlcnRleFNoYWRlckRhdGEgPSBYTUxMb2FkZXIuZ2V0KCcvU2hhZGVycy9WZXJ0ZXhTaGFkZXIuZ2xzbCcpO1xuXHR2YXIgZnJhZ21lbnRTaGFkZXJEYXRhID0gWE1MTG9hZGVyLmdldCgnL1NoYWRlcnMvRnJhZ21lbnRTaGFkZXIuZ2xzbCcpO1xuXG4gICAgdmVydGV4U2hhZGVyID0gdGhpcy5nbC5jcmVhdGVTaGFkZXIodGhpcy5nbC5WRVJURVhfU0hBREVSKTtcbiAgICBmcmFnbWVudFNoYWRlciA9IHRoaXMuZ2wuY3JlYXRlU2hhZGVyKHRoaXMuZ2wuRlJBR01FTlRfU0hBREVSKTtcblxuICAgIHRoaXMuZ2wuc2hhZGVyU291cmNlKHZlcnRleFNoYWRlciwgdmVydGV4U2hhZGVyRGF0YSk7XG4gICAgdGhpcy5nbC5jb21waWxlU2hhZGVyKHZlcnRleFNoYWRlcik7XG5cbiAgICB0aGlzLmdsLnNoYWRlclNvdXJjZShmcmFnbWVudFNoYWRlciwgZnJhZ21lbnRTaGFkZXJEYXRhKTtcbiAgICB0aGlzLmdsLmNvbXBpbGVTaGFkZXIoZnJhZ21lbnRTaGFkZXIpO1xuXG4gICAgc2hhZGVyUHJvZ3JhbSA9IHRoaXMuZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgIHRoaXMuZ2wuYXR0YWNoU2hhZGVyKHNoYWRlclByb2dyYW0sIHZlcnRleFNoYWRlcik7XG4gICAgdGhpcy5nbC5hdHRhY2hTaGFkZXIoc2hhZGVyUHJvZ3JhbSwgZnJhZ21lbnRTaGFkZXIpO1xuICAgIHRoaXMuZ2wubGlua1Byb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XG5cbiAgICBpZiAoIXRoaXMuZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihzaGFkZXJQcm9ncmFtLCB0aGlzLmdsLkxJTktfU1RBVFVTKSkgY29uc29sZS5sb2coXCJDb3VsZCBub3QgaW5pdGlhbGlzZSBzaGFkZXJzXCIpO1xuXG4gICAgdGhpcy5nbC51c2VQcm9ncmFtKHNoYWRlclByb2dyYW0pO1xuXG4gICAgc2hhZGVyUHJvZ3JhbS52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSA9IHRoaXMuZ2wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJhVmVydGV4UG9zaXRpb25cIik7XG4gICAgdGhpcy5nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGFkZXJQcm9ncmFtLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlKTtcblxuICAgIHNoYWRlclByb2dyYW0udGV4dHVyZUNvb3JkQXR0cmlidXRlID0gdGhpcy5nbC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFUZXh0dXJlQ29vcmRcIik7XG4gICAgdGhpcy5nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGFkZXJQcm9ncmFtLnRleHR1cmVDb29yZEF0dHJpYnV0ZSk7XG5cbiAgICBzaGFkZXJQcm9ncmFtLnBNYXRyaXhVbmlmb3JtID0gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1UE1hdHJpeFwiKTtcbiAgICBzaGFkZXJQcm9ncmFtLm12TWF0cml4VW5pZm9ybSA9IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidU1WTWF0cml4XCIpO1xuICAgIHNoYWRlclByb2dyYW0uc2FtcGxlclVuaWZvcm0gPSB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVTYW1wbGVyXCIpO1xuICAgIHNoYWRlclByb2dyYW0uY29sb3JVbmlmb3JtID0gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1Q29sb3JcIik7XG59XG5cblJlbmRlcmVyLnByb3RvdHlwZS5zZXRNYXRyaXhVbmlmb3JtcyA9IGZ1bmN0aW9uIHNldE1hdHJpeFVuaWZvcm1zKCkge1xuICAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdihzaGFkZXJQcm9ncmFtLnBNYXRyaXhVbmlmb3JtLCBmYWxzZSwgdGhpcy5wTWF0cml4KTtcbiAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYoc2hhZGVyUHJvZ3JhbS5tdk1hdHJpeFVuaWZvcm0sIGZhbHNlLCB0aGlzLm12TWF0cml4KTtcbn1cblxuXG52YXIgd29ybGRWZXJ0ZXhQb3NpdGlvbkJ1ZmZlciA9IG51bGw7XG52YXIgd29ybGRWZXJ0ZXhUZXh0dXJlQ29vcmRCdWZmZXIgPSBudWxsO1xuUmVuZGVyZXIucHJvdG90eXBlLmhhbmRsZUxvYWRlZFdvcmxkID0gZnVuY3Rpb24gaGFuZGxlTG9hZGVkV29ybGQgKHJlc3BvbnNlKSB7XG5cdHZhciBkYXRhID0gWE1MTG9hZGVyLmdldCgnL0dhbWVEYXRhL3dvcmxkLnR4dCcpO1xuICAgIHZhciBsaW5lcyA9IGRhdGEuc3BsaXQoXCJcXG5cIik7XG4gICAgdmFyIHZlcnRleENvdW50ID0gMDtcbiAgICB2YXIgdmVydGV4UG9zaXRpb25zID0gW107XG4gICAgdmFyIHZlcnRleFRleHR1cmVDb29yZHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB2YWxzID0gbGluZXNbaV0ucmVwbGFjZSgvXlxccysvLCBcIlwiKS5zcGxpdCgvXFxzKy8pO1xuICAgICAgICBpZiAodmFscy5sZW5ndGggPT09IDUgJiYgdmFsc1swXSAhPT0gXCIvL1wiKSB7XG4gICAgICAgICAgICAvL0l0IGlzIGEgbGluZSBkZXNjcmliaW5nIGEgdmVydGV4OyBnZXQgWCBZIGFuZCBaIGZpcnN0XG4gICAgICAgICAgICB2ZXJ0ZXhQb3NpdGlvbnMucHVzaChwYXJzZUZsb2F0KHZhbHNbMF0pKTtcbiAgICAgICAgICAgIHZlcnRleFBvc2l0aW9ucy5wdXNoKHBhcnNlRmxvYXQodmFsc1sxXSkpO1xuICAgICAgICAgICAgdmVydGV4UG9zaXRpb25zLnB1c2gocGFyc2VGbG9hdCh2YWxzWzJdKSk7XG5cbiAgICAgICAgICAgIC8vIEFuZCB0aGVuIHRoZSB0ZXh0dXJlIGNvb3Jkc1xuICAgICAgICAgICAgdmVydGV4VGV4dHVyZUNvb3Jkcy5wdXNoKHBhcnNlRmxvYXQodmFsc1szXSkpO1xuICAgICAgICAgICAgdmVydGV4VGV4dHVyZUNvb3Jkcy5wdXNoKHBhcnNlRmxvYXQodmFsc1s0XSkpO1xuXG4gICAgICAgICAgICB2ZXJ0ZXhDb3VudCArPSAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgd29ybGRWZXJ0ZXhQb3NpdGlvbkJ1ZmZlciA9IHRoaXMuZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB3b3JsZFZlcnRleFBvc2l0aW9uQnVmZmVyKTtcbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodmVydGV4UG9zaXRpb25zKSwgdGhpcy5nbC5TVEFUSUNfRFJBVyk7XG4gICAgd29ybGRWZXJ0ZXhQb3NpdGlvbkJ1ZmZlci5pdGVtU2l6ZSA9IDM7XG4gICAgd29ybGRWZXJ0ZXhQb3NpdGlvbkJ1ZmZlci5udW1JdGVtcyA9IHZlcnRleENvdW50O1xuXG4gICAgd29ybGRWZXJ0ZXhUZXh0dXJlQ29vcmRCdWZmZXIgPSB0aGlzLmdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkFSUkFZX0JVRkZFUiwgd29ybGRWZXJ0ZXhUZXh0dXJlQ29vcmRCdWZmZXIpO1xuICAgIHRoaXMuZ2wuYnVmZmVyRGF0YSh0aGlzLmdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh2ZXJ0ZXhUZXh0dXJlQ29vcmRzKSwgdGhpcy5nbC5TVEFUSUNfRFJBVyk7XG4gICAgd29ybGRWZXJ0ZXhUZXh0dXJlQ29vcmRCdWZmZXIuaXRlbVNpemUgPSAyO1xuICAgIHdvcmxkVmVydGV4VGV4dHVyZUNvb3JkQnVmZmVyLm51bUl0ZW1zID0gdmVydGV4Q291bnQ7XG59XG5cblxuUmVuZGVyZXIucHJvdG90eXBlLmluaXRUZXh0dXJlID0gZnVuY3Rpb24gaW5pdFRleHR1cmUoaW1hZ2VVcmwpIHtcbiAgIFx0dGhpcy50ZXh0dXJlID0gdGhpcy5nbC5jcmVhdGVUZXh0dXJlKCk7XG5cdHRoaXMudGV4dHVyZS5pbWFnZSA9IEltYWdlTG9hZGVyLmdldChpbWFnZVVybCk7XG5cbiAgICB0aGlzLmdsLnBpeGVsU3RvcmVpKHRoaXMuZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgdHJ1ZSk7XG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZSk7XG4gICAgdGhpcy5nbC50ZXhJbWFnZTJEKHRoaXMuZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5nbC5SR0JBLCB0aGlzLmdsLlJHQkEsIHRoaXMuZ2wuVU5TSUdORURfQllURSwgdGhpcy50ZXh0dXJlLmltYWdlKTtcbiAgICB0aGlzLmdsLnRleFBhcmFtZXRlcmkodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLmdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5nbC5MSU5FQVIpO1xuICAgIHRoaXMuZ2wudGV4UGFyYW1ldGVyaSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMuZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLmdsLkxJTkVBUik7XG5cbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG59XG5cbmZ1bmN0aW9uIGluaXRNYXRyaWNlcyAoKSB7XG5cdHRoaXMubXZNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xuICAgIHRoaXMubXZNYXRyaXhTdGFjayA9IFtdO1xuICAgIHRoaXMucE1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XG59XG5cbmZ1bmN0aW9uIGRlZ1RvUmFkKGRlZ3JlZXMpIHtcbiAgICByZXR1cm4gZGVncmVlcyAqIE1hdGguUEkgLyAxODA7XG59XG5cbmZ1bmN0aW9uIG12UG9wTWF0cml4KCkge1xuICAgIGlmIChtdk1hdHJpeFN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIHRocm93IFwiSW52YWxpZCBwb3BNYXRyaXghXCI7XG4gICAgfVxuICAgIG12TWF0cml4ID0gbXZNYXRyaXhTdGFjay5wb3AoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjsiLCJ2YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgRW5naW5lICAgICAgICAgICAgID0ge307XG5cbkVuZ2luZS5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5FbmdpbmUuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKEVuZ2luZSwgRW5naW5lLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoRW5naW5lLCBFbmdpbmUuZXZlbnRPdXRwdXQpO1xuXG5FbmdpbmUuY3VycmVudFN0YXRlID0gbnVsbDtcblxuRW5naW5lLnNldFN0YXRlICAgICA9IGZ1bmN0aW9uIHNldFN0YXRlKHN0YXRlKVxue1xuXHRpZiAoc3RhdGUuaW5pdGlhbGl6ZSkgc3RhdGUuaW5pdGlhbGl6ZSgpO1xuXHRcblx0aWYgKHRoaXMuY3VycmVudFN0YXRlKVxuXHR7XG5cdFx0dGhpcy5jdXJyZW50U3RhdGUudW5waXBlKEVuZ2luZS5ldmVudElucHV0KTtcblx0XHR0aGlzLmN1cnJlbnRTdGF0ZS5oaWRlKCk7XG5cdH1cblxuXHRzdGF0ZS5waXBlKHRoaXMuZXZlbnRJbnB1dCk7XG5cdHN0YXRlLnNob3coKTtcblxuXHR0aGlzLmN1cnJlbnRTdGF0ZSA9IHN0YXRlO1xufTtcblxuRW5naW5lLnN0ZXAgICAgICAgICA9IGZ1bmN0aW9uIHN0ZXAodGltZSlcbntcblx0dmFyIHN0YXRlID0gRW5naW5lLmN1cnJlbnRTdGF0ZTtcblx0aWYgKHN0YXRlKVxuXHR7XG5cdFx0aWYgKHN0YXRlLnVwZGF0ZSkgc3RhdGUudXBkYXRlKCk7XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRW5naW5lOyIsInZhciBBU1NFVF9UWVBFID0gJ2ltYWdlJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIEltYWdlTG9hZGVyICA9IHt9O1xudmFyIEltYWdlcyAgICAgICA9IHt9O1xuXG5JbWFnZUxvYWRlci5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5JbWFnZUxvYWRlci5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoSW1hZ2VMb2FkZXIsIEltYWdlTG9hZGVyLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoSW1hZ2VMb2FkZXIsIEltYWdlTG9hZGVyLmV2ZW50T3V0cHV0KTtcblxuSW1hZ2VMb2FkZXIubG9hZCA9IGZ1bmN0aW9uIGxvYWQoYXNzZXQpXG57XG4gICAgdmFyIHNvdXJjZSA9IGFzc2V0LnNvdXJjZTtcbiAgICBpZiAoIUltYWdlc1tzb3VyY2VdKVxuICAgIHtcbiAgICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGltYWdlLnNyYyA9IHNvdXJjZTtcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmaW5pc2hlZExvYWRpbmcoc291cmNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgSW1hZ2VzW3NvdXJjZV0gPSBpbWFnZTtcbiAgICB9XG59O1xuXG5JbWFnZUxvYWRlci5nZXQgID0gZnVuY3Rpb24gZ2V0KHNvdXJjZSlcbntcbiAgICByZXR1cm4gSW1hZ2VzW3NvdXJjZV07XG59O1xuXG5JbWFnZUxvYWRlci50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKClcbntcbiAgICByZXR1cm4gQVNTRVRfVFlQRTtcbn07XG5cbmZ1bmN0aW9uIGZpbmlzaGVkTG9hZGluZyhzb3VyY2UpXG57XG4gICAgSW1hZ2VMb2FkZXIuZXZlbnRPdXRwdXQuZW1pdCgnZG9uZUxvYWRpbmcnLCB7c291cmNlOiBzb3VyY2UsIHR5cGU6IEFTU0VUX1RZUEV9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZUxvYWRlcjsiLCJ2YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgVmlld3BvcnQgPSB7fTtcblxuVmlld3BvcnQuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuVmlld3BvcnQuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKFZpZXdwb3J0LCBWaWV3cG9ydC5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKFZpZXdwb3J0LCBWaWV3cG9ydC5ldmVudE91dHB1dCk7XG5cbndpbmRvdy5vbnJlc2l6ZSA9IGhhbmRsZVJlc2l6ZTtcblxuZnVuY3Rpb24gaGFuZGxlUmVzaXplKClcbntcblx0Vmlld3BvcnQuZXZlbnRPdXRwdXQuZW1pdCgncmVzaXplJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld3BvcnQ7IiwidmFyIEFTU0VUX1RZUEUgPSAneG1sJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIFhNTExvYWRlciAgPSB7fTtcbnZhciBTdG9yYWdlICA9IHt9O1xuXG5YTUxMb2FkZXIuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuWE1MTG9hZGVyLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihYTUxMb2FkZXIsIFhNTExvYWRlci5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKFhNTExvYWRlciwgWE1MTG9hZGVyLmV2ZW50T3V0cHV0KTtcblxuWE1MTG9hZGVyLmxvYWQgPSBmdW5jdGlvbiBsb2FkKGFzc2V0KVxue1xuICAgIHZhciBzb3VyY2UgPSBhc3NldC5zb3VyY2U7XG4gICAgaWYgKCFTdG9yYWdlW3NvdXJjZV0pXG4gICAge1xuICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICByZXF1ZXN0Lm9wZW4oJ0dFVCcsIHNvdXJjZSk7XG4gICAgICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgaWYocmVzcG9uc2UuY3VycmVudFRhcmdldC5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgU3RvcmFnZVtzb3VyY2VdID0gcmVzcG9uc2UuY3VycmVudFRhcmdldC5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICAgICAgZmluaXNoZWRMb2FkaW5nKHNvdXJjZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgfVxufTtcblxuWE1MTG9hZGVyLmdldCAgPSBmdW5jdGlvbiBnZXQoc291cmNlKVxue1xuICAgIHJldHVybiBTdG9yYWdlW3NvdXJjZV07XG59O1xuXG5YTUxMb2FkZXIudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpXG57XG4gICAgcmV0dXJuIEFTU0VUX1RZUEU7XG59O1xuXG5mdW5jdGlvbiBmaW5pc2hlZExvYWRpbmcoc291cmNlKVxue1xuICAgIFhNTExvYWRlci5ldmVudE91dHB1dC5lbWl0KCdkb25lTG9hZGluZycsIHtzb3VyY2U6IHNvdXJjZSwgdHlwZTogQVNTRVRfVFlQRX0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFhNTExvYWRlcjsiLCJ2YXIgS0VZX01BUCA9IHJlcXVpcmUoJy4va2V5bWFwLmpzJyk7XG52YXIgS2V5SGFuZGxlciA9IHt9O1xuXG5LZXlIYW5kbGVyLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xuXHR0aGlzLl9wcmVzc2VkID0ge307XG5cdHRoaXMuX2hhbmRsZXJzID0ge307XG5cdHRoaXMuX3VwZGF0ZUZucyA9IFtdO1xuXG5cdHRoaXMuYm91bmRLZXlEb3duID0gcmVnaXN0ZXJLZXlEb3duLmJpbmQodGhpcyk7XG5cdHRoaXMuYm91bmRLZXlVcCA9IHJlZ2lzdGVyS2V5VXAuYmluZCh0aGlzKTtcblxuXHRkb2N1bWVudC5vbmtleWRvd24gPSB0aGlzLmJvdW5kS2V5RG93bjtcblx0ZG9jdW1lbnQub25rZXl1cCA9IHRoaXMuYm91bmRLZXlVcDtcbn1cblxuS2V5SGFuZGxlci51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoKSB7XG5cdHZhciBoYW5kbGVycztcblx0dmFyIGhhbmRsZXJzTGVuZ3RoO1xuXHR2YXIgdXBkYXRlc0xlbmd0aCA9IHRoaXMuX3VwZGF0ZUZucy5sZW5ndGg7XG5cdHZhciBpO1xuXHRcblx0Zm9yKHZhciBrZXkgaW4gdGhpcy5fcHJlc3NlZCl7XG5cdFx0aWYodGhpcy5fcHJlc3NlZFtrZXldID09PSB0cnVlKXtcblx0XHRcdGhhbmRsZXJzID0gdGhpcy5faGFuZGxlcnNba2V5XTtcblx0XHRcdGlmKGhhbmRsZXJzKSB7XG5cdFx0XHRcdGhhbmRsZXJzTGVuZ3RoID0gaGFuZGxlcnMubGVuZ3RoO1xuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgaGFuZGxlcnNMZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGhhbmRsZXJzW2ldKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHVwZGF0ZXNMZW5ndGg7IGkrKykge1xuXHRcdHRoaXMuX3VwZGF0ZUZuc1tpXSh0aGlzLl9wcmVzc2VkKTtcblx0fVxufVxuXG5LZXlIYW5kbGVyLm9uID0gZnVuY3Rpb24gb24oa2V5LCBjYWxsYmFjaykge1xuXHRpZiggS0VZX01BUFtrZXldICkge1xuXHRcdGlmKCF0aGlzLl9oYW5kbGVyc1trZXldKSB0aGlzLl9oYW5kbGVyc1trZXldID0gW107XG5cdFx0dGhpcy5faGFuZGxlcnNba2V5XS5wdXNoKGNhbGxiYWNrKTtcblx0fVxuXHRlbHNlIGlmIChrZXkgPT09IFwidXBkYXRlXCIpIHtcblx0XHR0aGlzLl91cGRhdGVGbnMucHVzaChjYWxsYmFjayk7XG5cdH1cblx0ZWxzZSB0aHJvdyBcImludmFsaWQga2V5XCI7XG59XG5cbktleUhhbmRsZXIub2ZmID0gZnVuY3Rpb24gb2ZmKGtleSwgY2FsbGJhY2spIHtcblx0dmFyIGNhbGxiYWNrSW5kZXg7XG5cdHZhciBjYWxsYmFja3M7XG5cblx0aWYodGhpcy5faGFuZGxlcnNba2V5XSkge1xuXHRcdGNhbGxiYWNrcyA9IHRoaXMuX2hhbmRsZXJzW2tleV07XG5cdFx0Y2FsbGJhY2tJbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcblx0XHRpZihjYWxsYmFja0luZGV4ICE9PSAtMSkge1xuXHRcdFx0Y2FsbGJhY2tzLnNwbGljZShjYWxsYmFja0luZGV4LCAxKTtcblx0XHRcdGlmKCFjYWxsYmFja3MubGVuZ3RoKSB7XG5cdFx0XHRcdGRlbGV0ZSBjYWxsYmFja3M7XG5cdFx0XHRcdGRlbGV0ZSB0aGlzLl9wcmVzc2VkW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyS2V5RG93bihldmVudCkge1xuXHR2YXIga2V5TmFtZSA9IEtFWV9NQVBbZXZlbnQua2V5Q29kZV07XG5cdGlmIChrZXlOYW1lKSB0aGlzLl9wcmVzc2VkW2tleU5hbWVdID0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJLZXlVcChldmVudCkge1xuXHR2YXIga2V5TmFtZSA9IEtFWV9NQVBbZXZlbnQua2V5Q29kZV07XG5cdGlmIChrZXlOYW1lKSB0aGlzLl9wcmVzc2VkW2tleU5hbWVdID0gZmFsc2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gS2V5SGFuZGxlcjsiLCJ2YXIgTW91c2VUcmFja2VyID0ge307XG5cbk1vdXNlVHJhY2tlci5pbml0ID0gZnVuY3Rpb24gaW5pdCgpIHtcblx0dGhpcy5fbW91c2VQb3NpdGlvbiA9IFswLCAwXTtcblx0dGhpcy5faGFuZGxlcnMgPSBbXTtcblx0dGhpcy5fdXBkYXRlRm5zID0gW107XG5cblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5oYW5kbGVNb3VzZU1vdmUuYmluZCh0aGlzKSk7XG59XG5cbk1vdXNlVHJhY2tlci51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoKSB7XG5cbn07XG5cbk1vdXNlVHJhY2tlci5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBjYWxsYmFjaykge1xuXHQvLyBpZihldmVudCA9PT0gJ3VwZGF0ZScpIHt9XG59XG5cbk1vdXNlVHJhY2tlci5nZXRNb3VzZVBvc2l0aW9uID0gZnVuY3Rpb24gZ2V0TW91c2VQb3NpdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuX21vdXNlUG9zaXRpb247XG59XG5cbk1vdXNlVHJhY2tlci5oYW5kbGVNb3VzZU1vdmUgPSBmdW5jdGlvbiBoYW5kbGVNb3VzZU1vdmUoZXZlbnQpIHtcblx0dGhpcy5fbW91c2VQb3NpdGlvbiA9IFtcblx0XHQoZXZlbnQueCAvIGlubmVyV2lkdGgpIC0gMC41LFxuXHRcdChldmVudC55IC8gaW5uZXJIZWlnaHQpIC0gMC41XG5cdF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW91c2VUcmFja2VyOyIsIm1vZHVsZS5leHBvcnRzID0gXG57XG4gIDY1IDogJ0EnLFxuICA2NiA6ICdCJyxcbiAgNjcgOiAnQycsXG4gIDY4IDogJ0QnLFxuICA2OSA6ICdFJyxcbiAgNzAgOiAnRicsXG4gIDcxIDogJ0cnLFxuICA3MiA6ICdIJyxcbiAgNzMgOiAnSScsXG4gIDc0IDogJ0onLFxuICA3NSA6ICdLJyxcbiAgNzYgOiAnTCcsXG4gIDc3IDogJ00nLFxuICA3OCA6ICdOJyxcbiAgNzkgOiAnTycsXG4gIDgwIDogJ1AnLFxuICA4MSA6ICdRJyxcbiAgODIgOiAnUicsXG4gIDgzIDogJ1MnLFxuICA4NCA6ICdUJyxcbiAgODUgOiAnVScsXG4gIDg2IDogJ1YnLFxuICA4NyA6ICdXJyxcbiAgODggOiAnWCcsXG4gIDg5IDogJ1knLFxuICA5MCA6ICdaJyxcbiAgMTMgOiAnRU5URVInLFxuICAxNiA6ICdTSElGVCcsXG4gIDI3IDogJ0VTQycsXG4gIDMyIDogJ1NQQUNFJyxcbiAgMzcgOiAnTEVGVCcsXG4gIDM4IDogJ1VQJyxcbiAgMzkgOiAnUklHSFQnLFxuICA0MCA6ICdET1dOJ1xufTsiLCJ2YXIgQ09NUExFVEUgPSBcImNvbXBsZXRlXCI7XG52YXIgTE9BRF9TVEFSVEVEID0gXCJzdGFydExvYWRpbmdcIjtcbnZhciBMT0FEX0NPTVBMRVRFRCA9IFwiZG9uZUxvYWRpbmdcIjtcbnZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIExvYWRpbmcgICAgICAgICAgPSB7fTtcbnZhciBib2R5UmVhZHkgICAgICAgID0gZmFsc2U7XG52YXIgYXNzZXRTdGFjayAgICAgICA9IFtdO1xudmFyIGxvYWRlclJlZ2lzdHJ5ICAgPSB7fTtcbnZhciBjb250YWluZXIgICAgICAgID0gbnVsbDtcbnZhciBzcGxhc2hTY3JlZW4gICAgID0gbmV3IEltYWdlKCk7XG5zcGxhc2hTY3JlZW4uc3JjICAgICA9ICcuLi8uLi9Bc3NldHMvTG9hZGluZy4uLi5wbmcnO1xuc3BsYXNoU2NyZWVuLndpZHRoICAgPSBzcGxhc2hXaWR0aCA9IDUwMDtcbnNwbGFzaFNjcmVlbi5oZWlnaHQgID0gc3BsYXNoSGVpZ2h0ID0gMTYwO1xuTG9hZGluZy5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5Mb2FkaW5nLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihMb2FkaW5nLCBMb2FkaW5nLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoTG9hZGluZywgTG9hZGluZy5ldmVudE91dHB1dCk7XG5cbkxvYWRpbmcuZXZlbnRJbnB1dC5vbihMT0FEX0NPTVBMRVRFRCwgaGFuZGxlQ29tcGxldGVkTG9hZCk7XG5Mb2FkaW5nLmV2ZW50SW5wdXQub24oJ3Jlc2l6ZScsIGhhbmRsZVJlc2l6ZSk7XG5cbkxvYWRpbmcuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uIGluaXRpYWxpemUoKVxue1xuICAgIGlmICghY29udGFpbmVyKVxuICAgIHtcbiAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRpbmcnKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHNwbGFzaFNjcmVlbik7XG4gICAgICAgIHNwbGFzaFNjcmVlbi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHNwbGFzaFNjcmVlbi5zdHlsZS50b3AgPSAod2luZG93LmlubmVySGVpZ2h0ICogMC41KSAtIChzcGxhc2hIZWlnaHQgKiAwLjUpICsgJ3B4JztcbiAgICAgICAgc3BsYXNoU2NyZWVuLnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKHNwbGFzaFdpZHRoKiAwLjUpICsgJ3B4JztcbiAgICB9XG4gICAgaWYgKGFzc2V0U3RhY2subGVuZ3RoKVxuICAgIHtcbiAgICAgICAgdGhpcy5ldmVudE91dHB1dC5lbWl0KExPQURfU1RBUlRFRCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXNzZXRTdGFjay5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGFzc2V0ICA9IGFzc2V0U3RhY2tbaV07XG4gICAgICAgICAgICB2YXIgbG9hZGVyID0gYXNzZXQudHlwZTtcbiAgICAgICAgICAgIGxvYWRlclJlZ2lzdHJ5W2xvYWRlcl0ubG9hZChhc3NldCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Mb2FkaW5nLmxvYWQgICAgICAgPSBmdW5jdGlvbiBsb2FkKGFzc2V0KVxue1xuICAgIGFzc2V0U3RhY2sucHVzaChhc3NldCk7XG59O1xuXG5Mb2FkaW5nLnNob3cgICAgICAgPSBmdW5jdGlvbiBzaG93KClcbntcbiAgICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFZJU0lCTEU7XG59O1xuXG5Mb2FkaW5nLmhpZGUgICAgICAgPSBmdW5jdGlvbiBoaWRlKClcbntcbiAgICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9IE5PTkU7XG59O1xuXG5Mb2FkaW5nLnJlZ2lzdGVyICAgPSBmdW5jdGlvbiByZWdpc3Rlcihsb2FkZXIpXG57XG4gICAgdmFyIGxvYWRlck5hbWUgICAgICAgICAgICAgPSBsb2FkZXIudG9TdHJpbmcoKTtcbiAgICBsb2FkZXJSZWdpc3RyeVtsb2FkZXJOYW1lXSA9IGxvYWRlcjtcbiAgICBsb2FkZXIucGlwZSh0aGlzLmV2ZW50SW5wdXQpO1xufTtcblxuZnVuY3Rpb24gaGFuZGxlQ29tcGxldGVkTG9hZChkYXRhKVxue1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGRhdGEuc291cmNlO1xuICAgICAgICB2YXIgbG9jYXRpb24gPSBhc3NldFN0YWNrLmluZGV4T2Yoc291cmNlKTtcbiAgICAgICAgaWYgKGxvY2F0aW9uKSBhc3NldFN0YWNrLnNwbGljZShsb2NhdGlvbiwgMSk7XG4gICAgICAgIGlmICghYXNzZXRTdGFjay5sZW5ndGgpIExvYWRpbmcuZXZlbnRPdXRwdXQuZW1pdChMT0FEX0NPTVBMRVRFRCk7XG4gICAgfSwgMTAwMCk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVJlc2l6ZSgpXG57XG4gICAgc3BsYXNoU2NyZWVuLnN0eWxlLnRvcCA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjUpIC0gKHNwbGFzaEhlaWdodCAqIDAuNSkgKyAncHgnO1xuICAgIHNwbGFzaFNjcmVlbi5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtIChzcGxhc2hXaWR0aCogMC41KSArICdweCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTG9hZGluZzsiLCJ2YXIgTk9ORSA9ICdub25lJztcbnZhciBWSVNJQkxFID0gJ2lubGluZSc7XG5cbnZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbnZhciBNZW51ICAgICAgICAgID0ge307XG5cbk1lbnUuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuTWVudS5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoTWVudSwgTWVudS5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKE1lbnUsIE1lbnUuZXZlbnRPdXRwdXQpO1xuXG5NZW51LmV2ZW50SW5wdXQub24oJ3Jlc2l6ZScsIGhhbmRsZVJlc2l6ZSk7XG5cbnZhciBtZW51RWxlbWVudCA9IG51bGwsXG5jb250YWluZXIgICAgICAgPSBudWxsLFxubmV3R2FtZSAgICAgICAgID0gbnVsbDtcblxuTWVudS5pbml0aWFsaXplID0gZnVuY3Rpb24gaW5pdGlhbGl6ZSgpXG57XG4gICAgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnUnKTtcbiAgICBtZW51RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG1lbnVFbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBuZXdHYW1lICAgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG5ld0dhbWUub25jbGljayA9IHN0YXJ0TmV3R2FtZTtcbiAgICBuZXdHYW1lLmlubmVySFRNTCA9ICdOZXcgR2FtZSc7XG4gICAgbmV3R2FtZS5zdHlsZS5mb250U2l6ZSA9ICc1MHB4JztcbiAgICBuZXdHYW1lLnN0eWxlLmZvbnRGYW1pbHkgPSAnSGVsdmV0aWNhJztcbiAgICBuZXdHYW1lLnN0eWxlLmNvbG9yID0gJyNGRkYnO1xuICAgIG1lbnVFbGVtZW50LmFwcGVuZENoaWxkKG5ld0dhbWUpO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChtZW51RWxlbWVudCk7XG4gICAgbWVudUVsZW1lbnQuc3R5bGUudG9wICA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjUpIC0gKDU4ICogMC41KSArICdweCc7XG4gICAgbWVudUVsZW1lbnQuc3R5bGUubGVmdCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuNSkgLSAoMjUxICogMC41KSArICdweCc7XG59O1xuXG5NZW51LnNob3cgICAgICAgPSBmdW5jdGlvbiBzaG93KClcbntcbiAgICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFZJU0lCTEU7XG59O1xuXG5NZW51LmhpZGUgICAgICAgPSBmdW5jdGlvbiBoaWRlKClcbntcbiAgICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9IE5PTkU7XG59O1xuXG5mdW5jdGlvbiBoYW5kbGVSZXNpemUoKVxue1xuICAgIG1lbnVFbGVtZW50LnN0eWxlLnRvcCA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjUpIC0gKDU4ICogMC41KSArICdweCc7XG4gICAgbWVudUVsZW1lbnQuc3R5bGUubGVmdCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuNSkgLSAoMjUxICogMC41KSArICdweCc7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0TmV3R2FtZSgpXG57XG4gICAgTWVudS5ldmVudE91dHB1dC5lbWl0KCduZXdHYW1lJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWVudTsiLCJ2YXIgTk9ORSA9ICdub25lJztcbnZhciBWSVNJQkxFID0gJ2lubGluZSc7XG5cbnZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG52YXIgS2V5SGFuZGxlciAgICAgICAgID0gcmVxdWlyZSgnLi4vSW5wdXRzL0tleUhhbmRsZXInKTtcbnZhciBNb3VzZVRyYWNrZXIgICAgICAgPSByZXF1aXJlKCcuLi9JbnB1dHMvTW91c2VUcmFja2VyJyk7XG52YXIgUmVuZGVyZXIgICAgICAgICAgID0gcmVxdWlyZSgnLi4vR0wvUmVuZGVyZXInKTtcbnZhciBJbWFnZUxvYWRlciAgICAgICAgPSByZXF1aXJlKCcuLi9HYW1lL0ltYWdlTG9hZGVyJyk7XG5cbnZhciBQbGF5aW5nICAgICAgICAgICAgPSB7fTtcblxuUGxheWluZy5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5QbGF5aW5nLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihQbGF5aW5nLCBQbGF5aW5nLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoUGxheWluZywgUGxheWluZy5ldmVudE91dHB1dCk7XG5cblBsYXlpbmcuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uIGluaXRpYWxpemUoKVxue1xuXHRLZXlIYW5kbGVyLmluaXQoKTtcblx0TW91c2VUcmFja2VyLmluaXQoKTtcblx0dGhpcy5yZW5kZXJlciA9IG5ldyBSZW5kZXJlcih7IHRleHR1cmU6ICcuLi9Bc3NldHMvY3JhdGUuZ2lmJyB9KTtcbn07XG5cblBsYXlpbmcudXBkYXRlICAgICA9IGZ1bmN0aW9uIHVwZGF0ZSgpXG57XG5cdEtleUhhbmRsZXIudXBkYXRlKCk7XG5cdE1vdXNlVHJhY2tlci51cGRhdGUoKTtcblx0dGhpcy5yZW5kZXJlci51cGRhdGUoKTtcbn07XG5cblBsYXlpbmcuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xufTtcblxuUGxheWluZy5oaWRlICAgICAgID0gZnVuY3Rpb24gaGlkZSgpXG57XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXlpbmc7IiwidmFyIEVuZ2luZSAgPSByZXF1aXJlKCcuL0dhbWUvRW5naW5lJyk7XG52YXIgTG9hZGluZyA9IHJlcXVpcmUoJy4vU3RhdGVzL0xvYWRpbmcnKTtcbnZhciBNZW51ICAgID0gcmVxdWlyZSgnLi9TdGF0ZXMvTWVudScpO1xudmFyIFBsYXlpbmcgPSByZXF1aXJlKCcuL1N0YXRlcy9QbGF5aW5nJyk7XG52YXIgRXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG52YXIgSW1hZ2VMb2FkZXIgID0gcmVxdWlyZSgnLi9HYW1lL0ltYWdlTG9hZGVyJyk7XG52YXIgWE1MTG9hZGVyICAgID0gcmVxdWlyZSgnLi9HYW1lL1hNTExvYWRlcicpO1xudmFyIFZpZXdwb3J0ICAgICA9IHJlcXVpcmUoJy4vR2FtZS9WaWV3cG9ydCcpO1xuXG52YXIgQ29udHJvbGxlciA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuVmlld3BvcnQucGlwZShNZW51KTtcblZpZXdwb3J0LnBpcGUoTG9hZGluZyk7XG5WaWV3cG9ydC5waXBlKFBsYXlpbmcpO1xuXG5FbmdpbmUucGlwZShDb250cm9sbGVyKTtcbk1lbnUucGlwZShDb250cm9sbGVyKTtcbkxvYWRpbmcucGlwZShDb250cm9sbGVyKTtcblxuQ29udHJvbGxlci5vbignZG9uZUxvYWRpbmcnLCBnb1RvTWVudSk7XG5Db250cm9sbGVyLm9uKCduZXdHYW1lJywgc3RhcnRHYW1lKTtcblxudmFyIHNwcml0ZXNoZWV0ID0ge1xuXHR0eXBlOiAnaW1hZ2UnLFxuXHRzb3VyY2U6ICcuLi9Bc3NldHMvY3JhdGUuZ2lmJyxcblx0ZGF0YToge31cbn07XG5cbnZhciB2ZXJ0ZXhTaGFkZXIgPSB7XG5cdHR5cGU6ICd4bWwnLFxuXHRzb3VyY2U6ICcvU2hhZGVycy9WZXJ0ZXhTaGFkZXIuZ2xzbCcsXG5cdGRhdGE6IHt9XG59O1xuXG52YXIgZnJhZ21lbnRTaGFkZXIgPSB7XG5cdHR5cGU6ICd4bWwnLFxuXHRzb3VyY2U6ICcvU2hhZGVycy9GcmFnbWVudFNoYWRlci5nbHNsJyxcblx0ZGF0YToge31cbn07XG5cbnZhciB3b3JsZERhdGEgPSB7XG5cdHR5cGU6ICd4bWwnLFxuXHRzb3VyY2U6ICcvR2FtZURhdGEvd29ybGQudHh0Jyxcblx0ZGF0YToge31cbn1cblxuTG9hZGluZy5yZWdpc3RlcihJbWFnZUxvYWRlcik7XG5Mb2FkaW5nLnJlZ2lzdGVyKFhNTExvYWRlcik7XG5cbkxvYWRpbmcubG9hZChzcHJpdGVzaGVldCk7XG5Mb2FkaW5nLmxvYWQodmVydGV4U2hhZGVyKTtcbkxvYWRpbmcubG9hZChmcmFnbWVudFNoYWRlcik7XG5Mb2FkaW5nLmxvYWQod29ybGREYXRhKTtcblxuRW5naW5lLnNldFN0YXRlKExvYWRpbmcpO1xuXG5mdW5jdGlvbiBnb1RvTWVudSgpXG57XG4gICAgRW5naW5lLnNldFN0YXRlKE1lbnUpO1xufVxuXG5mdW5jdGlvbiBzdGFydEdhbWUoKVxue1xuXHRFbmdpbmUuc2V0U3RhdGUoUGxheWluZyk7XG59XG5cbmZ1bmN0aW9uIGxvb3AoKVxue1xuICAgIEVuZ2luZS5zdGVwKCk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xufVxuXG5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7Il19
