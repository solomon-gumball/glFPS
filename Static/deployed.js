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
},{"./EventEmitter":"/Users/joseph/code/FPS/Source/Events/EventEmitter.js"}],"/Users/joseph/code/FPS/Source/GL/Alien.js":[function(require,module,exports){
var Timer = require('../Utilities/Timer');
var Matrix = require('../Utilities/Matrix');

function Alien (options) {
	this.position = options.position;
	this.context = options.context;
	this.matrix = mat4.create();
	this.pMatrix = options.pMatrix;
	this.mvMatrix = options.mvMatrix;
	this.player = options.player;
	this.texture = options.texture;
	this.shaderProgram = options.shaderProgram;
	this.matrix = mat4.create();
	mat4.identity(this.matrix);

	this.spriteCoordinates = resetCoordinates.call(this);
	this.drawState = 0;

	initBuffers.call(this);

	Timer.every(this.incrementState.bind(this), 500);
}

var STATES = [
	{
		offset: [0.56, 0.777],
		size: [0.16, 0.25]
	},
	{
		offset: [0.720, 0.78],
		size: [0.16, 0.25]
	}
];

Alien.prototype.update = function update() {
	this.differential = [
		this.player.position[0] - this.position[0],
		this.player.position[2] - this.position[2]
	];
	this.rotation = Math.acos(this.differential[0] / this.differential[1]);
	var dist = 0.005;
	var ratio = this.differential[0] / this.differential[1];
	var dist = dist / (ratio + 1);
	distX = dist * ratio;
	distY = dist;
	this.position[0] += 0.005;
	// this.position[2] += distY;
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

Alien.prototype.incrementState = function incrementState() {
	if(this.drawState + 1 > STATES.length - 1) this.drawState = 0;
	else this.drawState++;

	this.setDrawState(this.drawState);
}

Alien.prototype.setDrawState = function setDrawState(frameIndex) {
	var sprite        = STATES[frameIndex];
    var textureStartX = sprite.offset[0] - (sprite.size[0] * 0.5);
    var textureStartY = sprite.offset[1] - (sprite.size[1] * 0.5);
    var textureEndX   = sprite.offset[0] + (sprite.size[0] * 0.5);
    var textureEndY   = sprite.offset[1] + (sprite.size[1] * 0.5);

    this.textureCoordinates = [
          textureEndX,   textureEndY,
        textureStartX,   textureEndY,
          textureEndX, textureStartY,
        textureStartX, textureStartY,
    ];

    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.textureBuffer);
    this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(this.textureCoordinates), this.context.STATIC_DRAW);
}

Alien.prototype.draw = function draw(mvMatrix) {
	mat4.set(mvMatrix, this.matrix);
    mat4.translate(this.matrix, [this.position[0], this.position[1], this.position[2]]);
    mat4.rotate(this.matrix, this.rotation, [0, 1, 0]);

    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.textureBuffer);
    this.context.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.textureBuffer.itemSize, this.context.FLOAT, false, 0, 0);

    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.positionBuffer);
    this.context.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.positionBuffer.itemSize, this.context.FLOAT, false, 0, 0);

    this.setMatrixUniforms();
    this.context.drawArrays(this.context.TRIANGLE_STRIP, 0, this.positionBuffer.numItems);
}

Alien.prototype.setMatrixUniforms = function setMatrixUniforms () {
    // this.context.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
    this.context.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.matrix);
}

function initBuffers() {
	this.textureBuffer = this.context.createBuffer();
	this.setDrawState(this.drawState);
	this.textureBuffer.itemSize = 2;
    this.textureBuffer.numItems = 4;

    this.positionBuffer = this.context.createBuffer();
    this.context.bindBuffer(this.context.ARRAY_BUFFER, this.positionBuffer);
    this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(this.spriteCoordinates), this.context.STATIC_DRAW);
    this.positionBuffer.itemSize = 3;
    this.positionBuffer.numItems = 4;
}

function resetCoordinates() {
	var width      = 0.60;
	var height     = 0.8;
	var currentZ   = this.position[2];
	var halfWidth  = width * 0.5;
	// var minX       = this.position[0] - halfWidth;
	// var maxX       = this.position[0] + halfWidth;
	// var minY       = this.position[1];
	// var maxY       = this.position[1] + height;
	var minX       = - halfWidth;
	var maxX       = halfWidth;
	var minY       = 0;
	var maxY       = height;

	return [
		minX, maxY, currentZ,
		maxX, maxY, currentZ,
		minX, minY, currentZ,
		maxX, minY, currentZ
	];
}

module.exports = Alien;
},{"../Utilities/Matrix":"/Users/joseph/code/FPS/Source/Utilities/Matrix.js","../Utilities/Timer":"/Users/joseph/code/FPS/Source/Utilities/Timer.js"}],"/Users/joseph/code/FPS/Source/GL/Player.js":[function(require,module,exports){
function Player(options) {
	this.position = options.position;
	this.rotation = 0;
	this.rotationRate = 0;
	this.zSpeed = 0;
	this.xSpeed = 0;
}

module.exports = Player;
},{}],"/Users/joseph/code/FPS/Source/GL/Renderer.js":[function(require,module,exports){
var ImageLoader  = require('../Game/ImageLoader');
var XMLLoader    = require('../Game/XMLLoader');
var KeyHandler   = require('../Inputs/KeyHandler');
var MouseTracker = require('../Inputs/MouseTracker');
var Timer        = require('../Utilities/Timer');
var Player       = require('./Player');
var Alien        = require('./Alien');

function Renderer (options) {
	this.canvas = document.getElementById('renderer');
    this.gl = this.canvas.getContext("webgl");
    this.gl.viewportWidth = this.canvas.width;
    this.gl.viewportHeight = this.canvas.height;

    this.lastFrame = 0;
    this.joggingAngle = 0;

    this.enemies = [];

    initMatrices.call(this);

    this.initShaders();
    this.initTextures(options.textures);
    this.handleLoadedWorld();
    this.initPlayer();

    MouseTracker.on('UPDATE', this.handleMouse.bind(this));
    KeyHandler.on('UPDATE', this.handleKeys.bind(this));
    KeyHandler.on('SPACE:PRESS', function(){
        console.log(this.player.position);
    }.bind(this));

    window.onclick = this.handleShoot.bind(this);

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    // this.gl.enable(this.gl.DEPTH_TEST);
}

Renderer.prototype.update = function update () {
	this.animate();
    this.drawScene();
    if(Math.random() > 0.99 && this.enemies.length < 10) this.generateEnemy();
}

Renderer.prototype.animate = function animate() {
    var thisFrame = Timer.getElapsed();
    var newX;
    var newZ;
    if (this.lastFrame !== 0) {
        var playerPosition = this.player.position;
        var elapsed = thisFrame - this.lastFrame;
        if(this.player.zSpeed !== 0 || this.player.xSpeed !== 0) {

            newX = playerPosition[0] - Math.sin(degToRad(this.player.rotation)) * this.player.zSpeed * elapsed;
            newZ = playerPosition[2] - Math.cos(degToRad(this.player.rotation)) * this.player.zSpeed * elapsed;

            newX = newX - Math.sin(degToRad(this.player.rotation - 90)) * this.player.xSpeed * elapsed;
            newZ = newZ - Math.cos(degToRad(this.player.rotation - 90)) * this.player.xSpeed * elapsed;

            this.joggingAngle += elapsed * 0.6;
            playerPosition[1] = Math.sin(degToRad(this.joggingAngle)) / 20 + 0.4;

            if(this.isInBounds(newX, newZ)) {
                playerPosition[0] = newX;
                playerPosition[2] = newZ;
            }
        }

        this.player.rotation += this.player.rotationRate * elapsed;
        // pitch += pitchRate * elapsed;
    }
    this.updateEnemies();
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

// var pitch = 0;
// var pitchRate = 0;
Renderer.prototype.handleKeys = function handleKeys (keyPressed) {
    if      ( keyPressed['LEFT'] || keyPressed['A'] )  this.player.xSpeed = -0.003;
    else if ( keyPressed['RIGHT'] || keyPressed['D'] ) this.player.xSpeed = 0.003;
    else                                               this.player.xSpeed = 0;

    if      ( keyPressed['UP'] || keyPressed['W'] )   this.player.zSpeed = 0.003;
    else if ( keyPressed['DOWN'] || keyPressed['S'] ) this.player.zSpeed = -0.003;
    else                                              this.player.zSpeed = 0;
}

Renderer.prototype.handleMouse = function handleMouse (velocity) {
    this.player.rotationRate = velocity[0] * 3000.0;
}

Renderer.prototype.handleShoot = function handleShoot () {
    setHandSprite.call(this, 1);
    Timer.after(setHandSprite.bind(this, 0), 50);
}

var enemyStartPositions = [
    [0.002894359141860439, 0.0, 3.69167231590234],
    [3.263023868924414, 0.0, -0.05809362601548433],
    [0.06240809255478197, 0.0, -3.6756300214165236],
    [-3.8392868289650153, 0.0, 0.06440220118756014]
]
Renderer.prototype.initPlayer = function initPlayer () {
    this.player = new Player({
        position: [0, 0, 0.0]
    });
}

Renderer.prototype.generateEnemy = function generateEnemy () {
    var randomStartPos = enemyStartPositions[Math.floor(Math.random() * enemyStartPositions.length)];

    this.enemies.push(new Alien({
        position: randomStartPos,
        context: this.gl,
        texture: this.textures[2],
        shaderProgram: shaderProgram,
        player: this.player,
        pMatrix: this.pMatrix,
        mvMatrix: this.mvMatrix
    }));
}

Renderer.prototype.updateEnemies = function updateEnemies () {
    for(var i = 0; i < this.enemies.length; i++) {
        this.enemies[i].update();
    }
}

// var pitch = 0;
Renderer.prototype.drawScene = function drawScene() {
    var playerPosition = this.player.position;

    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    if(worldVertexTextureCoordBuffer == null || worldVertexPositionBuffer == null) return;

    /* INITIALIZE MV MATRIX */
    mat4.perspective(45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0, this.pMatrix);
    mat4.identity(this.mvMatrix);

    /* MOVE CAMERA */
    // mat4.rotate(this.mvMatrix, degToRad(-pitch), [1, 0, 0]);
    mat4.rotate(this.mvMatrix, degToRad(-this.player.rotation),   [0, 1, 0]);
    mat4.translate(this.mvMatrix, [-playerPosition[0], -playerPosition[1], -playerPosition[2]]);

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
    
    /* DRAW ENEMIES */
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[2]);
    this.gl.uniform1i(shaderProgram.samplerUniform, 0);
    for(var i = 0; i < this.enemies.length; i++) {
        this.enemies[i].draw(this.mvMatrix);
    }

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


    for (var index in walls) {
        wall = walls[index];
        wallVertices = wall.vertices;
        for (var i = 0; i < wallVertices.length; i++) {
            vertex = wallVertices[i];
            vertexPosition = vertex.position;
            vertexCoord = vertex.texture;
            vertexPosition[2] -= 5.0;
            vertexPositions.push(vertexPosition[0], vertexPosition[1], vertexPosition[2]);
            vertexTextureCoords.push(vertexCoord[0], vertexCoord[1]);
            vertexCount++;
        }
        if(wall.boundary) this.registerBoundary(wall.vertices);
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

var quadOrigin = [0.0, -0.022, -0.1];
var states = [
    { offset: [0.1, 0.77], size: [0.135, 0.20], drawSize:  [0.08, 0.08] },
    { offset: [0.358, 0.745], size: [0.12, 0.260], drawSize:  [0.08, 0.110] },
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
        positionStartX,   positionEndY, quadOrigin[2],
          positionEndX,   positionEndY, quadOrigin[2],
        positionStartX, positionStartY, quadOrigin[2],
          positionEndX, positionStartY, quadOrigin[2]
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
        // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_NEAREST);
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
        // this will not work for diagonal walls...
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
},{"../Game/ImageLoader":"/Users/joseph/code/FPS/Source/Game/ImageLoader.js","../Game/XMLLoader":"/Users/joseph/code/FPS/Source/Game/XMLLoader.js","../Inputs/KeyHandler":"/Users/joseph/code/FPS/Source/Inputs/KeyHandler.js","../Inputs/MouseTracker":"/Users/joseph/code/FPS/Source/Inputs/MouseTracker.js","../Utilities/Timer":"/Users/joseph/code/FPS/Source/Utilities/Timer.js","./Alien":"/Users/joseph/code/FPS/Source/GL/Alien.js","./Player":"/Users/joseph/code/FPS/Source/GL/Player.js"}],"/Users/joseph/code/FPS/Source/Game/Engine.js":[function(require,module,exports){
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
    if(Array.isArray(asset))
    {
        Array.prototype.push.apply(assetStack, asset);
    }
    else
    {
        assetStack.push(asset);
    }
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
    var source = data.source;
    var location = assetStack.indexOf(source);
    if (location) assetStack.splice(location, 1);
    if (!assetStack.length) Loading.eventOutput.emit(LOAD_COMPLETED);
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
			'../Assets/handsSpritesheet.png',
			'../Assets/alienSprite.png'
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
},{"../Events/EventHandler":"/Users/joseph/code/FPS/Source/Events/EventHandler.js","../GL/Renderer":"/Users/joseph/code/FPS/Source/GL/Renderer.js","../Game/ImageLoader":"/Users/joseph/code/FPS/Source/Game/ImageLoader.js","../Inputs/KeyHandler":"/Users/joseph/code/FPS/Source/Inputs/KeyHandler.js","../Inputs/MouseTracker":"/Users/joseph/code/FPS/Source/Inputs/MouseTracker.js"}],"/Users/joseph/code/FPS/Source/Utilities/Matrix.js":[function(require,module,exports){
module.exports = {
    _stacks: {},

    registerStack: function registerStack(stackName) {
        if (this._stacks[stackName]) throw 'Stack ' + stackName + ' already exists!';
        else this._stacks[stackName] = [];
    },

    pushMatrix: function pushMatrix(matrix, stackName) {
        var copy = mat4.create();
        mat4.set(matrix, copy);
        this._stacks[stackName].push(copy);
    },

    popMatrix: function popMatrix(stackName) {
        if (this._stacks[stackName].length === 0) throw "Invalid popMatrix!";
        mvMatrix = this._stacks[stackName].pop();
    }
}
},{}],"/Users/joseph/code/FPS/Source/Utilities/Timer.js":[function(require,module,exports){
module.exports = {
	_once: [],
	_every: [],

	update: function update(){
		var currentTime = Date.now();
		var timerEvent;
		if(!this._initialTime) this._initialTime = currentTime;
		this._elapsed = currentTime - this._initialTime;

		for (var i = 0; i < this._once.length; i++) {
			if(this._elapsed > this._once[i].trigger) {
				timerEvent = this._once[i];
				timerEvent.callback();
				this._once.splice(i, 1);
			}
		}

		for (var i = 0; i < this._every.length; i++) {
			if(this._elapsed > this._every[i].trigger) {
				timerEvent = this._every[i];
				timerEvent.callback();
				timerEvent.trigger = this._elapsed + timerEvent.timeout
			}
		}
	},

	getElapsed: function getElapsed() {
		return this._elapsed;
	},

	after: function after(callback, timeout) {
		this._once.push({
			callback: callback,
			trigger: this._elapsed + timeout
		});
	},

	every: function every(callback, timeout) {
		this._every.push({
			callback: callback,
			trigger: this._elapsed + timeout,
			timeout: timeout
		})
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

var assets = [
	{
		type: 'image',
		source: '../Assets/metal2.png',
		data: {}
	},{
		type: 'image',
		source: '../Assets/handsSpritesheet.png',
		data: {}
	},{
		type: 'xml',
		source: '/Shaders/VertexShader.glsl',
		data: {}
	},{
		type: 'xml',
		source: '/Shaders/FragmentShader.glsl',
		data: {}
	},{
		type: 'xml',
		source: '/GameData/world.json',
		data: {}
	},{
		type: 'image',
		source: '../Assets/alienSprite.png',
		data: {}
	}
]

Loading.register(ImageLoader);
Loading.register(XMLLoader);

Loading.load(assets);

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvRXZlbnRzL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0V2ZW50cy9FdmVudEhhbmRsZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9HTC9BbGllbi5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0dML1BsYXllci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0dML1JlbmRlcmVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvR2FtZS9FbmdpbmUuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9HYW1lL0ltYWdlTG9hZGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvR2FtZS9WaWV3cG9ydC5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL0dhbWUvWE1MTG9hZGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvSW5wdXRzL0tleUhhbmRsZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9JbnB1dHMvTW91c2VUcmFja2VyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvSW5wdXRzL2tleW1hcC5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL1N0YXRlcy9Mb2FkaW5nLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL0ZQUy9Tb3VyY2UvU3RhdGVzL01lbnUuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9TdGF0ZXMvUGxheWluZy5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9GUFMvU291cmNlL1V0aWxpdGllcy9NYXRyaXguanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9VdGlsaXRpZXMvVGltZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvRlBTL1NvdXJjZS9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG4vKipcbiAqIEV2ZW50RW1pdHRlciByZXByZXNlbnRzIGEgY2hhbm5lbCBmb3IgZXZlbnRzLlxuICpcbiAqIEBjbGFzcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSB7fTtcbiAgICB0aGlzLl9vd25lciA9IHRoaXM7XG59XG5cbi8qKlxuICogVHJpZ2dlciBhbiBldmVudCwgc2VuZGluZyB0byBhbGwgZG93bnN0cmVhbSBoYW5kbGVyc1xuICogICBsaXN0ZW5pbmcgZm9yIHByb3ZpZGVkICd0eXBlJyBrZXkuXG4gKlxuICogQG1ldGhvZCBlbWl0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IGV2ZW50IGRhdGFcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUsIGV2ZW50KSB7XG4gICAgdmFyIGhhbmRsZXJzID0gdGhpcy5saXN0ZW5lcnNbdHlwZV07XG4gICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2ldLmNhbGwodGhpcy5fb3duZXIsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIFwib25cIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBoYW5kbGVyIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgICBpZiAoISh0eXBlIGluIHRoaXMubGlzdGVuZXJzKSkgdGhpcy5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5pbmRleE9mKGhhbmRsZXIpO1xuICAgIGlmIChpbmRleCA8IDApIHRoaXMubGlzdGVuZXJzW3R5cGVdLnB1c2goaGFuZGxlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBcIm9uXCIuXG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vKipcbiAqIFVuYmluZCBhbiBldmVudCBieSB0eXBlIGFuZCBoYW5kbGVyLlxuICogICBUaGlzIHVuZG9lcyB0aGUgd29yayBvZiBcIm9uXCIuXG4gKlxuICogQG1ldGhvZCByZW1vdmVMaXN0ZW5lclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGhhbmRsZXIgZnVuY3Rpb24gb2JqZWN0IHRvIHJlbW92ZVxuICogQHJldHVybiB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcih0eXBlLCBoYW5kbGVyKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5saXN0ZW5lcnNbdHlwZV0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICBpZiAoaW5kZXggPj0gMCkgdGhpcy5saXN0ZW5lcnNbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2FsbCBldmVudCBoYW5kbGVycyB3aXRoIHRoaXMgc2V0IHRvIG93bmVyLlxuICpcbiAqIEBtZXRob2QgYmluZFRoaXNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3duZXIgb2JqZWN0IHRoaXMgRXZlbnRFbWl0dGVyIGJlbG9uZ3MgdG9cbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5iaW5kVGhpcyA9IGZ1bmN0aW9uIGJpbmRUaGlzKG93bmVyKSB7XG4gICAgdGhpcy5fb3duZXIgPSBvd25lcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyOyIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnLi9FdmVudEVtaXR0ZXInKTtcblxuLyoqXG4gKiBFdmVudEhhbmRsZXIgZm9yd2FyZHMgcmVjZWl2ZWQgZXZlbnRzIHRvIGEgc2V0IG9mIHByb3ZpZGVkIGNhbGxiYWNrIGZ1bmN0aW9ucy5cbiAqIEl0IGFsbG93cyBldmVudHMgdG8gYmUgY2FwdHVyZWQsIHByb2Nlc3NlZCwgYW5kIG9wdGlvbmFsbHkgcGlwZWQgdGhyb3VnaCB0byBvdGhlciBldmVudCBoYW5kbGVycy5cbiAqXG4gKiBAY2xhc3MgRXZlbnRIYW5kbGVyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEhhbmRsZXIoKSB7XG4gICAgRXZlbnRFbWl0dGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmRvd25zdHJlYW0gPSBbXTsgLy8gZG93bnN0cmVhbSBldmVudCBoYW5kbGVyc1xuICAgIHRoaXMuZG93bnN0cmVhbUZuID0gW107IC8vIGRvd25zdHJlYW0gZnVuY3Rpb25zXG5cbiAgICB0aGlzLnVwc3RyZWFtID0gW107IC8vIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXJzXG4gICAgdGhpcy51cHN0cmVhbUxpc3RlbmVycyA9IHt9OyAvLyB1cHN0cmVhbSBsaXN0ZW5lcnNcbn1cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50RW1pdHRlci5wcm90b3R5cGUpO1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEV2ZW50SGFuZGxlcjtcblxuLyoqXG4gKiBBc3NpZ24gYW4gZXZlbnQgaGFuZGxlciB0byByZWNlaXZlIGFuIG9iamVjdCdzIGlucHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldElucHV0SGFuZGxlclxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb2JqZWN0IHRvIG1peCB0cmlnZ2VyLCBzdWJzY3JpYmUsIGFuZCB1bnN1YnNjcmliZSBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyID0gZnVuY3Rpb24gc2V0SW5wdXRIYW5kbGVyKG9iamVjdCwgaGFuZGxlcikge1xuICAgIG9iamVjdC50cmlnZ2VyID0gaGFuZGxlci50cmlnZ2VyLmJpbmQoaGFuZGxlcik7XG4gICAgaWYgKGhhbmRsZXIuc3Vic2NyaWJlICYmIGhhbmRsZXIudW5zdWJzY3JpYmUpIHtcbiAgICAgICAgb2JqZWN0LnN1YnNjcmliZSA9IGhhbmRsZXIuc3Vic2NyaWJlLmJpbmQoaGFuZGxlcik7XG4gICAgICAgIG9iamVjdC51bnN1YnNjcmliZSA9IGhhbmRsZXIudW5zdWJzY3JpYmUuYmluZChoYW5kbGVyKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEFzc2lnbiBhbiBldmVudCBoYW5kbGVyIHRvIHJlY2VpdmUgYW4gb2JqZWN0J3Mgb3V0cHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldE91dHB1dEhhbmRsZXJcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9iamVjdCB0byBtaXggcGlwZSwgdW5waXBlLCBvbiwgYWRkTGlzdGVuZXIsIGFuZCByZW1vdmVMaXN0ZW5lciBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlciA9IGZ1bmN0aW9uIHNldE91dHB1dEhhbmRsZXIob2JqZWN0LCBoYW5kbGVyKSB7XG4gICAgaWYgKGhhbmRsZXIgaW5zdGFuY2VvZiBFdmVudEhhbmRsZXIpIGhhbmRsZXIuYmluZFRoaXMob2JqZWN0KTtcbiAgICBvYmplY3QucGlwZSA9IGhhbmRsZXIucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC51bnBpcGUgPSBoYW5kbGVyLnVucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC5vbiA9IGhhbmRsZXIub24uYmluZChoYW5kbGVyKTtcbiAgICBvYmplY3QuYWRkTGlzdGVuZXIgPSBvYmplY3Qub247XG4gICAgb2JqZWN0LnJlbW92ZUxpc3RlbmVyID0gaGFuZGxlci5yZW1vdmVMaXN0ZW5lci5iaW5kKGhhbmRsZXIpO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VyIGFuIGV2ZW50LCBzZW5kaW5nIHRvIGFsbCBkb3duc3RyZWFtIGhhbmRsZXJzXG4gKiAgIGxpc3RlbmluZyBmb3IgcHJvdmlkZWQgJ3R5cGUnIGtleS5cbiAqXG4gKiBAbWV0aG9kIGVtaXRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgZXZlbnQgZGF0YVxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSwgZXZlbnQpIHtcbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5kb3duc3RyZWFtW2ldLnRyaWdnZXIpIHRoaXMuZG93bnN0cmVhbVtpXS50cmlnZ2VyKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbUZuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZG93bnN0cmVhbUZuW2ldKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBlbWl0XG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudHJpZ2dlciA9IEV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdDtcblxuLyoqXG4gKiBBZGQgZXZlbnQgaGFuZGxlciBvYmplY3QgdG8gc2V0IG9mIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKlxuICogQG1ldGhvZCBwaXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCBldmVudCBoYW5kbGVyIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcGFzc2VkIGV2ZW50IGhhbmRsZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24gcGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnN1YnNjcmliZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSByZXR1cm4gdGFyZ2V0LnN1YnNjcmliZSh0aGlzKTtcblxuICAgIHZhciBkb3duc3RyZWFtQ3R4ID0gKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/IHRoaXMuZG93bnN0cmVhbUZuIDogdGhpcy5kb3duc3RyZWFtO1xuICAgIHZhciBpbmRleCA9IGRvd25zdHJlYW1DdHguaW5kZXhPZih0YXJnZXQpO1xuICAgIGlmIChpbmRleCA8IDApIGRvd25zdHJlYW1DdHgucHVzaCh0YXJnZXQpO1xuXG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB0YXJnZXQoJ3BpcGUnLCBudWxsKTtcbiAgICBlbHNlIGlmICh0YXJnZXQudHJpZ2dlcikgdGFyZ2V0LnRyaWdnZXIoJ3BpcGUnLCBudWxsKTtcblxuICAgIHJldHVybiB0YXJnZXQ7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBoYW5kbGVyIG9iamVjdCBmcm9tIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICogICBVbmRvZXMgd29yayBvZiBcInBpcGVcIi5cbiAqXG4gKiBAbWV0aG9kIHVucGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgdGFyZ2V0IGhhbmRsZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHByb3ZpZGVkIHRhcmdldFxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnVucGlwZSA9IGZ1bmN0aW9uIHVucGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnVuc3Vic2NyaWJlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiB0YXJnZXQudW5zdWJzY3JpYmUodGhpcyk7XG5cbiAgICB2YXIgZG93bnN0cmVhbUN0eCA9ICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgPyB0aGlzLmRvd25zdHJlYW1GbiA6IHRoaXMuZG93bnN0cmVhbTtcbiAgICB2YXIgaW5kZXggPSBkb3duc3RyZWFtQ3R4LmluZGV4T2YodGFyZ2V0KTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICBkb3duc3RyZWFtQ3R4LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgdGFyZ2V0KCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgZWxzZSBpZiAodGFyZ2V0LnRyaWdnZXIpIHRhcmdldC50cmlnZ2VyKCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEJpbmQgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBhbiBldmVudCB0eXBlIGhhbmRsZWQgYnkgdGhpcyBvYmplY3QuXG4gKlxuICogQG1ldGhvZCBcIm9uXCJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbih0eXBlLCBoYW5kbGVyKSB7XG4gICAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykpIHtcbiAgICAgICAgdmFyIHVwc3RyZWFtTGlzdGVuZXIgPSB0aGlzLnRyaWdnZXIuYmluZCh0aGlzLCB0eXBlKTtcbiAgICAgICAgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSA9IHVwc3RyZWFtTGlzdGVuZXI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy51cHN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy51cHN0cmVhbVtpXS5vbih0eXBlLCB1cHN0cmVhbUxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIFwib25cIlxuICogQG1ldGhvZCBhZGRMaXN0ZW5lclxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5vbjtcblxuLyoqXG4gKiBMaXN0ZW4gZm9yIGV2ZW50cyBmcm9tIGFuIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXIuXG4gKlxuICogQG1ldGhvZCBzdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gc3Vic2NyaWJlKHNvdXJjZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMudXBzdHJlYW0uaW5kZXhPZihzb3VyY2UpO1xuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgdGhpcy51cHN0cmVhbS5wdXNoKHNvdXJjZSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLm9uKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdG9wIGxpc3RlbmluZyB0byBldmVudHMgZnJvbSBhbiB1cHN0cmVhbSBldmVudCBoYW5kbGVyLlxuICpcbiAqIEBtZXRob2QgdW5zdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiB1bnN1YnNjcmliZShzb3VyY2UpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnVwc3RyZWFtLmluZGV4T2Yoc291cmNlKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICB0aGlzLnVwc3RyZWFtLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEhhbmRsZXI7IiwidmFyIFRpbWVyID0gcmVxdWlyZSgnLi4vVXRpbGl0aWVzL1RpbWVyJyk7XG52YXIgTWF0cml4ID0gcmVxdWlyZSgnLi4vVXRpbGl0aWVzL01hdHJpeCcpO1xuXG5mdW5jdGlvbiBBbGllbiAob3B0aW9ucykge1xuXHR0aGlzLnBvc2l0aW9uID0gb3B0aW9ucy5wb3NpdGlvbjtcblx0dGhpcy5jb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0O1xuXHR0aGlzLm1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XG5cdHRoaXMucE1hdHJpeCA9IG9wdGlvbnMucE1hdHJpeDtcblx0dGhpcy5tdk1hdHJpeCA9IG9wdGlvbnMubXZNYXRyaXg7XG5cdHRoaXMucGxheWVyID0gb3B0aW9ucy5wbGF5ZXI7XG5cdHRoaXMudGV4dHVyZSA9IG9wdGlvbnMudGV4dHVyZTtcblx0dGhpcy5zaGFkZXJQcm9ncmFtID0gb3B0aW9ucy5zaGFkZXJQcm9ncmFtO1xuXHR0aGlzLm1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XG5cdG1hdDQuaWRlbnRpdHkodGhpcy5tYXRyaXgpO1xuXG5cdHRoaXMuc3ByaXRlQ29vcmRpbmF0ZXMgPSByZXNldENvb3JkaW5hdGVzLmNhbGwodGhpcyk7XG5cdHRoaXMuZHJhd1N0YXRlID0gMDtcblxuXHRpbml0QnVmZmVycy5jYWxsKHRoaXMpO1xuXG5cdFRpbWVyLmV2ZXJ5KHRoaXMuaW5jcmVtZW50U3RhdGUuYmluZCh0aGlzKSwgNTAwKTtcbn1cblxudmFyIFNUQVRFUyA9IFtcblx0e1xuXHRcdG9mZnNldDogWzAuNTYsIDAuNzc3XSxcblx0XHRzaXplOiBbMC4xNiwgMC4yNV1cblx0fSxcblx0e1xuXHRcdG9mZnNldDogWzAuNzIwLCAwLjc4XSxcblx0XHRzaXplOiBbMC4xNiwgMC4yNV1cblx0fVxuXTtcblxuQWxpZW4ucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcblx0dGhpcy5kaWZmZXJlbnRpYWwgPSBbXG5cdFx0dGhpcy5wbGF5ZXIucG9zaXRpb25bMF0gLSB0aGlzLnBvc2l0aW9uWzBdLFxuXHRcdHRoaXMucGxheWVyLnBvc2l0aW9uWzJdIC0gdGhpcy5wb3NpdGlvblsyXVxuXHRdO1xuXHR0aGlzLnJvdGF0aW9uID0gTWF0aC5hY29zKHRoaXMuZGlmZmVyZW50aWFsWzBdIC8gdGhpcy5kaWZmZXJlbnRpYWxbMV0pO1xuXHR2YXIgZGlzdCA9IDAuMDA1O1xuXHR2YXIgcmF0aW8gPSB0aGlzLmRpZmZlcmVudGlhbFswXSAvIHRoaXMuZGlmZmVyZW50aWFsWzFdO1xuXHR2YXIgZGlzdCA9IGRpc3QgLyAocmF0aW8gKyAxKTtcblx0ZGlzdFggPSBkaXN0ICogcmF0aW87XG5cdGRpc3RZID0gZGlzdDtcblx0dGhpcy5wb3NpdGlvblswXSArPSAwLjAwNTtcblx0Ly8gdGhpcy5wb3NpdGlvblsyXSArPSBkaXN0WTtcbn1cblxuZnVuY3Rpb24gZGVnVG9SYWQoZGVncmVlcykge1xuICAgIHJldHVybiBkZWdyZWVzICogTWF0aC5QSSAvIDE4MDtcbn1cblxuQWxpZW4ucHJvdG90eXBlLmluY3JlbWVudFN0YXRlID0gZnVuY3Rpb24gaW5jcmVtZW50U3RhdGUoKSB7XG5cdGlmKHRoaXMuZHJhd1N0YXRlICsgMSA+IFNUQVRFUy5sZW5ndGggLSAxKSB0aGlzLmRyYXdTdGF0ZSA9IDA7XG5cdGVsc2UgdGhpcy5kcmF3U3RhdGUrKztcblxuXHR0aGlzLnNldERyYXdTdGF0ZSh0aGlzLmRyYXdTdGF0ZSk7XG59XG5cbkFsaWVuLnByb3RvdHlwZS5zZXREcmF3U3RhdGUgPSBmdW5jdGlvbiBzZXREcmF3U3RhdGUoZnJhbWVJbmRleCkge1xuXHR2YXIgc3ByaXRlICAgICAgICA9IFNUQVRFU1tmcmFtZUluZGV4XTtcbiAgICB2YXIgdGV4dHVyZVN0YXJ0WCA9IHNwcml0ZS5vZmZzZXRbMF0gLSAoc3ByaXRlLnNpemVbMF0gKiAwLjUpO1xuICAgIHZhciB0ZXh0dXJlU3RhcnRZID0gc3ByaXRlLm9mZnNldFsxXSAtIChzcHJpdGUuc2l6ZVsxXSAqIDAuNSk7XG4gICAgdmFyIHRleHR1cmVFbmRYICAgPSBzcHJpdGUub2Zmc2V0WzBdICsgKHNwcml0ZS5zaXplWzBdICogMC41KTtcbiAgICB2YXIgdGV4dHVyZUVuZFkgICA9IHNwcml0ZS5vZmZzZXRbMV0gKyAoc3ByaXRlLnNpemVbMV0gKiAwLjUpO1xuXG4gICAgdGhpcy50ZXh0dXJlQ29vcmRpbmF0ZXMgPSBbXG4gICAgICAgICAgdGV4dHVyZUVuZFgsICAgdGV4dHVyZUVuZFksXG4gICAgICAgIHRleHR1cmVTdGFydFgsICAgdGV4dHVyZUVuZFksXG4gICAgICAgICAgdGV4dHVyZUVuZFgsIHRleHR1cmVTdGFydFksXG4gICAgICAgIHRleHR1cmVTdGFydFgsIHRleHR1cmVTdGFydFksXG4gICAgXTtcblxuICAgIHRoaXMuY29udGV4dC5iaW5kQnVmZmVyKHRoaXMuY29udGV4dC5BUlJBWV9CVUZGRVIsIHRoaXMudGV4dHVyZUJ1ZmZlcik7XG4gICAgdGhpcy5jb250ZXh0LmJ1ZmZlckRhdGEodGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh0aGlzLnRleHR1cmVDb29yZGluYXRlcyksIHRoaXMuY29udGV4dC5TVEFUSUNfRFJBVyk7XG59XG5cbkFsaWVuLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gZHJhdyhtdk1hdHJpeCkge1xuXHRtYXQ0LnNldChtdk1hdHJpeCwgdGhpcy5tYXRyaXgpO1xuICAgIG1hdDQudHJhbnNsYXRlKHRoaXMubWF0cml4LCBbdGhpcy5wb3NpdGlvblswXSwgdGhpcy5wb3NpdGlvblsxXSwgdGhpcy5wb3NpdGlvblsyXV0pO1xuICAgIG1hdDQucm90YXRlKHRoaXMubWF0cml4LCB0aGlzLnJvdGF0aW9uLCBbMCwgMSwgMF0pO1xuXG4gICAgdGhpcy5jb250ZXh0LmJpbmRCdWZmZXIodGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgdGhpcy50ZXh0dXJlQnVmZmVyKTtcbiAgICB0aGlzLmNvbnRleHQudmVydGV4QXR0cmliUG9pbnRlcih0aGlzLnNoYWRlclByb2dyYW0udGV4dHVyZUNvb3JkQXR0cmlidXRlLCB0aGlzLnRleHR1cmVCdWZmZXIuaXRlbVNpemUsIHRoaXMuY29udGV4dC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG4gICAgdGhpcy5jb250ZXh0LmJpbmRCdWZmZXIodGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgdGhpcy5wb3NpdGlvbkJ1ZmZlcik7XG4gICAgdGhpcy5jb250ZXh0LnZlcnRleEF0dHJpYlBvaW50ZXIodGhpcy5zaGFkZXJQcm9ncmFtLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlLCB0aGlzLnBvc2l0aW9uQnVmZmVyLml0ZW1TaXplLCB0aGlzLmNvbnRleHQuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgIHRoaXMuc2V0TWF0cml4VW5pZm9ybXMoKTtcbiAgICB0aGlzLmNvbnRleHQuZHJhd0FycmF5cyh0aGlzLmNvbnRleHQuVFJJQU5HTEVfU1RSSVAsIDAsIHRoaXMucG9zaXRpb25CdWZmZXIubnVtSXRlbXMpO1xufVxuXG5BbGllbi5wcm90b3R5cGUuc2V0TWF0cml4VW5pZm9ybXMgPSBmdW5jdGlvbiBzZXRNYXRyaXhVbmlmb3JtcyAoKSB7XG4gICAgLy8gdGhpcy5jb250ZXh0LnVuaWZvcm1NYXRyaXg0ZnYodGhpcy5zaGFkZXJQcm9ncmFtLnBNYXRyaXhVbmlmb3JtLCBmYWxzZSwgdGhpcy5wTWF0cml4KTtcbiAgICB0aGlzLmNvbnRleHQudW5pZm9ybU1hdHJpeDRmdih0aGlzLnNoYWRlclByb2dyYW0ubXZNYXRyaXhVbmlmb3JtLCBmYWxzZSwgdGhpcy5tYXRyaXgpO1xufVxuXG5mdW5jdGlvbiBpbml0QnVmZmVycygpIHtcblx0dGhpcy50ZXh0dXJlQnVmZmVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlcigpO1xuXHR0aGlzLnNldERyYXdTdGF0ZSh0aGlzLmRyYXdTdGF0ZSk7XG5cdHRoaXMudGV4dHVyZUJ1ZmZlci5pdGVtU2l6ZSA9IDI7XG4gICAgdGhpcy50ZXh0dXJlQnVmZmVyLm51bUl0ZW1zID0gNDtcblxuICAgIHRoaXMucG9zaXRpb25CdWZmZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKCk7XG4gICAgdGhpcy5jb250ZXh0LmJpbmRCdWZmZXIodGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgdGhpcy5wb3NpdGlvbkJ1ZmZlcik7XG4gICAgdGhpcy5jb250ZXh0LmJ1ZmZlckRhdGEodGhpcy5jb250ZXh0LkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh0aGlzLnNwcml0ZUNvb3JkaW5hdGVzKSwgdGhpcy5jb250ZXh0LlNUQVRJQ19EUkFXKTtcbiAgICB0aGlzLnBvc2l0aW9uQnVmZmVyLml0ZW1TaXplID0gMztcbiAgICB0aGlzLnBvc2l0aW9uQnVmZmVyLm51bUl0ZW1zID0gNDtcbn1cblxuZnVuY3Rpb24gcmVzZXRDb29yZGluYXRlcygpIHtcblx0dmFyIHdpZHRoICAgICAgPSAwLjYwO1xuXHR2YXIgaGVpZ2h0ICAgICA9IDAuODtcblx0dmFyIGN1cnJlbnRaICAgPSB0aGlzLnBvc2l0aW9uWzJdO1xuXHR2YXIgaGFsZldpZHRoICA9IHdpZHRoICogMC41O1xuXHQvLyB2YXIgbWluWCAgICAgICA9IHRoaXMucG9zaXRpb25bMF0gLSBoYWxmV2lkdGg7XG5cdC8vIHZhciBtYXhYICAgICAgID0gdGhpcy5wb3NpdGlvblswXSArIGhhbGZXaWR0aDtcblx0Ly8gdmFyIG1pblkgICAgICAgPSB0aGlzLnBvc2l0aW9uWzFdO1xuXHQvLyB2YXIgbWF4WSAgICAgICA9IHRoaXMucG9zaXRpb25bMV0gKyBoZWlnaHQ7XG5cdHZhciBtaW5YICAgICAgID0gLSBoYWxmV2lkdGg7XG5cdHZhciBtYXhYICAgICAgID0gaGFsZldpZHRoO1xuXHR2YXIgbWluWSAgICAgICA9IDA7XG5cdHZhciBtYXhZICAgICAgID0gaGVpZ2h0O1xuXG5cdHJldHVybiBbXG5cdFx0bWluWCwgbWF4WSwgY3VycmVudFosXG5cdFx0bWF4WCwgbWF4WSwgY3VycmVudFosXG5cdFx0bWluWCwgbWluWSwgY3VycmVudFosXG5cdFx0bWF4WCwgbWluWSwgY3VycmVudFpcblx0XTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBbGllbjsiLCJmdW5jdGlvbiBQbGF5ZXIob3B0aW9ucykge1xuXHR0aGlzLnBvc2l0aW9uID0gb3B0aW9ucy5wb3NpdGlvbjtcblx0dGhpcy5yb3RhdGlvbiA9IDA7XG5cdHRoaXMucm90YXRpb25SYXRlID0gMDtcblx0dGhpcy56U3BlZWQgPSAwO1xuXHR0aGlzLnhTcGVlZCA9IDA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyOyIsInZhciBJbWFnZUxvYWRlciAgPSByZXF1aXJlKCcuLi9HYW1lL0ltYWdlTG9hZGVyJyk7XG52YXIgWE1MTG9hZGVyICAgID0gcmVxdWlyZSgnLi4vR2FtZS9YTUxMb2FkZXInKTtcbnZhciBLZXlIYW5kbGVyICAgPSByZXF1aXJlKCcuLi9JbnB1dHMvS2V5SGFuZGxlcicpO1xudmFyIE1vdXNlVHJhY2tlciA9IHJlcXVpcmUoJy4uL0lucHV0cy9Nb3VzZVRyYWNrZXInKTtcbnZhciBUaW1lciAgICAgICAgPSByZXF1aXJlKCcuLi9VdGlsaXRpZXMvVGltZXInKTtcbnZhciBQbGF5ZXIgICAgICAgPSByZXF1aXJlKCcuL1BsYXllcicpO1xudmFyIEFsaWVuICAgICAgICA9IHJlcXVpcmUoJy4vQWxpZW4nKTtcblxuZnVuY3Rpb24gUmVuZGVyZXIgKG9wdGlvbnMpIHtcblx0dGhpcy5jYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVuZGVyZXInKTtcbiAgICB0aGlzLmdsID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpO1xuICAgIHRoaXMuZ2wudmlld3BvcnRXaWR0aCA9IHRoaXMuY2FudmFzLndpZHRoO1xuICAgIHRoaXMuZ2wudmlld3BvcnRIZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQ7XG5cbiAgICB0aGlzLmxhc3RGcmFtZSA9IDA7XG4gICAgdGhpcy5qb2dnaW5nQW5nbGUgPSAwO1xuXG4gICAgdGhpcy5lbmVtaWVzID0gW107XG5cbiAgICBpbml0TWF0cmljZXMuY2FsbCh0aGlzKTtcblxuICAgIHRoaXMuaW5pdFNoYWRlcnMoKTtcbiAgICB0aGlzLmluaXRUZXh0dXJlcyhvcHRpb25zLnRleHR1cmVzKTtcbiAgICB0aGlzLmhhbmRsZUxvYWRlZFdvcmxkKCk7XG4gICAgdGhpcy5pbml0UGxheWVyKCk7XG5cbiAgICBNb3VzZVRyYWNrZXIub24oJ1VQREFURScsIHRoaXMuaGFuZGxlTW91c2UuYmluZCh0aGlzKSk7XG4gICAgS2V5SGFuZGxlci5vbignVVBEQVRFJywgdGhpcy5oYW5kbGVLZXlzLmJpbmQodGhpcykpO1xuICAgIEtleUhhbmRsZXIub24oJ1NQQUNFOlBSRVNTJywgZnVuY3Rpb24oKXtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5wbGF5ZXIucG9zaXRpb24pO1xuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICB3aW5kb3cub25jbGljayA9IHRoaXMuaGFuZGxlU2hvb3QuYmluZCh0aGlzKTtcblxuICAgIHRoaXMuZ2wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAxLjApO1xuICAgIHRoaXMuZ2wuZW5hYmxlKHRoaXMuZ2wuQkxFTkQpO1xuICAgIHRoaXMuZ2wuYmxlbmRGdW5jKHRoaXMuZ2wuU1JDX0FMUEhBLCB0aGlzLmdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xuICAgIC8vIHRoaXMuZ2wuZW5hYmxlKHRoaXMuZ2wuREVQVEhfVEVTVCk7XG59XG5cblJlbmRlcmVyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUgKCkge1xuXHR0aGlzLmFuaW1hdGUoKTtcbiAgICB0aGlzLmRyYXdTY2VuZSgpO1xuICAgIGlmKE1hdGgucmFuZG9tKCkgPiAwLjk5ICYmIHRoaXMuZW5lbWllcy5sZW5ndGggPCAxMCkgdGhpcy5nZW5lcmF0ZUVuZW15KCk7XG59XG5cblJlbmRlcmVyLnByb3RvdHlwZS5hbmltYXRlID0gZnVuY3Rpb24gYW5pbWF0ZSgpIHtcbiAgICB2YXIgdGhpc0ZyYW1lID0gVGltZXIuZ2V0RWxhcHNlZCgpO1xuICAgIHZhciBuZXdYO1xuICAgIHZhciBuZXdaO1xuICAgIGlmICh0aGlzLmxhc3RGcmFtZSAhPT0gMCkge1xuICAgICAgICB2YXIgcGxheWVyUG9zaXRpb24gPSB0aGlzLnBsYXllci5wb3NpdGlvbjtcbiAgICAgICAgdmFyIGVsYXBzZWQgPSB0aGlzRnJhbWUgLSB0aGlzLmxhc3RGcmFtZTtcbiAgICAgICAgaWYodGhpcy5wbGF5ZXIuelNwZWVkICE9PSAwIHx8IHRoaXMucGxheWVyLnhTcGVlZCAhPT0gMCkge1xuXG4gICAgICAgICAgICBuZXdYID0gcGxheWVyUG9zaXRpb25bMF0gLSBNYXRoLnNpbihkZWdUb1JhZCh0aGlzLnBsYXllci5yb3RhdGlvbikpICogdGhpcy5wbGF5ZXIuelNwZWVkICogZWxhcHNlZDtcbiAgICAgICAgICAgIG5ld1ogPSBwbGF5ZXJQb3NpdGlvblsyXSAtIE1hdGguY29zKGRlZ1RvUmFkKHRoaXMucGxheWVyLnJvdGF0aW9uKSkgKiB0aGlzLnBsYXllci56U3BlZWQgKiBlbGFwc2VkO1xuXG4gICAgICAgICAgICBuZXdYID0gbmV3WCAtIE1hdGguc2luKGRlZ1RvUmFkKHRoaXMucGxheWVyLnJvdGF0aW9uIC0gOTApKSAqIHRoaXMucGxheWVyLnhTcGVlZCAqIGVsYXBzZWQ7XG4gICAgICAgICAgICBuZXdaID0gbmV3WiAtIE1hdGguY29zKGRlZ1RvUmFkKHRoaXMucGxheWVyLnJvdGF0aW9uIC0gOTApKSAqIHRoaXMucGxheWVyLnhTcGVlZCAqIGVsYXBzZWQ7XG5cbiAgICAgICAgICAgIHRoaXMuam9nZ2luZ0FuZ2xlICs9IGVsYXBzZWQgKiAwLjY7XG4gICAgICAgICAgICBwbGF5ZXJQb3NpdGlvblsxXSA9IE1hdGguc2luKGRlZ1RvUmFkKHRoaXMuam9nZ2luZ0FuZ2xlKSkgLyAyMCArIDAuNDtcblxuICAgICAgICAgICAgaWYodGhpcy5pc0luQm91bmRzKG5ld1gsIG5ld1opKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyUG9zaXRpb25bMF0gPSBuZXdYO1xuICAgICAgICAgICAgICAgIHBsYXllclBvc2l0aW9uWzJdID0gbmV3WjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxheWVyLnJvdGF0aW9uICs9IHRoaXMucGxheWVyLnJvdGF0aW9uUmF0ZSAqIGVsYXBzZWQ7XG4gICAgICAgIC8vIHBpdGNoICs9IHBpdGNoUmF0ZSAqIGVsYXBzZWQ7XG4gICAgfVxuICAgIHRoaXMudXBkYXRlRW5lbWllcygpO1xuICAgIHRoaXMubGFzdEZyYW1lID0gdGhpc0ZyYW1lO1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUuaXNJbkJvdW5kcyA9IGZ1bmN0aW9uIGlzSW5Cb3VuZHMoeCwgeikge1xuICAgIHZhciBzdGF0dXMgPSB0cnVlO1xuICAgIHZhciBib3VuZGFyeTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYm91bmRhcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBib3VuZGFyeSA9IGJvdW5kYXJpZXNbaV07XG4gICAgICAgIGlmKHggPiBib3VuZGFyeVswXSAmJiB4IDwgYm91bmRhcnlbMV0pe1xuICAgICAgICAgICAgaWYoeiA+IGJvdW5kYXJ5WzJdICYmIHogPCBib3VuZGFyeVszXSl7XG4gICAgICAgICAgICAgICAgc3RhdHVzID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3RhdHVzO1xufVxuXG4vLyB2YXIgcGl0Y2ggPSAwO1xuLy8gdmFyIHBpdGNoUmF0ZSA9IDA7XG5SZW5kZXJlci5wcm90b3R5cGUuaGFuZGxlS2V5cyA9IGZ1bmN0aW9uIGhhbmRsZUtleXMgKGtleVByZXNzZWQpIHtcbiAgICBpZiAgICAgICgga2V5UHJlc3NlZFsnTEVGVCddIHx8IGtleVByZXNzZWRbJ0EnXSApICB0aGlzLnBsYXllci54U3BlZWQgPSAtMC4wMDM7XG4gICAgZWxzZSBpZiAoIGtleVByZXNzZWRbJ1JJR0hUJ10gfHwga2V5UHJlc3NlZFsnRCddICkgdGhpcy5wbGF5ZXIueFNwZWVkID0gMC4wMDM7XG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXIueFNwZWVkID0gMDtcblxuICAgIGlmICAgICAgKCBrZXlQcmVzc2VkWydVUCddIHx8IGtleVByZXNzZWRbJ1cnXSApICAgdGhpcy5wbGF5ZXIuelNwZWVkID0gMC4wMDM7XG4gICAgZWxzZSBpZiAoIGtleVByZXNzZWRbJ0RPV04nXSB8fCBrZXlQcmVzc2VkWydTJ10gKSB0aGlzLnBsYXllci56U3BlZWQgPSAtMC4wMDM7XG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXllci56U3BlZWQgPSAwO1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUuaGFuZGxlTW91c2UgPSBmdW5jdGlvbiBoYW5kbGVNb3VzZSAodmVsb2NpdHkpIHtcbiAgICB0aGlzLnBsYXllci5yb3RhdGlvblJhdGUgPSB2ZWxvY2l0eVswXSAqIDMwMDAuMDtcbn1cblxuUmVuZGVyZXIucHJvdG90eXBlLmhhbmRsZVNob290ID0gZnVuY3Rpb24gaGFuZGxlU2hvb3QgKCkge1xuICAgIHNldEhhbmRTcHJpdGUuY2FsbCh0aGlzLCAxKTtcbiAgICBUaW1lci5hZnRlcihzZXRIYW5kU3ByaXRlLmJpbmQodGhpcywgMCksIDUwKTtcbn1cblxudmFyIGVuZW15U3RhcnRQb3NpdGlvbnMgPSBbXG4gICAgWzAuMDAyODk0MzU5MTQxODYwNDM5LCAwLjAsIDMuNjkxNjcyMzE1OTAyMzRdLFxuICAgIFszLjI2MzAyMzg2ODkyNDQxNCwgMC4wLCAtMC4wNTgwOTM2MjYwMTU0ODQzM10sXG4gICAgWzAuMDYyNDA4MDkyNTU0NzgxOTcsIDAuMCwgLTMuNjc1NjMwMDIxNDE2NTIzNl0sXG4gICAgWy0zLjgzOTI4NjgyODk2NTAxNTMsIDAuMCwgMC4wNjQ0MDIyMDExODc1NjAxNF1cbl1cblJlbmRlcmVyLnByb3RvdHlwZS5pbml0UGxheWVyID0gZnVuY3Rpb24gaW5pdFBsYXllciAoKSB7XG4gICAgdGhpcy5wbGF5ZXIgPSBuZXcgUGxheWVyKHtcbiAgICAgICAgcG9zaXRpb246IFswLCAwLCAwLjBdXG4gICAgfSk7XG59XG5cblJlbmRlcmVyLnByb3RvdHlwZS5nZW5lcmF0ZUVuZW15ID0gZnVuY3Rpb24gZ2VuZXJhdGVFbmVteSAoKSB7XG4gICAgdmFyIHJhbmRvbVN0YXJ0UG9zID0gZW5lbXlTdGFydFBvc2l0aW9uc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBlbmVteVN0YXJ0UG9zaXRpb25zLmxlbmd0aCldO1xuXG4gICAgdGhpcy5lbmVtaWVzLnB1c2gobmV3IEFsaWVuKHtcbiAgICAgICAgcG9zaXRpb246IHJhbmRvbVN0YXJ0UG9zLFxuICAgICAgICBjb250ZXh0OiB0aGlzLmdsLFxuICAgICAgICB0ZXh0dXJlOiB0aGlzLnRleHR1cmVzWzJdLFxuICAgICAgICBzaGFkZXJQcm9ncmFtOiBzaGFkZXJQcm9ncmFtLFxuICAgICAgICBwbGF5ZXI6IHRoaXMucGxheWVyLFxuICAgICAgICBwTWF0cml4OiB0aGlzLnBNYXRyaXgsXG4gICAgICAgIG12TWF0cml4OiB0aGlzLm12TWF0cml4XG4gICAgfSkpO1xufVxuXG5SZW5kZXJlci5wcm90b3R5cGUudXBkYXRlRW5lbWllcyA9IGZ1bmN0aW9uIHVwZGF0ZUVuZW1pZXMgKCkge1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmVuZW1pZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5lbmVtaWVzW2ldLnVwZGF0ZSgpO1xuICAgIH1cbn1cblxuLy8gdmFyIHBpdGNoID0gMDtcblJlbmRlcmVyLnByb3RvdHlwZS5kcmF3U2NlbmUgPSBmdW5jdGlvbiBkcmF3U2NlbmUoKSB7XG4gICAgdmFyIHBsYXllclBvc2l0aW9uID0gdGhpcy5wbGF5ZXIucG9zaXRpb247XG5cbiAgICB0aGlzLmdsLnZpZXdwb3J0KDAsIDAsIHRoaXMuZ2wudmlld3BvcnRXaWR0aCwgdGhpcy5nbC52aWV3cG9ydEhlaWdodCk7XG4gICAgdGhpcy5nbC5jbGVhcih0aGlzLmdsLkNPTE9SX0JVRkZFUl9CSVQgfCB0aGlzLmdsLkRFUFRIX0JVRkZFUl9CSVQpO1xuXG4gICAgaWYod29ybGRWZXJ0ZXhUZXh0dXJlQ29vcmRCdWZmZXIgPT0gbnVsbCB8fCB3b3JsZFZlcnRleFBvc2l0aW9uQnVmZmVyID09IG51bGwpIHJldHVybjtcblxuICAgIC8qIElOSVRJQUxJWkUgTVYgTUFUUklYICovXG4gICAgbWF0NC5wZXJzcGVjdGl2ZSg0NSwgdGhpcy5nbC52aWV3cG9ydFdpZHRoIC8gdGhpcy5nbC52aWV3cG9ydEhlaWdodCwgMC4xLCAxMDAuMCwgdGhpcy5wTWF0cml4KTtcbiAgICBtYXQ0LmlkZW50aXR5KHRoaXMubXZNYXRyaXgpO1xuXG4gICAgLyogTU9WRSBDQU1FUkEgKi9cbiAgICAvLyBtYXQ0LnJvdGF0ZSh0aGlzLm12TWF0cml4LCBkZWdUb1JhZCgtcGl0Y2gpLCBbMSwgMCwgMF0pO1xuICAgIG1hdDQucm90YXRlKHRoaXMubXZNYXRyaXgsIGRlZ1RvUmFkKC10aGlzLnBsYXllci5yb3RhdGlvbiksICAgWzAsIDEsIDBdKTtcbiAgICBtYXQ0LnRyYW5zbGF0ZSh0aGlzLm12TWF0cml4LCBbLXBsYXllclBvc2l0aW9uWzBdLCAtcGxheWVyUG9zaXRpb25bMV0sIC1wbGF5ZXJQb3NpdGlvblsyXV0pO1xuXG4gICAgLyogRFJBVyBXT1JMRCAqL1xuICAgIHRoaXMuZ2wuYWN0aXZlVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkUwKTtcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlc1swXSk7XG4gICAgdGhpcy5nbC51bmlmb3JtMWkoc2hhZGVyUHJvZ3JhbS5zYW1wbGVyVW5pZm9ybSwgMCk7XG5cbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHdvcmxkVmVydGV4VGV4dHVyZUNvb3JkQnVmZmVyKTtcbiAgICB0aGlzLmdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyUHJvZ3JhbS50ZXh0dXJlQ29vcmRBdHRyaWJ1dGUsIHdvcmxkVmVydGV4VGV4dHVyZUNvb3JkQnVmZmVyLml0ZW1TaXplLCB0aGlzLmdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHdvcmxkVmVydGV4UG9zaXRpb25CdWZmZXIpO1xuICAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXJQcm9ncmFtLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlLCB3b3JsZFZlcnRleFBvc2l0aW9uQnVmZmVyLml0ZW1TaXplLCB0aGlzLmdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICB0aGlzLnNldE1hdHJpeFVuaWZvcm1zKCk7XG4gICAgdGhpcy5nbC5kcmF3QXJyYXlzKHRoaXMuZ2wuVFJJQU5HTEVTLCAwLCB3b3JsZFZlcnRleFBvc2l0aW9uQnVmZmVyLm51bUl0ZW1zKTtcbiAgICBcbiAgICAvKiBEUkFXIEVORU1JRVMgKi9cbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlc1syXSk7XG4gICAgdGhpcy5nbC51bmlmb3JtMWkoc2hhZGVyUHJvZ3JhbS5zYW1wbGVyVW5pZm9ybSwgMCk7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMuZW5lbWllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmVuZW1pZXNbaV0uZHJhdyh0aGlzLm12TWF0cml4KTtcbiAgICB9XG5cbiAgICAvKiBEUkFXIEhBTkRTICovXG4gICAgbWF0NC5pZGVudGl0eSh0aGlzLm12TWF0cml4KTtcbiAgICB0aGlzLmdsLmRpc2FibGUodGhpcy5nbC5ERVBUSF9URVNUKTtcbiAgICB0aGlzLmdsLmFjdGl2ZVRleHR1cmUodGhpcy5nbC5URVhUVVJFMCk7XG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZXNbMV0pO1xuICAgIHRoaXMuZ2wudW5pZm9ybTFpKHNoYWRlclByb2dyYW0uc2FtcGxlclVuaWZvcm0sIDApO1xuXG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCBoYW5kc1RleHR1cmVCdWZmZXIpO1xuICAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXJQcm9ncmFtLnRleHR1cmVDb29yZEF0dHJpYnV0ZSwgaGFuZHNUZXh0dXJlQnVmZmVyLml0ZW1TaXplLCB0aGlzLmdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIGhhbmRzVmVydGV4UG9zaXRpb25CdWZmZXIpO1xuICAgIHRoaXMuZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXJQcm9ncmFtLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlLCBoYW5kc1ZlcnRleFBvc2l0aW9uQnVmZmVyLml0ZW1TaXplLCB0aGlzLmdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICB0aGlzLnNldE1hdHJpeFVuaWZvcm1zKCk7XG4gICAgdGhpcy5nbC5kcmF3QXJyYXlzKHRoaXMuZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIGhhbmRzVmVydGV4UG9zaXRpb25CdWZmZXIubnVtSXRlbXMpO1xuXG4gICAgdGhpcy5nbC5lbmFibGUodGhpcy5nbC5ERVBUSF9URVNUKTtcblxufVxuXG52YXIgc2hhZGVyUHJvZ3JhbTtcblJlbmRlcmVyLnByb3RvdHlwZS5pbml0U2hhZGVycyA9IGZ1bmN0aW9uIGluaXRTaGFkZXJzKHJlc3BvbnNlQXJyYXkpIHtcblx0dmFyIHZlcnRleFNoYWRlckRhdGEgPSBYTUxMb2FkZXIuZ2V0KCcvU2hhZGVycy9WZXJ0ZXhTaGFkZXIuZ2xzbCcpO1xuXHR2YXIgZnJhZ21lbnRTaGFkZXJEYXRhID0gWE1MTG9hZGVyLmdldCgnL1NoYWRlcnMvRnJhZ21lbnRTaGFkZXIuZ2xzbCcpO1xuXG4gICAgdmVydGV4U2hhZGVyID0gdGhpcy5nbC5jcmVhdGVTaGFkZXIodGhpcy5nbC5WRVJURVhfU0hBREVSKTtcbiAgICBmcmFnbWVudFNoYWRlciA9IHRoaXMuZ2wuY3JlYXRlU2hhZGVyKHRoaXMuZ2wuRlJBR01FTlRfU0hBREVSKTtcblxuICAgIHRoaXMuZ2wuc2hhZGVyU291cmNlKHZlcnRleFNoYWRlciwgdmVydGV4U2hhZGVyRGF0YSk7XG4gICAgdGhpcy5nbC5jb21waWxlU2hhZGVyKHZlcnRleFNoYWRlcik7XG5cbiAgICB0aGlzLmdsLnNoYWRlclNvdXJjZShmcmFnbWVudFNoYWRlciwgZnJhZ21lbnRTaGFkZXJEYXRhKTtcbiAgICB0aGlzLmdsLmNvbXBpbGVTaGFkZXIoZnJhZ21lbnRTaGFkZXIpO1xuXG4gICAgc2hhZGVyUHJvZ3JhbSA9IHRoaXMuZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgIHRoaXMuZ2wuYXR0YWNoU2hhZGVyKHNoYWRlclByb2dyYW0sIHZlcnRleFNoYWRlcik7XG4gICAgdGhpcy5nbC5hdHRhY2hTaGFkZXIoc2hhZGVyUHJvZ3JhbSwgZnJhZ21lbnRTaGFkZXIpO1xuICAgIHRoaXMuZ2wubGlua1Byb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XG5cbiAgICBpZiAoIXRoaXMuZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihzaGFkZXJQcm9ncmFtLCB0aGlzLmdsLkxJTktfU1RBVFVTKSkgY29uc29sZS5sb2coXCJDb3VsZCBub3QgaW5pdGlhbGlzZSBzaGFkZXJzXCIpO1xuXG4gICAgdGhpcy5nbC51c2VQcm9ncmFtKHNoYWRlclByb2dyYW0pO1xuXG4gICAgc2hhZGVyUHJvZ3JhbS52ZXJ0ZXhQb3NpdGlvbkF0dHJpYnV0ZSA9IHRoaXMuZ2wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJhVmVydGV4UG9zaXRpb25cIik7XG4gICAgdGhpcy5nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGFkZXJQcm9ncmFtLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlKTtcblxuICAgIHNoYWRlclByb2dyYW0udGV4dHVyZUNvb3JkQXR0cmlidXRlID0gdGhpcy5nbC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFUZXh0dXJlQ29vcmRcIik7XG4gICAgdGhpcy5nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGFkZXJQcm9ncmFtLnRleHR1cmVDb29yZEF0dHJpYnV0ZSk7XG5cbiAgICBzaGFkZXJQcm9ncmFtLnBNYXRyaXhVbmlmb3JtID0gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1UE1hdHJpeFwiKTtcbiAgICBzaGFkZXJQcm9ncmFtLm12TWF0cml4VW5pZm9ybSA9IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwidU1WTWF0cml4XCIpO1xuICAgIHNoYWRlclByb2dyYW0uc2FtcGxlclVuaWZvcm0gPSB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcInVTYW1wbGVyXCIpO1xuICAgIHNoYWRlclByb2dyYW0uY29sb3JVbmlmb3JtID0gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJ1Q29sb3JcIik7XG59XG5cblJlbmRlcmVyLnByb3RvdHlwZS5zZXRNYXRyaXhVbmlmb3JtcyA9IGZ1bmN0aW9uIHNldE1hdHJpeFVuaWZvcm1zKCkge1xuICAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdihzaGFkZXJQcm9ncmFtLnBNYXRyaXhVbmlmb3JtLCBmYWxzZSwgdGhpcy5wTWF0cml4KTtcbiAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYoc2hhZGVyUHJvZ3JhbS5tdk1hdHJpeFVuaWZvcm0sIGZhbHNlLCB0aGlzLm12TWF0cml4KTtcbn1cblxuXG52YXIgd29ybGRWZXJ0ZXhQb3NpdGlvbkJ1ZmZlciA9IG51bGw7XG52YXIgd29ybGRWZXJ0ZXhUZXh0dXJlQ29vcmRCdWZmZXIgPSBudWxsO1xudmFyIGhhbmRzVmVydGV4UG9zaXRpb25CdWZmZXIgPSBudWxsO1xudmFyIGhhbmRzVGV4dHVyZUJ1ZmZlciA9IG51bGw7XG52YXIgdGV4dHVyZUNvb3JkcyA9IG51bGw7XG52YXIgaGFuZHNWZXJ0aWNlcyA9IG51bGw7XG5SZW5kZXJlci5wcm90b3R5cGUuaGFuZGxlTG9hZGVkV29ybGQgPSBmdW5jdGlvbiBoYW5kbGVMb2FkZWRXb3JsZCAocmVzcG9uc2UpIHtcblx0dmFyIGRhdGEgPSBKU09OLnBhcnNlKFhNTExvYWRlci5nZXQoJy9HYW1lRGF0YS93b3JsZC5qc29uJykpO1xuICAgIHZhciB2ZXJ0ZXhDb3VudCA9IDA7XG4gICAgdmFyIHZlcnRleFBvc2l0aW9ucyA9IFtdO1xuICAgIHZhciB2ZXJ0ZXhUZXh0dXJlQ29vcmRzID0gW107XG4gICAgdmFyIHdhbGxzID0gZGF0YS53YWxscztcbiAgICB2YXIgd2FsbFZlcnRpY2VzO1xuICAgIHZhciB3YWxsO1xuICAgIHZhciB2ZXJ0ZXg7XG4gICAgdmFyIHZlcnRleFBvc2l0aW9uO1xuICAgIHZhciB2ZXJ0ZXhDb29yZDtcblxuICAgIGZvciAodmFyIGluZGV4IGluIHdhbGxzKSB7XG4gICAgICAgIHdhbGwgPSB3YWxsc1tpbmRleF07XG4gICAgICAgIHdhbGxWZXJ0aWNlcyA9IHdhbGwudmVydGljZXM7XG4gICAgICAgIGlmKHdhbGwuYm91bmRhcnkpIHRoaXMucmVnaXN0ZXJCb3VuZGFyeSh3YWxsLnZlcnRpY2VzKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3YWxsVmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZlcnRleCA9IHdhbGxWZXJ0aWNlc1tpXTtcbiAgICAgICAgICAgIHZlcnRleFBvc2l0aW9uID0gdmVydGV4LnBvc2l0aW9uO1xuICAgICAgICAgICAgdmVydGV4Q29vcmQgPSB2ZXJ0ZXgudGV4dHVyZTtcbiAgICAgICAgICAgIHZlcnRleFBvc2l0aW9ucy5wdXNoKHZlcnRleFBvc2l0aW9uWzBdLCB2ZXJ0ZXhQb3NpdGlvblsxXSwgdmVydGV4UG9zaXRpb25bMl0pO1xuICAgICAgICAgICAgdmVydGV4VGV4dHVyZUNvb3Jkcy5wdXNoKHZlcnRleENvb3JkWzBdLCB2ZXJ0ZXhDb29yZFsxXSk7XG4gICAgICAgICAgICB2ZXJ0ZXhDb3VudCsrO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBmb3IgKHZhciBpbmRleCBpbiB3YWxscykge1xuICAgICAgICB3YWxsID0gd2FsbHNbaW5kZXhdO1xuICAgICAgICB3YWxsVmVydGljZXMgPSB3YWxsLnZlcnRpY2VzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdhbGxWZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmVydGV4ID0gd2FsbFZlcnRpY2VzW2ldO1xuICAgICAgICAgICAgdmVydGV4UG9zaXRpb24gPSB2ZXJ0ZXgucG9zaXRpb247XG4gICAgICAgICAgICB2ZXJ0ZXhDb29yZCA9IHZlcnRleC50ZXh0dXJlO1xuICAgICAgICAgICAgdmVydGV4UG9zaXRpb25bMl0gLT0gNS4wO1xuICAgICAgICAgICAgdmVydGV4UG9zaXRpb25zLnB1c2godmVydGV4UG9zaXRpb25bMF0sIHZlcnRleFBvc2l0aW9uWzFdLCB2ZXJ0ZXhQb3NpdGlvblsyXSk7XG4gICAgICAgICAgICB2ZXJ0ZXhUZXh0dXJlQ29vcmRzLnB1c2godmVydGV4Q29vcmRbMF0sIHZlcnRleENvb3JkWzFdKTtcbiAgICAgICAgICAgIHZlcnRleENvdW50Kys7XG4gICAgICAgIH1cbiAgICAgICAgaWYod2FsbC5ib3VuZGFyeSkgdGhpcy5yZWdpc3RlckJvdW5kYXJ5KHdhbGwudmVydGljZXMpO1xuICAgIH1cblxuICAgIHdvcmxkVmVydGV4UG9zaXRpb25CdWZmZXIgPSB0aGlzLmdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkFSUkFZX0JVRkZFUiwgd29ybGRWZXJ0ZXhQb3NpdGlvbkJ1ZmZlcik7XG4gICAgdGhpcy5nbC5idWZmZXJEYXRhKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHZlcnRleFBvc2l0aW9ucyksIHRoaXMuZ2wuU1RBVElDX0RSQVcpO1xuICAgIHdvcmxkVmVydGV4UG9zaXRpb25CdWZmZXIuaXRlbVNpemUgPSAzO1xuICAgIHdvcmxkVmVydGV4UG9zaXRpb25CdWZmZXIubnVtSXRlbXMgPSB2ZXJ0ZXhDb3VudDtcblxuICAgIHdvcmxkVmVydGV4VGV4dHVyZUNvb3JkQnVmZmVyID0gdGhpcy5nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIHdvcmxkVmVydGV4VGV4dHVyZUNvb3JkQnVmZmVyKTtcbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodmVydGV4VGV4dHVyZUNvb3JkcyksIHRoaXMuZ2wuU1RBVElDX0RSQVcpO1xuICAgIHdvcmxkVmVydGV4VGV4dHVyZUNvb3JkQnVmZmVyLml0ZW1TaXplID0gMjtcbiAgICB3b3JsZFZlcnRleFRleHR1cmVDb29yZEJ1ZmZlci5udW1JdGVtcyA9IHZlcnRleENvdW50O1xuXG4gICAgLyogQ1JFQVRFIEhBTkQgQlVGRkVSUyAqL1xuICAgIGhhbmRzVmVydGV4UG9zaXRpb25CdWZmZXIgPSB0aGlzLmdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGhhbmRzVmVydGV4UG9zaXRpb25CdWZmZXIuaXRlbVNpemUgPSAzO1xuICAgIGhhbmRzVmVydGV4UG9zaXRpb25CdWZmZXIubnVtSXRlbXMgPSA0O1xuXG4gICAgaGFuZHNUZXh0dXJlQnVmZmVyID0gdGhpcy5nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBoYW5kc1RleHR1cmVCdWZmZXIuaXRlbVNpemUgPSAyO1xuICAgIGhhbmRzVGV4dHVyZUJ1ZmZlci5udW1JdGVtcyA9IDQ7XG5cbiAgICBzZXRIYW5kU3ByaXRlLmNhbGwodGhpcywgMCk7XG59XG5cbnZhciBxdWFkT3JpZ2luID0gWzAuMCwgLTAuMDIyLCAtMC4xXTtcbnZhciBzdGF0ZXMgPSBbXG4gICAgeyBvZmZzZXQ6IFswLjEsIDAuNzddLCBzaXplOiBbMC4xMzUsIDAuMjBdLCBkcmF3U2l6ZTogIFswLjA4LCAwLjA4XSB9LFxuICAgIHsgb2Zmc2V0OiBbMC4zNTgsIDAuNzQ1XSwgc2l6ZTogWzAuMTIsIDAuMjYwXSwgZHJhd1NpemU6ICBbMC4wOCwgMC4xMTBdIH0sXG5dO1xuZnVuY3Rpb24gc2V0SGFuZFNwcml0ZSAoaW5kZXgpIHtcbiAgICB2YXIgc3ByaXRlICAgICA9IHN0YXRlc1tpbmRleF07XG4gICAgdmFyIHF1YWRXaWR0aCAgPSBzcHJpdGUuZHJhd1NpemVbMF0gKiAwLjU7XG4gICAgdmFyIHF1YWRIZWlnaHQgPSBzcHJpdGUuZHJhd1NpemVbMV0gKiAwLjU7XG5cbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIGhhbmRzVmVydGV4UG9zaXRpb25CdWZmZXIpO1xuXG4gICAgdmFyIHBvc2l0aW9uU3RhcnRYID0gcXVhZE9yaWdpblswXSAtIChxdWFkV2lkdGggKiAwLjUpO1xuICAgIHZhciBwb3NpdGlvblN0YXJ0WSA9IHF1YWRPcmlnaW5bMV0gLSAocXVhZEhlaWdodCAqIDAuNSk7XG4gICAgdmFyIHBvc2l0aW9uRW5kWCAgID0gcXVhZE9yaWdpblswXSArIChxdWFkV2lkdGggKiAwLjUpO1xuICAgIHZhciBwb3NpdGlvbkVuZFkgICA9IHF1YWRPcmlnaW5bMV0gKyAocXVhZEhlaWdodCAqIDAuNSk7XG5cbiAgICBoYW5kc1ZlcnRpY2VzID0gW1xuICAgICAgICBwb3NpdGlvblN0YXJ0WCwgICBwb3NpdGlvbkVuZFksIHF1YWRPcmlnaW5bMl0sXG4gICAgICAgICAgcG9zaXRpb25FbmRYLCAgIHBvc2l0aW9uRW5kWSwgcXVhZE9yaWdpblsyXSxcbiAgICAgICAgcG9zaXRpb25TdGFydFgsIHBvc2l0aW9uU3RhcnRZLCBxdWFkT3JpZ2luWzJdLFxuICAgICAgICAgIHBvc2l0aW9uRW5kWCwgcG9zaXRpb25TdGFydFksIHF1YWRPcmlnaW5bMl1cbiAgICBdO1xuXG4gICAgdGhpcy5nbC5idWZmZXJEYXRhKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KGhhbmRzVmVydGljZXMpLCB0aGlzLmdsLlNUQVRJQ19EUkFXKTtcbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5nbC5BUlJBWV9CVUZGRVIsIGhhbmRzVGV4dHVyZUJ1ZmZlcik7XG5cbiAgICB2YXIgdGV4dHVyZVN0YXJ0WCA9IHNwcml0ZS5vZmZzZXRbMF07XG4gICAgdmFyIHRleHR1cmVTdGFydFkgPSBzcHJpdGUub2Zmc2V0WzFdO1xuICAgIHZhciB0ZXh0dXJlRW5kWCAgID0gc3ByaXRlLm9mZnNldFswXSArIHNwcml0ZS5zaXplWzBdO1xuICAgIHZhciB0ZXh0dXJlRW5kWSAgID0gc3ByaXRlLm9mZnNldFsxXSArIHNwcml0ZS5zaXplWzFdO1xuXG4gICAgdGV4dHVyZUNvb3JkcyA9IFtcbiAgICAgICAgICB0ZXh0dXJlRW5kWCwgICB0ZXh0dXJlRW5kWSxcbiAgICAgICAgdGV4dHVyZVN0YXJ0WCwgICB0ZXh0dXJlRW5kWSxcbiAgICAgICAgICB0ZXh0dXJlRW5kWCwgdGV4dHVyZVN0YXJ0WSxcbiAgICAgICAgdGV4dHVyZVN0YXJ0WCwgdGV4dHVyZVN0YXJ0WSxcbiAgICBdO1xuXG4gICAgdGhpcy5nbC5idWZmZXJEYXRhKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHRleHR1cmVDb29yZHMpLCB0aGlzLmdsLlNUQVRJQ19EUkFXKTtcbn1cblxuXG5SZW5kZXJlci5wcm90b3R5cGUuaW5pdFRleHR1cmVzID0gZnVuY3Rpb24gaW5pdFRleHR1cmVzKHRleHR1cmVzKSB7XG4gICAgdGhpcy50ZXh0dXJlcyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZXh0dXJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgIFx0dGhpcy50ZXh0dXJlc1tpXSA9IHRoaXMuZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgIFx0dGhpcy50ZXh0dXJlc1tpXS5pbWFnZSA9IEltYWdlTG9hZGVyLmdldCh0ZXh0dXJlc1tpXSk7XG5cbiAgICAgICAgdGhpcy5nbC5waXhlbFN0b3JlaSh0aGlzLmdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xuICAgICAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlc1tpXSk7XG4gICAgICAgIHRoaXMuZ2wudGV4SW1hZ2UyRCh0aGlzLmdsLlRFWFRVUkVfMkQsIDAsIHRoaXMuZ2wuUkdCQSwgdGhpcy5nbC5SR0JBLCB0aGlzLmdsLlVOU0lHTkVEX0JZVEUsIHRoaXMudGV4dHVyZXNbaV0uaW1hZ2UpO1xuICAgICAgICB0aGlzLmdsLnRleFBhcmFtZXRlcmkodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLmdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5nbC5MSU5FQVIpO1xuICAgICAgICAvLyB0aGlzLmdsLnRleFBhcmFtZXRlcmkodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLmdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5nbC5ORUFSRVNUX01JUE1BUF9ORUFSRVNUKTtcbiAgICAgICAgdGhpcy5nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy5nbC5URVhUVVJFX01JTl9GSUxURVIsIHRoaXMuZ2wuTElORUFSKTtcbiAgICAgICAgdGhpcy5nbC5nZW5lcmF0ZU1pcG1hcCh0aGlzLmdsLlRFWFRVUkVfMkQpO1xuICAgICAgICAvL3RoaXMuZ2wudGV4UGFyYW1ldGVyaSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMuZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMuZ2wuUkVQRUFUKTtcbiAgICAgICAgLy90aGlzLmdsLnRleFBhcmFtZXRlcmkodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLmdsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLmdsLlJFUEVBVCk7XG5cbiAgICAgICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgIH07XG59XG5cbnZhciBib3VuZGFyaWVzID0gW107XG52YXIgYm91bmRhcnlQYWRkaW5nID0gMC4wNjtcblJlbmRlcmVyLnByb3RvdHlwZS5yZWdpc3RlckJvdW5kYXJ5ID0gZnVuY3Rpb24gcmVnaXN0ZXJCb3VuZGFyeSh2ZXJ0aWNlcykge1xuICAgIHZhciBzbWFsbGVzdFggPSB2ZXJ0aWNlc1swXS5wb3NpdGlvblswXTtcbiAgICB2YXIgc21hbGxlc3RaID0gdmVydGljZXNbMF0ucG9zaXRpb25bMl07XG4gICAgdmFyIGdyZWF0ZXN0WCA9IHZlcnRpY2VzWzBdLnBvc2l0aW9uWzBdO1xuICAgIHZhciBncmVhdGVzdFogPSB2ZXJ0aWNlc1swXS5wb3NpdGlvblsyXTtcbiAgICB2YXIgcG9zaXRpb247XG4gICAgdmFyIGJvdW5kYXJ5O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBwb3NpdGlvbiA9IHZlcnRpY2VzW2ldLnBvc2l0aW9uO1xuICAgICAgICBpZihwb3NpdGlvblswXSA+IGdyZWF0ZXN0WCkgZ3JlYXRlc3RYID0gcG9zaXRpb25bMF07XG4gICAgICAgIGlmKHBvc2l0aW9uWzBdIDwgc21hbGxlc3RYKSBzbWFsbGVzdFggPSBwb3NpdGlvblswXTtcbiAgICAgICAgaWYocG9zaXRpb25bMl0gPiBncmVhdGVzdFopIGdyZWF0ZXN0WiA9IHBvc2l0aW9uWzJdO1xuICAgICAgICBpZihwb3NpdGlvblsyXSA8IHNtYWxsZXN0Wikgc21hbGxlc3RaID0gcG9zaXRpb25bMl07XG5cbiAgICAgICAgaWYoZ3JlYXRlc3RYID09PSBzbWFsbGVzdFgpIHtcbiAgICAgICAgICAgIHNtYWxsZXN0WCAtPSBib3VuZGFyeVBhZGRpbmc7XG4gICAgICAgICAgICBncmVhdGVzdFggKz0gYm91bmRhcnlQYWRkaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc21hbGxlc3RaIC09IGJvdW5kYXJ5UGFkZGluZztcbiAgICAgICAgICAgIGdyZWF0ZXN0WiArPSBib3VuZGFyeVBhZGRpbmc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXByZXNlbnQgYm91bmRhcnkgYXMgW3gxLCB4MiwgejEsIHoyXTtcbiAgICAgICAgLy8gdGhpcyB3aWxsIG5vdCB3b3JrIGZvciBkaWFnb25hbCB3YWxscy4uLlxuICAgICAgICBib3VuZGFyaWVzLnB1c2goW3NtYWxsZXN0WCwgZ3JlYXRlc3RYLCBzbWFsbGVzdFosIGdyZWF0ZXN0Wl0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaW5pdE1hdHJpY2VzICgpIHtcblx0dGhpcy5tdk1hdHJpeCA9IG1hdDQuY3JlYXRlKCk7XG4gICAgdGhpcy5tdk1hdHJpeFN0YWNrID0gW107XG4gICAgdGhpcy5wTWF0cml4ID0gbWF0NC5jcmVhdGUoKTtcbn1cblxuZnVuY3Rpb24gZGVnVG9SYWQoZGVncmVlcykge1xuICAgIHJldHVybiBkZWdyZWVzICogTWF0aC5QSSAvIDE4MDtcbn1cblxuZnVuY3Rpb24gbXZQb3BNYXRyaXgoKSB7XG4gICAgaWYgKG12TWF0cml4U3RhY2subGVuZ3RoID09IDApIHtcbiAgICAgICAgdGhyb3cgXCJJbnZhbGlkIHBvcE1hdHJpeCFcIjtcbiAgICB9XG4gICAgbXZNYXRyaXggPSBtdk1hdHJpeFN0YWNrLnBvcCgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyOyIsInZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG52YXIgVGltZXIgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vVXRpbGl0aWVzL1RpbWVyJyk7XG5cbnZhciBFbmdpbmUgICAgICAgICAgICAgPSB7fTtcblxuRW5naW5lLmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbkVuZ2luZS5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoRW5naW5lLCBFbmdpbmUuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihFbmdpbmUsIEVuZ2luZS5ldmVudE91dHB1dCk7XG5cbkVuZ2luZS5jdXJyZW50U3RhdGUgPSBudWxsO1xuXG5FbmdpbmUuc2V0U3RhdGUgICAgID0gZnVuY3Rpb24gc2V0U3RhdGUoc3RhdGUpXG57XG5cdGlmIChzdGF0ZS5pbml0aWFsaXplKSBzdGF0ZS5pbml0aWFsaXplKCk7XG5cdFxuXHRpZiAodGhpcy5jdXJyZW50U3RhdGUpXG5cdHtcblx0XHR0aGlzLmN1cnJlbnRTdGF0ZS51bnBpcGUoRW5naW5lLmV2ZW50SW5wdXQpO1xuXHRcdHRoaXMuY3VycmVudFN0YXRlLmhpZGUoKTtcblx0fVxuXG5cdHN0YXRlLnBpcGUodGhpcy5ldmVudElucHV0KTtcblx0c3RhdGUuc2hvdygpO1xuXG5cdHRoaXMuY3VycmVudFN0YXRlID0gc3RhdGU7XG59O1xuXG5FbmdpbmUuc3RlcCAgICAgICAgID0gZnVuY3Rpb24gc3RlcCh0aW1lKVxue1xuXHRUaW1lci51cGRhdGUoKTtcblx0dmFyIHN0YXRlID0gRW5naW5lLmN1cnJlbnRTdGF0ZTtcblx0aWYgKHN0YXRlKVxuXHR7XG5cdFx0aWYgKHN0YXRlLnVwZGF0ZSkgc3RhdGUudXBkYXRlKCk7XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRW5naW5lOyIsInZhciBBU1NFVF9UWVBFID0gJ2ltYWdlJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIEltYWdlTG9hZGVyICA9IHt9O1xudmFyIEltYWdlcyAgICAgICA9IHt9O1xuXG5JbWFnZUxvYWRlci5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5JbWFnZUxvYWRlci5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoSW1hZ2VMb2FkZXIsIEltYWdlTG9hZGVyLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoSW1hZ2VMb2FkZXIsIEltYWdlTG9hZGVyLmV2ZW50T3V0cHV0KTtcblxuSW1hZ2VMb2FkZXIubG9hZCA9IGZ1bmN0aW9uIGxvYWQoYXNzZXQpXG57XG4gICAgdmFyIHNvdXJjZSA9IGFzc2V0LnNvdXJjZTtcbiAgICBpZiAoIUltYWdlc1tzb3VyY2VdKVxuICAgIHtcbiAgICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGltYWdlLnNyYyA9IHNvdXJjZTtcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmaW5pc2hlZExvYWRpbmcoc291cmNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgSW1hZ2VzW3NvdXJjZV0gPSBpbWFnZTtcbiAgICB9XG59O1xuXG5JbWFnZUxvYWRlci5nZXQgID0gZnVuY3Rpb24gZ2V0KHNvdXJjZSlcbntcbiAgICByZXR1cm4gSW1hZ2VzW3NvdXJjZV07XG59O1xuXG5JbWFnZUxvYWRlci50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKClcbntcbiAgICByZXR1cm4gQVNTRVRfVFlQRTtcbn07XG5cbmZ1bmN0aW9uIGZpbmlzaGVkTG9hZGluZyhzb3VyY2UpXG57XG4gICAgSW1hZ2VMb2FkZXIuZXZlbnRPdXRwdXQuZW1pdCgnZG9uZUxvYWRpbmcnLCB7c291cmNlOiBzb3VyY2UsIHR5cGU6IEFTU0VUX1RZUEV9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZUxvYWRlcjsiLCJ2YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgVmlld3BvcnQgPSB7fTtcblxuVmlld3BvcnQuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuVmlld3BvcnQuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKFZpZXdwb3J0LCBWaWV3cG9ydC5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKFZpZXdwb3J0LCBWaWV3cG9ydC5ldmVudE91dHB1dCk7XG5cbndpbmRvdy5vbnJlc2l6ZSA9IGhhbmRsZVJlc2l6ZTtcblxuZnVuY3Rpb24gaGFuZGxlUmVzaXplKClcbntcblx0Vmlld3BvcnQuZXZlbnRPdXRwdXQuZW1pdCgncmVzaXplJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld3BvcnQ7IiwidmFyIEFTU0VUX1RZUEUgPSAneG1sJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIFhNTExvYWRlciAgPSB7fTtcbnZhciBTdG9yYWdlICA9IHt9O1xuXG5YTUxMb2FkZXIuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuWE1MTG9hZGVyLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihYTUxMb2FkZXIsIFhNTExvYWRlci5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKFhNTExvYWRlciwgWE1MTG9hZGVyLmV2ZW50T3V0cHV0KTtcblxuWE1MTG9hZGVyLmxvYWQgPSBmdW5jdGlvbiBsb2FkKGFzc2V0KVxue1xuICAgIHZhciBzb3VyY2UgPSBhc3NldC5zb3VyY2U7XG4gICAgaWYgKCFTdG9yYWdlW3NvdXJjZV0pXG4gICAge1xuICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICByZXF1ZXN0Lm9wZW4oJ0dFVCcsIHNvdXJjZSk7XG4gICAgICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgaWYocmVzcG9uc2UuY3VycmVudFRhcmdldC5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgU3RvcmFnZVtzb3VyY2VdID0gcmVzcG9uc2UuY3VycmVudFRhcmdldC5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICAgICAgZmluaXNoZWRMb2FkaW5nKHNvdXJjZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgfVxufTtcblxuWE1MTG9hZGVyLmdldCAgPSBmdW5jdGlvbiBnZXQoc291cmNlKVxue1xuICAgIHJldHVybiBTdG9yYWdlW3NvdXJjZV07XG59O1xuXG5YTUxMb2FkZXIudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpXG57XG4gICAgcmV0dXJuIEFTU0VUX1RZUEU7XG59O1xuXG5mdW5jdGlvbiBmaW5pc2hlZExvYWRpbmcoc291cmNlKVxue1xuICAgIFhNTExvYWRlci5ldmVudE91dHB1dC5lbWl0KCdkb25lTG9hZGluZycsIHtzb3VyY2U6IHNvdXJjZSwgdHlwZTogQVNTRVRfVFlQRX0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFhNTExvYWRlcjsiLCJ2YXIgS0VZX01BUCA9IHJlcXVpcmUoJy4va2V5bWFwLmpzJyk7XG52YXIgS2V5SGFuZGxlciA9IHt9O1xuXG5LZXlIYW5kbGVyLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xuXHR0aGlzLl9hY3RpdmVLZXlzID0ge307XG5cdHRoaXMuX2hhbmRsZXJzID0ge307XG5cdHRoaXMuX3VwZGF0ZUZucyA9IFtdO1xuXHR0aGlzLl9wcmVzcyA9IHt9O1xuXG5cdHRoaXMuRVZFTlRUWVBFUyA9IHtcblx0XHQnUFJFU1MnIDogdGhpcy5fcHJlc3Ncblx0fVxuXG5cdHRoaXMuYm91bmRLZXlEb3duID0gcmVnaXN0ZXJLZXlEb3duLmJpbmQodGhpcyk7XG5cdHRoaXMuYm91bmRLZXlVcCA9IHJlZ2lzdGVyS2V5VXAuYmluZCh0aGlzKTtcblxuXHRkb2N1bWVudC5vbmtleWRvd24gPSB0aGlzLmJvdW5kS2V5RG93bjtcblx0ZG9jdW1lbnQub25rZXl1cCA9IHRoaXMuYm91bmRLZXlVcDtcbn1cblxuS2V5SGFuZGxlci51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoKSB7XG5cdHZhciBoYW5kbGVycztcblx0dmFyIGhhbmRsZXJzTGVuZ3RoO1xuXHR2YXIgdXBkYXRlc0xlbmd0aCA9IHRoaXMuX3VwZGF0ZUZucy5sZW5ndGg7XG5cdHZhciBpO1xuXHRcblx0Zm9yKHZhciBrZXkgaW4gdGhpcy5fYWN0aXZlS2V5cyl7XG5cdFx0aWYodGhpcy5fYWN0aXZlS2V5c1trZXldID09PSB0cnVlKXtcblx0XHRcdGhhbmRsZXJzID0gdGhpcy5faGFuZGxlcnNba2V5XTtcblx0XHRcdGlmKGhhbmRsZXJzKSB7XG5cdFx0XHRcdGhhbmRsZXJzTGVuZ3RoID0gaGFuZGxlcnMubGVuZ3RoO1xuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgaGFuZGxlcnNMZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGhhbmRsZXJzW2ldKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHVwZGF0ZXNMZW5ndGg7IGkrKykge1xuXHRcdHRoaXMuX3VwZGF0ZUZuc1tpXSh0aGlzLl9hY3RpdmVLZXlzKTtcblx0fVxufVxuXG5LZXlIYW5kbGVyLm9uID0gZnVuY3Rpb24gb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuXHRldmVudE5hbWUgPSBldmVudE5hbWUudG9VcHBlckNhc2UoKTtcblx0aWYoIGV2ZW50TmFtZS5pbmRleE9mKCc6JykgIT09IC0xICkge1xuXHRcdHZhciBldmVudE5hbWUgPSBldmVudE5hbWUuc3BsaXQoJzonKTtcblx0XHR2YXIga2V5ID0gZXZlbnROYW1lWzBdO1xuXHRcdHZhciB0eXBlID0gZXZlbnROYW1lWzFdO1xuXHRcdHZhciBzdG9yYWdlID0gdGhpcy5FVkVOVFRZUEVTW2V2ZW50TmFtZVsxXV07XG5cdFx0aWYoICFzdG9yYWdlICkgdGhyb3cgXCJpbnZhbGlkIGV2ZW50VHlwZVwiO1xuXHRcdGlmKCAhc3RvcmFnZVtrZXldICkgc3RvcmFnZVtrZXldID0gW107XG5cdFx0c3RvcmFnZVtrZXldLnB1c2goY2FsbGJhY2spO1xuXHR9XG5cdGVsc2UgaWYoIEtFWV9NQVAubGV0dGVyc1tldmVudE5hbWVdICkge1xuXHRcdGlmKCF0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdKSB0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdID0gW107XG5cdFx0dGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcblx0fVxuXHRlbHNlIGlmIChldmVudE5hbWUgPT09IFwiVVBEQVRFXCIpIHtcblx0XHR0aGlzLl91cGRhdGVGbnMucHVzaChjYWxsYmFjayk7XG5cdH1cblx0ZWxzZSB0aHJvdyBcImludmFsaWQgZXZlbnROYW1lXCI7XG59XG5cbktleUhhbmRsZXIub2ZmID0gZnVuY3Rpb24gb2ZmKGtleSwgY2FsbGJhY2spIHtcblx0dmFyIGNhbGxiYWNrSW5kZXg7XG5cdHZhciBjYWxsYmFja3M7XG5cblx0aWYodGhpcy5faGFuZGxlcnNba2V5XSkge1xuXHRcdGNhbGxiYWNrcyA9IHRoaXMuX2hhbmRsZXJzW2tleV07XG5cdFx0Y2FsbGJhY2tJbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcblx0XHRpZihjYWxsYmFja0luZGV4ICE9PSAtMSkge1xuXHRcdFx0Y2FsbGJhY2tzLnNwbGljZShjYWxsYmFja0luZGV4LCAxKTtcblx0XHRcdGlmKCFjYWxsYmFja3MubGVuZ3RoKSB7XG5cdFx0XHRcdGRlbGV0ZSBjYWxsYmFja3M7XG5cdFx0XHRcdGRlbGV0ZSB0aGlzLl9hY3RpdmVLZXlzW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyS2V5RG93bihldmVudCkge1xuXHR2YXIga2V5TmFtZSA9IEtFWV9NQVAua2V5c1tldmVudC5rZXlDb2RlXTtcblx0dmFyIHByZXNzRXZlbnRzID0gdGhpcy5fcHJlc3Nba2V5TmFtZV07XG5cdGlmIChrZXlOYW1lKSB0aGlzLl9hY3RpdmVLZXlzW2tleU5hbWVdID0gdHJ1ZTtcblx0aWYgKHByZXNzRXZlbnRzKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBwcmVzc0V2ZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0cHJlc3NFdmVudHNbaV0oKTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJLZXlVcChldmVudCkge1xuXHR2YXIga2V5TmFtZSA9IEtFWV9NQVAua2V5c1tldmVudC5rZXlDb2RlXTtcblx0aWYgKGtleU5hbWUpIHRoaXMuX2FjdGl2ZUtleXNba2V5TmFtZV0gPSBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBLZXlIYW5kbGVyOyIsInZhciBNb3VzZVRyYWNrZXIgPSB7fTtcblxuTW91c2VUcmFja2VyLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xuXHR0aGlzLl9tb3VzZVBvc2l0aW9uID0gWzAsIDBdO1xuXHR0aGlzLl9oYW5kbGVycyA9IFtdO1xuXHR0aGlzLl91cGRhdGVGbnMgPSBbXTtcblx0dGhpcy5fY3VycmVudFZlbG9jaXR5ID0gWzAsIDBdO1xuXHR0aGlzLl9sYXN0UG9zaXRpb24gPSBbMCwgMF07XG5cdHRoaXMuX2xhc3RUaW1lID0gRGF0ZS5ub3coKTtcblxuXHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZU1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcbn1cblxuTW91c2VUcmFja2VyLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcblx0aWYgKCF0aGlzLl91cGRhdGVkKSB0aGlzLl9jdXJyZW50VmVsb2NpdHkgPSBbMCwgMF07XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl91cGRhdGVGbnMubGVuZ3RoOyBpKyspIHtcblx0XHR0aGlzLl91cGRhdGVGbnNbaV0oIHRoaXMuX2N1cnJlbnRWZWxvY2l0eSApO1xuXHR9XG5cblx0dGhpcy5fdXBkYXRlZCA9IGZhbHNlO1xufTtcblxuTW91c2VUcmFja2VyLm9uID0gZnVuY3Rpb24gb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuXHRldmVudE5hbWUgPSBldmVudE5hbWUudG9VcHBlckNhc2UoKTtcblx0aWYoZXZlbnROYW1lID09PSAnVVBEQVRFJykgdGhpcy5fdXBkYXRlRm5zLnB1c2goY2FsbGJhY2spO1xufVxuXG5Nb3VzZVRyYWNrZXIuZ2V0TW91c2VQb3NpdGlvbiA9IGZ1bmN0aW9uIGdldE1vdXNlUG9zaXRpb24oKSB7XG5cdHJldHVybiB0aGlzLl9tb3VzZVBvc2l0aW9uO1xufVxuXG5Nb3VzZVRyYWNrZXIuaGFuZGxlTW91c2VNb3ZlID0gZnVuY3Rpb24gaGFuZGxlTW91c2VNb3ZlKGV2ZW50KSB7XG5cdHZhciBjdXJyZW50VGltZSA9IERhdGUubm93KCk7XG5cdHZhciBkdXJhdGlvbiA9IGN1cnJlbnRUaW1lIC0gdGhpcy5fbGFzdFRpbWU7XG5cblx0dmFyIGN1cnJlbnRQb3NpdGlvbiA9IFtcblx0XHQoZXZlbnQueCAvIGlubmVyV2lkdGgpIC0gMC41LFxuXHRcdChldmVudC55IC8gaW5uZXJIZWlnaHQpIC0gMC41XG5cdF07XG5cblx0dGhpcy5fY3VycmVudFZlbG9jaXR5ID0gW1xuXHRcdCh0aGlzLl9sYXN0UG9zaXRpb25bMF0gLSBjdXJyZW50UG9zaXRpb25bMF0pIC8gKDEwLjAgKiBkdXJhdGlvbiksXG5cdFx0KHRoaXMuX2xhc3RQb3NpdGlvblsxXSAtIGN1cnJlbnRQb3NpdGlvblsxXSkgLyAoMTAuMCAqIGR1cmF0aW9uKVxuXHRdO1xuXG5cdHRoaXMuX2xhc3RQb3NpdGlvbiA9IGN1cnJlbnRQb3NpdGlvbjtcblx0dGhpcy5fbGFzdFRpbWUgPSBjdXJyZW50VGltZTtcblx0dGhpcy5fdXBkYXRlZCA9IHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW91c2VUcmFja2VyOyIsIm1vZHVsZS5leHBvcnRzID0gXG57XG4gICdsZXR0ZXJzJyA6IHtcbiAgICAgJ0EnOiA2NSxcbiAgICAgJ0InOiA2NixcbiAgICAgJ0MnOiA2NyxcbiAgICAgJ0QnOiA2OCxcbiAgICAgJ0UnOiA2OSxcbiAgICAgJ0YnOiA3MCxcbiAgICAgJ0cnOiA3MSxcbiAgICAgJ0gnOiA3MixcbiAgICAgJ0knOiA3MyxcbiAgICAgJ0onOiA3NCxcbiAgICAgJ0snOiA3NSxcbiAgICAgJ0wnOiA3NixcbiAgICAgJ00nOiA3NyxcbiAgICAgJ04nOiA3OCxcbiAgICAgJ08nOiA3OSxcbiAgICAgJ1AnOiA4MCxcbiAgICAgJ1EnOiA4MSxcbiAgICAgJ1InOiA4MixcbiAgICAgJ1MnOiA4MyxcbiAgICAgJ1QnOiA4NCxcbiAgICAgJ1UnOiA4NSxcbiAgICAgJ1YnOiA4NixcbiAgICAgJ1cnOiA4NyxcbiAgICAgJ1gnOiA4OCxcbiAgICAgJ1knOiA4OSxcbiAgICAgJ1onOiA5MCxcbiAgICAgJ0VOVEVSJzogMTMsXG4gICAgICdTSElGVCc6IDE2LFxuICAgICAnRVNDJzogMjcsXG4gICAgICdTUEFDRSc6IDMyLFxuICAgICAnTEVGVCc6IDM3LFxuICAgICAnVVAnOiAzOCxcbiAgICAgJ1JJR0hUJzogMzksXG4gICAgICdET1dOJyA6IDQwXG4gIH0sXG4gICdrZXlzJyA6IHtcbiAgICAgNjUgOiAnQScsXG4gICAgIDY2IDogJ0InLFxuICAgICA2NyA6ICdDJyxcbiAgICAgNjggOiAnRCcsXG4gICAgIDY5IDogJ0UnLFxuICAgICA3MCA6ICdGJyxcbiAgICAgNzEgOiAnRycsXG4gICAgIDcyIDogJ0gnLFxuICAgICA3MyA6ICdJJyxcbiAgICAgNzQgOiAnSicsXG4gICAgIDc1IDogJ0snLFxuICAgICA3NiA6ICdMJyxcbiAgICAgNzcgOiAnTScsXG4gICAgIDc4IDogJ04nLFxuICAgICA3OSA6ICdPJyxcbiAgICAgODAgOiAnUCcsXG4gICAgIDgxIDogJ1EnLFxuICAgICA4MiA6ICdSJyxcbiAgICAgODMgOiAnUycsXG4gICAgIDg0IDogJ1QnLFxuICAgICA4NSA6ICdVJyxcbiAgICAgODYgOiAnVicsXG4gICAgIDg3IDogJ1cnLFxuICAgICA4OCA6ICdYJyxcbiAgICAgODkgOiAnWScsXG4gICAgIDkwIDogJ1onLFxuICAgICAxMyA6ICdFTlRFUicsXG4gICAgIDE2IDogJ1NISUZUJyxcbiAgICAgMjcgOiAnRVNDJyxcbiAgICAgMzIgOiAnU1BBQ0UnLFxuICAgICAzNyA6ICdMRUZUJyxcbiAgICAgMzggOiAnVVAnLFxuICAgICAzOSA6ICdSSUdIVCcsXG4gICAgIDQwIDogJ0RPV04nXG4gIH1cbn0iLCJ2YXIgQ09NUExFVEUgPSBcImNvbXBsZXRlXCI7XG52YXIgTE9BRF9TVEFSVEVEID0gXCJzdGFydExvYWRpbmdcIjtcbnZhciBMT0FEX0NPTVBMRVRFRCA9IFwiZG9uZUxvYWRpbmdcIjtcbnZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIExvYWRpbmcgICAgICAgICAgPSB7fTtcbnZhciBib2R5UmVhZHkgICAgICAgID0gZmFsc2U7XG52YXIgYXNzZXRTdGFjayAgICAgICA9IFtdO1xudmFyIGxvYWRlclJlZ2lzdHJ5ICAgPSB7fTtcbnZhciBjb250YWluZXIgICAgICAgID0gbnVsbDtcbnZhciBzcGxhc2hTY3JlZW4gICAgID0gbmV3IEltYWdlKCk7XG5zcGxhc2hTY3JlZW4uc3JjICAgICA9ICcuLi8uLi9Bc3NldHMvTG9hZGluZy4uLi5wbmcnO1xuc3BsYXNoU2NyZWVuLndpZHRoICAgPSBzcGxhc2hXaWR0aCA9IDUwMDtcbnNwbGFzaFNjcmVlbi5oZWlnaHQgID0gc3BsYXNoSGVpZ2h0ID0gMTYwO1xuTG9hZGluZy5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5Mb2FkaW5nLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihMb2FkaW5nLCBMb2FkaW5nLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoTG9hZGluZywgTG9hZGluZy5ldmVudE91dHB1dCk7XG5cbkxvYWRpbmcuZXZlbnRJbnB1dC5vbihMT0FEX0NPTVBMRVRFRCwgaGFuZGxlQ29tcGxldGVkTG9hZCk7XG5Mb2FkaW5nLmV2ZW50SW5wdXQub24oJ3Jlc2l6ZScsIGhhbmRsZVJlc2l6ZSk7XG5cbkxvYWRpbmcuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uIGluaXRpYWxpemUoKVxue1xuICAgIGlmICghY29udGFpbmVyKVxuICAgIHtcbiAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRpbmcnKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHNwbGFzaFNjcmVlbik7XG4gICAgICAgIHNwbGFzaFNjcmVlbi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHNwbGFzaFNjcmVlbi5zdHlsZS50b3AgPSAod2luZG93LmlubmVySGVpZ2h0ICogMC41KSAtIChzcGxhc2hIZWlnaHQgKiAwLjUpICsgJ3B4JztcbiAgICAgICAgc3BsYXNoU2NyZWVuLnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKHNwbGFzaFdpZHRoKiAwLjUpICsgJ3B4JztcbiAgICB9XG4gICAgaWYgKGFzc2V0U3RhY2subGVuZ3RoKVxuICAgIHtcbiAgICAgICAgdGhpcy5ldmVudE91dHB1dC5lbWl0KExPQURfU1RBUlRFRCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXNzZXRTdGFjay5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGFzc2V0ICA9IGFzc2V0U3RhY2tbaV07XG4gICAgICAgICAgICB2YXIgbG9hZGVyID0gYXNzZXQudHlwZTtcbiAgICAgICAgICAgIGxvYWRlclJlZ2lzdHJ5W2xvYWRlcl0ubG9hZChhc3NldCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5Mb2FkaW5nLmxvYWQgICAgICAgPSBmdW5jdGlvbiBsb2FkKGFzc2V0KVxue1xuICAgIGlmKEFycmF5LmlzQXJyYXkoYXNzZXQpKVxuICAgIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoYXNzZXRTdGFjaywgYXNzZXQpO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICBhc3NldFN0YWNrLnB1c2goYXNzZXQpO1xuICAgIH1cbn07XG5cbkxvYWRpbmcuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gVklTSUJMRTtcbn07XG5cbkxvYWRpbmcuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gTk9ORTtcbn07XG5cbkxvYWRpbmcucmVnaXN0ZXIgICA9IGZ1bmN0aW9uIHJlZ2lzdGVyKGxvYWRlcilcbntcbiAgICB2YXIgbG9hZGVyTmFtZSAgICAgICAgICAgICA9IGxvYWRlci50b1N0cmluZygpO1xuICAgIGxvYWRlclJlZ2lzdHJ5W2xvYWRlck5hbWVdID0gbG9hZGVyO1xuICAgIGxvYWRlci5waXBlKHRoaXMuZXZlbnRJbnB1dCk7XG59O1xuXG5mdW5jdGlvbiBoYW5kbGVDb21wbGV0ZWRMb2FkKGRhdGEpXG57XG4gICAgdmFyIHNvdXJjZSA9IGRhdGEuc291cmNlO1xuICAgIHZhciBsb2NhdGlvbiA9IGFzc2V0U3RhY2suaW5kZXhPZihzb3VyY2UpO1xuICAgIGlmIChsb2NhdGlvbikgYXNzZXRTdGFjay5zcGxpY2UobG9jYXRpb24sIDEpO1xuICAgIGlmICghYXNzZXRTdGFjay5sZW5ndGgpIExvYWRpbmcuZXZlbnRPdXRwdXQuZW1pdChMT0FEX0NPTVBMRVRFRCk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVJlc2l6ZSgpXG57XG4gICAgc3BsYXNoU2NyZWVuLnN0eWxlLnRvcCA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjUpIC0gKHNwbGFzaEhlaWdodCAqIDAuNSkgKyAncHgnO1xuICAgIHNwbGFzaFNjcmVlbi5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtIChzcGxhc2hXaWR0aCogMC41KSArICdweCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTG9hZGluZzsiLCJ2YXIgTk9ORSA9ICdub25lJztcbnZhciBWSVNJQkxFID0gJ2lubGluZSc7XG5cbnZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbnZhciBNZW51ICAgICAgICAgID0ge307XG5cbk1lbnUuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuTWVudS5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoTWVudSwgTWVudS5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKE1lbnUsIE1lbnUuZXZlbnRPdXRwdXQpO1xuXG5NZW51LmV2ZW50SW5wdXQub24oJ3Jlc2l6ZScsIGhhbmRsZVJlc2l6ZSk7XG5cbnZhciBtZW51RWxlbWVudCA9IG51bGwsXG5jb250YWluZXIgICAgICAgPSBudWxsLFxubmV3R2FtZSAgICAgICAgID0gbnVsbDtcblxuTWVudS5pbml0aWFsaXplID0gZnVuY3Rpb24gaW5pdGlhbGl6ZSgpXG57XG4gICAgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lbnUnKTtcbiAgICBtZW51RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG1lbnVFbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBuZXdHYW1lICAgICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG5ld0dhbWUub25jbGljayA9IHN0YXJ0TmV3R2FtZTtcbiAgICBuZXdHYW1lLmlubmVySFRNTCA9ICdOZXcgR2FtZSc7XG4gICAgbmV3R2FtZS5zdHlsZS5mb250U2l6ZSA9ICc1MHB4JztcbiAgICBuZXdHYW1lLnN0eWxlLmZvbnRGYW1pbHkgPSAnSGVsdmV0aWNhJztcbiAgICBuZXdHYW1lLnN0eWxlLmNvbG9yID0gJyNGRkYnO1xuICAgIG1lbnVFbGVtZW50LmFwcGVuZENoaWxkKG5ld0dhbWUpO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChtZW51RWxlbWVudCk7XG4gICAgbWVudUVsZW1lbnQuc3R5bGUudG9wICA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjUpIC0gKDU4ICogMC41KSArICdweCc7XG4gICAgbWVudUVsZW1lbnQuc3R5bGUubGVmdCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuNSkgLSAoMjUxICogMC41KSArICdweCc7XG59O1xuXG5NZW51LnNob3cgICAgICAgPSBmdW5jdGlvbiBzaG93KClcbntcbiAgICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFZJU0lCTEU7XG59O1xuXG5NZW51LmhpZGUgICAgICAgPSBmdW5jdGlvbiBoaWRlKClcbntcbiAgICBjb250YWluZXIuc3R5bGUuZGlzcGxheSA9IE5PTkU7XG59O1xuXG5mdW5jdGlvbiBoYW5kbGVSZXNpemUoKVxue1xuICAgIG1lbnVFbGVtZW50LnN0eWxlLnRvcCA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjUpIC0gKDU4ICogMC41KSArICdweCc7XG4gICAgbWVudUVsZW1lbnQuc3R5bGUubGVmdCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuNSkgLSAoMjUxICogMC41KSArICdweCc7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0TmV3R2FtZSgpXG57XG4gICAgTWVudS5ldmVudE91dHB1dC5lbWl0KCduZXdHYW1lJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWVudTsiLCJ2YXIgTk9ORSA9ICdub25lJztcbnZhciBWSVNJQkxFID0gJ2lubGluZSc7XG5cbnZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG52YXIgS2V5SGFuZGxlciAgICAgICAgID0gcmVxdWlyZSgnLi4vSW5wdXRzL0tleUhhbmRsZXInKTtcbnZhciBNb3VzZVRyYWNrZXIgICAgICAgPSByZXF1aXJlKCcuLi9JbnB1dHMvTW91c2VUcmFja2VyJyk7XG52YXIgUmVuZGVyZXIgICAgICAgICAgID0gcmVxdWlyZSgnLi4vR0wvUmVuZGVyZXInKTtcbnZhciBJbWFnZUxvYWRlciAgICAgICAgPSByZXF1aXJlKCcuLi9HYW1lL0ltYWdlTG9hZGVyJyk7XG5cbnZhciBQbGF5aW5nICAgICAgICAgICAgPSB7fTtcblxuUGxheWluZy5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5QbGF5aW5nLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihQbGF5aW5nLCBQbGF5aW5nLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoUGxheWluZywgUGxheWluZy5ldmVudE91dHB1dCk7XG5cblBsYXlpbmcuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uIGluaXRpYWxpemUoKVxue1xuXHRLZXlIYW5kbGVyLmluaXQoKTtcblx0TW91c2VUcmFja2VyLmluaXQoKTtcblx0dGhpcy5yZW5kZXJlciA9IG5ldyBSZW5kZXJlcih7XG5cdFx0dGV4dHVyZXM6IFtcblx0XHRcdCcuLi9Bc3NldHMvbWV0YWwyLnBuZycsXG5cdFx0XHQnLi4vQXNzZXRzL2hhbmRzU3ByaXRlc2hlZXQucG5nJyxcblx0XHRcdCcuLi9Bc3NldHMvYWxpZW5TcHJpdGUucG5nJ1xuXHRcdF1cblx0fSk7XG59O1xuXG5QbGF5aW5nLnVwZGF0ZSAgICAgPSBmdW5jdGlvbiB1cGRhdGUoKVxue1xuXHRLZXlIYW5kbGVyLnVwZGF0ZSgpO1xuXHRNb3VzZVRyYWNrZXIudXBkYXRlKCk7XG5cdHRoaXMucmVuZGVyZXIudXBkYXRlKCk7XG59O1xuXG5QbGF5aW5nLnNob3cgICAgICAgPSBmdW5jdGlvbiBzaG93KClcbntcbn07XG5cblBsYXlpbmcuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5aW5nOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIF9zdGFja3M6IHt9LFxuXG4gICAgcmVnaXN0ZXJTdGFjazogZnVuY3Rpb24gcmVnaXN0ZXJTdGFjayhzdGFja05hbWUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3N0YWNrc1tzdGFja05hbWVdKSB0aHJvdyAnU3RhY2sgJyArIHN0YWNrTmFtZSArICcgYWxyZWFkeSBleGlzdHMhJztcbiAgICAgICAgZWxzZSB0aGlzLl9zdGFja3Nbc3RhY2tOYW1lXSA9IFtdO1xuICAgIH0sXG5cbiAgICBwdXNoTWF0cml4OiBmdW5jdGlvbiBwdXNoTWF0cml4KG1hdHJpeCwgc3RhY2tOYW1lKSB7XG4gICAgICAgIHZhciBjb3B5ID0gbWF0NC5jcmVhdGUoKTtcbiAgICAgICAgbWF0NC5zZXQobWF0cml4LCBjb3B5KTtcbiAgICAgICAgdGhpcy5fc3RhY2tzW3N0YWNrTmFtZV0ucHVzaChjb3B5KTtcbiAgICB9LFxuXG4gICAgcG9wTWF0cml4OiBmdW5jdGlvbiBwb3BNYXRyaXgoc3RhY2tOYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLl9zdGFja3Nbc3RhY2tOYW1lXS5sZW5ndGggPT09IDApIHRocm93IFwiSW52YWxpZCBwb3BNYXRyaXghXCI7XG4gICAgICAgIG12TWF0cml4ID0gdGhpcy5fc3RhY2tzW3N0YWNrTmFtZV0ucG9wKCk7XG4gICAgfVxufSIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRfb25jZTogW10sXG5cdF9ldmVyeTogW10sXG5cblx0dXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoKXtcblx0XHR2YXIgY3VycmVudFRpbWUgPSBEYXRlLm5vdygpO1xuXHRcdHZhciB0aW1lckV2ZW50O1xuXHRcdGlmKCF0aGlzLl9pbml0aWFsVGltZSkgdGhpcy5faW5pdGlhbFRpbWUgPSBjdXJyZW50VGltZTtcblx0XHR0aGlzLl9lbGFwc2VkID0gY3VycmVudFRpbWUgLSB0aGlzLl9pbml0aWFsVGltZTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fb25jZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYodGhpcy5fZWxhcHNlZCA+IHRoaXMuX29uY2VbaV0udHJpZ2dlcikge1xuXHRcdFx0XHR0aW1lckV2ZW50ID0gdGhpcy5fb25jZVtpXTtcblx0XHRcdFx0dGltZXJFdmVudC5jYWxsYmFjaygpO1xuXHRcdFx0XHR0aGlzLl9vbmNlLnNwbGljZShpLCAxKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2V2ZXJ5Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZih0aGlzLl9lbGFwc2VkID4gdGhpcy5fZXZlcnlbaV0udHJpZ2dlcikge1xuXHRcdFx0XHR0aW1lckV2ZW50ID0gdGhpcy5fZXZlcnlbaV07XG5cdFx0XHRcdHRpbWVyRXZlbnQuY2FsbGJhY2soKTtcblx0XHRcdFx0dGltZXJFdmVudC50cmlnZ2VyID0gdGhpcy5fZWxhcHNlZCArIHRpbWVyRXZlbnQudGltZW91dFxuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRnZXRFbGFwc2VkOiBmdW5jdGlvbiBnZXRFbGFwc2VkKCkge1xuXHRcdHJldHVybiB0aGlzLl9lbGFwc2VkO1xuXHR9LFxuXG5cdGFmdGVyOiBmdW5jdGlvbiBhZnRlcihjYWxsYmFjaywgdGltZW91dCkge1xuXHRcdHRoaXMuX29uY2UucHVzaCh7XG5cdFx0XHRjYWxsYmFjazogY2FsbGJhY2ssXG5cdFx0XHR0cmlnZ2VyOiB0aGlzLl9lbGFwc2VkICsgdGltZW91dFxuXHRcdH0pO1xuXHR9LFxuXG5cdGV2ZXJ5OiBmdW5jdGlvbiBldmVyeShjYWxsYmFjaywgdGltZW91dCkge1xuXHRcdHRoaXMuX2V2ZXJ5LnB1c2goe1xuXHRcdFx0Y2FsbGJhY2s6IGNhbGxiYWNrLFxuXHRcdFx0dHJpZ2dlcjogdGhpcy5fZWxhcHNlZCArIHRpbWVvdXQsXG5cdFx0XHR0aW1lb3V0OiB0aW1lb3V0XG5cdFx0fSlcblx0fVxufTsiLCJ2YXIgRW5naW5lICA9IHJlcXVpcmUoJy4vR2FtZS9FbmdpbmUnKTtcbnZhciBMb2FkaW5nID0gcmVxdWlyZSgnLi9TdGF0ZXMvTG9hZGluZycpO1xudmFyIE1lbnUgICAgPSByZXF1aXJlKCcuL1N0YXRlcy9NZW51Jyk7XG52YXIgUGxheWluZyA9IHJlcXVpcmUoJy4vU3RhdGVzL1BsYXlpbmcnKTtcbnZhciBFdmVudEhhbmRsZXIgPSByZXF1aXJlKCcuL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcbnZhciBJbWFnZUxvYWRlciAgPSByZXF1aXJlKCcuL0dhbWUvSW1hZ2VMb2FkZXInKTtcbnZhciBYTUxMb2FkZXIgICAgPSByZXF1aXJlKCcuL0dhbWUvWE1MTG9hZGVyJyk7XG52YXIgVmlld3BvcnQgICAgID0gcmVxdWlyZSgnLi9HYW1lL1ZpZXdwb3J0Jyk7XG5cbnZhciBDb250cm9sbGVyID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5WaWV3cG9ydC5waXBlKE1lbnUpO1xuVmlld3BvcnQucGlwZShMb2FkaW5nKTtcblZpZXdwb3J0LnBpcGUoUGxheWluZyk7XG5cbkVuZ2luZS5waXBlKENvbnRyb2xsZXIpO1xuTWVudS5waXBlKENvbnRyb2xsZXIpO1xuTG9hZGluZy5waXBlKENvbnRyb2xsZXIpO1xuXG5Db250cm9sbGVyLm9uKCdkb25lTG9hZGluZycsIGdvVG9NZW51KTtcbkNvbnRyb2xsZXIub24oJ25ld0dhbWUnLCBzdGFydEdhbWUpO1xuXG52YXIgYXNzZXRzID0gW1xuXHR7XG5cdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRzb3VyY2U6ICcuLi9Bc3NldHMvbWV0YWwyLnBuZycsXG5cdFx0ZGF0YToge31cblx0fSx7XG5cdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRzb3VyY2U6ICcuLi9Bc3NldHMvaGFuZHNTcHJpdGVzaGVldC5wbmcnLFxuXHRcdGRhdGE6IHt9XG5cdH0se1xuXHRcdHR5cGU6ICd4bWwnLFxuXHRcdHNvdXJjZTogJy9TaGFkZXJzL1ZlcnRleFNoYWRlci5nbHNsJyxcblx0XHRkYXRhOiB7fVxuXHR9LHtcblx0XHR0eXBlOiAneG1sJyxcblx0XHRzb3VyY2U6ICcvU2hhZGVycy9GcmFnbWVudFNoYWRlci5nbHNsJyxcblx0XHRkYXRhOiB7fVxuXHR9LHtcblx0XHR0eXBlOiAneG1sJyxcblx0XHRzb3VyY2U6ICcvR2FtZURhdGEvd29ybGQuanNvbicsXG5cdFx0ZGF0YToge31cblx0fSx7XG5cdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRzb3VyY2U6ICcuLi9Bc3NldHMvYWxpZW5TcHJpdGUucG5nJyxcblx0XHRkYXRhOiB7fVxuXHR9XG5dXG5cbkxvYWRpbmcucmVnaXN0ZXIoSW1hZ2VMb2FkZXIpO1xuTG9hZGluZy5yZWdpc3RlcihYTUxMb2FkZXIpO1xuXG5Mb2FkaW5nLmxvYWQoYXNzZXRzKTtcblxuRW5naW5lLnNldFN0YXRlKExvYWRpbmcpO1xuXG5mdW5jdGlvbiBnb1RvTWVudSgpXG57XG4gICAgRW5naW5lLnNldFN0YXRlKE1lbnUpO1xufVxuXG5mdW5jdGlvbiBzdGFydEdhbWUoKVxue1xuXHRFbmdpbmUuc2V0U3RhdGUoUGxheWluZyk7XG59XG5cbmZ1bmN0aW9uIGxvb3AoKVxue1xuICAgIEVuZ2luZS5zdGVwKCk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xufVxuXG5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7Il19
