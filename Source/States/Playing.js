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