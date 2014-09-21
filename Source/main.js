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