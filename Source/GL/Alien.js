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