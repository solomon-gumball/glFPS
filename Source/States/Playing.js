var NONE = 'none';
var VISIBLE = 'inline';

var EventHandler       = require('../Events/EventHandler');
var FamousEngine       = require('../../Libraries/MixedMode/src/famous/core/Engine');
var Primitives         = require('../../Libraries/MixedMode/src/famous/gl/primitives');
var Material           = require('../../Libraries/MixedMode/src/famous/gl/materials');
// var ImageLoader        = require('../../')

var Playing          = {};

Playing.eventInput      = new EventHandler();
Playing.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Playing, Playing.eventInput);
EventHandler.setOutputHandler(Playing, Playing.eventOutput);

Playing.initialize = function initialize()
{
	this.container = document.getElementById('playing');
 	this.context = FamousEngine.createContext(this.container);
 	var planeNode = this.context.addChild();
 	var plane = planeNode.addComponent(Primitives.plane, {
 		size: [500, 500, 1]
 	});

 	planeNode.addComponent(Material, {
 		image: '/Assets/tile.png',
 		// fsChunk: {
 		// 	defines: '',
 		// 	apply: 'color = vec4(1, 0, 0, 1);'
 		// }
 	});

 	var offsetX = 0.1;
 	var offsetY = 0.1;

 	plane.coords = [
 		[offsetX + 0.2, offsetY + 0.2],
 		[offsetX + 0.0, offsetY + 0.2],
 		[offsetX + 0.2, offsetY + 0.0],
 		[offsetX + 0.0, offsetY + 0.0]
 	];
 	plane.compile();
};

Playing.update     = function update()
{
	FamousEngine.step();
};

Playing.show       = function show()
{
};

Playing.hide       = function hide()
{
};

module.exports = Playing;