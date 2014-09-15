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