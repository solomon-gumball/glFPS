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