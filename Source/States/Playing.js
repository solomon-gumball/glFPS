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