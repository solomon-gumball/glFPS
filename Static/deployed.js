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
var Timer        = require('../Utilities/Timer');

function Renderer (options) {
	this.canvas = document.getElementById('renderer');
    this.gl = this.canvas.getContext("webgl");
    this.gl.viewportWidth = this.canvas.width;
    this.gl.viewportHeight = this.canvas.height;

    this.lastFrame = 0;
    this.joggingAngle = 0;

    initMatrices.call(this);

    this.initShaders();
    this.initTextures(options.textures);
    this.handleLoadedWorld();


    MouseTracker.on('UPDATE', this.handleMouse.bind(this));
    KeyHandler.on('UPDATE', this.handleKeys.bind(this));
    // KeyHandler.on('SPACE:PRESS', this.handleShoot.bind(this));
    window.onclick = this.handleShoot.bind(this);

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.DEPTH_TEST);
}

Renderer.prototype.update = function update () {
	this.drawScene();
	this.animate();
}

Renderer.prototype.animate = function animate() {
    var thisFrame = Timer.getElapsed();
    var newX;
    var newZ;
    if (this.lastFrame !== 0) {
        var elapsed = thisFrame - this.lastFrame;
        if(zSpeed !== 0 || xSpeed !== 0) {

            newX = xPos - Math.sin(degToRad(yaw)) * zSpeed * elapsed;
            newZ = zPos - Math.cos(degToRad(yaw)) * zSpeed * elapsed;

            newX = newX - Math.sin(degToRad(yaw - 90)) * xSpeed * elapsed;
            newZ = newZ - Math.cos(degToRad(yaw - 90)) * xSpeed * elapsed;

            this.joggingAngle += elapsed * 0.6;
            yPos = Math.sin(degToRad(this.joggingAngle)) / 20 + 0.4;

            if(this.isInBounds(newX, newZ)) {
                xPos = newX;
                zPos = newZ;
            }
        }

        yaw += yawRate * elapsed;
        pitch += pitchRate * elapsed;
    }
    this.lastFrame = thisFrame;
}

Renderer.prototype.isInBounds = function isInBounds(x, z) {
    var status = true;
    var boundary;

    for (var i = 0; i < boundaries.length; i++) {
        boundary = boundaries[i];
        if(x > boundary[0] && x < boundary[1]){
            if(z > boundary[2] && z < boundary[3]){
                status = false;
            }
        }
    }

    return status;
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
    if      ( keyPressed['LEFT'] || keyPressed['A'] )  xSpeed = -0.003;
    else if ( keyPressed['RIGHT'] || keyPressed['D'] ) xSpeed = 0.003;
    else                                               xSpeed = 0;

    if      ( keyPressed['UP'] || keyPressed['W'] )   zSpeed = 0.003;
    else if ( keyPressed['DOWN'] || keyPressed['S'] ) zSpeed = -0.003;
    else                                              zSpeed = 0;
}

Renderer.prototype.handleMouse = function handleMouse (velocity) {
    yawRate = velocity[0] * 3000.0;
}

Renderer.prototype.handleShoot = function handleShoot () {
    setHandSprite.call(this, 1);
    Timer.after(setHandSprite.bind(this, 0), 50);
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

    /* INITIALIZE MV MATRIX */
    mat4.perspective(45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0, this.pMatrix);
    mat4.identity(this.mvMatrix);

    /* MOVE CAMERA */
    mat4.rotate(this.mvMatrix, degToRad(-pitch), [1, 0, 0]);
    mat4.rotate(this.mvMatrix, degToRad(-yaw),   [0, 1, 0]);
    mat4.translate(this.mvMatrix, [-xPos, -yPos, -zPos]);

    /* DRAW WORLD */
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[0]);
    this.gl.uniform1i(shaderProgram.samplerUniform, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
    this.gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, worldVertexTextureCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, worldVertexPositionBuffer);
    this.gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, worldVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.setMatrixUniforms();
    this.gl.drawArrays(this.gl.TRIANGLES, 0, worldVertexPositionBuffer.numItems);


    /* DRAW HANDS */
    
    mat4.identity(this.mvMatrix);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[1]);
    this.gl.uniform1i(shaderProgram.samplerUniform, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, handsTextureBuffer);
    this.gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, handsTextureBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, handsVertexPositionBuffer);
    this.gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, handsVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.setMatrixUniforms();
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, handsVertexPositionBuffer.numItems);

    this.gl.enable(this.gl.DEPTH_TEST);

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
var handsVertexPositionBuffer = null;
var handsTextureBuffer = null;
var textureCoords = null;
var handsVertices = null;
Renderer.prototype.handleLoadedWorld = function handleLoadedWorld (response) {
	var data = JSON.parse(XMLLoader.get('/GameData/world.json'));
    var vertexCount = 0;
    var vertexPositions = [];
    var vertexTextureCoords = [];
    var walls = data.walls;
    var wallVertices;
    var wall;
    var vertex;
    var vertexPosition;
    var vertexCoord;

    for (var index in walls) {
        wall = walls[index];
        wallVertices = wall.vertices;
        if(wall.boundary) this.registerBoundary(wall.vertices);
        for (var i = 0; i < wallVertices.length; i++) {
            vertex = wallVertices[i];
            vertexPosition = vertex.position;
            vertexCoord = vertex.texture;
            vertexPositions.push(vertexPosition[0], vertexPosition[1], vertexPosition[2]);
            vertexTextureCoords.push(vertexCoord[0], vertexCoord[1]);
            vertexCount++;
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

    /* CREATE HAND BUFFERS */
    handsVertexPositionBuffer = this.gl.createBuffer();
    handsVertexPositionBuffer.itemSize = 3;
    handsVertexPositionBuffer.numItems = 4;

    handsTextureBuffer = this.gl.createBuffer();
    handsTextureBuffer.itemSize = 2;
    handsTextureBuffer.numItems = 4;

    setHandSprite.call(this, 0);
}

var quadOrigin = [0.0, -0.23, -1.0];
var states = [
    { offset: [0.1, 0.765], size: [0.12, 0.20], drawSize:  [0.8, 0.9] },
    { offset: [0.355, 0.730], size: [0.12, 0.260], drawSize:  [0.8, 1.25] },
];
function setHandSprite (index) {
    var sprite     = states[index];
    var quadWidth  = sprite.drawSize[0] * 0.5;
    var quadHeight = sprite.drawSize[1] * 0.5;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, handsVertexPositionBuffer);

    var positionStartX = quadOrigin[0] - (quadWidth * 0.5);
    var positionStartY = quadOrigin[1] - (quadHeight * 0.5);
    var positionEndX   = quadOrigin[0] + (quadWidth * 0.5);
    var positionEndY   = quadOrigin[1] + (quadHeight * 0.5);

    handsVertices = [
        positionStartX, positionEndY, quadOrigin[2],
          positionEndX, positionEndY, quadOrigin[2],
        positionStartX,   positionStartY, quadOrigin[2],
          positionEndX,   positionStartY, quadOrigin[2]
    ];

    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(handsVertices), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, handsTextureBuffer);

    var textureStartX = sprite.offset[0];
    var textureStartY = sprite.offset[1];
    var textureEndX   = sprite.offset[0] + sprite.size[0];
    var textureEndY   = sprite.offset[1] + sprite.size[1];

    textureCoords = [
          textureEndX,   textureEndY,
        textureStartX,   textureEndY,
          textureEndX, textureStartY,
        textureStartX, textureStartY,
    ];

    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
}


Renderer.prototype.initTextures = function initTextures(textures) {
    this.textures = [];

    for (var i = 0; i < textures.length; i++) {
       	this.textures[i] = this.gl.createTexture();
    	this.textures[i].image = ImageLoader.get(textures[i]);

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i]);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.textures[i].image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        //this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        //this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    };
}

var boundaries = [];
var boundaryPadding = 0.06;
Renderer.prototype.registerBoundary = function registerBoundary(vertices) {
    var smallestX = vertices[0].position[0];
    var smallestZ = vertices[0].position[2];
    var greatestX = vertices[0].position[0];
    var greatestZ = vertices[0].position[2];
    var position;
    var boundary;

    for (var i = 0; i < vertices.length; i++) {
        position = vertices[i].position;
        if(position[0] > greatestX) greatestX = position[0];
        if(position[0] < smallestX) smallestX = position[0];
        if(position[2] > greatestZ) greatestZ = position[2];
        if(position[2] < smallestZ) smallestZ = position[2];

        if(greatestX === smallestX) {
            smallestX -= boundaryPadding;
            greatestX += boundaryPadding;
        } else {
            smallestZ -= boundaryPadding;
            greatestZ += boundaryPadding;
        }

        // represent boundary as [x1, x2, z1, z2];
        // console.log([smallestX, greatestX, smallestZ, greatestZ])
        boundaries.push([smallestX, greatestX, smallestZ, greatestZ]);
    }
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
},{"../Game/ImageLoader":"/Users/joseph/code/FPS/Source/Game/ImageLoader.js","../Game/XMLLoader":"/Users/joseph/code/FPS/Source/Game/XMLLoader.js","../Inputs/KeyHandler":"/Users/joseph/code/FPS/Source/Inputs/KeyHandler.js","../Inputs/MouseTracker":"/Users/joseph/code/FPS/Source/Inputs/MouseTracker.js","../Utilities/Timer":"/Users/joseph/code/FPS/Source/Utilities/Timer.js"}],"/Users/joseph/code/FPS/Source/Game/Engine.js":[function(require,module,exports){
var EventHandler       = require('../Events/EventHandler');
var Timer              = require('../Utilities/Timer');

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
	Timer.update();
	var state = Engine.currentState;
	if (state)
	{
		if (state.update) state.update();
	}
};

module.exports = Engine;
},{"../Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js","../Utilities/Timer":"/Users/joseph/code/FPS/Source/Utilities/Timer.js"}],"/Users/joseph/code/FPS/Source/Game/ImageLoader.js":[function(require,module,exports){
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
},{"./keymap.js":"/Users/joseph/code/FPS/Source/Inputs/keymap.js"}],"/Users/joseph/code/FPS/Source/Inputs/MouseTracker.js":[function(require,module,exports){
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
},{}],"/Users/joseph/code/FPS/Source/Inputs/keymap.js":[function(require,module,exports){
module.exports = 
{
  'letters' : {
     'A': 65,
     'B': 66,
     'C': 67,
     'D': 68,
     'E': 69,
     'F': 70,
     'G': 71,
     'H': 72,
     'I': 73,
     'J': 74,
     'K': 75,
     'L': 76,
     'M': 77,
     'N': 78,
     'O': 79,
     'P': 80,
     'Q': 81,
     'R': 82,
     'S': 83,
     'T': 84,
     'U': 85,
     'V': 86,
     'W': 87,
     'X': 88,
     'Y': 89,
     'Z': 90,
     'ENTER': 13,
     'SHIFT': 16,
     'ESC': 27,
     'SPACE': 32,
     'LEFT': 37,
     'UP': 38,
     'RIGHT': 39,
     'DOWN' : 40
  },
  'keys' : {
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
  }
}
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
	this.renderer = new Renderer({
		textures: [
			'../Assets/metal2.png',
			'../Assets/handsSpritesheet.png'
		]
	});
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
},{"../Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js","../GL/Renderer":"/Users/joseph/code/FPS/Source/GL/Renderer.js","../Game/ImageLoader":"/Users/joseph/code/FPS/Source/Game/ImageLoader.js","../Inputs/KeyHandler":"/Users/joseph/code/FPS/Source/Inputs/KeyHandler.js","../Inputs/MouseTracker":"/Users/joseph/code/FPS/Source/Inputs/MouseTracker.js"}],"/Users/joseph/code/FPS/Source/Utilities/Timer.js":[function(require,module,exports){
var currentTime;

module.exports = {
	_events: [],

	update: function update(){
		currentTime = Date.now();
		if(!this._initialTime) this._initialTime = currentTime;
		this._elapsed = currentTime - this._initialTime;

		for (var i = 0; i < this._events.length; i++) {
			if(this._elapsed > this._events[i].trigger) {
				this._events[i].callback();
				this._events.splice(i, 1);
			}
		}
	},

	getElapsed: function getElapsed() {
		return this._elapsed;
	},

	after: function after(callback, timeout) {
		this._events.push({
			callback: callback,
			trigger: this._elapsed + timeout
		});
	}
};
},{}],"/Users/joseph/code/FPS/Source/main.js":[function(require,module,exports){
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

var spritesheet = {
	type: 'image',
	source: '../Assets/metal2.png',
	data: {}
};

var handImage = {
	type: 'image',
	source: '../Assets/handsSpritesheet.png',
	data: {}
}

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
	source: '/GameData/world.json',
	data: {}
}

Loading.register(ImageLoader);
Loading.register(XMLLoader);

Loading.load(spritesheet);
Loading.load(handImage);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvRXZlbnRzL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0V2ZW50cy9FdmVudEhhbmRsZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9HTC9SZW5kZXJlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0dhbWUvRW5naW5lLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvR2FtZS9JbWFnZUxvYWRlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0dhbWUvVmlld3BvcnQuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9HYW1lL1hNTExvYWRlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0lucHV0cy9LZXlIYW5kbGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvSW5wdXRzL01vdXNlVHJhY2tlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0lucHV0cy9rZXltYXAuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9TdGF0ZXMvTG9hZGluZy5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL1N0YXRlcy9NZW51LmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvU3RhdGVzL1BsYXlpbmcuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9VdGlsaXRpZXMvVGltZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4qIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4qXG4qIE93bmVyOiBtYXJrQGZhbW8udXNcbiogQGxpY2Vuc2UgTVBMIDIuMFxuKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiovXG5cbi8qKlxuICogRXZlbnRFbWl0dGVyIHJlcHJlc2VudHMgYSBjaGFubmVsIGZvciBldmVudHMuXG4gKlxuICogQGNsYXNzIEV2ZW50RW1pdHRlclxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgICB0aGlzLmxpc3RlbmVycyA9IHt9O1xuICAgIHRoaXMuX293bmVyID0gdGhpcztcbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGFuIGV2ZW50LCBzZW5kaW5nIHRvIGFsbCBkb3duc3RyZWFtIGhhbmRsZXJzXG4gKiAgIGxpc3RlbmluZyBmb3IgcHJvdmlkZWQgJ3R5cGUnIGtleS5cbiAqXG4gKiBAbWV0aG9kIGVtaXRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgZXZlbnQgZGF0YVxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSwgZXZlbnQpIHtcbiAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLmxpc3RlbmVyc1t0eXBlXTtcbiAgICBpZiAoaGFuZGxlcnMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaGFuZGxlcnNbaV0uY2FsbCh0aGlzLl9vd25lciwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBCaW5kIGEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYW4gZXZlbnQgdHlwZSBoYW5kbGVkIGJ5IHRoaXMgb2JqZWN0LlxuICpcbiAqIEBtZXRob2QgXCJvblwiXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcsIE9iamVjdCl9IGhhbmRsZXIgY2FsbGJhY2tcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24odHlwZSwgaGFuZGxlcikge1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy5saXN0ZW5lcnMpKSB0aGlzLmxpc3RlbmVyc1t0eXBlXSA9IFtdO1xuICAgIHZhciBpbmRleCA9IHRoaXMubGlzdGVuZXJzW3R5cGVdLmluZGV4T2YoaGFuZGxlcik7XG4gICAgaWYgKGluZGV4IDwgMCkgdGhpcy5saXN0ZW5lcnNbdHlwZV0ucHVzaChoYW5kbGVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIFwib25cIi5cbiAqIEBtZXRob2QgYWRkTGlzdGVuZXJcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8qKlxuICogVW5iaW5kIGFuIGV2ZW50IGJ5IHR5cGUgYW5kIGhhbmRsZXIuXG4gKiAgIFRoaXMgdW5kb2VzIHRoZSB3b3JrIG9mIFwib25cIi5cbiAqXG4gKiBAbWV0aG9kIHJlbW92ZUxpc3RlbmVyXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtmdW5jdGlvbn0gaGFuZGxlciBmdW5jdGlvbiBvYmplY3QgdG8gcmVtb3ZlXG4gKiBAcmV0dXJuIHtFdmVudEVtaXR0ZXJ9IHRoaXNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKHR5cGUsIGhhbmRsZXIpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5pbmRleE9mKGhhbmRsZXIpO1xuICAgIGlmIChpbmRleCA+PSAwKSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDYWxsIGV2ZW50IGhhbmRsZXJzIHdpdGggdGhpcyBzZXQgdG8gb3duZXIuXG4gKlxuICogQG1ldGhvZCBiaW5kVGhpc1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvd25lciBvYmplY3QgdGhpcyBFdmVudEVtaXR0ZXIgYmVsb25ncyB0b1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmJpbmRUaGlzID0gZnVuY3Rpb24gYmluZFRoaXMob3duZXIpIHtcbiAgICB0aGlzLl9vd25lciA9IG93bmVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7IiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4qIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4qXG4qIE93bmVyOiBtYXJrQGZhbW8udXNcbiogQGxpY2Vuc2UgTVBMIDIuMFxuKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiovXG5cbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCcuL0V2ZW50RW1pdHRlcicpO1xuXG4vKipcbiAqIEV2ZW50SGFuZGxlciBmb3J3YXJkcyByZWNlaXZlZCBldmVudHMgdG8gYSBzZXQgb2YgcHJvdmlkZWQgY2FsbGJhY2sgZnVuY3Rpb25zLlxuICogSXQgYWxsb3dzIGV2ZW50cyB0byBiZSBjYXB0dXJlZCwgcHJvY2Vzc2VkLCBhbmQgb3B0aW9uYWxseSBwaXBlZCB0aHJvdWdoIHRvIG90aGVyIGV2ZW50IGhhbmRsZXJzLlxuICpcbiAqIEBjbGFzcyBFdmVudEhhbmRsZXJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEV2ZW50SGFuZGxlcigpIHtcbiAgICBFdmVudEVtaXR0ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuZG93bnN0cmVhbSA9IFtdOyAvLyBkb3duc3RyZWFtIGV2ZW50IGhhbmRsZXJzXG4gICAgdGhpcy5kb3duc3RyZWFtRm4gPSBbXTsgLy8gZG93bnN0cmVhbSBmdW5jdGlvbnNcblxuICAgIHRoaXMudXBzdHJlYW0gPSBbXTsgLy8gdXBzdHJlYW0gZXZlbnQgaGFuZGxlcnNcbiAgICB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzID0ge307IC8vIHVwc3RyZWFtIGxpc3RlbmVyc1xufVxuRXZlbnRIYW5kbGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZlbnRFbWl0dGVyLnByb3RvdHlwZSk7XG5FdmVudEhhbmRsZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRXZlbnRIYW5kbGVyO1xuXG4vKipcbiAqIEFzc2lnbiBhbiBldmVudCBoYW5kbGVyIHRvIHJlY2VpdmUgYW4gb2JqZWN0J3MgaW5wdXQgZXZlbnRzLlxuICpcbiAqIEBtZXRob2Qgc2V0SW5wdXRIYW5kbGVyXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBvYmplY3QgdG8gbWl4IHRyaWdnZXIsIHN1YnNjcmliZSwgYW5kIHVuc3Vic2NyaWJlIGZ1bmN0aW9ucyBpbnRvXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gaGFuZGxlciBhc3NpZ25lZCBldmVudCBoYW5kbGVyXG4gKi9cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIgPSBmdW5jdGlvbiBzZXRJbnB1dEhhbmRsZXIob2JqZWN0LCBoYW5kbGVyKSB7XG4gICAgb2JqZWN0LnRyaWdnZXIgPSBoYW5kbGVyLnRyaWdnZXIuYmluZChoYW5kbGVyKTtcbiAgICBpZiAoaGFuZGxlci5zdWJzY3JpYmUgJiYgaGFuZGxlci51bnN1YnNjcmliZSkge1xuICAgICAgICBvYmplY3Quc3Vic2NyaWJlID0gaGFuZGxlci5zdWJzY3JpYmUuYmluZChoYW5kbGVyKTtcbiAgICAgICAgb2JqZWN0LnVuc3Vic2NyaWJlID0gaGFuZGxlci51bnN1YnNjcmliZS5iaW5kKGhhbmRsZXIpO1xuICAgIH1cbn07XG5cbi8qKlxuICogQXNzaWduIGFuIGV2ZW50IGhhbmRsZXIgdG8gcmVjZWl2ZSBhbiBvYmplY3QncyBvdXRwdXQgZXZlbnRzLlxuICpcbiAqIEBtZXRob2Qgc2V0T3V0cHV0SGFuZGxlclxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb2JqZWN0IHRvIG1peCBwaXBlLCB1bnBpcGUsIG9uLCBhZGRMaXN0ZW5lciwgYW5kIHJlbW92ZUxpc3RlbmVyIGZ1bmN0aW9ucyBpbnRvXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gaGFuZGxlciBhc3NpZ25lZCBldmVudCBoYW5kbGVyXG4gKi9cbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyID0gZnVuY3Rpb24gc2V0T3V0cHV0SGFuZGxlcihvYmplY3QsIGhhbmRsZXIpIHtcbiAgICBpZiAoaGFuZGxlciBpbnN0YW5jZW9mIEV2ZW50SGFuZGxlcikgaGFuZGxlci5iaW5kVGhpcyhvYmplY3QpO1xuICAgIG9iamVjdC5waXBlID0gaGFuZGxlci5waXBlLmJpbmQoaGFuZGxlcik7XG4gICAgb2JqZWN0LnVucGlwZSA9IGhhbmRsZXIudW5waXBlLmJpbmQoaGFuZGxlcik7XG4gICAgb2JqZWN0Lm9uID0gaGFuZGxlci5vbi5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC5hZGRMaXN0ZW5lciA9IG9iamVjdC5vbjtcbiAgICBvYmplY3QucmVtb3ZlTGlzdGVuZXIgPSBoYW5kbGVyLnJlbW92ZUxpc3RlbmVyLmJpbmQoaGFuZGxlcik7XG59O1xuXG4vKipcbiAqIFRyaWdnZXIgYW4gZXZlbnQsIHNlbmRpbmcgdG8gYWxsIGRvd25zdHJlYW0gaGFuZGxlcnNcbiAqICAgbGlzdGVuaW5nIGZvciBwcm92aWRlZCAndHlwZScga2V5LlxuICpcbiAqIEBtZXRob2QgZW1pdFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCBldmVudCBkYXRhXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdCh0eXBlLCBldmVudCkge1xuICAgIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHZhciBpID0gMDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5kb3duc3RyZWFtLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLmRvd25zdHJlYW1baV0udHJpZ2dlcikgdGhpcy5kb3duc3RyZWFtW2ldLnRyaWdnZXIodHlwZSwgZXZlbnQpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5kb3duc3RyZWFtRm4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5kb3duc3RyZWFtRm5baV0odHlwZSwgZXZlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIGVtaXRcbiAqIEBtZXRob2QgYWRkTGlzdGVuZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS50cmlnZ2VyID0gRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5lbWl0O1xuXG4vKipcbiAqIEFkZCBldmVudCBoYW5kbGVyIG9iamVjdCB0byBzZXQgb2YgZG93bnN0cmVhbSBoYW5kbGVycy5cbiAqXG4gKiBAbWV0aG9kIHBpcGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gdGFyZ2V0IGV2ZW50IGhhbmRsZXIgdGFyZ2V0IG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSBwYXNzZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnBpcGUgPSBmdW5jdGlvbiBwaXBlKHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQuc3Vic2NyaWJlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiB0YXJnZXQuc3Vic2NyaWJlKHRoaXMpO1xuXG4gICAgdmFyIGRvd25zdHJlYW1DdHggPSAodGFyZ2V0IGluc3RhbmNlb2YgRnVuY3Rpb24pID8gdGhpcy5kb3duc3RyZWFtRm4gOiB0aGlzLmRvd25zdHJlYW07XG4gICAgdmFyIGluZGV4ID0gZG93bnN0cmVhbUN0eC5pbmRleE9mKHRhcmdldCk7XG4gICAgaWYgKGluZGV4IDwgMCkgZG93bnN0cmVhbUN0eC5wdXNoKHRhcmdldCk7XG5cbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgRnVuY3Rpb24pIHRhcmdldCgncGlwZScsIG51bGwpO1xuICAgIGVsc2UgaWYgKHRhcmdldC50cmlnZ2VyKSB0YXJnZXQudHJpZ2dlcigncGlwZScsIG51bGwpO1xuXG4gICAgcmV0dXJuIHRhcmdldDtcbn07XG5cbi8qKlxuICogUmVtb3ZlIGhhbmRsZXIgb2JqZWN0IGZyb20gc2V0IG9mIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKiAgIFVuZG9lcyB3b3JrIG9mIFwicGlwZVwiLlxuICpcbiAqIEBtZXRob2QgdW5waXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCB0YXJnZXQgaGFuZGxlciBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcHJvdmlkZWQgdGFyZ2V0XG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudW5waXBlID0gZnVuY3Rpb24gdW5waXBlKHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQudW5zdWJzY3JpYmUgaW5zdGFuY2VvZiBGdW5jdGlvbikgcmV0dXJuIHRhcmdldC51bnN1YnNjcmliZSh0aGlzKTtcblxuICAgIHZhciBkb3duc3RyZWFtQ3R4ID0gKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/IHRoaXMuZG93bnN0cmVhbUZuIDogdGhpcy5kb3duc3RyZWFtO1xuICAgIHZhciBpbmRleCA9IGRvd25zdHJlYW1DdHguaW5kZXhPZih0YXJnZXQpO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIGRvd25zdHJlYW1DdHguc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB0YXJnZXQoJ3VucGlwZScsIG51bGwpO1xuICAgICAgICBlbHNlIGlmICh0YXJnZXQudHJpZ2dlcikgdGFyZ2V0LnRyaWdnZXIoJ3VucGlwZScsIG51bGwpO1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cbiAgICBlbHNlIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIFwib25cIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBoYW5kbGVyIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKCEodHlwZSBpbiB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzKSkge1xuICAgICAgICB2YXIgdXBzdHJlYW1MaXN0ZW5lciA9IHRoaXMudHJpZ2dlci5iaW5kKHRoaXMsIHR5cGUpO1xuICAgICAgICB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzW3R5cGVdID0gdXBzdHJlYW1MaXN0ZW5lcjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnVwc3RyZWFtLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnVwc3RyZWFtW2ldLm9uKHR5cGUsIHVwc3RyZWFtTGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3IgXCJvblwiXG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEhhbmRsZXIucHJvdG90eXBlLm9uO1xuXG4vKipcbiAqIExpc3RlbiBmb3IgZXZlbnRzIGZyb20gYW4gdXBzdHJlYW0gZXZlbnQgaGFuZGxlci5cbiAqXG4gKiBAbWV0aG9kIHN1YnNjcmliZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRFbWl0dGVyfSBzb3VyY2Ugc291cmNlIGVtaXR0ZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiBzdWJzY3JpYmUoc291cmNlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy51cHN0cmVhbS5pbmRleE9mKHNvdXJjZSk7XG4gICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICB0aGlzLnVwc3RyZWFtLnB1c2goc291cmNlKTtcbiAgICAgICAgZm9yICh2YXIgdHlwZSBpbiB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBzb3VyY2Uub24odHlwZSwgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFN0b3AgbGlzdGVuaW5nIHRvIGV2ZW50cyBmcm9tIGFuIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXIuXG4gKlxuICogQG1ldGhvZCB1bnN1YnNjcmliZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRFbWl0dGVyfSBzb3VyY2Ugc291cmNlIGVtaXR0ZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS51bnN1YnNjcmliZSA9IGZ1bmN0aW9uIHVuc3Vic2NyaWJlKHNvdXJjZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMudXBzdHJlYW0uaW5kZXhPZihzb3VyY2UpO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIHRoaXMudXBzdHJlYW0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgZm9yICh2YXIgdHlwZSBpbiB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIodHlwZSwgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50SGFuZGxlcjsiLCJ2YXIgSW1hZ2VMb2FkZXIgID0gcmVxdWlyZSgnLi4vR2FtZS9JbWFnZUxvYWRlcicpO1xudmFyIFhNTExvYWRlciAgICA9IHJlcXVpcmUoJy4uL0dhbWUvWE1MTG9hZGVyJyk7XG52YXIgS2V5SGFuZGxlciAgID0gcmVxdWlyZSgnLi4vSW5wdXRzL0tleUhhbmRsZXInKTtcbnZhciBNb3VzZVRyYWNrZXIgPSByZXF1aXJlKCcuLi9JbnB1dHMvTW91c2VUcmFja2VyJyk7XG52YXIgVGltZXIgICAgICAgID0gcmVxdWlyZSgnLi4vVXRpbGl0aWVzL1RpbWVyJyk7XG5cbmZ1bmN0aW9uIFJlbmRlcmVyIChvcHRpb25zKSB7XG5cdHRoaXMuY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlbmRlcmVyJyk7XG4gICAgdGhpcy5nbCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKTtcbiAgICB0aGlzLmdsLnZpZXdwb3J0V2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aDtcbiAgICB0aGlzLmdsLnZpZXdwb3J0SGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0O1xuXG4gICAgdGhpcy5sYXN0RnJhbWUgPSAwO1xuICAgIHRoaXMuam9nZ2luZ0FuZ2xlID0gMDtcblxuICAgIGluaXRNYXRyaWNlcy5jYWxsKHRoaXMpO1xuXG4gICAgdGhpcy5pbml0U2hhZGVycygpO1xuICAgIHRoaXMuaW5pdFRleHR1cmVzKG9wdGlvbnMudGV4dHVyZXMpO1xuICAgIHRoaXMuaGFuZGxlTG9hZGVkV29ybGQoKTtcblxuXG4gICAgTW91c2VUcmFja2VyLm9uKCdVUERBVEUnLCB0aGlzLmhhbmRsZU1vdXNlLmJpbmQodGhpcykpO1xuICAgIEtleUhhbmRsZXIub24oJ1VQREFURScsIHRoaXMuaGFuZGxlS2V5cy5iaW5kKHRoaXMpKTtcbiAgICAvLyBLZXlIYW5kbGVyLm9uKCdTUEFDRTpQUkVTUycsIHRoaXMuaGFuZGxlU2hvb3QuYmluZCh0aGlzKSk7XG4gICAgd2luZG93Lm9uY2xpY2sgPSB0aGlzLmhhbmRsZVNob290LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmdsLmNsZWFyQ29sb3IoMC4wLCAwLjAsIDAuMCwgMS4wKTtcbiAgICB0aGlzLmdsLmVuYWJsZSh0aGlzLmdsLkJMRU5EKTtcbiAgICB0aGlzLmdsLmJsZW5kRnVuYyh0aGlzLmdsLlNSQ19BTFBIQSwgdGhpcy5nbC5PTkVfTUlOVVNfU1JDX0FMUEhBKTtcbiAgICB0aGlzLmdsLmVuYWJsZSh0aGlzLmdsLkRFUFRIX1RFU1QpO1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlICgpIHtcblx0dGhpcy5kcmF3U2NlbmUoKTtcblx0dGhpcy5hbmltYXRlKCk7XG59XG5cblJlbmRlcmVyLnByb3RvdHlwZS5hbmltYXRlID0gZnVuY3Rpb24gYW5pbWF0ZSgpIHtcbiAgICB2YXIgdGhpc0ZyYW1lID0gVGltZXIuZ2V0RWxhcHNlZCgpO1xuICAgIHZhciBuZXdYO1xuICAgIHZhciBuZXdaO1xuICAgIGlmICh0aGlzLmxhc3RGcmFtZSAhPT0gMCkge1xuICAgICAgICB2YXIgZWxhcHNlZCA9IHRoaXNGcmFtZSAtIHRoaXMubGFzdEZyYW1lO1xuICAgICAgICBpZih6U3BlZWQgIT09IDAgfHwgeFNwZWVkICE9PSAwKSB7XG5cbiAgICAgICAgICAgIG5ld1ggPSB4UG9zIC0gTWF0aC5zaW4oZGVnVG9SYWQoeWF3KSkgKiB6U3BlZWQgKiBlbGFwc2VkO1xuICAgICAgICAgICAgbmV3WiA9IHpQb3MgLSBNYXRoLmNvcyhkZWdUb1JhZCh5YXcpKSAqIHpTcGVlZCAqIGVsYXBzZWQ7XG5cbiAgICAgICAgICAgIG5ld1ggPSBuZXdYIC0gTWF0aC5zaW4oZGVnVG9SYWQoeWF3IC0gOTApKSAqIHhTcGVlZCAqIGVsYXBzZWQ7XG4gICAgICAgICAgICBuZXdaID0gbmV3WiAtIE1hdGguY29zKGRlZ1RvUmFkKHlhdyAtIDkwKSkgKiB4U3BlZWQgKiBlbGFwc2VkO1xuXG4gICAgICAgICAgICB0aGlzLmpvZ2dpbmdBbmdsZSArPSBlbGFwc2VkICogMC42O1xuICAgICAgICAgICAgeVBvcyA9IE1hdGguc2luKGRlZ1RvUmFkKHRoaXMuam9nZ2luZ0FuZ2xlKSkgLyAyMCArIDAuNDtcblxuICAgICAgICAgICAgaWYodGhpcy5pc0luQm91bmRzKG5ld1gsIG5ld1opKSB7XG4gICAgICAgICAgICAgICAgeFBvcyA9IG5ld1g7XG4gICAgICAgICAgICAgICAgelBvcyA9IG5ld1o7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB5YXcgKz0geWF3UmF0ZSAqIGVsYXBzZWQ7XG4gICAgICAgIHBpdGNoICs9IHBpdGNoUmF0ZSAqIGVsYXBzZWQ7XG4gICAgfVxuICAgIHRoaXMubGFzdEZyYW1lID0gdGhpc0ZyYW1lO1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUuaXNJbkJvdW5kcyA9IGZ1bmN0aW9uIGlzSW5Cb3VuZHMoeCwgeikge1xuICAgIHZhciBzdGF0dXMgPSB0cnVlO1xuICAgIHZhciBib3VuZGFyeTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYm91bmRhcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBib3VuZGFyeSA9IGJvdW5kYXJpZXNbaV07XG4gICAgICAgIGlmKHggPiBib3VuZGFyeVswXSAmJiB4IDwgYm91bmRhcnlbMV0pe1xuICAgICAgICAgICAgaWYoeiA+IGJvdW5kYXJ5WzJdICYmIHogPCBib3VuZGFyeVszXSl7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3RhdHVzO1xufVxuXG52YXIgcGl0Y2ggPSAwO1xudmFyIHBpdGNoUmF0ZSA9IDA7XG5cbnZhciB5YXcgPSAwO1xudmFyIHlhd1JhdGUgPSAwO1xuXG52YXIgeFBvcyA9IDA7XG52YXIgeVBvcyA9IDAuNDtcbnZhciB6UG9zID0gMDtcblxudmFyIHpTcGVlZCA9IDA7XG52YXIgeFNwZWVkID0gMDtcblJlbmRlcmVyLnByb3RvdHlwZS5oYW5kbGVLZXlzID0gZnVuY3Rpb24gaGFuZGxlS2V5cyAoa2V5UHJlc3NlZCkge1xuICAgIGlmICAgICAgKCBrZXlQcmVzc2VkWydMRUZUJ10gfHwga2V5UHJlc3NlZFsnQSddICkgIHhTcGVlZCA9IC0wLjAwMztcbiAgICBlbHNlIGlmICgga2V5UHJlc3NlZFsnUklHSFQnXSB8fCBrZXlQcmVzc2VkWydEJ10gKSB4U3BlZWQgPSAwLjAwMztcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4U3BlZWQgPSAwO1xuXG4gICAgaWYgICAgICAoIGtleVByZXNzZWRbJ1VQJ10gfHwga2V5UHJlc3NlZFsnVyddICkgICB6U3BlZWQgPSAwLjAwMztcbiAgICBlbHNlIGlmICgga2V5UHJlc3NlZFsnRE9XTiddIHx8IGtleVByZXNzZWRbJ1MnXSApIHpTcGVlZCA9IC0wLjAwMztcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHpTcGVlZCA9IDA7XG59XG5cblJlbmRlcmVyLnByb3RvdHlwZS5oYW5kbGVNb3VzZSA9IGZ1bmN0aW9uIGhhbmRsZU1vdXNlICh2ZWxvY2l0eSkge1xuICAgIHlhd1JhdGUgPSB2ZWxvY2l0eVswXSAqIDMwMDAuMDtcbn1cblxuUmVuZGVyZXIucHJvdG90eXBlLmhhbmRsZVNob290ID0gZnVuY3Rpb24gaGFuZGxlU2hvb3QgKCkge1xuICAgIHNldEhhbmRTcHJpdGUuY2FsbCh0aGlzLCAxKTtcbiAgICBUaW1lci5hZnRlcihzZXRIYW5kU3ByaXRlLmJpbmQodGhpcywgMCksIDUwKTtcbn1cblxudmFyIHhQb3MgPSAwO1xudmFyIHlQb3MgPSAwO1xudmFyIHpQb3MgPSAwO1xudmFyIHBpdGNoID0gMDtcbnZhciB5YXcgPSAwO1xuUmVuZGVyZXIucHJvdG90eXBlLmRyYXdTY2VuZSA9IGZ1bmN0aW9uIGRyYXdTY2VuZSgpIHtcbiAgICB0aGlzLmdsLnZpZXdwb3J0KDAsIDAsIHRoaXMuZ2wudmlld3BvcnRXaWR0aCwgdGhpcy5nbC52aWV3cG9ydEhlaWdodCk7XG4gICAgdGhpcy5nbC5jbGVhcih0aGlzLmdsLkNPTE9SX0JVRkZFUl9CSVQgfCB0aGlzLmdsLkRFUFRIX0JVRkZFUl9CSVQpO1xuXG4gICAgaWYod29ybGRWZXJ0ZXhUZXh0dXJlQ29vcmRCdWZmZXIgPT0gbnVsbCB8fCB3b3JsZFZlcnRleFBvc2l0aW9uQnVmZmVyID09IG51bGwpIHJldHVybjtcblxuICAgIC8qIElOSVRJQUxJWkUgTVYgTUFUUklYICovXG4gICAgbWF0NC5wZXJzcGVjdGl2ZSg0NSwgdGhpcy5nbC52aWV3cG9ydFdpZHRoIC8gdGhpcy5nbC52aWV3cG9ydEhlaWdodCwgMC4xLCAxMDAuMCwgdGhpcy5wTWF0cml4KTtcbiAgICBtYXQ0LmlkZW50aXR5KHRoaXMubXZNYXRyaXgpO1xuXG4gICAgLyogTU9WRSBDQU1FUkEgKi9cbiAgICBtYXQ0LnJvdGF0ZSh0aGlzLm12TWF0cml4LCBkZWdUb1JhZCgtcGl0Y2gpLCBbMSwgMCwgMF0pO1xuICAgIG1hdDQucm90YXRlKHRoaXMubXZNYXRyaXgsIGRlZ1RvUmFkKC15YXcpLCAgIFswLCAxLCAwXSk7XG4gICAgbWF0NC50cmFuc2xhdGUodGhpcy5tdk1hdHJpeCwgWy14UG9zLCAteVBvcywgLXpQb3NdKTtcblxuICAgIC8qIERSQVcgV09STEQgKi9cbiAgICB0aGlzLmdsLmFjdGl2ZVRleHR1cmUodGhpcy5nbC5URVhUVVJFMCk7XG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZXNbMF0pO1xuICAgIHRoaXMuZ2wudW5pZm9ybTFpKHNoYWRlclByb2dyYW0uc2FtcGxlclVuaWZvcm0sIDApO1xuXG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB3b3JsZFZlcnRleFRleHR1cmVDb29yZEJ1ZmZlcik7XG4gICAgdGhpcy5nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlclByb2dyYW0udGV4dHVyZUNvb3JkQXR0cmlidXRlLCB3b3JsZFZlcnRleFRleHR1cmVDb29yZEJ1ZmZlci5pdGVtU2l6ZSwgdGhpcy5nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB3b3JsZFZlcnRleFBvc2l0aW9uQnVmZmVyKTtcbiAgICB0aGlzLmdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyUHJvZ3JhbS52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSwgd29ybGRWZXJ0ZXhQb3NpdGlvbkJ1ZmZlci5pdGVtU2l6ZSwgdGhpcy5nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG4gICAgdGhpcy5zZXRNYXRyaXhVbmlmb3JtcygpO1xuICAgIHRoaXMuZ2wuZHJhd0FycmF5cyh0aGlzLmdsLlRSSUFOR0xFUywgMCwgd29ybGRWZXJ0ZXhQb3NpdGlvbkJ1ZmZlci5udW1JdGVtcyk7XG5cblxuICAgIC8qIERSQVcgSEFORFMgKi9cbiAgICBcbiAgICBtYXQ0LmlkZW50aXR5KHRoaXMubXZNYXRyaXgpO1xuICAgIHRoaXMuZ2wuZGlzYWJsZSh0aGlzLmdsLkRFUFRIX1RFU1QpO1xuICAgIHRoaXMuZ2wuYWN0aXZlVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkUwKTtcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlc1sxXSk7XG4gICAgdGhpcy5nbC51bmlmb3JtMWkoc2hhZGVyUHJvZ3JhbS5zYW1wbGVyVW5pZm9ybSwgMCk7XG5cbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIGhhbmRzVGV4dHVyZUJ1ZmZlcik7XG4gICAgdGhpcy5nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlclByb2dyYW0udGV4dHVyZUNvb3JkQXR0cmlidXRlLCBoYW5kc1RleHR1cmVCdWZmZXIuaXRlbVNpemUsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkFSUkFZX0JVRkZFUiwgaGFuZHNWZXJ0ZXhQb3NpdGlvbkJ1ZmZlcik7XG4gICAgdGhpcy5nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlclByb2dyYW0udmVydGV4UG9zaXRpb25BdHRyaWJ1dGUsIGhhbmRzVmVydGV4UG9zaXRpb25CdWZmZXIuaXRlbVNpemUsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgIHRoaXMuc2V0TWF0cml4VW5pZm9ybXMoKTtcbiAgICB0aGlzLmdsLmRyYXdBcnJheXModGhpcy5nbC5UUklBTkdMRV9TVFJJUCwgMCwgaGFuZHNWZXJ0ZXhQb3NpdGlvbkJ1ZmZlci5udW1JdGVtcyk7XG5cbiAgICB0aGlzLmdsLmVuYWJsZSh0aGlzLmdsLkRFUFRIX1RFU1QpO1xuXG59XG5cbnZhciBzaGFkZXJQcm9ncmFtO1xuUmVuZGVyZXIucHJvdG90eXBlLmluaXRTaGFkZXJzID0gZnVuY3Rpb24gaW5pdFNoYWRlcnMocmVzcG9uc2VBcnJheSkge1xuXHR2YXIgdmVydGV4U2hhZGVyRGF0YSA9IFhNTExvYWRlci5nZXQoJy9TaGFkZXJzL1ZlcnRleFNoYWRlci5nbHNsJyk7XG5cdHZhciBmcmFnbWVudFNoYWRlckRhdGEgPSBYTUxMb2FkZXIuZ2V0KCcvU2hhZGVycy9GcmFnbWVudFNoYWRlci5nbHNsJyk7XG5cbiAgICB2ZXJ0ZXhTaGFkZXIgPSB0aGlzLmdsLmNyZWF0ZVNoYWRlcih0aGlzLmdsLlZFUlRFWF9TSEFERVIpO1xuICAgIGZyYWdtZW50U2hhZGVyID0gdGhpcy5nbC5jcmVhdGVTaGFkZXIodGhpcy5nbC5GUkFHTUVOVF9TSEFERVIpO1xuXG4gICAgdGhpcy5nbC5zaGFkZXJTb3VyY2UodmVydGV4U2hhZGVyLCB2ZXJ0ZXhTaGFkZXJEYXRhKTtcbiAgICB0aGlzLmdsLmNvbXBpbGVTaGFkZXIodmVydGV4U2hhZGVyKTtcblxuICAgIHRoaXMuZ2wuc2hhZGVyU291cmNlKGZyYWdtZW50U2hhZGVyLCBmcmFnbWVudFNoYWRlckRhdGEpO1xuICAgIHRoaXMuZ2wuY29tcGlsZVNoYWRlcihmcmFnbWVudFNoYWRlcik7XG5cbiAgICBzaGFkZXJQcm9ncmFtID0gdGhpcy5nbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgdGhpcy5nbC5hdHRhY2hTaGFkZXIoc2hhZGVyUHJvZ3JhbSwgdmVydGV4U2hhZGVyKTtcbiAgICB0aGlzLmdsLmF0dGFjaFNoYWRlcihzaGFkZXJQcm9ncmFtLCBmcmFnbWVudFNoYWRlcik7XG4gICAgdGhpcy5nbC5saW5rUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcblxuICAgIGlmICghdGhpcy5nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHNoYWRlclByb2dyYW0sIHRoaXMuZ2wuTElOS19TVEFUVVMpKSBjb25zb2xlLmxvZyhcIkNvdWxkIG5vdCBpbml0aWFsaXNlIHNoYWRlcnNcIik7XG5cbiAgICB0aGlzLmdsLnVzZVByb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XG5cbiAgICBzaGFkZXJQcm9ncmFtLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlID0gdGhpcy5nbC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFWZXJ0ZXhQb3NpdGlvblwiKTtcbiAgICB0aGlzLmdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlclByb2dyYW0udmVydGV4UG9zaXRpb25BdHRyaWJ1dGUpO1xuXG4gICAgc2hhZGVyUHJvZ3JhbS50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUgPSB0aGlzLmdsLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYVRleHR1cmVDb29yZFwiKTtcbiAgICB0aGlzLmdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlclByb2dyYW0udGV4dHVyZUNvb3JkQXR0cmlidXRlKTtcblxuICAgIHNoYWRlclByb2dyYW0ucE1hdHJpeFVuaWZvcm0gPSB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVQTWF0cml4XCIpO1xuICAgIHNoYWRlclByb2dyYW0ubXZNYXRyaXhVbmlmb3JtID0gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1TVZNYXRyaXhcIik7XG4gICAgc2hhZGVyUHJvZ3JhbS5zYW1wbGVyVW5pZm9ybSA9IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidVNhbXBsZXJcIik7XG4gICAgc2hhZGVyUHJvZ3JhbS5jb2xvclVuaWZvcm0gPSB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVDb2xvclwiKTtcbn1cblxuUmVuZGVyZXIucHJvdG90eXBlLnNldE1hdHJpeFVuaWZvcm1zID0gZnVuY3Rpb24gc2V0TWF0cml4VW5pZm9ybXMoKSB7XG4gICAgdGhpcy5nbC51bmlmb3JtTWF0cml4NGZ2KHNoYWRlclByb2dyYW0ucE1hdHJpeFVuaWZvcm0sIGZhbHNlLCB0aGlzLnBNYXRyaXgpO1xuICAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdihzaGFkZXJQcm9ncmFtLm12TWF0cml4VW5pZm9ybSwgZmFsc2UsIHRoaXMubXZNYXRyaXgpO1xufVxuXG5cbnZhciB3b3JsZFZlcnRleFBvc2l0aW9uQnVmZmVyID0gbnVsbDtcbnZhciB3b3JsZFZlcnRleFRleHR1cmVDb29yZEJ1ZmZlciA9IG51bGw7XG52YXIgaGFuZHNWZXJ0ZXhQb3NpdGlvbkJ1ZmZlciA9IG51bGw7XG52YXIgaGFuZHNUZXh0dXJlQnVmZmVyID0gbnVsbDtcbnZhciB0ZXh0dXJlQ29vcmRzID0gbnVsbDtcbnZhciBoYW5kc1ZlcnRpY2VzID0gbnVsbDtcblJlbmRlcmVyLnByb3RvdHlwZS5oYW5kbGVMb2FkZWRXb3JsZCA9IGZ1bmN0aW9uIGhhbmRsZUxvYWRlZFdvcmxkIChyZXNwb25zZSkge1xuXHR2YXIgZGF0YSA9IEpTT04ucGFyc2UoWE1MTG9hZGVyLmdldCgnL0dhbWVEYXRhL3dvcmxkLmpzb24nKSk7XG4gICAgdmFyIHZlcnRleENvdW50ID0gMDtcbiAgICB2YXIgdmVydGV4UG9zaXRpb25zID0gW107XG4gICAgdmFyIHZlcnRleFRleHR1cmVDb29yZHMgPSBbXTtcbiAgICB2YXIgd2FsbHMgPSBkYXRhLndhbGxzO1xuICAgIHZhciB3YWxsVmVydGljZXM7XG4gICAgdmFyIHdhbGw7XG4gICAgdmFyIHZlcnRleDtcbiAgICB2YXIgdmVydGV4UG9zaXRpb247XG4gICAgdmFyIHZlcnRleENvb3JkO1xuXG4gICAgZm9yICh2YXIgaW5kZXggaW4gd2FsbHMpIHtcbiAgICAgICAgd2FsbCA9IHdhbGxzW2luZGV4XTtcbiAgICAgICAgd2FsbFZlcnRpY2VzID0gd2FsbC52ZXJ0aWNlcztcbiAgICAgICAgaWYod2FsbC5ib3VuZGFyeSkgdGhpcy5yZWdpc3RlckJvdW5kYXJ5KHdhbGwudmVydGljZXMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdhbGxWZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmVydGV4ID0gd2FsbFZlcnRpY2VzW2ldO1xuICAgICAgICAgICAgdmVydGV4UG9zaXRpb24gPSB2ZXJ0ZXgucG9zaXRpb247XG4gICAgICAgICAgICB2ZXJ0ZXhDb29yZCA9IHZlcnRleC50ZXh0dXJlO1xuICAgICAgICAgICAgdmVydGV4UG9zaXRpb25zLnB1c2godmVydGV4UG9zaXRpb25bMF0sIHZlcnRleFBvc2l0aW9uWzFdLCB2ZXJ0ZXhQb3NpdGlvblsyXSk7XG4gICAgICAgICAgICB2ZXJ0ZXhUZXh0dXJlQ29vcmRzLnB1c2godmVydGV4Q29vcmRbMF0sIHZlcnRleENvb3JkWzFdKTtcbiAgICAgICAgICAgIHZlcnRleENvdW50Kys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB3b3JsZFZlcnRleFBvc2l0aW9uQnVmZmVyID0gdGhpcy5nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHdvcmxkVmVydGV4UG9zaXRpb25CdWZmZXIpO1xuICAgIHRoaXMuZ2wuYnVmZmVyRGF0YSh0aGlzLmdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh2ZXJ0ZXhQb3NpdGlvbnMpLCB0aGlzLmdsLlNUQVRJQ19EUkFXKTtcbiAgICB3b3JsZFZlcnRleFBvc2l0aW9uQnVmZmVyLml0ZW1TaXplID0gMztcbiAgICB3b3JsZFZlcnRleFBvc2l0aW9uQnVmZmVyLm51bUl0ZW1zID0gdmVydGV4Q291bnQ7XG5cbiAgICB3b3JsZFZlcnRleFRleHR1cmVDb29yZEJ1ZmZlciA9IHRoaXMuZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB3b3JsZFZlcnRleFRleHR1cmVDb29yZEJ1ZmZlcik7XG4gICAgdGhpcy5nbC5idWZmZXJEYXRhKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHZlcnRleFRleHR1cmVDb29yZHMpLCB0aGlzLmdsLlNUQVRJQ19EUkFXKTtcbiAgICB3b3JsZFZlcnRleFRleHR1cmVDb29yZEJ1ZmZlci5pdGVtU2l6ZSA9IDI7XG4gICAgd29ybGRWZXJ0ZXhUZXh0dXJlQ29vcmRCdWZmZXIubnVtSXRlbXMgPSB2ZXJ0ZXhDb3VudDtcblxuICAgIC8qIENSRUFURSBIQU5EIEJVRkZFUlMgKi9cbiAgICBoYW5kc1ZlcnRleFBvc2l0aW9uQnVmZmVyID0gdGhpcy5nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBoYW5kc1ZlcnRleFBvc2l0aW9uQnVmZmVyLml0ZW1TaXplID0gMztcbiAgICBoYW5kc1ZlcnRleFBvc2l0aW9uQnVmZmVyLm51bUl0ZW1zID0gNDtcblxuICAgIGhhbmRzVGV4dHVyZUJ1ZmZlciA9IHRoaXMuZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgaGFuZHNUZXh0dXJlQnVmZmVyLml0ZW1TaXplID0gMjtcbiAgICBoYW5kc1RleHR1cmVCdWZmZXIubnVtSXRlbXMgPSA0O1xuXG4gICAgc2V0SGFuZFNwcml0ZS5jYWxsKHRoaXMsIDApO1xufVxuXG52YXIgcXVhZE9yaWdpbiA9IFswLjAsIC0wLjIzLCAtMS4wXTtcbnZhciBzdGF0ZXMgPSBbXG4gICAgeyBvZmZzZXQ6IFswLjEsIDAuNzY1XSwgc2l6ZTogWzAuMTIsIDAuMjBdLCBkcmF3U2l6ZTogIFswLjgsIDAuOV0gfSxcbiAgICB7IG9mZnNldDogWzAuMzU1LCAwLjczMF0sIHNpemU6IFswLjEyLCAwLjI2MF0sIGRyYXdTaXplOiAgWzAuOCwgMS4yNV0gfSxcbl07XG5mdW5jdGlvbiBzZXRIYW5kU3ByaXRlIChpbmRleCkge1xuICAgIHZhciBzcHJpdGUgICAgID0gc3RhdGVzW2luZGV4XTtcbiAgICB2YXIgcXVhZFdpZHRoICA9IHNwcml0ZS5kcmF3U2l6ZVswXSAqIDAuNTtcbiAgICB2YXIgcXVhZEhlaWdodCA9IHNwcml0ZS5kcmF3U2l6ZVsxXSAqIDAuNTtcblxuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkFSUkFZX0JVRkZFUiwgaGFuZHNWZXJ0ZXhQb3NpdGlvbkJ1ZmZlcik7XG5cbiAgICB2YXIgcG9zaXRpb25TdGFydFggPSBxdWFkT3JpZ2luWzBdIC0gKHF1YWRXaWR0aCAqIDAuNSk7XG4gICAgdmFyIHBvc2l0aW9uU3RhcnRZID0gcXVhZE9yaWdpblsxXSAtIChxdWFkSGVpZ2h0ICogMC41KTtcbiAgICB2YXIgcG9zaXRpb25FbmRYICAgPSBxdWFkT3JpZ2luWzBdICsgKHF1YWRXaWR0aCAqIDAuNSk7XG4gICAgdmFyIHBvc2l0aW9uRW5kWSAgID0gcXVhZE9yaWdpblsxXSArIChxdWFkSGVpZ2h0ICogMC41KTtcblxuICAgIGhhbmRzVmVydGljZXMgPSBbXG4gICAgICAgIHBvc2l0aW9uU3RhcnRYLCBwb3NpdGlvbkVuZFksIHF1YWRPcmlnaW5bMl0sXG4gICAgICAgICAgcG9zaXRpb25FbmRYLCBwb3NpdGlvbkVuZFksIHF1YWRPcmlnaW5bMl0sXG4gICAgICAgIHBvc2l0aW9uU3RhcnRYLCAgIHBvc2l0aW9uU3RhcnRZLCBxdWFkT3JpZ2luWzJdLFxuICAgICAgICAgIHBvc2l0aW9uRW5kWCwgICBwb3NpdGlvblN0YXJ0WSwgcXVhZE9yaWdpblsyXVxuICAgIF07XG5cbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoaGFuZHNWZXJ0aWNlcyksIHRoaXMuZ2wuU1RBVElDX0RSQVcpO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkFSUkFZX0JVRkZFUiwgaGFuZHNUZXh0dXJlQnVmZmVyKTtcblxuICAgIHZhciB0ZXh0dXJlU3RhcnRYID0gc3ByaXRlLm9mZnNldFswXTtcbiAgICB2YXIgdGV4dHVyZVN0YXJ0WSA9IHNwcml0ZS5vZmZzZXRbMV07XG4gICAgdmFyIHRleHR1cmVFbmRYICAgPSBzcHJpdGUub2Zmc2V0WzBdICsgc3ByaXRlLnNpemVbMF07XG4gICAgdmFyIHRleHR1cmVFbmRZICAgPSBzcHJpdGUub2Zmc2V0WzFdICsgc3ByaXRlLnNpemVbMV07XG5cbiAgICB0ZXh0dXJlQ29vcmRzID0gW1xuICAgICAgICAgIHRleHR1cmVFbmRYLCAgIHRleHR1cmVFbmRZLFxuICAgICAgICB0ZXh0dXJlU3RhcnRYLCAgIHRleHR1cmVFbmRZLFxuICAgICAgICAgIHRleHR1cmVFbmRYLCB0ZXh0dXJlU3RhcnRZLFxuICAgICAgICB0ZXh0dXJlU3RhcnRYLCB0ZXh0dXJlU3RhcnRZLFxuICAgIF07XG5cbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodGV4dHVyZUNvb3JkcyksIHRoaXMuZ2wuU1RBVElDX0RSQVcpO1xufVxuXG5cblJlbmRlcmVyLnByb3RvdHlwZS5pbml0VGV4dHVyZXMgPSBmdW5jdGlvbiBpbml0VGV4dHVyZXModGV4dHVyZXMpIHtcbiAgICB0aGlzLnRleHR1cmVzID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRleHR1cmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgXHR0aGlzLnRleHR1cmVzW2ldID0gdGhpcy5nbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgXHR0aGlzLnRleHR1cmVzW2ldLmltYWdlID0gSW1hZ2VMb2FkZXIuZ2V0KHRleHR1cmVzW2ldKTtcblxuICAgICAgICB0aGlzLmdsLnBpeGVsU3RvcmVpKHRoaXMuZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuZ2wuYmluZFRleHR1cmUodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmVzW2ldKTtcbiAgICAgICAgdGhpcy5nbC50ZXhJbWFnZTJEKHRoaXMuZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5nbC5SR0JBLCB0aGlzLmdsLlJHQkEsIHRoaXMuZ2wuVU5TSUdORURfQllURSwgdGhpcy50ZXh0dXJlc1tpXS5pbWFnZSk7XG4gICAgICAgIHRoaXMuZ2wudGV4UGFyYW1ldGVyaSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMuZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCB0aGlzLmdsLkxJTkVBUik7XG4gICAgICAgIC8vIHRoaXMuZ2wudGV4UGFyYW1ldGVyaSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMuZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLmdsLkxJTkVBUl9NSVBNQVBfTElORUFSKTtcbiAgICAgICAgdGhpcy5nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy5nbC5URVhUVVJFX01JTl9GSUxURVIsIHRoaXMuZ2wuTElORUFSKTtcbiAgICAgICAgdGhpcy5nbC5nZW5lcmF0ZU1pcG1hcCh0aGlzLmdsLlRFWFRVUkVfMkQpO1xuICAgICAgICAvL3RoaXMuZ2wudGV4UGFyYW1ldGVyaSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMuZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMuZ2wuUkVQRUFUKTtcbiAgICAgICAgLy90aGlzLmdsLnRleFBhcmFtZXRlcmkodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLmdsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLmdsLlJFUEVBVCk7XG5cbiAgICAgICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgIH07XG59XG5cbnZhciBib3VuZGFyaWVzID0gW107XG52YXIgYm91bmRhcnlQYWRkaW5nID0gMC4wNjtcblJlbmRlcmVyLnByb3RvdHlwZS5yZWdpc3RlckJvdW5kYXJ5ID0gZnVuY3Rpb24gcmVnaXN0ZXJCb3VuZGFyeSh2ZXJ0aWNlcykge1xuICAgIHZhciBzbWFsbGVzdFggPSB2ZXJ0aWNlc1swXS5wb3NpdGlvblswXTtcbiAgICB2YXIgc21hbGxlc3RaID0gdmVydGljZXNbMF0ucG9zaXRpb25bMl07XG4gICAgdmFyIGdyZWF0ZXN0WCA9IHZlcnRpY2VzWzBdLnBvc2l0aW9uWzBdO1xuICAgIHZhciBncmVhdGVzdFogPSB2ZXJ0aWNlc1swXS5wb3NpdGlvblsyXTtcbiAgICB2YXIgcG9zaXRpb247XG4gICAgdmFyIGJvdW5kYXJ5O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBwb3NpdGlvbiA9IHZlcnRpY2VzW2ldLnBvc2l0aW9uO1xuICAgICAgICBpZihwb3NpdGlvblswXSA+IGdyZWF0ZXN0WCkgZ3JlYXRlc3RYID0gcG9zaXRpb25bMF07XG4gICAgICAgIGlmKHBvc2l0aW9uWzBdIDwgc21hbGxlc3RYKSBzbWFsbGVzdFggPSBwb3NpdGlvblswXTtcbiAgICAgICAgaWYocG9zaXRpb25bMl0gPiBncmVhdGVzdFopIGdyZWF0ZXN0WiA9IHBvc2l0aW9uWzJdO1xuICAgICAgICBpZihwb3NpdGlvblsyXSA8IHNtYWxsZXN0Wikgc21hbGxlc3RaID0gcG9zaXRpb25bMl07XG5cbiAgICAgICAgaWYoZ3JlYXRlc3RYID09PSBzbWFsbGVzdFgpIHtcbiAgICAgICAgICAgIHNtYWxsZXN0WCAtPSBib3VuZGFyeVBhZGRpbmc7XG4gICAgICAgICAgICBncmVhdGVzdFggKz0gYm91bmRhcnlQYWRkaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc21hbGxlc3RaIC09IGJvdW5kYXJ5UGFkZGluZztcbiAgICAgICAgICAgIGdyZWF0ZXN0WiArPSBib3VuZGFyeVBhZGRpbmc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXByZXNlbnQgYm91bmRhcnkgYXMgW3gxLCB4MiwgejEsIHoyXTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coW3NtYWxsZXN0WCwgZ3JlYXRlc3RYLCBzbWFsbGVzdFosIGdyZWF0ZXN0Wl0pXG4gICAgICAgIGJvdW5kYXJpZXMucHVzaChbc21hbGxlc3RYLCBncmVhdGVzdFgsIHNtYWxsZXN0WiwgZ3JlYXRlc3RaXSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbml0TWF0cmljZXMgKCkge1xuXHR0aGlzLm12TWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcbiAgICB0aGlzLm12TWF0cml4U3RhY2sgPSBbXTtcbiAgICB0aGlzLnBNYXRyaXggPSBtYXQ0LmNyZWF0ZSgpO1xufVxuXG5mdW5jdGlvbiBkZWdUb1JhZChkZWdyZWVzKSB7XG4gICAgcmV0dXJuIGRlZ3JlZXMgKiBNYXRoLlBJIC8gMTgwO1xufVxuXG5mdW5jdGlvbiBtdlBvcE1hdHJpeCgpIHtcbiAgICBpZiAobXZNYXRyaXhTdGFjay5sZW5ndGggPT0gMCkge1xuICAgICAgICB0aHJvdyBcIkludmFsaWQgcG9wTWF0cml4IVwiO1xuICAgIH1cbiAgICBtdk1hdHJpeCA9IG12TWF0cml4U3RhY2sucG9wKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyZXI7IiwidmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcbnZhciBUaW1lciAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLi9VdGlsaXRpZXMvVGltZXInKTtcblxudmFyIEVuZ2luZSAgICAgICAgICAgICA9IHt9O1xuXG5FbmdpbmUuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuRW5naW5lLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihFbmdpbmUsIEVuZ2luZS5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKEVuZ2luZSwgRW5naW5lLmV2ZW50T3V0cHV0KTtcblxuRW5naW5lLmN1cnJlbnRTdGF0ZSA9IG51bGw7XG5cbkVuZ2luZS5zZXRTdGF0ZSAgICAgPSBmdW5jdGlvbiBzZXRTdGF0ZShzdGF0ZSlcbntcblx0aWYgKHN0YXRlLmluaXRpYWxpemUpIHN0YXRlLmluaXRpYWxpemUoKTtcblx0XG5cdGlmICh0aGlzLmN1cnJlbnRTdGF0ZSlcblx0e1xuXHRcdHRoaXMuY3VycmVudFN0YXRlLnVucGlwZShFbmdpbmUuZXZlbnRJbnB1dCk7XG5cdFx0dGhpcy5jdXJyZW50U3RhdGUuaGlkZSgpO1xuXHR9XG5cblx0c3RhdGUucGlwZSh0aGlzLmV2ZW50SW5wdXQpO1xuXHRzdGF0ZS5zaG93KCk7XG5cblx0dGhpcy5jdXJyZW50U3RhdGUgPSBzdGF0ZTtcbn07XG5cbkVuZ2luZS5zdGVwICAgICAgICAgPSBmdW5jdGlvbiBzdGVwKHRpbWUpXG57XG5cdFRpbWVyLnVwZGF0ZSgpO1xuXHR2YXIgc3RhdGUgPSBFbmdpbmUuY3VycmVudFN0YXRlO1xuXHRpZiAoc3RhdGUpXG5cdHtcblx0XHRpZiAoc3RhdGUudXBkYXRlKSBzdGF0ZS51cGRhdGUoKTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbmdpbmU7IiwidmFyIEFTU0VUX1RZUEUgPSAnaW1hZ2UnO1xuXG52YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgSW1hZ2VMb2FkZXIgID0ge307XG52YXIgSW1hZ2VzICAgICAgID0ge307XG5cbkltYWdlTG9hZGVyLmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbkltYWdlTG9hZGVyLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihJbWFnZUxvYWRlciwgSW1hZ2VMb2FkZXIuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihJbWFnZUxvYWRlciwgSW1hZ2VMb2FkZXIuZXZlbnRPdXRwdXQpO1xuXG5JbWFnZUxvYWRlci5sb2FkID0gZnVuY3Rpb24gbG9hZChhc3NldClcbntcbiAgICB2YXIgc291cmNlID0gYXNzZXQuc291cmNlO1xuICAgIGlmICghSW1hZ2VzW3NvdXJjZV0pXG4gICAge1xuICAgICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgaW1hZ2Uuc3JjID0gc291cmNlO1xuICAgICAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZpbmlzaGVkTG9hZGluZyhzb3VyY2UpO1xuICAgICAgICB9O1xuICAgICAgICBJbWFnZXNbc291cmNlXSA9IGltYWdlO1xuICAgIH1cbn07XG5cbkltYWdlTG9hZGVyLmdldCAgPSBmdW5jdGlvbiBnZXQoc291cmNlKVxue1xuICAgIHJldHVybiBJbWFnZXNbc291cmNlXTtcbn07XG5cbkltYWdlTG9hZGVyLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKVxue1xuICAgIHJldHVybiBBU1NFVF9UWVBFO1xufTtcblxuZnVuY3Rpb24gZmluaXNoZWRMb2FkaW5nKHNvdXJjZSlcbntcbiAgICBJbWFnZUxvYWRlci5ldmVudE91dHB1dC5lbWl0KCdkb25lTG9hZGluZycsIHtzb3VyY2U6IHNvdXJjZSwgdHlwZTogQVNTRVRfVFlQRX0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlTG9hZGVyOyIsInZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbnZhciBWaWV3cG9ydCA9IHt9O1xuXG5WaWV3cG9ydC5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5WaWV3cG9ydC5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoVmlld3BvcnQsIFZpZXdwb3J0LmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoVmlld3BvcnQsIFZpZXdwb3J0LmV2ZW50T3V0cHV0KTtcblxud2luZG93Lm9ucmVzaXplID0gaGFuZGxlUmVzaXplO1xuXG5mdW5jdGlvbiBoYW5kbGVSZXNpemUoKVxue1xuXHRWaWV3cG9ydC5ldmVudE91dHB1dC5lbWl0KCdyZXNpemUnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3cG9ydDsiLCJ2YXIgQVNTRVRfVFlQRSA9ICd4bWwnO1xuXG52YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgWE1MTG9hZGVyICA9IHt9O1xudmFyIFN0b3JhZ2UgID0ge307XG5cblhNTExvYWRlci5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5YTUxMb2FkZXIuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKFhNTExvYWRlciwgWE1MTG9hZGVyLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoWE1MTG9hZGVyLCBYTUxMb2FkZXIuZXZlbnRPdXRwdXQpO1xuXG5YTUxMb2FkZXIubG9hZCA9IGZ1bmN0aW9uIGxvYWQoYXNzZXQpXG57XG4gICAgdmFyIHNvdXJjZSA9IGFzc2V0LnNvdXJjZTtcbiAgICBpZiAoIVN0b3JhZ2Vbc291cmNlXSlcbiAgICB7XG4gICAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHJlcXVlc3Qub3BlbignR0VUJywgc291cmNlKTtcbiAgICAgICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICBpZihyZXNwb25zZS5jdXJyZW50VGFyZ2V0LnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBTdG9yYWdlW3NvdXJjZV0gPSByZXNwb25zZS5jdXJyZW50VGFyZ2V0LnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICBmaW5pc2hlZExvYWRpbmcoc291cmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXF1ZXN0LnNlbmQoKTtcbiAgICB9XG59O1xuXG5YTUxMb2FkZXIuZ2V0ICA9IGZ1bmN0aW9uIGdldChzb3VyY2UpXG57XG4gICAgcmV0dXJuIFN0b3JhZ2Vbc291cmNlXTtcbn07XG5cblhNTExvYWRlci50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKClcbntcbiAgICByZXR1cm4gQVNTRVRfVFlQRTtcbn07XG5cbmZ1bmN0aW9uIGZpbmlzaGVkTG9hZGluZyhzb3VyY2UpXG57XG4gICAgWE1MTG9hZGVyLmV2ZW50T3V0cHV0LmVtaXQoJ2RvbmVMb2FkaW5nJywge3NvdXJjZTogc291cmNlLCB0eXBlOiBBU1NFVF9UWVBFfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gWE1MTG9hZGVyOyIsInZhciBLRVlfTUFQID0gcmVxdWlyZSgnLi9rZXltYXAuanMnKTtcbnZhciBLZXlIYW5kbGVyID0ge307XG5cbktleUhhbmRsZXIuaW5pdCA9IGZ1bmN0aW9uIGluaXQoKSB7XG5cdHRoaXMuX2FjdGl2ZUtleXMgPSB7fTtcblx0dGhpcy5faGFuZGxlcnMgPSB7fTtcblx0dGhpcy5fdXBkYXRlRm5zID0gW107XG5cdHRoaXMuX3ByZXNzID0ge307XG5cblx0dGhpcy5FVkVOVFRZUEVTID0ge1xuXHRcdCdQUkVTUycgOiB0aGlzLl9wcmVzc1xuXHR9XG5cblx0dGhpcy5ib3VuZEtleURvd24gPSByZWdpc3RlcktleURvd24uYmluZCh0aGlzKTtcblx0dGhpcy5ib3VuZEtleVVwID0gcmVnaXN0ZXJLZXlVcC5iaW5kKHRoaXMpO1xuXG5cdGRvY3VtZW50Lm9ua2V5ZG93biA9IHRoaXMuYm91bmRLZXlEb3duO1xuXHRkb2N1bWVudC5vbmtleXVwID0gdGhpcy5ib3VuZEtleVVwO1xufVxuXG5LZXlIYW5kbGVyLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcblx0dmFyIGhhbmRsZXJzO1xuXHR2YXIgaGFuZGxlcnNMZW5ndGg7XG5cdHZhciB1cGRhdGVzTGVuZ3RoID0gdGhpcy5fdXBkYXRlRm5zLmxlbmd0aDtcblx0dmFyIGk7XG5cdFxuXHRmb3IodmFyIGtleSBpbiB0aGlzLl9hY3RpdmVLZXlzKXtcblx0XHRpZih0aGlzLl9hY3RpdmVLZXlzW2tleV0gPT09IHRydWUpe1xuXHRcdFx0aGFuZGxlcnMgPSB0aGlzLl9oYW5kbGVyc1trZXldO1xuXHRcdFx0aWYoaGFuZGxlcnMpIHtcblx0XHRcdFx0aGFuZGxlcnNMZW5ndGggPSBoYW5kbGVycy5sZW5ndGg7XG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBoYW5kbGVyc0xlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0aGFuZGxlcnNbaV0oKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgdXBkYXRlc0xlbmd0aDsgaSsrKSB7XG5cdFx0dGhpcy5fdXBkYXRlRm5zW2ldKHRoaXMuX2FjdGl2ZUtleXMpO1xuXHR9XG59XG5cbktleUhhbmRsZXIub24gPSBmdW5jdGlvbiBvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG5cdGV2ZW50TmFtZSA9IGV2ZW50TmFtZS50b1VwcGVyQ2FzZSgpO1xuXHRpZiggZXZlbnROYW1lLmluZGV4T2YoJzonKSAhPT0gLTEgKSB7XG5cdFx0dmFyIGV2ZW50TmFtZSA9IGV2ZW50TmFtZS5zcGxpdCgnOicpO1xuXHRcdHZhciBrZXkgPSBldmVudE5hbWVbMF07XG5cdFx0dmFyIHR5cGUgPSBldmVudE5hbWVbMV07XG5cdFx0dmFyIHN0b3JhZ2UgPSB0aGlzLkVWRU5UVFlQRVNbZXZlbnROYW1lWzFdXTtcblx0XHRpZiggIXN0b3JhZ2UgKSB0aHJvdyBcImludmFsaWQgZXZlbnRUeXBlXCI7XG5cdFx0aWYoICFzdG9yYWdlW2tleV0gKSBzdG9yYWdlW2tleV0gPSBbXTtcblx0XHRzdG9yYWdlW2tleV0ucHVzaChjYWxsYmFjayk7XG5cdH1cblx0ZWxzZSBpZiggS0VZX01BUC5sZXR0ZXJzW2V2ZW50TmFtZV0gKSB7XG5cdFx0aWYoIXRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0pIHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0gPSBbXTtcblx0XHR0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xuXHR9XG5cdGVsc2UgaWYgKGV2ZW50TmFtZSA9PT0gXCJVUERBVEVcIikge1xuXHRcdHRoaXMuX3VwZGF0ZUZucy5wdXNoKGNhbGxiYWNrKTtcblx0fVxuXHRlbHNlIHRocm93IFwiaW52YWxpZCBldmVudE5hbWVcIjtcbn1cblxuS2V5SGFuZGxlci5vZmYgPSBmdW5jdGlvbiBvZmYoa2V5LCBjYWxsYmFjaykge1xuXHR2YXIgY2FsbGJhY2tJbmRleDtcblx0dmFyIGNhbGxiYWNrcztcblxuXHRpZih0aGlzLl9oYW5kbGVyc1trZXldKSB7XG5cdFx0Y2FsbGJhY2tzID0gdGhpcy5faGFuZGxlcnNba2V5XTtcblx0XHRjYWxsYmFja0luZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuXHRcdGlmKGNhbGxiYWNrSW5kZXggIT09IC0xKSB7XG5cdFx0XHRjYWxsYmFja3Muc3BsaWNlKGNhbGxiYWNrSW5kZXgsIDEpO1xuXHRcdFx0aWYoIWNhbGxiYWNrcy5sZW5ndGgpIHtcblx0XHRcdFx0ZGVsZXRlIGNhbGxiYWNrcztcblx0XHRcdFx0ZGVsZXRlIHRoaXMuX2FjdGl2ZUtleXNba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJLZXlEb3duKGV2ZW50KSB7XG5cdHZhciBrZXlOYW1lID0gS0VZX01BUC5rZXlzW2V2ZW50LmtleUNvZGVdO1xuXHR2YXIgcHJlc3NFdmVudHMgPSB0aGlzLl9wcmVzc1trZXlOYW1lXTtcblx0aWYgKGtleU5hbWUpIHRoaXMuX2FjdGl2ZUtleXNba2V5TmFtZV0gPSB0cnVlO1xuXHRpZiAocHJlc3NFdmVudHMpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHByZXNzRXZlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRwcmVzc0V2ZW50c1tpXSgpO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiByZWdpc3RlcktleVVwKGV2ZW50KSB7XG5cdHZhciBrZXlOYW1lID0gS0VZX01BUC5rZXlzW2V2ZW50LmtleUNvZGVdO1xuXHRpZiAoa2V5TmFtZSkgdGhpcy5fYWN0aXZlS2V5c1trZXlOYW1lXSA9IGZhbHNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEtleUhhbmRsZXI7IiwidmFyIE1vdXNlVHJhY2tlciA9IHt9O1xuXG5Nb3VzZVRyYWNrZXIuaW5pdCA9IGZ1bmN0aW9uIGluaXQoKSB7XG5cdHRoaXMuX21vdXNlUG9zaXRpb24gPSBbMCwgMF07XG5cdHRoaXMuX2hhbmRsZXJzID0gW107XG5cdHRoaXMuX3VwZGF0ZUZucyA9IFtdO1xuXHR0aGlzLl9jdXJyZW50VmVsb2NpdHkgPSBbMCwgMF07XG5cdHRoaXMuX2xhc3RQb3NpdGlvbiA9IFswLCAwXTtcblx0dGhpcy5fbGFzdFRpbWUgPSBEYXRlLm5vdygpO1xuXG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuaGFuZGxlTW91c2VNb3ZlLmJpbmQodGhpcykpO1xufVxuXG5Nb3VzZVRyYWNrZXIudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuXHRpZiAoIXRoaXMuX3VwZGF0ZWQpIHRoaXMuX2N1cnJlbnRWZWxvY2l0eSA9IFswLCAwXTtcblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3VwZGF0ZUZucy5sZW5ndGg7IGkrKykge1xuXHRcdHRoaXMuX3VwZGF0ZUZuc1tpXSggdGhpcy5fY3VycmVudFZlbG9jaXR5ICk7XG5cdH1cblxuXHR0aGlzLl91cGRhdGVkID0gZmFsc2U7XG59O1xuXG5Nb3VzZVRyYWNrZXIub24gPSBmdW5jdGlvbiBvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG5cdGV2ZW50TmFtZSA9IGV2ZW50TmFtZS50b1VwcGVyQ2FzZSgpO1xuXHRpZihldmVudE5hbWUgPT09ICdVUERBVEUnKSB0aGlzLl91cGRhdGVGbnMucHVzaChjYWxsYmFjayk7XG59XG5cbk1vdXNlVHJhY2tlci5nZXRNb3VzZVBvc2l0aW9uID0gZnVuY3Rpb24gZ2V0TW91c2VQb3NpdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuX21vdXNlUG9zaXRpb247XG59XG5cbk1vdXNlVHJhY2tlci5oYW5kbGVNb3VzZU1vdmUgPSBmdW5jdGlvbiBoYW5kbGVNb3VzZU1vdmUoZXZlbnQpIHtcblx0dmFyIGN1cnJlbnRUaW1lID0gRGF0ZS5ub3coKTtcblx0dmFyIGR1cmF0aW9uID0gY3VycmVudFRpbWUgLSB0aGlzLl9sYXN0VGltZTtcblxuXHR2YXIgY3VycmVudFBvc2l0aW9uID0gW1xuXHRcdChldmVudC54IC8gaW5uZXJXaWR0aCkgLSAwLjUsXG5cdFx0KGV2ZW50LnkgLyBpbm5lckhlaWdodCkgLSAwLjVcblx0XTtcblxuXHR0aGlzLl9jdXJyZW50VmVsb2NpdHkgPSBbXG5cdFx0KHRoaXMuX2xhc3RQb3NpdGlvblswXSAtIGN1cnJlbnRQb3NpdGlvblswXSkgLyAoMTAuMCAqIGR1cmF0aW9uKSxcblx0XHQodGhpcy5fbGFzdFBvc2l0aW9uWzFdIC0gY3VycmVudFBvc2l0aW9uWzFdKSAvICgxMC4wICogZHVyYXRpb24pXG5cdF07XG5cblx0dGhpcy5fbGFzdFBvc2l0aW9uID0gY3VycmVudFBvc2l0aW9uO1xuXHR0aGlzLl9sYXN0VGltZSA9IGN1cnJlbnRUaW1lO1xuXHR0aGlzLl91cGRhdGVkID0gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNb3VzZVRyYWNrZXI7IiwibW9kdWxlLmV4cG9ydHMgPSBcbntcbiAgJ2xldHRlcnMnIDoge1xuICAgICAnQSc6IDY1LFxuICAgICAnQic6IDY2LFxuICAgICAnQyc6IDY3LFxuICAgICAnRCc6IDY4LFxuICAgICAnRSc6IDY5LFxuICAgICAnRic6IDcwLFxuICAgICAnRyc6IDcxLFxuICAgICAnSCc6IDcyLFxuICAgICAnSSc6IDczLFxuICAgICAnSic6IDc0LFxuICAgICAnSyc6IDc1LFxuICAgICAnTCc6IDc2LFxuICAgICAnTSc6IDc3LFxuICAgICAnTic6IDc4LFxuICAgICAnTyc6IDc5LFxuICAgICAnUCc6IDgwLFxuICAgICAnUSc6IDgxLFxuICAgICAnUic6IDgyLFxuICAgICAnUyc6IDgzLFxuICAgICAnVCc6IDg0LFxuICAgICAnVSc6IDg1LFxuICAgICAnVic6IDg2LFxuICAgICAnVyc6IDg3LFxuICAgICAnWCc6IDg4LFxuICAgICAnWSc6IDg5LFxuICAgICAnWic6IDkwLFxuICAgICAnRU5URVInOiAxMyxcbiAgICAgJ1NISUZUJzogMTYsXG4gICAgICdFU0MnOiAyNyxcbiAgICAgJ1NQQUNFJzogMzIsXG4gICAgICdMRUZUJzogMzcsXG4gICAgICdVUCc6IDM4LFxuICAgICAnUklHSFQnOiAzOSxcbiAgICAgJ0RPV04nIDogNDBcbiAgfSxcbiAgJ2tleXMnIDoge1xuICAgICA2NSA6ICdBJyxcbiAgICAgNjYgOiAnQicsXG4gICAgIDY3IDogJ0MnLFxuICAgICA2OCA6ICdEJyxcbiAgICAgNjkgOiAnRScsXG4gICAgIDcwIDogJ0YnLFxuICAgICA3MSA6ICdHJyxcbiAgICAgNzIgOiAnSCcsXG4gICAgIDczIDogJ0knLFxuICAgICA3NCA6ICdKJyxcbiAgICAgNzUgOiAnSycsXG4gICAgIDc2IDogJ0wnLFxuICAgICA3NyA6ICdNJyxcbiAgICAgNzggOiAnTicsXG4gICAgIDc5IDogJ08nLFxuICAgICA4MCA6ICdQJyxcbiAgICAgODEgOiAnUScsXG4gICAgIDgyIDogJ1InLFxuICAgICA4MyA6ICdTJyxcbiAgICAgODQgOiAnVCcsXG4gICAgIDg1IDogJ1UnLFxuICAgICA4NiA6ICdWJyxcbiAgICAgODcgOiAnVycsXG4gICAgIDg4IDogJ1gnLFxuICAgICA4OSA6ICdZJyxcbiAgICAgOTAgOiAnWicsXG4gICAgIDEzIDogJ0VOVEVSJyxcbiAgICAgMTYgOiAnU0hJRlQnLFxuICAgICAyNyA6ICdFU0MnLFxuICAgICAzMiA6ICdTUEFDRScsXG4gICAgIDM3IDogJ0xFRlQnLFxuICAgICAzOCA6ICdVUCcsXG4gICAgIDM5IDogJ1JJR0hUJyxcbiAgICAgNDAgOiAnRE9XTidcbiAgfVxufSIsInZhciBDT01QTEVURSA9IFwiY29tcGxldGVcIjtcbnZhciBMT0FEX1NUQVJURUQgPSBcInN0YXJ0TG9hZGluZ1wiO1xudmFyIExPQURfQ09NUExFVEVEID0gXCJkb25lTG9hZGluZ1wiO1xudmFyIE5PTkUgPSAnbm9uZSc7XG52YXIgVklTSUJMRSA9ICdpbmxpbmUnO1xuXG52YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgTG9hZGluZyAgICAgICAgICA9IHt9O1xudmFyIGJvZHlSZWFkeSAgICAgICAgPSBmYWxzZTtcbnZhciBhc3NldFN0YWNrICAgICAgID0gW107XG52YXIgbG9hZGVyUmVnaXN0cnkgICA9IHt9O1xudmFyIGNvbnRhaW5lciAgICAgICAgPSBudWxsO1xudmFyIHNwbGFzaFNjcmVlbiAgICAgPSBuZXcgSW1hZ2UoKTtcbnNwbGFzaFNjcmVlbi5zcmMgICAgID0gJy4uLy4uL0Fzc2V0cy9Mb2FkaW5nLi4uLnBuZyc7XG5zcGxhc2hTY3JlZW4ud2lkdGggICA9IHNwbGFzaFdpZHRoID0gNTAwO1xuc3BsYXNoU2NyZWVuLmhlaWdodCAgPSBzcGxhc2hIZWlnaHQgPSAxNjA7XG5Mb2FkaW5nLmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbkxvYWRpbmcuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKExvYWRpbmcsIExvYWRpbmcuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihMb2FkaW5nLCBMb2FkaW5nLmV2ZW50T3V0cHV0KTtcblxuTG9hZGluZy5ldmVudElucHV0Lm9uKExPQURfQ09NUExFVEVELCBoYW5kbGVDb21wbGV0ZWRMb2FkKTtcbkxvYWRpbmcuZXZlbnRJbnB1dC5vbigncmVzaXplJywgaGFuZGxlUmVzaXplKTtcblxuTG9hZGluZy5pbml0aWFsaXplID0gZnVuY3Rpb24gaW5pdGlhbGl6ZSgpXG57XG4gICAgaWYgKCFjb250YWluZXIpXG4gICAge1xuICAgICAgICBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9hZGluZycpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoc3BsYXNoU2NyZWVuKTtcbiAgICAgICAgc3BsYXNoU2NyZWVuLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgc3BsYXNoU2NyZWVuLnN0eWxlLnRvcCA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjUpIC0gKHNwbGFzaEhlaWdodCAqIDAuNSkgKyAncHgnO1xuICAgICAgICBzcGxhc2hTY3JlZW4uc3R5bGUubGVmdCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuNSkgLSAoc3BsYXNoV2lkdGgqIDAuNSkgKyAncHgnO1xuICAgIH1cbiAgICBpZiAoYXNzZXRTdGFjay5sZW5ndGgpXG4gICAge1xuICAgICAgICB0aGlzLmV2ZW50T3V0cHV0LmVtaXQoTE9BRF9TVEFSVEVEKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhc3NldFN0YWNrLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgYXNzZXQgID0gYXNzZXRTdGFja1tpXTtcbiAgICAgICAgICAgIHZhciBsb2FkZXIgPSBhc3NldC50eXBlO1xuICAgICAgICAgICAgbG9hZGVyUmVnaXN0cnlbbG9hZGVyXS5sb2FkKGFzc2V0KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkxvYWRpbmcubG9hZCAgICAgICA9IGZ1bmN0aW9uIGxvYWQoYXNzZXQpXG57XG4gICAgYXNzZXRTdGFjay5wdXNoKGFzc2V0KTtcbn07XG5cbkxvYWRpbmcuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gVklTSUJMRTtcbn07XG5cbkxvYWRpbmcuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gTk9ORTtcbn07XG5cbkxvYWRpbmcucmVnaXN0ZXIgICA9IGZ1bmN0aW9uIHJlZ2lzdGVyKGxvYWRlcilcbntcbiAgICB2YXIgbG9hZGVyTmFtZSAgICAgICAgICAgICA9IGxvYWRlci50b1N0cmluZygpO1xuICAgIGxvYWRlclJlZ2lzdHJ5W2xvYWRlck5hbWVdID0gbG9hZGVyO1xuICAgIGxvYWRlci5waXBlKHRoaXMuZXZlbnRJbnB1dCk7XG59O1xuXG5mdW5jdGlvbiBoYW5kbGVDb21wbGV0ZWRMb2FkKGRhdGEpXG57XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpXG4gICAge1xuICAgICAgICB2YXIgc291cmNlID0gZGF0YS5zb3VyY2U7XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IGFzc2V0U3RhY2suaW5kZXhPZihzb3VyY2UpO1xuICAgICAgICBpZiAobG9jYXRpb24pIGFzc2V0U3RhY2suc3BsaWNlKGxvY2F0aW9uLCAxKTtcbiAgICAgICAgaWYgKCFhc3NldFN0YWNrLmxlbmd0aCkgTG9hZGluZy5ldmVudE91dHB1dC5lbWl0KExPQURfQ09NUExFVEVEKTtcbiAgICB9LCAxMDAwKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlUmVzaXplKClcbntcbiAgICBzcGxhc2hTY3JlZW4uc3R5bGUudG9wID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoc3BsYXNoSGVpZ2h0ICogMC41KSArICdweCc7XG4gICAgc3BsYXNoU2NyZWVuLnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKHNwbGFzaFdpZHRoKiAwLjUpICsgJ3B4Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkaW5nOyIsInZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIE1lbnUgICAgICAgICAgPSB7fTtcblxuTWVudS5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5NZW51LmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihNZW51LCBNZW51LmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoTWVudSwgTWVudS5ldmVudE91dHB1dCk7XG5cbk1lbnUuZXZlbnRJbnB1dC5vbigncmVzaXplJywgaGFuZGxlUmVzaXplKTtcblxudmFyIG1lbnVFbGVtZW50ID0gbnVsbCxcbmNvbnRhaW5lciAgICAgICA9IG51bGwsXG5uZXdHYW1lICAgICAgICAgPSBudWxsO1xuXG5NZW51LmluaXRpYWxpemUgPSBmdW5jdGlvbiBpbml0aWFsaXplKClcbntcbiAgICBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudScpO1xuICAgIG1lbnVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbWVudUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIG5ld0dhbWUgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbmV3R2FtZS5vbmNsaWNrID0gc3RhcnROZXdHYW1lO1xuICAgIG5ld0dhbWUuaW5uZXJIVE1MID0gJ05ldyBHYW1lJztcbiAgICBuZXdHYW1lLnN0eWxlLmZvbnRTaXplID0gJzUwcHgnO1xuICAgIG5ld0dhbWUuc3R5bGUuZm9udEZhbWlseSA9ICdIZWx2ZXRpY2EnO1xuICAgIG5ld0dhbWUuc3R5bGUuY29sb3IgPSAnI0ZGRic7XG4gICAgbWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQobmV3R2FtZSk7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG1lbnVFbGVtZW50KTtcbiAgICBtZW51RWxlbWVudC5zdHlsZS50b3AgID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoNTggKiAwLjUpICsgJ3B4JztcbiAgICBtZW51RWxlbWVudC5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtICgyNTEgKiAwLjUpICsgJ3B4Jztcbn07XG5cbk1lbnUuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gVklTSUJMRTtcbn07XG5cbk1lbnUuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gTk9ORTtcbn07XG5cbmZ1bmN0aW9uIGhhbmRsZVJlc2l6ZSgpXG57XG4gICAgbWVudUVsZW1lbnQuc3R5bGUudG9wID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoNTggKiAwLjUpICsgJ3B4JztcbiAgICBtZW51RWxlbWVudC5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtICgyNTEgKiAwLjUpICsgJ3B4Jztcbn1cblxuZnVuY3Rpb24gc3RhcnROZXdHYW1lKClcbntcbiAgICBNZW51LmV2ZW50T3V0cHV0LmVtaXQoJ25ld0dhbWUnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51OyIsInZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcbnZhciBLZXlIYW5kbGVyICAgICAgICAgPSByZXF1aXJlKCcuLi9JbnB1dHMvS2V5SGFuZGxlcicpO1xudmFyIE1vdXNlVHJhY2tlciAgICAgICA9IHJlcXVpcmUoJy4uL0lucHV0cy9Nb3VzZVRyYWNrZXInKTtcbnZhciBSZW5kZXJlciAgICAgICAgICAgPSByZXF1aXJlKCcuLi9HTC9SZW5kZXJlcicpO1xudmFyIEltYWdlTG9hZGVyICAgICAgICA9IHJlcXVpcmUoJy4uL0dhbWUvSW1hZ2VMb2FkZXInKTtcblxudmFyIFBsYXlpbmcgICAgICAgICAgICA9IHt9O1xuXG5QbGF5aW5nLmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblBsYXlpbmcuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKFBsYXlpbmcsIFBsYXlpbmcuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihQbGF5aW5nLCBQbGF5aW5nLmV2ZW50T3V0cHV0KTtcblxuUGxheWluZy5pbml0aWFsaXplID0gZnVuY3Rpb24gaW5pdGlhbGl6ZSgpXG57XG5cdEtleUhhbmRsZXIuaW5pdCgpO1xuXHRNb3VzZVRyYWNrZXIuaW5pdCgpO1xuXHR0aGlzLnJlbmRlcmVyID0gbmV3IFJlbmRlcmVyKHtcblx0XHR0ZXh0dXJlczogW1xuXHRcdFx0Jy4uL0Fzc2V0cy9tZXRhbDIucG5nJyxcblx0XHRcdCcuLi9Bc3NldHMvaGFuZHNTcHJpdGVzaGVldC5wbmcnXG5cdFx0XVxuXHR9KTtcbn07XG5cblBsYXlpbmcudXBkYXRlICAgICA9IGZ1bmN0aW9uIHVwZGF0ZSgpXG57XG5cdEtleUhhbmRsZXIudXBkYXRlKCk7XG5cdE1vdXNlVHJhY2tlci51cGRhdGUoKTtcblx0dGhpcy5yZW5kZXJlci51cGRhdGUoKTtcbn07XG5cblBsYXlpbmcuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xufTtcblxuUGxheWluZy5oaWRlICAgICAgID0gZnVuY3Rpb24gaGlkZSgpXG57XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXlpbmc7IiwidmFyIGN1cnJlbnRUaW1lO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0X2V2ZW50czogW10sXG5cblx0dXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoKXtcblx0XHRjdXJyZW50VGltZSA9IERhdGUubm93KCk7XG5cdFx0aWYoIXRoaXMuX2luaXRpYWxUaW1lKSB0aGlzLl9pbml0aWFsVGltZSA9IGN1cnJlbnRUaW1lO1xuXHRcdHRoaXMuX2VsYXBzZWQgPSBjdXJyZW50VGltZSAtIHRoaXMuX2luaXRpYWxUaW1lO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9ldmVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmKHRoaXMuX2VsYXBzZWQgPiB0aGlzLl9ldmVudHNbaV0udHJpZ2dlcikge1xuXHRcdFx0XHR0aGlzLl9ldmVudHNbaV0uY2FsbGJhY2soKTtcblx0XHRcdFx0dGhpcy5fZXZlbnRzLnNwbGljZShpLCAxKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Z2V0RWxhcHNlZDogZnVuY3Rpb24gZ2V0RWxhcHNlZCgpIHtcblx0XHRyZXR1cm4gdGhpcy5fZWxhcHNlZDtcblx0fSxcblxuXHRhZnRlcjogZnVuY3Rpb24gYWZ0ZXIoY2FsbGJhY2ssIHRpbWVvdXQpIHtcblx0XHR0aGlzLl9ldmVudHMucHVzaCh7XG5cdFx0XHRjYWxsYmFjazogY2FsbGJhY2ssXG5cdFx0XHR0cmlnZ2VyOiB0aGlzLl9lbGFwc2VkICsgdGltZW91dFxuXHRcdH0pO1xuXHR9XG59OyIsInZhciBFbmdpbmUgID0gcmVxdWlyZSgnLi9HYW1lL0VuZ2luZScpO1xudmFyIExvYWRpbmcgPSByZXF1aXJlKCcuL1N0YXRlcy9Mb2FkaW5nJyk7XG52YXIgTWVudSAgICA9IHJlcXVpcmUoJy4vU3RhdGVzL01lbnUnKTtcbnZhciBQbGF5aW5nID0gcmVxdWlyZSgnLi9TdGF0ZXMvUGxheWluZycpO1xudmFyIEV2ZW50SGFuZGxlciA9IHJlcXVpcmUoJy4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xudmFyIEltYWdlTG9hZGVyICA9IHJlcXVpcmUoJy4vR2FtZS9JbWFnZUxvYWRlcicpO1xudmFyIFhNTExvYWRlciAgICA9IHJlcXVpcmUoJy4vR2FtZS9YTUxMb2FkZXInKTtcbnZhciBWaWV3cG9ydCAgICAgPSByZXF1aXJlKCcuL0dhbWUvVmlld3BvcnQnKTtcblxudmFyIENvbnRyb2xsZXIgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cblZpZXdwb3J0LnBpcGUoTWVudSk7XG5WaWV3cG9ydC5waXBlKExvYWRpbmcpO1xuVmlld3BvcnQucGlwZShQbGF5aW5nKTtcblxuRW5naW5lLnBpcGUoQ29udHJvbGxlcik7XG5NZW51LnBpcGUoQ29udHJvbGxlcik7XG5Mb2FkaW5nLnBpcGUoQ29udHJvbGxlcik7XG5cbkNvbnRyb2xsZXIub24oJ2RvbmVMb2FkaW5nJywgZ29Ub01lbnUpO1xuQ29udHJvbGxlci5vbignbmV3R2FtZScsIHN0YXJ0R2FtZSk7XG5cbnZhciBzcHJpdGVzaGVldCA9IHtcblx0dHlwZTogJ2ltYWdlJyxcblx0c291cmNlOiAnLi4vQXNzZXRzL2NyYXRlLmdpZicsXG5cdGRhdGE6IHt9XG59O1xuXG52YXIgc3ByaXRlc2hlZXQgPSB7XG5cdHR5cGU6ICdpbWFnZScsXG5cdHNvdXJjZTogJy4uL0Fzc2V0cy9tZXRhbDIucG5nJyxcblx0ZGF0YToge31cbn07XG5cbnZhciBoYW5kSW1hZ2UgPSB7XG5cdHR5cGU6ICdpbWFnZScsXG5cdHNvdXJjZTogJy4uL0Fzc2V0cy9oYW5kc1Nwcml0ZXNoZWV0LnBuZycsXG5cdGRhdGE6IHt9XG59XG5cbnZhciB2ZXJ0ZXhTaGFkZXIgPSB7XG5cdHR5cGU6ICd4bWwnLFxuXHRzb3VyY2U6ICcvU2hhZGVycy9WZXJ0ZXhTaGFkZXIuZ2xzbCcsXG5cdGRhdGE6IHt9XG59O1xuXG52YXIgZnJhZ21lbnRTaGFkZXIgPSB7XG5cdHR5cGU6ICd4bWwnLFxuXHRzb3VyY2U6ICcvU2hhZGVycy9GcmFnbWVudFNoYWRlci5nbHNsJyxcblx0ZGF0YToge31cbn07XG5cbnZhciB3b3JsZERhdGEgPSB7XG5cdHR5cGU6ICd4bWwnLFxuXHRzb3VyY2U6ICcvR2FtZURhdGEvd29ybGQuanNvbicsXG5cdGRhdGE6IHt9XG59XG5cbkxvYWRpbmcucmVnaXN0ZXIoSW1hZ2VMb2FkZXIpO1xuTG9hZGluZy5yZWdpc3RlcihYTUxMb2FkZXIpO1xuXG5Mb2FkaW5nLmxvYWQoc3ByaXRlc2hlZXQpO1xuTG9hZGluZy5sb2FkKGhhbmRJbWFnZSk7XG5Mb2FkaW5nLmxvYWQodmVydGV4U2hhZGVyKTtcbkxvYWRpbmcubG9hZChmcmFnbWVudFNoYWRlcik7XG5Mb2FkaW5nLmxvYWQod29ybGREYXRhKTtcblxuRW5naW5lLnNldFN0YXRlKExvYWRpbmcpO1xuXG5mdW5jdGlvbiBnb1RvTWVudSgpXG57XG4gICAgRW5naW5lLnNldFN0YXRlKE1lbnUpO1xufVxuXG5mdW5jdGlvbiBzdGFydEdhbWUoKVxue1xuXHRFbmdpbmUuc2V0U3RhdGUoUGxheWluZyk7XG59XG5cbmZ1bmN0aW9uIGxvb3AoKVxue1xuICAgIEVuZ2luZS5zdGVwKCk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xufVxuXG5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7Il19
