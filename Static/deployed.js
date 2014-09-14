(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/joseph/code/One/Libraries/MixedMode/node_modules/cssify/browser.js":[function(require,module,exports){
module.exports = function (css, customDocument) {
  var doc = customDocument || document;
  if (doc.createStyleSheet) {
    doc.createStyleSheet().cssText = css;
  } else {
    var head = doc.getElementsByTagName('head')[0],
        style = doc.createElement('style');

    style.type = 'text/css';
  
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(doc.createTextNode(css));
    }
    
    head.appendChild(style); 
  }
};

module.exports.byUrl = function(url) {
  if (document.createStyleSheet) {
    document.createStyleSheet(url);
  } else {
    var head = document.getElementsByTagName('head')[0],
        link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = url;
  
    head.appendChild(link); 
  }
};

},{}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Components/Camera.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var MatrixMath     = require('../../math/4x4matrix');
var OptionsManager = require('../OptionsManager');

// CONSTS
var COMPONENT_NAME = 'camera';
var PROJECTION     = 'projection';

/**
 * Camera
 *
 * @component Camera
 * @constructor
 * 
 * @param {Entity} entity  Entity that the Container is a component of
 * @param {Object} options [description]
 */
function Camera(entity, options) {
    this._entity              = entity;
    this._projectionTransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    this.options              = Object.create(Camera.DEFAULT_OPTIONS);
    this._optionsManager      = new OptionsManager(this.options);
    this._optionsManager.on('change', _eventsChange.bind(this)); //robust integration

    if (options) this.setOptions(options);

    _recalculateProjectionTransform.call(this);
}

Camera.DEFAULT_OPTIONS = {
    projection : {
        type    : 'pinhole',
        options : {
            focalPoint : [0, 0, -1000]
        }
    }
};

Camera.toString = function toString() {
    return COMPONENT_NAME;
};

Camera.projectionTransforms = {};

Camera.projectionTransforms.pinhole = function pinhole(transform, focalVector) {
    var contextSize   = this._entity.getContext()._size;
    var contextWidth  = contextSize[0];
    var contextHeight = contextSize[1];

    var focalDivide        = focalVector[2] ? 1/focalVector[2] : 0;
    var widthToHeightRatio = (contextWidth > contextHeight) ? contextWidth/contextHeight : 1;
    var heightToWidthRatio = (contextHeight > contextWidth) ? contextHeight/contextWidth : 1;

    var left   = -widthToHeightRatio;
    var right  = widthToHeightRatio;
    var top    = heightToWidthRatio;
    var bottom = -heightToWidthRatio;

    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);

    transform[0]  = -2 * lr;
    transform[1]  = 0;
    transform[2]  = 0;
    transform[3]  = 0;
    
    transform[4]  = 0;
    transform[5]  = -2 * bt;
    transform[6]  = 0;
    transform[7]  = 0;
   
    transform[8]  = -focalDivide * focalVector[0];
    transform[9]  = -focalDivide * focalVector[1];
    transform[10] = focalDivide;
    transform[11] = -focalDivide;
    
    transform[12] = 0;
    transform[13] = 0;
    transform[14] = 0;
    transform[15] = 1;

    return transform;
};

Camera.projectionTransforms.orthographic = function orthographic(transform) {
    var contextSize   = this._entity.getContext()._size;
    var contextWidth  = contextSize[0];
    var contextHeight = contextSize[1];

    var widthToHeightRatio = (contextWidth > contextHeight) ? contextWidth/contextHeight : 1;
    var heightToWidthRatio = (contextHeight > contextWidth) ? contextHeight/contextWidth : 1;

    var left   = -widthToHeightRatio;
    var right  = widthToHeightRatio;
    var top    = heightToWidthRatio;
    var bottom = -heightToWidthRatio;

    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);

    transform[0]  = -2 * lr;
    transform[1]  = 0;
    transform[2]  = 0;
    transform[3]  = 0;
    
    transform[4]  = 0;
    transform[5]  = -2 * bt;
    transform[6]  = 0;
    transform[7]  = 0;
    
    transform[8]  = 0;
    transform[9]  = 0;
    transform[10] = 2 * nf;
    transform[11] = 0;
    
    transform[12] = (left + right) * lr;
    transform[13] = (top + bottom) * bt;
    transform[14] = (far + near) * nf;
    transform[15] = 1;

    return transform;
};

Camera.projectionTransforms.perspective = function perspective(transform, fovy, near, far) {
    var contextSize   = this._entity.getContext()._size;
    var contextWidth  = contextSize[0];
    var contextHeight = contextSize[1];

    var aspect = contextWidth/contextHeight;

    var f  = 1.0 / Math.tan(fovy / 2);
    var nf = 1 / (near - far);

    transform[0]  = f / aspect;
    transform[1]  = 0;
    transform[2]  = 0;
    transform[3]  = 0;
    transform[4]  = 0;
    transform[5]  = f;
    transform[6]  = 0;
    transform[7]  = 0;
    transform[8]  = 0;
    transform[9]  = 0;
    transform[10] = (far + near) * nf;
    transform[11] = -1;
    transform[12] = 0;
    transform[13] = 0;
    transform[14] = (2 * far * near) * nf;
    transform[15] = 0;
    return transform;
};

function _eventsChange(data) {
    if (data.id === PROJECTION) {
        _recalculateProjectionTransform.call(this);
    }
}

function _recalculateProjectionTransform() {
    var options = [this._projectionTransform];
    for (var key in this.options.projection.options) {
        options.push(this.options.projection.options[key]);
    }
    return Camera.projectionTransforms[this.options.projection.type].apply(this, options);
}

Camera.prototype.getProjectionTransform = function getProjectionTransform() {
    return this._projectionTransform;
};

Camera.prototype.setOptions = function setOptions(options) {
    return this._optionsManager.setOptions(options);
};

Camera.prototype.getOptions = function getOptions() {
    return this.options;
};

module.exports = Camera;

},{"../../math/4x4matrix":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/math/4x4matrix.js","../OptionsManager":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/OptionsManager.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Components/Container.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('../EntityRegistry');
var MatrixMath     = require('../../math/4x4matrix');
var EventHandler   = require('../../events/EventHandler');
var GL   = require('../Renderers/WebGLRenderer');

// Consts
var CONTAINER = 'container';

/**
 * Container is a component that can be added to an Entity that
 *   is represented by a DOM node through which other renderables
 *   in the scene graph can be drawn inside of.
 *
 * @class Container
 * @component
 * @constructor
 * 
 * @param {Entity} entity  Entity that the Container is a component of
 * @param {Object} options options
 */
function Container(entity, options) {
    this.gl = GL.init(options);
    // TODO: Most of these properties should be accessed from getter Methods, not read directly as they currently are in DOMRenderer
    EntityRegistry.register(entity, 'HasContainer');
    this._entity        = entity;
    this._container     = options.container;
    var transform       = entity.getComponent('transform');
    this._inverseMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this._size          = options.size || entity.getContext()._size.slice();
    this.origin         = [0.5, 0.5];

    this._eventOutput = new EventHandler();
    this._eventOutput.bindThis(this);

    this._events = {
        eventForwarder: function eventForwarder(event) {
            this.emit(event.type, event);
            event.preventDefault();
        }.bind(this),
        on    : [],
        off   : [],
        dirty : false
    };

    this._transformDirty = true;
    this._sizeDirty      = true;

    // Inverses the Container's transform matrix to have elements nested inside
    // to appear in world space.
    transform.on('invalidated', function(report) {
        MatrixMath.invert(this._inverseMatrix, transform._matrix);
        this._transformDirty = true;
    }.bind(this));
}

Container.toString = function toString() {
    return CONTAINER;
};

/**
 * Bind a callback function to an event type handled by this object's
 *  EventHandler.
 *
 * @method on
 * @chainable
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function(string, Object)} handler callback
 */
Container.prototype.on = function on(event, cb) {
    if (typeof event === 'string' && cb instanceof Function) {
        this._eventOutput.on(event, cb);
        if (this._events.on.indexOf(event) < 0) {
            this._events.on.push(event);
            this._events.dirty = true;
        }
        var index = this._events.off.indexOf(event);
        if (index > -1) this._events.off.splice(index, 1);
    } else throw new Error('on takes an event name as a string and a callback to be fired when that event is received');
    return this;
};

/**
 * Remove a function to a particular event occuring.
 *
 * @method  off
 * @chainable
 * 
 * @param {String} event name of the event to call the function when occuring
 * @param {Function} cb callback function to be called when the event is recieved.
 */
Container.prototype.off = function off(event, cb) {
    if (typeof event === 'string' && cb instanceof Function) {
        var index = this._events.on.indexOf(event);
        if (index >= 0) {
            this._eventOutput.removeListener(event, cb);
            this._events.on.splice(index, 1);
            this._events.off.push(event);
            this._events.dirty = true;
        }
    } else throw new Error('off takes an event name as a string and a callback to be fired when that event is received');
    return this;
};

/**
 * Add event handler object to the EventHandler's downstream handlers.
 *
 * @method pipe
 *
 * @param {EventHandler} target event handler target object
 * @return {EventHandler} passed event handler
 */
Container.prototype.pipe = function pipe(target) {
    var result = this._eventOutput.pipe(target);
    for (var event in this._eventOutput.listeners) {
        if (this._events.on.indexOf(event) < 0) {
            this._events.on.push(event);
            this._events.dirty = true;
        }
    }
    return result;
};

 /**
 * Remove handler object from the EventHandler's downstream handlers.
 *   Undoes work of "pipe".
 *
 * @method unpipe
 *
 * @param {EventHandler} target target handler object
 * @return {EventHandler} provided target
 */
Container.prototype.unpipe = function unpipe(target) {
    return this._eventOutput.unpipe(target);
};

/**
 * Trigger an event, sending to all of the EvenetHandler's 
 *  downstream handlers listening for provided 'type' key.
 *
 * @method emit
 *
 * @param {string} type event type key (for example, 'click')
 * @param {Object} event event data
 * @return {EventHandler} this
 */
Container.prototype.emit = function emit(type, event) {
    if (event && !event.origin) event.origin = this;
    var handled = this._eventOutput.emit(type, event);
    if (handled && event && event.stopPropagation) event.stopPropagation();
    return handled;
};

/**
 * Get the display matrix of the Container.
 *
 * @method getDisplayMatrix
 * 
 * @return {Array} display matrix of the Container
 */
Container.prototype.getDisplayMatrix = function getDisplayMatrix() {
    return this._inverseMatrix;
};

/**
 * Get the size of the Container.
 *
 * @method getSize
 * 
 * @return {Array} 2 dimensional array of representing the size of the Container
 */
Container.prototype.getSize = function getSize() {
    return this._size;
};

/**
 * Set the size of the Container.
 *
 * @method setSize
 * @chainable
 * 
 * @return {Array} 2 dimensional array of representing the size of the Container
 */
Container.prototype.setSize = function setSize(width, height) {
    this._size[0]   = width;
    this._size[1]   = height;
    this._sizeDirty = true;
    return this;
};

module.exports = Container;

},{"../../events/EventHandler":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/events/EventHandler.js","../../math/4x4matrix":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/math/4x4matrix.js","../EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js","../Renderers/WebGLRenderer":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Renderers/WebGLRenderer.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Components/Surface.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('../EntityRegistry'),
    Target         = require('./Target'),
    EventHandler   = require('../../events/EventHandler');

// CONSTS
var TRANSFORM = 'transform';
var SIZE      = 'size';
var OPACITY   = 'opacity';
var SURFACE   = 'surface';

/**
 * Surface is a component that defines the data that should
 *   be drawn to an HTMLElement.  Manages CSS styles, HTML attributes,
 *   classes, and content.
 *
 * @class Surface
 * @component
 * @constructor
 * 
 * @param {Entity} entity Entity that the Surface is a component of
 * @param {Object} options instantiation options
 */
function Surface(entity, options) {
    Target.call(this, entity, {
        verticies: [new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1])]
    });

    EntityRegistry.register(entity, 'Surfaces');
    EntityRegistry.register(entity, 'Renderables');
    
    this._entity = entity;
    this._size   = new Float32Array([0,0]);

    this.invalidations = 127;
    this._eventOutput  = new EventHandler();
    this._eventOutput.bindThis(this);
    this._eventForwarder = function _eventForwarder(event) {
        this._eventOutput.emit(event.type, event);
    }.bind(this);

    this.spec = {
        _id            : entity._id,
        classes        : [],
        attributes     : {},
        properties     : {},
        content        : null,
        invalidations  : (1 << Object.keys(Surface.invalidations).length) - 1,
        origin         : new Float32Array([0.5, 0.5]),
        events         : [],
        eventForwarder : this._eventForwarder
    };

    entity.getComponent(TRANSFORM).on('invalidated', function () {
        this.invalidations |= Surface.invalidations.transform;
    }.bind(this));

    this.setOptions(options);

    this._hasOrigin = true;
}

Surface.prototype             = Object.create(Target.prototype);
Surface.prototype.constructor = Surface;

// Invalidation Scheme
Surface.invalidations = {
    classes    : 1,
    properties : 2,
    attributes : 4,
    content    : 8,
    transform  : 16,
    size       : 32,
    opacity    : 64,
    origin     : 128,
    events     : 256
};

Surface.toString = function toString() {return SURFACE;};

/**
 * Get the Entity the Surface is a component of.
 *
 * @method getEntity
 *
 * @return {Entity} the Entity the Surface is a component of
 */
Surface.prototype.getEntity = function getEntity() {
    return this._entity;
};

/**
 * Set the options of the Surface.
 *
 * @method setOptions
 * 
 * @param {Object} options object of options
 */
Surface.prototype.setOptions = function setOptions(options) {
    if (options.properties)                         this.setProperties(options.properties);
    if (options.classes)                            this.setClasses(options.classes);
    if (options.attributes)                         this.setAttributes(options.attributes);
    if (options.content || options.content === '')  this.setContent(options.content);
    if (options.size)                               this.setSize(options.size);
};

/**
 * Set the CSS classes to be a new Array of strings.
 *
 * @method setClasses
 * 
 * @param {Array} array of CSS classes
 */
Surface.prototype.setClasses = function setClasses(classList) {
    if (!Array.isArray(classList)) throw new Error("Surface: expects an Array to be passed to setClasses");

    var i = 0;
    var removal = [];

    for (i = 0; i < this.spec.classes.length; i++)
        if (classList.indexOf(this.spec.classes[i]) < 0)
            removal.push(this.spec.classes[i]);

    for (i = 0; i < removal.length; i++)   this.removeClass(removal[i]);
    for (i = 0; i < classList.length; i++) this.addClass(classList[i]);

    this.invalidations |= Surface.invalidations.size;
};

/**
 * Return all of the classes associated with this Surface
 *
 * @method getClasses
 * 
 * @return {Array} array of CSS classes
 */
Surface.prototype.getClasses = function getClasses() {
    return this.spec.classes;
};

/**
 * Add a single class to the Surface's list of classes.
 *   Invalidates the Surface's classes.
 *
 * @method addClass
 * 
 * @param {String} className name of the class
 */
Surface.prototype.addClass = function addClass(className) {
    if (typeof className !== 'string') throw new Error('addClass only takes Strings as parameters');
    if (this.spec.classes.indexOf(className) < 0) {
        this.spec.classes.push(className);
        this.invalidations |= Surface.invalidations.classes;
    }

    this.invalidations |= Surface.invalidations.size;
};

/**
 * Remove a single class from the Surface's list of classes.
 *   Invalidates the Surface's classes.
 * 
 * @method removeClass
 * 
 * @param  {String} className class to remove
 */
Surface.prototype.removeClass = function removeClass(className) {
    if (typeof className !== 'string') throw new Error('addClass only takes Strings as parameters');
    var i = this.spec.classes.indexOf(className);
    if (i >= 0) {
        this.spec.classes.splice(i, 1);
        this.invalidations |= Surface.invalidations.classes;
    }

    this.invalidations |= Surface.invalidations.size;
};

/**
 * Set the CSS properties associated with the Surface.
 *   Invalidates the Surface's properties.
 *
 * @method setProperties
 */
Surface.prototype.setProperties = function setProperties(properties) {
    for (var n in properties) this.spec.properties[n] = properties[n];
    this.invalidations |= Surface.invalidations.size;
    this.invalidations |= Surface.invalidations.properties;
};

/**
 * Return the CSS properties associated with the Surface.
 *
 * @method getProperties
 * 
 * @return {Object} CSS properties associated with the Surface
 */
Surface.prototype.getProperties = function getProperties() {
    return this.spec.properties;
};

/**
 * Set the HTML attributes associated with the Surface.
 *   Invalidates the Surface's attributes.
 *
 * @method setAttributes
 */
Surface.prototype.setAttributes = function setAttributes(attributes) {
    for (var n in attributes) this.spec.attributes[n] = attributes[n];
    this.invalidations |= Surface.invalidations.attributes;
};

/**
 * Return the HTML attributes associated with the Surface.
 *
 * @method getAttributes
 * 
 * @return {Object} HTML attributes associated with the Surface
 */
Surface.prototype.getAttributes = function getAttributes() {
    return this.spec.attributes;
};

/**
 * Set the innerHTML associated with the Surface.
 *   Invalidates the Surface's content.
 *
 * @method setContent
 */
Surface.prototype.setContent = function setContent(content) {
    if (content !== this.spec.content) {
        this.spec.content   = content;
        this.invalidations |= Surface.invalidations.content;
    }
};

/**
 * Return the innerHTML associated with the Surface.
 *
 * @method getContent
 * 
 * @return {String} innerHTML associated with the Surface
 */
Surface.prototype.getContent = function getContent() {
    return this.spec.content;
};

/**
 * Set the size of the Surface.
 *
 * @method setSize
 *
 * @return {Array} 2-dimensional array representing the size of the Surface in pixels.
 */
Surface.prototype.setSize = function setSize(size) {
    var properties = {};
    if (size[0] != null) properties.width = size[0] + 'px';
    if (size[1] != null) properties.height = size[1] + 'px';
    this.setProperties(properties);
};

/**
 * Get the size of the Surface.
 *
 * @method getSize
 *
 * @return {Array} 2-dimensional array representing the size of the Surface in pixels.
 */
Surface.prototype.getSize = function getSize() {
    return this._size;
};

/**
 * Sets the origin of the Surface.
 *
 * @method setOrigin
 * @chainable
 *
 * @param {Number} x origin on the x-axis as a percent
 * @param {Number} y origin on the y-axis as a percent
 */
Surface.prototype.setOrigin  = function setOrigin(x, y) {
    if ((x != null && (x < 0 || x > 1)) || (y != null && (y < 0 || y > 1)))
        throw new Error('Origin must have an x and y value between 0 and 1');

    this.spec.origin[0] = x != null ? x : this.spec.origin[0];
    this.spec.origin[1] = y != null ? y : this.spec.origin[1];
    this.invalidations |= Surface.invalidations.origin;

    return this;
};

/**
 * Gets the origin of the Surface.
 *
 * @method getOrigin
 *
 * @return {Array} 2-dimensional array representing the Surface's origin
 */
Surface.prototype.getOrigin = function getOrigin() {
    return this.spec.origin;
};

/**
 * Resets the invalidations of the Surface
 *
 * @method resetInvalidations
 * @chainable
 *
 * @return {Surface} this
 */
Surface.prototype.resetInvalidations = function() {
    this.invalidations = 0;
    return this;
};

/**
 * Mark all properties as invalidated.
 *
 * @method invalidateAll
 * @chainable
 *
 * @return {Surface} this
 */
Surface.prototype.invalidateAll = function() {
    this.invalidations = 511;
    return this;
};


/**
 * Bind a callback function to an event type handled by this Surface's
 *  EventHandler.
 *
 * @method on
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function(string, Object)} handler callback
 */
Surface.prototype.on = function on(event, cb) {
    if (typeof event === 'string' && cb instanceof Function) {
        this._eventOutput.on(event, cb);
        if (this.spec.events.indexOf(event) < 0) {
            this.spec.events.push(event);
            this.invalidations |= Surface.invalidations.events;
        }
    }
};

/**
 * Remove a function to a particular event occuring.
 *
 * @method  off
 * 
 * @param {String} event name of the event to call the function when occuring
 * @param {Function} cb callback function to be called when the event is recieved.
 */
Surface.prototype.off = function off(event, cb) {
    if (typeof event === 'string' && cb instanceof Function) {
        var index = this.spec.events.indexOf(event);
        if (index > 0) {
            this._eventOutput.removeListener(event, cb);
            this.spec.events.splice(index, 1);
            this.invalidations |= Surface.invalidations.events;
        }
    }
};

/**
 * Add event handler object to the EventHandler's downstream handlers.
 *
 * @method pipe
 *
 * @param {EventHandler} target event handler target object
 * @return {EventHandler} passed event handler
 */
Surface.prototype.pipe = function pipe(target) {
    return this._eventOutput.pipe(target);
};

/**
 * Remove handler object from the EventHandler's downstream handlers.
 *   Undoes work of "pipe".
 *
 * @method unpipe
 *
 * @param {EventHandler} target target handler object
 * @return {EventHandler} provided target
 */
Surface.prototype.unpipe = function unpipe(target) {
    return this._eventOutput.unpipe(target);
};

/**
 * Get the render specification of the Surface.
 *
 * @method  render
 * 
 * @return {Object} render specification
 */
Surface.prototype.render = function() {
    this.spec.invalidations = this.invalidations;
    return this.spec;
};

module.exports = Surface;

},{"../../events/EventHandler":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/events/EventHandler.js","../EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js","./Target":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Components/Target.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Components/Target.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var MatrixMath = require('../../math/4x4matrix');

/**
 * Target is the base class for all renderables.  It holds the state of
 *   its verticies, the Containers it is deployed in, the Context it belongs
 *   to, and whether or not origin alignment needs to be applied.
 *
 * @component Target
 * @constructor
 *
 * @param {Entity} entity  Entity that the Target is a component of
 * @param {Object} options options
 */
function Target(entity, options) {
    this.verticies  = options.verticies || [];
    this.containers = {};
    // this.context    = entity.getContext()._id;
    this._hasOrigin = false;
}

/**
 * Get the verticies of the Target.
 *
 * @method getVerticies
 *
 * @return {Array} array of the verticies represented as three element arrays [x, y, z]
 */
Target.prototype.getVerticies = function getVerticies(){
    return this.verticies;
};

/**
 * Determines whether a Target was deployed to a particular container
 *
 * @method _isWithin
 *
 * @param {Number} the id of the Container's Entity
 * @return {Boolean} whether or now the Target was deployed to this particular Container
 */
Target.prototype._isWithin = function _isWithin(container) {
    return this.containers[container._id];
};

/**
 * Mark a Container as having a deployed instance of the Target
 *
 * @method _addToContainer
 *
 * @param {Number} the id of the Container's Entity
 * @return {Boolean} staus of the addition
 */
Target.prototype._addToContainer = function _addToContainer(container) {
    this.containers[container._id] = true;
    return true;
};

/**
 * Unmark a Container as having a deployed instance of the Target
 *
 * @method _removeFromContainer
 *
 * @param {Number} the id of the Container's Entity
 * @return {Boolean} staus of the removal
 */
Target.prototype._removeFromContainer = function _removeFromContainer(container) {
    this.containers[container._id] = false;
    return true;
};

module.exports = Target;

},{"../../math/4x4matrix":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/math/4x4matrix.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Components/Transform.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EventEmitter = require('../../events/EventEmitter');

// CONSTS
var IDENTITY = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

// Functions to be run when an index is marked as invalidated
var VALIDATORS = [
    function validate0(parent, vectors, memory) {
        return parent[0] * (memory[2] * memory[4]) * vectors.scale[0] + parent[4] * (memory[0] * memory[5] + memory[1] * memory[3] * memory[4]) * vectors.scale[0] + parent[8] * (memory[1] * memory[5] - memory[0] * memory[3] * memory[4]) * vectors.scale[0];
    },
    function validate1(parent, vectors, memory) {
        return parent[1] * (memory[2] * memory[4]) * vectors.scale[0] + parent[5] * (memory[0] * memory[5] + memory[1] * memory[3] * memory[4]) * vectors.scale[0] + parent[9] * (memory[1] * memory[5] - memory[0] * memory[3] * memory[4]) * vectors.scale[0];
    },
    function validate2(parent, vectors, memory) {
        return parent[2] * (memory[2] * memory[4]) * vectors.scale[0] + parent[6] * (memory[0] * memory[5] + memory[1] * memory[3] * memory[4]) * vectors.scale[0] + parent[10] * (memory[1] * memory[5] - memory[0] * memory[3] * memory[4]) * vectors.scale[0];
    },
    function validate3(parent, vectors, memory) {
        return parent[3] * (memory[2] * memory[4]) * vectors.scale[0] + parent[7] * (memory[0] * memory[5] + memory[1] * memory[3] * memory[4]) * vectors.scale[0] + parent[11] * (memory[1] * memory[5] - memory[0] * memory[3] * memory[4]) * vectors.scale[0];
    },
    function validate4(parent, vectors, memory) {
        return parent[0] * (-memory[2] * memory[5]) * vectors.scale[1] + parent[4] * (memory[0] * memory[4] - memory[1] * memory[3] * memory[5]) * vectors.scale[1] + parent[8] * (memory[1] * memory[4] + memory[0] * memory[3] * memory[5]) * vectors.scale[1];
    },
    function validate5(parent, vectors, memory) {
        return parent[1] * (-memory[2] * memory[5]) * vectors.scale[1] + parent[5] * (memory[0] * memory[4] - memory[1] * memory[3] * memory[5]) * vectors.scale[1] + parent[9] * (memory[1] * memory[4] + memory[0] * memory[3] * memory[5]) * vectors.scale[1];
    },
    function validate6(parent, vectors, memory) {
        return parent[2] * (-memory[2] * memory[5]) * vectors.scale[1] + parent[6] * (memory[0] * memory[4] - memory[1] * memory[3] * memory[5]) * vectors.scale[1] + parent[10] * (memory[1] * memory[4] + memory[0] * memory[3] * memory[5]) * vectors.scale[1];
    },
    function validate7(parent, vectors, memory) {
        return parent[3] * (-memory[2] * memory[5]) * vectors.scale[1] + parent[7] * (memory[0] * memory[4] - memory[1] * memory[3] * memory[5]) * vectors.scale[1] + parent[11] * (memory[1] * memory[4] + memory[0] * memory[3] * memory[5]) * vectors.scale[1];
    },
    function validate8(parent, vectors, memory) {
        return parent[0] * (memory[3]) * vectors.scale[2] + parent[4] * (-memory[1] * memory[2]) * vectors.scale[2] + parent[8] * (memory[0] * memory[2]) * vectors.scale[2];
    },
    function validate9(parent, vectors, memory) {
        return parent[1] * (memory[3]) * vectors.scale[2] + parent[5] * (-memory[1] * memory[2]) * vectors.scale[2] + parent[9] * (memory[0] * memory[2]) * vectors.scale[2];
    },
    function validate10(parent, vectors, memory) {
        return parent[2] * (memory[3]) * vectors.scale[2] + parent[6] * (-memory[1] * memory[2]) * vectors.scale[2] + parent[10] * (memory[0] * memory[2]) * vectors.scale[2];
    },
    function validate11(parent, vectors, memory) {
        return parent[3] * (memory[3]) * vectors.scale[2] + parent[7] * (-memory[1] * memory[2]) * vectors.scale[2] + parent[11] * (memory[0] * memory[2]) * vectors.scale[2];
    },
    function validate12(parent, vectors, memory) {
        return parent[0] * vectors.translation[0] + parent[4] * vectors.translation[1] + parent[8] * vectors.translation[2] + parent[12];
    },
    function validate13(parent, vectors, memory) {
        return parent[1] * vectors.translation[0] + parent[5] * vectors.translation[1] + parent[9] * vectors.translation[2] + parent[13];
    },
    function validate14(parent, vectors, memory) {
        return parent[2] * vectors.translation[0] + parent[6] * vectors.translation[1] + parent[10] * vectors.translation[2] + parent[14];
    },
    function validate15(parent, vectors, memory) {
        return parent[3] * vectors.translation[0] + parent[7] * vectors.translation[1] + parent[11] * vectors.translation[2] + parent[15];
    }
];

// Map of invalidation numbers
var DEPENDENTS = {
    global : [4369,8738,17476,34952,4369,8738,17476,34952,4369,8738,17476,34952,4096,8192,16384,32768],
    local  : {
        translation : [61440,61440,61440],
        rotation    : [4095,4095,255],
        scale       : [4095,4095,4095],
    }
};

/**
 * Transform is a component that is part of every Entity.  It is
 *   responsible for updating it's own notion of position in space and
 *   incorporating that with parent information.
 *
 * @class Transform
 * @component
 * @constructor
 */
function Transform() {
    this._matrix   = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this._memory   = new Float32Array([1, 0, 1, 0, 1, 0]);
    this._vectors  = {
        translation : new Float32Array([0, 0, 0]),
        rotation    : new Float32Array([0, 0, 0]),
        scale       : new Float32Array([1, 1, 1])
    };
    this._IO       = new EventEmitter();
    this._updateFN = null;
    this._mutator  = {
        translate      : this.translate.bind(this),
        rotate         : this.rotate.bind(this),
        scale          : this.scale.bind(this),
        setTranslation : this.setTranslation.bind(this),
        setRotation    : this.setRotation.bind(this),
        setScale       : this.setScale.bind(this)
    };
    this._invalidated = 0;
}

/**
 * Return the transform matrix that represents this Transform's values 
 *   being applied to it's parent's global transform.
 *
 * @method getGlobalMatrix
 * 
 * @return {Float32 Array} representation of this Transform being applied to it's parent
 */
Transform.prototype.getGlobalMatrix = function getGlobalMatrix() {
    return this._matrix;
};

/**
 * Return the vectorized information for this Transform's local
 *   transform.
 *
 * @method getLocalVectors
 * 
 * @return {Object} object with translate, rotate, and scale keys
 */
Transform.prototype.getLocalVectors = function getVectors() {
    return this._vectors;
};

/**
 * Define the provider of state for the Transform.
 *
 * @method updateFrom
 * @chainable
 * 
 * @param  {Function} provider source of state for the Transform
 */
Transform.prototype.updateFrom = function updateFrom(provider) {
    if (provider instanceof Function || !provider) this._updateFN = provider;
    return this;
};

/**
 * Updates the local invalidation scheme based on parent information
 *
 * @method _invalidateFromParent
 * @private
 * 
 * @param  {Number} parentReport parent's invalidation
 */
function _invalidateFromParent(parentReport) {
    var counter = 0;
    while (parentReport) {
        if (parentReport & 1) this._invalidated |= DEPENDENTS.global[counter];
        counter++;
        parentReport >>>= 1;
    }
}

/**
 * Update the global matrix based on local and parent invalidations.
 *
 * @method  _update
 * @private
 * 
 * @param  {Number} parentReport invalidations associated with the parent matrix
 * @param  {Array} parentMatrix parent transform matrix as an Array
 * @return {Number} invalidation scheme
 */
Transform.prototype._update = function _update(parentReport, parentMatrix) {
    if (parentReport)  _invalidateFromParent.call(this, parentReport);
    if (!parentMatrix) parentMatrix = IDENTITY;
    if (this._updateFN) this._updateFN(this._mutator);
    var update;
    var counter     = 0;
    var invalidated = this._invalidated;

    // Based on invalidations update only the needed indicies
    while (this._invalidated) {
        if (this._invalidated & 1) {
            update = VALIDATORS[counter](parentMatrix, this._vectors, this._memory);
            if (update !== this._matrix[counter])
                this._matrix[counter] = update;
            else
                invalidated &= ((1 << 16) - 1) ^ (1 << counter);
        }

        counter++;
        this._invalidated >>>= 1;
    }

    if (invalidated) this._IO.emit('invalidated', invalidated);
    return invalidated;
};

/**
 * Add extra translation to the current values.  Invalidates
 *   translation as needed.
 *
 * @method translate
 *   
 * @param  {Number} x translation along the x-axis in pixels
 * @param  {Number} y translation along the y-axis in pixels
 * @param  {Number} z translation along the z-axis in pixels
 */
Transform.prototype.translate = function translate(x, y, z) {
    var translation = this._vectors.translation;
    var dirty       = false;
    var size;

    if (x) {
        translation[0] += x;
        dirty           = true;
    }

    if (y) {
        translation[1] += y;
        dirty           = true;
    }

    if (z) {
        translation[2] += z;
        // dirty           = true;
    }

    if (dirty) this._invalidated |= 61440;
};

/**
 * Add extra rotation to the current values.  Invalidates
 *   rotation as needed.
 *
 * @method rotate
 *   
 * @param  {Number} x rotation about the x-axis in radians
 * @param  {Number} y rotation about the y-axis in radians
 * @param  {Number} z rotation about the z-axis in radians
 */
Transform.prototype.rotate = function rotate(x, y, z) {
    var rotation = this._vectors.rotation;
    this.setRotation((x ? x : 0) + rotation[0], (y ? y : 0) + rotation[1], (z ? z : 0) + rotation[2]);
};

/**
 * Add extra scale to the current values.  Invalidates
 *   scale as needed.
 *
 * @method scale
 *   
 * @param  {Number} x scale along the x-axis as a percent
 * @param  {Number} y scale along the y-axis as a percent
 * @param  {Number} z scale along the z-axis as a percent
 */
Transform.prototype.scale = function scale(x, y, z) {
    var scaleVector = this._vectors.scale;
    var dirty       = false;

    if (x) {
        scaleVector[0] += x;
        dirty     = dirty || true;
    }

    if (y) {
        scaleVector[1] += y;
        dirty     = dirty || true;
    }

    if (z) {
        scaleVector[2] += z;
        dirty     = dirty || true;
    }

    if (dirty) this._invalidated |= 4095;
};

/**
 * Absolute set of the Transform's translation.  Invalidates
 *   translation as needed.
 *
 * @method setTranslation
 * 
 * @param  {Number} x translation along the x-axis in pixels
 * @param  {Number} y translation along the y-axis in pixels
 * @param  {Number} z translation along the z-axis in pixels
 */
Transform.prototype.setTranslation = function setTranslation(x, y, z) {
    var translation = this._vectors.translation;
    var dirty       = false;
    var size;

    if (x !== translation[0] && x != null) {
        translation[0] = x;
        dirty          = dirty || true;
    }

    if (y !== translation[1] && y != null) {
        translation[1] = y;
        dirty          = dirty || true;
    }

    if (z !== translation[2] && z != null) {
        translation[2] = z;
        dirty          = dirty || true;
    }

    if (dirty) this._invalidated |= 61440;
};

/**
 * Absolute set of the Transform's rotation.  Invalidates
 *   rotation as needed.
 *
 * @method setRotate
 *   
 * @param  {Number} x rotation about the x-axis in radians
 * @param  {Number} y rotation about the y-axis in radians
 * @param  {Number} z rotation about the z-axis in radians
 */
Transform.prototype.setRotation = function setRotation(x, y, z) {
    var rotation = this._vectors.rotation;
    var dirty    = false;

    if (x !== rotation[0] && x != null) {
        rotation[0]     = x;
        this._memory[0] = Math.cos(x);
        this._memory[1] = Math.sin(x);
        dirty           = dirty || true;
    }

    if (y !== rotation[1] && y != null) {
        rotation[1]     = y;
        this._memory[2] = Math.cos(y);
        this._memory[3] = Math.sin(y);
        dirty           = dirty || true;
    }

    if (z !== rotation[2] && z != null) {
        rotation[2]        = z;
        this._memory[4]    = Math.cos(z);
        this._memory[5]    = Math.sin(z);
        this._invalidated |= 255;
    }

    if (dirty) this._invalidated |= 4095;
};

/**
 * Absolute set of the Transform's scale.  Invalidates
 *   scale as needed.
 *
 * @method setScale
 *   
 * @param  {Number} x scale along the x-axis as a percent
 * @param  {Number} y scale along the y-axis as a percent
 * @param  {Number} z scale along the z-axis as a percent
 */
Transform.prototype.setScale = function setScale(x, y, z) {
    var scale = this._vectors.scale;
    var dirty = false;

    if (x !== scale[0]) {
        scale[0] = x;
        dirty    = dirty || true;
    }

    if (y !== scale[1]) {
        scale[1] = y;
        dirty    = dirty || true;
    }

    if (z !== scale[2]) {
        scale[2] = z;
        dirty    = dirty || true;
    }

    if (dirty) this._invalidated |= 4095;
};

/**
 * Register functions to be called on the Transform's events.
 *
 * @method on
 * @chainable
 *
 */
Transform.prototype.on = function on() {
    this._IO.on.apply(this._IO, arguments);
    return this;
};

module.exports = Transform;

},{"../../events/EventEmitter":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/events/EventEmitter.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Context.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var Entity         = require('./Entity');
var EntityRegistry = require('./EntityRegistry');
var Container      = require('./Components/Container');
var Camera         = require('./Components/Camera');

/**
 * Context is the definition of world space for that part of the scene graph.
 *   A context can either have a Container or not.  Having a container means
 *   that parts of the scene graph can be drawn inside of it.  If it does not
 *   have a Container then the Context is only responsible for defining world
 *   space.  The CoreSystem will start at each Context and recursive down
 *   through their children to update each entitiy's Transform, Size,
 *   and Opacity.
 *
 * @class Context
 * @entity
 * @constructor
 *   
 * @param {Object} options the starting options for the Context
 * @param {Array} options.transform the starting transform matrix
 * @param {Array} options.size the starting size
 * @param {Boolean} options.hasContainer whether or not the Context has a Container
 * @param {Boolean} options.hasCamera whether or not the Context has a Camera
 */
function Context(options) {
    if (!options || typeof options !== 'object' || (!options.size && !options.parentEl && !options.container)) throw new Error('Context, must be called with an option hash that at least has a size or a parentEl or a container property');
    Entity.call(this);
    EntityRegistry.register(this, 'Contexts');
    this._parentEl = options.parentEl;
    this._size     = _getSize(options);
    this._components.transform._update((1 << 16) - 1, options.transform);
    if (options.hasContainer !== false) this._components.container = new Container(this, options);
    if (options.hasCamera    !== false) this._components.camera    = new Camera(this, options);
}

/**
 * A method for determining what the size of the Context is.
 *  Will be the user defined size if one was provided otherwise it
 *  will default to the DOM representation.  
 *
 * @method _getSize
 * @private
 * 
 * @param  {Object} options starting options for the sizes
 * @return {Array} size of the Context
 */
function _getSize(options) {
    if (options.size)      return options.size;
    if (options.container) return [options.container.offsetWidth, options.container.offsetHeight, 0];
    return [options.parentEl.offsetWidth, options.parentEl.offsetHeight, 0];
}

Context.prototype                     = Object.create(Entity.prototype);
Context.prototype.constructor         = Context;
Context.prototype.update              = null;
Context.prototype.registerComponent   = null;
Context.prototype.deregisterComponent = null;
Context.prototype.addComponent        = null;
Context.prototype.removeComponent     = null;

module.exports = Context;

},{"./Components/Camera":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Components/Camera.js","./Components/Container":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Components/Container.js","./Entity":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Entity.js","./EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Engine.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *         
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var CoreSystem     = require('./Systems/CoreSystem'),
    OptionsManager = require('./OptionsManager'),
    DOMrenderer    = require('./Renderers/DOMrenderer'),
    GLrenderer     = require('./Renderers/WebGLRenderer'),
    RenderSystem   = require('./Systems/RenderSystem'),
    BehaviorSystem = require('./Systems/BehaviorSystem'),
    TimeSystem     = require('./Systems/TimeSystem'),
    LiftSystem     = require('../transitions/LiftSystem'),
    Context        = require('./Context');

require('./Stylesheet/famous.css');

var options = {
    loop      : true,
    direction : 1,
    speed     : 1,
    rendering : {
        renderers: {
            DOM: DOMrenderer,
            GL: GLrenderer
        }
    }
};

// TODO: what is this doing here?
document.ontouchmove = function(event){
    event.preventDefault();
};

// State
var LOOP                 = 'loop',
    RENDERING            = 'rendering',
    optionsManager       = new OptionsManager(options),
    systems              = [RenderSystem, BehaviorSystem,LiftSystem, CoreSystem, TimeSystem], // We're going backwards
    currentRelativeFrame = 0,
    currentAbsoluteFrame = 0;

function setRenderers(renderers) {
    for (var key in renderers) {
        RenderSystem.register(key, renderers[key]);
    }
}

setRenderers(options.rendering.renderers);

optionsManager.on('change', function(data) {
    if (data.id === LOOP) {
        if (data.value) {
            requestAnimationFrame(Engine.loop);
        }
    }
    if (data.id === RENDERING) {
        setRenderers(data.value.renderers);
    }
});

/**
 * The singleton object initiated upon process
 *   startup which manages all active Systems and acts as a
 *   factory for new Contexts/
 *
 *   On static initialization, window.requestAnimationFrame is called with
 *     the event loop function.
 *     
 * @class Engine
 * @singleton
 */
var Engine = {};

/**
 * Calls update on each of the currently registered systems.
 * 
 * @method step
 */
Engine.step = function step() {
    currentRelativeFrame += options.direction * options.speed;
    currentAbsoluteFrame++;
    var i = systems.length;
    while (i--) systems[i].update(currentRelativeFrame, currentAbsoluteFrame);// I told you so
    return this;
};

/**
 * A wrapper around requestAnimationFrame that will step 
 * 
 * @method loop
 */
Engine.loop = function loop() {
    if (options.loop) {
        Engine.step();
        requestAnimationFrame(Engine.loop);
    }
    return this;
};

function _loopFor(value) {
    return function() {
        if (value) {
            Engine.step();
            requestAnimationFrame(_loopFor(value - 1));
        }
    };
}

Engine.loopFor = function loopFor(value) {
    requestAnimationFrame(_loopFor(value));
    return this;
};

/**
 * A wrapper for the "DOMContentLoaded" event.  Will execute
 *   a given function once the DOM have been loaded.
 *
 * @method ready
 * 
 * @param  {Function} fn Function to be called after DOM loading
 */
Engine.ready = function ready(fn) {
    var listener = function() {
        document.removeEventListener('DOMContentLoaded', listener);
        fn();
    };
    document.addEventListener('DOMContentLoaded', listener);
    return this;
};

/**
 * Will create a brand new Context.  IF a parent element is not provided,
 *   it is assumed to be the body of the document.
 *
 * @method createContext
 * 
 * @param  {Object} options Options for the Context
 * @return {Context} new Context instance
 */
Engine.createContext = function createContext(options) {
    if (typeof options === 'string') {
        var elem = document.querySelector(options);
        if (!(elem instanceof HTMLElement)) throw new Error('the passed in string should be a query selector which returns an element from the dom');
        else                                return new Context({parentEl: elem});
    }

    if (options instanceof HTMLElement)
        return new Context({parentEl: options});

    if (!options)
        return new Context({parentEl: document.body}); // TODO it should be possible to delay assigning document.body until this hits the render stage. This would remove the need for Engine.ready

    if (!options.parentEl && !options.container)
        options.parentEl = document.body;

    return new Context(options);
};

/**
 * Adds a system to the list of systems to update on a per frame basis
 *
 * @method addSystem
 * 
 * @param {System} system System to get run every frame
 */
Engine.addSystem = function addSystem(system) {
    if (system instanceof Object && system.update instanceof Function)
        return systems.splice(systems.indexOf(RenderSystem) + 1, 0, system);
    else throw new Error('systems must be an object with an update method');
};

/**
 * Removes a system from the list of systems to update on a per frame basis
 *
 * @method removeSystem
 * 
 * @param {System} system System to get run every frame
 */
Engine.removeSystem = function removeSystem(system) {
    if (system instanceof Object && system.update instanceof Function) {
        var index = systems.indexOf(system);
        if (index === -1) return false;
        systems.splice(index, 1);
        return true;
    } else throw new Error('systems must be an object with an update method');
};

/**
 * Delegate to the optionsManager.
 *
 * @method setOptions
 * 
 * @param {Object} options Options to patch
 */
Engine.setOptions = optionsManager.setOptions.bind(optionsManager);

/**
 * Set the direction of the flow of time.
 *
 * @method setDirection
 * 
 * @param {Number} val direction as -1 or 1
 */
Engine.setDirection = function setDirection(val) {
    if (val !== 1 && val !== -1) throw new Error('direction must be either 1 for forward or -1 for reverse');
    optionsManager.set('direction', val);
    return this;
};

/**
 * Get the direction of the flow of time.
 *
 * @method getDirection
 * 
 * @return {Number} direction as -1 or 1
 */
Engine.getDirection = function getDirection() {
    return options.direction;
};

/**
 * Set the speed of time.
 *
 * @method setSpeed
 * 
 * @param {Number} val ratio to human time
 */
Engine.setSpeed = function setSpeed(val) {
    if (typeof val !== 'number') throw new Error('speed must be a number, used as a scale factor for the movement of time');
    optionsManager.set('speed', val);
    return this;
};

/**
 * Get the speed of time.
 *
 * @method getSpeed
 * 
 * @return {Number} val ratio to human time
 */
Engine.getSpeed = function getSpeed() {
    return options.speed;
};

/**
 * Get the current frame
 *
 * @method getAbsoluteFrame
 *
 * @return {Number} the current frame number
 */
Engine.getAbsoluteFrame = function getAbsoluteFrame() {
    return currentAbsoluteFrame;
};

/**
 * Get the current frame taking into account engine speed and direction
 *
 * @method getRelativeFrame
 *
 * @return {Number} the current frame number taking into account Engine speed and direction
 */
Engine.getRelativeFrame = function getRelativeFrame() {
    return currentRelativeFrame;
};

module.exports = Engine;

//Start the loop
Engine.ready(Engine.loop);

},{"../transitions/LiftSystem":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/transitions/LiftSystem.js","./Context":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Context.js","./OptionsManager":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/OptionsManager.js","./Renderers/DOMrenderer":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Renderers/DOMrenderer.js","./Renderers/WebGLRenderer":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Renderers/WebGLRenderer.js","./Stylesheet/famous.css":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Stylesheet/famous.css","./Systems/BehaviorSystem":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Systems/BehaviorSystem.js","./Systems/CoreSystem":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Systems/CoreSystem.js","./Systems/RenderSystem":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Systems/RenderSystem.js","./Systems/TimeSystem":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Systems/TimeSystem.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Entity.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *         
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('./EntityRegistry'),
    Transform      = require('./Components/Transform');

/**
 * Entity is the core of the Famo.us scene graph.  The scene graph
 *   is constructed by adding Entitys to other Entities to define heirarchy.
 *   Each Entity comes with a Transform component with the
 *   ability to add infinite other components.  It also acts as a factory by creating
 *   new Entities that will already be considered it's children.
 *
 * @class Entity
 * @entity
 * @constructor
 */
function Entity() {
    var id = EntityRegistry.register(this, 'CoreSystem');

    this._components = { transform : new Transform(this) };
    this._behaviors = [];

    this._parent   = null;
    this._children = [];
}

/**
 * Adds a new instance of a component to the Entity.
 *
 * @method  registerComponent
 * 
 * @param  {Function} Constructor constructor function for a component
 * @param  {Object} options options to be passed into the constructor
 * @return {Object} instance of the instantitated component
 */

Entity.prototype.registerComponent = function registerComponent(Constructor, options) {
    if (!Constructor || !(Constructor instanceof Function)) throw new Error('The first argument to .registerComponent must be a component Constructor function');
    if (!Constructor.toString)                              throw new Error('The passed-in component Constructor must have a "toString" method.');

    var component = new Constructor(this, options);
    if (component.update) this._behaviors.push(Constructor.toString());
    this._components[Constructor.toString()] = component;
    return component;
};

/**
 * Alias for registerComponent
 * 
 * @method addComponent
 */
Entity.prototype.addComponent = Entity.prototype.registerComponent;

/**
 * Removes a component from the Entity.
 *
 * @method deregisterComponent
 * 
 * @param  {String} type id of the component
 * @return {Boolean} status of the removal
 */
Entity.prototype.deregisterComponent = function deregisterComponent(type) {
    if (typeof type !== 'string') throw new Error('Entity.deregisterComponent must be passed a String as the first parameter');
    if (this._components[type] === undefined || this._components[type] === null) throw new Error('no component of that type');

    this._components[type].cleanup && this._components[type].cleanup();
    this._components[type] = null;

    var behaviorIndex = this._behaviors.indexOf(type);
    if (behaviorIndex > -1)
        this._behaviors.splice(behaviorIndex, 1);

    return true;
};

/**
 * Alias for deregisterComponent
 * 
 * @method removeComponent
 */
Entity.prototype.removeComponent = Entity.prototype.deregisterComponent;

/**
 * Find out if the Entity has a component of a certain name.
 *
 * @method hasComponent
 * 
 * @param  {String} type name of the component
 * @return {Boolean} existance of a component by that name
 */
Entity.prototype.hasComponent = function hasComponent(type) {
    return this._components[type] != null;
};

/**
 * Get a component by name
 *
 * @method getComponent
 * 
 * @param  {String} type name of the component
 * @return {Object} component instance
 */
Entity.prototype.getComponent = function getComponent(type) {
    return this._components[type];
};

/**
 * Get all of the Entity's components
 *
 * @method getAllComponents
 * 
 * @return {Object} Hash of all of the components indexed by name 
 */
Entity.prototype.getAllComponents = function getAllComponents() {
    return this._components;
};

/**
 * Get all of the child nodes in the scene graph
 *
 * @method  getChildren
 * 
 * @return {Array} child entities
 */
Entity.prototype.getChildren = function getChildren() {
    return this._children;
};

/**
 * Get the context of the node.
 *
 * @method getContext
 *
 * @return Context Node
 */
Entity.prototype.getContext = function getContext() {
    var node = this;
    while (node._parent) node = node._parent;
    if (!node._size) return null;
    else             return node;
};

/**
 * Add a new Entity as a child and return it.
 *
 * @method addChild
 *
 * @return {Entity} child Entity
 */
Entity.prototype.addChild = function addChild(entity) {
    if (entity != null && !(entity instanceof Entity)) throw new Error('Only Entities can be added as children of other entities');
    if (entity) {
        if (this._children.indexOf(entity) > -1) return void 0;
        if (entity._parent != null) entity._parent.detatchChild(entity);
        entity._parent = this;
        this._children.push(entity);
        return entity;
    } else {
        var node     = new Entity();
        node._parent = this;
        this._children.push(node);
        return node;
    }
};

/**
 * Remove a Entity's child.
 *
 * @method detatchChild
 *
 * @return {Entity|void 0} child Entity or void 0 if it is not a child
 */
Entity.prototype.detatchChild = function detatchChild(node) {
    if (!(node instanceof Entity)) throw new Error('Entity.detatchChild only takes in Entities as the parameter');
    var index = this._children.indexOf(node);
    if (index >= 0) {
        var child     = this._children.splice(index, 1)[0];
        child._parent = null;
        return child;
    } else return void 0;
};

/**
 * Remove this Entity from the EntityRegistry
 *
 * @method cleanup
 */
Entity.prototype.cleanup = function cleanup() {
    EntityRegistry.cleanup(this);
};

/**
 * Update all of the custom components on the Entity
 * 
 * @method update
 */
Entity.prototype.update = function update() {
    var i = this._behaviors.length;

    while (i--)
        this._components[this._behaviors[i]].update(this);
};

module.exports = Entity;

},{"./Components/Transform":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Components/Transform.js","./EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var Layer = require('./Layer');

// Map of an Entity's position in a layer
var entities = [];

// Storage of Entity arrays
var layers = {
    everything: new Layer()
};

// Pool of free spaces in the entites array
var freed = [];

/**
 * A singleton object that manages the Entity reference system.
 *   Entities can be part of many layers depending on implementation.
 *   
 * @class EntityRegistry
 * @singleton
 */
var EntityRegistry = {};

/**
 * Adds a new layer key to the layers object.
 *
 * @method  addLayer
 * 
 * @param {String} layer name of the layer
 * @return {Array} the array of entities in the specified layer
 */
EntityRegistry.addLayer = function addLayer(layer) {
    if (!layer)                    throw new Error('.addLayer needs to have a layer specified');
    if (typeof layer !== 'string') throw new Error('.addLayer can only take a string as an argument');
    if (!layers[layer]) layers[layer] = new Layer();
    return layers[layer];
};

/**
 * Get the array of entities in a particular layer.
 *
 * @method  getLayer
 * 
 * @param {String} layer name of the layer
 * @return {Array} the array of entities in the specified layer
 */
EntityRegistry.getLayer = function getLayer(layer) {
    return layers[layer];
};

/**
 * Removes a particular layer from the registry
 *
 * @method  removeLayer
 * 
 * @param {String} layer name of the layer to remove
 * @return {Array} the array of entities in the specified layer
 */
EntityRegistry.removeLayer = function removeLayer(layer) {
    if (!layer)                    throw new Error('.removeLayer needs to have a layer specified');
    if (typeof layer !== 'string') throw new Error('.removeLayer can only take a string as an argument');

    var currLayer = layers[layer];
    if (!currLayer) return false;

    var i = currLayer.length;
    while (i--) delete entities[currLayer.get(i)._id][layer];

    delete layers[layer];
    return currLayer;
};

/**
 * Adds an entity to a particular layer.
 *
 * @method  register
 * 
 * @param  {Entity} instance of an Entity
 * @param  {String} layer name of the layer to register the entity to
 * @return {Number} id of the Entity
 */
EntityRegistry.register = function register(entity, layer) {
    var idMap;
    if (entity._id == null) {
        Object.defineProperty(entity, '_id', {
            value        : EntityRegistry.getNewID(),
            configurable : false
        });
    }

    var id = entity._id;
    if (entities[id]) {
        idMap = entities[id];
    }
    else {
        idMap = {everything: layers.everything.length};
        layers.everything.push(entity);
    }

    if (layer) {
        if (!layers[layer]) EntityRegistry.addLayer(layer);
        idMap[layer] = layers[layer].length;
        layers[layer].push(entity);
    }

    if (!entities[id]) entities[id] = idMap;
    return id; //TODO: DO WE NEED TO RETURN ANYMORE?
};

/**
 * Removes an entity from a layer
 *
 * @method  deregister
 * 
 * @param  {Entity} entity instance of an Entity
 * @param  {String} layer name of layer to remove the Entity from
 * @return {Booleam} status of the removal
 */
EntityRegistry.deregister = function deregister(entity, layer) {
    var currentEntity;
    var position = entities[entity._id][layer];
    if (position === undefined) return false;
    entities[entity._id][layer] = null;
    layers[layer].remove(entity);

    var currentEntity;
    for (var i = 0; i < entities.length; i++) {
        currentEntity = entities[i];

        if (currentEntity && currentEntity[layer] > position) currentEntity[layer]--;
    }

    return true;
};

/**
 * Get the id map of the Entity.  Each Entity has an object that
 *   defined the indicies of where it is in each layer.
 *
 * @method  get
 * 
 * @param  {Number} id ID of the Entity
 * @return {Object} id map of the Entity's index in each layer
 */
EntityRegistry.get = function get(id) {
    return entities[id];
};

/**
 * Find out if a given entity exists and a specified layer.
 *
 * @method  inLayer
 * 
 * @param  {Entity} entity Entity instance
 * @param  {String} layer name of the layer
 * @return {Boolean} whether or not the Entity is in a given layer
 */
EntityRegistry.inLayer = function inLayer(entity, layer) {
    return entities[entity._id][layer] !== undefined;
};

//potentially memory unsafe - getting an id isn't necessarily coupled with a registration
/**
 * Get a unique ID for an Entity
 *
 * @method  getNewID
 * 
 * @return {Number} ID for an Entity
 */
EntityRegistry.getNewID = function getNewID() {
    if(freed.length) return freed.pop();
    else return entities.length;
};

/**
 * Remove an entity and all references to it.
 *
 * @method cleanup
 * 
 * @param  {Entity} entity Entity instance to remove
 * @return {Number} ID of the Entity that was removed
 */
EntityRegistry.cleanup = function cleanup(entity) {
    var currentEntity;
    var idMap            = entities[entity._id];
    entities[entity._id] = null;

    for (var i = 0; i < entities.length; i++) {
        currentEntity = entities[i];

        if (currentEntity)
            for (var key in idMap)
                if (currentEntity[key] && currentEntity[key] > idMap[key])
                    currentEntity[key]--;
    }

    for (var key in idMap) {
        layers[key].splice(idMap[key], 1);
    }

    freed.push(entity._id);
    return entity._id; //TODO: DO WE NEED THIS
};

/**
 * Get an Entity by id
 *
 * @method getEntity
 * 
 * @param  {Number} id id of the Entity
 * @return {Entity} entity with the id provided
 */
EntityRegistry.getEntity = function getEntity(id) {
    if (!entities[id]) return false;
    return layers.everything.get(entities[id].everything);
};

/**
 * Remove all Entities from the entity registry
 *
 * @method clear
 */
EntityRegistry.clear = function clear() {
    var everything = EntityRegistry.getLayer('everything');
    while (everything.length) EntityRegistry.cleanup(everything.pop());
};

// Regsiter the default layers
EntityRegistry.addLayer('Roots');
EntityRegistry.addLayer('CoreSystem');

module.exports = EntityRegistry;

},{"./Layer":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Layer.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Layer.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EventEmitter = require('../events/EventEmitter');

/**
 * Layers are groups that hold references to Entities.  It
 *  adds event emitting and convenience methods on top of
 *  the array storage.
 *
 * @class Layer
 * @constructor
 */
function Layer() {
    this.entities = [];
    this.IO       = new EventEmitter();
    Object.defineProperty(this, 'length', {
        get: function get() {
            return this.entities.length;
        }
    });
}

/**
 * Delegates to the EventHandlers "on"
 *
 * @method on
 */
Layer.prototype.on = function on() {
    return this.IO.on.apply(this.IO, arguments);
};

/**
 * Adds an Entity and emits a message
 *
 * @method push
 * 
 * @result {Boolean} return status of array push
 */
Layer.prototype.push = function push(entity) {
    var length = this.entities.push(entity);
    this.IO.emit('entityPushed', entity);
    return length;
};

/**
 * Adds an Entity and emits a message
 *
 * @method pop
 * 
 * @result {Entity} last Entity that was added
 */
Layer.prototype.pop = function pop() {
    var result = this.entities.pop();
    this.IO.emit('entityPopped', result);
    return result;
};

/**
 * Find where and if an Entity is in the array
 *
 * @method indexOf
 * 
 * @result {Number} index of Entity in the array
 */
Layer.prototype.indexOf = function indexOf() {
    return this.entities.indexOf.apply(this.entities, arguments);
};

/**
 * Splices the array and emits a message
 *
 * @method splice
 * 
 * @result {Array} spliced out Entities
 */
Layer.prototype.splice = function splice() {
    var result = this.entities.splice.apply(this.entities, arguments);
    this.IO.emit('entitiesSpliced', result);
    return result;
};

/**
 * Removes and entity from the array and emits a message
 *
 * @method remove
 * 
 * @result {Entity} removed Entity
 */
Layer.prototype.remove = function remove(entity) {
    var index = this.entities.indexOf(entity);
    this.IO.emit('entityRemoved', entity);
    if (index < 0) return false;
    else           return this.entities.splice(index, 1)[0];
};

/**
 * Get the Entity are a particular index
 *
 * @method get
 * 
 * @result {Entity} Entity at that index
 */
Layer.prototype.get = function get(index) {
    return this.entities[index];
};

/**
 * Find of if the Layer has an Entity
 *
 * @method has
 * 
 * @result {Boolean} existence of the Entity in the Layer
 */
Layer.prototype.has = function has(entity) {
    return this.entities.indexOf(entity) !== -1;
};

/**
 * Execute a function that iterates over the collection
 *  of Entities and calls a function where the parameters
 *  are, the Entity, index, and full collection of Entities.
 *
 * @method forEach
 * 
 * @param {Function} function to be run per Entity
 */
Layer.prototype.forEach = function forEach(fn) {
    var i      = -1,
        length = this.entities.length;

    if (typeof fn !== 'function') throw new Error('Layer.forEach only accepts functions as a parameter');

    while (length - ++i) fn(this.entities[i], i, this.entities);
};

/**
 * Implements reduce on the collection of Entities
 *
 * @method reduce
 * 
 * @param {Function} function to be run per Entity
 * @param {*} initialValue initial value of the reduce function
 * 
 * @return {*} value after each Entity has had the function run
 */
Layer.prototype.reduce = function reduce(fn, initialValue) {
    var i      = -1,
        length = this.entities.length,
        accumulator;

    if (typeof fn !== 'function') throw new Error('Layer.reduce only accepts functions as a parameter');

    if (initialValue != null) accumulator = initialValue;
    else                      accumulator = this.entities[++i];
    while (length - ++i)      accumulator = fn(accumulator, this.entities[i], i, this.entities);

    return accumulator;
};

/**
 * Implements map on the collection of Entities
 *
 * @method map
 * 
 * @param {Function} function to be run per Entity
 *
 * @return {Array} array of the return values of the mapping function
 */
Layer.prototype.map = function map(fn) {
    var i      = -1,
        length = this.entities.length,
        result = [];

    if (typeof fn !== 'function') throw new Error('Layer.map only accepts functions as a parameter');

    while (length - ++i) result.push(fn(this.entities[i], i, this.entities));

    return result;
};

/**
 * Implements filter on the collection of Entities
 *
 * @method filter
 * 
 * @param {Function} function to be run per Entity
 *
 * @return {Array} array of the return values of the filtering function
 */
Layer.prototype.filter = function filter(fn) {
    var i      = -1,
        length = this.entities.length,
        result = [];

    if (typeof fn !== 'function') throw new Error('Layer.filter only accepts functions as a parameter');

    while (length - ++i) if (fn(this.entities[i], i, this.entities)) result.push(this.entities[i]);

    return result;
};

/**
 * Implements reject on the collection of Entities
 *
 * @method reject
 * 
 * @param {Function} function to be run per Entity
 *
 * @return {Array} array of the return values of the rejecting function
 */
Layer.prototype.reject = function reject(fn) {
    var i      = -1,
        length = this.entities.length,
        result = [];

    if (typeof fn !== 'function') throw new Error('Layer.reject only accepts functions as a parameter');

    while (length - ++i) if (!fn(this.entities[i], i, this.entities)) result.push(this.entities[i]);

    return result;
};

module.exports = Layer;

},{"../events/EventEmitter":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/events/EventEmitter.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/OptionsManager.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mark@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */
 
'use strict';

var EventHandler = require('../events/EventHandler');

/**
 *  A collection of methods for setting options which can be extended
 *  onto other classes.
 *
 *
 * @class OptionsManager
 * @constructor
 * 
 * @param {Object} value options dictionary
 */
function OptionsManager(value) {
    this._value = value;
    this.eventOutput = null;
}

/**
 * Create options manager from source dictionary with arguments overriden by patch dictionary.
 *
 * @static
 * @method OptionsManager.patch
 *
 * @param {Object} source source arguments
 * @param {...Object} data argument additions and overwrites
 * @return {Object} source object
 */
OptionsManager.patch = function patchObject(source, data) {
    var manager = new OptionsManager(source);
    for (var i = 1; i < arguments.length; i++) manager.patch(arguments[i]);
    return source;
};

function _createEventOutput() {
    this.eventOutput = new EventHandler();
    this.eventOutput.bindThis(this);
    EventHandler.setOutputHandler(this, this.eventOutput);
}

/**
 * Create OptionsManager from source with arguments overriden by patches.
 *   Triggers 'change' event on this object's event handler if the state of
 *   the OptionsManager changes as a result.
 *
 * @method patch
 *
 * @param {...Object} arguments list of patch objects
 * @return {OptionsManager} this
 */
OptionsManager.prototype.patch = function patch() {
    var myState = this._value;
    for (var i = 0; i < arguments.length; i++) {
        var data = arguments[i];
        for (var k in data) {
            if ((k in myState) && (data[k] && data[k].constructor === Object) && (myState[k] && myState[k].constructor === Object)) {
                if (!myState.hasOwnProperty(k)) myState[k] = Object.create(myState[k]);
                this.key(k).patch(data[k]);
                if (this.eventOutput) this.eventOutput.emit('change', {id: k, value: data[k]});
            }
            else this.set(k, data[k]);
        }
    }
    return this;
};

/**
 * Alias for patch
 *
 * @method setOptions
 *
 */
OptionsManager.prototype.setOptions = OptionsManager.prototype.patch;

/**
 * Return OptionsManager based on sub-object retrieved by key
 *
 * @method key
 *
 * @param {string} identifier key
 * @return {OptionsManager} new options manager with the value
 */
OptionsManager.prototype.key = function key(identifier) {
    var result = new OptionsManager(this._value[identifier]);
    if (!(result._value instanceof Object) || result._value instanceof Array) result._value = {};
    return result;
};

/**
 * Look up value by key
 * @method get
 *
 * @param {string} key key
 * @return {Object} associated object
 */
OptionsManager.prototype.get = function get(key) {
    return this._value[key];
};

/**
 * Alias for get
 * @method getOptions
 */
OptionsManager.prototype.getOptions = OptionsManager.prototype.get;

/**
 * Set key to value.  Outputs 'change' event if a value is overwritten.
 *
 * @method set
 *
 * @param {string} key key string
 * @param {Object} value value object
 * @return {OptionsManager} new options manager based on the value object
 */
OptionsManager.prototype.set = function set(key, value) {
    var originalValue = this.get(key);
    this._value[key] = value;

    if (this.eventOutput && value !== originalValue) this.eventOutput.emit('change', {id: key, value: value});
    return this;
};

/**
 * Return entire object contents of this OptionsManager.
 *
 * @method value
 *
 * @return {Object} current state of options
 */
OptionsManager.prototype.value = function value() {
    return this._value;
};

/**
 * Bind a callback function to an event type handled by this object.
 *
 * @method "on"
 *
 * @param {string} type event type key (for example, 'change')
 * @param {function(string, Object)} handler callback
 * @return {EventHandler} this
 */
OptionsManager.prototype.on = function on() {
    _createEventOutput.call(this);
    return this.on.apply(this, arguments);
};

/**
 * Unbind an event by type and handler.
 *   This undoes the work of "on".
 *
 * @method removeListener
 *
 * @param {string} type event type key (for example, 'change')
 * @param {function} handler function object to remove
 * @return {EventHandler} internal event handler object (for chaining)
 */
OptionsManager.prototype.removeListener = function removeListener() {
    _createEventOutput.call(this);
    return this.removeListener.apply(this, arguments);
};

/**
 * Add event handler object to set of downstream handlers.
 *
 * @method pipe
 *
 * @param {EventHandler} target event handler target object
 * @return {EventHandler} passed event handler
 */
OptionsManager.prototype.pipe = function pipe() {
    _createEventOutput.call(this);
    return this.pipe.apply(this, arguments);
};

/**
 * Remove handler object from set of downstream handlers.
 * Undoes work of "pipe"
 *
 * @method unpipe
 *
 * @param {EventHandler} target target handler object
 * @return {EventHandler} provided target
 */
OptionsManager.prototype.unpipe = function unpipe() {
    _createEventOutput.call(this);
    return this.unpipe.apply(this, arguments);
};

module.exports = OptionsManager;
},{"../events/EventHandler":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/events/EventHandler.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Renderers/DOMrenderer.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var OptionsManager   = require('../OptionsManager'),
    Surface          = require('../Components/Surface'),
    Container        = require('../Components/Container'),
    ElementAllocator = require('./ElementAllocator'),
    EntityRegistry   = require('../EntityRegistry'),
    MatrixMath       = require('../../math/4x4matrix');

// State
var containersToElements = {},
    surfacesToElements   = {},
    containersToSurfaces = {},
    targets              = [Surface.toString()];

var usePrefix = document.createElement('div').style.webkitTransform != null;

// CONSTS
var ZERO                = 0,
    MATRIX3D            = 'matrix3d(',
    CLOSE_PAREN         = ')',
    COMMA               = ',',
    DIV                 = 'div',
    FA_CONTAINER        = 'fa-container',
    FA_SURFACE          = 'fa-surface',
    CONTAINER           = 'container',
    PX                  = 'px',
    SURFACE             = 'surface',
    TRANSFORM           = 'transform',
    CSSTRANSFORM        = usePrefix ? 'webkitTransform' : 'transform',
    CSSTRANSFORM_ORIGIN = usePrefix ? 'webkitTransformOrigin' : 'transformOrigin';

//scratch memory for matrix calculations
var devicePixelRatio = window.devicePixelRatio || 1,
    matrixScratch1   = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    matrixScratch2   = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    matrixScratch3   = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    matrixScratch4   = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/**
 * DOMRenderer is a singleton object whose responsiblity it is
 *  to draw DOM bound Surfaces to their respective Containers.
 *
 * @class DOMRenderer
 * @singleton
 */
var DOMRenderer = {
    _queues: {
        containers: {
            update: [],
            recall: [],
            deploy: []
        },
        surfaces: {}
    },
    allocators: {}
};

/**
 * Add an Entity with a Container component to the queue to be
 *  added into the DOM.
 *
 * @method deployContainer
 * 
 * @param {Entity} entity Entity that needs to be deployed
 */
DOMRenderer.deployContainer = function deployContainer(entity) {
    this._queues.containers.deploy.push(entity);
    containersToSurfaces[entity._id]  = {};
    this._queues.surfaces[entity._id] = {
        update: [],
        recall: [],
        deploy: []
    };
};

// Deploy a given Entity's Container to the DOM.
function _deployContainer(entity) {
    var context = entity.getContext();

    // If the Container has not previously been deploy and
    // does not have an allocator, create one.
    if (!DOMRenderer.allocators[context._id])
        DOMRenderer.allocators[context._id] = new ElementAllocator(context._parentEl);

    // Create the DOM representation of the Container
    var element = DOMRenderer.allocators[context._id].allocate(DIV);
    containersToElements[entity._id] = element;
    _updateContainer(entity, element);
    element.classList.add(FA_CONTAINER);

    DOMRenderer.allocators[entity._id] = new ElementAllocator(element);
}

/**
 * Add an Entity with a Container component to the queue to be
 *  removed from the DOM.
 *
 * @method recallContainer
 * 
 * @param {Entity} entity Entity that needs to be recalled
 */
DOMRenderer.recallContainer = function recallContainer(entity) {
    this._queues.containers.recall.push(entity);
    delete this._queues.surfaces[entity._id];
};

// Recall the DOM representation of the Entity's Container
// and clean up references.
function _recallContainer(entity) {
    var element = containersToElements[entity._id];
    var context = entity.getContext();
    DOMRenderer.allocators[context._id].deallocate(element);
    element.classList.remove(FA_CONTAINER);
    delete DOMRenderer.allocators[entity._id];
}

/**
 * Add an Entity with a Container component to the queue to be
 *  updated.
 *
 * @method updateContainer
 * 
 * @param {Entity} entity Entity that needs to be updated
 */
DOMRenderer.updateContainer = function updateContainer(entity) {
    this._queues.containers.update.push(entity);
};

// Update the Container's DOM properties
function _updateContainer(entity) {
    var container = entity.getComponent(CONTAINER),
        element   = containersToElements[entity._id],
        i         = 0,
        size,
        origin,
        contextSize;

    if (container._events.dirty) {
        i = container._events.on.length;
        while (container._events.off.length) element.removeEventListener(container._events.off.pop(), container._events.forwarder);
        while (i--) element.removeEventListener(container._events.on[i], container._events.forwarder);
        container._events.dirty = false;
    }

    if (container._sizeDirty || container._transformDirty) {
        contextSize = entity.getContext()._size;
        size        = container.getSize();
        origin      = container.origin;
    }

    if (container._sizeDirty) {
        element.style.width  = size[0] + PX;
        element.style.height = size[1] + PX;
        container._sizeDirty = false;
    }

    if (container._transformDirty) {
        var transform               = DOMRenderer.createDOMMatrix(entity.getComponent(TRANSFORM)._matrix, contextSize, size, origin);
        element.style[CSSTRANSFORM] = DOMRenderer.stringifyMatrix(transform);

        var keys = Object.keys(containersToSurfaces[entity._id]);
        i        = keys.length;
        while (i--)
            if (containersToSurfaces[entity._id][keys[i]])
                containersToSurfaces[entity._id][keys[i]].getComponent(SURFACE).invalidations |= Surface.invalidations.transform;
    }
}

/**
 * Add an Entity with a Surface to the queue to be deployed
 *  to a particular Container.
 *
 * @method deploy
 * 
 * @param {Entity} entity Entity that needs to be deployed
 * @param {Entity} container Entity that the Surface will be deployed to
 */
DOMRenderer.deploy = function deploy(entity, container) {
    if (!surfacesToElements[entity._id]) surfacesToElements[entity._id] = {};
    DOMRenderer._queues.surfaces[container._id].deploy.push(entity);
    containersToSurfaces[container._id][entity._id] = entity;
};

// Deploys the Entity's Surface to a particular Container.
function _deploy(entity, containerID) {
    var element = DOMRenderer.allocators[containerID].allocate(DIV);
    entity.getComponent(SURFACE).invalidateAll();
    surfacesToElements[entity._id][containerID] = element;
    element.classList.add(FA_SURFACE);
    _update(entity, containerID);
}

/**
 * Add an Entity with a Surface to the queue to be recalled
 *  from a particular Container.
 *
 * @method recall
 * 
 * @param {Entity} entity Entity that needs to be recalled from
 * @param {Entity} container Entity that the Surface will be recalled from
 */
DOMRenderer.recall = function recall(entity, container) {
    DOMRenderer._queues.surfaces[container._id].recall.push(entity);
    containersToSurfaces[container._id][entity._id] = false;
};

// Recalls the Entity's Surface from a given Container
function _recall(entity, containerID) {
    var element = surfacesToElements[entity._id];
    var surface = entity.getComponent('surface');
    DOMRenderer.allocators[containerID].deallocate(element);
    var i = surface.spec.events.length;
    while (i--) element.removeEventListener(surface.spec.events[i], surface.eventForwarder);
}

/**
 * Add an Entity with a Surface to the queue to be updated
 *
 * @method update
 * 
 * @param {Entity} entity Entity that needs to be updated
 * @param {Entity} container Entity that the Surface will be updated for
 */
DOMRenderer.update = function update(entity, container) {
    DOMRenderer._queues.surfaces[container._id].update.push(entity);
};

// Update the Surface that is to deployed to a partcular Container
function _update(entity, containerID) {
    var surface         = entity.getComponent(SURFACE),
        spec            = surface.render(),
        i               = 0,
        contextSize     = entity.getContext()._size,
        element         = surfacesToElements[entity._id][containerID],
        containerEntity = EntityRegistry.getEntity(containerID),
        container       = containerEntity.getComponent(CONTAINER),
        key;

    if (Surface.invalidations.classes & spec.invalidations) {
        for (i = 0; i < element.classList.length; i++) element.classList.remove(element.classList[i]);
        for (i = 0; i < spec.classes.length;   i++) element.classList.add(spec.classes[i]);
        element.classList.add(FA_SURFACE);
    }
    
    if (Surface.invalidations.properties & spec.invalidations)
        for (key in spec.properties) element.style[key] = spec.properties[key];

    if (Surface.invalidations.content & spec.invalidations)
        element.innerHTML = spec.content;

    if (Surface.invalidations.opacity & spec.invalidations)
        element.style.opacity = spec.opacity;

    if (Surface.invalidations.origin & spec.invalidations) {
        element.style[CSSTRANSFORM_ORIGIN] = spec.origin[0].toFixed(2) * 100 + '% ' + spec.origin[1].toFixed(2) * 100 + '%';
    }

    if (Surface.invalidations.events & spec.invalidations) {
        i = spec.events.length;
        while (i--) element.addEventListener(spec.events[i], spec.eventForwarder);
    }

    if (Surface.invalidations.size & spec.invalidations) {
        surface._size[0] = element.offsetWidth;
        surface._size[1] = element.offsetHeight;
    }

    if (Surface.invalidations.transform & spec.invalidations) {
        var transform = MatrixMath.multiply(matrixScratch3, container.getDisplayMatrix(), entity.getComponent(TRANSFORM)._matrix);
        transform     = DOMRenderer.createDOMMatrix(transform, contextSize, surface.getSize(), spec.origin);
        var camera    = entity.getContext().getComponent('camera');
        if (camera) {
            var focalPoint    = camera.getOptions().projection.options.focalPoint;
            var fx            = (focalPoint[0] + 1) * 0.5 * contextSize[0];
            var fy            = (1 - focalPoint[1]) * 0.5 * contextSize[1];
            var scratchMatrix = [1, 0, 0, 0, 0, 1, 0,  0, 0, 0, 1, 0, fx - surface.getSize()[0] * spec.origin[0],  fy - surface.getSize()[1] * spec.origin[1], 0, 1];
            MatrixMath.multiply(scratchMatrix, scratchMatrix, [1, 0, 0, 0, 0, 1, 0,  0, 0, 0, 1, entity.getContext().getComponent('camera').getProjectionTransform()[11],  0, 0, 0, 1]);
            MatrixMath.multiply(scratchMatrix, scratchMatrix, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -(fx - surface.getSize()[0] * spec.origin[0]),  -(fy - surface.getSize()[1] * spec.origin[1]), 0, 1]);
            MatrixMath.multiply(transform, scratchMatrix, transform);
        }
        element.style[CSSTRANSFORM] = DOMRenderer.stringifyMatrix(transform);
    }
}

/**
 * Render will run over all of the queues that have been populated
 *  by the RenderSystem and will execute the deployment, recalling,
 *  and updating.
 *
 * @method render
 */
 DOMRenderer.render = function render() {
    var queue,
        containerID,
        innerQueues,
        queues     = DOMRenderer._queues,
        containers = Object.keys(queues.surfaces),
        j          = containers.length,
        i          = 0,
        k          = 0;
    
    // Deploy Containers
    queue = queues.containers.deploy;
    i     = queue.length;
    while (i--) _deployContainer(queue.shift());

    // Recall Containers
    queue = queues.containers.recall;
    i     = queue.length;
    while (i--) _recallContainer(queue.shift());

    // Update Containers
    queue = queues.containers.update;
    i     = queue.length;
    while (i--) _updateContainer(queue.shift());

    // For each Container
    while (j--) {
        containerID = containers[j];
        innerQueues = queues.surfaces[containerID];

        // Deploy Surfaces
        queue = innerQueues.deploy;
        i     = queue.length;
        while (i--) _deploy(queue.shift(), containerID);

        // Recall Surfaces
        queue = innerQueues.recall;
        i     = queue.length;
        while (i--) _recall(queue.shift(), containerID);

        // Update Surfaces
        queue = innerQueues.update;
        i     = queue.length;
        while (i--) _update(queue.shift(), containerID);
    }

};

// Get the type of Targets the DOMRenderer will work for
DOMRenderer.getTargets = function getTargets() {
    return targets;
};

/**
 * Create the Transform matrix for a Surface based on it transform,
 *  size, origin, and Context's size.  Uses its Context's size to
 *  turn homogenous coordinate Transforms to pixels.
 *
 * @method createDOMMAtrix
 *
 * @param {Array} transform Transform matrix
 * @param {Array} contextSize 2-dimensional size of the Context
 * @param {Array} size size of the DOM element as a 3-dimensional array
 * @param {Array} origin origin of the DOM element as a 2-dimensional array
 * @param {Array} result storage of the DOM bound transform matrix
 */
DOMRenderer.createDOMMatrix = function createDOMMatrix(transform, contextSize, size, origin, result) {
    result             = result || [];
    // size[0]           /= 0.5 * contextSize[0]; // TODO: We're not using the 
    // size[1]           /= 0.5 * contextSize[1];
    matrixScratch1[0]  = 1;
    matrixScratch1[1]  = 0;
    matrixScratch1[2]  = 0;
    matrixScratch1[3]  = 0;
    matrixScratch1[4]  = 0;
    matrixScratch1[5]  = 1;
    matrixScratch1[6]  = 0;
    matrixScratch1[7]  = 0;
    matrixScratch1[8]  = 0;
    matrixScratch1[9]  = 0;
    matrixScratch1[10] = 1;
    matrixScratch1[11] = 0;
    matrixScratch1[12] = -size[0] * origin[0];
    matrixScratch1[13] = -size[1] * origin[1];
    matrixScratch1[14] = 0;
    matrixScratch1[15] = 1;
    MatrixMath.multiply(matrixScratch2, matrixScratch1, transform);

    result[0]  = ((matrixScratch2[0]  < 0.000001 && matrixScratch2[0]  > -0.000001) ? ZERO : matrixScratch2[0]);
    result[1]  = ((matrixScratch2[1]  < 0.000001 && matrixScratch2[1]  > -0.000001) ? ZERO : matrixScratch2[1]);
    result[2]  = ((matrixScratch2[2]  < 0.000001 && matrixScratch2[2]  > -0.000001) ? ZERO : matrixScratch2[2]);
    result[3]  = ((matrixScratch2[3]  < 0.000001 && matrixScratch2[3]  > -0.000001) ? ZERO : matrixScratch2[3]);
    result[4]  = ((matrixScratch2[4]  < 0.000001 && matrixScratch2[4]  > -0.000001) ? ZERO : matrixScratch2[4]);
    result[5]  = ((matrixScratch2[5]  < 0.000001 && matrixScratch2[5]  > -0.000001) ? ZERO : matrixScratch2[5]);
    result[6]  = ((matrixScratch2[6]  < 0.000001 && matrixScratch2[6]  > -0.000001) ? ZERO : matrixScratch2[6]);
    result[7]  = ((matrixScratch2[7]  < 0.000001 && matrixScratch2[7]  > -0.000001) ? ZERO : matrixScratch2[7]);
    result[8]  = ((matrixScratch2[8]  < 0.000001 && matrixScratch2[8]  > -0.000001) ? ZERO : matrixScratch2[8]);
    result[9]  = ((matrixScratch2[9]  < 0.000001 && matrixScratch2[9]  > -0.000001) ? ZERO : matrixScratch2[9]);
    result[10] = ((matrixScratch2[10] < 0.000001 && matrixScratch2[10] > -0.000001) ? ZERO : matrixScratch2[10]);
    result[11] = ((matrixScratch2[11] < 0.000001 && matrixScratch2[11] > -0.000001) ? ZERO : matrixScratch2[11]);
    result[12] = ((matrixScratch2[12] < 0.000001 && matrixScratch2[12] > -0.000001) ? ZERO : matrixScratch2[12]) + 0.5 * contextSize[0];
    result[13] = ((matrixScratch2[13] < 0.000001 && matrixScratch2[13] > -0.000001) ? ZERO : matrixScratch2[13]) + 0.5 * contextSize[1];
    // result[12] = (Math.round((matrixScratch2[12] + 1) * 0.5 * contextSize[0] * devicePixelRatio) / devicePixelRatio);
    // result[13] = (Math.round((matrixScratch2[13] + 1) * 0.5 * contextSize[1] * devicePixelRatio) / devicePixelRatio);
    result[14] = ((matrixScratch2[14] < 0.000001 && matrixScratch2[14] > -0.000001) ? ZERO : matrixScratch2[14]);
    result[15] = ((matrixScratch2[15] < 0.000001 && matrixScratch2[15] > -0.000001) ? ZERO : matrixScratch2[15]);

    // size[0] *= 0.5 * contextSize[0];
    // size[1] *= 0.5 * contextSize[1];
    return result;
};

/**
 * Get the CSS representation of a Transform matrix
 *
 * @method stringifyMatrix
 *
 * @param {Array} m Transform matrix
 */
DOMRenderer.stringifyMatrix = function stringifyMatrix(m) {
    return MATRIX3D +
        m[0]  + COMMA +
        m[1]  + COMMA +
        m[2]  + COMMA +
        m[3]  + COMMA +
        m[4]  + COMMA +
        m[5]  + COMMA +
        m[6]  + COMMA +
        m[7]  + COMMA +
        m[8]  + COMMA +
        m[9]  + COMMA +
        m[10] + COMMA +
        m[11] + COMMA +
        m[12] + COMMA +
        m[13] + COMMA +
        m[14] + COMMA +
        m[15] + CLOSE_PAREN;
};


module.exports = DOMRenderer;

},{"../../math/4x4matrix":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/math/4x4matrix.js","../Components/Container":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Components/Container.js","../Components/Surface":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Components/Surface.js","../EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js","../OptionsManager":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/OptionsManager.js","./ElementAllocator":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Renderers/ElementAllocator.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Renderers/ElementAllocator.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: mark@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

/**
 * Internal helper object to Container that handles the process of
 *   creating and allocating DOM elements within a managed div.
 *   Private.
 *
 * @class ElementAllocator
 * @constructor
 *
 * @param {DOMElement} container document element in which Famo.us content will be inserted
 */
function ElementAllocator(container) {
    if (!container) container = document.createDocumentFragment();
    this.container     = container;
    this.detachedNodes = {};
    this.nodeCount     = 0;
}

/**
 * Allocate an element of specified type from the pool.
 *
 * @method allocate
 *
 * @param {String} type type of element, e.g. 'div'
 *
 * @return {DOMElement} allocated document element
 */
ElementAllocator.prototype.allocate = function allocate(type) {
    type = type.toLowerCase();
    if (!(type in this.detachedNodes)) this.detachedNodes[type] = [];
    var nodeStore = this.detachedNodes[type];
    var result;
    if (nodeStore.length > 0) {
        result = nodeStore.pop();
    } else {
        result = document.createElement(type);
        this.container.appendChild(result);
    }
    this.nodeCount++;
    result.style.display = '';    
    return result;
};

/**
 * De-allocate an element of specified type to the pool.
 *
 * @method deallocate
 *
 * @param {DOMElement} element document element to deallocate
 */
ElementAllocator.prototype.deallocate = function deallocate(element) {
    var nodeType = element.nodeName.toLowerCase();
    var nodeStore = this.detachedNodes[nodeType];
    nodeStore.push(element);
    element.style.display = 'none';
    element.style.opacity = '';
    element.style.width   = '';
    element.style.height  = '';
    this.nodeCount--;
};

/**
 * Get count of total allocated nodes in the document.
 *
 * @method getNodeCount
 *
 * @return {Number} total node count
 */
ElementAllocator.prototype.getNodeCount = function getNodeCount() {
    return this.nodeCount;
};

module.exports = ElementAllocator;
},{}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Renderers/WebGLRenderer.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: adnan@famo.us,
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var mouse = [0, 0];
var start = Date.now();
var EntityRegistry = require('../EntityRegistry');
var Geometry = require('../../gl/geometry');
var ShaderMaker = require('../../gl/shader');
var lightList = EntityRegistry.addLayer('Lights');
var Materials = EntityRegistry.addLayer('Materials');
var Contexts = EntityRegistry.getLayer('Contexts');

var WebGLRenderer = {
    draw: draw,
    render: function () {
        var geom = EntityRegistry.getLayer('Geometries');
        (geom ? geom.entities : []).forEach(function (geom) {
            var c = geom.getContext();
            if (c) this.shader.uniforms({
                perspective: c.getComponent('camera').getProjectionTransform(),
                resolution: c._size
            });
            this.draw(geom._components.geometry.render());
        }.bind(this));
    },
    deploy: function () {},
    update: function () {},
    setOptions: function() {},
    DEFAULT_OPTIONS: {},
    recall: function () {},
    getTargets: function () {
        return [Geometry.toString()];
    },
    init: init
};

module.exports = WebGLRenderer;

function draw(spec) {
    if (! spec.texture) delete spec.texture;
    spec.mouse = mouse;
    spec.clock = (Date.now() - start) / 100.;
    if (! spec.noise) spec.noise = 0;
    if (! spec.video) spec.video = 0;
    if (! spec.bump) spec.bump = 0;
    this.shader.uniforms(spec).draw(spec.geometry);
}

function init(options) {
    var canvas = options.canvas;
    var parentEl = options.parentEl;

    var options = { alpha: true };

    if (! canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'GL';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    (parentEl || document.body).appendChild(canvas);

    var gl = this.gl = canvas.getContext('webgl', options);

    if (! gl) throw 'WebGL not supported';

    window.onmousemove = function(e) {
        mouse = [e.x / innerWidth, 1. - e.y /innerHeight];
    };
    
    this.shader = new ShaderMaker(gl, []);
    
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    Materials.on('entityPushed', function (d) {
        setTimeout(function () {
            this.shader = new ShaderMaker(gl, Materials.map(function (d) { return d.getComponent('materials'); }), 16);
        }.bind(this));
    }.bind(this));

    return gl;
}

},{"../../gl/geometry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/geometry.js","../../gl/shader":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/shader.js","../EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Stylesheet/famous.css":[function(require,module,exports){
var css = "var css = \"/* This Source Code Form is subject to the terms of the Mozilla Public\\n * License, v. 2.0. If a copy of the MPL was not distributed with this\\n * file, You can obtain one at http://mozilla.org/MPL/2.0/.\\n *\\n * Owner: mark@famo.us\\n * @license MPL 2.0\\n * @copyright Famous Industries, Inc. 2014\\n */\\n\\n\\nhtml {\\n    width: 100%;\\n    height: 100%;\\n    margin: 0px;\\n    padding: 0px;\\n    overflow: hidden;\\n    -webkit-transform-style: preserve-3d;\\n    transform-style: preserve-3d;\\n}\\n\\nbody {\\n    position: absolute;\\n    width: 100%;\\n    height: 100%;\\n    margin: 0px;\\n    padding: 0px;\\n    -webkit-transform-style: preserve-3d;\\n    transform-style: preserve-3d;\\n    -webkit-font-smoothing: antialiased;\\n    -webkit-tap-highlight-color: transparent;\\n    -webkit-perspective: 0;\\n    perspective: none;\\n    overflow: hidden;\\n}\\n\\n.famous-container, .famous-group {\\n    position: absolute;\\n    top: 0px;\\n    left: 0px;\\n    bottom: 0px;\\n    right: 0px;\\n    overflow: visible;\\n    -webkit-transform-style: preserve-3d;\\n    transform-style: preserve-3d;\\n    -webkit-backface-visibility: visible;\\n    backface-visibility: visible;\\n    pointer-events: none;\\n}\\n\\n.famous-group {\\n    width: 0px;\\n    height: 0px;\\n    margin: 0px;\\n    padding: 0px;\\n    -webkit-transform-style: preserve-3d;\\n    transform-style: preserve-3d;\\n}\\n\\n.fa-surface {\\n    position: absolute;\\n    -webkit-transform-origin: 0% 0%;\\n    transform-origin: 0% 0%;\\n    -webkit-backface-visibility: visible;\\n    backface-visibility: visible;\\n    -webkit-transform-style: flat;\\n    transform-style: preserve-3d; /* performance */\\n/*    -webkit-box-sizing: border-box;\\n    -moz-box-sizing: border-box;*/\\n    -webkit-tap-highlight-color: transparent;\\n    pointer-events: auto;\\n\\n}\\n\\n.famous-container-group {\\n    position: relative;\\n    width: 100%;\\n    height: 100%;\\n}\\n\\n.fa-container {\\n    position: absolute;\\n    -webkit-transform-origin: center center;\\n    transform-origin: center center;\\n    overflow: hidden;\\n}\\n\\ncanvas.GL {\\n    pointer-events: none;\\n    position: absolute;\\n    opacity: .7;\\n    z-index: 9999;\\n    top: 0px;\\n    left: 0px;\\n}\\n\"; (require(\"/Users/joseph/code/One/Libraries/MixedMode/node_modules/cssify\"))(css); module.exports = css;"; (require("/Users/joseph/code/One/Libraries/MixedMode/node_modules/cssify"))(css); module.exports = css;
},{"/Users/joseph/code/One/Libraries/MixedMode/node_modules/cssify":"/Users/joseph/code/One/Libraries/MixedMode/node_modules/cssify/browser.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Systems/BehaviorSystem.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('../EntityRegistry');
var renderNodes    = EntityRegistry.getLayer('everything');

/**
 * A system that will run over custom components that have an
 *   update function.
 *
 * @class BehaviorSystem
 * @system
 * @singleton
 */
var BehaviorSystem = {};

/**
 * Update will iterate over all of the entities and call
 *   each of their update functions.
 *
 * @method update
 */
BehaviorSystem.update = function update() {
    var i = renderNodes.length;

    while (i--)
        if (renderNodes.entities[i].update)
            renderNodes.entities[i].update();
};

module.exports = BehaviorSystem;


},{"../EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Systems/CoreSystem.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('../EntityRegistry');
var roots          = EntityRegistry.addLayer('Contexts');

/**
 * CoreSystem is responsible for traversing the scene graph and
 *   updating the Transforms of the entities.
 *
 * @class  CoreSystem
 * @system
 * @singleton
 */
var CoreSystem = {};

/**
 * update iterates over each of the Contexts that were registered and
 *   kicks of the recursive updating of their entities.
 *
 * @method update
 */
CoreSystem.update = function update() {
    roots.forEach(coreUpdateAndFeed);
};

/**
 * coreUpdateAndFeed feeds parent information to an entity and so that
 *   each entity can update their transform.  It will then pass down
 *   invalidation states and values to any children.
 *
 * @method coreUpdateAndFeed
 * @private
 *   
 * @param  {Entity}  entity           Entity in the scene graph
 * @param  {Number}  transformReport  bitScheme report of transform invalidations
 * @param  {Array}   incomingMatrix   parent transform as a Float32 Array
 */
function coreUpdateAndFeed(entity, transformReport, incomingMatrix) {
    var transform = entity.getComponent('transform');
    var i         = entity._children.length;

    // Update the Transform based on parent invalidations
    transformReport = transform._update(transformReport, incomingMatrix);

    while (i--) coreUpdateAndFeed(entity._children[i], transformReport, transform._matrix);
}

module.exports = CoreSystem;

},{"../EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Systems/RenderSystem.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('../EntityRegistry'),
    MatrixMath     = require('../../math/4x4matrix'),
    OptionsManager = require('../OptionsManager');

var renderers          = {},
    targetsToRenderers = {};

var containers  = EntityRegistry.addLayer('HasContainer'),
    renderables = EntityRegistry.addLayer('Renderables');

var toDeploy = [];

containers.on('entityPushed', deployContainer);
containers.on('entityRemoved', recallContainer);

var containerToTargets = {};

function deployContainer(entity) {
    if (entity.getContext()) renderers.DOM.deployContainer(entity);
    else                     toDeploy.push(entity); // TODO This is temporary and it sucks
}

function recallContainer(entity) {
    renderers.DOM.recallContainer(entity);
}

function _releventToRenderer(renderer, entity) {
    var targets = renderer.getTargets();
    var j       = targets.length;
    while (j--) if (entity.hasComponent(targets[j])) return true;
    return false;
}

function _releventToAnyRenderer(entity) {
    var rendererNames = Object.keys(renderers),
        i             = rendererNames.length;

    while (i--) if (_releventToRenderer(renderers[rendererNames[i]], entity)) return true;
    return false;
}

var vertexScratch = new Float32Array([0, 0, 0, 0]),
    matrixScratch = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

// Vertex culling logic
function _isWithin(target, entity, container) {
    // var verticies   = target.getVerticies(),
    //     i           = verticies.length,
    //     v           = null,
    //     origin      = void 0,
    //     isInside    = false,
    //     displaySize = container.getComponent('size').getGlobalSize(),
    //     x           = 0,
    //     y           = 0,
    //     size        = entity.getComponent('size').getGlobalSize(),
    //     ft          = MatrixMath.multiply(matrixScratch,
    //                                       container.getComponent('container').getDisplayMatrix(), 
    //                                       entity.getComponent('transform').getGlobalMatrix());

    // while (!isInside && i--) {
    //     v = verticies[i];
    //     if (target.getOrigin) {
    //         origin  = target.getOrigin();
    //         v[0]   -= size[0] * origin[0];
    //         v[1]   -= size[1] * origin[1];
    //     }
    //     MatrixMath.applyToVector(vertexScratch, ft, v);
    //     if (origin) {
    //         v[0] += size[0] * origin[0];
    //         v[1] += size[1] * origin[1];
    //     }
    //     x = vertexScratch[0] / vertexScratch[3];
    //     y = vertexScratch[1] / vertexScratch[3];
    //     isInside = x <= ( displaySize[0] / 2) &&
    //                y <= ( displaySize[1] / 2) &&
    //                x >= (-displaySize[0] / 2) &&
    //                y >= (-displaySize[1] / 2);
    // } 
    // return isInside;
    return true;
}

/**
 * RenderSystem is responsible for keeping track of the various renderers
 *  and feeding them 
 *
 *
 * @class RenderSystem
 * @system
 */
var RenderSystem = {};

RenderSystem.update = function update() {
    var targets             = Object.keys(targetsToRenderers),
        rendererNames       = Object.keys(renderers),
        target              = null,
        entity              = null,
        container           = null,
        targetName          = void 0,
        containerEnts       = containers.entities,
        entities            = renderables.entities,
        i                   = entities.length,
        targetsLength       = targets.length,
        containerEntLengths = containerEnts.length,
        renderersLength     = 0,
        j                   = toDeploy.length,
        k                   = 0,
        l                   = 0;

    // Update the Container if its transform or size are dirty.
    containers.forEach(function(entity) {
        container = entity.getComponent('container');
        if (entity.getContext() && (container._transformDirty || container._sizeDirty)) renderers.DOM.updateContainer(entity);
    });

    while (j--) deployContainer(toDeploy.pop());

    // For all of the renderables
    while (i--) {
        j      = targetsLength;
        entity = entities[i];
        if (!entity.getContext()) continue;

        // For each renderer
        while (j--) {
            target = entity.getComponent(targets[j]);
            if (!target) continue; // skip if this Renderable does not container the proper target component for this renderer

            k = containerEntLengths;

            if (k) {
                targetName      = target.constructor.toString();
                renderersLength = targetsToRenderers[targetName].length;

                // For each container
                while (k--) {
                    l          = renderersLength;
                    container  = containerEnts[k];

                    // If the target is in the Container
                    if (_isWithin(target, entity, container)) {
                        // Decide if to deploy  and update or just update
                        if (target._isWithin(container)) {
                            while (l--) targetsToRenderers[targetName][l].update(entity, container);
                        } else {
                            while (l--) targetsToRenderers[targetName][l].deploy(entity, container);
                            target._addToContainer(container);
                        }
                    } else if (target._isWithin(container)) { // If the target is culled recall it
                        while (l--) targetsToRenderers[targetName][l].recall(entity, container);
                        target._removeFromContainer(container);
                    }
                }
            }

            // Reset the invalidations after all of the logic for 
            // a particular target 
            if (target.resetInvalidations) target.resetInvalidations();
        }
    }

    // Have each renderer run
    i = rendererNames.length;
    while (i--) renderers[rendererNames[i]].render();
};

/**
 * Add a new renderer which will be called every frame.
 *
 * @method register
 *
 * @param {String} name name of the renderer
 * @param {Object} renderer singleton renderer object
 */
RenderSystem.register = function register(name, renderer) {
    if (renderers[name] != null) return false;

    renderers[name] = renderer;

    var targets = renderer.getTargets(),
        i       = targets.length;

    while (i--) {
        if (targetsToRenderers[targets[i]] == null) targetsToRenderers[targets[i]] = [];
        targetsToRenderers[targets[i]].push(renderer);
    }

    return true;
};

module.exports = RenderSystem;

},{"../../math/4x4matrix":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/math/4x4matrix.js","../EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js","../OptionsManager":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/OptionsManager.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Systems/TimeSystem.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

 'use strict';

var previousTime       = 0, 
    delta              = 0,
    initializationTime = Date.now(),
    currentTime        = initializationTime,
    relativeTime       = initializationTime,
    absoluteTime       = initializationTime,
    previousRelFrame   = 0;

/**
 * TimeSystem is responsible for determining the current moment.
 *
 * @class TimeSystem
 * @system
 */
var TimeSystem = {};

/**
 * Update the time based on the frame data from the Engine.
 *
 * @method update
 *
 * @param {Number} relFrame 
 */
TimeSystem.update = function update(relFrame) {
    previousTime     = currentTime;
    currentTime      = Date.now();
    delta            = currentTime - previousTime;
    relativeTime    += delta * (relFrame - previousRelFrame);
    absoluteTime    += delta;
    previousRelFrame = relFrame;
};

/**
 * Get relative time in ms offfset by the speed at which the Engine is running.
 *
 * @method getRelativeTime
 *
 * @return {Number} the time accounting for Engine's run speed
 */
TimeSystem.getRelativeTime = function getRelativeTime() {
    return relativeTime;
};

/**
 * Get absolute time.
 *
 * @method getAbsoluteTime
 *
 * @return {Number} the time in ms
 */
TimeSystem.getAbsoluteTime = function getAbsoluteTime() {
    return absoluteTime;
};

/**
 * Get the time in which the Engine was instantiated.
 *
 * @method getInitialTime
 *
 * @return {Number} the time in ms
 */
TimeSystem.getInitialTime = function getInitialTime() {
    return initializationTime;
};

/**
 * Get elapsed time since instantiation accounting for Engine speed
 *
 * @method getElapsedRelativeTime
 *
 * @return {Number} the time in ms
 */
TimeSystem.getElapsedRelativeTime = function getElapsedRelativeTime() {
    return relativeTime - initializationTime;
};

/**
 * Get absolute elapsed time since instantiation
 *
 * @method getElapsedAbsoluteTime
 *
 * @return {Number} the time in ms
 */
TimeSystem.getElapsedAbsoluteTime = function getElapsedAbsoluteTime() {
    return absoluteTime - initializationTime;
};

/**
 * Get the time between this frame and last.
 *
 * @method getDelta
 *
 * @return {Number} the time in ms
 */
TimeSystem.getDelta = function getDelta() {
    return delta;
};

module.exports = TimeSystem;

},{}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/components/Target.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var MatrixMath = require('../../math/4x4matrix');

/**
 * Target is the base class for all renderables.  It holds the state of
 *   its verticies, the Containers it is deployed in, the Context it belongs
 *   to, and whether or not origin alignment needs to be applied.
 *
 * @component Target
 * @constructor
 *
 * @param {Entity} entity  Entity that the Target is a component of
 * @param {Object} options options
 */
function Target(entity, options) {
    this.verticies  = options.verticies || [];
    this.containers = {};
    // this.context    = entity.getContext()._id;
    this._hasOrigin = false;
}

/**
 * Get the verticies of the Target.
 *
 * @method getVerticies
 *
 * @return {Array} array of the verticies represented as three element arrays [x, y, z]
 */
Target.prototype.getVerticies = function getVerticies(){
    return this.verticies;
};

/**
 * Determines whether a Target was deployed to a particular container
 *
 * @method _isWithin
 *
 * @param {Number} the id of the Container's Entity
 * @return {Boolean} whether or now the Target was deployed to this particular Container
 */
Target.prototype._isWithin = function _isWithin(container) {
    return this.containers[container._id];
};

/**
 * Mark a Container as having a deployed instance of the Target
 *
 * @method _addToContainer
 *
 * @param {Number} the id of the Container's Entity
 * @return {Boolean} staus of the addition
 */
Target.prototype._addToContainer = function _addToContainer(container) {
    this.containers[container._id] = true;
    return true;
};

/**
 * Unmark a Container as having a deployed instance of the Target
 *
 * @method _removeFromContainer
 *
 * @param {Number} the id of the Container's Entity
 * @return {Boolean} staus of the removal
 */
Target.prototype._removeFromContainer = function _removeFromContainer(container) {
    this.containers[container._id] = false;
    return true;
};

module.exports = Target;

},{"../../math/4x4matrix":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/math/4x4matrix.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/events/EventEmitter.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* Owner: mark@famo.us
* @license MPL 2.0
* @copyright Famous Industries, Inc. 2014
*/

'use strict';

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

},{}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/events/EventHandler.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* Owner: mark@famo.us
* @license MPL 2.0
* @copyright Famous Industries, Inc. 2014
*/

'use strict';

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

},{"./EventEmitter":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/events/EventEmitter.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/Geometry.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: adnan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

 'use strict';

var TRANSFORM = 'transform';
var OPACITY = 'opacity';
var MATERIALS = 'materials';

var Vector = require('./vector');
var Indexer = require('./indexer');
var EntityRegistry = require('../core/EntityRegistry');
var Target = require('../core/components/Target');

/**
 * Geometry is a component that defines the data that should
 *   be drawn to the webGL canvas. Manages vertex data and attributes.
 *
 * @class Geometry
 * @component
 * @constructor
 * 
 * @param {Entity} entity Entity that the Geometry is a component of
 * @param {Object} options instantiation options
 */

function Geometry(entity, options) {
    this.gl = entity.getContext().getComponent('container').gl;

    Target.call(this, entity, {
        verticies: [new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1])]
    });

    options = options || {};

    EntityRegistry.register(entity, 'Geometries');
    EntityRegistry.register(entity, 'Renderables');
    
    this.entity = entity;
    this.vertexBuffers = {};
    this.indexBuffers = {};
    this.addVertexBuffer('vertices', 'a_pos');
    this.addVertexBuffer('coords', 'a_texCoord');
    this.addVertexBuffer('normals', 'a_normal');
    if (options.colors) this.addVertexBuffer('colors', 'a_color');
    if (!('triangles' in options) || options.triangles) this.addIndexBuffer('triangles');
    if (options.lines) this.addIndexBuffer('lines');
    this.spec = {
        primitive: options.type || 'triangles',
        origin: [.5, .5],
        size: [0, 0, 0],
        geometry: {
            vertexBuffers: this.vertexBuffers,
            indexBuffers: this.indexBuffers
        }
    };
    
    if (options.size) this.setSize(options.size);
    if (options.origin) this.setOrigin(options.origin);
}

Geometry.toString =  function () {
    return 'geometry';
};


Geometry.prototype = Object.create(Target.prototype);
Geometry.prototype.addVertexBuffer = function addVertexBuffer(name, attribute) {
    var buffer = this.vertexBuffers[attribute] = new Buffer(this.gl.ARRAY_BUFFER, Float32Array, this.gl);
    buffer.name = name;
    this[name] = [];
};

Geometry.prototype.addIndexBuffer = function addIndexBuffer(name) {
    var buffer = this.indexBuffers[name] = new Buffer(this.gl.ELEMENT_ARRAY_BUFFER, Uint16Array, this.gl);
    this[name] = [];
};

Geometry.prototype.compile = function compile() {
    for (var attribute in this.vertexBuffers) {
        var buffer = this.vertexBuffers[attribute];
        buffer.data = this[buffer.name];
        buffer.compile();
    }

    for (var name in this.indexBuffers) {
        var buffer = this.indexBuffers[name];
        buffer.data = this[name];
        buffer.compile();
    }
};

Geometry.prototype.addNormals = function addNormals() {
    if (!this.normals) this.addVertexBuffer('normals', 'gl_Normal');
    for (var i = 0; i < this.vertices.length; i++) {
        this.normals[i] = new Vector();
    }
    for (var i = 0; i < this.triangles.length; i++) {
        var t = this.triangles[i];
        var a = Vector.fromArray(this.vertices[t[0]]);
        var b = Vector.fromArray(this.vertices[t[1]]);
        var c = Vector.fromArray(this.vertices[t[2]]);
        var normal = b.sub(a).cross(c.sub(a)).normalize();
        this.normals[t[0]] = this.normals[t[0]].add(normal);
        this.normals[t[1]] = this.normals[t[1]].add(normal);
        this.normals[t[2]] = this.normals[t[2]].add(normal);
    }
    for (var i = 0; i < this.vertices.length; i++) {
        this.normals[i] = this.normals[i].normalize().toArray();
    }
    this.compile();
    return this;
};

Geometry.prototype.constructor = Geometry;

Geometry.prototype.setSize = function size(val) {
    if (val[0] != null) this.spec.size[0] = val[0];
    if (val[1] != null) this.spec.size[1] = val[1];
    if (val[2] != null) this.spec.size[2] = val[2];
    return this;
};


Geometry.prototype.setOrigin  = function setOrigin(x, y) {
    if ((x != null && (x < 0 || x > 1)) || (y != null && (y < 0 || y > 1)))
        throw new Error('Origin must have an x and y value between 0 and 1');

    this.spec.origin[0] = x != null ? x : this.spec.origin[0];
    this.spec.origin[1] = y != null ? y : this.spec.origin[1];

    return this;
};

Geometry.prototype.render = function () {
    var transform = this.entity.getComponent(TRANSFORM);
    var opacity = this.entity.getComponent(OPACITY);
    var surface = this.entity.getComponent('surface');

    this.spec.transform = transform.getGlobalMatrix();
    this.spec.opacity = opacity ? opacity._globalOpacity : 1; 
    
    if (surface) this.spec.origin = surface.spec.origin;

    return this.spec;
};

Geometry.prototype.loadFromObj = function loadFromObj(url, options) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function () {
        loadObj.call(this, xhr.responseText, options.scale || .005, options.offset || [0, 0, 0]);
        this.compile();
    }.bind(this);
    xhr.send(null);

    return this;
};

function loadObj(obj, scale, offset) { 
        var vts = []; 
        var nml = []; 
        var indv = [];         
        var indt = []; 
        var indn = []; 
        var txc = [];     
        var lines = obj.split('\n');     
        for(var i = 0; i < lines.length; i++) {
            var line = lines[i]; 
            if (line.indexOf('v ') !== -1) { 
                var vertex = line.split(' '); 
                var vx = parseFloat(vertex[1]) * scale + offset[0]; 
                var vy = parseFloat(vertex[2]) * scale + offset[1]; 
                var vz = parseFloat(vertex[3]) * scale + offset[2]; 
                vts.push([vx, vy, vz]);                 
            }   
            else if (line.indexOf('vt ') !== -1) {                
                var texcoord = line.split(' ');       
                var tx = parseFloat(texcoord[1]); 
                var ty = parseFloat(texcoord[2]); 
                txc.push([tx, ty]);                                 
            }
            else if (line.indexOf('vn ') !== -1) {
                var normal = line.split(' ');                       
                var nx = parseFloat(normal[1]); 
                var ny = parseFloat(normal[2]); 
                var nz = parseFloat(normal[3]);                 
                nml.push([nx, ny, nz]);                  
            }
            else if (line.indexOf('f ') !== -1) {
                var index = line.split(' ');     
                
                if (index[1].indexOf('//') !== -1) {                 
                    var i1 = index[1].split('//'); 
                    var i2 = index[2].split('//'); 
                    var i3 = index[3].split('//'); 
                    indv.push(parseFloat(i1[0]) -1, parseFloat(i2[0]) - 1, parseFloat(i3[0]) - 1); 
                    indn.push(parseFloat(i1[1]) -1, parseFloat(i2[1]) - 1, parseFloat(i3[1]) - 1); 
                }
                else if (index[1].indexOf('/') !== -1) {                    
                    var i1 = index[1].split('/'); 
                    var i2 = index[2].split('/'); 
                    var i3 = index[3].split('/');                   
                    indv.push(parseFloat(i1[0]) - 1, parseFloat(i2[0]) - 1, parseFloat(i3[0]) - 1); 
                    indt.push(parseFloat(i1[1]) - 1, parseFloat(i2[1]) - 1, parseFloat(i3[1]) - 1);                     
                    indn.push(parseFloat(i1[2]) - 1, parseFloat(i2[2]) - 1, parseFloat(i3[2]) - 1); 
                }
                else {                                     
                    indv.push(parseFloat(index[1]) - 1, parseFloat(index[2]) - 1, parseFloat(index[3]) - 1); 
                }    
            }
        }        

    makeProperArray(indv, vts);
    this.vertices = vts;
    //this.normals = makeProperArray(indn, nml); 
    //this.coords = makeProperArray(indt, txc); 

};    

function makeProperArray(indices, array) {            
    var output = []; 
    for(var i = 0; i < indices.length; i++) {
        var temp = array[indices[i]]; 
        for(var j = 0; j < temp.length; j++)
            output.push(temp[j]);     
    } 
    return output; 
}

/**
 * Buffer is a private object that stores references to pass data from
 * a typed array to a VBO.
 *
 * @class Geometry
 * @component
 * @constructor
 * 
 * @param {Target} Location of the vertex data that is being uploaded to gl.
 * @param {Type} Contstructor for the typed array which will store data passed from the application.
 */

function Buffer(target, type, gl) {
    this.buffer = null;
    this.target = target;
    this.type = type;
    this.data = [];
    this.gl = gl;
}

Buffer.prototype = {
    compile: function(type) {
        var gl = this.gl;
        var data = [];
        for (var i = 0, chunk = 10000; i < this.data.length; i += chunk) {
            data = Array.prototype.concat.apply(data, this.data.slice(i, i + chunk));
        }
        var spacing = this.data.length ? data.length / this.data.length : 0;
        if (spacing != Math.round(spacing)) throw 'buffer elements not of consistent size, average size is ' + spacing;
        this.buffer = this.buffer || gl.createBuffer();
        this.buffer.length = data.length;
        this.buffer.spacing = spacing;
        gl.bindBuffer(this.target, this.buffer);
        gl.bufferData(this.target, new this.type(data), type || gl.STATIC_DRAW);
    }
};

module.exports = Geometry;

},{"../core/EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js","../core/components/Target":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/components/Target.js","./indexer":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/indexer.js","./vector":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/vector.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/geometry.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: adnan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

 'use strict';

var TRANSFORM = 'transform';
var OPACITY = 'opacity';
var MATERIALS = 'materials';

var Vector = require('./vector');
var Indexer = require('./indexer');
var EntityRegistry = require('../core/EntityRegistry');
var Target = require('../core/components/Target');

/**
 * Geometry is a component that defines the data that should
 *   be drawn to the webGL canvas. Manages vertex data and attributes.
 *
 * @class Geometry
 * @component
 * @constructor
 * 
 * @param {Entity} entity Entity that the Geometry is a component of
 * @param {Object} options instantiation options
 */

function Geometry(entity, options) {
    this.gl = entity.getContext().getComponent('container').gl;

    Target.call(this, entity, {
        verticies: [new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1])]
    });

    options = options || {};

    EntityRegistry.register(entity, 'Geometries');
    EntityRegistry.register(entity, 'Renderables');
    
    this.entity = entity;
    this.vertexBuffers = {};
    this.indexBuffers = {};
    this.addVertexBuffer('vertices', 'a_pos');
    this.addVertexBuffer('coords', 'a_texCoord');
    this.addVertexBuffer('normals', 'a_normal');
    if (options.colors) this.addVertexBuffer('colors', 'a_color');
    if (!('triangles' in options) || options.triangles) this.addIndexBuffer('triangles');
    if (options.lines) this.addIndexBuffer('lines');
    this.spec = {
        primitive: options.type || 'triangles',
        origin: [.5, .5],
        size: [0, 0, 0],
        geometry: {
            vertexBuffers: this.vertexBuffers,
            indexBuffers: this.indexBuffers
        }
    };
    
    if (options.size) this.setSize(options.size);
    if (options.origin) this.setOrigin(options.origin);
}

Geometry.toString =  function () {
    return 'geometry';
};


Geometry.prototype = Object.create(Target.prototype);
Geometry.prototype.addVertexBuffer = function addVertexBuffer(name, attribute) {
    var buffer = this.vertexBuffers[attribute] = new Buffer(this.gl.ARRAY_BUFFER, Float32Array, this.gl);
    buffer.name = name;
    this[name] = [];
};

Geometry.prototype.addIndexBuffer = function addIndexBuffer(name) {
    var buffer = this.indexBuffers[name] = new Buffer(this.gl.ELEMENT_ARRAY_BUFFER, Uint16Array, this.gl);
    this[name] = [];
};

Geometry.prototype.compile = function compile() {
    for (var attribute in this.vertexBuffers) {
        var buffer = this.vertexBuffers[attribute];
        buffer.data = this[buffer.name];
        buffer.compile();
    }

    for (var name in this.indexBuffers) {
        var buffer = this.indexBuffers[name];
        buffer.data = this[name];
        buffer.compile();
    }
};

Geometry.prototype.addNormals = function addNormals() {
    if (!this.normals) this.addVertexBuffer('normals', 'gl_Normal');
    for (var i = 0; i < this.vertices.length; i++) {
        this.normals[i] = new Vector();
    }
    for (var i = 0; i < this.triangles.length; i++) {
        var t = this.triangles[i];
        var a = Vector.fromArray(this.vertices[t[0]]);
        var b = Vector.fromArray(this.vertices[t[1]]);
        var c = Vector.fromArray(this.vertices[t[2]]);
        var normal = b.sub(a).cross(c.sub(a)).normalize();
        this.normals[t[0]] = this.normals[t[0]].add(normal);
        this.normals[t[1]] = this.normals[t[1]].add(normal);
        this.normals[t[2]] = this.normals[t[2]].add(normal);
    }
    for (var i = 0; i < this.vertices.length; i++) {
        this.normals[i] = this.normals[i].normalize().toArray();
    }
    this.compile();
    return this;
};

Geometry.prototype.constructor = Geometry;

Geometry.prototype.setSize = function size(val) {
    if (val[0] != null) this.spec.size[0] = val[0];
    if (val[1] != null) this.spec.size[1] = val[1];
    if (val[2] != null) this.spec.size[2] = val[2];
    return this;
};


Geometry.prototype.setOrigin  = function setOrigin(x, y) {
    if ((x != null && (x < 0 || x > 1)) || (y != null && (y < 0 || y > 1)))
        throw new Error('Origin must have an x and y value between 0 and 1');

    this.spec.origin[0] = x != null ? x : this.spec.origin[0];
    this.spec.origin[1] = y != null ? y : this.spec.origin[1];

    return this;
};

Geometry.prototype.render = function () {
    var transform = this.entity.getComponent(TRANSFORM);
    var opacity = this.entity.getComponent(OPACITY);
    var surface = this.entity.getComponent('surface');

    this.spec.transform = transform.getGlobalMatrix();
    this.spec.opacity = opacity ? opacity._globalOpacity : 1; 
    
    if (surface) this.spec.origin = surface.spec.origin;

    return this.spec;
};

Geometry.prototype.loadFromObj = function loadFromObj(url, options) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function () {
        loadObj.call(this, xhr.responseText, options.scale || .005, options.offset || [0, 0, 0]);
        this.compile();
    }.bind(this);
    xhr.send(null);

    return this;
};

function loadObj(obj, scale, offset) { 
        var vts = []; 
        var nml = []; 
        var indv = [];         
        var indt = []; 
        var indn = []; 
        var txc = [];     
        var lines = obj.split('\n');     
        for(var i = 0; i < lines.length; i++) {
            var line = lines[i]; 
            if (line.indexOf('v ') !== -1) { 
                var vertex = line.split(' '); 
                var vx = parseFloat(vertex[1]) * scale + offset[0]; 
                var vy = parseFloat(vertex[2]) * scale + offset[1]; 
                var vz = parseFloat(vertex[3]) * scale + offset[2]; 
                vts.push([vx, vy, vz]);                 
            }   
            else if (line.indexOf('vt ') !== -1) {                
                var texcoord = line.split(' ');       
                var tx = parseFloat(texcoord[1]); 
                var ty = parseFloat(texcoord[2]); 
                txc.push([tx, ty]);                                 
            }
            else if (line.indexOf('vn ') !== -1) {
                var normal = line.split(' ');                       
                var nx = parseFloat(normal[1]); 
                var ny = parseFloat(normal[2]); 
                var nz = parseFloat(normal[3]);                 
                nml.push([nx, ny, nz]);                  
            }
            else if (line.indexOf('f ') !== -1) {
                var index = line.split(' ');     
                
                if (index[1].indexOf('//') !== -1) {                 
                    var i1 = index[1].split('//'); 
                    var i2 = index[2].split('//'); 
                    var i3 = index[3].split('//'); 
                    indv.push(parseFloat(i1[0]) -1, parseFloat(i2[0]) - 1, parseFloat(i3[0]) - 1); 
                    indn.push(parseFloat(i1[1]) -1, parseFloat(i2[1]) - 1, parseFloat(i3[1]) - 1); 
                }
                else if (index[1].indexOf('/') !== -1) {                    
                    var i1 = index[1].split('/'); 
                    var i2 = index[2].split('/'); 
                    var i3 = index[3].split('/');                   
                    indv.push(parseFloat(i1[0]) - 1, parseFloat(i2[0]) - 1, parseFloat(i3[0]) - 1); 
                    indt.push(parseFloat(i1[1]) - 1, parseFloat(i2[1]) - 1, parseFloat(i3[1]) - 1);                     
                    indn.push(parseFloat(i1[2]) - 1, parseFloat(i2[2]) - 1, parseFloat(i3[2]) - 1); 
                }
                else {                                     
                    indv.push(parseFloat(index[1]) - 1, parseFloat(index[2]) - 1, parseFloat(index[3]) - 1); 
                }    
            }
        }        

    makeProperArray(indv, vts);
    this.vertices = vts;
    //this.normals = makeProperArray(indn, nml); 
    //this.coords = makeProperArray(indt, txc); 

};    

function makeProperArray(indices, array) {            
    var output = []; 
    for(var i = 0; i < indices.length; i++) {
        var temp = array[indices[i]]; 
        for(var j = 0; j < temp.length; j++)
            output.push(temp[j]);     
    } 
    return output; 
}

/**
 * Buffer is a private object that stores references to pass data from
 * a typed array to a VBO.
 *
 * @class Geometry
 * @component
 * @constructor
 * 
 * @param {Target} Location of the vertex data that is being uploaded to gl.
 * @param {Type} Contstructor for the typed array which will store data passed from the application.
 */

function Buffer(target, type, gl) {
    this.buffer = null;
    this.target = target;
    this.type = type;
    this.data = [];
    this.gl = gl;
}

Buffer.prototype = {
    compile: function(type) {
        var gl = this.gl;
        var data = [];
        for (var i = 0, chunk = 10000; i < this.data.length; i += chunk) {
            data = Array.prototype.concat.apply(data, this.data.slice(i, i + chunk));
        }
        var spacing = this.data.length ? data.length / this.data.length : 0;
        if (spacing != Math.round(spacing)) throw 'buffer elements not of consistent size, average size is ' + spacing;
        this.buffer = this.buffer || gl.createBuffer();
        this.buffer.length = data.length;
        this.buffer.spacing = spacing;
        gl.bindBuffer(this.target, this.buffer);
        gl.bufferData(this.target, new this.type(data), type || gl.STATIC_DRAW);
    }
};

module.exports = Geometry;

},{"../core/EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js","../core/components/Target":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/components/Target.js","./indexer":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/indexer.js","./vector":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/vector.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/indexer.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: adnan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

 'use strict';

function Indexer() {
    this.unique = [];
    this.indices = [];
    this.map = {};
}

Indexer.prototype = {
    add: function(obj) {
        var key = JSON.stringify(obj);
        if (! (key in this.map)) {
            this.map[key] = this.unique.length;
            this.unique.push(obj);
        }
        return this.map[key];
    }
};

module.exports = Indexer;

},{}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/materials.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: adnan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var Texture = require('./texture');
var Registry = require('../core/EntityRegistry');
function Materials(entity, options) {
    this.options = options = options || {};
    this.gl = entity.getContext().getComponent('container').gl;

    this.image = loadImage(options.image, function () {
        this.load();
    }.bind(this));
    this.fsChunk = options.fsChunk || {
        defines: '',
        apply: 'color = texture2D(texture, v_texCoord.xy).xyzw;'
    };
    this.entity = entity;
    if (options.resample) setInterval(this.resample, options.resample);

    Registry.register(entity, 'Materials');
}

Materials.prototype.setUniform = function setUniform(name, value) {
    this.entity.spec[name] = value;
};

Materials.prototype.resample = function () {
    if (this.texture) this.texture;
};

Materials.prototype.load = function load() {
    var image = this.image;
    var texture = new Texture(this.gl, image.width, image.height, this.options);
    try { texture.image(image); }
    catch (e) {
        throw e;
    }
    //if (options.minFilter && options.minFilter != gl.NEAREST && options.minFilter != gl.LINEAR) {
      //  gl.generateMipmap(gl.TEXTURE_2D);
    //}
    this.texture = texture;
    return this;
};

Materials.prototype.update = function () {
    applyMaterial.call(this, this.entity);
};

function applyMaterial(renderNode) {
    var geo = renderNode.getComponent('geometry');
    
    if (geo) {
        if (this.texture)  geo.spec.texture = this.texture.id && 0;
        geo.spec.texture && this.texture.bind();
        geo.spec.fsChunk = this.fsChunk;
    }
    
    renderNode.getChildren().forEach(applyMaterial, this);
}

Materials.prototype._update = function _update() {
    if (this.image) this.texture.image(this.image);
};

Materials.toString = function toString() {
    return 'materials';
};

module.exports = Materials;


function loadImage(img, cb) {
    var obj = (typeof img === 'string') ? new Image() : img;
    obj.onload = function (img) {
        cb.call(img);
    };
    obj.src = img;
    return obj;
}

},{"../core/EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js","./texture":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/texture.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/primitives.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: adnan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var Vector = require('./vector');
var Geometry = require('./Geometry');
var Indexer = require('./indexer');

function pickOctant(i) {
    return new Vector((i & 1) * 2 - 1, (i & 2) - 1, (i & 4) / 2 - 1);
}

var cubeData = [
    [0, 4, 2, 6, -1, 0, 0],
    [1, 3, 5, 7, +1, 0, 0],
    [0, 1, 4, 5, 0, -1, 0],
    [2, 6, 3, 7, 0, +1, 0],
    [0, 2, 1, 3, 0, 0, -1],
    [4, 5, 6, 7, 0, 0, +1] 
];

module.exports.cube = function Cube(renderNode, options) {
    options = options || {};
    var cube = new Geometry(renderNode, options);

    for (var i = 0; i < cubeData.length; i++) {
        var data = cubeData[i], v = i * 4;
        for (var j = 0; j < 4; j++) {
            var d = data[j];
            cube.vertices.push(pickOctant(d).toArray());
            cube.coords.push([j & 1, (j & 2) / 2]);
            cube.normals.push(data.slice(4, 7));
        }
        cube.triangles.push([v, v + 1, v + 2]);
        cube.triangles.push([v + 2, v + 1, v + 3]);
    }

    cube.compile();
    return cube;
};

module.exports.sphere = function Sphere(renderNode, options) {
    options = options || {};
    var sphere = new Geometry(renderNode, options);
    var flip;

    function tri(a, b, c) { return flip ? [a, c, b] : [a, b, c]; }
    function fix(x) { return x + (x - x * x)  }

    var indexer = new Indexer();
    var detail = options.detail || 15;

    for (var octant = 0; octant < 8; octant++) {
        var scale = pickOctant(octant);
        flip = scale.x * scale.y * scale.z > 0;
        var data = [];
        for (var i = 0; i <= detail; i++) {
            for (var j = 0; i + j <= detail; j++) {
                var a = i / detail;
                var b = j / detail;
                var c = (detail - i - j) / detail;
                var v = new Vector(fix(a), fix(b), fix(c)).normalize().times(scale);
                var vertex = { vertex: [v.x, v.y, v.z] };
                vertex.coord = scale.y > 0 ? [(1 - a), c] : [c, (1 - a)];
                data.push(indexer.add(vertex));
            }

            if (i > 0) {
                for (var j = 0; i + j <= detail; j++) {
                    var a = (i - 1) * (detail + 1) + ((i - 1) - (i - 1) * (i - 1)) / 2 + j;
                    var b = i * (detail + 1) + (i - i * i) / 2 + j;
                    sphere.triangles.push(tri(data[a], data[a + 1], data[b]));
                    if (i + j < detail) {
                        sphere.triangles.push(tri(data[b], data[a + 1], data[b + 1]));
                    }
                }
            }
        }
    }

    sphere.vertices = indexer.unique.map(function(v) { return v.vertex; });

    sphere.coords = indexer.unique.map(function(v) { return v.coord; });
    sphere.normals = sphere.vertices;

    sphere.compile();
    return sphere;
};

module.exports.plane = function Plane(renderNode, options) {
    options = options || {};
    var plane = new Geometry(renderNode, options);

    var detailX = options.detailX || options.detail || 1;
    var detailY = options.detailY || options.detail || 1;

    for (var y = 0; y <= detailY; y++) {
        var t = y / detailY;
        for (var x = 0; x <= detailX; x++) {
            var s = x / detailX;
            plane.vertices.push([s, t, 0]);
            plane.coords.push([s, 1 - t]);
            plane.normals.push([s, 0, 0]);
            if (x < detailX && y < detailY) {
                var i = x + y * (detailX + 1);
                plane.triangles.push([i, i + 1, i + detailX + 1]);
                plane.triangles.push([i + detailX + 1, i + 1, i + detailX + 2]);
            }
        }
    }

    plane.compile();

    return plane;
};

for (var i in module.exports)
    module.exports[i].toString = function () {
        return 'geometry';
    };

},{"./Geometry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/Geometry.js","./indexer":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/indexer.js","./vector":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/vector.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/shader.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: adnan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

var vertexWrapper = [
    '//define_vsChunk',

    'vec4 clipspace(in vec4 pos) {',
    'return vec4(2. * (pos.x / resolution.x) - 1.,',
    '            1. - (pos.y / resolution.y) * 2.,',
    '-pos.z / 1000.,',
    'pos.w);', 
    '}',
    'vec4 pipeline_pos(in vec4 pos) {',
    '    //apply_vsChunk', 

    '    pos = vec4(pos.xy * resolution.xy, 0., 1.0);',
    '    pos.xy *= size.xy / resolution.xy;',
    '    pos.xy -= size.xy * origin;',
    '    pos = perspective * transform * pos;',    
    '    pos.xy += size.xy * origin;',
    '    return clipspace(pos);',  
    '}',

    'void main() {',
    '    v_normal = a_normal;',
    '    v_texCoord = a_texCoord;',
    '    gl_Position = pipeline_pos(a_pos);',
    '}'
].join('\n');

var fragmentWrapper = [
    '//define_fsChunk',  
    'vec4 pipeline_color(in vec4 color) {',
    '    //apply_fsChunk',  
    '    return color;', 
    '}',

    'void main() {',
    '    vec4 color;',
    '    color = pipeline_color(vec4(1. - v_normal, 1.));',
    '    gl_FragColor = color;',
    '}'
].join('\n');

var header = ['precision mediump float;',
              'uniform mat4 transform;',
              'uniform mat4 perspective;',
              'uniform float focalDepth;',
              'uniform vec3 size;',
              'uniform vec3 resolution;',
              'uniform vec2 origin;',
              'uniform sampler2D texture;',
              'uniform float brightness;',
              'uniform float opacity;',
              'uniform float clock;',
              'uniform vec2 mouse;',
              'varying vec2 v_texCoord;',
              'varying vec3 v_normal;'
             ].join('\n');

var vertexHeader = header + [
    'attribute vec4 a_pos;',
    'attribute vec2 a_texCoord;',
    'attribute vec3 a_normal;',
    'attribute vec4 a_color;'
].join('\n');

var fragmentHeader = header + '';

function Shader(gl, materials) {
    this.gl = gl;

    var vsChunkDefines = '';
    var vsChunkApplies = '';
    var fsChunkDefines = '';
    var fsChunkApplies = '';

    materials.forEach(function (chunk) {
        if (! chunk) return;
        if (chunk.vsChunk) {
            vsChunkDefines += chunk.vsChunk.defines || '';
            vsChunkApplies += chunk.vsChunk.apply || '';
        };
        
        if (chunk.fsChunk) {
            fsChunkDefines += chunk.fsChunk.defines || '';
            fsChunkApplies += chunk.fsChunk.apply || '';
        };
    });
    
    var vertexSource = vertexHeader + vertexWrapper
            .replace('//define_vsChunk', vsChunkDefines)
            .replace('//apply_vsChunk', vsChunkApplies);
    
    var fragmentSource = fragmentHeader + fragmentWrapper
            .replace('//define_fsChunk', fsChunkDefines)
            .replace('//apply_fsChunk', fsChunkApplies);

    function compileSource(type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            var i =  1;
            console.log(source.replace(/\n/g, function () { return '\n' + (i++) + ': '; }));
            throw 'compile error: ' + gl.getShaderInfoLog(shader);
        }
        return shader;
    }
    
    this.program = gl.createProgram();
    gl.attachShader(this.program, compileSource(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(this.program, compileSource(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        throw 'link error: ' + gl.getProgramInfoLog(this.program);
    }
    this.attributes = {};
    this.uniformLocations = {};

    var isSampler = this.isSampler = {};

    regexMap(/uniform\s+sampler(1D|2D|3D|Cube)\s+(\w+)\s*;/g, vertexSource + fragmentSource,
             function(groups) { isSampler[groups[2]] = 1; }
            );
    
}

function isNumber(n) {
    return ! isNaN(parseFloat(n)) && isFinite(n);
}

Shader.prototype = {
    uniforms: function(uniforms) {
        var gl = this.gl;

        gl.useProgram(this.program);

        for (var name in uniforms) {
            var location = this.uniformLocations[name] || gl.getUniformLocation(this.program, name);
            if (!location) continue;
            this.uniformLocations[name] = location;
            var value = uniforms[name];
            if (Array.isArray(value) || value instanceof Float32Array) {
                switch (value.length) {
                case 1: gl.uniform1fv(location, new Float32Array(value)); break;
                case 2: gl.uniform2fv(location, new Float32Array(value)); break;
                case 3: gl.uniform3fv(location, new Float32Array(value)); break;
                case 4: gl.uniform4fv(location, new Float32Array(value)); break;
                case 9: gl.uniformMatrix3fv(location, false, new Float32Array(value)); break;
                case 16: gl.uniformMatrix4fv(location, false, new Float32Array(value)); break;
                default: throw 'dont know how to load uniform "' + name + '" of length ' + value.length;
                }
            } else if (isNumber(value)) {
                (this.isSampler[name] ? gl.uniform1i : gl.uniform1f).call(gl, location, value);
            } else {
                throw 'attempted to set uniform "' + name + '" to invalid value ' + value;
            }
        }

        return this;
    },

    draw: function(mesh, mode) {
        this.drawBuffers(mesh.vertexBuffers,
                         mesh.indexBuffers[mode == this.gl.LINES ? 'lines' : 'triangles'],
                         arguments.length < 2 ? this.gl.TRIANGLES : mode);
    },

    drawBuffers: function(vertexBuffers, indexBuffer, mode) {
        var length = 0;
        var gl = this.gl;
        for (var attribute in vertexBuffers) {
            var buffer = vertexBuffers[attribute];
            var location = this.attributes[attribute] ||
                    gl.getAttribLocation(this.program, attribute);
            if (location == -1 || !buffer.buffer) continue;
            this.attributes[attribute] = location;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, buffer.buffer.spacing, gl.FLOAT, gl.FALSE, 0, 0);
            length = buffer.buffer.length / buffer.buffer.spacing;
        }

        for (var attribute in this.attributes) {
            if (!(attribute in vertexBuffers))
                gl.disableVertexAttribArray(this.attributes[attribute]);
        }

        if (length && (!indexBuffer || indexBuffer.buffer)) {
            if (indexBuffer) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer);
                gl.drawElements(mode, indexBuffer.buffer.length, gl.UNSIGNED_SHORT, 0);
            } else {
                gl.drawArrays(mode, 0, length);
            }
        }

        return this;
    }
};

function regexMap(regex, text, callback) {
    var result;
    while ((result = regex.exec(text)) != null) callback(result);
}

module.exports = Shader;

},{}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/texture.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: adnan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */
'use strict';
function Texture(gl, width, height, options) {
    options = options || {};
    this.id = gl.createTexture();
    this.width = options.width;
    this.height = options.height;
    this.format = options.format || gl.RGBA;
    this.type = options.type || gl.UNSIGNED_BYTE;
    this.gl = gl;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.bindTexture(gl.TEXTURE_2D, this.id);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,
                     gl[options.filter || options.magFilter] || gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                     gl[options.filter || options.minFilter] || gl.NEAREST);


    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
                     gl[options.wrap || options.wrapS] || gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
                     gl[options.wrap || options.wrapS] || gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, null);
}

Texture.prototype = {
    bind: function(unit) {
        var gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + (unit || 0));
        gl.bindTexture(gl.TEXTURE_2D, this.id);
    },

    unbind: function(unit) {
        var gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + (unit || 0));
        gl.bindTexture(gl.TEXTURE_2D, null);
    },

    image: function (img) {
        var gl = this.gl;

        gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type, img);
    },

    readBack: function(x, y, width, height) {
        var gl = this.gl;
        x = x || 0;
        y = y || 0;
        width = width || this.width;
        height = height || this.height;
        var fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE) {
            var pixels = new Uint8Array(width * height * 4);
            gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        }
        return pixels;
    }
};

module.exports = Texture;


},{}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/vector.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

/**
 * Three-element floating point vector.
 *
 * @class Vector
 * @constructor
 *
 * @param {number} x x element value
 * @param {number} y y element value
 * @param {number} z z element value
 */

function Vector(x,y,z) {
    if (arguments.length === 1) this.set(x);
    else {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }
    return this;
}
var _register = new Vector(0,0,0);

/**
 * Add this element-wise to another Vector, element-wise.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method add
 * @param {Vector} v addend
 * @return {Vector} vector sum
 */
Vector.prototype.add = function add(v) {
    return _setXYZ.call(_register,
                        this.x + v.x,
                        this.y + v.y,
                        this.z + v.z
                       );
};

/**
 * Subtract another vector from this vector, element-wise.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method sub
 * @param {Vector} v subtrahend
 * @return {Vector} vector difference
 */
Vector.prototype.sub = function sub(v) {
    return _setXYZ.call(_register,
                        this.x - v.x,
                        this.y - v.y,
                        this.z - v.z
                       );
};

/**
 * Scale Vector by floating point r.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method mult
 *
 * @param {number} r scalar
 * @return {Vector} vector result
 */
Vector.prototype.mult = function mult(r) {
    return _setXYZ.call(_register,
                        r * this.x,
                        r * this.y,
                        r * this.z
                       );
};

/**
 * Scale Vector by floating point 1/r.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method div
 *
 * @param {number} r scalar
 * @return {Vector} vector result
 */
Vector.prototype.div = function div(r) {
    return this.mult(1 / r);
};

/**
 * Given another vector v, return cross product (v)x(this).
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method cross
 * @param {Vector} v Left Hand Vector
 * @return {Vector} vector result
 */
Vector.prototype.cross = function cross(v) {
    var x = this.x;
    var y = this.y;
    var z = this.z;
    var vx = v.x;
    var vy = v.y;
    var vz = v.z;

    return _setXYZ.call(_register,
                        z * vy - y * vz,
                        x * vz - z * vx,
                        y * vx - x * vy
                       );
};

/**
 * Component-wise equality test between this and Vector v.
 * @method equals
 * @param {Vector} v vector to compare
 * @return {boolean}
 */
Vector.prototype.equals = function equals(v) {
    return (v.x === this.x && v.y === this.y && v.z === this.z);
};

/**
 * Rotate clockwise around x-axis by theta radians.
 *   Note: This sets the internal result register, so other references to that vector will change.
 * @method rotateX
 * @param {number} theta radians
 * @return {Vector} rotated vector
 */
Vector.prototype.rotateX = function rotateX(theta) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    return _setXYZ.call(_register,
                        x,
                        y * cosTheta - z * sinTheta,
                        y * sinTheta + z * cosTheta
                       );
};

/**
 * Rotate clockwise around y-axis by theta radians.
 *   Note: This sets the internal result register, so other references to that vector will change.
 * @method rotateY
 * @param {number} theta radians
 * @return {Vector} rotated vector
 */
Vector.prototype.rotateY = function rotateY(theta) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    return _setXYZ.call(_register,
                        z * sinTheta + x * cosTheta,
                        y,
                        z * cosTheta - x * sinTheta
                       );
};

/**
 * Rotate clockwise around z-axis by theta radians.
 *   Note: This sets the internal result register, so other references to that vector will change.
 * @method rotateZ
 * @param {number} theta radians
 * @return {Vector} rotated vector
 */
Vector.prototype.rotateZ = function rotateZ(theta) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    return _setXYZ.call(_register,
                        x * cosTheta - y * sinTheta,
                        x * sinTheta + y * cosTheta,
                        z
                       );
};

/**
 * Return dot product of this with a second Vector
 * @method dot
 * @param {Vector} v second vector
 * @return {number} dot product
 */
Vector.prototype.dot = function dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
};

/**
 * Return squared length of this vector
 * @method normSquared
 * @return {number} squared length
 */
Vector.prototype.normSquared = function normSquared() {
    return this.dot(this);
};

/**
 * Return length of this vector
 * @method norm
 * @return {number} length
 */
Vector.prototype.norm = function norm() {
    return Math.sqrt(this.normSquared());
};

/**
 * Scale Vector to specified length.
 *   If length is less than internal tolerance, set vector to [length, 0, 0].
 *   Note: This sets the internal result register, so other references to that vector will change.
 * @method normalize
 *
 * @param {number} length target length, default 1.0
 * @return {Vector}
 */
Vector.prototype.normalize = function normalize(length) {
    if (arguments.length === 0) length = 1;
    var norm = this.norm();

    if (norm > 1e-7) return _setFromVector.call(_register, this.mult(length / norm));
    else return _setXYZ.call(_register, length, 0, 0);
};

/**
 * Make a separate copy of the Vector.
 *
 * @method clone
 *
 * @return {Vector}
 */
Vector.prototype.clone = function clone() {
    return new Vector(this);
};

/**
 * True if and only if every value is 0 (or falsy)
 *
 * @method isZero
 *
 * @return {boolean}
 */
Vector.prototype.isZero = function isZero() {
    return !(this.x || this.y || this.z);
};

function _setXYZ(x,y,z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
}

function _setFromArray(v) {
    return _setXYZ.call(this,v[0],v[1],v[2] || 0);
}

function _setFromVector(v) {
    return _setXYZ.call(this, v.x, v.y, v.z);
}

function _setFromNumber(x) {
    return _setXYZ.call(this,x,0,0);
}

/**
 * Set this Vector to the values in the provided Array or Vector.
 *
 * @method set
 * @param {object} v array, Vector, or number
 * @return {Vector} this
 */
Vector.prototype.set = function set(v) {
    if (v instanceof Array)    return _setFromArray.call(this, v);
    if (v instanceof Vector)   return _setFromVector.call(this, v);
    if (typeof v === 'number') return _setFromNumber.call(this, v);
};

Vector.prototype.setXYZ = function(x,y,z) {
    return _setXYZ.apply(this, arguments);
};

Vector.prototype.set1D = function(x) {
    return _setFromNumber.call(this, x);
};

/**
 * Put result of last internal register calculation in specified output vector.
 *
 * @method put
 * @param {Vector} v destination vector
 * @return {Vector} destination vector
 */

Vector.prototype.put = function put(v) {
    if (this === _register) _setFromVector.call(v, _register);
    else _setFromVector.call(v, this);
};

/**
 * Set this vector to [0,0,0]
 *
 * @method clear
 */
Vector.prototype.clear = function clear() {
    return _setXYZ.call(this,0,0,0);
};

/**
 * Scale this Vector down to specified "cap" length.
 *   If Vector shorter than cap, or cap is Infinity, do nothing.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method cap
 * @return {Vector} capped vector
 */
Vector.prototype.cap = function vectorCap(cap) {
    if (cap === Infinity) return _setFromVector.call(_register, this);
    var norm = this.norm();
    if (norm > cap) return _setFromVector.call(_register, this.mult(cap / norm));
    else return _setFromVector.call(_register, this);
};

/**
 * Return projection of this Vector onto another.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method project
 * @param {Vector} n vector to project upon
 * @return {Vector} projected vector
 */
Vector.prototype.project = function project(n) {
    return n.mult(this.dot(n));
};

/**
 * Reflect this Vector across provided vector.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method reflectAcross
 * @param {Vector} n vector to reflect across
 * @return {Vector} reflected vector
 */
Vector.prototype.reflectAcross = function reflectAcross(n) {
    n.normalize().put(n);
    return _setFromVector(_register, this.sub(this.project(n).mult(2)));
};

/**
 * Convert Vector to three-element array.
 *
 * @method get
 * @return {array<number>} three-element array
 */
Vector.prototype.get = function get() {
    return [this.x, this.y, this.z];
};

Vector.prototype.get1D = function() {
    return this.x;
};

module.exports = Vector;


Vector.prototype.times = function times(v) {
    return _setXYZ.call(_register,
                        this.x * v.x,
                        this.y * v.y,
                        this.z * v.z
                       );
}


Vector.prototype.toArray = function () {
    return [this.x, this.y, this.z]
}

Vector.fromArray = function (a) {
    return new Vector(a[0], a[1], a[2]);
}

},{}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/math/4x4matrix.js":[function(require,module,exports){
'use strict';

function multiply(outputArray, left, right) {
    var a00 = left[0],  a01 = left[1],  a02 = left[2],  a03 = left[3],
        a10 = left[4],  a11 = left[5],  a12 = left[6],  a13 = left[7],
        a20 = left[8],  a21 = left[9],  a22 = left[10], a23 = left[11],
        a30 = left[12], a31 = left[13], a32 = left[14], a33 = left[15];
    
    var b0 = right[0], b1 = right[1], b2 = right[2], b3 = right[3]; 

    outputArray[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    outputArray[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    outputArray[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    outputArray[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    
    b0 = right[4]; b1 = right[5]; b2 = right[6]; b3 = right[7];

    outputArray[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    outputArray[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    outputArray[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    outputArray[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    
    b0 = right[8]; b1 = right[9]; b2 = right[10]; b3 = right[11];

    outputArray[8]  = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    outputArray[9]  = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    outputArray[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    outputArray[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    
    b0 = right[12]; b1 = right[13]; b2 = right[14]; b3 = right[15];

    outputArray[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    outputArray[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    outputArray[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    outputArray[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return outputArray;
}


function getTranslationFromMultiplication(outputArray, left, right) {
    var a00 = left[0],  a01 = left[1],
        a10 = left[4],  a11 = left[5],
        a20 = left[8],  a21 = left[9],
        a30 = left[12], a31 = left[13];

    var b0 = right[12],
        b1 = right[13],
        b2 = right[14],
        b3 = right[15];

    outputArray[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    outputArray[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    return outputArray;
}

function invert(outputArray, matrix) {
    var a00 = matrix[0],  a01 = matrix[1],  a02 = matrix[2],  a03 = matrix[3],
        a10 = matrix[4],  a11 = matrix[5],  a12 = matrix[6],  a13 = matrix[7],
        a20 = matrix[8],  a21 = matrix[9],  a22 = matrix[10], a23 = matrix[11],
        a30 = matrix[12], a31 = matrix[13], a32 = matrix[14], a33 = matrix[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) return null;
    det = 1.0 / det;

    outputArray[0]  = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    outputArray[1]  = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    outputArray[2]  = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    outputArray[3]  = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    outputArray[4]  = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    outputArray[5]  = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    outputArray[6]  = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    outputArray[7]  = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    outputArray[8]  = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    outputArray[9]  = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    outputArray[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    outputArray[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    outputArray[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    outputArray[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    outputArray[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    outputArray[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return outputArray;
}

function getWfromMultiplication(left, right) {
    var a00 = left[0],  a01 = left[1],  a02 = left[2],  a03 = left[3],
        a10 = left[4],  a11 = left[5],  a12 = left[6],  a13 = left[7],
        a20 = left[8],  a21 = left[9],  a22 = left[10], a23 = left[11],
        a30 = left[12], a31 = left[13], a32 = left[14], a33 = left[15];

    var b0 = right[12], b1 = right[13], b2 = right[14], b3 = right[15];

    return b0*a00 + b1*a10 + b2*a20 + b3*a30 + b0*a01 + b1*a11 + b2*a21 + b3*a31 + b0*a02 + b1*a12 + b2*a22 + b3*a32 + b0*a03 + b1*a13 + b2*a23 + b3*a33;
}

function applyToVector(output, matrix, vector) {
    var a00 = matrix[0],  a01 = matrix[1],  a02 = matrix[2],  a03 = matrix[3],
        a10 = matrix[4],  a11 = matrix[5],  a12 = matrix[6],  a13 = matrix[7],
        a20 = matrix[8],  a21 = matrix[9],  a22 = matrix[10], a23 = matrix[11],
        a30 = matrix[12], a31 = matrix[13], a32 = matrix[14], a33 = matrix[15];

    var v0 = vector[0], v1 = vector[1], v2 = vector[2], v3 = vector[3];

    output[0] = a00 * v0 + a10 * v1 + a20 * v2 + a30 * v3;
    output[1] = a01 * v0 + a11 * v1 + a21 * v2 + a31 * v3;
    output[2] = a02 * v0 + a12 * v1 + a22 * v2 + a32 * v3;
    output[3] = a03 * v0 + a13 * v1 + a23 * v2 + a33 * v3;

    return output;
}

module.exports = {
    multiply                         : multiply,
    getTranslationFromMultiplication : getTranslationFromMultiplication,
    invert                           : invert,
    IDENTITY                         : new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    getWfromMultiplication           : getWfromMultiplication,
    applyToVector                    : applyToVector
};
},{}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/transitions/LiftSystem.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('../core/EntityRegistry');
var liftRoots      = EntityRegistry.addLayer('Lift');

/**
 * LiftSystem is responsible for traversing the scene graph and
 *   updating the Transforms, Sizes, and Opacities of the entities.
 *
 * @class  LiftSystem
 * @system
 * @singleton
 */
var LiftSystem = {};

/**
 * update iterates over each of the Contexts that were registered and
 *   kicks of the recursive updating of their entities.
 *
 * @method update
 */
var test = [];
LiftSystem.update = function update() {
    var rootParams;
    var cleanup = [];
    var lift;

    for (var i = 0; i < liftRoots.length; i++) {
        lift = liftRoots[i].getComponent('LiftComponent');
        rootParams = lift._update();
        rootParams.unshift(liftRoots[i]);
        coreUpdateAndFeed.apply(null, rootParams);

        if (lift.done) {
            liftRoots[i].removeComponent('LiftComponent');
            EntityRegistry.deregister(liftRoots[i], 'Lift');
        }
    }
}

/**
 * coreUpdateAndFeed feeds parent information to an entity and so that
 *   each entity can update their transform.  It 
 *   will then pass down invalidation states and values to any children.
 *
 * @method coreUpdateAndFeed
 * @private
 *   
 * @param  {Entity}  entity           Entity in the scene graph
 * @param  {Number}  transformReport  bitScheme report of transform invalidations
 * @param  {Array}   incomingMatrix   parent transform as a Float32 Array
 */
function coreUpdateAndFeed(entity, transformReport, incomingMatrix) {
    if (!entity) return;
    var transform = entity.getComponent('transform');
    var i         = entity._children.length;

    transformReport = transform._update(transformReport, incomingMatrix);

    while (i--) 
        coreUpdateAndFeed(
            entity._children[i],
            transformReport,
            transform._matrix);
}

module.exports = LiftSystem;

},{"../core/EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/joseph/code/One/Source/Events/EventEmitter.js":[function(require,module,exports){
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
},{}],"/Users/joseph/code/One/Source/Events/EventHandler.js":[function(require,module,exports){
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
},{"./EventEmitter":"/Users/joseph/code/One/Source/Events/EventEmitter.js"}],"/Users/joseph/code/One/Source/Game/Engine.js":[function(require,module,exports){
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
},{"../Events/EventHandler":"/Users/joseph/code/One/Source/Events/EventHandler.js"}],"/Users/joseph/code/One/Source/Game/ImageLoader.js":[function(require,module,exports){
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
},{"../Events/EventHandler":"/Users/joseph/code/One/Source/Events/EventHandler.js"}],"/Users/joseph/code/One/Source/Game/Viewport.js":[function(require,module,exports){
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
},{"../Events/EventHandler":"/Users/joseph/code/One/Source/Events/EventHandler.js"}],"/Users/joseph/code/One/Source/States/Loading.js":[function(require,module,exports){
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
},{"../Events/EventHandler":"/Users/joseph/code/One/Source/Events/EventHandler.js"}],"/Users/joseph/code/One/Source/States/Menu.js":[function(require,module,exports){
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
},{"../Events/EventHandler":"/Users/joseph/code/One/Source/Events/EventHandler.js"}],"/Users/joseph/code/One/Source/States/Playing.js":[function(require,module,exports){
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
},{"../../Libraries/MixedMode/src/famous/core/Engine":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Engine.js","../../Libraries/MixedMode/src/famous/gl/materials":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/materials.js","../../Libraries/MixedMode/src/famous/gl/primitives":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/primitives.js","../Events/EventHandler":"/Users/joseph/code/One/Source/Events/EventHandler.js"}],"/Users/joseph/code/One/Source/main.js":[function(require,module,exports){
var Engine  = require('./Game/Engine');
var Loading = require('./States/Loading');
var Menu    = require('./States/Menu');
var Playing = require('./States/Playing');
var EventHandler = require('./Events/EventHandler');
var ImageLoader  = require('./Game/ImageLoader');
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

Loading.register(ImageLoader);
Loading.load(spritesheet);

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
},{"./Events/EventHandler":"/Users/joseph/code/One/Source/Events/EventHandler.js","./Game/Engine":"/Users/joseph/code/One/Source/Game/Engine.js","./Game/ImageLoader":"/Users/joseph/code/One/Source/Game/ImageLoader.js","./Game/Viewport":"/Users/joseph/code/One/Source/Game/Viewport.js","./States/Loading":"/Users/joseph/code/One/Source/States/Loading.js","./States/Menu":"/Users/joseph/code/One/Source/States/Menu.js","./States/Playing":"/Users/joseph/code/One/Source/States/Playing.js"}]},{},["/Users/joseph/code/One/Source/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvbm9kZV9tb2R1bGVzL2Nzc2lmeS9icm93c2VyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9Db21wb25lbnRzL0NhbWVyYS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvQ29tcG9uZW50cy9Db250YWluZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL0NvbXBvbmVudHMvU3VyZmFjZS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvQ29tcG9uZW50cy9UYXJnZXQuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL0NvbXBvbmVudHMvVHJhbnNmb3JtLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9Db250ZXh0LmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9FbmdpbmUuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL0VudGl0eS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvRW50aXR5UmVnaXN0cnkuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL0xheWVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9PcHRpb25zTWFuYWdlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvUmVuZGVyZXJzL0RPTXJlbmRlcmVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9SZW5kZXJlcnMvRWxlbWVudEFsbG9jYXRvci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvUmVuZGVyZXJzL1dlYkdMUmVuZGVyZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL1N0eWxlc2hlZXQvZmFtb3VzLmNzcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvU3lzdGVtcy9CZWhhdmlvclN5c3RlbS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvU3lzdGVtcy9Db3JlU3lzdGVtLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9TeXN0ZW1zL1JlbmRlclN5c3RlbS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvU3lzdGVtcy9UaW1lU3lzdGVtLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9jb21wb25lbnRzL1RhcmdldC5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2V2ZW50cy9FdmVudEVtaXR0ZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9ldmVudHMvRXZlbnRIYW5kbGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvZ2wvR2VvbWV0cnkuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9nbC9nZW9tZXRyeS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2dsL2luZGV4ZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9nbC9tYXRlcmlhbHMuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9nbC9wcmltaXRpdmVzLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvZ2wvc2hhZGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvZ2wvdGV4dHVyZS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2dsL3ZlY3Rvci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL21hdGgvNHg0bWF0cml4LmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvdHJhbnNpdGlvbnMvTGlmdFN5c3RlbS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvU291cmNlL0V2ZW50cy9FdmVudEVtaXR0ZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL1NvdXJjZS9FdmVudHMvRXZlbnRIYW5kbGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9Tb3VyY2UvR2FtZS9FbmdpbmUuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL1NvdXJjZS9HYW1lL0ltYWdlTG9hZGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9Tb3VyY2UvR2FtZS9WaWV3cG9ydC5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvU291cmNlL1N0YXRlcy9Mb2FkaW5nLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9Tb3VyY2UvU3RhdGVzL01lbnUuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL1NvdXJjZS9TdGF0ZXMvUGxheWluZy5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvU291cmNlL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1WUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3WUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjc3MsIGN1c3RvbURvY3VtZW50KSB7XG4gIHZhciBkb2MgPSBjdXN0b21Eb2N1bWVudCB8fCBkb2N1bWVudDtcbiAgaWYgKGRvYy5jcmVhdGVTdHlsZVNoZWV0KSB7XG4gICAgZG9jLmNyZWF0ZVN0eWxlU2hlZXQoKS5jc3NUZXh0ID0gY3NzO1xuICB9IGVsc2Uge1xuICAgIHZhciBoZWFkID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sXG4gICAgICAgIHN0eWxlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG5cbiAgICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcbiAgXG4gICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IGNzcztcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jLmNyZWF0ZVRleHROb2RlKGNzcykpO1xuICAgIH1cbiAgICBcbiAgICBoZWFkLmFwcGVuZENoaWxkKHN0eWxlKTsgXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzLmJ5VXJsID0gZnVuY3Rpb24odXJsKSB7XG4gIGlmIChkb2N1bWVudC5jcmVhdGVTdHlsZVNoZWV0KSB7XG4gICAgZG9jdW1lbnQuY3JlYXRlU3R5bGVTaGVldCh1cmwpO1xuICB9IGVsc2Uge1xuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSxcbiAgICAgICAgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcblxuICAgIGxpbmsucmVsID0gJ3N0eWxlc2hlZXQnO1xuICAgIGxpbmsuaHJlZiA9IHVybDtcbiAgXG4gICAgaGVhZC5hcHBlbmRDaGlsZChsaW5rKTsgXG4gIH1cbn07XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBNYXRyaXhNYXRoICAgICA9IHJlcXVpcmUoJy4uLy4uL21hdGgvNHg0bWF0cml4Jyk7XG52YXIgT3B0aW9uc01hbmFnZXIgPSByZXF1aXJlKCcuLi9PcHRpb25zTWFuYWdlcicpO1xuXG4vLyBDT05TVFNcbnZhciBDT01QT05FTlRfTkFNRSA9ICdjYW1lcmEnO1xudmFyIFBST0pFQ1RJT04gICAgID0gJ3Byb2plY3Rpb24nO1xuXG4vKipcbiAqIENhbWVyYVxuICpcbiAqIEBjb21wb25lbnQgQ2FtZXJhXG4gKiBAY29uc3RydWN0b3JcbiAqIFxuICogQHBhcmFtIHtFbnRpdHl9IGVudGl0eSAgRW50aXR5IHRoYXQgdGhlIENvbnRhaW5lciBpcyBhIGNvbXBvbmVudCBvZlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBDYW1lcmEoZW50aXR5LCBvcHRpb25zKSB7XG4gICAgdGhpcy5fZW50aXR5ICAgICAgICAgICAgICA9IGVudGl0eTtcbiAgICB0aGlzLl9wcm9qZWN0aW9uVHJhbnNmb3JtID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pO1xuXG4gICAgdGhpcy5vcHRpb25zICAgICAgICAgICAgICA9IE9iamVjdC5jcmVhdGUoQ2FtZXJhLkRFRkFVTFRfT1BUSU9OUyk7XG4gICAgdGhpcy5fb3B0aW9uc01hbmFnZXIgICAgICA9IG5ldyBPcHRpb25zTWFuYWdlcih0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMuX29wdGlvbnNNYW5hZ2VyLm9uKCdjaGFuZ2UnLCBfZXZlbnRzQ2hhbmdlLmJpbmQodGhpcykpOyAvL3JvYnVzdCBpbnRlZ3JhdGlvblxuXG4gICAgaWYgKG9wdGlvbnMpIHRoaXMuc2V0T3B0aW9ucyhvcHRpb25zKTtcblxuICAgIF9yZWNhbGN1bGF0ZVByb2plY3Rpb25UcmFuc2Zvcm0uY2FsbCh0aGlzKTtcbn1cblxuQ2FtZXJhLkRFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBwcm9qZWN0aW9uIDoge1xuICAgICAgICB0eXBlICAgIDogJ3BpbmhvbGUnLFxuICAgICAgICBvcHRpb25zIDoge1xuICAgICAgICAgICAgZm9jYWxQb2ludCA6IFswLCAwLCAtMTAwMF1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkNhbWVyYS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBDT01QT05FTlRfTkFNRTtcbn07XG5cbkNhbWVyYS5wcm9qZWN0aW9uVHJhbnNmb3JtcyA9IHt9O1xuXG5DYW1lcmEucHJvamVjdGlvblRyYW5zZm9ybXMucGluaG9sZSA9IGZ1bmN0aW9uIHBpbmhvbGUodHJhbnNmb3JtLCBmb2NhbFZlY3Rvcikge1xuICAgIHZhciBjb250ZXh0U2l6ZSAgID0gdGhpcy5fZW50aXR5LmdldENvbnRleHQoKS5fc2l6ZTtcbiAgICB2YXIgY29udGV4dFdpZHRoICA9IGNvbnRleHRTaXplWzBdO1xuICAgIHZhciBjb250ZXh0SGVpZ2h0ID0gY29udGV4dFNpemVbMV07XG5cbiAgICB2YXIgZm9jYWxEaXZpZGUgICAgICAgID0gZm9jYWxWZWN0b3JbMl0gPyAxL2ZvY2FsVmVjdG9yWzJdIDogMDtcbiAgICB2YXIgd2lkdGhUb0hlaWdodFJhdGlvID0gKGNvbnRleHRXaWR0aCA+IGNvbnRleHRIZWlnaHQpID8gY29udGV4dFdpZHRoL2NvbnRleHRIZWlnaHQgOiAxO1xuICAgIHZhciBoZWlnaHRUb1dpZHRoUmF0aW8gPSAoY29udGV4dEhlaWdodCA+IGNvbnRleHRXaWR0aCkgPyBjb250ZXh0SGVpZ2h0L2NvbnRleHRXaWR0aCA6IDE7XG5cbiAgICB2YXIgbGVmdCAgID0gLXdpZHRoVG9IZWlnaHRSYXRpbztcbiAgICB2YXIgcmlnaHQgID0gd2lkdGhUb0hlaWdodFJhdGlvO1xuICAgIHZhciB0b3AgICAgPSBoZWlnaHRUb1dpZHRoUmF0aW87XG4gICAgdmFyIGJvdHRvbSA9IC1oZWlnaHRUb1dpZHRoUmF0aW87XG5cbiAgICB2YXIgbHIgPSAxIC8gKGxlZnQgLSByaWdodCk7XG4gICAgdmFyIGJ0ID0gMSAvIChib3R0b20gLSB0b3ApO1xuXG4gICAgdHJhbnNmb3JtWzBdICA9IC0yICogbHI7XG4gICAgdHJhbnNmb3JtWzFdICA9IDA7XG4gICAgdHJhbnNmb3JtWzJdICA9IDA7XG4gICAgdHJhbnNmb3JtWzNdICA9IDA7XG4gICAgXG4gICAgdHJhbnNmb3JtWzRdICA9IDA7XG4gICAgdHJhbnNmb3JtWzVdICA9IC0yICogYnQ7XG4gICAgdHJhbnNmb3JtWzZdICA9IDA7XG4gICAgdHJhbnNmb3JtWzddICA9IDA7XG4gICBcbiAgICB0cmFuc2Zvcm1bOF0gID0gLWZvY2FsRGl2aWRlICogZm9jYWxWZWN0b3JbMF07XG4gICAgdHJhbnNmb3JtWzldICA9IC1mb2NhbERpdmlkZSAqIGZvY2FsVmVjdG9yWzFdO1xuICAgIHRyYW5zZm9ybVsxMF0gPSBmb2NhbERpdmlkZTtcbiAgICB0cmFuc2Zvcm1bMTFdID0gLWZvY2FsRGl2aWRlO1xuICAgIFxuICAgIHRyYW5zZm9ybVsxMl0gPSAwO1xuICAgIHRyYW5zZm9ybVsxM10gPSAwO1xuICAgIHRyYW5zZm9ybVsxNF0gPSAwO1xuICAgIHRyYW5zZm9ybVsxNV0gPSAxO1xuXG4gICAgcmV0dXJuIHRyYW5zZm9ybTtcbn07XG5cbkNhbWVyYS5wcm9qZWN0aW9uVHJhbnNmb3Jtcy5vcnRob2dyYXBoaWMgPSBmdW5jdGlvbiBvcnRob2dyYXBoaWModHJhbnNmb3JtKSB7XG4gICAgdmFyIGNvbnRleHRTaXplICAgPSB0aGlzLl9lbnRpdHkuZ2V0Q29udGV4dCgpLl9zaXplO1xuICAgIHZhciBjb250ZXh0V2lkdGggID0gY29udGV4dFNpemVbMF07XG4gICAgdmFyIGNvbnRleHRIZWlnaHQgPSBjb250ZXh0U2l6ZVsxXTtcblxuICAgIHZhciB3aWR0aFRvSGVpZ2h0UmF0aW8gPSAoY29udGV4dFdpZHRoID4gY29udGV4dEhlaWdodCkgPyBjb250ZXh0V2lkdGgvY29udGV4dEhlaWdodCA6IDE7XG4gICAgdmFyIGhlaWdodFRvV2lkdGhSYXRpbyA9IChjb250ZXh0SGVpZ2h0ID4gY29udGV4dFdpZHRoKSA/IGNvbnRleHRIZWlnaHQvY29udGV4dFdpZHRoIDogMTtcblxuICAgIHZhciBsZWZ0ICAgPSAtd2lkdGhUb0hlaWdodFJhdGlvO1xuICAgIHZhciByaWdodCAgPSB3aWR0aFRvSGVpZ2h0UmF0aW87XG4gICAgdmFyIHRvcCAgICA9IGhlaWdodFRvV2lkdGhSYXRpbztcbiAgICB2YXIgYm90dG9tID0gLWhlaWdodFRvV2lkdGhSYXRpbztcblxuICAgIHZhciBsciA9IDEgLyAobGVmdCAtIHJpZ2h0KTtcbiAgICB2YXIgYnQgPSAxIC8gKGJvdHRvbSAtIHRvcCk7XG4gICAgdmFyIG5mID0gMSAvIChuZWFyIC0gZmFyKTtcblxuICAgIHRyYW5zZm9ybVswXSAgPSAtMiAqIGxyO1xuICAgIHRyYW5zZm9ybVsxXSAgPSAwO1xuICAgIHRyYW5zZm9ybVsyXSAgPSAwO1xuICAgIHRyYW5zZm9ybVszXSAgPSAwO1xuICAgIFxuICAgIHRyYW5zZm9ybVs0XSAgPSAwO1xuICAgIHRyYW5zZm9ybVs1XSAgPSAtMiAqIGJ0O1xuICAgIHRyYW5zZm9ybVs2XSAgPSAwO1xuICAgIHRyYW5zZm9ybVs3XSAgPSAwO1xuICAgIFxuICAgIHRyYW5zZm9ybVs4XSAgPSAwO1xuICAgIHRyYW5zZm9ybVs5XSAgPSAwO1xuICAgIHRyYW5zZm9ybVsxMF0gPSAyICogbmY7XG4gICAgdHJhbnNmb3JtWzExXSA9IDA7XG4gICAgXG4gICAgdHJhbnNmb3JtWzEyXSA9IChsZWZ0ICsgcmlnaHQpICogbHI7XG4gICAgdHJhbnNmb3JtWzEzXSA9ICh0b3AgKyBib3R0b20pICogYnQ7XG4gICAgdHJhbnNmb3JtWzE0XSA9IChmYXIgKyBuZWFyKSAqIG5mO1xuICAgIHRyYW5zZm9ybVsxNV0gPSAxO1xuXG4gICAgcmV0dXJuIHRyYW5zZm9ybTtcbn07XG5cbkNhbWVyYS5wcm9qZWN0aW9uVHJhbnNmb3Jtcy5wZXJzcGVjdGl2ZSA9IGZ1bmN0aW9uIHBlcnNwZWN0aXZlKHRyYW5zZm9ybSwgZm92eSwgbmVhciwgZmFyKSB7XG4gICAgdmFyIGNvbnRleHRTaXplICAgPSB0aGlzLl9lbnRpdHkuZ2V0Q29udGV4dCgpLl9zaXplO1xuICAgIHZhciBjb250ZXh0V2lkdGggID0gY29udGV4dFNpemVbMF07XG4gICAgdmFyIGNvbnRleHRIZWlnaHQgPSBjb250ZXh0U2l6ZVsxXTtcblxuICAgIHZhciBhc3BlY3QgPSBjb250ZXh0V2lkdGgvY29udGV4dEhlaWdodDtcblxuICAgIHZhciBmICA9IDEuMCAvIE1hdGgudGFuKGZvdnkgLyAyKTtcbiAgICB2YXIgbmYgPSAxIC8gKG5lYXIgLSBmYXIpO1xuXG4gICAgdHJhbnNmb3JtWzBdICA9IGYgLyBhc3BlY3Q7XG4gICAgdHJhbnNmb3JtWzFdICA9IDA7XG4gICAgdHJhbnNmb3JtWzJdICA9IDA7XG4gICAgdHJhbnNmb3JtWzNdICA9IDA7XG4gICAgdHJhbnNmb3JtWzRdICA9IDA7XG4gICAgdHJhbnNmb3JtWzVdICA9IGY7XG4gICAgdHJhbnNmb3JtWzZdICA9IDA7XG4gICAgdHJhbnNmb3JtWzddICA9IDA7XG4gICAgdHJhbnNmb3JtWzhdICA9IDA7XG4gICAgdHJhbnNmb3JtWzldICA9IDA7XG4gICAgdHJhbnNmb3JtWzEwXSA9IChmYXIgKyBuZWFyKSAqIG5mO1xuICAgIHRyYW5zZm9ybVsxMV0gPSAtMTtcbiAgICB0cmFuc2Zvcm1bMTJdID0gMDtcbiAgICB0cmFuc2Zvcm1bMTNdID0gMDtcbiAgICB0cmFuc2Zvcm1bMTRdID0gKDIgKiBmYXIgKiBuZWFyKSAqIG5mO1xuICAgIHRyYW5zZm9ybVsxNV0gPSAwO1xuICAgIHJldHVybiB0cmFuc2Zvcm07XG59O1xuXG5mdW5jdGlvbiBfZXZlbnRzQ2hhbmdlKGRhdGEpIHtcbiAgICBpZiAoZGF0YS5pZCA9PT0gUFJPSkVDVElPTikge1xuICAgICAgICBfcmVjYWxjdWxhdGVQcm9qZWN0aW9uVHJhbnNmb3JtLmNhbGwodGhpcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfcmVjYWxjdWxhdGVQcm9qZWN0aW9uVHJhbnNmb3JtKCkge1xuICAgIHZhciBvcHRpb25zID0gW3RoaXMuX3Byb2plY3Rpb25UcmFuc2Zvcm1dO1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLm9wdGlvbnMucHJvamVjdGlvbi5vcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMucHVzaCh0aGlzLm9wdGlvbnMucHJvamVjdGlvbi5vcHRpb25zW2tleV0pO1xuICAgIH1cbiAgICByZXR1cm4gQ2FtZXJhLnByb2plY3Rpb25UcmFuc2Zvcm1zW3RoaXMub3B0aW9ucy5wcm9qZWN0aW9uLnR5cGVdLmFwcGx5KHRoaXMsIG9wdGlvbnMpO1xufVxuXG5DYW1lcmEucHJvdG90eXBlLmdldFByb2plY3Rpb25UcmFuc2Zvcm0gPSBmdW5jdGlvbiBnZXRQcm9qZWN0aW9uVHJhbnNmb3JtKCkge1xuICAgIHJldHVybiB0aGlzLl9wcm9qZWN0aW9uVHJhbnNmb3JtO1xufTtcblxuQ2FtZXJhLnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuX29wdGlvbnNNYW5hZ2VyLnNldE9wdGlvbnMob3B0aW9ucyk7XG59O1xuXG5DYW1lcmEucHJvdG90eXBlLmdldE9wdGlvbnMgPSBmdW5jdGlvbiBnZXRPcHRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEVudGl0eVJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi4vRW50aXR5UmVnaXN0cnknKTtcbnZhciBNYXRyaXhNYXRoICAgICA9IHJlcXVpcmUoJy4uLy4uL21hdGgvNHg0bWF0cml4Jyk7XG52YXIgRXZlbnRIYW5kbGVyICAgPSByZXF1aXJlKCcuLi8uLi9ldmVudHMvRXZlbnRIYW5kbGVyJyk7XG52YXIgR0wgICA9IHJlcXVpcmUoJy4uL1JlbmRlcmVycy9XZWJHTFJlbmRlcmVyJyk7XG5cbi8vIENvbnN0c1xudmFyIENPTlRBSU5FUiA9ICdjb250YWluZXInO1xuXG4vKipcbiAqIENvbnRhaW5lciBpcyBhIGNvbXBvbmVudCB0aGF0IGNhbiBiZSBhZGRlZCB0byBhbiBFbnRpdHkgdGhhdFxuICogICBpcyByZXByZXNlbnRlZCBieSBhIERPTSBub2RlIHRocm91Z2ggd2hpY2ggb3RoZXIgcmVuZGVyYWJsZXNcbiAqICAgaW4gdGhlIHNjZW5lIGdyYXBoIGNhbiBiZSBkcmF3biBpbnNpZGUgb2YuXG4gKlxuICogQGNsYXNzIENvbnRhaW5lclxuICogQGNvbXBvbmVudFxuICogQGNvbnN0cnVjdG9yXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgIEVudGl0eSB0aGF0IHRoZSBDb250YWluZXIgaXMgYSBjb21wb25lbnQgb2ZcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gQ29udGFpbmVyKGVudGl0eSwgb3B0aW9ucykge1xuICAgIHRoaXMuZ2wgPSBHTC5pbml0KG9wdGlvbnMpO1xuICAgIC8vIFRPRE86IE1vc3Qgb2YgdGhlc2UgcHJvcGVydGllcyBzaG91bGQgYmUgYWNjZXNzZWQgZnJvbSBnZXR0ZXIgTWV0aG9kcywgbm90IHJlYWQgZGlyZWN0bHkgYXMgdGhleSBjdXJyZW50bHkgYXJlIGluIERPTVJlbmRlcmVyXG4gICAgRW50aXR5UmVnaXN0cnkucmVnaXN0ZXIoZW50aXR5LCAnSGFzQ29udGFpbmVyJyk7XG4gICAgdGhpcy5fZW50aXR5ICAgICAgICA9IGVudGl0eTtcbiAgICB0aGlzLl9jb250YWluZXIgICAgID0gb3B0aW9ucy5jb250YWluZXI7XG4gICAgdmFyIHRyYW5zZm9ybSAgICAgICA9IGVudGl0eS5nZXRDb21wb25lbnQoJ3RyYW5zZm9ybScpO1xuICAgIHRoaXMuX2ludmVyc2VNYXRyaXggPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSk7XG4gICAgdGhpcy5fc2l6ZSAgICAgICAgICA9IG9wdGlvbnMuc2l6ZSB8fCBlbnRpdHkuZ2V0Q29udGV4dCgpLl9zaXplLnNsaWNlKCk7XG4gICAgdGhpcy5vcmlnaW4gICAgICAgICA9IFswLjUsIDAuNV07XG5cbiAgICB0aGlzLl9ldmVudE91dHB1dCA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbiAgICB0aGlzLl9ldmVudE91dHB1dC5iaW5kVGhpcyh0aGlzKTtcblxuICAgIHRoaXMuX2V2ZW50cyA9IHtcbiAgICAgICAgZXZlbnRGb3J3YXJkZXI6IGZ1bmN0aW9uIGV2ZW50Rm9yd2FyZGVyKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoZXZlbnQudHlwZSwgZXZlbnQpO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpLFxuICAgICAgICBvbiAgICA6IFtdLFxuICAgICAgICBvZmYgICA6IFtdLFxuICAgICAgICBkaXJ0eSA6IGZhbHNlXG4gICAgfTtcblxuICAgIHRoaXMuX3RyYW5zZm9ybURpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9zaXplRGlydHkgICAgICA9IHRydWU7XG5cbiAgICAvLyBJbnZlcnNlcyB0aGUgQ29udGFpbmVyJ3MgdHJhbnNmb3JtIG1hdHJpeCB0byBoYXZlIGVsZW1lbnRzIG5lc3RlZCBpbnNpZGVcbiAgICAvLyB0byBhcHBlYXIgaW4gd29ybGQgc3BhY2UuXG4gICAgdHJhbnNmb3JtLm9uKCdpbnZhbGlkYXRlZCcsIGZ1bmN0aW9uKHJlcG9ydCkge1xuICAgICAgICBNYXRyaXhNYXRoLmludmVydCh0aGlzLl9pbnZlcnNlTWF0cml4LCB0cmFuc2Zvcm0uX21hdHJpeCk7XG4gICAgICAgIHRoaXMuX3RyYW5zZm9ybURpcnR5ID0gdHJ1ZTtcbiAgICB9LmJpbmQodGhpcykpO1xufVxuXG5Db250YWluZXIudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gQ09OVEFJTkVSO1xufTtcblxuLyoqXG4gKiBCaW5kIGEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYW4gZXZlbnQgdHlwZSBoYW5kbGVkIGJ5IHRoaXMgb2JqZWN0J3NcbiAqICBFdmVudEhhbmRsZXIuXG4gKlxuICogQG1ldGhvZCBvblxuICogQGNoYWluYWJsZVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBoYW5kbGVyIGNhbGxiYWNrXG4gKi9cbkNvbnRhaW5lci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgY2IpIHtcbiAgICBpZiAodHlwZW9mIGV2ZW50ID09PSAnc3RyaW5nJyAmJiBjYiBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0Lm9uKGV2ZW50LCBjYik7XG4gICAgICAgIGlmICh0aGlzLl9ldmVudHMub24uaW5kZXhPZihldmVudCkgPCAwKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMub24ucHVzaChldmVudCk7XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMuZGlydHkgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2V2ZW50cy5vZmYuaW5kZXhPZihldmVudCk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB0aGlzLl9ldmVudHMub2ZmLnNwbGljZShpbmRleCwgMSk7XG4gICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcignb24gdGFrZXMgYW4gZXZlbnQgbmFtZSBhcyBhIHN0cmluZyBhbmQgYSBjYWxsYmFjayB0byBiZSBmaXJlZCB3aGVuIHRoYXQgZXZlbnQgaXMgcmVjZWl2ZWQnKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGEgZnVuY3Rpb24gdG8gYSBwYXJ0aWN1bGFyIGV2ZW50IG9jY3VyaW5nLlxuICpcbiAqIEBtZXRob2QgIG9mZlxuICogQGNoYWluYWJsZVxuICogXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgbmFtZSBvZiB0aGUgZXZlbnQgdG8gY2FsbCB0aGUgZnVuY3Rpb24gd2hlbiBvY2N1cmluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IGlzIHJlY2lldmVkLlxuICovXG5Db250YWluZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uIG9mZihldmVudCwgY2IpIHtcbiAgICBpZiAodHlwZW9mIGV2ZW50ID09PSAnc3RyaW5nJyAmJiBjYiBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2V2ZW50cy5vbi5pbmRleE9mKGV2ZW50KTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYik7XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMub24uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cy5vZmYucHVzaChldmVudCk7XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMuZGlydHkgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcignb2ZmIHRha2VzIGFuIGV2ZW50IG5hbWUgYXMgYSBzdHJpbmcgYW5kIGEgY2FsbGJhY2sgdG8gYmUgZmlyZWQgd2hlbiB0aGF0IGV2ZW50IGlzIHJlY2VpdmVkJyk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBldmVudCBoYW5kbGVyIG9iamVjdCB0byB0aGUgRXZlbnRIYW5kbGVyJ3MgZG93bnN0cmVhbSBoYW5kbGVycy5cbiAqXG4gKiBAbWV0aG9kIHBpcGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gdGFyZ2V0IGV2ZW50IGhhbmRsZXIgdGFyZ2V0IG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSBwYXNzZWQgZXZlbnQgaGFuZGxlclxuICovXG5Db250YWluZXIucHJvdG90eXBlLnBpcGUgPSBmdW5jdGlvbiBwaXBlKHRhcmdldCkge1xuICAgIHZhciByZXN1bHQgPSB0aGlzLl9ldmVudE91dHB1dC5waXBlKHRhcmdldCk7XG4gICAgZm9yICh2YXIgZXZlbnQgaW4gdGhpcy5fZXZlbnRPdXRwdXQubGlzdGVuZXJzKSB7XG4gICAgICAgIGlmICh0aGlzLl9ldmVudHMub24uaW5kZXhPZihldmVudCkgPCAwKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMub24ucHVzaChldmVudCk7XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMuZGlydHkgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4gLyoqXG4gKiBSZW1vdmUgaGFuZGxlciBvYmplY3QgZnJvbSB0aGUgRXZlbnRIYW5kbGVyJ3MgZG93bnN0cmVhbSBoYW5kbGVycy5cbiAqICAgVW5kb2VzIHdvcmsgb2YgXCJwaXBlXCIuXG4gKlxuICogQG1ldGhvZCB1bnBpcGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gdGFyZ2V0IHRhcmdldCBoYW5kbGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSBwcm92aWRlZCB0YXJnZXRcbiAqL1xuQ29udGFpbmVyLnByb3RvdHlwZS51bnBpcGUgPSBmdW5jdGlvbiB1bnBpcGUodGFyZ2V0KSB7XG4gICAgcmV0dXJuIHRoaXMuX2V2ZW50T3V0cHV0LnVucGlwZSh0YXJnZXQpO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VyIGFuIGV2ZW50LCBzZW5kaW5nIHRvIGFsbCBvZiB0aGUgRXZlbmV0SGFuZGxlcidzIFxuICogIGRvd25zdHJlYW0gaGFuZGxlcnMgbGlzdGVuaW5nIGZvciBwcm92aWRlZCAndHlwZScga2V5LlxuICpcbiAqIEBtZXRob2QgZW1pdFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCBldmVudCBkYXRhXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuQ29udGFpbmVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdCh0eXBlLCBldmVudCkge1xuICAgIGlmIChldmVudCAmJiAhZXZlbnQub3JpZ2luKSBldmVudC5vcmlnaW4gPSB0aGlzO1xuICAgIHZhciBoYW5kbGVkID0gdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCh0eXBlLCBldmVudCk7XG4gICAgaWYgKGhhbmRsZWQgJiYgZXZlbnQgJiYgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKSBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICByZXR1cm4gaGFuZGxlZDtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBkaXNwbGF5IG1hdHJpeCBvZiB0aGUgQ29udGFpbmVyLlxuICpcbiAqIEBtZXRob2QgZ2V0RGlzcGxheU1hdHJpeFxuICogXG4gKiBAcmV0dXJuIHtBcnJheX0gZGlzcGxheSBtYXRyaXggb2YgdGhlIENvbnRhaW5lclxuICovXG5Db250YWluZXIucHJvdG90eXBlLmdldERpc3BsYXlNYXRyaXggPSBmdW5jdGlvbiBnZXREaXNwbGF5TWF0cml4KCkge1xuICAgIHJldHVybiB0aGlzLl9pbnZlcnNlTWF0cml4O1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHNpemUgb2YgdGhlIENvbnRhaW5lci5cbiAqXG4gKiBAbWV0aG9kIGdldFNpemVcbiAqIFxuICogQHJldHVybiB7QXJyYXl9IDIgZGltZW5zaW9uYWwgYXJyYXkgb2YgcmVwcmVzZW50aW5nIHRoZSBzaXplIG9mIHRoZSBDb250YWluZXJcbiAqL1xuQ29udGFpbmVyLnByb3RvdHlwZS5nZXRTaXplID0gZnVuY3Rpb24gZ2V0U2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2l6ZTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBzaXplIG9mIHRoZSBDb250YWluZXIuXG4gKlxuICogQG1ldGhvZCBzZXRTaXplXG4gKiBAY2hhaW5hYmxlXG4gKiBcbiAqIEByZXR1cm4ge0FycmF5fSAyIGRpbWVuc2lvbmFsIGFycmF5IG9mIHJlcHJlc2VudGluZyB0aGUgc2l6ZSBvZiB0aGUgQ29udGFpbmVyXG4gKi9cbkNvbnRhaW5lci5wcm90b3R5cGUuc2V0U2l6ZSA9IGZ1bmN0aW9uIHNldFNpemUod2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMuX3NpemVbMF0gICA9IHdpZHRoO1xuICAgIHRoaXMuX3NpemVbMV0gICA9IGhlaWdodDtcbiAgICB0aGlzLl9zaXplRGlydHkgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250YWluZXI7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFbnRpdHlSZWdpc3RyeSA9IHJlcXVpcmUoJy4uL0VudGl0eVJlZ2lzdHJ5JyksXG4gICAgVGFyZ2V0ICAgICAgICAgPSByZXF1aXJlKCcuL1RhcmdldCcpLFxuICAgIEV2ZW50SGFuZGxlciAgID0gcmVxdWlyZSgnLi4vLi4vZXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG4vLyBDT05TVFNcbnZhciBUUkFOU0ZPUk0gPSAndHJhbnNmb3JtJztcbnZhciBTSVpFICAgICAgPSAnc2l6ZSc7XG52YXIgT1BBQ0lUWSAgID0gJ29wYWNpdHknO1xudmFyIFNVUkZBQ0UgICA9ICdzdXJmYWNlJztcblxuLyoqXG4gKiBTdXJmYWNlIGlzIGEgY29tcG9uZW50IHRoYXQgZGVmaW5lcyB0aGUgZGF0YSB0aGF0IHNob3VsZFxuICogICBiZSBkcmF3biB0byBhbiBIVE1MRWxlbWVudC4gIE1hbmFnZXMgQ1NTIHN0eWxlcywgSFRNTCBhdHRyaWJ1dGVzLFxuICogICBjbGFzc2VzLCBhbmQgY29udGVudC5cbiAqXG4gKiBAY2xhc3MgU3VyZmFjZVxuICogQGNvbXBvbmVudFxuICogQGNvbnN0cnVjdG9yXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgdGhlIFN1cmZhY2UgaXMgYSBjb21wb25lbnQgb2ZcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIGluc3RhbnRpYXRpb24gb3B0aW9uc1xuICovXG5mdW5jdGlvbiBTdXJmYWNlKGVudGl0eSwgb3B0aW9ucykge1xuICAgIFRhcmdldC5jYWxsKHRoaXMsIGVudGl0eSwge1xuICAgICAgICB2ZXJ0aWNpZXM6IFtuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwLCAxXSksXG4gICAgICAgICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDFdKSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMV0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwLCAxXSldXG4gICAgfSk7XG5cbiAgICBFbnRpdHlSZWdpc3RyeS5yZWdpc3RlcihlbnRpdHksICdTdXJmYWNlcycpO1xuICAgIEVudGl0eVJlZ2lzdHJ5LnJlZ2lzdGVyKGVudGl0eSwgJ1JlbmRlcmFibGVzJyk7XG4gICAgXG4gICAgdGhpcy5fZW50aXR5ID0gZW50aXR5O1xuICAgIHRoaXMuX3NpemUgICA9IG5ldyBGbG9hdDMyQXJyYXkoWzAsMF0pO1xuXG4gICAgdGhpcy5pbnZhbGlkYXRpb25zID0gMTI3O1xuICAgIHRoaXMuX2V2ZW50T3V0cHV0ICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbiAgICB0aGlzLl9ldmVudE91dHB1dC5iaW5kVGhpcyh0aGlzKTtcbiAgICB0aGlzLl9ldmVudEZvcndhcmRlciA9IGZ1bmN0aW9uIF9ldmVudEZvcndhcmRlcihldmVudCkge1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KGV2ZW50LnR5cGUsIGV2ZW50KTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLnNwZWMgPSB7XG4gICAgICAgIF9pZCAgICAgICAgICAgIDogZW50aXR5Ll9pZCxcbiAgICAgICAgY2xhc3NlcyAgICAgICAgOiBbXSxcbiAgICAgICAgYXR0cmlidXRlcyAgICAgOiB7fSxcbiAgICAgICAgcHJvcGVydGllcyAgICAgOiB7fSxcbiAgICAgICAgY29udGVudCAgICAgICAgOiBudWxsLFxuICAgICAgICBpbnZhbGlkYXRpb25zICA6ICgxIDw8IE9iamVjdC5rZXlzKFN1cmZhY2UuaW52YWxpZGF0aW9ucykubGVuZ3RoKSAtIDEsXG4gICAgICAgIG9yaWdpbiAgICAgICAgIDogbmV3IEZsb2F0MzJBcnJheShbMC41LCAwLjVdKSxcbiAgICAgICAgZXZlbnRzICAgICAgICAgOiBbXSxcbiAgICAgICAgZXZlbnRGb3J3YXJkZXIgOiB0aGlzLl9ldmVudEZvcndhcmRlclxuICAgIH07XG5cbiAgICBlbnRpdHkuZ2V0Q29tcG9uZW50KFRSQU5TRk9STSkub24oJ2ludmFsaWRhdGVkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLnRyYW5zZm9ybTtcbiAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faGFzT3JpZ2luID0gdHJ1ZTtcbn1cblxuU3VyZmFjZS5wcm90b3R5cGUgICAgICAgICAgICAgPSBPYmplY3QuY3JlYXRlKFRhcmdldC5wcm90b3R5cGUpO1xuU3VyZmFjZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdXJmYWNlO1xuXG4vLyBJbnZhbGlkYXRpb24gU2NoZW1lXG5TdXJmYWNlLmludmFsaWRhdGlvbnMgPSB7XG4gICAgY2xhc3NlcyAgICA6IDEsXG4gICAgcHJvcGVydGllcyA6IDIsXG4gICAgYXR0cmlidXRlcyA6IDQsXG4gICAgY29udGVudCAgICA6IDgsXG4gICAgdHJhbnNmb3JtICA6IDE2LFxuICAgIHNpemUgICAgICAgOiAzMixcbiAgICBvcGFjaXR5ICAgIDogNjQsXG4gICAgb3JpZ2luICAgICA6IDEyOCxcbiAgICBldmVudHMgICAgIDogMjU2XG59O1xuXG5TdXJmYWNlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7cmV0dXJuIFNVUkZBQ0U7fTtcblxuLyoqXG4gKiBHZXQgdGhlIEVudGl0eSB0aGUgU3VyZmFjZSBpcyBhIGNvbXBvbmVudCBvZi5cbiAqXG4gKiBAbWV0aG9kIGdldEVudGl0eVxuICpcbiAqIEByZXR1cm4ge0VudGl0eX0gdGhlIEVudGl0eSB0aGUgU3VyZmFjZSBpcyBhIGNvbXBvbmVudCBvZlxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5nZXRFbnRpdHkgPSBmdW5jdGlvbiBnZXRFbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2VudGl0eTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBvcHRpb25zIG9mIHRoZSBTdXJmYWNlLlxuICpcbiAqIEBtZXRob2Qgc2V0T3B0aW9uc1xuICogXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBvYmplY3Qgb2Ygb3B0aW9uc1xuICovXG5TdXJmYWNlLnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMucHJvcGVydGllcykgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRQcm9wZXJ0aWVzKG9wdGlvbnMucHJvcGVydGllcyk7XG4gICAgaWYgKG9wdGlvbnMuY2xhc3NlcykgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRDbGFzc2VzKG9wdGlvbnMuY2xhc3Nlcyk7XG4gICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlcykgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGVzKG9wdGlvbnMuYXR0cmlidXRlcyk7XG4gICAgaWYgKG9wdGlvbnMuY29udGVudCB8fCBvcHRpb25zLmNvbnRlbnQgPT09ICcnKSAgdGhpcy5zZXRDb250ZW50KG9wdGlvbnMuY29udGVudCk7XG4gICAgaWYgKG9wdGlvbnMuc2l6ZSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTaXplKG9wdGlvbnMuc2l6ZSk7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgQ1NTIGNsYXNzZXMgdG8gYmUgYSBuZXcgQXJyYXkgb2Ygc3RyaW5ncy5cbiAqXG4gKiBAbWV0aG9kIHNldENsYXNzZXNcbiAqIFxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgb2YgQ1NTIGNsYXNzZXNcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuc2V0Q2xhc3NlcyA9IGZ1bmN0aW9uIHNldENsYXNzZXMoY2xhc3NMaXN0KSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGNsYXNzTGlzdCkpIHRocm93IG5ldyBFcnJvcihcIlN1cmZhY2U6IGV4cGVjdHMgYW4gQXJyYXkgdG8gYmUgcGFzc2VkIHRvIHNldENsYXNzZXNcIik7XG5cbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIHJlbW92YWwgPSBbXTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnNwZWMuY2xhc3Nlcy5sZW5ndGg7IGkrKylcbiAgICAgICAgaWYgKGNsYXNzTGlzdC5pbmRleE9mKHRoaXMuc3BlYy5jbGFzc2VzW2ldKSA8IDApXG4gICAgICAgICAgICByZW1vdmFsLnB1c2godGhpcy5zcGVjLmNsYXNzZXNbaV0pO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IHJlbW92YWwubGVuZ3RoOyBpKyspICAgdGhpcy5yZW1vdmVDbGFzcyhyZW1vdmFsW2ldKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgY2xhc3NMaXN0Lmxlbmd0aDsgaSsrKSB0aGlzLmFkZENsYXNzKGNsYXNzTGlzdFtpXSk7XG5cbiAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLnNpemU7XG59O1xuXG4vKipcbiAqIFJldHVybiBhbGwgb2YgdGhlIGNsYXNzZXMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgU3VyZmFjZVxuICpcbiAqIEBtZXRob2QgZ2V0Q2xhc3Nlc1xuICogXG4gKiBAcmV0dXJuIHtBcnJheX0gYXJyYXkgb2YgQ1NTIGNsYXNzZXNcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuZ2V0Q2xhc3NlcyA9IGZ1bmN0aW9uIGdldENsYXNzZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3BlYy5jbGFzc2VzO1xufTtcblxuLyoqXG4gKiBBZGQgYSBzaW5nbGUgY2xhc3MgdG8gdGhlIFN1cmZhY2UncyBsaXN0IG9mIGNsYXNzZXMuXG4gKiAgIEludmFsaWRhdGVzIHRoZSBTdXJmYWNlJ3MgY2xhc3Nlcy5cbiAqXG4gKiBAbWV0aG9kIGFkZENsYXNzXG4gKiBcbiAqIEBwYXJhbSB7U3RyaW5nfSBjbGFzc05hbWUgbmFtZSBvZiB0aGUgY2xhc3NcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuYWRkQ2xhc3MgPSBmdW5jdGlvbiBhZGRDbGFzcyhjbGFzc05hbWUpIHtcbiAgICBpZiAodHlwZW9mIGNsYXNzTmFtZSAhPT0gJ3N0cmluZycpIHRocm93IG5ldyBFcnJvcignYWRkQ2xhc3Mgb25seSB0YWtlcyBTdHJpbmdzIGFzIHBhcmFtZXRlcnMnKTtcbiAgICBpZiAodGhpcy5zcGVjLmNsYXNzZXMuaW5kZXhPZihjbGFzc05hbWUpIDwgMCkge1xuICAgICAgICB0aGlzLnNwZWMuY2xhc3Nlcy5wdXNoKGNsYXNzTmFtZSk7XG4gICAgICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMuY2xhc3NlcztcbiAgICB9XG5cbiAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLnNpemU7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhIHNpbmdsZSBjbGFzcyBmcm9tIHRoZSBTdXJmYWNlJ3MgbGlzdCBvZiBjbGFzc2VzLlxuICogICBJbnZhbGlkYXRlcyB0aGUgU3VyZmFjZSdzIGNsYXNzZXMuXG4gKiBcbiAqIEBtZXRob2QgcmVtb3ZlQ2xhc3NcbiAqIFxuICogQHBhcmFtICB7U3RyaW5nfSBjbGFzc05hbWUgY2xhc3MgdG8gcmVtb3ZlXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoY2xhc3NOYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBjbGFzc05hbWUgIT09ICdzdHJpbmcnKSB0aHJvdyBuZXcgRXJyb3IoJ2FkZENsYXNzIG9ubHkgdGFrZXMgU3RyaW5ncyBhcyBwYXJhbWV0ZXJzJyk7XG4gICAgdmFyIGkgPSB0aGlzLnNwZWMuY2xhc3Nlcy5pbmRleE9mKGNsYXNzTmFtZSk7XG4gICAgaWYgKGkgPj0gMCkge1xuICAgICAgICB0aGlzLnNwZWMuY2xhc3Nlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMuY2xhc3NlcztcbiAgICB9XG5cbiAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLnNpemU7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgQ1NTIHByb3BlcnRpZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBTdXJmYWNlLlxuICogICBJbnZhbGlkYXRlcyB0aGUgU3VyZmFjZSdzIHByb3BlcnRpZXMuXG4gKlxuICogQG1ldGhvZCBzZXRQcm9wZXJ0aWVzXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLnNldFByb3BlcnRpZXMgPSBmdW5jdGlvbiBzZXRQcm9wZXJ0aWVzKHByb3BlcnRpZXMpIHtcbiAgICBmb3IgKHZhciBuIGluIHByb3BlcnRpZXMpIHRoaXMuc3BlYy5wcm9wZXJ0aWVzW25dID0gcHJvcGVydGllc1tuXTtcbiAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLnNpemU7XG4gICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy5wcm9wZXJ0aWVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIENTUyBwcm9wZXJ0aWVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgU3VyZmFjZS5cbiAqXG4gKiBAbWV0aG9kIGdldFByb3BlcnRpZXNcbiAqIFxuICogQHJldHVybiB7T2JqZWN0fSBDU1MgcHJvcGVydGllcyBhc3NvY2lhdGVkIHdpdGggdGhlIFN1cmZhY2VcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuZ2V0UHJvcGVydGllcyA9IGZ1bmN0aW9uIGdldFByb3BlcnRpZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3BlYy5wcm9wZXJ0aWVzO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIEhUTUwgYXR0cmlidXRlcyBhc3NvY2lhdGVkIHdpdGggdGhlIFN1cmZhY2UuXG4gKiAgIEludmFsaWRhdGVzIHRoZSBTdXJmYWNlJ3MgYXR0cmlidXRlcy5cbiAqXG4gKiBAbWV0aG9kIHNldEF0dHJpYnV0ZXNcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuc2V0QXR0cmlidXRlcyA9IGZ1bmN0aW9uIHNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcykge1xuICAgIGZvciAodmFyIG4gaW4gYXR0cmlidXRlcykgdGhpcy5zcGVjLmF0dHJpYnV0ZXNbbl0gPSBhdHRyaWJ1dGVzW25dO1xuICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMuYXR0cmlidXRlcztcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBIVE1MIGF0dHJpYnV0ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBTdXJmYWNlLlxuICpcbiAqIEBtZXRob2QgZ2V0QXR0cmlidXRlc1xuICogXG4gKiBAcmV0dXJuIHtPYmplY3R9IEhUTUwgYXR0cmlidXRlcyBhc3NvY2lhdGVkIHdpdGggdGhlIFN1cmZhY2VcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuZ2V0QXR0cmlidXRlcyA9IGZ1bmN0aW9uIGdldEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3BlYy5hdHRyaWJ1dGVzO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGlubmVySFRNTCBhc3NvY2lhdGVkIHdpdGggdGhlIFN1cmZhY2UuXG4gKiAgIEludmFsaWRhdGVzIHRoZSBTdXJmYWNlJ3MgY29udGVudC5cbiAqXG4gKiBAbWV0aG9kIHNldENvbnRlbnRcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuc2V0Q29udGVudCA9IGZ1bmN0aW9uIHNldENvbnRlbnQoY29udGVudCkge1xuICAgIGlmIChjb250ZW50ICE9PSB0aGlzLnNwZWMuY29udGVudCkge1xuICAgICAgICB0aGlzLnNwZWMuY29udGVudCAgID0gY29udGVudDtcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy5jb250ZW50O1xuICAgIH1cbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBpbm5lckhUTUwgYXNzb2NpYXRlZCB3aXRoIHRoZSBTdXJmYWNlLlxuICpcbiAqIEBtZXRob2QgZ2V0Q29udGVudFxuICogXG4gKiBAcmV0dXJuIHtTdHJpbmd9IGlubmVySFRNTCBhc3NvY2lhdGVkIHdpdGggdGhlIFN1cmZhY2VcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuZ2V0Q29udGVudCA9IGZ1bmN0aW9uIGdldENvbnRlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3BlYy5jb250ZW50O1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIHNpemUgb2YgdGhlIFN1cmZhY2UuXG4gKlxuICogQG1ldGhvZCBzZXRTaXplXG4gKlxuICogQHJldHVybiB7QXJyYXl9IDItZGltZW5zaW9uYWwgYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBzaXplIG9mIHRoZSBTdXJmYWNlIGluIHBpeGVscy5cbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuc2V0U2l6ZSA9IGZ1bmN0aW9uIHNldFNpemUoc2l6ZSkge1xuICAgIHZhciBwcm9wZXJ0aWVzID0ge307XG4gICAgaWYgKHNpemVbMF0gIT0gbnVsbCkgcHJvcGVydGllcy53aWR0aCA9IHNpemVbMF0gKyAncHgnO1xuICAgIGlmIChzaXplWzFdICE9IG51bGwpIHByb3BlcnRpZXMuaGVpZ2h0ID0gc2l6ZVsxXSArICdweCc7XG4gICAgdGhpcy5zZXRQcm9wZXJ0aWVzKHByb3BlcnRpZXMpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHNpemUgb2YgdGhlIFN1cmZhY2UuXG4gKlxuICogQG1ldGhvZCBnZXRTaXplXG4gKlxuICogQHJldHVybiB7QXJyYXl9IDItZGltZW5zaW9uYWwgYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBzaXplIG9mIHRoZSBTdXJmYWNlIGluIHBpeGVscy5cbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuZ2V0U2l6ZSA9IGZ1bmN0aW9uIGdldFNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NpemU7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIG9yaWdpbiBvZiB0aGUgU3VyZmFjZS5cbiAqXG4gKiBAbWV0aG9kIHNldE9yaWdpblxuICogQGNoYWluYWJsZVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IG9yaWdpbiBvbiB0aGUgeC1heGlzIGFzIGEgcGVyY2VudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgb3JpZ2luIG9uIHRoZSB5LWF4aXMgYXMgYSBwZXJjZW50XG4gKi9cblN1cmZhY2UucHJvdG90eXBlLnNldE9yaWdpbiAgPSBmdW5jdGlvbiBzZXRPcmlnaW4oeCwgeSkge1xuICAgIGlmICgoeCAhPSBudWxsICYmICh4IDwgMCB8fCB4ID4gMSkpIHx8ICh5ICE9IG51bGwgJiYgKHkgPCAwIHx8IHkgPiAxKSkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignT3JpZ2luIG11c3QgaGF2ZSBhbiB4IGFuZCB5IHZhbHVlIGJldHdlZW4gMCBhbmQgMScpO1xuXG4gICAgdGhpcy5zcGVjLm9yaWdpblswXSA9IHggIT0gbnVsbCA/IHggOiB0aGlzLnNwZWMub3JpZ2luWzBdO1xuICAgIHRoaXMuc3BlYy5vcmlnaW5bMV0gPSB5ICE9IG51bGwgPyB5IDogdGhpcy5zcGVjLm9yaWdpblsxXTtcbiAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLm9yaWdpbjtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSBvcmlnaW4gb2YgdGhlIFN1cmZhY2UuXG4gKlxuICogQG1ldGhvZCBnZXRPcmlnaW5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gMi1kaW1lbnNpb25hbCBhcnJheSByZXByZXNlbnRpbmcgdGhlIFN1cmZhY2UncyBvcmlnaW5cbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuZ2V0T3JpZ2luID0gZnVuY3Rpb24gZ2V0T3JpZ2luKCkge1xuICAgIHJldHVybiB0aGlzLnNwZWMub3JpZ2luO1xufTtcblxuLyoqXG4gKiBSZXNldHMgdGhlIGludmFsaWRhdGlvbnMgb2YgdGhlIFN1cmZhY2VcbiAqXG4gKiBAbWV0aG9kIHJlc2V0SW52YWxpZGF0aW9uc1xuICogQGNoYWluYWJsZVxuICpcbiAqIEByZXR1cm4ge1N1cmZhY2V9IHRoaXNcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUucmVzZXRJbnZhbGlkYXRpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pbnZhbGlkYXRpb25zID0gMDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTWFyayBhbGwgcHJvcGVydGllcyBhcyBpbnZhbGlkYXRlZC5cbiAqXG4gKiBAbWV0aG9kIGludmFsaWRhdGVBbGxcbiAqIEBjaGFpbmFibGVcbiAqXG4gKiBAcmV0dXJuIHtTdXJmYWNlfSB0aGlzXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLmludmFsaWRhdGVBbGwgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmludmFsaWRhdGlvbnMgPSA1MTE7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIFN1cmZhY2Unc1xuICogIEV2ZW50SGFuZGxlci5cbiAqXG4gKiBAbWV0aG9kIG9uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcsIE9iamVjdCl9IGhhbmRsZXIgY2FsbGJhY2tcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgY2IpIHtcbiAgICBpZiAodHlwZW9mIGV2ZW50ID09PSAnc3RyaW5nJyAmJiBjYiBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0Lm9uKGV2ZW50LCBjYik7XG4gICAgICAgIGlmICh0aGlzLnNwZWMuZXZlbnRzLmluZGV4T2YoZXZlbnQpIDwgMCkge1xuICAgICAgICAgICAgdGhpcy5zcGVjLmV2ZW50cy5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMuZXZlbnRzO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBSZW1vdmUgYSBmdW5jdGlvbiB0byBhIHBhcnRpY3VsYXIgZXZlbnQgb2NjdXJpbmcuXG4gKlxuICogQG1ldGhvZCAgb2ZmXG4gKiBcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBuYW1lIG9mIHRoZSBldmVudCB0byBjYWxsIHRoZSBmdW5jdGlvbiB3aGVuIG9jY3VyaW5nXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgcmVjaWV2ZWQuXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uIG9mZihldmVudCwgY2IpIHtcbiAgICBpZiAodHlwZW9mIGV2ZW50ID09PSAnc3RyaW5nJyAmJiBjYiBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuc3BlYy5ldmVudHMuaW5kZXhPZihldmVudCk7XG4gICAgICAgIGlmIChpbmRleCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYik7XG4gICAgICAgICAgICB0aGlzLnNwZWMuZXZlbnRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLmV2ZW50cztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogQWRkIGV2ZW50IGhhbmRsZXIgb2JqZWN0IHRvIHRoZSBFdmVudEhhbmRsZXIncyBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICpcbiAqIEBtZXRob2QgcGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgZXZlbnQgaGFuZGxlciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHBhc3NlZCBldmVudCBoYW5kbGVyXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLnBpcGUgPSBmdW5jdGlvbiBwaXBlKHRhcmdldCkge1xuICAgIHJldHVybiB0aGlzLl9ldmVudE91dHB1dC5waXBlKHRhcmdldCk7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBoYW5kbGVyIG9iamVjdCBmcm9tIHRoZSBFdmVudEhhbmRsZXIncyBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICogICBVbmRvZXMgd29yayBvZiBcInBpcGVcIi5cbiAqXG4gKiBAbWV0aG9kIHVucGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgdGFyZ2V0IGhhbmRsZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHByb3ZpZGVkIHRhcmdldFxuICovXG5TdXJmYWNlLnByb3RvdHlwZS51bnBpcGUgPSBmdW5jdGlvbiB1bnBpcGUodGFyZ2V0KSB7XG4gICAgcmV0dXJuIHRoaXMuX2V2ZW50T3V0cHV0LnVucGlwZSh0YXJnZXQpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHJlbmRlciBzcGVjaWZpY2F0aW9uIG9mIHRoZSBTdXJmYWNlLlxuICpcbiAqIEBtZXRob2QgIHJlbmRlclxuICogXG4gKiBAcmV0dXJuIHtPYmplY3R9IHJlbmRlciBzcGVjaWZpY2F0aW9uXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3BlYy5pbnZhbGlkYXRpb25zID0gdGhpcy5pbnZhbGlkYXRpb25zO1xuICAgIHJldHVybiB0aGlzLnNwZWM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN1cmZhY2U7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBNYXRyaXhNYXRoID0gcmVxdWlyZSgnLi4vLi4vbWF0aC80eDRtYXRyaXgnKTtcblxuLyoqXG4gKiBUYXJnZXQgaXMgdGhlIGJhc2UgY2xhc3MgZm9yIGFsbCByZW5kZXJhYmxlcy4gIEl0IGhvbGRzIHRoZSBzdGF0ZSBvZlxuICogICBpdHMgdmVydGljaWVzLCB0aGUgQ29udGFpbmVycyBpdCBpcyBkZXBsb3llZCBpbiwgdGhlIENvbnRleHQgaXQgYmVsb25nc1xuICogICB0bywgYW5kIHdoZXRoZXIgb3Igbm90IG9yaWdpbiBhbGlnbm1lbnQgbmVlZHMgdG8gYmUgYXBwbGllZC5cbiAqXG4gKiBAY29tcG9uZW50IFRhcmdldFxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtFbnRpdHl9IGVudGl0eSAgRW50aXR5IHRoYXQgdGhlIFRhcmdldCBpcyBhIGNvbXBvbmVudCBvZlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgb3B0aW9uc1xuICovXG5mdW5jdGlvbiBUYXJnZXQoZW50aXR5LCBvcHRpb25zKSB7XG4gICAgdGhpcy52ZXJ0aWNpZXMgID0gb3B0aW9ucy52ZXJ0aWNpZXMgfHwgW107XG4gICAgdGhpcy5jb250YWluZXJzID0ge307XG4gICAgLy8gdGhpcy5jb250ZXh0ICAgID0gZW50aXR5LmdldENvbnRleHQoKS5faWQ7XG4gICAgdGhpcy5faGFzT3JpZ2luID0gZmFsc2U7XG59XG5cbi8qKlxuICogR2V0IHRoZSB2ZXJ0aWNpZXMgb2YgdGhlIFRhcmdldC5cbiAqXG4gKiBAbWV0aG9kIGdldFZlcnRpY2llc1xuICpcbiAqIEByZXR1cm4ge0FycmF5fSBhcnJheSBvZiB0aGUgdmVydGljaWVzIHJlcHJlc2VudGVkIGFzIHRocmVlIGVsZW1lbnQgYXJyYXlzIFt4LCB5LCB6XVxuICovXG5UYXJnZXQucHJvdG90eXBlLmdldFZlcnRpY2llcyA9IGZ1bmN0aW9uIGdldFZlcnRpY2llcygpe1xuICAgIHJldHVybiB0aGlzLnZlcnRpY2llcztcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgVGFyZ2V0IHdhcyBkZXBsb3llZCB0byBhIHBhcnRpY3VsYXIgY29udGFpbmVyXG4gKlxuICogQG1ldGhvZCBfaXNXaXRoaW5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGhlIGlkIG9mIHRoZSBDb250YWluZXIncyBFbnRpdHlcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgb3Igbm93IHRoZSBUYXJnZXQgd2FzIGRlcGxveWVkIHRvIHRoaXMgcGFydGljdWxhciBDb250YWluZXJcbiAqL1xuVGFyZ2V0LnByb3RvdHlwZS5faXNXaXRoaW4gPSBmdW5jdGlvbiBfaXNXaXRoaW4oY29udGFpbmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuY29udGFpbmVyc1tjb250YWluZXIuX2lkXTtcbn07XG5cbi8qKlxuICogTWFyayBhIENvbnRhaW5lciBhcyBoYXZpbmcgYSBkZXBsb3llZCBpbnN0YW5jZSBvZiB0aGUgVGFyZ2V0XG4gKlxuICogQG1ldGhvZCBfYWRkVG9Db250YWluZXJcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGhlIGlkIG9mIHRoZSBDb250YWluZXIncyBFbnRpdHlcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHN0YXVzIG9mIHRoZSBhZGRpdGlvblxuICovXG5UYXJnZXQucHJvdG90eXBlLl9hZGRUb0NvbnRhaW5lciA9IGZ1bmN0aW9uIF9hZGRUb0NvbnRhaW5lcihjb250YWluZXIpIHtcbiAgICB0aGlzLmNvbnRhaW5lcnNbY29udGFpbmVyLl9pZF0gPSB0cnVlO1xuICAgIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBVbm1hcmsgYSBDb250YWluZXIgYXMgaGF2aW5nIGEgZGVwbG95ZWQgaW5zdGFuY2Ugb2YgdGhlIFRhcmdldFxuICpcbiAqIEBtZXRob2QgX3JlbW92ZUZyb21Db250YWluZXJcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGhlIGlkIG9mIHRoZSBDb250YWluZXIncyBFbnRpdHlcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHN0YXVzIG9mIHRoZSByZW1vdmFsXG4gKi9cblRhcmdldC5wcm90b3R5cGUuX3JlbW92ZUZyb21Db250YWluZXIgPSBmdW5jdGlvbiBfcmVtb3ZlRnJvbUNvbnRhaW5lcihjb250YWluZXIpIHtcbiAgICB0aGlzLmNvbnRhaW5lcnNbY29udGFpbmVyLl9pZF0gPSBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGFyZ2V0O1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCcuLi8uLi9ldmVudHMvRXZlbnRFbWl0dGVyJyk7XG5cbi8vIENPTlNUU1xudmFyIElERU5USVRZID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pO1xuXG4vLyBGdW5jdGlvbnMgdG8gYmUgcnVuIHdoZW4gYW4gaW5kZXggaXMgbWFya2VkIGFzIGludmFsaWRhdGVkXG52YXIgVkFMSURBVE9SUyA9IFtcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTAocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFswXSAqIChtZW1vcnlbMl0gKiBtZW1vcnlbNF0pICogdmVjdG9ycy5zY2FsZVswXSArIHBhcmVudFs0XSAqIChtZW1vcnlbMF0gKiBtZW1vcnlbNV0gKyBtZW1vcnlbMV0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNF0pICogdmVjdG9ycy5zY2FsZVswXSArIHBhcmVudFs4XSAqIChtZW1vcnlbMV0gKiBtZW1vcnlbNV0gLSBtZW1vcnlbMF0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNF0pICogdmVjdG9ycy5zY2FsZVswXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlMShwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzFdICogKG1lbW9yeVsyXSAqIG1lbW9yeVs0XSkgKiB2ZWN0b3JzLnNjYWxlWzBdICsgcGFyZW50WzVdICogKG1lbW9yeVswXSAqIG1lbW9yeVs1XSArIG1lbW9yeVsxXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs0XSkgKiB2ZWN0b3JzLnNjYWxlWzBdICsgcGFyZW50WzldICogKG1lbW9yeVsxXSAqIG1lbW9yeVs1XSAtIG1lbW9yeVswXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs0XSkgKiB2ZWN0b3JzLnNjYWxlWzBdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGUyKHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbMl0gKiAobWVtb3J5WzJdICogbWVtb3J5WzRdKSAqIHZlY3RvcnMuc2NhbGVbMF0gKyBwYXJlbnRbNl0gKiAobWVtb3J5WzBdICogbWVtb3J5WzVdICsgbWVtb3J5WzFdICogbWVtb3J5WzNdICogbWVtb3J5WzRdKSAqIHZlY3RvcnMuc2NhbGVbMF0gKyBwYXJlbnRbMTBdICogKG1lbW9yeVsxXSAqIG1lbW9yeVs1XSAtIG1lbW9yeVswXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs0XSkgKiB2ZWN0b3JzLnNjYWxlWzBdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGUzKHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbM10gKiAobWVtb3J5WzJdICogbWVtb3J5WzRdKSAqIHZlY3RvcnMuc2NhbGVbMF0gKyBwYXJlbnRbN10gKiAobWVtb3J5WzBdICogbWVtb3J5WzVdICsgbWVtb3J5WzFdICogbWVtb3J5WzNdICogbWVtb3J5WzRdKSAqIHZlY3RvcnMuc2NhbGVbMF0gKyBwYXJlbnRbMTFdICogKG1lbW9yeVsxXSAqIG1lbW9yeVs1XSAtIG1lbW9yeVswXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs0XSkgKiB2ZWN0b3JzLnNjYWxlWzBdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGU0KHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbMF0gKiAoLW1lbW9yeVsyXSAqIG1lbW9yeVs1XSkgKiB2ZWN0b3JzLnNjYWxlWzFdICsgcGFyZW50WzRdICogKG1lbW9yeVswXSAqIG1lbW9yeVs0XSAtIG1lbW9yeVsxXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs1XSkgKiB2ZWN0b3JzLnNjYWxlWzFdICsgcGFyZW50WzhdICogKG1lbW9yeVsxXSAqIG1lbW9yeVs0XSArIG1lbW9yeVswXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs1XSkgKiB2ZWN0b3JzLnNjYWxlWzFdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGU1KHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbMV0gKiAoLW1lbW9yeVsyXSAqIG1lbW9yeVs1XSkgKiB2ZWN0b3JzLnNjYWxlWzFdICsgcGFyZW50WzVdICogKG1lbW9yeVswXSAqIG1lbW9yeVs0XSAtIG1lbW9yeVsxXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs1XSkgKiB2ZWN0b3JzLnNjYWxlWzFdICsgcGFyZW50WzldICogKG1lbW9yeVsxXSAqIG1lbW9yeVs0XSArIG1lbW9yeVswXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs1XSkgKiB2ZWN0b3JzLnNjYWxlWzFdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGU2KHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbMl0gKiAoLW1lbW9yeVsyXSAqIG1lbW9yeVs1XSkgKiB2ZWN0b3JzLnNjYWxlWzFdICsgcGFyZW50WzZdICogKG1lbW9yeVswXSAqIG1lbW9yeVs0XSAtIG1lbW9yeVsxXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs1XSkgKiB2ZWN0b3JzLnNjYWxlWzFdICsgcGFyZW50WzEwXSAqIChtZW1vcnlbMV0gKiBtZW1vcnlbNF0gKyBtZW1vcnlbMF0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNV0pICogdmVjdG9ycy5zY2FsZVsxXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlNyhwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzNdICogKC1tZW1vcnlbMl0gKiBtZW1vcnlbNV0pICogdmVjdG9ycy5zY2FsZVsxXSArIHBhcmVudFs3XSAqIChtZW1vcnlbMF0gKiBtZW1vcnlbNF0gLSBtZW1vcnlbMV0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNV0pICogdmVjdG9ycy5zY2FsZVsxXSArIHBhcmVudFsxMV0gKiAobWVtb3J5WzFdICogbWVtb3J5WzRdICsgbWVtb3J5WzBdICogbWVtb3J5WzNdICogbWVtb3J5WzVdKSAqIHZlY3RvcnMuc2NhbGVbMV07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTgocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFswXSAqIChtZW1vcnlbM10pICogdmVjdG9ycy5zY2FsZVsyXSArIHBhcmVudFs0XSAqICgtbWVtb3J5WzFdICogbWVtb3J5WzJdKSAqIHZlY3RvcnMuc2NhbGVbMl0gKyBwYXJlbnRbOF0gKiAobWVtb3J5WzBdICogbWVtb3J5WzJdKSAqIHZlY3RvcnMuc2NhbGVbMl07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTkocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFsxXSAqIChtZW1vcnlbM10pICogdmVjdG9ycy5zY2FsZVsyXSArIHBhcmVudFs1XSAqICgtbWVtb3J5WzFdICogbWVtb3J5WzJdKSAqIHZlY3RvcnMuc2NhbGVbMl0gKyBwYXJlbnRbOV0gKiAobWVtb3J5WzBdICogbWVtb3J5WzJdKSAqIHZlY3RvcnMuc2NhbGVbMl07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTEwKHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbMl0gKiAobWVtb3J5WzNdKSAqIHZlY3RvcnMuc2NhbGVbMl0gKyBwYXJlbnRbNl0gKiAoLW1lbW9yeVsxXSAqIG1lbW9yeVsyXSkgKiB2ZWN0b3JzLnNjYWxlWzJdICsgcGFyZW50WzEwXSAqIChtZW1vcnlbMF0gKiBtZW1vcnlbMl0pICogdmVjdG9ycy5zY2FsZVsyXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlMTEocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFszXSAqIChtZW1vcnlbM10pICogdmVjdG9ycy5zY2FsZVsyXSArIHBhcmVudFs3XSAqICgtbWVtb3J5WzFdICogbWVtb3J5WzJdKSAqIHZlY3RvcnMuc2NhbGVbMl0gKyBwYXJlbnRbMTFdICogKG1lbW9yeVswXSAqIG1lbW9yeVsyXSkgKiB2ZWN0b3JzLnNjYWxlWzJdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGUxMihwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzBdICogdmVjdG9ycy50cmFuc2xhdGlvblswXSArIHBhcmVudFs0XSAqIHZlY3RvcnMudHJhbnNsYXRpb25bMV0gKyBwYXJlbnRbOF0gKiB2ZWN0b3JzLnRyYW5zbGF0aW9uWzJdICsgcGFyZW50WzEyXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlMTMocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFsxXSAqIHZlY3RvcnMudHJhbnNsYXRpb25bMF0gKyBwYXJlbnRbNV0gKiB2ZWN0b3JzLnRyYW5zbGF0aW9uWzFdICsgcGFyZW50WzldICogdmVjdG9ycy50cmFuc2xhdGlvblsyXSArIHBhcmVudFsxM107XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTE0KHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbMl0gKiB2ZWN0b3JzLnRyYW5zbGF0aW9uWzBdICsgcGFyZW50WzZdICogdmVjdG9ycy50cmFuc2xhdGlvblsxXSArIHBhcmVudFsxMF0gKiB2ZWN0b3JzLnRyYW5zbGF0aW9uWzJdICsgcGFyZW50WzE0XTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlMTUocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFszXSAqIHZlY3RvcnMudHJhbnNsYXRpb25bMF0gKyBwYXJlbnRbN10gKiB2ZWN0b3JzLnRyYW5zbGF0aW9uWzFdICsgcGFyZW50WzExXSAqIHZlY3RvcnMudHJhbnNsYXRpb25bMl0gKyBwYXJlbnRbMTVdO1xuICAgIH1cbl07XG5cbi8vIE1hcCBvZiBpbnZhbGlkYXRpb24gbnVtYmVyc1xudmFyIERFUEVOREVOVFMgPSB7XG4gICAgZ2xvYmFsIDogWzQzNjksODczOCwxNzQ3NiwzNDk1Miw0MzY5LDg3MzgsMTc0NzYsMzQ5NTIsNDM2OSw4NzM4LDE3NDc2LDM0OTUyLDQwOTYsODE5MiwxNjM4NCwzMjc2OF0sXG4gICAgbG9jYWwgIDoge1xuICAgICAgICB0cmFuc2xhdGlvbiA6IFs2MTQ0MCw2MTQ0MCw2MTQ0MF0sXG4gICAgICAgIHJvdGF0aW9uICAgIDogWzQwOTUsNDA5NSwyNTVdLFxuICAgICAgICBzY2FsZSAgICAgICA6IFs0MDk1LDQwOTUsNDA5NV0sXG4gICAgfVxufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm0gaXMgYSBjb21wb25lbnQgdGhhdCBpcyBwYXJ0IG9mIGV2ZXJ5IEVudGl0eS4gIEl0IGlzXG4gKiAgIHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyBpdCdzIG93biBub3Rpb24gb2YgcG9zaXRpb24gaW4gc3BhY2UgYW5kXG4gKiAgIGluY29ycG9yYXRpbmcgdGhhdCB3aXRoIHBhcmVudCBpbmZvcm1hdGlvbi5cbiAqXG4gKiBAY2xhc3MgVHJhbnNmb3JtXG4gKiBAY29tcG9uZW50XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVHJhbnNmb3JtKCkge1xuICAgIHRoaXMuX21hdHJpeCAgID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pO1xuICAgIHRoaXMuX21lbW9yeSAgID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMSwgMCwgMSwgMF0pO1xuICAgIHRoaXMuX3ZlY3RvcnMgID0ge1xuICAgICAgICB0cmFuc2xhdGlvbiA6IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDBdKSxcbiAgICAgICAgcm90YXRpb24gICAgOiBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwXSksXG4gICAgICAgIHNjYWxlICAgICAgIDogbmV3IEZsb2F0MzJBcnJheShbMSwgMSwgMV0pXG4gICAgfTtcbiAgICB0aGlzLl9JTyAgICAgICA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICB0aGlzLl91cGRhdGVGTiA9IG51bGw7XG4gICAgdGhpcy5fbXV0YXRvciAgPSB7XG4gICAgICAgIHRyYW5zbGF0ZSAgICAgIDogdGhpcy50cmFuc2xhdGUuYmluZCh0aGlzKSxcbiAgICAgICAgcm90YXRlICAgICAgICAgOiB0aGlzLnJvdGF0ZS5iaW5kKHRoaXMpLFxuICAgICAgICBzY2FsZSAgICAgICAgICA6IHRoaXMuc2NhbGUuYmluZCh0aGlzKSxcbiAgICAgICAgc2V0VHJhbnNsYXRpb24gOiB0aGlzLnNldFRyYW5zbGF0aW9uLmJpbmQodGhpcyksXG4gICAgICAgIHNldFJvdGF0aW9uICAgIDogdGhpcy5zZXRSb3RhdGlvbi5iaW5kKHRoaXMpLFxuICAgICAgICBzZXRTY2FsZSAgICAgICA6IHRoaXMuc2V0U2NhbGUuYmluZCh0aGlzKVxuICAgIH07XG4gICAgdGhpcy5faW52YWxpZGF0ZWQgPSAwO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgdHJhbnNmb3JtIG1hdHJpeCB0aGF0IHJlcHJlc2VudHMgdGhpcyBUcmFuc2Zvcm0ncyB2YWx1ZXMgXG4gKiAgIGJlaW5nIGFwcGxpZWQgdG8gaXQncyBwYXJlbnQncyBnbG9iYWwgdHJhbnNmb3JtLlxuICpcbiAqIEBtZXRob2QgZ2V0R2xvYmFsTWF0cml4XG4gKiBcbiAqIEByZXR1cm4ge0Zsb2F0MzIgQXJyYXl9IHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgVHJhbnNmb3JtIGJlaW5nIGFwcGxpZWQgdG8gaXQncyBwYXJlbnRcbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS5nZXRHbG9iYWxNYXRyaXggPSBmdW5jdGlvbiBnZXRHbG9iYWxNYXRyaXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX21hdHJpeDtcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSB2ZWN0b3JpemVkIGluZm9ybWF0aW9uIGZvciB0aGlzIFRyYW5zZm9ybSdzIGxvY2FsXG4gKiAgIHRyYW5zZm9ybS5cbiAqXG4gKiBAbWV0aG9kIGdldExvY2FsVmVjdG9yc1xuICogXG4gKiBAcmV0dXJuIHtPYmplY3R9IG9iamVjdCB3aXRoIHRyYW5zbGF0ZSwgcm90YXRlLCBhbmQgc2NhbGUga2V5c1xuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmdldExvY2FsVmVjdG9ycyA9IGZ1bmN0aW9uIGdldFZlY3RvcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZlY3RvcnM7XG59O1xuXG4vKipcbiAqIERlZmluZSB0aGUgcHJvdmlkZXIgb2Ygc3RhdGUgZm9yIHRoZSBUcmFuc2Zvcm0uXG4gKlxuICogQG1ldGhvZCB1cGRhdGVGcm9tXG4gKiBAY2hhaW5hYmxlXG4gKiBcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBwcm92aWRlciBzb3VyY2Ugb2Ygc3RhdGUgZm9yIHRoZSBUcmFuc2Zvcm1cbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS51cGRhdGVGcm9tID0gZnVuY3Rpb24gdXBkYXRlRnJvbShwcm92aWRlcikge1xuICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEZ1bmN0aW9uIHx8ICFwcm92aWRlcikgdGhpcy5fdXBkYXRlRk4gPSBwcm92aWRlcjtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgbG9jYWwgaW52YWxpZGF0aW9uIHNjaGVtZSBiYXNlZCBvbiBwYXJlbnQgaW5mb3JtYXRpb25cbiAqXG4gKiBAbWV0aG9kIF9pbnZhbGlkYXRlRnJvbVBhcmVudFxuICogQHByaXZhdGVcbiAqIFxuICogQHBhcmFtICB7TnVtYmVyfSBwYXJlbnRSZXBvcnQgcGFyZW50J3MgaW52YWxpZGF0aW9uXG4gKi9cbmZ1bmN0aW9uIF9pbnZhbGlkYXRlRnJvbVBhcmVudChwYXJlbnRSZXBvcnQpIHtcbiAgICB2YXIgY291bnRlciA9IDA7XG4gICAgd2hpbGUgKHBhcmVudFJlcG9ydCkge1xuICAgICAgICBpZiAocGFyZW50UmVwb3J0ICYgMSkgdGhpcy5faW52YWxpZGF0ZWQgfD0gREVQRU5ERU5UUy5nbG9iYWxbY291bnRlcl07XG4gICAgICAgIGNvdW50ZXIrKztcbiAgICAgICAgcGFyZW50UmVwb3J0ID4+Pj0gMTtcbiAgICB9XG59XG5cbi8qKlxuICogVXBkYXRlIHRoZSBnbG9iYWwgbWF0cml4IGJhc2VkIG9uIGxvY2FsIGFuZCBwYXJlbnQgaW52YWxpZGF0aW9ucy5cbiAqXG4gKiBAbWV0aG9kICBfdXBkYXRlXG4gKiBAcHJpdmF0ZVxuICogXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHBhcmVudFJlcG9ydCBpbnZhbGlkYXRpb25zIGFzc29jaWF0ZWQgd2l0aCB0aGUgcGFyZW50IG1hdHJpeFxuICogQHBhcmFtICB7QXJyYXl9IHBhcmVudE1hdHJpeCBwYXJlbnQgdHJhbnNmb3JtIG1hdHJpeCBhcyBhbiBBcnJheVxuICogQHJldHVybiB7TnVtYmVyfSBpbnZhbGlkYXRpb24gc2NoZW1lXG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUuX3VwZGF0ZSA9IGZ1bmN0aW9uIF91cGRhdGUocGFyZW50UmVwb3J0LCBwYXJlbnRNYXRyaXgpIHtcbiAgICBpZiAocGFyZW50UmVwb3J0KSAgX2ludmFsaWRhdGVGcm9tUGFyZW50LmNhbGwodGhpcywgcGFyZW50UmVwb3J0KTtcbiAgICBpZiAoIXBhcmVudE1hdHJpeCkgcGFyZW50TWF0cml4ID0gSURFTlRJVFk7XG4gICAgaWYgKHRoaXMuX3VwZGF0ZUZOKSB0aGlzLl91cGRhdGVGTih0aGlzLl9tdXRhdG9yKTtcbiAgICB2YXIgdXBkYXRlO1xuICAgIHZhciBjb3VudGVyICAgICA9IDA7XG4gICAgdmFyIGludmFsaWRhdGVkID0gdGhpcy5faW52YWxpZGF0ZWQ7XG5cbiAgICAvLyBCYXNlZCBvbiBpbnZhbGlkYXRpb25zIHVwZGF0ZSBvbmx5IHRoZSBuZWVkZWQgaW5kaWNpZXNcbiAgICB3aGlsZSAodGhpcy5faW52YWxpZGF0ZWQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2ludmFsaWRhdGVkICYgMSkge1xuICAgICAgICAgICAgdXBkYXRlID0gVkFMSURBVE9SU1tjb3VudGVyXShwYXJlbnRNYXRyaXgsIHRoaXMuX3ZlY3RvcnMsIHRoaXMuX21lbW9yeSk7XG4gICAgICAgICAgICBpZiAodXBkYXRlICE9PSB0aGlzLl9tYXRyaXhbY291bnRlcl0pXG4gICAgICAgICAgICAgICAgdGhpcy5fbWF0cml4W2NvdW50ZXJdID0gdXBkYXRlO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGludmFsaWRhdGVkICY9ICgoMSA8PCAxNikgLSAxKSBeICgxIDw8IGNvdW50ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY291bnRlcisrO1xuICAgICAgICB0aGlzLl9pbnZhbGlkYXRlZCA+Pj49IDE7XG4gICAgfVxuXG4gICAgaWYgKGludmFsaWRhdGVkKSB0aGlzLl9JTy5lbWl0KCdpbnZhbGlkYXRlZCcsIGludmFsaWRhdGVkKTtcbiAgICByZXR1cm4gaW52YWxpZGF0ZWQ7XG59O1xuXG4vKipcbiAqIEFkZCBleHRyYSB0cmFuc2xhdGlvbiB0byB0aGUgY3VycmVudCB2YWx1ZXMuICBJbnZhbGlkYXRlc1xuICogICB0cmFuc2xhdGlvbiBhcyBuZWVkZWQuXG4gKlxuICogQG1ldGhvZCB0cmFuc2xhdGVcbiAqICAgXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHggdHJhbnNsYXRpb24gYWxvbmcgdGhlIHgtYXhpcyBpbiBwaXhlbHNcbiAqIEBwYXJhbSAge051bWJlcn0geSB0cmFuc2xhdGlvbiBhbG9uZyB0aGUgeS1heGlzIGluIHBpeGVsc1xuICogQHBhcmFtICB7TnVtYmVyfSB6IHRyYW5zbGF0aW9uIGFsb25nIHRoZSB6LWF4aXMgaW4gcGl4ZWxzXG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24gdHJhbnNsYXRlKHgsIHksIHopIHtcbiAgICB2YXIgdHJhbnNsYXRpb24gPSB0aGlzLl92ZWN0b3JzLnRyYW5zbGF0aW9uO1xuICAgIHZhciBkaXJ0eSAgICAgICA9IGZhbHNlO1xuICAgIHZhciBzaXplO1xuXG4gICAgaWYgKHgpIHtcbiAgICAgICAgdHJhbnNsYXRpb25bMF0gKz0geDtcbiAgICAgICAgZGlydHkgICAgICAgICAgID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoeSkge1xuICAgICAgICB0cmFuc2xhdGlvblsxXSArPSB5O1xuICAgICAgICBkaXJ0eSAgICAgICAgICAgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICh6KSB7XG4gICAgICAgIHRyYW5zbGF0aW9uWzJdICs9IHo7XG4gICAgICAgIC8vIGRpcnR5ICAgICAgICAgICA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGRpcnR5KSB0aGlzLl9pbnZhbGlkYXRlZCB8PSA2MTQ0MDtcbn07XG5cbi8qKlxuICogQWRkIGV4dHJhIHJvdGF0aW9uIHRvIHRoZSBjdXJyZW50IHZhbHVlcy4gIEludmFsaWRhdGVzXG4gKiAgIHJvdGF0aW9uIGFzIG5lZWRlZC5cbiAqXG4gKiBAbWV0aG9kIHJvdGF0ZVxuICogICBcbiAqIEBwYXJhbSAge051bWJlcn0geCByb3RhdGlvbiBhYm91dCB0aGUgeC1heGlzIGluIHJhZGlhbnNcbiAqIEBwYXJhbSAge051bWJlcn0geSByb3RhdGlvbiBhYm91dCB0aGUgeS1heGlzIGluIHJhZGlhbnNcbiAqIEBwYXJhbSAge051bWJlcn0geiByb3RhdGlvbiBhYm91dCB0aGUgei1heGlzIGluIHJhZGlhbnNcbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbiByb3RhdGUoeCwgeSwgeikge1xuICAgIHZhciByb3RhdGlvbiA9IHRoaXMuX3ZlY3RvcnMucm90YXRpb247XG4gICAgdGhpcy5zZXRSb3RhdGlvbigoeCA/IHggOiAwKSArIHJvdGF0aW9uWzBdLCAoeSA/IHkgOiAwKSArIHJvdGF0aW9uWzFdLCAoeiA/IHogOiAwKSArIHJvdGF0aW9uWzJdKTtcbn07XG5cbi8qKlxuICogQWRkIGV4dHJhIHNjYWxlIHRvIHRoZSBjdXJyZW50IHZhbHVlcy4gIEludmFsaWRhdGVzXG4gKiAgIHNjYWxlIGFzIG5lZWRlZC5cbiAqXG4gKiBAbWV0aG9kIHNjYWxlXG4gKiAgIFxuICogQHBhcmFtICB7TnVtYmVyfSB4IHNjYWxlIGFsb25nIHRoZSB4LWF4aXMgYXMgYSBwZXJjZW50XG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHkgc2NhbGUgYWxvbmcgdGhlIHktYXhpcyBhcyBhIHBlcmNlbnRcbiAqIEBwYXJhbSAge051bWJlcn0geiBzY2FsZSBhbG9uZyB0aGUgei1heGlzIGFzIGEgcGVyY2VudFxuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24gc2NhbGUoeCwgeSwgeikge1xuICAgIHZhciBzY2FsZVZlY3RvciA9IHRoaXMuX3ZlY3RvcnMuc2NhbGU7XG4gICAgdmFyIGRpcnR5ICAgICAgID0gZmFsc2U7XG5cbiAgICBpZiAoeCkge1xuICAgICAgICBzY2FsZVZlY3RvclswXSArPSB4O1xuICAgICAgICBkaXJ0eSAgICAgPSBkaXJ0eSB8fCB0cnVlO1xuICAgIH1cblxuICAgIGlmICh5KSB7XG4gICAgICAgIHNjYWxlVmVjdG9yWzFdICs9IHk7XG4gICAgICAgIGRpcnR5ICAgICA9IGRpcnR5IHx8IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHopIHtcbiAgICAgICAgc2NhbGVWZWN0b3JbMl0gKz0gejtcbiAgICAgICAgZGlydHkgICAgID0gZGlydHkgfHwgdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoZGlydHkpIHRoaXMuX2ludmFsaWRhdGVkIHw9IDQwOTU7XG59O1xuXG4vKipcbiAqIEFic29sdXRlIHNldCBvZiB0aGUgVHJhbnNmb3JtJ3MgdHJhbnNsYXRpb24uICBJbnZhbGlkYXRlc1xuICogICB0cmFuc2xhdGlvbiBhcyBuZWVkZWQuXG4gKlxuICogQG1ldGhvZCBzZXRUcmFuc2xhdGlvblxuICogXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHggdHJhbnNsYXRpb24gYWxvbmcgdGhlIHgtYXhpcyBpbiBwaXhlbHNcbiAqIEBwYXJhbSAge051bWJlcn0geSB0cmFuc2xhdGlvbiBhbG9uZyB0aGUgeS1heGlzIGluIHBpeGVsc1xuICogQHBhcmFtICB7TnVtYmVyfSB6IHRyYW5zbGF0aW9uIGFsb25nIHRoZSB6LWF4aXMgaW4gcGl4ZWxzXG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0VHJhbnNsYXRpb24gPSBmdW5jdGlvbiBzZXRUcmFuc2xhdGlvbih4LCB5LCB6KSB7XG4gICAgdmFyIHRyYW5zbGF0aW9uID0gdGhpcy5fdmVjdG9ycy50cmFuc2xhdGlvbjtcbiAgICB2YXIgZGlydHkgICAgICAgPSBmYWxzZTtcbiAgICB2YXIgc2l6ZTtcblxuICAgIGlmICh4ICE9PSB0cmFuc2xhdGlvblswXSAmJiB4ICE9IG51bGwpIHtcbiAgICAgICAgdHJhbnNsYXRpb25bMF0gPSB4O1xuICAgICAgICBkaXJ0eSAgICAgICAgICA9IGRpcnR5IHx8IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHkgIT09IHRyYW5zbGF0aW9uWzFdICYmIHkgIT0gbnVsbCkge1xuICAgICAgICB0cmFuc2xhdGlvblsxXSA9IHk7XG4gICAgICAgIGRpcnR5ICAgICAgICAgID0gZGlydHkgfHwgdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoeiAhPT0gdHJhbnNsYXRpb25bMl0gJiYgeiAhPSBudWxsKSB7XG4gICAgICAgIHRyYW5zbGF0aW9uWzJdID0gejtcbiAgICAgICAgZGlydHkgICAgICAgICAgPSBkaXJ0eSB8fCB0cnVlO1xuICAgIH1cblxuICAgIGlmIChkaXJ0eSkgdGhpcy5faW52YWxpZGF0ZWQgfD0gNjE0NDA7XG59O1xuXG4vKipcbiAqIEFic29sdXRlIHNldCBvZiB0aGUgVHJhbnNmb3JtJ3Mgcm90YXRpb24uICBJbnZhbGlkYXRlc1xuICogICByb3RhdGlvbiBhcyBuZWVkZWQuXG4gKlxuICogQG1ldGhvZCBzZXRSb3RhdGVcbiAqICAgXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHggcm90YXRpb24gYWJvdXQgdGhlIHgtYXhpcyBpbiByYWRpYW5zXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHkgcm90YXRpb24gYWJvdXQgdGhlIHktYXhpcyBpbiByYWRpYW5zXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHogcm90YXRpb24gYWJvdXQgdGhlIHotYXhpcyBpbiByYWRpYW5zXG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0Um90YXRpb24gPSBmdW5jdGlvbiBzZXRSb3RhdGlvbih4LCB5LCB6KSB7XG4gICAgdmFyIHJvdGF0aW9uID0gdGhpcy5fdmVjdG9ycy5yb3RhdGlvbjtcbiAgICB2YXIgZGlydHkgICAgPSBmYWxzZTtcblxuICAgIGlmICh4ICE9PSByb3RhdGlvblswXSAmJiB4ICE9IG51bGwpIHtcbiAgICAgICAgcm90YXRpb25bMF0gICAgID0geDtcbiAgICAgICAgdGhpcy5fbWVtb3J5WzBdID0gTWF0aC5jb3MoeCk7XG4gICAgICAgIHRoaXMuX21lbW9yeVsxXSA9IE1hdGguc2luKHgpO1xuICAgICAgICBkaXJ0eSAgICAgICAgICAgPSBkaXJ0eSB8fCB0cnVlO1xuICAgIH1cblxuICAgIGlmICh5ICE9PSByb3RhdGlvblsxXSAmJiB5ICE9IG51bGwpIHtcbiAgICAgICAgcm90YXRpb25bMV0gICAgID0geTtcbiAgICAgICAgdGhpcy5fbWVtb3J5WzJdID0gTWF0aC5jb3MoeSk7XG4gICAgICAgIHRoaXMuX21lbW9yeVszXSA9IE1hdGguc2luKHkpO1xuICAgICAgICBkaXJ0eSAgICAgICAgICAgPSBkaXJ0eSB8fCB0cnVlO1xuICAgIH1cblxuICAgIGlmICh6ICE9PSByb3RhdGlvblsyXSAmJiB6ICE9IG51bGwpIHtcbiAgICAgICAgcm90YXRpb25bMl0gICAgICAgID0gejtcbiAgICAgICAgdGhpcy5fbWVtb3J5WzRdICAgID0gTWF0aC5jb3Moeik7XG4gICAgICAgIHRoaXMuX21lbW9yeVs1XSAgICA9IE1hdGguc2luKHopO1xuICAgICAgICB0aGlzLl9pbnZhbGlkYXRlZCB8PSAyNTU7XG4gICAgfVxuXG4gICAgaWYgKGRpcnR5KSB0aGlzLl9pbnZhbGlkYXRlZCB8PSA0MDk1O1xufTtcblxuLyoqXG4gKiBBYnNvbHV0ZSBzZXQgb2YgdGhlIFRyYW5zZm9ybSdzIHNjYWxlLiAgSW52YWxpZGF0ZXNcbiAqICAgc2NhbGUgYXMgbmVlZGVkLlxuICpcbiAqIEBtZXRob2Qgc2V0U2NhbGVcbiAqICAgXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHggc2NhbGUgYWxvbmcgdGhlIHgtYXhpcyBhcyBhIHBlcmNlbnRcbiAqIEBwYXJhbSAge051bWJlcn0geSBzY2FsZSBhbG9uZyB0aGUgeS1heGlzIGFzIGEgcGVyY2VudFxuICogQHBhcmFtICB7TnVtYmVyfSB6IHNjYWxlIGFsb25nIHRoZSB6LWF4aXMgYXMgYSBwZXJjZW50XG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUuc2V0U2NhbGUgPSBmdW5jdGlvbiBzZXRTY2FsZSh4LCB5LCB6KSB7XG4gICAgdmFyIHNjYWxlID0gdGhpcy5fdmVjdG9ycy5zY2FsZTtcbiAgICB2YXIgZGlydHkgPSBmYWxzZTtcblxuICAgIGlmICh4ICE9PSBzY2FsZVswXSkge1xuICAgICAgICBzY2FsZVswXSA9IHg7XG4gICAgICAgIGRpcnR5ICAgID0gZGlydHkgfHwgdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoeSAhPT0gc2NhbGVbMV0pIHtcbiAgICAgICAgc2NhbGVbMV0gPSB5O1xuICAgICAgICBkaXJ0eSAgICA9IGRpcnR5IHx8IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHogIT09IHNjYWxlWzJdKSB7XG4gICAgICAgIHNjYWxlWzJdID0gejtcbiAgICAgICAgZGlydHkgICAgPSBkaXJ0eSB8fCB0cnVlO1xuICAgIH1cblxuICAgIGlmIChkaXJ0eSkgdGhpcy5faW52YWxpZGF0ZWQgfD0gNDA5NTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgZnVuY3Rpb25zIHRvIGJlIGNhbGxlZCBvbiB0aGUgVHJhbnNmb3JtJ3MgZXZlbnRzLlxuICpcbiAqIEBtZXRob2Qgb25cbiAqIEBjaGFpbmFibGVcbiAqXG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbigpIHtcbiAgICB0aGlzLl9JTy5vbi5hcHBseSh0aGlzLl9JTywgYXJndW1lbnRzKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmb3JtO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRW50aXR5ICAgICAgICAgPSByZXF1aXJlKCcuL0VudGl0eScpO1xudmFyIEVudGl0eVJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi9FbnRpdHlSZWdpc3RyeScpO1xudmFyIENvbnRhaW5lciAgICAgID0gcmVxdWlyZSgnLi9Db21wb25lbnRzL0NvbnRhaW5lcicpO1xudmFyIENhbWVyYSAgICAgICAgID0gcmVxdWlyZSgnLi9Db21wb25lbnRzL0NhbWVyYScpO1xuXG4vKipcbiAqIENvbnRleHQgaXMgdGhlIGRlZmluaXRpb24gb2Ygd29ybGQgc3BhY2UgZm9yIHRoYXQgcGFydCBvZiB0aGUgc2NlbmUgZ3JhcGguXG4gKiAgIEEgY29udGV4dCBjYW4gZWl0aGVyIGhhdmUgYSBDb250YWluZXIgb3Igbm90LiAgSGF2aW5nIGEgY29udGFpbmVyIG1lYW5zXG4gKiAgIHRoYXQgcGFydHMgb2YgdGhlIHNjZW5lIGdyYXBoIGNhbiBiZSBkcmF3biBpbnNpZGUgb2YgaXQuICBJZiBpdCBkb2VzIG5vdFxuICogICBoYXZlIGEgQ29udGFpbmVyIHRoZW4gdGhlIENvbnRleHQgaXMgb25seSByZXNwb25zaWJsZSBmb3IgZGVmaW5pbmcgd29ybGRcbiAqICAgc3BhY2UuICBUaGUgQ29yZVN5c3RlbSB3aWxsIHN0YXJ0IGF0IGVhY2ggQ29udGV4dCBhbmQgcmVjdXJzaXZlIGRvd25cbiAqICAgdGhyb3VnaCB0aGVpciBjaGlsZHJlbiB0byB1cGRhdGUgZWFjaCBlbnRpdGl5J3MgVHJhbnNmb3JtLCBTaXplLFxuICogICBhbmQgT3BhY2l0eS5cbiAqXG4gKiBAY2xhc3MgQ29udGV4dFxuICogQGVudGl0eVxuICogQGNvbnN0cnVjdG9yXG4gKiAgIFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgdGhlIHN0YXJ0aW5nIG9wdGlvbnMgZm9yIHRoZSBDb250ZXh0XG4gKiBAcGFyYW0ge0FycmF5fSBvcHRpb25zLnRyYW5zZm9ybSB0aGUgc3RhcnRpbmcgdHJhbnNmb3JtIG1hdHJpeFxuICogQHBhcmFtIHtBcnJheX0gb3B0aW9ucy5zaXplIHRoZSBzdGFydGluZyBzaXplXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMuaGFzQ29udGFpbmVyIHdoZXRoZXIgb3Igbm90IHRoZSBDb250ZXh0IGhhcyBhIENvbnRhaW5lclxuICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLmhhc0NhbWVyYSB3aGV0aGVyIG9yIG5vdCB0aGUgQ29udGV4dCBoYXMgYSBDYW1lcmFcbiAqL1xuZnVuY3Rpb24gQ29udGV4dChvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zIHx8IHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0JyB8fCAoIW9wdGlvbnMuc2l6ZSAmJiAhb3B0aW9ucy5wYXJlbnRFbCAmJiAhb3B0aW9ucy5jb250YWluZXIpKSB0aHJvdyBuZXcgRXJyb3IoJ0NvbnRleHQsIG11c3QgYmUgY2FsbGVkIHdpdGggYW4gb3B0aW9uIGhhc2ggdGhhdCBhdCBsZWFzdCBoYXMgYSBzaXplIG9yIGEgcGFyZW50RWwgb3IgYSBjb250YWluZXIgcHJvcGVydHknKTtcbiAgICBFbnRpdHkuY2FsbCh0aGlzKTtcbiAgICBFbnRpdHlSZWdpc3RyeS5yZWdpc3Rlcih0aGlzLCAnQ29udGV4dHMnKTtcbiAgICB0aGlzLl9wYXJlbnRFbCA9IG9wdGlvbnMucGFyZW50RWw7XG4gICAgdGhpcy5fc2l6ZSAgICAgPSBfZ2V0U2l6ZShvcHRpb25zKTtcbiAgICB0aGlzLl9jb21wb25lbnRzLnRyYW5zZm9ybS5fdXBkYXRlKCgxIDw8IDE2KSAtIDEsIG9wdGlvbnMudHJhbnNmb3JtKTtcbiAgICBpZiAob3B0aW9ucy5oYXNDb250YWluZXIgIT09IGZhbHNlKSB0aGlzLl9jb21wb25lbnRzLmNvbnRhaW5lciA9IG5ldyBDb250YWluZXIodGhpcywgb3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMuaGFzQ2FtZXJhICAgICE9PSBmYWxzZSkgdGhpcy5fY29tcG9uZW50cy5jYW1lcmEgICAgPSBuZXcgQ2FtZXJhKHRoaXMsIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIEEgbWV0aG9kIGZvciBkZXRlcm1pbmluZyB3aGF0IHRoZSBzaXplIG9mIHRoZSBDb250ZXh0IGlzLlxuICogIFdpbGwgYmUgdGhlIHVzZXIgZGVmaW5lZCBzaXplIGlmIG9uZSB3YXMgcHJvdmlkZWQgb3RoZXJ3aXNlIGl0XG4gKiAgd2lsbCBkZWZhdWx0IHRvIHRoZSBET00gcmVwcmVzZW50YXRpb24uICBcbiAqXG4gKiBAbWV0aG9kIF9nZXRTaXplXG4gKiBAcHJpdmF0ZVxuICogXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgc3RhcnRpbmcgb3B0aW9ucyBmb3IgdGhlIHNpemVzXG4gKiBAcmV0dXJuIHtBcnJheX0gc2l6ZSBvZiB0aGUgQ29udGV4dFxuICovXG5mdW5jdGlvbiBfZ2V0U2l6ZShvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuc2l6ZSkgICAgICByZXR1cm4gb3B0aW9ucy5zaXplO1xuICAgIGlmIChvcHRpb25zLmNvbnRhaW5lcikgcmV0dXJuIFtvcHRpb25zLmNvbnRhaW5lci5vZmZzZXRXaWR0aCwgb3B0aW9ucy5jb250YWluZXIub2Zmc2V0SGVpZ2h0LCAwXTtcbiAgICByZXR1cm4gW29wdGlvbnMucGFyZW50RWwub2Zmc2V0V2lkdGgsIG9wdGlvbnMucGFyZW50RWwub2Zmc2V0SGVpZ2h0LCAwXTtcbn1cblxuQ29udGV4dC5wcm90b3R5cGUgICAgICAgICAgICAgICAgICAgICA9IE9iamVjdC5jcmVhdGUoRW50aXR5LnByb3RvdHlwZSk7XG5Db250ZXh0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciAgICAgICAgID0gQ29udGV4dDtcbkNvbnRleHQucHJvdG90eXBlLnVwZGF0ZSAgICAgICAgICAgICAgPSBudWxsO1xuQ29udGV4dC5wcm90b3R5cGUucmVnaXN0ZXJDb21wb25lbnQgICA9IG51bGw7XG5Db250ZXh0LnByb3RvdHlwZS5kZXJlZ2lzdGVyQ29tcG9uZW50ID0gbnVsbDtcbkNvbnRleHQucHJvdG90eXBlLmFkZENvbXBvbmVudCAgICAgICAgPSBudWxsO1xuQ29udGV4dC5wcm90b3R5cGUucmVtb3ZlQ29tcG9uZW50ICAgICA9IG51bGw7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGV4dDtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICogICAgICAgICBcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvcmVTeXN0ZW0gICAgID0gcmVxdWlyZSgnLi9TeXN0ZW1zL0NvcmVTeXN0ZW0nKSxcbiAgICBPcHRpb25zTWFuYWdlciA9IHJlcXVpcmUoJy4vT3B0aW9uc01hbmFnZXInKSxcbiAgICBET01yZW5kZXJlciAgICA9IHJlcXVpcmUoJy4vUmVuZGVyZXJzL0RPTXJlbmRlcmVyJyksXG4gICAgR0xyZW5kZXJlciAgICAgPSByZXF1aXJlKCcuL1JlbmRlcmVycy9XZWJHTFJlbmRlcmVyJyksXG4gICAgUmVuZGVyU3lzdGVtICAgPSByZXF1aXJlKCcuL1N5c3RlbXMvUmVuZGVyU3lzdGVtJyksXG4gICAgQmVoYXZpb3JTeXN0ZW0gPSByZXF1aXJlKCcuL1N5c3RlbXMvQmVoYXZpb3JTeXN0ZW0nKSxcbiAgICBUaW1lU3lzdGVtICAgICA9IHJlcXVpcmUoJy4vU3lzdGVtcy9UaW1lU3lzdGVtJyksXG4gICAgTGlmdFN5c3RlbSAgICAgPSByZXF1aXJlKCcuLi90cmFuc2l0aW9ucy9MaWZ0U3lzdGVtJyksXG4gICAgQ29udGV4dCAgICAgICAgPSByZXF1aXJlKCcuL0NvbnRleHQnKTtcblxucmVxdWlyZSgnLi9TdHlsZXNoZWV0L2ZhbW91cy5jc3MnKTtcblxudmFyIG9wdGlvbnMgPSB7XG4gICAgbG9vcCAgICAgIDogdHJ1ZSxcbiAgICBkaXJlY3Rpb24gOiAxLFxuICAgIHNwZWVkICAgICA6IDEsXG4gICAgcmVuZGVyaW5nIDoge1xuICAgICAgICByZW5kZXJlcnM6IHtcbiAgICAgICAgICAgIERPTTogRE9NcmVuZGVyZXIsXG4gICAgICAgICAgICBHTDogR0xyZW5kZXJlclxuICAgICAgICB9XG4gICAgfVxufTtcblxuLy8gVE9ETzogd2hhdCBpcyB0aGlzIGRvaW5nIGhlcmU/XG5kb2N1bWVudC5vbnRvdWNobW92ZSA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufTtcblxuLy8gU3RhdGVcbnZhciBMT09QICAgICAgICAgICAgICAgICA9ICdsb29wJyxcbiAgICBSRU5ERVJJTkcgICAgICAgICAgICA9ICdyZW5kZXJpbmcnLFxuICAgIG9wdGlvbnNNYW5hZ2VyICAgICAgID0gbmV3IE9wdGlvbnNNYW5hZ2VyKG9wdGlvbnMpLFxuICAgIHN5c3RlbXMgICAgICAgICAgICAgID0gW1JlbmRlclN5c3RlbSwgQmVoYXZpb3JTeXN0ZW0sTGlmdFN5c3RlbSwgQ29yZVN5c3RlbSwgVGltZVN5c3RlbV0sIC8vIFdlJ3JlIGdvaW5nIGJhY2t3YXJkc1xuICAgIGN1cnJlbnRSZWxhdGl2ZUZyYW1lID0gMCxcbiAgICBjdXJyZW50QWJzb2x1dGVGcmFtZSA9IDA7XG5cbmZ1bmN0aW9uIHNldFJlbmRlcmVycyhyZW5kZXJlcnMpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gcmVuZGVyZXJzKSB7XG4gICAgICAgIFJlbmRlclN5c3RlbS5yZWdpc3RlcihrZXksIHJlbmRlcmVyc1trZXldKTtcbiAgICB9XG59XG5cbnNldFJlbmRlcmVycyhvcHRpb25zLnJlbmRlcmluZy5yZW5kZXJlcnMpO1xuXG5vcHRpb25zTWFuYWdlci5vbignY2hhbmdlJywgZnVuY3Rpb24oZGF0YSkge1xuICAgIGlmIChkYXRhLmlkID09PSBMT09QKSB7XG4gICAgICAgIGlmIChkYXRhLnZhbHVlKSB7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoRW5naW5lLmxvb3ApO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChkYXRhLmlkID09PSBSRU5ERVJJTkcpIHtcbiAgICAgICAgc2V0UmVuZGVyZXJzKGRhdGEudmFsdWUucmVuZGVyZXJzKTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBUaGUgc2luZ2xldG9uIG9iamVjdCBpbml0aWF0ZWQgdXBvbiBwcm9jZXNzXG4gKiAgIHN0YXJ0dXAgd2hpY2ggbWFuYWdlcyBhbGwgYWN0aXZlIFN5c3RlbXMgYW5kIGFjdHMgYXMgYVxuICogICBmYWN0b3J5IGZvciBuZXcgQ29udGV4dHMvXG4gKlxuICogICBPbiBzdGF0aWMgaW5pdGlhbGl6YXRpb24sIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgaXMgY2FsbGVkIHdpdGhcbiAqICAgICB0aGUgZXZlbnQgbG9vcCBmdW5jdGlvbi5cbiAqICAgICBcbiAqIEBjbGFzcyBFbmdpbmVcbiAqIEBzaW5nbGV0b25cbiAqL1xudmFyIEVuZ2luZSA9IHt9O1xuXG4vKipcbiAqIENhbGxzIHVwZGF0ZSBvbiBlYWNoIG9mIHRoZSBjdXJyZW50bHkgcmVnaXN0ZXJlZCBzeXN0ZW1zLlxuICogXG4gKiBAbWV0aG9kIHN0ZXBcbiAqL1xuRW5naW5lLnN0ZXAgPSBmdW5jdGlvbiBzdGVwKCkge1xuICAgIGN1cnJlbnRSZWxhdGl2ZUZyYW1lICs9IG9wdGlvbnMuZGlyZWN0aW9uICogb3B0aW9ucy5zcGVlZDtcbiAgICBjdXJyZW50QWJzb2x1dGVGcmFtZSsrO1xuICAgIHZhciBpID0gc3lzdGVtcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkgc3lzdGVtc1tpXS51cGRhdGUoY3VycmVudFJlbGF0aXZlRnJhbWUsIGN1cnJlbnRBYnNvbHV0ZUZyYW1lKTsvLyBJIHRvbGQgeW91IHNvXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHRoYXQgd2lsbCBzdGVwIFxuICogXG4gKiBAbWV0aG9kIGxvb3BcbiAqL1xuRW5naW5lLmxvb3AgPSBmdW5jdGlvbiBsb29wKCkge1xuICAgIGlmIChvcHRpb25zLmxvb3ApIHtcbiAgICAgICAgRW5naW5lLnN0ZXAoKTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKEVuZ2luZS5sb29wKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiBfbG9vcEZvcih2YWx1ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICBFbmdpbmUuc3RlcCgpO1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKF9sb29wRm9yKHZhbHVlIC0gMSkpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuRW5naW5lLmxvb3BGb3IgPSBmdW5jdGlvbiBsb29wRm9yKHZhbHVlKSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKF9sb29wRm9yKHZhbHVlKSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEEgd3JhcHBlciBmb3IgdGhlIFwiRE9NQ29udGVudExvYWRlZFwiIGV2ZW50LiAgV2lsbCBleGVjdXRlXG4gKiAgIGEgZ2l2ZW4gZnVuY3Rpb24gb25jZSB0aGUgRE9NIGhhdmUgYmVlbiBsb2FkZWQuXG4gKlxuICogQG1ldGhvZCByZWFkeVxuICogXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gYmUgY2FsbGVkIGFmdGVyIERPTSBsb2FkaW5nXG4gKi9cbkVuZ2luZS5yZWFkeSA9IGZ1bmN0aW9uIHJlYWR5KGZuKSB7XG4gICAgdmFyIGxpc3RlbmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBsaXN0ZW5lcik7XG4gICAgICAgIGZuKCk7XG4gICAgfTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgbGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBXaWxsIGNyZWF0ZSBhIGJyYW5kIG5ldyBDb250ZXh0LiAgSUYgYSBwYXJlbnQgZWxlbWVudCBpcyBub3QgcHJvdmlkZWQsXG4gKiAgIGl0IGlzIGFzc3VtZWQgdG8gYmUgdGhlIGJvZHkgb2YgdGhlIGRvY3VtZW50LlxuICpcbiAqIEBtZXRob2QgY3JlYXRlQ29udGV4dFxuICogXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgT3B0aW9ucyBmb3IgdGhlIENvbnRleHRcbiAqIEByZXR1cm4ge0NvbnRleHR9IG5ldyBDb250ZXh0IGluc3RhbmNlXG4gKi9cbkVuZ2luZS5jcmVhdGVDb250ZXh0ID0gZnVuY3Rpb24gY3JlYXRlQ29udGV4dChvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YXIgZWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iob3B0aW9ucyk7XG4gICAgICAgIGlmICghKGVsZW0gaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHRocm93IG5ldyBFcnJvcigndGhlIHBhc3NlZCBpbiBzdHJpbmcgc2hvdWxkIGJlIGEgcXVlcnkgc2VsZWN0b3Igd2hpY2ggcmV0dXJucyBhbiBlbGVtZW50IGZyb20gdGhlIGRvbScpO1xuICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvbnRleHQoe3BhcmVudEVsOiBlbGVtfSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMgaW5zdGFuY2VvZiBIVE1MRWxlbWVudClcbiAgICAgICAgcmV0dXJuIG5ldyBDb250ZXh0KHtwYXJlbnRFbDogb3B0aW9uc30pO1xuXG4gICAgaWYgKCFvcHRpb25zKVxuICAgICAgICByZXR1cm4gbmV3IENvbnRleHQoe3BhcmVudEVsOiBkb2N1bWVudC5ib2R5fSk7IC8vIFRPRE8gaXQgc2hvdWxkIGJlIHBvc3NpYmxlIHRvIGRlbGF5IGFzc2lnbmluZyBkb2N1bWVudC5ib2R5IHVudGlsIHRoaXMgaGl0cyB0aGUgcmVuZGVyIHN0YWdlLiBUaGlzIHdvdWxkIHJlbW92ZSB0aGUgbmVlZCBmb3IgRW5naW5lLnJlYWR5XG5cbiAgICBpZiAoIW9wdGlvbnMucGFyZW50RWwgJiYgIW9wdGlvbnMuY29udGFpbmVyKVxuICAgICAgICBvcHRpb25zLnBhcmVudEVsID0gZG9jdW1lbnQuYm9keTtcblxuICAgIHJldHVybiBuZXcgQ29udGV4dChvcHRpb25zKTtcbn07XG5cbi8qKlxuICogQWRkcyBhIHN5c3RlbSB0byB0aGUgbGlzdCBvZiBzeXN0ZW1zIHRvIHVwZGF0ZSBvbiBhIHBlciBmcmFtZSBiYXNpc1xuICpcbiAqIEBtZXRob2QgYWRkU3lzdGVtXG4gKiBcbiAqIEBwYXJhbSB7U3lzdGVtfSBzeXN0ZW0gU3lzdGVtIHRvIGdldCBydW4gZXZlcnkgZnJhbWVcbiAqL1xuRW5naW5lLmFkZFN5c3RlbSA9IGZ1bmN0aW9uIGFkZFN5c3RlbShzeXN0ZW0pIHtcbiAgICBpZiAoc3lzdGVtIGluc3RhbmNlb2YgT2JqZWN0ICYmIHN5c3RlbS51cGRhdGUgaW5zdGFuY2VvZiBGdW5jdGlvbilcbiAgICAgICAgcmV0dXJuIHN5c3RlbXMuc3BsaWNlKHN5c3RlbXMuaW5kZXhPZihSZW5kZXJTeXN0ZW0pICsgMSwgMCwgc3lzdGVtKTtcbiAgICBlbHNlIHRocm93IG5ldyBFcnJvcignc3lzdGVtcyBtdXN0IGJlIGFuIG9iamVjdCB3aXRoIGFuIHVwZGF0ZSBtZXRob2QnKTtcbn07XG5cbi8qKlxuICogUmVtb3ZlcyBhIHN5c3RlbSBmcm9tIHRoZSBsaXN0IG9mIHN5c3RlbXMgdG8gdXBkYXRlIG9uIGEgcGVyIGZyYW1lIGJhc2lzXG4gKlxuICogQG1ldGhvZCByZW1vdmVTeXN0ZW1cbiAqIFxuICogQHBhcmFtIHtTeXN0ZW19IHN5c3RlbSBTeXN0ZW0gdG8gZ2V0IHJ1biBldmVyeSBmcmFtZVxuICovXG5FbmdpbmUucmVtb3ZlU3lzdGVtID0gZnVuY3Rpb24gcmVtb3ZlU3lzdGVtKHN5c3RlbSkge1xuICAgIGlmIChzeXN0ZW0gaW5zdGFuY2VvZiBPYmplY3QgJiYgc3lzdGVtLnVwZGF0ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHN5c3RlbXMuaW5kZXhPZihzeXN0ZW0pO1xuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHN5c3RlbXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcignc3lzdGVtcyBtdXN0IGJlIGFuIG9iamVjdCB3aXRoIGFuIHVwZGF0ZSBtZXRob2QnKTtcbn07XG5cbi8qKlxuICogRGVsZWdhdGUgdG8gdGhlIG9wdGlvbnNNYW5hZ2VyLlxuICpcbiAqIEBtZXRob2Qgc2V0T3B0aW9uc1xuICogXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIHRvIHBhdGNoXG4gKi9cbkVuZ2luZS5zZXRPcHRpb25zID0gb3B0aW9uc01hbmFnZXIuc2V0T3B0aW9ucy5iaW5kKG9wdGlvbnNNYW5hZ2VyKTtcblxuLyoqXG4gKiBTZXQgdGhlIGRpcmVjdGlvbiBvZiB0aGUgZmxvdyBvZiB0aW1lLlxuICpcbiAqIEBtZXRob2Qgc2V0RGlyZWN0aW9uXG4gKiBcbiAqIEBwYXJhbSB7TnVtYmVyfSB2YWwgZGlyZWN0aW9uIGFzIC0xIG9yIDFcbiAqL1xuRW5naW5lLnNldERpcmVjdGlvbiA9IGZ1bmN0aW9uIHNldERpcmVjdGlvbih2YWwpIHtcbiAgICBpZiAodmFsICE9PSAxICYmIHZhbCAhPT0gLTEpIHRocm93IG5ldyBFcnJvcignZGlyZWN0aW9uIG11c3QgYmUgZWl0aGVyIDEgZm9yIGZvcndhcmQgb3IgLTEgZm9yIHJldmVyc2UnKTtcbiAgICBvcHRpb25zTWFuYWdlci5zZXQoJ2RpcmVjdGlvbicsIHZhbCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgZGlyZWN0aW9uIG9mIHRoZSBmbG93IG9mIHRpbWUuXG4gKlxuICogQG1ldGhvZCBnZXREaXJlY3Rpb25cbiAqIFxuICogQHJldHVybiB7TnVtYmVyfSBkaXJlY3Rpb24gYXMgLTEgb3IgMVxuICovXG5FbmdpbmUuZ2V0RGlyZWN0aW9uID0gZnVuY3Rpb24gZ2V0RGlyZWN0aW9uKCkge1xuICAgIHJldHVybiBvcHRpb25zLmRpcmVjdGlvbjtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBzcGVlZCBvZiB0aW1lLlxuICpcbiAqIEBtZXRob2Qgc2V0U3BlZWRcbiAqIFxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbCByYXRpbyB0byBodW1hbiB0aW1lXG4gKi9cbkVuZ2luZS5zZXRTcGVlZCA9IGZ1bmN0aW9uIHNldFNwZWVkKHZhbCkge1xuICAgIGlmICh0eXBlb2YgdmFsICE9PSAnbnVtYmVyJykgdGhyb3cgbmV3IEVycm9yKCdzcGVlZCBtdXN0IGJlIGEgbnVtYmVyLCB1c2VkIGFzIGEgc2NhbGUgZmFjdG9yIGZvciB0aGUgbW92ZW1lbnQgb2YgdGltZScpO1xuICAgIG9wdGlvbnNNYW5hZ2VyLnNldCgnc3BlZWQnLCB2YWwpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHNwZWVkIG9mIHRpbWUuXG4gKlxuICogQG1ldGhvZCBnZXRTcGVlZFxuICogXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHZhbCByYXRpbyB0byBodW1hbiB0aW1lXG4gKi9cbkVuZ2luZS5nZXRTcGVlZCA9IGZ1bmN0aW9uIGdldFNwZWVkKCkge1xuICAgIHJldHVybiBvcHRpb25zLnNwZWVkO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGN1cnJlbnQgZnJhbWVcbiAqXG4gKiBAbWV0aG9kIGdldEFic29sdXRlRnJhbWVcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSBjdXJyZW50IGZyYW1lIG51bWJlclxuICovXG5FbmdpbmUuZ2V0QWJzb2x1dGVGcmFtZSA9IGZ1bmN0aW9uIGdldEFic29sdXRlRnJhbWUoKSB7XG4gICAgcmV0dXJuIGN1cnJlbnRBYnNvbHV0ZUZyYW1lO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGN1cnJlbnQgZnJhbWUgdGFraW5nIGludG8gYWNjb3VudCBlbmdpbmUgc3BlZWQgYW5kIGRpcmVjdGlvblxuICpcbiAqIEBtZXRob2QgZ2V0UmVsYXRpdmVGcmFtZVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIGN1cnJlbnQgZnJhbWUgbnVtYmVyIHRha2luZyBpbnRvIGFjY291bnQgRW5naW5lIHNwZWVkIGFuZCBkaXJlY3Rpb25cbiAqL1xuRW5naW5lLmdldFJlbGF0aXZlRnJhbWUgPSBmdW5jdGlvbiBnZXRSZWxhdGl2ZUZyYW1lKCkge1xuICAgIHJldHVybiBjdXJyZW50UmVsYXRpdmVGcmFtZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRW5naW5lO1xuXG4vL1N0YXJ0IHRoZSBsb29wXG5FbmdpbmUucmVhZHkoRW5naW5lLmxvb3ApO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKiAgICAgICAgIFxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuL0VudGl0eVJlZ2lzdHJ5JyksXG4gICAgVHJhbnNmb3JtICAgICAgPSByZXF1aXJlKCcuL0NvbXBvbmVudHMvVHJhbnNmb3JtJyk7XG5cbi8qKlxuICogRW50aXR5IGlzIHRoZSBjb3JlIG9mIHRoZSBGYW1vLnVzIHNjZW5lIGdyYXBoLiAgVGhlIHNjZW5lIGdyYXBoXG4gKiAgIGlzIGNvbnN0cnVjdGVkIGJ5IGFkZGluZyBFbnRpdHlzIHRvIG90aGVyIEVudGl0aWVzIHRvIGRlZmluZSBoZWlyYXJjaHkuXG4gKiAgIEVhY2ggRW50aXR5IGNvbWVzIHdpdGggYSBUcmFuc2Zvcm0gY29tcG9uZW50IHdpdGggdGhlXG4gKiAgIGFiaWxpdHkgdG8gYWRkIGluZmluaXRlIG90aGVyIGNvbXBvbmVudHMuICBJdCBhbHNvIGFjdHMgYXMgYSBmYWN0b3J5IGJ5IGNyZWF0aW5nXG4gKiAgIG5ldyBFbnRpdGllcyB0aGF0IHdpbGwgYWxyZWFkeSBiZSBjb25zaWRlcmVkIGl0J3MgY2hpbGRyZW4uXG4gKlxuICogQGNsYXNzIEVudGl0eVxuICogQGVudGl0eVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEVudGl0eSgpIHtcbiAgICB2YXIgaWQgPSBFbnRpdHlSZWdpc3RyeS5yZWdpc3Rlcih0aGlzLCAnQ29yZVN5c3RlbScpO1xuXG4gICAgdGhpcy5fY29tcG9uZW50cyA9IHsgdHJhbnNmb3JtIDogbmV3IFRyYW5zZm9ybSh0aGlzKSB9O1xuICAgIHRoaXMuX2JlaGF2aW9ycyA9IFtdO1xuXG4gICAgdGhpcy5fcGFyZW50ICAgPSBudWxsO1xuICAgIHRoaXMuX2NoaWxkcmVuID0gW107XG59XG5cbi8qKlxuICogQWRkcyBhIG5ldyBpbnN0YW5jZSBvZiBhIGNvbXBvbmVudCB0byB0aGUgRW50aXR5LlxuICpcbiAqIEBtZXRob2QgIHJlZ2lzdGVyQ29tcG9uZW50XG4gKiBcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBDb25zdHJ1Y3RvciBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgYSBjb21wb25lbnRcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyBvcHRpb25zIHRvIGJlIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvclxuICogQHJldHVybiB7T2JqZWN0fSBpbnN0YW5jZSBvZiB0aGUgaW5zdGFudGl0YXRlZCBjb21wb25lbnRcbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLnJlZ2lzdGVyQ29tcG9uZW50ID0gZnVuY3Rpb24gcmVnaXN0ZXJDb21wb25lbnQoQ29uc3RydWN0b3IsIG9wdGlvbnMpIHtcbiAgICBpZiAoIUNvbnN0cnVjdG9yIHx8ICEoQ29uc3RydWN0b3IgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHRocm93IG5ldyBFcnJvcignVGhlIGZpcnN0IGFyZ3VtZW50IHRvIC5yZWdpc3RlckNvbXBvbmVudCBtdXN0IGJlIGEgY29tcG9uZW50IENvbnN0cnVjdG9yIGZ1bmN0aW9uJyk7XG4gICAgaWYgKCFDb25zdHJ1Y3Rvci50b1N0cmluZykgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwYXNzZWQtaW4gY29tcG9uZW50IENvbnN0cnVjdG9yIG11c3QgaGF2ZSBhIFwidG9TdHJpbmdcIiBtZXRob2QuJyk7XG5cbiAgICB2YXIgY29tcG9uZW50ID0gbmV3IENvbnN0cnVjdG9yKHRoaXMsIG9wdGlvbnMpO1xuICAgIGlmIChjb21wb25lbnQudXBkYXRlKSB0aGlzLl9iZWhhdmlvcnMucHVzaChDb25zdHJ1Y3Rvci50b1N0cmluZygpKTtcbiAgICB0aGlzLl9jb21wb25lbnRzW0NvbnN0cnVjdG9yLnRvU3RyaW5nKCldID0gY29tcG9uZW50O1xuICAgIHJldHVybiBjb21wb25lbnQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciByZWdpc3RlckNvbXBvbmVudFxuICogXG4gKiBAbWV0aG9kIGFkZENvbXBvbmVudFxuICovXG5FbnRpdHkucHJvdG90eXBlLmFkZENvbXBvbmVudCA9IEVudGl0eS5wcm90b3R5cGUucmVnaXN0ZXJDb21wb25lbnQ7XG5cbi8qKlxuICogUmVtb3ZlcyBhIGNvbXBvbmVudCBmcm9tIHRoZSBFbnRpdHkuXG4gKlxuICogQG1ldGhvZCBkZXJlZ2lzdGVyQ29tcG9uZW50XG4gKiBcbiAqIEBwYXJhbSAge1N0cmluZ30gdHlwZSBpZCBvZiB0aGUgY29tcG9uZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufSBzdGF0dXMgb2YgdGhlIHJlbW92YWxcbiAqL1xuRW50aXR5LnByb3RvdHlwZS5kZXJlZ2lzdGVyQ29tcG9uZW50ID0gZnVuY3Rpb24gZGVyZWdpc3RlckNvbXBvbmVudCh0eXBlKSB7XG4gICAgaWYgKHR5cGVvZiB0eXBlICE9PSAnc3RyaW5nJykgdGhyb3cgbmV3IEVycm9yKCdFbnRpdHkuZGVyZWdpc3RlckNvbXBvbmVudCBtdXN0IGJlIHBhc3NlZCBhIFN0cmluZyBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyJyk7XG4gICAgaWYgKHRoaXMuX2NvbXBvbmVudHNbdHlwZV0gPT09IHVuZGVmaW5lZCB8fCB0aGlzLl9jb21wb25lbnRzW3R5cGVdID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoJ25vIGNvbXBvbmVudCBvZiB0aGF0IHR5cGUnKTtcblxuICAgIHRoaXMuX2NvbXBvbmVudHNbdHlwZV0uY2xlYW51cCAmJiB0aGlzLl9jb21wb25lbnRzW3R5cGVdLmNsZWFudXAoKTtcbiAgICB0aGlzLl9jb21wb25lbnRzW3R5cGVdID0gbnVsbDtcblxuICAgIHZhciBiZWhhdmlvckluZGV4ID0gdGhpcy5fYmVoYXZpb3JzLmluZGV4T2YodHlwZSk7XG4gICAgaWYgKGJlaGF2aW9ySW5kZXggPiAtMSlcbiAgICAgICAgdGhpcy5fYmVoYXZpb3JzLnNwbGljZShiZWhhdmlvckluZGV4LCAxKTtcblxuICAgIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3IgZGVyZWdpc3RlckNvbXBvbmVudFxuICogXG4gKiBAbWV0aG9kIHJlbW92ZUNvbXBvbmVudFxuICovXG5FbnRpdHkucHJvdG90eXBlLnJlbW92ZUNvbXBvbmVudCA9IEVudGl0eS5wcm90b3R5cGUuZGVyZWdpc3RlckNvbXBvbmVudDtcblxuLyoqXG4gKiBGaW5kIG91dCBpZiB0aGUgRW50aXR5IGhhcyBhIGNvbXBvbmVudCBvZiBhIGNlcnRhaW4gbmFtZS5cbiAqXG4gKiBAbWV0aG9kIGhhc0NvbXBvbmVudFxuICogXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHR5cGUgbmFtZSBvZiB0aGUgY29tcG9uZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufSBleGlzdGFuY2Ugb2YgYSBjb21wb25lbnQgYnkgdGhhdCBuYW1lXG4gKi9cbkVudGl0eS5wcm90b3R5cGUuaGFzQ29tcG9uZW50ID0gZnVuY3Rpb24gaGFzQ29tcG9uZW50KHR5cGUpIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcG9uZW50c1t0eXBlXSAhPSBudWxsO1xufTtcblxuLyoqXG4gKiBHZXQgYSBjb21wb25lbnQgYnkgbmFtZVxuICpcbiAqIEBtZXRob2QgZ2V0Q29tcG9uZW50XG4gKiBcbiAqIEBwYXJhbSAge1N0cmluZ30gdHlwZSBuYW1lIG9mIHRoZSBjb21wb25lbnRcbiAqIEByZXR1cm4ge09iamVjdH0gY29tcG9uZW50IGluc3RhbmNlXG4gKi9cbkVudGl0eS5wcm90b3R5cGUuZ2V0Q29tcG9uZW50ID0gZnVuY3Rpb24gZ2V0Q29tcG9uZW50KHR5cGUpIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcG9uZW50c1t0eXBlXTtcbn07XG5cbi8qKlxuICogR2V0IGFsbCBvZiB0aGUgRW50aXR5J3MgY29tcG9uZW50c1xuICpcbiAqIEBtZXRob2QgZ2V0QWxsQ29tcG9uZW50c1xuICogXG4gKiBAcmV0dXJuIHtPYmplY3R9IEhhc2ggb2YgYWxsIG9mIHRoZSBjb21wb25lbnRzIGluZGV4ZWQgYnkgbmFtZSBcbiAqL1xuRW50aXR5LnByb3RvdHlwZS5nZXRBbGxDb21wb25lbnRzID0gZnVuY3Rpb24gZ2V0QWxsQ29tcG9uZW50cygpIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcG9uZW50cztcbn07XG5cbi8qKlxuICogR2V0IGFsbCBvZiB0aGUgY2hpbGQgbm9kZXMgaW4gdGhlIHNjZW5lIGdyYXBoXG4gKlxuICogQG1ldGhvZCAgZ2V0Q2hpbGRyZW5cbiAqIFxuICogQHJldHVybiB7QXJyYXl9IGNoaWxkIGVudGl0aWVzXG4gKi9cbkVudGl0eS5wcm90b3R5cGUuZ2V0Q2hpbGRyZW4gPSBmdW5jdGlvbiBnZXRDaGlsZHJlbigpIHtcbiAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW47XG59O1xuXG4vKipcbiAqIEdldCB0aGUgY29udGV4dCBvZiB0aGUgbm9kZS5cbiAqXG4gKiBAbWV0aG9kIGdldENvbnRleHRcbiAqXG4gKiBAcmV0dXJuIENvbnRleHQgTm9kZVxuICovXG5FbnRpdHkucHJvdG90eXBlLmdldENvbnRleHQgPSBmdW5jdGlvbiBnZXRDb250ZXh0KCkge1xuICAgIHZhciBub2RlID0gdGhpcztcbiAgICB3aGlsZSAobm9kZS5fcGFyZW50KSBub2RlID0gbm9kZS5fcGFyZW50O1xuICAgIGlmICghbm9kZS5fc2l6ZSkgcmV0dXJuIG51bGw7XG4gICAgZWxzZSAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogQWRkIGEgbmV3IEVudGl0eSBhcyBhIGNoaWxkIGFuZCByZXR1cm4gaXQuXG4gKlxuICogQG1ldGhvZCBhZGRDaGlsZFxuICpcbiAqIEByZXR1cm4ge0VudGl0eX0gY2hpbGQgRW50aXR5XG4gKi9cbkVudGl0eS5wcm90b3R5cGUuYWRkQ2hpbGQgPSBmdW5jdGlvbiBhZGRDaGlsZChlbnRpdHkpIHtcbiAgICBpZiAoZW50aXR5ICE9IG51bGwgJiYgIShlbnRpdHkgaW5zdGFuY2VvZiBFbnRpdHkpKSB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgRW50aXRpZXMgY2FuIGJlIGFkZGVkIGFzIGNoaWxkcmVuIG9mIG90aGVyIGVudGl0aWVzJyk7XG4gICAgaWYgKGVudGl0eSkge1xuICAgICAgICBpZiAodGhpcy5fY2hpbGRyZW4uaW5kZXhPZihlbnRpdHkpID4gLTEpIHJldHVybiB2b2lkIDA7XG4gICAgICAgIGlmIChlbnRpdHkuX3BhcmVudCAhPSBudWxsKSBlbnRpdHkuX3BhcmVudC5kZXRhdGNoQ2hpbGQoZW50aXR5KTtcbiAgICAgICAgZW50aXR5Ll9wYXJlbnQgPSB0aGlzO1xuICAgICAgICB0aGlzLl9jaGlsZHJlbi5wdXNoKGVudGl0eSk7XG4gICAgICAgIHJldHVybiBlbnRpdHk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG5vZGUgICAgID0gbmV3IEVudGl0eSgpO1xuICAgICAgICBub2RlLl9wYXJlbnQgPSB0aGlzO1xuICAgICAgICB0aGlzLl9jaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhIEVudGl0eSdzIGNoaWxkLlxuICpcbiAqIEBtZXRob2QgZGV0YXRjaENoaWxkXG4gKlxuICogQHJldHVybiB7RW50aXR5fHZvaWQgMH0gY2hpbGQgRW50aXR5IG9yIHZvaWQgMCBpZiBpdCBpcyBub3QgYSBjaGlsZFxuICovXG5FbnRpdHkucHJvdG90eXBlLmRldGF0Y2hDaGlsZCA9IGZ1bmN0aW9uIGRldGF0Y2hDaGlsZChub2RlKSB7XG4gICAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIEVudGl0eSkpIHRocm93IG5ldyBFcnJvcignRW50aXR5LmRldGF0Y2hDaGlsZCBvbmx5IHRha2VzIGluIEVudGl0aWVzIGFzIHRoZSBwYXJhbWV0ZXInKTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl9jaGlsZHJlbi5pbmRleE9mKG5vZGUpO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIHZhciBjaGlsZCAgICAgPSB0aGlzLl9jaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEpWzBdO1xuICAgICAgICBjaGlsZC5fcGFyZW50ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgIH0gZWxzZSByZXR1cm4gdm9pZCAwO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhpcyBFbnRpdHkgZnJvbSB0aGUgRW50aXR5UmVnaXN0cnlcbiAqXG4gKiBAbWV0aG9kIGNsZWFudXBcbiAqL1xuRW50aXR5LnByb3RvdHlwZS5jbGVhbnVwID0gZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICBFbnRpdHlSZWdpc3RyeS5jbGVhbnVwKHRoaXMpO1xufTtcblxuLyoqXG4gKiBVcGRhdGUgYWxsIG9mIHRoZSBjdXN0b20gY29tcG9uZW50cyBvbiB0aGUgRW50aXR5XG4gKiBcbiAqIEBtZXRob2QgdXBkYXRlXG4gKi9cbkVudGl0eS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgIHZhciBpID0gdGhpcy5fYmVoYXZpb3JzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIHRoaXMuX2NvbXBvbmVudHNbdGhpcy5fYmVoYXZpb3JzW2ldXS51cGRhdGUodGhpcyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIExheWVyID0gcmVxdWlyZSgnLi9MYXllcicpO1xuXG4vLyBNYXAgb2YgYW4gRW50aXR5J3MgcG9zaXRpb24gaW4gYSBsYXllclxudmFyIGVudGl0aWVzID0gW107XG5cbi8vIFN0b3JhZ2Ugb2YgRW50aXR5IGFycmF5c1xudmFyIGxheWVycyA9IHtcbiAgICBldmVyeXRoaW5nOiBuZXcgTGF5ZXIoKVxufTtcblxuLy8gUG9vbCBvZiBmcmVlIHNwYWNlcyBpbiB0aGUgZW50aXRlcyBhcnJheVxudmFyIGZyZWVkID0gW107XG5cbi8qKlxuICogQSBzaW5nbGV0b24gb2JqZWN0IHRoYXQgbWFuYWdlcyB0aGUgRW50aXR5IHJlZmVyZW5jZSBzeXN0ZW0uXG4gKiAgIEVudGl0aWVzIGNhbiBiZSBwYXJ0IG9mIG1hbnkgbGF5ZXJzIGRlcGVuZGluZyBvbiBpbXBsZW1lbnRhdGlvbi5cbiAqICAgXG4gKiBAY2xhc3MgRW50aXR5UmVnaXN0cnlcbiAqIEBzaW5nbGV0b25cbiAqL1xudmFyIEVudGl0eVJlZ2lzdHJ5ID0ge307XG5cbi8qKlxuICogQWRkcyBhIG5ldyBsYXllciBrZXkgdG8gdGhlIGxheWVycyBvYmplY3QuXG4gKlxuICogQG1ldGhvZCAgYWRkTGF5ZXJcbiAqIFxuICogQHBhcmFtIHtTdHJpbmd9IGxheWVyIG5hbWUgb2YgdGhlIGxheWVyXG4gKiBAcmV0dXJuIHtBcnJheX0gdGhlIGFycmF5IG9mIGVudGl0aWVzIGluIHRoZSBzcGVjaWZpZWQgbGF5ZXJcbiAqL1xuRW50aXR5UmVnaXN0cnkuYWRkTGF5ZXIgPSBmdW5jdGlvbiBhZGRMYXllcihsYXllcikge1xuICAgIGlmICghbGF5ZXIpICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJy5hZGRMYXllciBuZWVkcyB0byBoYXZlIGEgbGF5ZXIgc3BlY2lmaWVkJyk7XG4gICAgaWYgKHR5cGVvZiBsYXllciAhPT0gJ3N0cmluZycpIHRocm93IG5ldyBFcnJvcignLmFkZExheWVyIGNhbiBvbmx5IHRha2UgYSBzdHJpbmcgYXMgYW4gYXJndW1lbnQnKTtcbiAgICBpZiAoIWxheWVyc1tsYXllcl0pIGxheWVyc1tsYXllcl0gPSBuZXcgTGF5ZXIoKTtcbiAgICByZXR1cm4gbGF5ZXJzW2xheWVyXTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBhcnJheSBvZiBlbnRpdGllcyBpbiBhIHBhcnRpY3VsYXIgbGF5ZXIuXG4gKlxuICogQG1ldGhvZCAgZ2V0TGF5ZXJcbiAqIFxuICogQHBhcmFtIHtTdHJpbmd9IGxheWVyIG5hbWUgb2YgdGhlIGxheWVyXG4gKiBAcmV0dXJuIHtBcnJheX0gdGhlIGFycmF5IG9mIGVudGl0aWVzIGluIHRoZSBzcGVjaWZpZWQgbGF5ZXJcbiAqL1xuRW50aXR5UmVnaXN0cnkuZ2V0TGF5ZXIgPSBmdW5jdGlvbiBnZXRMYXllcihsYXllcikge1xuICAgIHJldHVybiBsYXllcnNbbGF5ZXJdO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGEgcGFydGljdWxhciBsYXllciBmcm9tIHRoZSByZWdpc3RyeVxuICpcbiAqIEBtZXRob2QgIHJlbW92ZUxheWVyXG4gKiBcbiAqIEBwYXJhbSB7U3RyaW5nfSBsYXllciBuYW1lIG9mIHRoZSBsYXllciB0byByZW1vdmVcbiAqIEByZXR1cm4ge0FycmF5fSB0aGUgYXJyYXkgb2YgZW50aXRpZXMgaW4gdGhlIHNwZWNpZmllZCBsYXllclxuICovXG5FbnRpdHlSZWdpc3RyeS5yZW1vdmVMYXllciA9IGZ1bmN0aW9uIHJlbW92ZUxheWVyKGxheWVyKSB7XG4gICAgaWYgKCFsYXllcikgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignLnJlbW92ZUxheWVyIG5lZWRzIHRvIGhhdmUgYSBsYXllciBzcGVjaWZpZWQnKTtcbiAgICBpZiAodHlwZW9mIGxheWVyICE9PSAnc3RyaW5nJykgdGhyb3cgbmV3IEVycm9yKCcucmVtb3ZlTGF5ZXIgY2FuIG9ubHkgdGFrZSBhIHN0cmluZyBhcyBhbiBhcmd1bWVudCcpO1xuXG4gICAgdmFyIGN1cnJMYXllciA9IGxheWVyc1tsYXllcl07XG4gICAgaWYgKCFjdXJyTGF5ZXIpIHJldHVybiBmYWxzZTtcblxuICAgIHZhciBpID0gY3VyckxheWVyLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSBkZWxldGUgZW50aXRpZXNbY3VyckxheWVyLmdldChpKS5faWRdW2xheWVyXTtcblxuICAgIGRlbGV0ZSBsYXllcnNbbGF5ZXJdO1xuICAgIHJldHVybiBjdXJyTGF5ZXI7XG59O1xuXG4vKipcbiAqIEFkZHMgYW4gZW50aXR5IHRvIGEgcGFydGljdWxhciBsYXllci5cbiAqXG4gKiBAbWV0aG9kICByZWdpc3RlclxuICogXG4gKiBAcGFyYW0gIHtFbnRpdHl9IGluc3RhbmNlIG9mIGFuIEVudGl0eVxuICogQHBhcmFtICB7U3RyaW5nfSBsYXllciBuYW1lIG9mIHRoZSBsYXllciB0byByZWdpc3RlciB0aGUgZW50aXR5IHRvXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGlkIG9mIHRoZSBFbnRpdHlcbiAqL1xuRW50aXR5UmVnaXN0cnkucmVnaXN0ZXIgPSBmdW5jdGlvbiByZWdpc3RlcihlbnRpdHksIGxheWVyKSB7XG4gICAgdmFyIGlkTWFwO1xuICAgIGlmIChlbnRpdHkuX2lkID09IG51bGwpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVudGl0eSwgJ19pZCcsIHtcbiAgICAgICAgICAgIHZhbHVlICAgICAgICA6IEVudGl0eVJlZ2lzdHJ5LmdldE5ld0lEKCksXG4gICAgICAgICAgICBjb25maWd1cmFibGUgOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgaWQgPSBlbnRpdHkuX2lkO1xuICAgIGlmIChlbnRpdGllc1tpZF0pIHtcbiAgICAgICAgaWRNYXAgPSBlbnRpdGllc1tpZF07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZE1hcCA9IHtldmVyeXRoaW5nOiBsYXllcnMuZXZlcnl0aGluZy5sZW5ndGh9O1xuICAgICAgICBsYXllcnMuZXZlcnl0aGluZy5wdXNoKGVudGl0eSk7XG4gICAgfVxuXG4gICAgaWYgKGxheWVyKSB7XG4gICAgICAgIGlmICghbGF5ZXJzW2xheWVyXSkgRW50aXR5UmVnaXN0cnkuYWRkTGF5ZXIobGF5ZXIpO1xuICAgICAgICBpZE1hcFtsYXllcl0gPSBsYXllcnNbbGF5ZXJdLmxlbmd0aDtcbiAgICAgICAgbGF5ZXJzW2xheWVyXS5wdXNoKGVudGl0eSk7XG4gICAgfVxuXG4gICAgaWYgKCFlbnRpdGllc1tpZF0pIGVudGl0aWVzW2lkXSA9IGlkTWFwO1xuICAgIHJldHVybiBpZDsgLy9UT0RPOiBETyBXRSBORUVEIFRPIFJFVFVSTiBBTllNT1JFP1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGFuIGVudGl0eSBmcm9tIGEgbGF5ZXJcbiAqXG4gKiBAbWV0aG9kICBkZXJlZ2lzdGVyXG4gKiBcbiAqIEBwYXJhbSAge0VudGl0eX0gZW50aXR5IGluc3RhbmNlIG9mIGFuIEVudGl0eVxuICogQHBhcmFtICB7U3RyaW5nfSBsYXllciBuYW1lIG9mIGxheWVyIHRvIHJlbW92ZSB0aGUgRW50aXR5IGZyb21cbiAqIEByZXR1cm4ge0Jvb2xlYW19IHN0YXR1cyBvZiB0aGUgcmVtb3ZhbFxuICovXG5FbnRpdHlSZWdpc3RyeS5kZXJlZ2lzdGVyID0gZnVuY3Rpb24gZGVyZWdpc3RlcihlbnRpdHksIGxheWVyKSB7XG4gICAgdmFyIGN1cnJlbnRFbnRpdHk7XG4gICAgdmFyIHBvc2l0aW9uID0gZW50aXRpZXNbZW50aXR5Ll9pZF1bbGF5ZXJdO1xuICAgIGlmIChwb3NpdGlvbiA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gICAgZW50aXRpZXNbZW50aXR5Ll9pZF1bbGF5ZXJdID0gbnVsbDtcbiAgICBsYXllcnNbbGF5ZXJdLnJlbW92ZShlbnRpdHkpO1xuXG4gICAgdmFyIGN1cnJlbnRFbnRpdHk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbnRpdGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjdXJyZW50RW50aXR5ID0gZW50aXRpZXNbaV07XG5cbiAgICAgICAgaWYgKGN1cnJlbnRFbnRpdHkgJiYgY3VycmVudEVudGl0eVtsYXllcl0gPiBwb3NpdGlvbikgY3VycmVudEVudGl0eVtsYXllcl0tLTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBpZCBtYXAgb2YgdGhlIEVudGl0eS4gIEVhY2ggRW50aXR5IGhhcyBhbiBvYmplY3QgdGhhdFxuICogICBkZWZpbmVkIHRoZSBpbmRpY2llcyBvZiB3aGVyZSBpdCBpcyBpbiBlYWNoIGxheWVyLlxuICpcbiAqIEBtZXRob2QgIGdldFxuICogXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIElEIG9mIHRoZSBFbnRpdHlcbiAqIEByZXR1cm4ge09iamVjdH0gaWQgbWFwIG9mIHRoZSBFbnRpdHkncyBpbmRleCBpbiBlYWNoIGxheWVyXG4gKi9cbkVudGl0eVJlZ2lzdHJ5LmdldCA9IGZ1bmN0aW9uIGdldChpZCkge1xuICAgIHJldHVybiBlbnRpdGllc1tpZF07XG59O1xuXG4vKipcbiAqIEZpbmQgb3V0IGlmIGEgZ2l2ZW4gZW50aXR5IGV4aXN0cyBhbmQgYSBzcGVjaWZpZWQgbGF5ZXIuXG4gKlxuICogQG1ldGhvZCAgaW5MYXllclxuICogXG4gKiBAcGFyYW0gIHtFbnRpdHl9IGVudGl0eSBFbnRpdHkgaW5zdGFuY2VcbiAqIEBwYXJhbSAge1N0cmluZ30gbGF5ZXIgbmFtZSBvZiB0aGUgbGF5ZXJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgb3Igbm90IHRoZSBFbnRpdHkgaXMgaW4gYSBnaXZlbiBsYXllclxuICovXG5FbnRpdHlSZWdpc3RyeS5pbkxheWVyID0gZnVuY3Rpb24gaW5MYXllcihlbnRpdHksIGxheWVyKSB7XG4gICAgcmV0dXJuIGVudGl0aWVzW2VudGl0eS5faWRdW2xheWVyXSAhPT0gdW5kZWZpbmVkO1xufTtcblxuLy9wb3RlbnRpYWxseSBtZW1vcnkgdW5zYWZlIC0gZ2V0dGluZyBhbiBpZCBpc24ndCBuZWNlc3NhcmlseSBjb3VwbGVkIHdpdGggYSByZWdpc3RyYXRpb25cbi8qKlxuICogR2V0IGEgdW5pcXVlIElEIGZvciBhbiBFbnRpdHlcbiAqXG4gKiBAbWV0aG9kICBnZXROZXdJRFxuICogXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IElEIGZvciBhbiBFbnRpdHlcbiAqL1xuRW50aXR5UmVnaXN0cnkuZ2V0TmV3SUQgPSBmdW5jdGlvbiBnZXROZXdJRCgpIHtcbiAgICBpZihmcmVlZC5sZW5ndGgpIHJldHVybiBmcmVlZC5wb3AoKTtcbiAgICBlbHNlIHJldHVybiBlbnRpdGllcy5sZW5ndGg7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbiBlbnRpdHkgYW5kIGFsbCByZWZlcmVuY2VzIHRvIGl0LlxuICpcbiAqIEBtZXRob2QgY2xlYW51cFxuICogXG4gKiBAcGFyYW0gIHtFbnRpdHl9IGVudGl0eSBFbnRpdHkgaW5zdGFuY2UgdG8gcmVtb3ZlXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IElEIG9mIHRoZSBFbnRpdHkgdGhhdCB3YXMgcmVtb3ZlZFxuICovXG5FbnRpdHlSZWdpc3RyeS5jbGVhbnVwID0gZnVuY3Rpb24gY2xlYW51cChlbnRpdHkpIHtcbiAgICB2YXIgY3VycmVudEVudGl0eTtcbiAgICB2YXIgaWRNYXAgICAgICAgICAgICA9IGVudGl0aWVzW2VudGl0eS5faWRdO1xuICAgIGVudGl0aWVzW2VudGl0eS5faWRdID0gbnVsbDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW50aXRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3VycmVudEVudGl0eSA9IGVudGl0aWVzW2ldO1xuXG4gICAgICAgIGlmIChjdXJyZW50RW50aXR5KVxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGlkTWFwKVxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50RW50aXR5W2tleV0gJiYgY3VycmVudEVudGl0eVtrZXldID4gaWRNYXBba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEVudGl0eVtrZXldLS07XG4gICAgfVxuXG4gICAgZm9yICh2YXIga2V5IGluIGlkTWFwKSB7XG4gICAgICAgIGxheWVyc1trZXldLnNwbGljZShpZE1hcFtrZXldLCAxKTtcbiAgICB9XG5cbiAgICBmcmVlZC5wdXNoKGVudGl0eS5faWQpO1xuICAgIHJldHVybiBlbnRpdHkuX2lkOyAvL1RPRE86IERPIFdFIE5FRUQgVEhJU1xufTtcblxuLyoqXG4gKiBHZXQgYW4gRW50aXR5IGJ5IGlkXG4gKlxuICogQG1ldGhvZCBnZXRFbnRpdHlcbiAqIFxuICogQHBhcmFtICB7TnVtYmVyfSBpZCBpZCBvZiB0aGUgRW50aXR5XG4gKiBAcmV0dXJuIHtFbnRpdHl9IGVudGl0eSB3aXRoIHRoZSBpZCBwcm92aWRlZFxuICovXG5FbnRpdHlSZWdpc3RyeS5nZXRFbnRpdHkgPSBmdW5jdGlvbiBnZXRFbnRpdHkoaWQpIHtcbiAgICBpZiAoIWVudGl0aWVzW2lkXSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiBsYXllcnMuZXZlcnl0aGluZy5nZXQoZW50aXRpZXNbaWRdLmV2ZXJ5dGhpbmcpO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIEVudGl0aWVzIGZyb20gdGhlIGVudGl0eSByZWdpc3RyeVxuICpcbiAqIEBtZXRob2QgY2xlYXJcbiAqL1xuRW50aXR5UmVnaXN0cnkuY2xlYXIgPSBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICB2YXIgZXZlcnl0aGluZyA9IEVudGl0eVJlZ2lzdHJ5LmdldExheWVyKCdldmVyeXRoaW5nJyk7XG4gICAgd2hpbGUgKGV2ZXJ5dGhpbmcubGVuZ3RoKSBFbnRpdHlSZWdpc3RyeS5jbGVhbnVwKGV2ZXJ5dGhpbmcucG9wKCkpO1xufTtcblxuLy8gUmVnc2l0ZXIgdGhlIGRlZmF1bHQgbGF5ZXJzXG5FbnRpdHlSZWdpc3RyeS5hZGRMYXllcignUm9vdHMnKTtcbkVudGl0eVJlZ2lzdHJ5LmFkZExheWVyKCdDb3JlU3lzdGVtJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRW50aXR5UmVnaXN0cnk7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCcuLi9ldmVudHMvRXZlbnRFbWl0dGVyJyk7XG5cbi8qKlxuICogTGF5ZXJzIGFyZSBncm91cHMgdGhhdCBob2xkIHJlZmVyZW5jZXMgdG8gRW50aXRpZXMuICBJdFxuICogIGFkZHMgZXZlbnQgZW1pdHRpbmcgYW5kIGNvbnZlbmllbmNlIG1ldGhvZHMgb24gdG9wIG9mXG4gKiAgdGhlIGFycmF5IHN0b3JhZ2UuXG4gKlxuICogQGNsYXNzIExheWVyXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTGF5ZXIoKSB7XG4gICAgdGhpcy5lbnRpdGllcyA9IFtdO1xuICAgIHRoaXMuSU8gICAgICAgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdsZW5ndGgnLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW50aXRpZXMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qKlxuICogRGVsZWdhdGVzIHRvIHRoZSBFdmVudEhhbmRsZXJzIFwib25cIlxuICpcbiAqIEBtZXRob2Qgb25cbiAqL1xuTGF5ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuSU8ub24uYXBwbHkodGhpcy5JTywgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogQWRkcyBhbiBFbnRpdHkgYW5kIGVtaXRzIGEgbWVzc2FnZVxuICpcbiAqIEBtZXRob2QgcHVzaFxuICogXG4gKiBAcmVzdWx0IHtCb29sZWFufSByZXR1cm4gc3RhdHVzIG9mIGFycmF5IHB1c2hcbiAqL1xuTGF5ZXIucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiBwdXNoKGVudGl0eSkge1xuICAgIHZhciBsZW5ndGggPSB0aGlzLmVudGl0aWVzLnB1c2goZW50aXR5KTtcbiAgICB0aGlzLklPLmVtaXQoJ2VudGl0eVB1c2hlZCcsIGVudGl0eSk7XG4gICAgcmV0dXJuIGxlbmd0aDtcbn07XG5cbi8qKlxuICogQWRkcyBhbiBFbnRpdHkgYW5kIGVtaXRzIGEgbWVzc2FnZVxuICpcbiAqIEBtZXRob2QgcG9wXG4gKiBcbiAqIEByZXN1bHQge0VudGl0eX0gbGFzdCBFbnRpdHkgdGhhdCB3YXMgYWRkZWRcbiAqL1xuTGF5ZXIucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uIHBvcCgpIHtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5lbnRpdGllcy5wb3AoKTtcbiAgICB0aGlzLklPLmVtaXQoJ2VudGl0eVBvcHBlZCcsIHJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogRmluZCB3aGVyZSBhbmQgaWYgYW4gRW50aXR5IGlzIGluIHRoZSBhcnJheVxuICpcbiAqIEBtZXRob2QgaW5kZXhPZlxuICogXG4gKiBAcmVzdWx0IHtOdW1iZXJ9IGluZGV4IG9mIEVudGl0eSBpbiB0aGUgYXJyYXlcbiAqL1xuTGF5ZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mKCkge1xuICAgIHJldHVybiB0aGlzLmVudGl0aWVzLmluZGV4T2YuYXBwbHkodGhpcy5lbnRpdGllcywgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogU3BsaWNlcyB0aGUgYXJyYXkgYW5kIGVtaXRzIGEgbWVzc2FnZVxuICpcbiAqIEBtZXRob2Qgc3BsaWNlXG4gKiBcbiAqIEByZXN1bHQge0FycmF5fSBzcGxpY2VkIG91dCBFbnRpdGllc1xuICovXG5MYXllci5wcm90b3R5cGUuc3BsaWNlID0gZnVuY3Rpb24gc3BsaWNlKCkge1xuICAgIHZhciByZXN1bHQgPSB0aGlzLmVudGl0aWVzLnNwbGljZS5hcHBseSh0aGlzLmVudGl0aWVzLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuSU8uZW1pdCgnZW50aXRpZXNTcGxpY2VkJywgcmVzdWx0KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGFuZCBlbnRpdHkgZnJvbSB0aGUgYXJyYXkgYW5kIGVtaXRzIGEgbWVzc2FnZVxuICpcbiAqIEBtZXRob2QgcmVtb3ZlXG4gKiBcbiAqIEByZXN1bHQge0VudGl0eX0gcmVtb3ZlZCBFbnRpdHlcbiAqL1xuTGF5ZXIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZShlbnRpdHkpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmVudGl0aWVzLmluZGV4T2YoZW50aXR5KTtcbiAgICB0aGlzLklPLmVtaXQoJ2VudGl0eVJlbW92ZWQnLCBlbnRpdHkpO1xuICAgIGlmIChpbmRleCA8IDApIHJldHVybiBmYWxzZTtcbiAgICBlbHNlICAgICAgICAgICByZXR1cm4gdGhpcy5lbnRpdGllcy5zcGxpY2UoaW5kZXgsIDEpWzBdO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIEVudGl0eSBhcmUgYSBwYXJ0aWN1bGFyIGluZGV4XG4gKlxuICogQG1ldGhvZCBnZXRcbiAqIFxuICogQHJlc3VsdCB7RW50aXR5fSBFbnRpdHkgYXQgdGhhdCBpbmRleFxuICovXG5MYXllci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuZW50aXRpZXNbaW5kZXhdO1xufTtcblxuLyoqXG4gKiBGaW5kIG9mIGlmIHRoZSBMYXllciBoYXMgYW4gRW50aXR5XG4gKlxuICogQG1ldGhvZCBoYXNcbiAqIFxuICogQHJlc3VsdCB7Qm9vbGVhbn0gZXhpc3RlbmNlIG9mIHRoZSBFbnRpdHkgaW4gdGhlIExheWVyXG4gKi9cbkxheWVyLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiBoYXMoZW50aXR5KSB7XG4gICAgcmV0dXJuIHRoaXMuZW50aXRpZXMuaW5kZXhPZihlbnRpdHkpICE9PSAtMTtcbn07XG5cbi8qKlxuICogRXhlY3V0ZSBhIGZ1bmN0aW9uIHRoYXQgaXRlcmF0ZXMgb3ZlciB0aGUgY29sbGVjdGlvblxuICogIG9mIEVudGl0aWVzIGFuZCBjYWxscyBhIGZ1bmN0aW9uIHdoZXJlIHRoZSBwYXJhbWV0ZXJzXG4gKiAgYXJlLCB0aGUgRW50aXR5LCBpbmRleCwgYW5kIGZ1bGwgY29sbGVjdGlvbiBvZiBFbnRpdGllcy5cbiAqXG4gKiBAbWV0aG9kIGZvckVhY2hcbiAqIFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuY3Rpb24gdG8gYmUgcnVuIHBlciBFbnRpdHlcbiAqL1xuTGF5ZXIucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiBmb3JFYWNoKGZuKSB7XG4gICAgdmFyIGkgICAgICA9IC0xLFxuICAgICAgICBsZW5ndGggPSB0aGlzLmVudGl0aWVzLmxlbmd0aDtcblxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBFcnJvcignTGF5ZXIuZm9yRWFjaCBvbmx5IGFjY2VwdHMgZnVuY3Rpb25zIGFzIGEgcGFyYW1ldGVyJyk7XG5cbiAgICB3aGlsZSAobGVuZ3RoIC0gKytpKSBmbih0aGlzLmVudGl0aWVzW2ldLCBpLCB0aGlzLmVudGl0aWVzKTtcbn07XG5cbi8qKlxuICogSW1wbGVtZW50cyByZWR1Y2Ugb24gdGhlIGNvbGxlY3Rpb24gb2YgRW50aXRpZXNcbiAqXG4gKiBAbWV0aG9kIHJlZHVjZVxuICogXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jdGlvbiB0byBiZSBydW4gcGVyIEVudGl0eVxuICogQHBhcmFtIHsqfSBpbml0aWFsVmFsdWUgaW5pdGlhbCB2YWx1ZSBvZiB0aGUgcmVkdWNlIGZ1bmN0aW9uXG4gKiBcbiAqIEByZXR1cm4geyp9IHZhbHVlIGFmdGVyIGVhY2ggRW50aXR5IGhhcyBoYWQgdGhlIGZ1bmN0aW9uIHJ1blxuICovXG5MYXllci5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gcmVkdWNlKGZuLCBpbml0aWFsVmFsdWUpIHtcbiAgICB2YXIgaSAgICAgID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoLFxuICAgICAgICBhY2N1bXVsYXRvcjtcblxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBFcnJvcignTGF5ZXIucmVkdWNlIG9ubHkgYWNjZXB0cyBmdW5jdGlvbnMgYXMgYSBwYXJhbWV0ZXInKTtcblxuICAgIGlmIChpbml0aWFsVmFsdWUgIT0gbnVsbCkgYWNjdW11bGF0b3IgPSBpbml0aWFsVmFsdWU7XG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICBhY2N1bXVsYXRvciA9IHRoaXMuZW50aXRpZXNbKytpXTtcbiAgICB3aGlsZSAobGVuZ3RoIC0gKytpKSAgICAgIGFjY3VtdWxhdG9yID0gZm4oYWNjdW11bGF0b3IsIHRoaXMuZW50aXRpZXNbaV0sIGksIHRoaXMuZW50aXRpZXMpO1xuXG4gICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xufTtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIG1hcCBvbiB0aGUgY29sbGVjdGlvbiBvZiBFbnRpdGllc1xuICpcbiAqIEBtZXRob2QgbWFwXG4gKiBcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmN0aW9uIHRvIGJlIHJ1biBwZXIgRW50aXR5XG4gKlxuICogQHJldHVybiB7QXJyYXl9IGFycmF5IG9mIHRoZSByZXR1cm4gdmFsdWVzIG9mIHRoZSBtYXBwaW5nIGZ1bmN0aW9uXG4gKi9cbkxheWVyLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiBtYXAoZm4pIHtcbiAgICB2YXIgaSAgICAgID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoLFxuICAgICAgICByZXN1bHQgPSBbXTtcblxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBFcnJvcignTGF5ZXIubWFwIG9ubHkgYWNjZXB0cyBmdW5jdGlvbnMgYXMgYSBwYXJhbWV0ZXInKTtcblxuICAgIHdoaWxlIChsZW5ndGggLSArK2kpIHJlc3VsdC5wdXNoKGZuKHRoaXMuZW50aXRpZXNbaV0sIGksIHRoaXMuZW50aXRpZXMpKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIEltcGxlbWVudHMgZmlsdGVyIG9uIHRoZSBjb2xsZWN0aW9uIG9mIEVudGl0aWVzXG4gKlxuICogQG1ldGhvZCBmaWx0ZXJcbiAqIFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuY3Rpb24gdG8gYmUgcnVuIHBlciBFbnRpdHlcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYXJyYXkgb2YgdGhlIHJldHVybiB2YWx1ZXMgb2YgdGhlIGZpbHRlcmluZyBmdW5jdGlvblxuICovXG5MYXllci5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gZmlsdGVyKGZuKSB7XG4gICAgdmFyIGkgICAgICA9IC0xLFxuICAgICAgICBsZW5ndGggPSB0aGlzLmVudGl0aWVzLmxlbmd0aCxcbiAgICAgICAgcmVzdWx0ID0gW107XG5cbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB0aHJvdyBuZXcgRXJyb3IoJ0xheWVyLmZpbHRlciBvbmx5IGFjY2VwdHMgZnVuY3Rpb25zIGFzIGEgcGFyYW1ldGVyJyk7XG5cbiAgICB3aGlsZSAobGVuZ3RoIC0gKytpKSBpZiAoZm4odGhpcy5lbnRpdGllc1tpXSwgaSwgdGhpcy5lbnRpdGllcykpIHJlc3VsdC5wdXNoKHRoaXMuZW50aXRpZXNbaV0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogSW1wbGVtZW50cyByZWplY3Qgb24gdGhlIGNvbGxlY3Rpb24gb2YgRW50aXRpZXNcbiAqXG4gKiBAbWV0aG9kIHJlamVjdFxuICogXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jdGlvbiB0byBiZSBydW4gcGVyIEVudGl0eVxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBhcnJheSBvZiB0aGUgcmV0dXJuIHZhbHVlcyBvZiB0aGUgcmVqZWN0aW5nIGZ1bmN0aW9uXG4gKi9cbkxheWVyLnByb3RvdHlwZS5yZWplY3QgPSBmdW5jdGlvbiByZWplY3QoZm4pIHtcbiAgICB2YXIgaSAgICAgID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoLFxuICAgICAgICByZXN1bHQgPSBbXTtcblxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBFcnJvcignTGF5ZXIucmVqZWN0IG9ubHkgYWNjZXB0cyBmdW5jdGlvbnMgYXMgYSBwYXJhbWV0ZXInKTtcblxuICAgIHdoaWxlIChsZW5ndGggLSArK2kpIGlmICghZm4odGhpcy5lbnRpdGllc1tpXSwgaSwgdGhpcy5lbnRpdGllcykpIHJlc3VsdC5wdXNoKHRoaXMuZW50aXRpZXNbaV0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTGF5ZXI7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyOiBtYXJrQGZhbW8udXNcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG4gXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEhhbmRsZXIgPSByZXF1aXJlKCcuLi9ldmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbi8qKlxuICogIEEgY29sbGVjdGlvbiBvZiBtZXRob2RzIGZvciBzZXR0aW5nIG9wdGlvbnMgd2hpY2ggY2FuIGJlIGV4dGVuZGVkXG4gKiAgb250byBvdGhlciBjbGFzc2VzLlxuICpcbiAqXG4gKiBAY2xhc3MgT3B0aW9uc01hbmFnZXJcbiAqIEBjb25zdHJ1Y3RvclxuICogXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgb3B0aW9ucyBkaWN0aW9uYXJ5XG4gKi9cbmZ1bmN0aW9uIE9wdGlvbnNNYW5hZ2VyKHZhbHVlKSB7XG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLmV2ZW50T3V0cHV0ID0gbnVsbDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgb3B0aW9ucyBtYW5hZ2VyIGZyb20gc291cmNlIGRpY3Rpb25hcnkgd2l0aCBhcmd1bWVudHMgb3ZlcnJpZGVuIGJ5IHBhdGNoIGRpY3Rpb25hcnkuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZCBPcHRpb25zTWFuYWdlci5wYXRjaFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2Ugc291cmNlIGFyZ3VtZW50c1xuICogQHBhcmFtIHsuLi5PYmplY3R9IGRhdGEgYXJndW1lbnQgYWRkaXRpb25zIGFuZCBvdmVyd3JpdGVzXG4gKiBAcmV0dXJuIHtPYmplY3R9IHNvdXJjZSBvYmplY3RcbiAqL1xuT3B0aW9uc01hbmFnZXIucGF0Y2ggPSBmdW5jdGlvbiBwYXRjaE9iamVjdChzb3VyY2UsIGRhdGEpIHtcbiAgICB2YXIgbWFuYWdlciA9IG5ldyBPcHRpb25zTWFuYWdlcihzb3VyY2UpO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSBtYW5hZ2VyLnBhdGNoKGFyZ3VtZW50c1tpXSk7XG4gICAgcmV0dXJuIHNvdXJjZTtcbn07XG5cbmZ1bmN0aW9uIF9jcmVhdGVFdmVudE91dHB1dCgpIHtcbiAgICB0aGlzLmV2ZW50T3V0cHV0ID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuICAgIHRoaXMuZXZlbnRPdXRwdXQuYmluZFRoaXModGhpcyk7XG4gICAgRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIodGhpcywgdGhpcy5ldmVudE91dHB1dCk7XG59XG5cbi8qKlxuICogQ3JlYXRlIE9wdGlvbnNNYW5hZ2VyIGZyb20gc291cmNlIHdpdGggYXJndW1lbnRzIG92ZXJyaWRlbiBieSBwYXRjaGVzLlxuICogICBUcmlnZ2VycyAnY2hhbmdlJyBldmVudCBvbiB0aGlzIG9iamVjdCdzIGV2ZW50IGhhbmRsZXIgaWYgdGhlIHN0YXRlIG9mXG4gKiAgIHRoZSBPcHRpb25zTWFuYWdlciBjaGFuZ2VzIGFzIGEgcmVzdWx0LlxuICpcbiAqIEBtZXRob2QgcGF0Y2hcbiAqXG4gKiBAcGFyYW0gey4uLk9iamVjdH0gYXJndW1lbnRzIGxpc3Qgb2YgcGF0Y2ggb2JqZWN0c1xuICogQHJldHVybiB7T3B0aW9uc01hbmFnZXJ9IHRoaXNcbiAqL1xuT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLnBhdGNoID0gZnVuY3Rpb24gcGF0Y2goKSB7XG4gICAgdmFyIG15U3RhdGUgPSB0aGlzLl92YWx1ZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZGF0YSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgayBpbiBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoKGsgaW4gbXlTdGF0ZSkgJiYgKGRhdGFba10gJiYgZGF0YVtrXS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0KSAmJiAobXlTdGF0ZVtrXSAmJiBteVN0YXRlW2tdLmNvbnN0cnVjdG9yID09PSBPYmplY3QpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFteVN0YXRlLmhhc093blByb3BlcnR5KGspKSBteVN0YXRlW2tdID0gT2JqZWN0LmNyZWF0ZShteVN0YXRlW2tdKTtcbiAgICAgICAgICAgICAgICB0aGlzLmtleShrKS5wYXRjaChkYXRhW2tdKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ldmVudE91dHB1dCkgdGhpcy5ldmVudE91dHB1dC5lbWl0KCdjaGFuZ2UnLCB7aWQ6IGssIHZhbHVlOiBkYXRhW2tdfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHRoaXMuc2V0KGssIGRhdGFba10pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3IgcGF0Y2hcbiAqXG4gKiBAbWV0aG9kIHNldE9wdGlvbnNcbiAqXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5zZXRPcHRpb25zID0gT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLnBhdGNoO1xuXG4vKipcbiAqIFJldHVybiBPcHRpb25zTWFuYWdlciBiYXNlZCBvbiBzdWItb2JqZWN0IHJldHJpZXZlZCBieSBrZXlcbiAqXG4gKiBAbWV0aG9kIGtleVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZGVudGlmaWVyIGtleVxuICogQHJldHVybiB7T3B0aW9uc01hbmFnZXJ9IG5ldyBvcHRpb25zIG1hbmFnZXIgd2l0aCB0aGUgdmFsdWVcbiAqL1xuT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLmtleSA9IGZ1bmN0aW9uIGtleShpZGVudGlmaWVyKSB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBPcHRpb25zTWFuYWdlcih0aGlzLl92YWx1ZVtpZGVudGlmaWVyXSk7XG4gICAgaWYgKCEocmVzdWx0Ll92YWx1ZSBpbnN0YW5jZW9mIE9iamVjdCkgfHwgcmVzdWx0Ll92YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSByZXN1bHQuX3ZhbHVlID0ge307XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogTG9vayB1cCB2YWx1ZSBieSBrZXlcbiAqIEBtZXRob2QgZ2V0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBrZXlcbiAqIEByZXR1cm4ge09iamVjdH0gYXNzb2NpYXRlZCBvYmplY3RcbiAqL1xuT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVba2V5XTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIGdldFxuICogQG1ldGhvZCBnZXRPcHRpb25zXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5nZXRPcHRpb25zID0gT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLmdldDtcblxuLyoqXG4gKiBTZXQga2V5IHRvIHZhbHVlLiAgT3V0cHV0cyAnY2hhbmdlJyBldmVudCBpZiBhIHZhbHVlIGlzIG92ZXJ3cml0dGVuLlxuICpcbiAqIEBtZXRob2Qgc2V0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBrZXkgc3RyaW5nXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgdmFsdWUgb2JqZWN0XG4gKiBAcmV0dXJuIHtPcHRpb25zTWFuYWdlcn0gbmV3IG9wdGlvbnMgbWFuYWdlciBiYXNlZCBvbiB0aGUgdmFsdWUgb2JqZWN0XG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQoa2V5LCB2YWx1ZSkge1xuICAgIHZhciBvcmlnaW5hbFZhbHVlID0gdGhpcy5nZXQoa2V5KTtcbiAgICB0aGlzLl92YWx1ZVtrZXldID0gdmFsdWU7XG5cbiAgICBpZiAodGhpcy5ldmVudE91dHB1dCAmJiB2YWx1ZSAhPT0gb3JpZ2luYWxWYWx1ZSkgdGhpcy5ldmVudE91dHB1dC5lbWl0KCdjaGFuZ2UnLCB7aWQ6IGtleSwgdmFsdWU6IHZhbHVlfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBlbnRpcmUgb2JqZWN0IGNvbnRlbnRzIG9mIHRoaXMgT3B0aW9uc01hbmFnZXIuXG4gKlxuICogQG1ldGhvZCB2YWx1ZVxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gY3VycmVudCBzdGF0ZSBvZiBvcHRpb25zXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uIHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIFwib25cIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NoYW5nZScpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKCkge1xuICAgIF9jcmVhdGVFdmVudE91dHB1dC5jYWxsKHRoaXMpO1xuICAgIHJldHVybiB0aGlzLm9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG4vKipcbiAqIFVuYmluZCBhbiBldmVudCBieSB0eXBlIGFuZCBoYW5kbGVyLlxuICogICBUaGlzIHVuZG9lcyB0aGUgd29yayBvZiBcIm9uXCIuXG4gKlxuICogQG1ldGhvZCByZW1vdmVMaXN0ZW5lclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NoYW5nZScpXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBoYW5kbGVyIGZ1bmN0aW9uIG9iamVjdCB0byByZW1vdmVcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gaW50ZXJuYWwgZXZlbnQgaGFuZGxlciBvYmplY3QgKGZvciBjaGFpbmluZylcbiAqL1xuT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgX2NyZWF0ZUV2ZW50T3V0cHV0LmNhbGwodGhpcyk7XG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogQWRkIGV2ZW50IGhhbmRsZXIgb2JqZWN0IHRvIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICpcbiAqIEBtZXRob2QgcGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgZXZlbnQgaGFuZGxlciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHBhc3NlZCBldmVudCBoYW5kbGVyXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24gcGlwZSgpIHtcbiAgICBfY3JlYXRlRXZlbnRPdXRwdXQuY2FsbCh0aGlzKTtcbiAgICByZXR1cm4gdGhpcy5waXBlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBoYW5kbGVyIG9iamVjdCBmcm9tIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICogVW5kb2VzIHdvcmsgb2YgXCJwaXBlXCJcbiAqXG4gKiBAbWV0aG9kIHVucGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgdGFyZ2V0IGhhbmRsZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHByb3ZpZGVkIHRhcmdldFxuICovXG5PcHRpb25zTWFuYWdlci5wcm90b3R5cGUudW5waXBlID0gZnVuY3Rpb24gdW5waXBlKCkge1xuICAgIF9jcmVhdGVFdmVudE91dHB1dC5jYWxsKHRoaXMpO1xuICAgIHJldHVybiB0aGlzLnVucGlwZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBPcHRpb25zTWFuYWdlcjsiLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBPcHRpb25zTWFuYWdlciAgID0gcmVxdWlyZSgnLi4vT3B0aW9uc01hbmFnZXInKSxcbiAgICBTdXJmYWNlICAgICAgICAgID0gcmVxdWlyZSgnLi4vQ29tcG9uZW50cy9TdXJmYWNlJyksXG4gICAgQ29udGFpbmVyICAgICAgICA9IHJlcXVpcmUoJy4uL0NvbXBvbmVudHMvQ29udGFpbmVyJyksXG4gICAgRWxlbWVudEFsbG9jYXRvciA9IHJlcXVpcmUoJy4vRWxlbWVudEFsbG9jYXRvcicpLFxuICAgIEVudGl0eVJlZ2lzdHJ5ICAgPSByZXF1aXJlKCcuLi9FbnRpdHlSZWdpc3RyeScpLFxuICAgIE1hdHJpeE1hdGggICAgICAgPSByZXF1aXJlKCcuLi8uLi9tYXRoLzR4NG1hdHJpeCcpO1xuXG4vLyBTdGF0ZVxudmFyIGNvbnRhaW5lcnNUb0VsZW1lbnRzID0ge30sXG4gICAgc3VyZmFjZXNUb0VsZW1lbnRzICAgPSB7fSxcbiAgICBjb250YWluZXJzVG9TdXJmYWNlcyA9IHt9LFxuICAgIHRhcmdldHMgICAgICAgICAgICAgID0gW1N1cmZhY2UudG9TdHJpbmcoKV07XG5cbnZhciB1c2VQcmVmaXggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKS5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gIT0gbnVsbDtcblxuLy8gQ09OU1RTXG52YXIgWkVSTyAgICAgICAgICAgICAgICA9IDAsXG4gICAgTUFUUklYM0QgICAgICAgICAgICA9ICdtYXRyaXgzZCgnLFxuICAgIENMT1NFX1BBUkVOICAgICAgICAgPSAnKScsXG4gICAgQ09NTUEgICAgICAgICAgICAgICA9ICcsJyxcbiAgICBESVYgICAgICAgICAgICAgICAgID0gJ2RpdicsXG4gICAgRkFfQ09OVEFJTkVSICAgICAgICA9ICdmYS1jb250YWluZXInLFxuICAgIEZBX1NVUkZBQ0UgICAgICAgICAgPSAnZmEtc3VyZmFjZScsXG4gICAgQ09OVEFJTkVSICAgICAgICAgICA9ICdjb250YWluZXInLFxuICAgIFBYICAgICAgICAgICAgICAgICAgPSAncHgnLFxuICAgIFNVUkZBQ0UgICAgICAgICAgICAgPSAnc3VyZmFjZScsXG4gICAgVFJBTlNGT1JNICAgICAgICAgICA9ICd0cmFuc2Zvcm0nLFxuICAgIENTU1RSQU5TRk9STSAgICAgICAgPSB1c2VQcmVmaXggPyAnd2Via2l0VHJhbnNmb3JtJyA6ICd0cmFuc2Zvcm0nLFxuICAgIENTU1RSQU5TRk9STV9PUklHSU4gPSB1c2VQcmVmaXggPyAnd2Via2l0VHJhbnNmb3JtT3JpZ2luJyA6ICd0cmFuc2Zvcm1PcmlnaW4nO1xuXG4vL3NjcmF0Y2ggbWVtb3J5IGZvciBtYXRyaXggY2FsY3VsYXRpb25zXG52YXIgZGV2aWNlUGl4ZWxSYXRpbyA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEsXG4gICAgbWF0cml4U2NyYXRjaDEgICA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKSxcbiAgICBtYXRyaXhTY3JhdGNoMiAgID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pLFxuICAgIG1hdHJpeFNjcmF0Y2gzICAgPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSksXG4gICAgbWF0cml4U2NyYXRjaDQgICA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKTtcblxuLyoqXG4gKiBET01SZW5kZXJlciBpcyBhIHNpbmdsZXRvbiBvYmplY3Qgd2hvc2UgcmVzcG9uc2libGl0eSBpdCBpc1xuICogIHRvIGRyYXcgRE9NIGJvdW5kIFN1cmZhY2VzIHRvIHRoZWlyIHJlc3BlY3RpdmUgQ29udGFpbmVycy5cbiAqXG4gKiBAY2xhc3MgRE9NUmVuZGVyZXJcbiAqIEBzaW5nbGV0b25cbiAqL1xudmFyIERPTVJlbmRlcmVyID0ge1xuICAgIF9xdWV1ZXM6IHtcbiAgICAgICAgY29udGFpbmVyczoge1xuICAgICAgICAgICAgdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIHJlY2FsbDogW10sXG4gICAgICAgICAgICBkZXBsb3k6IFtdXG4gICAgICAgIH0sXG4gICAgICAgIHN1cmZhY2VzOiB7fVxuICAgIH0sXG4gICAgYWxsb2NhdG9yczoge31cbn07XG5cbi8qKlxuICogQWRkIGFuIEVudGl0eSB3aXRoIGEgQ29udGFpbmVyIGNvbXBvbmVudCB0byB0aGUgcXVldWUgdG8gYmVcbiAqICBhZGRlZCBpbnRvIHRoZSBET00uXG4gKlxuICogQG1ldGhvZCBkZXBsb3lDb250YWluZXJcbiAqIFxuICogQHBhcmFtIHtFbnRpdHl9IGVudGl0eSBFbnRpdHkgdGhhdCBuZWVkcyB0byBiZSBkZXBsb3llZFxuICovXG5ET01SZW5kZXJlci5kZXBsb3lDb250YWluZXIgPSBmdW5jdGlvbiBkZXBsb3lDb250YWluZXIoZW50aXR5KSB7XG4gICAgdGhpcy5fcXVldWVzLmNvbnRhaW5lcnMuZGVwbG95LnB1c2goZW50aXR5KTtcbiAgICBjb250YWluZXJzVG9TdXJmYWNlc1tlbnRpdHkuX2lkXSAgPSB7fTtcbiAgICB0aGlzLl9xdWV1ZXMuc3VyZmFjZXNbZW50aXR5Ll9pZF0gPSB7XG4gICAgICAgIHVwZGF0ZTogW10sXG4gICAgICAgIHJlY2FsbDogW10sXG4gICAgICAgIGRlcGxveTogW11cbiAgICB9O1xufTtcblxuLy8gRGVwbG95IGEgZ2l2ZW4gRW50aXR5J3MgQ29udGFpbmVyIHRvIHRoZSBET00uXG5mdW5jdGlvbiBfZGVwbG95Q29udGFpbmVyKGVudGl0eSkge1xuICAgIHZhciBjb250ZXh0ID0gZW50aXR5LmdldENvbnRleHQoKTtcblxuICAgIC8vIElmIHRoZSBDb250YWluZXIgaGFzIG5vdCBwcmV2aW91c2x5IGJlZW4gZGVwbG95IGFuZFxuICAgIC8vIGRvZXMgbm90IGhhdmUgYW4gYWxsb2NhdG9yLCBjcmVhdGUgb25lLlxuICAgIGlmICghRE9NUmVuZGVyZXIuYWxsb2NhdG9yc1tjb250ZXh0Ll9pZF0pXG4gICAgICAgIERPTVJlbmRlcmVyLmFsbG9jYXRvcnNbY29udGV4dC5faWRdID0gbmV3IEVsZW1lbnRBbGxvY2F0b3IoY29udGV4dC5fcGFyZW50RWwpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBET00gcmVwcmVzZW50YXRpb24gb2YgdGhlIENvbnRhaW5lclxuICAgIHZhciBlbGVtZW50ID0gRE9NUmVuZGVyZXIuYWxsb2NhdG9yc1tjb250ZXh0Ll9pZF0uYWxsb2NhdGUoRElWKTtcbiAgICBjb250YWluZXJzVG9FbGVtZW50c1tlbnRpdHkuX2lkXSA9IGVsZW1lbnQ7XG4gICAgX3VwZGF0ZUNvbnRhaW5lcihlbnRpdHksIGVsZW1lbnQpO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChGQV9DT05UQUlORVIpO1xuXG4gICAgRE9NUmVuZGVyZXIuYWxsb2NhdG9yc1tlbnRpdHkuX2lkXSA9IG5ldyBFbGVtZW50QWxsb2NhdG9yKGVsZW1lbnQpO1xufVxuXG4vKipcbiAqIEFkZCBhbiBFbnRpdHkgd2l0aCBhIENvbnRhaW5lciBjb21wb25lbnQgdG8gdGhlIHF1ZXVlIHRvIGJlXG4gKiAgcmVtb3ZlZCBmcm9tIHRoZSBET00uXG4gKlxuICogQG1ldGhvZCByZWNhbGxDb250YWluZXJcbiAqIFxuICogQHBhcmFtIHtFbnRpdHl9IGVudGl0eSBFbnRpdHkgdGhhdCBuZWVkcyB0byBiZSByZWNhbGxlZFxuICovXG5ET01SZW5kZXJlci5yZWNhbGxDb250YWluZXIgPSBmdW5jdGlvbiByZWNhbGxDb250YWluZXIoZW50aXR5KSB7XG4gICAgdGhpcy5fcXVldWVzLmNvbnRhaW5lcnMucmVjYWxsLnB1c2goZW50aXR5KTtcbiAgICBkZWxldGUgdGhpcy5fcXVldWVzLnN1cmZhY2VzW2VudGl0eS5faWRdO1xufTtcblxuLy8gUmVjYWxsIHRoZSBET00gcmVwcmVzZW50YXRpb24gb2YgdGhlIEVudGl0eSdzIENvbnRhaW5lclxuLy8gYW5kIGNsZWFuIHVwIHJlZmVyZW5jZXMuXG5mdW5jdGlvbiBfcmVjYWxsQ29udGFpbmVyKGVudGl0eSkge1xuICAgIHZhciBlbGVtZW50ID0gY29udGFpbmVyc1RvRWxlbWVudHNbZW50aXR5Ll9pZF07XG4gICAgdmFyIGNvbnRleHQgPSBlbnRpdHkuZ2V0Q29udGV4dCgpO1xuICAgIERPTVJlbmRlcmVyLmFsbG9jYXRvcnNbY29udGV4dC5faWRdLmRlYWxsb2NhdGUoZWxlbWVudCk7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKEZBX0NPTlRBSU5FUik7XG4gICAgZGVsZXRlIERPTVJlbmRlcmVyLmFsbG9jYXRvcnNbZW50aXR5Ll9pZF07XG59XG5cbi8qKlxuICogQWRkIGFuIEVudGl0eSB3aXRoIGEgQ29udGFpbmVyIGNvbXBvbmVudCB0byB0aGUgcXVldWUgdG8gYmVcbiAqICB1cGRhdGVkLlxuICpcbiAqIEBtZXRob2QgdXBkYXRlQ29udGFpbmVyXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgbmVlZHMgdG8gYmUgdXBkYXRlZFxuICovXG5ET01SZW5kZXJlci51cGRhdGVDb250YWluZXIgPSBmdW5jdGlvbiB1cGRhdGVDb250YWluZXIoZW50aXR5KSB7XG4gICAgdGhpcy5fcXVldWVzLmNvbnRhaW5lcnMudXBkYXRlLnB1c2goZW50aXR5KTtcbn07XG5cbi8vIFVwZGF0ZSB0aGUgQ29udGFpbmVyJ3MgRE9NIHByb3BlcnRpZXNcbmZ1bmN0aW9uIF91cGRhdGVDb250YWluZXIoZW50aXR5KSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGVudGl0eS5nZXRDb21wb25lbnQoQ09OVEFJTkVSKSxcbiAgICAgICAgZWxlbWVudCAgID0gY29udGFpbmVyc1RvRWxlbWVudHNbZW50aXR5Ll9pZF0sXG4gICAgICAgIGkgICAgICAgICA9IDAsXG4gICAgICAgIHNpemUsXG4gICAgICAgIG9yaWdpbixcbiAgICAgICAgY29udGV4dFNpemU7XG5cbiAgICBpZiAoY29udGFpbmVyLl9ldmVudHMuZGlydHkpIHtcbiAgICAgICAgaSA9IGNvbnRhaW5lci5fZXZlbnRzLm9uLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGNvbnRhaW5lci5fZXZlbnRzLm9mZi5sZW5ndGgpIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihjb250YWluZXIuX2V2ZW50cy5vZmYucG9wKCksIGNvbnRhaW5lci5fZXZlbnRzLmZvcndhcmRlcik7XG4gICAgICAgIHdoaWxlIChpLS0pIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihjb250YWluZXIuX2V2ZW50cy5vbltpXSwgY29udGFpbmVyLl9ldmVudHMuZm9yd2FyZGVyKTtcbiAgICAgICAgY29udGFpbmVyLl9ldmVudHMuZGlydHkgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoY29udGFpbmVyLl9zaXplRGlydHkgfHwgY29udGFpbmVyLl90cmFuc2Zvcm1EaXJ0eSkge1xuICAgICAgICBjb250ZXh0U2l6ZSA9IGVudGl0eS5nZXRDb250ZXh0KCkuX3NpemU7XG4gICAgICAgIHNpemUgICAgICAgID0gY29udGFpbmVyLmdldFNpemUoKTtcbiAgICAgICAgb3JpZ2luICAgICAgPSBjb250YWluZXIub3JpZ2luO1xuICAgIH1cblxuICAgIGlmIChjb250YWluZXIuX3NpemVEaXJ0eSkge1xuICAgICAgICBlbGVtZW50LnN0eWxlLndpZHRoICA9IHNpemVbMF0gKyBQWDtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBzaXplWzFdICsgUFg7XG4gICAgICAgIGNvbnRhaW5lci5fc2l6ZURpcnR5ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRhaW5lci5fdHJhbnNmb3JtRGlydHkpIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybSAgICAgICAgICAgICAgID0gRE9NUmVuZGVyZXIuY3JlYXRlRE9NTWF0cml4KGVudGl0eS5nZXRDb21wb25lbnQoVFJBTlNGT1JNKS5fbWF0cml4LCBjb250ZXh0U2l6ZSwgc2l6ZSwgb3JpZ2luKTtcbiAgICAgICAgZWxlbWVudC5zdHlsZVtDU1NUUkFOU0ZPUk1dID0gRE9NUmVuZGVyZXIuc3RyaW5naWZ5TWF0cml4KHRyYW5zZm9ybSk7XG5cbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhjb250YWluZXJzVG9TdXJmYWNlc1tlbnRpdHkuX2lkXSk7XG4gICAgICAgIGkgICAgICAgID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICBpZiAoY29udGFpbmVyc1RvU3VyZmFjZXNbZW50aXR5Ll9pZF1ba2V5c1tpXV0pXG4gICAgICAgICAgICAgICAgY29udGFpbmVyc1RvU3VyZmFjZXNbZW50aXR5Ll9pZF1ba2V5c1tpXV0uZ2V0Q29tcG9uZW50KFNVUkZBQ0UpLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLnRyYW5zZm9ybTtcbiAgICB9XG59XG5cbi8qKlxuICogQWRkIGFuIEVudGl0eSB3aXRoIGEgU3VyZmFjZSB0byB0aGUgcXVldWUgdG8gYmUgZGVwbG95ZWRcbiAqICB0byBhIHBhcnRpY3VsYXIgQ29udGFpbmVyLlxuICpcbiAqIEBtZXRob2QgZGVwbG95XG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgbmVlZHMgdG8gYmUgZGVwbG95ZWRcbiAqIEBwYXJhbSB7RW50aXR5fSBjb250YWluZXIgRW50aXR5IHRoYXQgdGhlIFN1cmZhY2Ugd2lsbCBiZSBkZXBsb3llZCB0b1xuICovXG5ET01SZW5kZXJlci5kZXBsb3kgPSBmdW5jdGlvbiBkZXBsb3koZW50aXR5LCBjb250YWluZXIpIHtcbiAgICBpZiAoIXN1cmZhY2VzVG9FbGVtZW50c1tlbnRpdHkuX2lkXSkgc3VyZmFjZXNUb0VsZW1lbnRzW2VudGl0eS5faWRdID0ge307XG4gICAgRE9NUmVuZGVyZXIuX3F1ZXVlcy5zdXJmYWNlc1tjb250YWluZXIuX2lkXS5kZXBsb3kucHVzaChlbnRpdHkpO1xuICAgIGNvbnRhaW5lcnNUb1N1cmZhY2VzW2NvbnRhaW5lci5faWRdW2VudGl0eS5faWRdID0gZW50aXR5O1xufTtcblxuLy8gRGVwbG95cyB0aGUgRW50aXR5J3MgU3VyZmFjZSB0byBhIHBhcnRpY3VsYXIgQ29udGFpbmVyLlxuZnVuY3Rpb24gX2RlcGxveShlbnRpdHksIGNvbnRhaW5lcklEKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBET01SZW5kZXJlci5hbGxvY2F0b3JzW2NvbnRhaW5lcklEXS5hbGxvY2F0ZShESVYpO1xuICAgIGVudGl0eS5nZXRDb21wb25lbnQoU1VSRkFDRSkuaW52YWxpZGF0ZUFsbCgpO1xuICAgIHN1cmZhY2VzVG9FbGVtZW50c1tlbnRpdHkuX2lkXVtjb250YWluZXJJRF0gPSBlbGVtZW50O1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChGQV9TVVJGQUNFKTtcbiAgICBfdXBkYXRlKGVudGl0eSwgY29udGFpbmVySUQpO1xufVxuXG4vKipcbiAqIEFkZCBhbiBFbnRpdHkgd2l0aCBhIFN1cmZhY2UgdG8gdGhlIHF1ZXVlIHRvIGJlIHJlY2FsbGVkXG4gKiAgZnJvbSBhIHBhcnRpY3VsYXIgQ29udGFpbmVyLlxuICpcbiAqIEBtZXRob2QgcmVjYWxsXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgbmVlZHMgdG8gYmUgcmVjYWxsZWQgZnJvbVxuICogQHBhcmFtIHtFbnRpdHl9IGNvbnRhaW5lciBFbnRpdHkgdGhhdCB0aGUgU3VyZmFjZSB3aWxsIGJlIHJlY2FsbGVkIGZyb21cbiAqL1xuRE9NUmVuZGVyZXIucmVjYWxsID0gZnVuY3Rpb24gcmVjYWxsKGVudGl0eSwgY29udGFpbmVyKSB7XG4gICAgRE9NUmVuZGVyZXIuX3F1ZXVlcy5zdXJmYWNlc1tjb250YWluZXIuX2lkXS5yZWNhbGwucHVzaChlbnRpdHkpO1xuICAgIGNvbnRhaW5lcnNUb1N1cmZhY2VzW2NvbnRhaW5lci5faWRdW2VudGl0eS5faWRdID0gZmFsc2U7XG59O1xuXG4vLyBSZWNhbGxzIHRoZSBFbnRpdHkncyBTdXJmYWNlIGZyb20gYSBnaXZlbiBDb250YWluZXJcbmZ1bmN0aW9uIF9yZWNhbGwoZW50aXR5LCBjb250YWluZXJJRCkge1xuICAgIHZhciBlbGVtZW50ID0gc3VyZmFjZXNUb0VsZW1lbnRzW2VudGl0eS5faWRdO1xuICAgIHZhciBzdXJmYWNlID0gZW50aXR5LmdldENvbXBvbmVudCgnc3VyZmFjZScpO1xuICAgIERPTVJlbmRlcmVyLmFsbG9jYXRvcnNbY29udGFpbmVySURdLmRlYWxsb2NhdGUoZWxlbWVudCk7XG4gICAgdmFyIGkgPSBzdXJmYWNlLnNwZWMuZXZlbnRzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoc3VyZmFjZS5zcGVjLmV2ZW50c1tpXSwgc3VyZmFjZS5ldmVudEZvcndhcmRlcik7XG59XG5cbi8qKlxuICogQWRkIGFuIEVudGl0eSB3aXRoIGEgU3VyZmFjZSB0byB0aGUgcXVldWUgdG8gYmUgdXBkYXRlZFxuICpcbiAqIEBtZXRob2QgdXBkYXRlXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgbmVlZHMgdG8gYmUgdXBkYXRlZFxuICogQHBhcmFtIHtFbnRpdHl9IGNvbnRhaW5lciBFbnRpdHkgdGhhdCB0aGUgU3VyZmFjZSB3aWxsIGJlIHVwZGF0ZWQgZm9yXG4gKi9cbkRPTVJlbmRlcmVyLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZShlbnRpdHksIGNvbnRhaW5lcikge1xuICAgIERPTVJlbmRlcmVyLl9xdWV1ZXMuc3VyZmFjZXNbY29udGFpbmVyLl9pZF0udXBkYXRlLnB1c2goZW50aXR5KTtcbn07XG5cbi8vIFVwZGF0ZSB0aGUgU3VyZmFjZSB0aGF0IGlzIHRvIGRlcGxveWVkIHRvIGEgcGFydGN1bGFyIENvbnRhaW5lclxuZnVuY3Rpb24gX3VwZGF0ZShlbnRpdHksIGNvbnRhaW5lcklEKSB7XG4gICAgdmFyIHN1cmZhY2UgICAgICAgICA9IGVudGl0eS5nZXRDb21wb25lbnQoU1VSRkFDRSksXG4gICAgICAgIHNwZWMgICAgICAgICAgICA9IHN1cmZhY2UucmVuZGVyKCksXG4gICAgICAgIGkgICAgICAgICAgICAgICA9IDAsXG4gICAgICAgIGNvbnRleHRTaXplICAgICA9IGVudGl0eS5nZXRDb250ZXh0KCkuX3NpemUsXG4gICAgICAgIGVsZW1lbnQgICAgICAgICA9IHN1cmZhY2VzVG9FbGVtZW50c1tlbnRpdHkuX2lkXVtjb250YWluZXJJRF0sXG4gICAgICAgIGNvbnRhaW5lckVudGl0eSA9IEVudGl0eVJlZ2lzdHJ5LmdldEVudGl0eShjb250YWluZXJJRCksXG4gICAgICAgIGNvbnRhaW5lciAgICAgICA9IGNvbnRhaW5lckVudGl0eS5nZXRDb21wb25lbnQoQ09OVEFJTkVSKSxcbiAgICAgICAga2V5O1xuXG4gICAgaWYgKFN1cmZhY2UuaW52YWxpZGF0aW9ucy5jbGFzc2VzICYgc3BlYy5pbnZhbGlkYXRpb25zKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBlbGVtZW50LmNsYXNzTGlzdC5sZW5ndGg7IGkrKykgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGVsZW1lbnQuY2xhc3NMaXN0W2ldKTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHNwZWMuY2xhc3Nlcy5sZW5ndGg7ICAgaSsrKSBlbGVtZW50LmNsYXNzTGlzdC5hZGQoc3BlYy5jbGFzc2VzW2ldKTtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKEZBX1NVUkZBQ0UpO1xuICAgIH1cbiAgICBcbiAgICBpZiAoU3VyZmFjZS5pbnZhbGlkYXRpb25zLnByb3BlcnRpZXMgJiBzcGVjLmludmFsaWRhdGlvbnMpXG4gICAgICAgIGZvciAoa2V5IGluIHNwZWMucHJvcGVydGllcykgZWxlbWVudC5zdHlsZVtrZXldID0gc3BlYy5wcm9wZXJ0aWVzW2tleV07XG5cbiAgICBpZiAoU3VyZmFjZS5pbnZhbGlkYXRpb25zLmNvbnRlbnQgJiBzcGVjLmludmFsaWRhdGlvbnMpXG4gICAgICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gc3BlYy5jb250ZW50O1xuXG4gICAgaWYgKFN1cmZhY2UuaW52YWxpZGF0aW9ucy5vcGFjaXR5ICYgc3BlYy5pbnZhbGlkYXRpb25zKVxuICAgICAgICBlbGVtZW50LnN0eWxlLm9wYWNpdHkgPSBzcGVjLm9wYWNpdHk7XG5cbiAgICBpZiAoU3VyZmFjZS5pbnZhbGlkYXRpb25zLm9yaWdpbiAmIHNwZWMuaW52YWxpZGF0aW9ucykge1xuICAgICAgICBlbGVtZW50LnN0eWxlW0NTU1RSQU5TRk9STV9PUklHSU5dID0gc3BlYy5vcmlnaW5bMF0udG9GaXhlZCgyKSAqIDEwMCArICclICcgKyBzcGVjLm9yaWdpblsxXS50b0ZpeGVkKDIpICogMTAwICsgJyUnO1xuICAgIH1cblxuICAgIGlmIChTdXJmYWNlLmludmFsaWRhdGlvbnMuZXZlbnRzICYgc3BlYy5pbnZhbGlkYXRpb25zKSB7XG4gICAgICAgIGkgPSBzcGVjLmV2ZW50cy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihzcGVjLmV2ZW50c1tpXSwgc3BlYy5ldmVudEZvcndhcmRlcik7XG4gICAgfVxuXG4gICAgaWYgKFN1cmZhY2UuaW52YWxpZGF0aW9ucy5zaXplICYgc3BlYy5pbnZhbGlkYXRpb25zKSB7XG4gICAgICAgIHN1cmZhY2UuX3NpemVbMF0gPSBlbGVtZW50Lm9mZnNldFdpZHRoO1xuICAgICAgICBzdXJmYWNlLl9zaXplWzFdID0gZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgfVxuXG4gICAgaWYgKFN1cmZhY2UuaW52YWxpZGF0aW9ucy50cmFuc2Zvcm0gJiBzcGVjLmludmFsaWRhdGlvbnMpIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybSA9IE1hdHJpeE1hdGgubXVsdGlwbHkobWF0cml4U2NyYXRjaDMsIGNvbnRhaW5lci5nZXREaXNwbGF5TWF0cml4KCksIGVudGl0eS5nZXRDb21wb25lbnQoVFJBTlNGT1JNKS5fbWF0cml4KTtcbiAgICAgICAgdHJhbnNmb3JtICAgICA9IERPTVJlbmRlcmVyLmNyZWF0ZURPTU1hdHJpeCh0cmFuc2Zvcm0sIGNvbnRleHRTaXplLCBzdXJmYWNlLmdldFNpemUoKSwgc3BlYy5vcmlnaW4pO1xuICAgICAgICB2YXIgY2FtZXJhICAgID0gZW50aXR5LmdldENvbnRleHQoKS5nZXRDb21wb25lbnQoJ2NhbWVyYScpO1xuICAgICAgICBpZiAoY2FtZXJhKSB7XG4gICAgICAgICAgICB2YXIgZm9jYWxQb2ludCAgICA9IGNhbWVyYS5nZXRPcHRpb25zKCkucHJvamVjdGlvbi5vcHRpb25zLmZvY2FsUG9pbnQ7XG4gICAgICAgICAgICB2YXIgZnggICAgICAgICAgICA9IChmb2NhbFBvaW50WzBdICsgMSkgKiAwLjUgKiBjb250ZXh0U2l6ZVswXTtcbiAgICAgICAgICAgIHZhciBmeSAgICAgICAgICAgID0gKDEgLSBmb2NhbFBvaW50WzFdKSAqIDAuNSAqIGNvbnRleHRTaXplWzFdO1xuICAgICAgICAgICAgdmFyIHNjcmF0Y2hNYXRyaXggPSBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgIDAsIDAsIDAsIDEsIDAsIGZ4IC0gc3VyZmFjZS5nZXRTaXplKClbMF0gKiBzcGVjLm9yaWdpblswXSwgIGZ5IC0gc3VyZmFjZS5nZXRTaXplKClbMV0gKiBzcGVjLm9yaWdpblsxXSwgMCwgMV07XG4gICAgICAgICAgICBNYXRyaXhNYXRoLm11bHRpcGx5KHNjcmF0Y2hNYXRyaXgsIHNjcmF0Y2hNYXRyaXgsIFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAgMCwgMCwgMCwgMSwgZW50aXR5LmdldENvbnRleHQoKS5nZXRDb21wb25lbnQoJ2NhbWVyYScpLmdldFByb2plY3Rpb25UcmFuc2Zvcm0oKVsxMV0sICAwLCAwLCAwLCAxXSk7XG4gICAgICAgICAgICBNYXRyaXhNYXRoLm11bHRpcGx5KHNjcmF0Y2hNYXRyaXgsIHNjcmF0Y2hNYXRyaXgsIFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAtKGZ4IC0gc3VyZmFjZS5nZXRTaXplKClbMF0gKiBzcGVjLm9yaWdpblswXSksICAtKGZ5IC0gc3VyZmFjZS5nZXRTaXplKClbMV0gKiBzcGVjLm9yaWdpblsxXSksIDAsIDFdKTtcbiAgICAgICAgICAgIE1hdHJpeE1hdGgubXVsdGlwbHkodHJhbnNmb3JtLCBzY3JhdGNoTWF0cml4LCB0cmFuc2Zvcm0pO1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQuc3R5bGVbQ1NTVFJBTlNGT1JNXSA9IERPTVJlbmRlcmVyLnN0cmluZ2lmeU1hdHJpeCh0cmFuc2Zvcm0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZW5kZXIgd2lsbCBydW4gb3ZlciBhbGwgb2YgdGhlIHF1ZXVlcyB0aGF0IGhhdmUgYmVlbiBwb3B1bGF0ZWRcbiAqICBieSB0aGUgUmVuZGVyU3lzdGVtIGFuZCB3aWxsIGV4ZWN1dGUgdGhlIGRlcGxveW1lbnQsIHJlY2FsbGluZyxcbiAqICBhbmQgdXBkYXRpbmcuXG4gKlxuICogQG1ldGhvZCByZW5kZXJcbiAqL1xuIERPTVJlbmRlcmVyLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgcXVldWUsXG4gICAgICAgIGNvbnRhaW5lcklELFxuICAgICAgICBpbm5lclF1ZXVlcyxcbiAgICAgICAgcXVldWVzICAgICA9IERPTVJlbmRlcmVyLl9xdWV1ZXMsXG4gICAgICAgIGNvbnRhaW5lcnMgPSBPYmplY3Qua2V5cyhxdWV1ZXMuc3VyZmFjZXMpLFxuICAgICAgICBqICAgICAgICAgID0gY29udGFpbmVycy5sZW5ndGgsXG4gICAgICAgIGkgICAgICAgICAgPSAwLFxuICAgICAgICBrICAgICAgICAgID0gMDtcbiAgICBcbiAgICAvLyBEZXBsb3kgQ29udGFpbmVyc1xuICAgIHF1ZXVlID0gcXVldWVzLmNvbnRhaW5lcnMuZGVwbG95O1xuICAgIGkgICAgID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIF9kZXBsb3lDb250YWluZXIocXVldWUuc2hpZnQoKSk7XG5cbiAgICAvLyBSZWNhbGwgQ29udGFpbmVyc1xuICAgIHF1ZXVlID0gcXVldWVzLmNvbnRhaW5lcnMucmVjYWxsO1xuICAgIGkgICAgID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIF9yZWNhbGxDb250YWluZXIocXVldWUuc2hpZnQoKSk7XG5cbiAgICAvLyBVcGRhdGUgQ29udGFpbmVyc1xuICAgIHF1ZXVlID0gcXVldWVzLmNvbnRhaW5lcnMudXBkYXRlO1xuICAgIGkgICAgID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIF91cGRhdGVDb250YWluZXIocXVldWUuc2hpZnQoKSk7XG5cbiAgICAvLyBGb3IgZWFjaCBDb250YWluZXJcbiAgICB3aGlsZSAoai0tKSB7XG4gICAgICAgIGNvbnRhaW5lcklEID0gY29udGFpbmVyc1tqXTtcbiAgICAgICAgaW5uZXJRdWV1ZXMgPSBxdWV1ZXMuc3VyZmFjZXNbY29udGFpbmVySURdO1xuXG4gICAgICAgIC8vIERlcGxveSBTdXJmYWNlc1xuICAgICAgICBxdWV1ZSA9IGlubmVyUXVldWVzLmRlcGxveTtcbiAgICAgICAgaSAgICAgPSBxdWV1ZS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIF9kZXBsb3kocXVldWUuc2hpZnQoKSwgY29udGFpbmVySUQpO1xuXG4gICAgICAgIC8vIFJlY2FsbCBTdXJmYWNlc1xuICAgICAgICBxdWV1ZSA9IGlubmVyUXVldWVzLnJlY2FsbDtcbiAgICAgICAgaSAgICAgPSBxdWV1ZS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIF9yZWNhbGwocXVldWUuc2hpZnQoKSwgY29udGFpbmVySUQpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSBTdXJmYWNlc1xuICAgICAgICBxdWV1ZSA9IGlubmVyUXVldWVzLnVwZGF0ZTtcbiAgICAgICAgaSAgICAgPSBxdWV1ZS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIF91cGRhdGUocXVldWUuc2hpZnQoKSwgY29udGFpbmVySUQpO1xuICAgIH1cblxufTtcblxuLy8gR2V0IHRoZSB0eXBlIG9mIFRhcmdldHMgdGhlIERPTVJlbmRlcmVyIHdpbGwgd29yayBmb3JcbkRPTVJlbmRlcmVyLmdldFRhcmdldHMgPSBmdW5jdGlvbiBnZXRUYXJnZXRzKCkge1xuICAgIHJldHVybiB0YXJnZXRzO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIFRyYW5zZm9ybSBtYXRyaXggZm9yIGEgU3VyZmFjZSBiYXNlZCBvbiBpdCB0cmFuc2Zvcm0sXG4gKiAgc2l6ZSwgb3JpZ2luLCBhbmQgQ29udGV4dCdzIHNpemUuICBVc2VzIGl0cyBDb250ZXh0J3Mgc2l6ZSB0b1xuICogIHR1cm4gaG9tb2dlbm91cyBjb29yZGluYXRlIFRyYW5zZm9ybXMgdG8gcGl4ZWxzLlxuICpcbiAqIEBtZXRob2QgY3JlYXRlRE9NTUF0cml4XG4gKlxuICogQHBhcmFtIHtBcnJheX0gdHJhbnNmb3JtIFRyYW5zZm9ybSBtYXRyaXhcbiAqIEBwYXJhbSB7QXJyYXl9IGNvbnRleHRTaXplIDItZGltZW5zaW9uYWwgc2l6ZSBvZiB0aGUgQ29udGV4dFxuICogQHBhcmFtIHtBcnJheX0gc2l6ZSBzaXplIG9mIHRoZSBET00gZWxlbWVudCBhcyBhIDMtZGltZW5zaW9uYWwgYXJyYXlcbiAqIEBwYXJhbSB7QXJyYXl9IG9yaWdpbiBvcmlnaW4gb2YgdGhlIERPTSBlbGVtZW50IGFzIGEgMi1kaW1lbnNpb25hbCBhcnJheVxuICogQHBhcmFtIHtBcnJheX0gcmVzdWx0IHN0b3JhZ2Ugb2YgdGhlIERPTSBib3VuZCB0cmFuc2Zvcm0gbWF0cml4XG4gKi9cbkRPTVJlbmRlcmVyLmNyZWF0ZURPTU1hdHJpeCA9IGZ1bmN0aW9uIGNyZWF0ZURPTU1hdHJpeCh0cmFuc2Zvcm0sIGNvbnRleHRTaXplLCBzaXplLCBvcmlnaW4sIHJlc3VsdCkge1xuICAgIHJlc3VsdCAgICAgICAgICAgICA9IHJlc3VsdCB8fCBbXTtcbiAgICAvLyBzaXplWzBdICAgICAgICAgICAvPSAwLjUgKiBjb250ZXh0U2l6ZVswXTsgLy8gVE9ETzogV2UncmUgbm90IHVzaW5nIHRoZSBcbiAgICAvLyBzaXplWzFdICAgICAgICAgICAvPSAwLjUgKiBjb250ZXh0U2l6ZVsxXTtcbiAgICBtYXRyaXhTY3JhdGNoMVswXSAgPSAxO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzFdICA9IDA7XG4gICAgbWF0cml4U2NyYXRjaDFbMl0gID0gMDtcbiAgICBtYXRyaXhTY3JhdGNoMVszXSAgPSAwO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzRdICA9IDA7XG4gICAgbWF0cml4U2NyYXRjaDFbNV0gID0gMTtcbiAgICBtYXRyaXhTY3JhdGNoMVs2XSAgPSAwO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzddICA9IDA7XG4gICAgbWF0cml4U2NyYXRjaDFbOF0gID0gMDtcbiAgICBtYXRyaXhTY3JhdGNoMVs5XSAgPSAwO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzEwXSA9IDE7XG4gICAgbWF0cml4U2NyYXRjaDFbMTFdID0gMDtcbiAgICBtYXRyaXhTY3JhdGNoMVsxMl0gPSAtc2l6ZVswXSAqIG9yaWdpblswXTtcbiAgICBtYXRyaXhTY3JhdGNoMVsxM10gPSAtc2l6ZVsxXSAqIG9yaWdpblsxXTtcbiAgICBtYXRyaXhTY3JhdGNoMVsxNF0gPSAwO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzE1XSA9IDE7XG4gICAgTWF0cml4TWF0aC5tdWx0aXBseShtYXRyaXhTY3JhdGNoMiwgbWF0cml4U2NyYXRjaDEsIHRyYW5zZm9ybSk7XG5cbiAgICByZXN1bHRbMF0gID0gKChtYXRyaXhTY3JhdGNoMlswXSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlswXSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzBdKTtcbiAgICByZXN1bHRbMV0gID0gKChtYXRyaXhTY3JhdGNoMlsxXSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlsxXSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzFdKTtcbiAgICByZXN1bHRbMl0gID0gKChtYXRyaXhTY3JhdGNoMlsyXSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlsyXSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzJdKTtcbiAgICByZXN1bHRbM10gID0gKChtYXRyaXhTY3JhdGNoMlszXSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlszXSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzNdKTtcbiAgICByZXN1bHRbNF0gID0gKChtYXRyaXhTY3JhdGNoMls0XSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMls0XSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzRdKTtcbiAgICByZXN1bHRbNV0gID0gKChtYXRyaXhTY3JhdGNoMls1XSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMls1XSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzVdKTtcbiAgICByZXN1bHRbNl0gID0gKChtYXRyaXhTY3JhdGNoMls2XSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMls2XSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzZdKTtcbiAgICByZXN1bHRbN10gID0gKChtYXRyaXhTY3JhdGNoMls3XSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMls3XSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzddKTtcbiAgICByZXN1bHRbOF0gID0gKChtYXRyaXhTY3JhdGNoMls4XSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMls4XSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzhdKTtcbiAgICByZXN1bHRbOV0gID0gKChtYXRyaXhTY3JhdGNoMls5XSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMls5XSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzldKTtcbiAgICByZXN1bHRbMTBdID0gKChtYXRyaXhTY3JhdGNoMlsxMF0gPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlsxMF0gPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzEwXSk7XG4gICAgcmVzdWx0WzExXSA9ICgobWF0cml4U2NyYXRjaDJbMTFdIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbMTFdID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMlsxMV0pO1xuICAgIHJlc3VsdFsxMl0gPSAoKG1hdHJpeFNjcmF0Y2gyWzEyXSA8IDAuMDAwMDAxICYmIG1hdHJpeFNjcmF0Y2gyWzEyXSA+IC0wLjAwMDAwMSkgPyBaRVJPIDogbWF0cml4U2NyYXRjaDJbMTJdKSArIDAuNSAqIGNvbnRleHRTaXplWzBdO1xuICAgIHJlc3VsdFsxM10gPSAoKG1hdHJpeFNjcmF0Y2gyWzEzXSA8IDAuMDAwMDAxICYmIG1hdHJpeFNjcmF0Y2gyWzEzXSA+IC0wLjAwMDAwMSkgPyBaRVJPIDogbWF0cml4U2NyYXRjaDJbMTNdKSArIDAuNSAqIGNvbnRleHRTaXplWzFdO1xuICAgIC8vIHJlc3VsdFsxMl0gPSAoTWF0aC5yb3VuZCgobWF0cml4U2NyYXRjaDJbMTJdICsgMSkgKiAwLjUgKiBjb250ZXh0U2l6ZVswXSAqIGRldmljZVBpeGVsUmF0aW8pIC8gZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgLy8gcmVzdWx0WzEzXSA9IChNYXRoLnJvdW5kKChtYXRyaXhTY3JhdGNoMlsxM10gKyAxKSAqIDAuNSAqIGNvbnRleHRTaXplWzFdICogZGV2aWNlUGl4ZWxSYXRpbykgLyBkZXZpY2VQaXhlbFJhdGlvKTtcbiAgICByZXN1bHRbMTRdID0gKChtYXRyaXhTY3JhdGNoMlsxNF0gPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlsxNF0gPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzE0XSk7XG4gICAgcmVzdWx0WzE1XSA9ICgobWF0cml4U2NyYXRjaDJbMTVdIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbMTVdID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMlsxNV0pO1xuXG4gICAgLy8gc2l6ZVswXSAqPSAwLjUgKiBjb250ZXh0U2l6ZVswXTtcbiAgICAvLyBzaXplWzFdICo9IDAuNSAqIGNvbnRleHRTaXplWzFdO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgQ1NTIHJlcHJlc2VudGF0aW9uIG9mIGEgVHJhbnNmb3JtIG1hdHJpeFxuICpcbiAqIEBtZXRob2Qgc3RyaW5naWZ5TWF0cml4XG4gKlxuICogQHBhcmFtIHtBcnJheX0gbSBUcmFuc2Zvcm0gbWF0cml4XG4gKi9cbkRPTVJlbmRlcmVyLnN0cmluZ2lmeU1hdHJpeCA9IGZ1bmN0aW9uIHN0cmluZ2lmeU1hdHJpeChtKSB7XG4gICAgcmV0dXJuIE1BVFJJWDNEICtcbiAgICAgICAgbVswXSAgKyBDT01NQSArXG4gICAgICAgIG1bMV0gICsgQ09NTUEgK1xuICAgICAgICBtWzJdICArIENPTU1BICtcbiAgICAgICAgbVszXSAgKyBDT01NQSArXG4gICAgICAgIG1bNF0gICsgQ09NTUEgK1xuICAgICAgICBtWzVdICArIENPTU1BICtcbiAgICAgICAgbVs2XSAgKyBDT01NQSArXG4gICAgICAgIG1bN10gICsgQ09NTUEgK1xuICAgICAgICBtWzhdICArIENPTU1BICtcbiAgICAgICAgbVs5XSAgKyBDT01NQSArXG4gICAgICAgIG1bMTBdICsgQ09NTUEgK1xuICAgICAgICBtWzExXSArIENPTU1BICtcbiAgICAgICAgbVsxMl0gKyBDT01NQSArXG4gICAgICAgIG1bMTNdICsgQ09NTUEgK1xuICAgICAgICBtWzE0XSArIENPTU1BICtcbiAgICAgICAgbVsxNV0gKyBDTE9TRV9QQVJFTjtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBET01SZW5kZXJlcjtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBtYXJrQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIG9iamVjdCB0byBDb250YWluZXIgdGhhdCBoYW5kbGVzIHRoZSBwcm9jZXNzIG9mXG4gKiAgIGNyZWF0aW5nIGFuZCBhbGxvY2F0aW5nIERPTSBlbGVtZW50cyB3aXRoaW4gYSBtYW5hZ2VkIGRpdi5cbiAqICAgUHJpdmF0ZS5cbiAqXG4gKiBAY2xhc3MgRWxlbWVudEFsbG9jYXRvclxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtET01FbGVtZW50fSBjb250YWluZXIgZG9jdW1lbnQgZWxlbWVudCBpbiB3aGljaCBGYW1vLnVzIGNvbnRlbnQgd2lsbCBiZSBpbnNlcnRlZFxuICovXG5mdW5jdGlvbiBFbGVtZW50QWxsb2NhdG9yKGNvbnRhaW5lcikge1xuICAgIGlmICghY29udGFpbmVyKSBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdGhpcy5jb250YWluZXIgICAgID0gY29udGFpbmVyO1xuICAgIHRoaXMuZGV0YWNoZWROb2RlcyA9IHt9O1xuICAgIHRoaXMubm9kZUNvdW50ICAgICA9IDA7XG59XG5cbi8qKlxuICogQWxsb2NhdGUgYW4gZWxlbWVudCBvZiBzcGVjaWZpZWQgdHlwZSBmcm9tIHRoZSBwb29sLlxuICpcbiAqIEBtZXRob2QgYWxsb2NhdGVcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZSB0eXBlIG9mIGVsZW1lbnQsIGUuZy4gJ2RpdidcbiAqXG4gKiBAcmV0dXJuIHtET01FbGVtZW50fSBhbGxvY2F0ZWQgZG9jdW1lbnQgZWxlbWVudFxuICovXG5FbGVtZW50QWxsb2NhdG9yLnByb3RvdHlwZS5hbGxvY2F0ZSA9IGZ1bmN0aW9uIGFsbG9jYXRlKHR5cGUpIHtcbiAgICB0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy5kZXRhY2hlZE5vZGVzKSkgdGhpcy5kZXRhY2hlZE5vZGVzW3R5cGVdID0gW107XG4gICAgdmFyIG5vZGVTdG9yZSA9IHRoaXMuZGV0YWNoZWROb2Rlc1t0eXBlXTtcbiAgICB2YXIgcmVzdWx0O1xuICAgIGlmIChub2RlU3RvcmUubGVuZ3RoID4gMCkge1xuICAgICAgICByZXN1bHQgPSBub2RlU3RvcmUucG9wKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKTtcbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQocmVzdWx0KTtcbiAgICB9XG4gICAgdGhpcy5ub2RlQ291bnQrKztcbiAgICByZXN1bHQuc3R5bGUuZGlzcGxheSA9ICcnOyAgICBcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBEZS1hbGxvY2F0ZSBhbiBlbGVtZW50IG9mIHNwZWNpZmllZCB0eXBlIHRvIHRoZSBwb29sLlxuICpcbiAqIEBtZXRob2QgZGVhbGxvY2F0ZVxuICpcbiAqIEBwYXJhbSB7RE9NRWxlbWVudH0gZWxlbWVudCBkb2N1bWVudCBlbGVtZW50IHRvIGRlYWxsb2NhdGVcbiAqL1xuRWxlbWVudEFsbG9jYXRvci5wcm90b3R5cGUuZGVhbGxvY2F0ZSA9IGZ1bmN0aW9uIGRlYWxsb2NhdGUoZWxlbWVudCkge1xuICAgIHZhciBub2RlVHlwZSA9IGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgbm9kZVN0b3JlID0gdGhpcy5kZXRhY2hlZE5vZGVzW25vZGVUeXBlXTtcbiAgICBub2RlU3RvcmUucHVzaChlbGVtZW50KTtcbiAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgZWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gJyc7XG4gICAgZWxlbWVudC5zdHlsZS53aWR0aCAgID0gJyc7XG4gICAgZWxlbWVudC5zdHlsZS5oZWlnaHQgID0gJyc7XG4gICAgdGhpcy5ub2RlQ291bnQtLTtcbn07XG5cbi8qKlxuICogR2V0IGNvdW50IG9mIHRvdGFsIGFsbG9jYXRlZCBub2RlcyBpbiB0aGUgZG9jdW1lbnQuXG4gKlxuICogQG1ldGhvZCBnZXROb2RlQ291bnRcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRvdGFsIG5vZGUgY291bnRcbiAqL1xuRWxlbWVudEFsbG9jYXRvci5wcm90b3R5cGUuZ2V0Tm9kZUNvdW50ID0gZnVuY3Rpb24gZ2V0Tm9kZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLm5vZGVDb3VudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRWxlbWVudEFsbG9jYXRvcjsiLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogYWRuYW5AZmFtby51cyxcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBtb3VzZSA9IFswLCAwXTtcbnZhciBzdGFydCA9IERhdGUubm93KCk7XG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuLi9FbnRpdHlSZWdpc3RyeScpO1xudmFyIEdlb21ldHJ5ID0gcmVxdWlyZSgnLi4vLi4vZ2wvZ2VvbWV0cnknKTtcbnZhciBTaGFkZXJNYWtlciA9IHJlcXVpcmUoJy4uLy4uL2dsL3NoYWRlcicpO1xudmFyIGxpZ2h0TGlzdCA9IEVudGl0eVJlZ2lzdHJ5LmFkZExheWVyKCdMaWdodHMnKTtcbnZhciBNYXRlcmlhbHMgPSBFbnRpdHlSZWdpc3RyeS5hZGRMYXllcignTWF0ZXJpYWxzJyk7XG52YXIgQ29udGV4dHMgPSBFbnRpdHlSZWdpc3RyeS5nZXRMYXllcignQ29udGV4dHMnKTtcblxudmFyIFdlYkdMUmVuZGVyZXIgPSB7XG4gICAgZHJhdzogZHJhdyxcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGdlb20gPSBFbnRpdHlSZWdpc3RyeS5nZXRMYXllcignR2VvbWV0cmllcycpO1xuICAgICAgICAoZ2VvbSA/IGdlb20uZW50aXRpZXMgOiBbXSkuZm9yRWFjaChmdW5jdGlvbiAoZ2VvbSkge1xuICAgICAgICAgICAgdmFyIGMgPSBnZW9tLmdldENvbnRleHQoKTtcbiAgICAgICAgICAgIGlmIChjKSB0aGlzLnNoYWRlci51bmlmb3Jtcyh7XG4gICAgICAgICAgICAgICAgcGVyc3BlY3RpdmU6IGMuZ2V0Q29tcG9uZW50KCdjYW1lcmEnKS5nZXRQcm9qZWN0aW9uVHJhbnNmb3JtKCksXG4gICAgICAgICAgICAgICAgcmVzb2x1dGlvbjogYy5fc2l6ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmRyYXcoZ2VvbS5fY29tcG9uZW50cy5nZW9tZXRyeS5yZW5kZXIoKSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcbiAgICBkZXBsb3k6IGZ1bmN0aW9uICgpIHt9LFxuICAgIHVwZGF0ZTogZnVuY3Rpb24gKCkge30sXG4gICAgc2V0T3B0aW9uczogZnVuY3Rpb24oKSB7fSxcbiAgICBERUZBVUxUX09QVElPTlM6IHt9LFxuICAgIHJlY2FsbDogZnVuY3Rpb24gKCkge30sXG4gICAgZ2V0VGFyZ2V0czogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gW0dlb21ldHJ5LnRvU3RyaW5nKCldO1xuICAgIH0sXG4gICAgaW5pdDogaW5pdFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWJHTFJlbmRlcmVyO1xuXG5mdW5jdGlvbiBkcmF3KHNwZWMpIHtcbiAgICBpZiAoISBzcGVjLnRleHR1cmUpIGRlbGV0ZSBzcGVjLnRleHR1cmU7XG4gICAgc3BlYy5tb3VzZSA9IG1vdXNlO1xuICAgIHNwZWMuY2xvY2sgPSAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMC47XG4gICAgaWYgKCEgc3BlYy5ub2lzZSkgc3BlYy5ub2lzZSA9IDA7XG4gICAgaWYgKCEgc3BlYy52aWRlbykgc3BlYy52aWRlbyA9IDA7XG4gICAgaWYgKCEgc3BlYy5idW1wKSBzcGVjLmJ1bXAgPSAwO1xuICAgIHRoaXMuc2hhZGVyLnVuaWZvcm1zKHNwZWMpLmRyYXcoc3BlYy5nZW9tZXRyeSk7XG59XG5cbmZ1bmN0aW9uIGluaXQob3B0aW9ucykge1xuICAgIHZhciBjYW52YXMgPSBvcHRpb25zLmNhbnZhcztcbiAgICB2YXIgcGFyZW50RWwgPSBvcHRpb25zLnBhcmVudEVsO1xuXG4gICAgdmFyIG9wdGlvbnMgPSB7IGFscGhhOiB0cnVlIH07XG5cbiAgICBpZiAoISBjYW52YXMpIHtcbiAgICAgICAgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNhbnZhcy5jbGFzc05hbWUgPSAnR0wnO1xuICAgICAgICBjYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB9XG5cbiAgICAocGFyZW50RWwgfHwgZG9jdW1lbnQuYm9keSkuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuICAgIHZhciBnbCA9IHRoaXMuZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnLCBvcHRpb25zKTtcblxuICAgIGlmICghIGdsKSB0aHJvdyAnV2ViR0wgbm90IHN1cHBvcnRlZCc7XG5cbiAgICB3aW5kb3cub25tb3VzZW1vdmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIG1vdXNlID0gW2UueCAvIGlubmVyV2lkdGgsIDEuIC0gZS55IC9pbm5lckhlaWdodF07XG4gICAgfTtcbiAgICBcbiAgICB0aGlzLnNoYWRlciA9IG5ldyBTaGFkZXJNYWtlcihnbCwgW10pO1xuICAgIFxuICAgIGdsLmVuYWJsZShnbC5QT0xZR09OX09GRlNFVF9GSUxMKTtcbiAgICBnbC5wb2x5Z29uT2Zmc2V0KDEsIDEpO1xuICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICBnbC52aWV3cG9ydCgwLCAwLCBnbC5jYW52YXMud2lkdGgsIGdsLmNhbnZhcy5oZWlnaHQpO1xuICAgIE1hdGVyaWFscy5vbignZW50aXR5UHVzaGVkJywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnNoYWRlciA9IG5ldyBTaGFkZXJNYWtlcihnbCwgTWF0ZXJpYWxzLm1hcChmdW5jdGlvbiAoZCkgeyByZXR1cm4gZC5nZXRDb21wb25lbnQoJ21hdGVyaWFscycpOyB9KSwgMTYpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICByZXR1cm4gZ2w7XG59XG4iLCJ2YXIgY3NzID0gXCJ2YXIgY3NzID0gXFxcIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcXFxcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcXFxcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXFxcXG4gKlxcXFxuICogT3duZXI6IG1hcmtAZmFtby51c1xcXFxuICogQGxpY2Vuc2UgTVBMIDIuMFxcXFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XFxcXG4gKi9cXFxcblxcXFxuXFxcXG5odG1sIHtcXFxcbiAgICB3aWR0aDogMTAwJTtcXFxcbiAgICBoZWlnaHQ6IDEwMCU7XFxcXG4gICAgbWFyZ2luOiAwcHg7XFxcXG4gICAgcGFkZGluZzogMHB4O1xcXFxuICAgIG92ZXJmbG93OiBoaWRkZW47XFxcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkO1xcXFxuICAgIHRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7XFxcXG59XFxcXG5cXFxcbmJvZHkge1xcXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXFxcbiAgICB3aWR0aDogMTAwJTtcXFxcbiAgICBoZWlnaHQ6IDEwMCU7XFxcXG4gICAgbWFyZ2luOiAwcHg7XFxcXG4gICAgcGFkZGluZzogMHB4O1xcXFxuICAgIC13ZWJraXQtdHJhbnNmb3JtLXN0eWxlOiBwcmVzZXJ2ZS0zZDtcXFxcbiAgICB0cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkO1xcXFxuICAgIC13ZWJraXQtZm9udC1zbW9vdGhpbmc6IGFudGlhbGlhc2VkO1xcXFxuICAgIC13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxcXG4gICAgLXdlYmtpdC1wZXJzcGVjdGl2ZTogMDtcXFxcbiAgICBwZXJzcGVjdGl2ZTogbm9uZTtcXFxcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xcXFxufVxcXFxuXFxcXG4uZmFtb3VzLWNvbnRhaW5lciwgLmZhbW91cy1ncm91cCB7XFxcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcXFxuICAgIHRvcDogMHB4O1xcXFxuICAgIGxlZnQ6IDBweDtcXFxcbiAgICBib3R0b206IDBweDtcXFxcbiAgICByaWdodDogMHB4O1xcXFxuICAgIG92ZXJmbG93OiB2aXNpYmxlO1xcXFxuICAgIC13ZWJraXQtdHJhbnNmb3JtLXN0eWxlOiBwcmVzZXJ2ZS0zZDtcXFxcbiAgICB0cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkO1xcXFxuICAgIC13ZWJraXQtYmFja2ZhY2UtdmlzaWJpbGl0eTogdmlzaWJsZTtcXFxcbiAgICBiYWNrZmFjZS12aXNpYmlsaXR5OiB2aXNpYmxlO1xcXFxuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xcXFxufVxcXFxuXFxcXG4uZmFtb3VzLWdyb3VwIHtcXFxcbiAgICB3aWR0aDogMHB4O1xcXFxuICAgIGhlaWdodDogMHB4O1xcXFxuICAgIG1hcmdpbjogMHB4O1xcXFxuICAgIHBhZGRpbmc6IDBweDtcXFxcbiAgICAtd2Via2l0LXRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7XFxcXG4gICAgdHJhbnNmb3JtLXN0eWxlOiBwcmVzZXJ2ZS0zZDtcXFxcbn1cXFxcblxcXFxuLmZhLXN1cmZhY2Uge1xcXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXFxcbiAgICAtd2Via2l0LXRyYW5zZm9ybS1vcmlnaW46IDAlIDAlO1xcXFxuICAgIHRyYW5zZm9ybS1vcmlnaW46IDAlIDAlO1xcXFxuICAgIC13ZWJraXQtYmFja2ZhY2UtdmlzaWJpbGl0eTogdmlzaWJsZTtcXFxcbiAgICBiYWNrZmFjZS12aXNpYmlsaXR5OiB2aXNpYmxlO1xcXFxuICAgIC13ZWJraXQtdHJhbnNmb3JtLXN0eWxlOiBmbGF0O1xcXFxuICAgIHRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7IC8qIHBlcmZvcm1hbmNlICovXFxcXG4vKiAgICAtd2Via2l0LWJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxcXG4gICAgLW1vei1ib3gtc2l6aW5nOiBib3JkZXItYm94OyovXFxcXG4gICAgLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yOiB0cmFuc3BhcmVudDtcXFxcbiAgICBwb2ludGVyLWV2ZW50czogYXV0bztcXFxcblxcXFxufVxcXFxuXFxcXG4uZmFtb3VzLWNvbnRhaW5lci1ncm91cCB7XFxcXG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xcXFxuICAgIHdpZHRoOiAxMDAlO1xcXFxuICAgIGhlaWdodDogMTAwJTtcXFxcbn1cXFxcblxcXFxuLmZhLWNvbnRhaW5lciB7XFxcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcXFxuICAgIC13ZWJraXQtdHJhbnNmb3JtLW9yaWdpbjogY2VudGVyIGNlbnRlcjtcXFxcbiAgICB0cmFuc2Zvcm0tb3JpZ2luOiBjZW50ZXIgY2VudGVyO1xcXFxuICAgIG92ZXJmbG93OiBoaWRkZW47XFxcXG59XFxcXG5cXFxcbmNhbnZhcy5HTCB7XFxcXG4gICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XFxcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcXFxuICAgIG9wYWNpdHk6IC43O1xcXFxuICAgIHotaW5kZXg6IDk5OTk7XFxcXG4gICAgdG9wOiAwcHg7XFxcXG4gICAgbGVmdDogMHB4O1xcXFxufVxcXFxuXFxcIjsgKHJlcXVpcmUoXFxcIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9ub2RlX21vZHVsZXMvY3NzaWZ5XFxcIikpKGNzcyk7IG1vZHVsZS5leHBvcnRzID0gY3NzO1wiOyAocmVxdWlyZShcIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9ub2RlX21vZHVsZXMvY3NzaWZ5XCIpKShjc3MpOyBtb2R1bGUuZXhwb3J0cyA9IGNzczsiLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFbnRpdHlSZWdpc3RyeSA9IHJlcXVpcmUoJy4uL0VudGl0eVJlZ2lzdHJ5Jyk7XG52YXIgcmVuZGVyTm9kZXMgICAgPSBFbnRpdHlSZWdpc3RyeS5nZXRMYXllcignZXZlcnl0aGluZycpO1xuXG4vKipcbiAqIEEgc3lzdGVtIHRoYXQgd2lsbCBydW4gb3ZlciBjdXN0b20gY29tcG9uZW50cyB0aGF0IGhhdmUgYW5cbiAqICAgdXBkYXRlIGZ1bmN0aW9uLlxuICpcbiAqIEBjbGFzcyBCZWhhdmlvclN5c3RlbVxuICogQHN5c3RlbVxuICogQHNpbmdsZXRvblxuICovXG52YXIgQmVoYXZpb3JTeXN0ZW0gPSB7fTtcblxuLyoqXG4gKiBVcGRhdGUgd2lsbCBpdGVyYXRlIG92ZXIgYWxsIG9mIHRoZSBlbnRpdGllcyBhbmQgY2FsbFxuICogICBlYWNoIG9mIHRoZWlyIHVwZGF0ZSBmdW5jdGlvbnMuXG4gKlxuICogQG1ldGhvZCB1cGRhdGVcbiAqL1xuQmVoYXZpb3JTeXN0ZW0udXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgIHZhciBpID0gcmVuZGVyTm9kZXMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgaWYgKHJlbmRlck5vZGVzLmVudGl0aWVzW2ldLnVwZGF0ZSlcbiAgICAgICAgICAgIHJlbmRlck5vZGVzLmVudGl0aWVzW2ldLnVwZGF0ZSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCZWhhdmlvclN5c3RlbTtcblxuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuLi9FbnRpdHlSZWdpc3RyeScpO1xudmFyIHJvb3RzICAgICAgICAgID0gRW50aXR5UmVnaXN0cnkuYWRkTGF5ZXIoJ0NvbnRleHRzJyk7XG5cbi8qKlxuICogQ29yZVN5c3RlbSBpcyByZXNwb25zaWJsZSBmb3IgdHJhdmVyc2luZyB0aGUgc2NlbmUgZ3JhcGggYW5kXG4gKiAgIHVwZGF0aW5nIHRoZSBUcmFuc2Zvcm1zIG9mIHRoZSBlbnRpdGllcy5cbiAqXG4gKiBAY2xhc3MgIENvcmVTeXN0ZW1cbiAqIEBzeXN0ZW1cbiAqIEBzaW5nbGV0b25cbiAqL1xudmFyIENvcmVTeXN0ZW0gPSB7fTtcblxuLyoqXG4gKiB1cGRhdGUgaXRlcmF0ZXMgb3ZlciBlYWNoIG9mIHRoZSBDb250ZXh0cyB0aGF0IHdlcmUgcmVnaXN0ZXJlZCBhbmRcbiAqICAga2lja3Mgb2YgdGhlIHJlY3Vyc2l2ZSB1cGRhdGluZyBvZiB0aGVpciBlbnRpdGllcy5cbiAqXG4gKiBAbWV0aG9kIHVwZGF0ZVxuICovXG5Db3JlU3lzdGVtLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICByb290cy5mb3JFYWNoKGNvcmVVcGRhdGVBbmRGZWVkKTtcbn07XG5cbi8qKlxuICogY29yZVVwZGF0ZUFuZEZlZWQgZmVlZHMgcGFyZW50IGluZm9ybWF0aW9uIHRvIGFuIGVudGl0eSBhbmQgc28gdGhhdFxuICogICBlYWNoIGVudGl0eSBjYW4gdXBkYXRlIHRoZWlyIHRyYW5zZm9ybS4gIEl0IHdpbGwgdGhlbiBwYXNzIGRvd25cbiAqICAgaW52YWxpZGF0aW9uIHN0YXRlcyBhbmQgdmFsdWVzIHRvIGFueSBjaGlsZHJlbi5cbiAqXG4gKiBAbWV0aG9kIGNvcmVVcGRhdGVBbmRGZWVkXG4gKiBAcHJpdmF0ZVxuICogICBcbiAqIEBwYXJhbSAge0VudGl0eX0gIGVudGl0eSAgICAgICAgICAgRW50aXR5IGluIHRoZSBzY2VuZSBncmFwaFxuICogQHBhcmFtICB7TnVtYmVyfSAgdHJhbnNmb3JtUmVwb3J0ICBiaXRTY2hlbWUgcmVwb3J0IG9mIHRyYW5zZm9ybSBpbnZhbGlkYXRpb25zXG4gKiBAcGFyYW0gIHtBcnJheX0gICBpbmNvbWluZ01hdHJpeCAgIHBhcmVudCB0cmFuc2Zvcm0gYXMgYSBGbG9hdDMyIEFycmF5XG4gKi9cbmZ1bmN0aW9uIGNvcmVVcGRhdGVBbmRGZWVkKGVudGl0eSwgdHJhbnNmb3JtUmVwb3J0LCBpbmNvbWluZ01hdHJpeCkge1xuICAgIHZhciB0cmFuc2Zvcm0gPSBlbnRpdHkuZ2V0Q29tcG9uZW50KCd0cmFuc2Zvcm0nKTtcbiAgICB2YXIgaSAgICAgICAgID0gZW50aXR5Ll9jaGlsZHJlbi5sZW5ndGg7XG5cbiAgICAvLyBVcGRhdGUgdGhlIFRyYW5zZm9ybSBiYXNlZCBvbiBwYXJlbnQgaW52YWxpZGF0aW9uc1xuICAgIHRyYW5zZm9ybVJlcG9ydCA9IHRyYW5zZm9ybS5fdXBkYXRlKHRyYW5zZm9ybVJlcG9ydCwgaW5jb21pbmdNYXRyaXgpO1xuXG4gICAgd2hpbGUgKGktLSkgY29yZVVwZGF0ZUFuZEZlZWQoZW50aXR5Ll9jaGlsZHJlbltpXSwgdHJhbnNmb3JtUmVwb3J0LCB0cmFuc2Zvcm0uX21hdHJpeCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29yZVN5c3RlbTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEVudGl0eVJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi4vRW50aXR5UmVnaXN0cnknKSxcbiAgICBNYXRyaXhNYXRoICAgICA9IHJlcXVpcmUoJy4uLy4uL21hdGgvNHg0bWF0cml4JyksXG4gICAgT3B0aW9uc01hbmFnZXIgPSByZXF1aXJlKCcuLi9PcHRpb25zTWFuYWdlcicpO1xuXG52YXIgcmVuZGVyZXJzICAgICAgICAgID0ge30sXG4gICAgdGFyZ2V0c1RvUmVuZGVyZXJzID0ge307XG5cbnZhciBjb250YWluZXJzICA9IEVudGl0eVJlZ2lzdHJ5LmFkZExheWVyKCdIYXNDb250YWluZXInKSxcbiAgICByZW5kZXJhYmxlcyA9IEVudGl0eVJlZ2lzdHJ5LmFkZExheWVyKCdSZW5kZXJhYmxlcycpO1xuXG52YXIgdG9EZXBsb3kgPSBbXTtcblxuY29udGFpbmVycy5vbignZW50aXR5UHVzaGVkJywgZGVwbG95Q29udGFpbmVyKTtcbmNvbnRhaW5lcnMub24oJ2VudGl0eVJlbW92ZWQnLCByZWNhbGxDb250YWluZXIpO1xuXG52YXIgY29udGFpbmVyVG9UYXJnZXRzID0ge307XG5cbmZ1bmN0aW9uIGRlcGxveUNvbnRhaW5lcihlbnRpdHkpIHtcbiAgICBpZiAoZW50aXR5LmdldENvbnRleHQoKSkgcmVuZGVyZXJzLkRPTS5kZXBsb3lDb250YWluZXIoZW50aXR5KTtcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgdG9EZXBsb3kucHVzaChlbnRpdHkpOyAvLyBUT0RPIFRoaXMgaXMgdGVtcG9yYXJ5IGFuZCBpdCBzdWNrc1xufVxuXG5mdW5jdGlvbiByZWNhbGxDb250YWluZXIoZW50aXR5KSB7XG4gICAgcmVuZGVyZXJzLkRPTS5yZWNhbGxDb250YWluZXIoZW50aXR5KTtcbn1cblxuZnVuY3Rpb24gX3JlbGV2ZW50VG9SZW5kZXJlcihyZW5kZXJlciwgZW50aXR5KSB7XG4gICAgdmFyIHRhcmdldHMgPSByZW5kZXJlci5nZXRUYXJnZXRzKCk7XG4gICAgdmFyIGogICAgICAgPSB0YXJnZXRzLmxlbmd0aDtcbiAgICB3aGlsZSAoai0tKSBpZiAoZW50aXR5Lmhhc0NvbXBvbmVudCh0YXJnZXRzW2pdKSkgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfcmVsZXZlbnRUb0FueVJlbmRlcmVyKGVudGl0eSkge1xuICAgIHZhciByZW5kZXJlck5hbWVzID0gT2JqZWN0LmtleXMocmVuZGVyZXJzKSxcbiAgICAgICAgaSAgICAgICAgICAgICA9IHJlbmRlcmVyTmFtZXMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGktLSkgaWYgKF9yZWxldmVudFRvUmVuZGVyZXIocmVuZGVyZXJzW3JlbmRlcmVyTmFtZXNbaV1dLCBlbnRpdHkpKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbnZhciB2ZXJ0ZXhTY3JhdGNoID0gbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMF0pLFxuICAgIG1hdHJpeFNjcmF0Y2ggPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSk7XG5cbi8vIFZlcnRleCBjdWxsaW5nIGxvZ2ljXG5mdW5jdGlvbiBfaXNXaXRoaW4odGFyZ2V0LCBlbnRpdHksIGNvbnRhaW5lcikge1xuICAgIC8vIHZhciB2ZXJ0aWNpZXMgICA9IHRhcmdldC5nZXRWZXJ0aWNpZXMoKSxcbiAgICAvLyAgICAgaSAgICAgICAgICAgPSB2ZXJ0aWNpZXMubGVuZ3RoLFxuICAgIC8vICAgICB2ICAgICAgICAgICA9IG51bGwsXG4gICAgLy8gICAgIG9yaWdpbiAgICAgID0gdm9pZCAwLFxuICAgIC8vICAgICBpc0luc2lkZSAgICA9IGZhbHNlLFxuICAgIC8vICAgICBkaXNwbGF5U2l6ZSA9IGNvbnRhaW5lci5nZXRDb21wb25lbnQoJ3NpemUnKS5nZXRHbG9iYWxTaXplKCksXG4gICAgLy8gICAgIHggICAgICAgICAgID0gMCxcbiAgICAvLyAgICAgeSAgICAgICAgICAgPSAwLFxuICAgIC8vICAgICBzaXplICAgICAgICA9IGVudGl0eS5nZXRDb21wb25lbnQoJ3NpemUnKS5nZXRHbG9iYWxTaXplKCksXG4gICAgLy8gICAgIGZ0ICAgICAgICAgID0gTWF0cml4TWF0aC5tdWx0aXBseShtYXRyaXhTY3JhdGNoLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmdldENvbXBvbmVudCgnY29udGFpbmVyJykuZ2V0RGlzcGxheU1hdHJpeCgpLCBcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudGl0eS5nZXRDb21wb25lbnQoJ3RyYW5zZm9ybScpLmdldEdsb2JhbE1hdHJpeCgpKTtcblxuICAgIC8vIHdoaWxlICghaXNJbnNpZGUgJiYgaS0tKSB7XG4gICAgLy8gICAgIHYgPSB2ZXJ0aWNpZXNbaV07XG4gICAgLy8gICAgIGlmICh0YXJnZXQuZ2V0T3JpZ2luKSB7XG4gICAgLy8gICAgICAgICBvcmlnaW4gID0gdGFyZ2V0LmdldE9yaWdpbigpO1xuICAgIC8vICAgICAgICAgdlswXSAgIC09IHNpemVbMF0gKiBvcmlnaW5bMF07XG4gICAgLy8gICAgICAgICB2WzFdICAgLT0gc2l6ZVsxXSAqIG9yaWdpblsxXTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICBNYXRyaXhNYXRoLmFwcGx5VG9WZWN0b3IodmVydGV4U2NyYXRjaCwgZnQsIHYpO1xuICAgIC8vICAgICBpZiAob3JpZ2luKSB7XG4gICAgLy8gICAgICAgICB2WzBdICs9IHNpemVbMF0gKiBvcmlnaW5bMF07XG4gICAgLy8gICAgICAgICB2WzFdICs9IHNpemVbMV0gKiBvcmlnaW5bMV07XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgeCA9IHZlcnRleFNjcmF0Y2hbMF0gLyB2ZXJ0ZXhTY3JhdGNoWzNdO1xuICAgIC8vICAgICB5ID0gdmVydGV4U2NyYXRjaFsxXSAvIHZlcnRleFNjcmF0Y2hbM107XG4gICAgLy8gICAgIGlzSW5zaWRlID0geCA8PSAoIGRpc3BsYXlTaXplWzBdIC8gMikgJiZcbiAgICAvLyAgICAgICAgICAgICAgICB5IDw9ICggZGlzcGxheVNpemVbMV0gLyAyKSAmJlxuICAgIC8vICAgICAgICAgICAgICAgIHggPj0gKC1kaXNwbGF5U2l6ZVswXSAvIDIpICYmXG4gICAgLy8gICAgICAgICAgICAgICAgeSA+PSAoLWRpc3BsYXlTaXplWzFdIC8gMik7XG4gICAgLy8gfSBcbiAgICAvLyByZXR1cm4gaXNJbnNpZGU7XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUmVuZGVyU3lzdGVtIGlzIHJlc3BvbnNpYmxlIGZvciBrZWVwaW5nIHRyYWNrIG9mIHRoZSB2YXJpb3VzIHJlbmRlcmVyc1xuICogIGFuZCBmZWVkaW5nIHRoZW0gXG4gKlxuICpcbiAqIEBjbGFzcyBSZW5kZXJTeXN0ZW1cbiAqIEBzeXN0ZW1cbiAqL1xudmFyIFJlbmRlclN5c3RlbSA9IHt9O1xuXG5SZW5kZXJTeXN0ZW0udXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgIHZhciB0YXJnZXRzICAgICAgICAgICAgID0gT2JqZWN0LmtleXModGFyZ2V0c1RvUmVuZGVyZXJzKSxcbiAgICAgICAgcmVuZGVyZXJOYW1lcyAgICAgICA9IE9iamVjdC5rZXlzKHJlbmRlcmVycyksXG4gICAgICAgIHRhcmdldCAgICAgICAgICAgICAgPSBudWxsLFxuICAgICAgICBlbnRpdHkgICAgICAgICAgICAgID0gbnVsbCxcbiAgICAgICAgY29udGFpbmVyICAgICAgICAgICA9IG51bGwsXG4gICAgICAgIHRhcmdldE5hbWUgICAgICAgICAgPSB2b2lkIDAsXG4gICAgICAgIGNvbnRhaW5lckVudHMgICAgICAgPSBjb250YWluZXJzLmVudGl0aWVzLFxuICAgICAgICBlbnRpdGllcyAgICAgICAgICAgID0gcmVuZGVyYWJsZXMuZW50aXRpZXMsXG4gICAgICAgIGkgICAgICAgICAgICAgICAgICAgPSBlbnRpdGllcy5sZW5ndGgsXG4gICAgICAgIHRhcmdldHNMZW5ndGggICAgICAgPSB0YXJnZXRzLmxlbmd0aCxcbiAgICAgICAgY29udGFpbmVyRW50TGVuZ3RocyA9IGNvbnRhaW5lckVudHMubGVuZ3RoLFxuICAgICAgICByZW5kZXJlcnNMZW5ndGggICAgID0gMCxcbiAgICAgICAgaiAgICAgICAgICAgICAgICAgICA9IHRvRGVwbG95Lmxlbmd0aCxcbiAgICAgICAgayAgICAgICAgICAgICAgICAgICA9IDAsXG4gICAgICAgIGwgICAgICAgICAgICAgICAgICAgPSAwO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBDb250YWluZXIgaWYgaXRzIHRyYW5zZm9ybSBvciBzaXplIGFyZSBkaXJ0eS5cbiAgICBjb250YWluZXJzLmZvckVhY2goZnVuY3Rpb24oZW50aXR5KSB7XG4gICAgICAgIGNvbnRhaW5lciA9IGVudGl0eS5nZXRDb21wb25lbnQoJ2NvbnRhaW5lcicpO1xuICAgICAgICBpZiAoZW50aXR5LmdldENvbnRleHQoKSAmJiAoY29udGFpbmVyLl90cmFuc2Zvcm1EaXJ0eSB8fCBjb250YWluZXIuX3NpemVEaXJ0eSkpIHJlbmRlcmVycy5ET00udXBkYXRlQ29udGFpbmVyKGVudGl0eSk7XG4gICAgfSk7XG5cbiAgICB3aGlsZSAoai0tKSBkZXBsb3lDb250YWluZXIodG9EZXBsb3kucG9wKCkpO1xuXG4gICAgLy8gRm9yIGFsbCBvZiB0aGUgcmVuZGVyYWJsZXNcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGogICAgICA9IHRhcmdldHNMZW5ndGg7XG4gICAgICAgIGVudGl0eSA9IGVudGl0aWVzW2ldO1xuICAgICAgICBpZiAoIWVudGl0eS5nZXRDb250ZXh0KCkpIGNvbnRpbnVlO1xuXG4gICAgICAgIC8vIEZvciBlYWNoIHJlbmRlcmVyXG4gICAgICAgIHdoaWxlIChqLS0pIHtcbiAgICAgICAgICAgIHRhcmdldCA9IGVudGl0eS5nZXRDb21wb25lbnQodGFyZ2V0c1tqXSk7XG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgY29udGludWU7IC8vIHNraXAgaWYgdGhpcyBSZW5kZXJhYmxlIGRvZXMgbm90IGNvbnRhaW5lciB0aGUgcHJvcGVyIHRhcmdldCBjb21wb25lbnQgZm9yIHRoaXMgcmVuZGVyZXJcblxuICAgICAgICAgICAgayA9IGNvbnRhaW5lckVudExlbmd0aHM7XG5cbiAgICAgICAgICAgIGlmIChrKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0TmFtZSAgICAgID0gdGFyZ2V0LmNvbnN0cnVjdG9yLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgcmVuZGVyZXJzTGVuZ3RoID0gdGFyZ2V0c1RvUmVuZGVyZXJzW3RhcmdldE5hbWVdLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIC8vIEZvciBlYWNoIGNvbnRhaW5lclxuICAgICAgICAgICAgICAgIHdoaWxlIChrLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgbCAgICAgICAgICA9IHJlbmRlcmVyc0xlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyICA9IGNvbnRhaW5lckVudHNba107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHRhcmdldCBpcyBpbiB0aGUgQ29udGFpbmVyXG4gICAgICAgICAgICAgICAgICAgIGlmIChfaXNXaXRoaW4odGFyZ2V0LCBlbnRpdHksIGNvbnRhaW5lcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlY2lkZSBpZiB0byBkZXBsb3kgIGFuZCB1cGRhdGUgb3IganVzdCB1cGRhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuX2lzV2l0aGluKGNvbnRhaW5lcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAobC0tKSB0YXJnZXRzVG9SZW5kZXJlcnNbdGFyZ2V0TmFtZV1bbF0udXBkYXRlKGVudGl0eSwgY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGwtLSkgdGFyZ2V0c1RvUmVuZGVyZXJzW3RhcmdldE5hbWVdW2xdLmRlcGxveShlbnRpdHksIGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Ll9hZGRUb0NvbnRhaW5lcihjb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldC5faXNXaXRoaW4oY29udGFpbmVyKSkgeyAvLyBJZiB0aGUgdGFyZ2V0IGlzIGN1bGxlZCByZWNhbGwgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChsLS0pIHRhcmdldHNUb1JlbmRlcmVyc1t0YXJnZXROYW1lXVtsXS5yZWNhbGwoZW50aXR5LCBjb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Ll9yZW1vdmVGcm9tQ29udGFpbmVyKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJlc2V0IHRoZSBpbnZhbGlkYXRpb25zIGFmdGVyIGFsbCBvZiB0aGUgbG9naWMgZm9yIFxuICAgICAgICAgICAgLy8gYSBwYXJ0aWN1bGFyIHRhcmdldCBcbiAgICAgICAgICAgIGlmICh0YXJnZXQucmVzZXRJbnZhbGlkYXRpb25zKSB0YXJnZXQucmVzZXRJbnZhbGlkYXRpb25zKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBIYXZlIGVhY2ggcmVuZGVyZXIgcnVuXG4gICAgaSA9IHJlbmRlcmVyTmFtZXMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHJlbmRlcmVyc1tyZW5kZXJlck5hbWVzW2ldXS5yZW5kZXIoKTtcbn07XG5cbi8qKlxuICogQWRkIGEgbmV3IHJlbmRlcmVyIHdoaWNoIHdpbGwgYmUgY2FsbGVkIGV2ZXJ5IGZyYW1lLlxuICpcbiAqIEBtZXRob2QgcmVnaXN0ZXJcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSByZW5kZXJlclxuICogQHBhcmFtIHtPYmplY3R9IHJlbmRlcmVyIHNpbmdsZXRvbiByZW5kZXJlciBvYmplY3RcbiAqL1xuUmVuZGVyU3lzdGVtLnJlZ2lzdGVyID0gZnVuY3Rpb24gcmVnaXN0ZXIobmFtZSwgcmVuZGVyZXIpIHtcbiAgICBpZiAocmVuZGVyZXJzW25hbWVdICE9IG51bGwpIHJldHVybiBmYWxzZTtcblxuICAgIHJlbmRlcmVyc1tuYW1lXSA9IHJlbmRlcmVyO1xuXG4gICAgdmFyIHRhcmdldHMgPSByZW5kZXJlci5nZXRUYXJnZXRzKCksXG4gICAgICAgIGkgICAgICAgPSB0YXJnZXRzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgaWYgKHRhcmdldHNUb1JlbmRlcmVyc1t0YXJnZXRzW2ldXSA9PSBudWxsKSB0YXJnZXRzVG9SZW5kZXJlcnNbdGFyZ2V0c1tpXV0gPSBbXTtcbiAgICAgICAgdGFyZ2V0c1RvUmVuZGVyZXJzW3RhcmdldHNbaV1dLnB1c2gocmVuZGVyZXIpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJTeXN0ZW07XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4gJ3VzZSBzdHJpY3QnO1xuXG52YXIgcHJldmlvdXNUaW1lICAgICAgID0gMCwgXG4gICAgZGVsdGEgICAgICAgICAgICAgID0gMCxcbiAgICBpbml0aWFsaXphdGlvblRpbWUgPSBEYXRlLm5vdygpLFxuICAgIGN1cnJlbnRUaW1lICAgICAgICA9IGluaXRpYWxpemF0aW9uVGltZSxcbiAgICByZWxhdGl2ZVRpbWUgICAgICAgPSBpbml0aWFsaXphdGlvblRpbWUsXG4gICAgYWJzb2x1dGVUaW1lICAgICAgID0gaW5pdGlhbGl6YXRpb25UaW1lLFxuICAgIHByZXZpb3VzUmVsRnJhbWUgICA9IDA7XG5cbi8qKlxuICogVGltZVN5c3RlbSBpcyByZXNwb25zaWJsZSBmb3IgZGV0ZXJtaW5pbmcgdGhlIGN1cnJlbnQgbW9tZW50LlxuICpcbiAqIEBjbGFzcyBUaW1lU3lzdGVtXG4gKiBAc3lzdGVtXG4gKi9cbnZhciBUaW1lU3lzdGVtID0ge307XG5cbi8qKlxuICogVXBkYXRlIHRoZSB0aW1lIGJhc2VkIG9uIHRoZSBmcmFtZSBkYXRhIGZyb20gdGhlIEVuZ2luZS5cbiAqXG4gKiBAbWV0aG9kIHVwZGF0ZVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSByZWxGcmFtZSBcbiAqL1xuVGltZVN5c3RlbS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUocmVsRnJhbWUpIHtcbiAgICBwcmV2aW91c1RpbWUgICAgID0gY3VycmVudFRpbWU7XG4gICAgY3VycmVudFRpbWUgICAgICA9IERhdGUubm93KCk7XG4gICAgZGVsdGEgICAgICAgICAgICA9IGN1cnJlbnRUaW1lIC0gcHJldmlvdXNUaW1lO1xuICAgIHJlbGF0aXZlVGltZSAgICArPSBkZWx0YSAqIChyZWxGcmFtZSAtIHByZXZpb3VzUmVsRnJhbWUpO1xuICAgIGFic29sdXRlVGltZSAgICArPSBkZWx0YTtcbiAgICBwcmV2aW91c1JlbEZyYW1lID0gcmVsRnJhbWU7XG59O1xuXG4vKipcbiAqIEdldCByZWxhdGl2ZSB0aW1lIGluIG1zIG9mZmZzZXQgYnkgdGhlIHNwZWVkIGF0IHdoaWNoIHRoZSBFbmdpbmUgaXMgcnVubmluZy5cbiAqXG4gKiBAbWV0aG9kIGdldFJlbGF0aXZlVGltZVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIHRpbWUgYWNjb3VudGluZyBmb3IgRW5naW5lJ3MgcnVuIHNwZWVkXG4gKi9cblRpbWVTeXN0ZW0uZ2V0UmVsYXRpdmVUaW1lID0gZnVuY3Rpb24gZ2V0UmVsYXRpdmVUaW1lKCkge1xuICAgIHJldHVybiByZWxhdGl2ZVRpbWU7XG59O1xuXG4vKipcbiAqIEdldCBhYnNvbHV0ZSB0aW1lLlxuICpcbiAqIEBtZXRob2QgZ2V0QWJzb2x1dGVUaW1lXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0aGUgdGltZSBpbiBtc1xuICovXG5UaW1lU3lzdGVtLmdldEFic29sdXRlVGltZSA9IGZ1bmN0aW9uIGdldEFic29sdXRlVGltZSgpIHtcbiAgICByZXR1cm4gYWJzb2x1dGVUaW1lO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHRpbWUgaW4gd2hpY2ggdGhlIEVuZ2luZSB3YXMgaW5zdGFudGlhdGVkLlxuICpcbiAqIEBtZXRob2QgZ2V0SW5pdGlhbFRpbWVcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSB0aW1lIGluIG1zXG4gKi9cblRpbWVTeXN0ZW0uZ2V0SW5pdGlhbFRpbWUgPSBmdW5jdGlvbiBnZXRJbml0aWFsVGltZSgpIHtcbiAgICByZXR1cm4gaW5pdGlhbGl6YXRpb25UaW1lO1xufTtcblxuLyoqXG4gKiBHZXQgZWxhcHNlZCB0aW1lIHNpbmNlIGluc3RhbnRpYXRpb24gYWNjb3VudGluZyBmb3IgRW5naW5lIHNwZWVkXG4gKlxuICogQG1ldGhvZCBnZXRFbGFwc2VkUmVsYXRpdmVUaW1lXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0aGUgdGltZSBpbiBtc1xuICovXG5UaW1lU3lzdGVtLmdldEVsYXBzZWRSZWxhdGl2ZVRpbWUgPSBmdW5jdGlvbiBnZXRFbGFwc2VkUmVsYXRpdmVUaW1lKCkge1xuICAgIHJldHVybiByZWxhdGl2ZVRpbWUgLSBpbml0aWFsaXphdGlvblRpbWU7XG59O1xuXG4vKipcbiAqIEdldCBhYnNvbHV0ZSBlbGFwc2VkIHRpbWUgc2luY2UgaW5zdGFudGlhdGlvblxuICpcbiAqIEBtZXRob2QgZ2V0RWxhcHNlZEFic29sdXRlVGltZVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIHRpbWUgaW4gbXNcbiAqL1xuVGltZVN5c3RlbS5nZXRFbGFwc2VkQWJzb2x1dGVUaW1lID0gZnVuY3Rpb24gZ2V0RWxhcHNlZEFic29sdXRlVGltZSgpIHtcbiAgICByZXR1cm4gYWJzb2x1dGVUaW1lIC0gaW5pdGlhbGl6YXRpb25UaW1lO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHRpbWUgYmV0d2VlbiB0aGlzIGZyYW1lIGFuZCBsYXN0LlxuICpcbiAqIEBtZXRob2QgZ2V0RGVsdGFcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSB0aW1lIGluIG1zXG4gKi9cblRpbWVTeXN0ZW0uZ2V0RGVsdGEgPSBmdW5jdGlvbiBnZXREZWx0YSgpIHtcbiAgICByZXR1cm4gZGVsdGE7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWVTeXN0ZW07XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBNYXRyaXhNYXRoID0gcmVxdWlyZSgnLi4vLi4vbWF0aC80eDRtYXRyaXgnKTtcblxuLyoqXG4gKiBUYXJnZXQgaXMgdGhlIGJhc2UgY2xhc3MgZm9yIGFsbCByZW5kZXJhYmxlcy4gIEl0IGhvbGRzIHRoZSBzdGF0ZSBvZlxuICogICBpdHMgdmVydGljaWVzLCB0aGUgQ29udGFpbmVycyBpdCBpcyBkZXBsb3llZCBpbiwgdGhlIENvbnRleHQgaXQgYmVsb25nc1xuICogICB0bywgYW5kIHdoZXRoZXIgb3Igbm90IG9yaWdpbiBhbGlnbm1lbnQgbmVlZHMgdG8gYmUgYXBwbGllZC5cbiAqXG4gKiBAY29tcG9uZW50IFRhcmdldFxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtFbnRpdHl9IGVudGl0eSAgRW50aXR5IHRoYXQgdGhlIFRhcmdldCBpcyBhIGNvbXBvbmVudCBvZlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgb3B0aW9uc1xuICovXG5mdW5jdGlvbiBUYXJnZXQoZW50aXR5LCBvcHRpb25zKSB7XG4gICAgdGhpcy52ZXJ0aWNpZXMgID0gb3B0aW9ucy52ZXJ0aWNpZXMgfHwgW107XG4gICAgdGhpcy5jb250YWluZXJzID0ge307XG4gICAgLy8gdGhpcy5jb250ZXh0ICAgID0gZW50aXR5LmdldENvbnRleHQoKS5faWQ7XG4gICAgdGhpcy5faGFzT3JpZ2luID0gZmFsc2U7XG59XG5cbi8qKlxuICogR2V0IHRoZSB2ZXJ0aWNpZXMgb2YgdGhlIFRhcmdldC5cbiAqXG4gKiBAbWV0aG9kIGdldFZlcnRpY2llc1xuICpcbiAqIEByZXR1cm4ge0FycmF5fSBhcnJheSBvZiB0aGUgdmVydGljaWVzIHJlcHJlc2VudGVkIGFzIHRocmVlIGVsZW1lbnQgYXJyYXlzIFt4LCB5LCB6XVxuICovXG5UYXJnZXQucHJvdG90eXBlLmdldFZlcnRpY2llcyA9IGZ1bmN0aW9uIGdldFZlcnRpY2llcygpe1xuICAgIHJldHVybiB0aGlzLnZlcnRpY2llcztcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgVGFyZ2V0IHdhcyBkZXBsb3llZCB0byBhIHBhcnRpY3VsYXIgY29udGFpbmVyXG4gKlxuICogQG1ldGhvZCBfaXNXaXRoaW5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGhlIGlkIG9mIHRoZSBDb250YWluZXIncyBFbnRpdHlcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgb3Igbm93IHRoZSBUYXJnZXQgd2FzIGRlcGxveWVkIHRvIHRoaXMgcGFydGljdWxhciBDb250YWluZXJcbiAqL1xuVGFyZ2V0LnByb3RvdHlwZS5faXNXaXRoaW4gPSBmdW5jdGlvbiBfaXNXaXRoaW4oY29udGFpbmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuY29udGFpbmVyc1tjb250YWluZXIuX2lkXTtcbn07XG5cbi8qKlxuICogTWFyayBhIENvbnRhaW5lciBhcyBoYXZpbmcgYSBkZXBsb3llZCBpbnN0YW5jZSBvZiB0aGUgVGFyZ2V0XG4gKlxuICogQG1ldGhvZCBfYWRkVG9Db250YWluZXJcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGhlIGlkIG9mIHRoZSBDb250YWluZXIncyBFbnRpdHlcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHN0YXVzIG9mIHRoZSBhZGRpdGlvblxuICovXG5UYXJnZXQucHJvdG90eXBlLl9hZGRUb0NvbnRhaW5lciA9IGZ1bmN0aW9uIF9hZGRUb0NvbnRhaW5lcihjb250YWluZXIpIHtcbiAgICB0aGlzLmNvbnRhaW5lcnNbY29udGFpbmVyLl9pZF0gPSB0cnVlO1xuICAgIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBVbm1hcmsgYSBDb250YWluZXIgYXMgaGF2aW5nIGEgZGVwbG95ZWQgaW5zdGFuY2Ugb2YgdGhlIFRhcmdldFxuICpcbiAqIEBtZXRob2QgX3JlbW92ZUZyb21Db250YWluZXJcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGhlIGlkIG9mIHRoZSBDb250YWluZXIncyBFbnRpdHlcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHN0YXVzIG9mIHRoZSByZW1vdmFsXG4gKi9cblRhcmdldC5wcm90b3R5cGUuX3JlbW92ZUZyb21Db250YWluZXIgPSBmdW5jdGlvbiBfcmVtb3ZlRnJvbUNvbnRhaW5lcihjb250YWluZXIpIHtcbiAgICB0aGlzLmNvbnRhaW5lcnNbY29udGFpbmVyLl9pZF0gPSBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGFyZ2V0O1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4qIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4qXG4qIE93bmVyOiBtYXJrQGZhbW8udXNcbiogQGxpY2Vuc2UgTVBMIDIuMFxuKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBFdmVudEVtaXR0ZXIgcmVwcmVzZW50cyBhIGNoYW5uZWwgZm9yIGV2ZW50cy5cbiAqXG4gKiBAY2xhc3MgRXZlbnRFbWl0dGVyXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICAgIHRoaXMubGlzdGVuZXJzID0ge307XG4gICAgdGhpcy5fb3duZXIgPSB0aGlzO1xufVxuXG4vKipcbiAqIFRyaWdnZXIgYW4gZXZlbnQsIHNlbmRpbmcgdG8gYWxsIGRvd25zdHJlYW0gaGFuZGxlcnNcbiAqICAgbGlzdGVuaW5nIGZvciBwcm92aWRlZCAndHlwZScga2V5LlxuICpcbiAqIEBtZXRob2QgZW1pdFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCBldmVudCBkYXRhXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdCh0eXBlLCBldmVudCkge1xuICAgIHZhciBoYW5kbGVycyA9IHRoaXMubGlzdGVuZXJzW3R5cGVdO1xuICAgIGlmIChoYW5kbGVycykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhhbmRsZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBoYW5kbGVyc1tpXS5jYWxsKHRoaXMuX293bmVyLCBldmVudCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEJpbmQgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBhbiBldmVudCB0eXBlIGhhbmRsZWQgYnkgdGhpcyBvYmplY3QuXG4gKlxuICogQG1ldGhvZCBcIm9uXCJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbih0eXBlLCBoYW5kbGVyKSB7XG4gICAgaWYgKCEodHlwZSBpbiB0aGlzLmxpc3RlbmVycykpIHRoaXMubGlzdGVuZXJzW3R5cGVdID0gW107XG4gICAgdmFyIGluZGV4ID0gdGhpcy5saXN0ZW5lcnNbdHlwZV0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICBpZiAoaW5kZXggPCAwKSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5wdXNoKGhhbmRsZXIpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3IgXCJvblwiLlxuICogQG1ldGhvZCBhZGRMaXN0ZW5lclxuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuLyoqXG4gKiBVbmJpbmQgYW4gZXZlbnQgYnkgdHlwZSBhbmQgaGFuZGxlci5cbiAqICAgVGhpcyB1bmRvZXMgdGhlIHdvcmsgb2YgXCJvblwiLlxuICpcbiAqIEBtZXRob2QgcmVtb3ZlTGlzdGVuZXJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBoYW5kbGVyIGZ1bmN0aW9uIG9iamVjdCB0byByZW1vdmVcbiAqIEByZXR1cm4ge0V2ZW50RW1pdHRlcn0gdGhpc1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIodHlwZSwgaGFuZGxlcikge1xuICAgIHZhciBpbmRleCA9IHRoaXMubGlzdGVuZXJzW3R5cGVdLmluZGV4T2YoaGFuZGxlcik7XG4gICAgaWYgKGluZGV4ID49IDApIHRoaXMubGlzdGVuZXJzW3R5cGVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENhbGwgZXZlbnQgaGFuZGxlcnMgd2l0aCB0aGlzIHNldCB0byBvd25lci5cbiAqXG4gKiBAbWV0aG9kIGJpbmRUaGlzXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG93bmVyIG9iamVjdCB0aGlzIEV2ZW50RW1pdHRlciBiZWxvbmdzIHRvXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYmluZFRoaXMgPSBmdW5jdGlvbiBiaW5kVGhpcyhvd25lcikge1xuICAgIHRoaXMuX293bmVyID0gb3duZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCcuL0V2ZW50RW1pdHRlcicpO1xuXG4vKipcbiAqIEV2ZW50SGFuZGxlciBmb3J3YXJkcyByZWNlaXZlZCBldmVudHMgdG8gYSBzZXQgb2YgcHJvdmlkZWQgY2FsbGJhY2sgZnVuY3Rpb25zLlxuICogSXQgYWxsb3dzIGV2ZW50cyB0byBiZSBjYXB0dXJlZCwgcHJvY2Vzc2VkLCBhbmQgb3B0aW9uYWxseSBwaXBlZCB0aHJvdWdoIHRvIG90aGVyIGV2ZW50IGhhbmRsZXJzLlxuICpcbiAqIEBjbGFzcyBFdmVudEhhbmRsZXJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEV2ZW50SGFuZGxlcigpIHtcbiAgICBFdmVudEVtaXR0ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuZG93bnN0cmVhbSA9IFtdOyAvLyBkb3duc3RyZWFtIGV2ZW50IGhhbmRsZXJzXG4gICAgdGhpcy5kb3duc3RyZWFtRm4gPSBbXTsgLy8gZG93bnN0cmVhbSBmdW5jdGlvbnNcblxuICAgIHRoaXMudXBzdHJlYW0gPSBbXTsgLy8gdXBzdHJlYW0gZXZlbnQgaGFuZGxlcnNcbiAgICB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzID0ge307IC8vIHVwc3RyZWFtIGxpc3RlbmVyc1xufVxuRXZlbnRIYW5kbGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZlbnRFbWl0dGVyLnByb3RvdHlwZSk7XG5FdmVudEhhbmRsZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRXZlbnRIYW5kbGVyO1xuXG4vKipcbiAqIEFzc2lnbiBhbiBldmVudCBoYW5kbGVyIHRvIHJlY2VpdmUgYW4gb2JqZWN0J3MgaW5wdXQgZXZlbnRzLlxuICpcbiAqIEBtZXRob2Qgc2V0SW5wdXRIYW5kbGVyXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBvYmplY3QgdG8gbWl4IHRyaWdnZXIsIHN1YnNjcmliZSwgYW5kIHVuc3Vic2NyaWJlIGZ1bmN0aW9ucyBpbnRvXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gaGFuZGxlciBhc3NpZ25lZCBldmVudCBoYW5kbGVyXG4gKi9cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIgPSBmdW5jdGlvbiBzZXRJbnB1dEhhbmRsZXIob2JqZWN0LCBoYW5kbGVyKSB7XG4gICAgb2JqZWN0LnRyaWdnZXIgPSBoYW5kbGVyLnRyaWdnZXIuYmluZChoYW5kbGVyKTtcbiAgICBpZiAoaGFuZGxlci5zdWJzY3JpYmUgJiYgaGFuZGxlci51bnN1YnNjcmliZSkge1xuICAgICAgICBvYmplY3Quc3Vic2NyaWJlID0gaGFuZGxlci5zdWJzY3JpYmUuYmluZChoYW5kbGVyKTtcbiAgICAgICAgb2JqZWN0LnVuc3Vic2NyaWJlID0gaGFuZGxlci51bnN1YnNjcmliZS5iaW5kKGhhbmRsZXIpO1xuICAgIH1cbn07XG5cbi8qKlxuICogQXNzaWduIGFuIGV2ZW50IGhhbmRsZXIgdG8gcmVjZWl2ZSBhbiBvYmplY3QncyBvdXRwdXQgZXZlbnRzLlxuICpcbiAqIEBtZXRob2Qgc2V0T3V0cHV0SGFuZGxlclxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb2JqZWN0IHRvIG1peCBwaXBlLCB1bnBpcGUsIG9uLCBhZGRMaXN0ZW5lciwgYW5kIHJlbW92ZUxpc3RlbmVyIGZ1bmN0aW9ucyBpbnRvXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gaGFuZGxlciBhc3NpZ25lZCBldmVudCBoYW5kbGVyXG4gKi9cbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyID0gZnVuY3Rpb24gc2V0T3V0cHV0SGFuZGxlcihvYmplY3QsIGhhbmRsZXIpIHtcbiAgICBpZiAoaGFuZGxlciBpbnN0YW5jZW9mIEV2ZW50SGFuZGxlcikgaGFuZGxlci5iaW5kVGhpcyhvYmplY3QpO1xuICAgIG9iamVjdC5waXBlID0gaGFuZGxlci5waXBlLmJpbmQoaGFuZGxlcik7XG4gICAgb2JqZWN0LnVucGlwZSA9IGhhbmRsZXIudW5waXBlLmJpbmQoaGFuZGxlcik7XG4gICAgb2JqZWN0Lm9uID0gaGFuZGxlci5vbi5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC5hZGRMaXN0ZW5lciA9IG9iamVjdC5vbjtcbiAgICBvYmplY3QucmVtb3ZlTGlzdGVuZXIgPSBoYW5kbGVyLnJlbW92ZUxpc3RlbmVyLmJpbmQoaGFuZGxlcik7XG59O1xuXG4vKipcbiAqIFRyaWdnZXIgYW4gZXZlbnQsIHNlbmRpbmcgdG8gYWxsIGRvd25zdHJlYW0gaGFuZGxlcnNcbiAqICAgbGlzdGVuaW5nIGZvciBwcm92aWRlZCAndHlwZScga2V5LlxuICpcbiAqIEBtZXRob2QgZW1pdFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCBldmVudCBkYXRhXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdCh0eXBlLCBldmVudCkge1xuICAgIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHZhciBpID0gMDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5kb3duc3RyZWFtLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLmRvd25zdHJlYW1baV0udHJpZ2dlcikgdGhpcy5kb3duc3RyZWFtW2ldLnRyaWdnZXIodHlwZSwgZXZlbnQpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5kb3duc3RyZWFtRm4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5kb3duc3RyZWFtRm5baV0odHlwZSwgZXZlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIGVtaXRcbiAqIEBtZXRob2QgYWRkTGlzdGVuZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS50cmlnZ2VyID0gRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5lbWl0O1xuXG4vKipcbiAqIEFkZCBldmVudCBoYW5kbGVyIG9iamVjdCB0byBzZXQgb2YgZG93bnN0cmVhbSBoYW5kbGVycy5cbiAqXG4gKiBAbWV0aG9kIHBpcGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gdGFyZ2V0IGV2ZW50IGhhbmRsZXIgdGFyZ2V0IG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSBwYXNzZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnBpcGUgPSBmdW5jdGlvbiBwaXBlKHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQuc3Vic2NyaWJlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiB0YXJnZXQuc3Vic2NyaWJlKHRoaXMpO1xuXG4gICAgdmFyIGRvd25zdHJlYW1DdHggPSAodGFyZ2V0IGluc3RhbmNlb2YgRnVuY3Rpb24pID8gdGhpcy5kb3duc3RyZWFtRm4gOiB0aGlzLmRvd25zdHJlYW07XG4gICAgdmFyIGluZGV4ID0gZG93bnN0cmVhbUN0eC5pbmRleE9mKHRhcmdldCk7XG4gICAgaWYgKGluZGV4IDwgMCkgZG93bnN0cmVhbUN0eC5wdXNoKHRhcmdldCk7XG5cbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgRnVuY3Rpb24pIHRhcmdldCgncGlwZScsIG51bGwpO1xuICAgIGVsc2UgaWYgKHRhcmdldC50cmlnZ2VyKSB0YXJnZXQudHJpZ2dlcigncGlwZScsIG51bGwpO1xuXG4gICAgcmV0dXJuIHRhcmdldDtcbn07XG5cbi8qKlxuICogUmVtb3ZlIGhhbmRsZXIgb2JqZWN0IGZyb20gc2V0IG9mIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKiAgIFVuZG9lcyB3b3JrIG9mIFwicGlwZVwiLlxuICpcbiAqIEBtZXRob2QgdW5waXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCB0YXJnZXQgaGFuZGxlciBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcHJvdmlkZWQgdGFyZ2V0XG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudW5waXBlID0gZnVuY3Rpb24gdW5waXBlKHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQudW5zdWJzY3JpYmUgaW5zdGFuY2VvZiBGdW5jdGlvbikgcmV0dXJuIHRhcmdldC51bnN1YnNjcmliZSh0aGlzKTtcblxuICAgIHZhciBkb3duc3RyZWFtQ3R4ID0gKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/IHRoaXMuZG93bnN0cmVhbUZuIDogdGhpcy5kb3duc3RyZWFtO1xuICAgIHZhciBpbmRleCA9IGRvd25zdHJlYW1DdHguaW5kZXhPZih0YXJnZXQpO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIGRvd25zdHJlYW1DdHguc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB0YXJnZXQoJ3VucGlwZScsIG51bGwpO1xuICAgICAgICBlbHNlIGlmICh0YXJnZXQudHJpZ2dlcikgdGFyZ2V0LnRyaWdnZXIoJ3VucGlwZScsIG51bGwpO1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cbiAgICBlbHNlIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIFwib25cIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBoYW5kbGVyIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKCEodHlwZSBpbiB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzKSkge1xuICAgICAgICB2YXIgdXBzdHJlYW1MaXN0ZW5lciA9IHRoaXMudHJpZ2dlci5iaW5kKHRoaXMsIHR5cGUpO1xuICAgICAgICB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzW3R5cGVdID0gdXBzdHJlYW1MaXN0ZW5lcjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnVwc3RyZWFtLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnVwc3RyZWFtW2ldLm9uKHR5cGUsIHVwc3RyZWFtTGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3IgXCJvblwiXG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEhhbmRsZXIucHJvdG90eXBlLm9uO1xuXG4vKipcbiAqIExpc3RlbiBmb3IgZXZlbnRzIGZyb20gYW4gdXBzdHJlYW0gZXZlbnQgaGFuZGxlci5cbiAqXG4gKiBAbWV0aG9kIHN1YnNjcmliZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRFbWl0dGVyfSBzb3VyY2Ugc291cmNlIGVtaXR0ZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiBzdWJzY3JpYmUoc291cmNlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy51cHN0cmVhbS5pbmRleE9mKHNvdXJjZSk7XG4gICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICB0aGlzLnVwc3RyZWFtLnB1c2goc291cmNlKTtcbiAgICAgICAgZm9yICh2YXIgdHlwZSBpbiB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBzb3VyY2Uub24odHlwZSwgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFN0b3AgbGlzdGVuaW5nIHRvIGV2ZW50cyBmcm9tIGFuIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXIuXG4gKlxuICogQG1ldGhvZCB1bnN1YnNjcmliZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRFbWl0dGVyfSBzb3VyY2Ugc291cmNlIGVtaXR0ZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS51bnN1YnNjcmliZSA9IGZ1bmN0aW9uIHVuc3Vic2NyaWJlKHNvdXJjZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMudXBzdHJlYW0uaW5kZXhPZihzb3VyY2UpO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIHRoaXMudXBzdHJlYW0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgZm9yICh2YXIgdHlwZSBpbiB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIodHlwZSwgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50SGFuZGxlcjtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBhZG5hbkBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuICd1c2Ugc3RyaWN0JztcblxudmFyIFRSQU5TRk9STSA9ICd0cmFuc2Zvcm0nO1xudmFyIE9QQUNJVFkgPSAnb3BhY2l0eSc7XG52YXIgTUFURVJJQUxTID0gJ21hdGVyaWFscyc7XG5cbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpO1xudmFyIEluZGV4ZXIgPSByZXF1aXJlKCcuL2luZGV4ZXInKTtcbnZhciBFbnRpdHlSZWdpc3RyeSA9IHJlcXVpcmUoJy4uL2NvcmUvRW50aXR5UmVnaXN0cnknKTtcbnZhciBUYXJnZXQgPSByZXF1aXJlKCcuLi9jb3JlL2NvbXBvbmVudHMvVGFyZ2V0Jyk7XG5cbi8qKlxuICogR2VvbWV0cnkgaXMgYSBjb21wb25lbnQgdGhhdCBkZWZpbmVzIHRoZSBkYXRhIHRoYXQgc2hvdWxkXG4gKiAgIGJlIGRyYXduIHRvIHRoZSB3ZWJHTCBjYW52YXMuIE1hbmFnZXMgdmVydGV4IGRhdGEgYW5kIGF0dHJpYnV0ZXMuXG4gKlxuICogQGNsYXNzIEdlb21ldHJ5XG4gKiBAY29tcG9uZW50XG4gKiBAY29uc3RydWN0b3JcbiAqIFxuICogQHBhcmFtIHtFbnRpdHl9IGVudGl0eSBFbnRpdHkgdGhhdCB0aGUgR2VvbWV0cnkgaXMgYSBjb21wb25lbnQgb2ZcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIGluc3RhbnRpYXRpb24gb3B0aW9uc1xuICovXG5cbmZ1bmN0aW9uIEdlb21ldHJ5KGVudGl0eSwgb3B0aW9ucykge1xuICAgIHRoaXMuZ2wgPSBlbnRpdHkuZ2V0Q29udGV4dCgpLmdldENvbXBvbmVudCgnY29udGFpbmVyJykuZ2w7XG5cbiAgICBUYXJnZXQuY2FsbCh0aGlzLCBlbnRpdHksIHtcbiAgICAgICAgdmVydGljaWVzOiBbbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMV0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwLCAxXSksXG4gICAgICAgICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDFdKSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMV0pXVxuICAgIH0pO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBFbnRpdHlSZWdpc3RyeS5yZWdpc3RlcihlbnRpdHksICdHZW9tZXRyaWVzJyk7XG4gICAgRW50aXR5UmVnaXN0cnkucmVnaXN0ZXIoZW50aXR5LCAnUmVuZGVyYWJsZXMnKTtcbiAgICBcbiAgICB0aGlzLmVudGl0eSA9IGVudGl0eTtcbiAgICB0aGlzLnZlcnRleEJ1ZmZlcnMgPSB7fTtcbiAgICB0aGlzLmluZGV4QnVmZmVycyA9IHt9O1xuICAgIHRoaXMuYWRkVmVydGV4QnVmZmVyKCd2ZXJ0aWNlcycsICdhX3BvcycpO1xuICAgIHRoaXMuYWRkVmVydGV4QnVmZmVyKCdjb29yZHMnLCAnYV90ZXhDb29yZCcpO1xuICAgIHRoaXMuYWRkVmVydGV4QnVmZmVyKCdub3JtYWxzJywgJ2Ffbm9ybWFsJyk7XG4gICAgaWYgKG9wdGlvbnMuY29sb3JzKSB0aGlzLmFkZFZlcnRleEJ1ZmZlcignY29sb3JzJywgJ2FfY29sb3InKTtcbiAgICBpZiAoISgndHJpYW5nbGVzJyBpbiBvcHRpb25zKSB8fCBvcHRpb25zLnRyaWFuZ2xlcykgdGhpcy5hZGRJbmRleEJ1ZmZlcigndHJpYW5nbGVzJyk7XG4gICAgaWYgKG9wdGlvbnMubGluZXMpIHRoaXMuYWRkSW5kZXhCdWZmZXIoJ2xpbmVzJyk7XG4gICAgdGhpcy5zcGVjID0ge1xuICAgICAgICBwcmltaXRpdmU6IG9wdGlvbnMudHlwZSB8fCAndHJpYW5nbGVzJyxcbiAgICAgICAgb3JpZ2luOiBbLjUsIC41XSxcbiAgICAgICAgc2l6ZTogWzAsIDAsIDBdLFxuICAgICAgICBnZW9tZXRyeToge1xuICAgICAgICAgICAgdmVydGV4QnVmZmVyczogdGhpcy52ZXJ0ZXhCdWZmZXJzLFxuICAgICAgICAgICAgaW5kZXhCdWZmZXJzOiB0aGlzLmluZGV4QnVmZmVyc1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBpZiAob3B0aW9ucy5zaXplKSB0aGlzLnNldFNpemUob3B0aW9ucy5zaXplKTtcbiAgICBpZiAob3B0aW9ucy5vcmlnaW4pIHRoaXMuc2V0T3JpZ2luKG9wdGlvbnMub3JpZ2luKTtcbn1cblxuR2VvbWV0cnkudG9TdHJpbmcgPSAgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAnZ2VvbWV0cnknO1xufTtcblxuXG5HZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFRhcmdldC5wcm90b3R5cGUpO1xuR2VvbWV0cnkucHJvdG90eXBlLmFkZFZlcnRleEJ1ZmZlciA9IGZ1bmN0aW9uIGFkZFZlcnRleEJ1ZmZlcihuYW1lLCBhdHRyaWJ1dGUpIHtcbiAgICB2YXIgYnVmZmVyID0gdGhpcy52ZXJ0ZXhCdWZmZXJzW2F0dHJpYnV0ZV0gPSBuZXcgQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCBGbG9hdDMyQXJyYXksIHRoaXMuZ2wpO1xuICAgIGJ1ZmZlci5uYW1lID0gbmFtZTtcbiAgICB0aGlzW25hbWVdID0gW107XG59O1xuXG5HZW9tZXRyeS5wcm90b3R5cGUuYWRkSW5kZXhCdWZmZXIgPSBmdW5jdGlvbiBhZGRJbmRleEJ1ZmZlcihuYW1lKSB7XG4gICAgdmFyIGJ1ZmZlciA9IHRoaXMuaW5kZXhCdWZmZXJzW25hbWVdID0gbmV3IEJ1ZmZlcih0aGlzLmdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBVaW50MTZBcnJheSwgdGhpcy5nbCk7XG4gICAgdGhpc1tuYW1lXSA9IFtdO1xufTtcblxuR2VvbWV0cnkucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbiBjb21waWxlKCkge1xuICAgIGZvciAodmFyIGF0dHJpYnV0ZSBpbiB0aGlzLnZlcnRleEJ1ZmZlcnMpIHtcbiAgICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMudmVydGV4QnVmZmVyc1thdHRyaWJ1dGVdO1xuICAgICAgICBidWZmZXIuZGF0YSA9IHRoaXNbYnVmZmVyLm5hbWVdO1xuICAgICAgICBidWZmZXIuY29tcGlsZSgpO1xuICAgIH1cblxuICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5pbmRleEJ1ZmZlcnMpIHtcbiAgICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMuaW5kZXhCdWZmZXJzW25hbWVdO1xuICAgICAgICBidWZmZXIuZGF0YSA9IHRoaXNbbmFtZV07XG4gICAgICAgIGJ1ZmZlci5jb21waWxlKCk7XG4gICAgfVxufTtcblxuR2VvbWV0cnkucHJvdG90eXBlLmFkZE5vcm1hbHMgPSBmdW5jdGlvbiBhZGROb3JtYWxzKCkge1xuICAgIGlmICghdGhpcy5ub3JtYWxzKSB0aGlzLmFkZFZlcnRleEJ1ZmZlcignbm9ybWFscycsICdnbF9Ob3JtYWwnKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5ub3JtYWxzW2ldID0gbmV3IFZlY3RvcigpO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudHJpYW5nbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB0ID0gdGhpcy50cmlhbmdsZXNbaV07XG4gICAgICAgIHZhciBhID0gVmVjdG9yLmZyb21BcnJheSh0aGlzLnZlcnRpY2VzW3RbMF1dKTtcbiAgICAgICAgdmFyIGIgPSBWZWN0b3IuZnJvbUFycmF5KHRoaXMudmVydGljZXNbdFsxXV0pO1xuICAgICAgICB2YXIgYyA9IFZlY3Rvci5mcm9tQXJyYXkodGhpcy52ZXJ0aWNlc1t0WzJdXSk7XG4gICAgICAgIHZhciBub3JtYWwgPSBiLnN1YihhKS5jcm9zcyhjLnN1YihhKSkubm9ybWFsaXplKCk7XG4gICAgICAgIHRoaXMubm9ybWFsc1t0WzBdXSA9IHRoaXMubm9ybWFsc1t0WzBdXS5hZGQobm9ybWFsKTtcbiAgICAgICAgdGhpcy5ub3JtYWxzW3RbMV1dID0gdGhpcy5ub3JtYWxzW3RbMV1dLmFkZChub3JtYWwpO1xuICAgICAgICB0aGlzLm5vcm1hbHNbdFsyXV0gPSB0aGlzLm5vcm1hbHNbdFsyXV0uYWRkKG5vcm1hbCk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLm5vcm1hbHNbaV0gPSB0aGlzLm5vcm1hbHNbaV0ubm9ybWFsaXplKCkudG9BcnJheSgpO1xuICAgIH1cbiAgICB0aGlzLmNvbXBpbGUoKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbkdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEdlb21ldHJ5O1xuXG5HZW9tZXRyeS5wcm90b3R5cGUuc2V0U2l6ZSA9IGZ1bmN0aW9uIHNpemUodmFsKSB7XG4gICAgaWYgKHZhbFswXSAhPSBudWxsKSB0aGlzLnNwZWMuc2l6ZVswXSA9IHZhbFswXTtcbiAgICBpZiAodmFsWzFdICE9IG51bGwpIHRoaXMuc3BlYy5zaXplWzFdID0gdmFsWzFdO1xuICAgIGlmICh2YWxbMl0gIT0gbnVsbCkgdGhpcy5zcGVjLnNpemVbMl0gPSB2YWxbMl07XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbkdlb21ldHJ5LnByb3RvdHlwZS5zZXRPcmlnaW4gID0gZnVuY3Rpb24gc2V0T3JpZ2luKHgsIHkpIHtcbiAgICBpZiAoKHggIT0gbnVsbCAmJiAoeCA8IDAgfHwgeCA+IDEpKSB8fCAoeSAhPSBudWxsICYmICh5IDwgMCB8fCB5ID4gMSkpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09yaWdpbiBtdXN0IGhhdmUgYW4geCBhbmQgeSB2YWx1ZSBiZXR3ZWVuIDAgYW5kIDEnKTtcblxuICAgIHRoaXMuc3BlYy5vcmlnaW5bMF0gPSB4ICE9IG51bGwgPyB4IDogdGhpcy5zcGVjLm9yaWdpblswXTtcbiAgICB0aGlzLnNwZWMub3JpZ2luWzFdID0geSAhPSBudWxsID8geSA6IHRoaXMuc3BlYy5vcmlnaW5bMV07XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbkdlb21ldHJ5LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRyYW5zZm9ybSA9IHRoaXMuZW50aXR5LmdldENvbXBvbmVudChUUkFOU0ZPUk0pO1xuICAgIHZhciBvcGFjaXR5ID0gdGhpcy5lbnRpdHkuZ2V0Q29tcG9uZW50KE9QQUNJVFkpO1xuICAgIHZhciBzdXJmYWNlID0gdGhpcy5lbnRpdHkuZ2V0Q29tcG9uZW50KCdzdXJmYWNlJyk7XG5cbiAgICB0aGlzLnNwZWMudHJhbnNmb3JtID0gdHJhbnNmb3JtLmdldEdsb2JhbE1hdHJpeCgpO1xuICAgIHRoaXMuc3BlYy5vcGFjaXR5ID0gb3BhY2l0eSA/IG9wYWNpdHkuX2dsb2JhbE9wYWNpdHkgOiAxOyBcbiAgICBcbiAgICBpZiAoc3VyZmFjZSkgdGhpcy5zcGVjLm9yaWdpbiA9IHN1cmZhY2Uuc3BlYy5vcmlnaW47XG5cbiAgICByZXR1cm4gdGhpcy5zcGVjO1xufTtcblxuR2VvbWV0cnkucHJvdG90eXBlLmxvYWRGcm9tT2JqID0gZnVuY3Rpb24gbG9hZEZyb21PYmoodXJsLCBvcHRpb25zKSB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxvYWRPYmouY2FsbCh0aGlzLCB4aHIucmVzcG9uc2VUZXh0LCBvcHRpb25zLnNjYWxlIHx8IC4wMDUsIG9wdGlvbnMub2Zmc2V0IHx8IFswLCAwLCAwXSk7XG4gICAgICAgIHRoaXMuY29tcGlsZSgpO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICB4aHIuc2VuZChudWxsKTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gbG9hZE9iaihvYmosIHNjYWxlLCBvZmZzZXQpIHsgXG4gICAgICAgIHZhciB2dHMgPSBbXTsgXG4gICAgICAgIHZhciBubWwgPSBbXTsgXG4gICAgICAgIHZhciBpbmR2ID0gW107ICAgICAgICAgXG4gICAgICAgIHZhciBpbmR0ID0gW107IFxuICAgICAgICB2YXIgaW5kbiA9IFtdOyBcbiAgICAgICAgdmFyIHR4YyA9IFtdOyAgICAgXG4gICAgICAgIHZhciBsaW5lcyA9IG9iai5zcGxpdCgnXFxuJyk7ICAgICBcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldOyBcbiAgICAgICAgICAgIGlmIChsaW5lLmluZGV4T2YoJ3YgJykgIT09IC0xKSB7IFxuICAgICAgICAgICAgICAgIHZhciB2ZXJ0ZXggPSBsaW5lLnNwbGl0KCcgJyk7IFxuICAgICAgICAgICAgICAgIHZhciB2eCA9IHBhcnNlRmxvYXQodmVydGV4WzFdKSAqIHNjYWxlICsgb2Zmc2V0WzBdOyBcbiAgICAgICAgICAgICAgICB2YXIgdnkgPSBwYXJzZUZsb2F0KHZlcnRleFsyXSkgKiBzY2FsZSArIG9mZnNldFsxXTsgXG4gICAgICAgICAgICAgICAgdmFyIHZ6ID0gcGFyc2VGbG9hdCh2ZXJ0ZXhbM10pICogc2NhbGUgKyBvZmZzZXRbMl07IFxuICAgICAgICAgICAgICAgIHZ0cy5wdXNoKFt2eCwgdnksIHZ6XSk7ICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgIGVsc2UgaWYgKGxpbmUuaW5kZXhPZigndnQgJykgIT09IC0xKSB7ICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciB0ZXhjb29yZCA9IGxpbmUuc3BsaXQoJyAnKTsgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHR4ID0gcGFyc2VGbG9hdCh0ZXhjb29yZFsxXSk7IFxuICAgICAgICAgICAgICAgIHZhciB0eSA9IHBhcnNlRmxvYXQodGV4Y29vcmRbMl0pOyBcbiAgICAgICAgICAgICAgICB0eGMucHVzaChbdHgsIHR5XSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChsaW5lLmluZGV4T2YoJ3ZuICcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBub3JtYWwgPSBsaW5lLnNwbGl0KCcgJyk7ICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgbnggPSBwYXJzZUZsb2F0KG5vcm1hbFsxXSk7IFxuICAgICAgICAgICAgICAgIHZhciBueSA9IHBhcnNlRmxvYXQobm9ybWFsWzJdKTsgXG4gICAgICAgICAgICAgICAgdmFyIG56ID0gcGFyc2VGbG9hdChub3JtYWxbM10pOyAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbm1sLnB1c2goW254LCBueSwgbnpdKTsgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGxpbmUuaW5kZXhPZignZiAnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBsaW5lLnNwbGl0KCcgJyk7ICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXhbMV0uaW5kZXhPZignLy8nKSAhPT0gLTEpIHsgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB2YXIgaTEgPSBpbmRleFsxXS5zcGxpdCgnLy8nKTsgXG4gICAgICAgICAgICAgICAgICAgIHZhciBpMiA9IGluZGV4WzJdLnNwbGl0KCcvLycpOyBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkzID0gaW5kZXhbM10uc3BsaXQoJy8vJyk7IFxuICAgICAgICAgICAgICAgICAgICBpbmR2LnB1c2gocGFyc2VGbG9hdChpMVswXSkgLTEsIHBhcnNlRmxvYXQoaTJbMF0pIC0gMSwgcGFyc2VGbG9hdChpM1swXSkgLSAxKTsgXG4gICAgICAgICAgICAgICAgICAgIGluZG4ucHVzaChwYXJzZUZsb2F0KGkxWzFdKSAtMSwgcGFyc2VGbG9hdChpMlsxXSkgLSAxLCBwYXJzZUZsb2F0KGkzWzFdKSAtIDEpOyBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaW5kZXhbMV0uaW5kZXhPZignLycpICE9PSAtMSkgeyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHZhciBpMSA9IGluZGV4WzFdLnNwbGl0KCcvJyk7IFxuICAgICAgICAgICAgICAgICAgICB2YXIgaTIgPSBpbmRleFsyXS5zcGxpdCgnLycpOyBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkzID0gaW5kZXhbM10uc3BsaXQoJy8nKTsgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGluZHYucHVzaChwYXJzZUZsb2F0KGkxWzBdKSAtIDEsIHBhcnNlRmxvYXQoaTJbMF0pIC0gMSwgcGFyc2VGbG9hdChpM1swXSkgLSAxKTsgXG4gICAgICAgICAgICAgICAgICAgIGluZHQucHVzaChwYXJzZUZsb2F0KGkxWzFdKSAtIDEsIHBhcnNlRmxvYXQoaTJbMV0pIC0gMSwgcGFyc2VGbG9hdChpM1sxXSkgLSAxKTsgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaW5kbi5wdXNoKHBhcnNlRmxvYXQoaTFbMl0pIC0gMSwgcGFyc2VGbG9hdChpMlsyXSkgLSAxLCBwYXJzZUZsb2F0KGkzWzJdKSAtIDEpOyBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpbmR2LnB1c2gocGFyc2VGbG9hdChpbmRleFsxXSkgLSAxLCBwYXJzZUZsb2F0KGluZGV4WzJdKSAtIDEsIHBhcnNlRmxvYXQoaW5kZXhbM10pIC0gMSk7IFxuICAgICAgICAgICAgICAgIH0gICAgXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuXG4gICAgbWFrZVByb3BlckFycmF5KGluZHYsIHZ0cyk7XG4gICAgdGhpcy52ZXJ0aWNlcyA9IHZ0cztcbiAgICAvL3RoaXMubm9ybWFscyA9IG1ha2VQcm9wZXJBcnJheShpbmRuLCBubWwpOyBcbiAgICAvL3RoaXMuY29vcmRzID0gbWFrZVByb3BlckFycmF5KGluZHQsIHR4Yyk7IFxuXG59OyAgICBcblxuZnVuY3Rpb24gbWFrZVByb3BlckFycmF5KGluZGljZXMsIGFycmF5KSB7ICAgICAgICAgICAgXG4gICAgdmFyIG91dHB1dCA9IFtdOyBcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgaW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdGVtcCA9IGFycmF5W2luZGljZXNbaV1dOyBcbiAgICAgICAgZm9yKHZhciBqID0gMDsgaiA8IHRlbXAubGVuZ3RoOyBqKyspXG4gICAgICAgICAgICBvdXRwdXQucHVzaCh0ZW1wW2pdKTsgICAgIFxuICAgIH0gXG4gICAgcmV0dXJuIG91dHB1dDsgXG59XG5cbi8qKlxuICogQnVmZmVyIGlzIGEgcHJpdmF0ZSBvYmplY3QgdGhhdCBzdG9yZXMgcmVmZXJlbmNlcyB0byBwYXNzIGRhdGEgZnJvbVxuICogYSB0eXBlZCBhcnJheSB0byBhIFZCTy5cbiAqXG4gKiBAY2xhc3MgR2VvbWV0cnlcbiAqIEBjb21wb25lbnRcbiAqIEBjb25zdHJ1Y3RvclxuICogXG4gKiBAcGFyYW0ge1RhcmdldH0gTG9jYXRpb24gb2YgdGhlIHZlcnRleCBkYXRhIHRoYXQgaXMgYmVpbmcgdXBsb2FkZWQgdG8gZ2wuXG4gKiBAcGFyYW0ge1R5cGV9IENvbnRzdHJ1Y3RvciBmb3IgdGhlIHR5cGVkIGFycmF5IHdoaWNoIHdpbGwgc3RvcmUgZGF0YSBwYXNzZWQgZnJvbSB0aGUgYXBwbGljYXRpb24uXG4gKi9cblxuZnVuY3Rpb24gQnVmZmVyKHRhcmdldCwgdHlwZSwgZ2wpIHtcbiAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmRhdGEgPSBbXTtcbiAgICB0aGlzLmdsID0gZ2w7XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUgPSB7XG4gICAgY29tcGlsZTogZnVuY3Rpb24odHlwZSkge1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuICAgICAgICB2YXIgZGF0YSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgY2h1bmsgPSAxMDAwMDsgaSA8IHRoaXMuZGF0YS5sZW5ndGg7IGkgKz0gY2h1bmspIHtcbiAgICAgICAgICAgIGRhdGEgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KGRhdGEsIHRoaXMuZGF0YS5zbGljZShpLCBpICsgY2h1bmspKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3BhY2luZyA9IHRoaXMuZGF0YS5sZW5ndGggPyBkYXRhLmxlbmd0aCAvIHRoaXMuZGF0YS5sZW5ndGggOiAwO1xuICAgICAgICBpZiAoc3BhY2luZyAhPSBNYXRoLnJvdW5kKHNwYWNpbmcpKSB0aHJvdyAnYnVmZmVyIGVsZW1lbnRzIG5vdCBvZiBjb25zaXN0ZW50IHNpemUsIGF2ZXJhZ2Ugc2l6ZSBpcyAnICsgc3BhY2luZztcbiAgICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmJ1ZmZlciB8fCBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgdGhpcy5idWZmZXIubGVuZ3RoID0gZGF0YS5sZW5ndGg7XG4gICAgICAgIHRoaXMuYnVmZmVyLnNwYWNpbmcgPSBzcGFjaW5nO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKHRoaXMudGFyZ2V0LCB0aGlzLmJ1ZmZlcik7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEodGhpcy50YXJnZXQsIG5ldyB0aGlzLnR5cGUoZGF0YSksIHR5cGUgfHwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR2VvbWV0cnk7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogYWRuYW5AZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbiAndXNlIHN0cmljdCc7XG5cbnZhciBUUkFOU0ZPUk0gPSAndHJhbnNmb3JtJztcbnZhciBPUEFDSVRZID0gJ29wYWNpdHknO1xudmFyIE1BVEVSSUFMUyA9ICdtYXRlcmlhbHMnO1xuXG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKTtcbnZhciBJbmRleGVyID0gcmVxdWlyZSgnLi9pbmRleGVyJyk7XG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuLi9jb3JlL0VudGl0eVJlZ2lzdHJ5Jyk7XG52YXIgVGFyZ2V0ID0gcmVxdWlyZSgnLi4vY29yZS9jb21wb25lbnRzL1RhcmdldCcpO1xuXG4vKipcbiAqIEdlb21ldHJ5IGlzIGEgY29tcG9uZW50IHRoYXQgZGVmaW5lcyB0aGUgZGF0YSB0aGF0IHNob3VsZFxuICogICBiZSBkcmF3biB0byB0aGUgd2ViR0wgY2FudmFzLiBNYW5hZ2VzIHZlcnRleCBkYXRhIGFuZCBhdHRyaWJ1dGVzLlxuICpcbiAqIEBjbGFzcyBHZW9tZXRyeVxuICogQGNvbXBvbmVudFxuICogQGNvbnN0cnVjdG9yXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgdGhlIEdlb21ldHJ5IGlzIGEgY29tcG9uZW50IG9mXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBpbnN0YW50aWF0aW9uIG9wdGlvbnNcbiAqL1xuXG5mdW5jdGlvbiBHZW9tZXRyeShlbnRpdHksIG9wdGlvbnMpIHtcbiAgICB0aGlzLmdsID0gZW50aXR5LmdldENvbnRleHQoKS5nZXRDb21wb25lbnQoJ2NvbnRhaW5lcicpLmdsO1xuXG4gICAgVGFyZ2V0LmNhbGwodGhpcywgZW50aXR5LCB7XG4gICAgICAgIHZlcnRpY2llczogW25ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDFdKSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMV0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwLCAxXSksXG4gICAgICAgICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDFdKV1cbiAgICB9KTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgRW50aXR5UmVnaXN0cnkucmVnaXN0ZXIoZW50aXR5LCAnR2VvbWV0cmllcycpO1xuICAgIEVudGl0eVJlZ2lzdHJ5LnJlZ2lzdGVyKGVudGl0eSwgJ1JlbmRlcmFibGVzJyk7XG4gICAgXG4gICAgdGhpcy5lbnRpdHkgPSBlbnRpdHk7XG4gICAgdGhpcy52ZXJ0ZXhCdWZmZXJzID0ge307XG4gICAgdGhpcy5pbmRleEJ1ZmZlcnMgPSB7fTtcbiAgICB0aGlzLmFkZFZlcnRleEJ1ZmZlcigndmVydGljZXMnLCAnYV9wb3MnKTtcbiAgICB0aGlzLmFkZFZlcnRleEJ1ZmZlcignY29vcmRzJywgJ2FfdGV4Q29vcmQnKTtcbiAgICB0aGlzLmFkZFZlcnRleEJ1ZmZlcignbm9ybWFscycsICdhX25vcm1hbCcpO1xuICAgIGlmIChvcHRpb25zLmNvbG9ycykgdGhpcy5hZGRWZXJ0ZXhCdWZmZXIoJ2NvbG9ycycsICdhX2NvbG9yJyk7XG4gICAgaWYgKCEoJ3RyaWFuZ2xlcycgaW4gb3B0aW9ucykgfHwgb3B0aW9ucy50cmlhbmdsZXMpIHRoaXMuYWRkSW5kZXhCdWZmZXIoJ3RyaWFuZ2xlcycpO1xuICAgIGlmIChvcHRpb25zLmxpbmVzKSB0aGlzLmFkZEluZGV4QnVmZmVyKCdsaW5lcycpO1xuICAgIHRoaXMuc3BlYyA9IHtcbiAgICAgICAgcHJpbWl0aXZlOiBvcHRpb25zLnR5cGUgfHwgJ3RyaWFuZ2xlcycsXG4gICAgICAgIG9yaWdpbjogWy41LCAuNV0sXG4gICAgICAgIHNpemU6IFswLCAwLCAwXSxcbiAgICAgICAgZ2VvbWV0cnk6IHtcbiAgICAgICAgICAgIHZlcnRleEJ1ZmZlcnM6IHRoaXMudmVydGV4QnVmZmVycyxcbiAgICAgICAgICAgIGluZGV4QnVmZmVyczogdGhpcy5pbmRleEJ1ZmZlcnNcbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgaWYgKG9wdGlvbnMuc2l6ZSkgdGhpcy5zZXRTaXplKG9wdGlvbnMuc2l6ZSk7XG4gICAgaWYgKG9wdGlvbnMub3JpZ2luKSB0aGlzLnNldE9yaWdpbihvcHRpb25zLm9yaWdpbik7XG59XG5cbkdlb21ldHJ5LnRvU3RyaW5nID0gIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJ2dlb21ldHJ5Jztcbn07XG5cblxuR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUYXJnZXQucHJvdG90eXBlKTtcbkdlb21ldHJ5LnByb3RvdHlwZS5hZGRWZXJ0ZXhCdWZmZXIgPSBmdW5jdGlvbiBhZGRWZXJ0ZXhCdWZmZXIobmFtZSwgYXR0cmlidXRlKSB7XG4gICAgdmFyIGJ1ZmZlciA9IHRoaXMudmVydGV4QnVmZmVyc1thdHRyaWJ1dGVdID0gbmV3IEJ1ZmZlcih0aGlzLmdsLkFSUkFZX0JVRkZFUiwgRmxvYXQzMkFycmF5LCB0aGlzLmdsKTtcbiAgICBidWZmZXIubmFtZSA9IG5hbWU7XG4gICAgdGhpc1tuYW1lXSA9IFtdO1xufTtcblxuR2VvbWV0cnkucHJvdG90eXBlLmFkZEluZGV4QnVmZmVyID0gZnVuY3Rpb24gYWRkSW5kZXhCdWZmZXIobmFtZSkge1xuICAgIHZhciBidWZmZXIgPSB0aGlzLmluZGV4QnVmZmVyc1tuYW1lXSA9IG5ldyBCdWZmZXIodGhpcy5nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgVWludDE2QXJyYXksIHRoaXMuZ2wpO1xuICAgIHRoaXNbbmFtZV0gPSBbXTtcbn07XG5cbkdlb21ldHJ5LnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24gY29tcGlsZSgpIHtcbiAgICBmb3IgKHZhciBhdHRyaWJ1dGUgaW4gdGhpcy52ZXJ0ZXhCdWZmZXJzKSB7XG4gICAgICAgIHZhciBidWZmZXIgPSB0aGlzLnZlcnRleEJ1ZmZlcnNbYXR0cmlidXRlXTtcbiAgICAgICAgYnVmZmVyLmRhdGEgPSB0aGlzW2J1ZmZlci5uYW1lXTtcbiAgICAgICAgYnVmZmVyLmNvbXBpbGUoKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBuYW1lIGluIHRoaXMuaW5kZXhCdWZmZXJzKSB7XG4gICAgICAgIHZhciBidWZmZXIgPSB0aGlzLmluZGV4QnVmZmVyc1tuYW1lXTtcbiAgICAgICAgYnVmZmVyLmRhdGEgPSB0aGlzW25hbWVdO1xuICAgICAgICBidWZmZXIuY29tcGlsZSgpO1xuICAgIH1cbn07XG5cbkdlb21ldHJ5LnByb3RvdHlwZS5hZGROb3JtYWxzID0gZnVuY3Rpb24gYWRkTm9ybWFscygpIHtcbiAgICBpZiAoIXRoaXMubm9ybWFscykgdGhpcy5hZGRWZXJ0ZXhCdWZmZXIoJ25vcm1hbHMnLCAnZ2xfTm9ybWFsJyk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMubm9ybWFsc1tpXSA9IG5ldyBWZWN0b3IoKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnRyaWFuZ2xlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdCA9IHRoaXMudHJpYW5nbGVzW2ldO1xuICAgICAgICB2YXIgYSA9IFZlY3Rvci5mcm9tQXJyYXkodGhpcy52ZXJ0aWNlc1t0WzBdXSk7XG4gICAgICAgIHZhciBiID0gVmVjdG9yLmZyb21BcnJheSh0aGlzLnZlcnRpY2VzW3RbMV1dKTtcbiAgICAgICAgdmFyIGMgPSBWZWN0b3IuZnJvbUFycmF5KHRoaXMudmVydGljZXNbdFsyXV0pO1xuICAgICAgICB2YXIgbm9ybWFsID0gYi5zdWIoYSkuY3Jvc3MoYy5zdWIoYSkpLm5vcm1hbGl6ZSgpO1xuICAgICAgICB0aGlzLm5vcm1hbHNbdFswXV0gPSB0aGlzLm5vcm1hbHNbdFswXV0uYWRkKG5vcm1hbCk7XG4gICAgICAgIHRoaXMubm9ybWFsc1t0WzFdXSA9IHRoaXMubm9ybWFsc1t0WzFdXS5hZGQobm9ybWFsKTtcbiAgICAgICAgdGhpcy5ub3JtYWxzW3RbMl1dID0gdGhpcy5ub3JtYWxzW3RbMl1dLmFkZChub3JtYWwpO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5ub3JtYWxzW2ldID0gdGhpcy5ub3JtYWxzW2ldLm5vcm1hbGl6ZSgpLnRvQXJyYXkoKTtcbiAgICB9XG4gICAgdGhpcy5jb21waWxlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5HZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBHZW9tZXRyeTtcblxuR2VvbWV0cnkucHJvdG90eXBlLnNldFNpemUgPSBmdW5jdGlvbiBzaXplKHZhbCkge1xuICAgIGlmICh2YWxbMF0gIT0gbnVsbCkgdGhpcy5zcGVjLnNpemVbMF0gPSB2YWxbMF07XG4gICAgaWYgKHZhbFsxXSAhPSBudWxsKSB0aGlzLnNwZWMuc2l6ZVsxXSA9IHZhbFsxXTtcbiAgICBpZiAodmFsWzJdICE9IG51bGwpIHRoaXMuc3BlYy5zaXplWzJdID0gdmFsWzJdO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuXG5HZW9tZXRyeS5wcm90b3R5cGUuc2V0T3JpZ2luICA9IGZ1bmN0aW9uIHNldE9yaWdpbih4LCB5KSB7XG4gICAgaWYgKCh4ICE9IG51bGwgJiYgKHggPCAwIHx8IHggPiAxKSkgfHwgKHkgIT0gbnVsbCAmJiAoeSA8IDAgfHwgeSA+IDEpKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcmlnaW4gbXVzdCBoYXZlIGFuIHggYW5kIHkgdmFsdWUgYmV0d2VlbiAwIGFuZCAxJyk7XG5cbiAgICB0aGlzLnNwZWMub3JpZ2luWzBdID0geCAhPSBudWxsID8geCA6IHRoaXMuc3BlYy5vcmlnaW5bMF07XG4gICAgdGhpcy5zcGVjLm9yaWdpblsxXSA9IHkgIT0gbnVsbCA/IHkgOiB0aGlzLnNwZWMub3JpZ2luWzFdO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5HZW9tZXRyeS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0cmFuc2Zvcm0gPSB0aGlzLmVudGl0eS5nZXRDb21wb25lbnQoVFJBTlNGT1JNKTtcbiAgICB2YXIgb3BhY2l0eSA9IHRoaXMuZW50aXR5LmdldENvbXBvbmVudChPUEFDSVRZKTtcbiAgICB2YXIgc3VyZmFjZSA9IHRoaXMuZW50aXR5LmdldENvbXBvbmVudCgnc3VyZmFjZScpO1xuXG4gICAgdGhpcy5zcGVjLnRyYW5zZm9ybSA9IHRyYW5zZm9ybS5nZXRHbG9iYWxNYXRyaXgoKTtcbiAgICB0aGlzLnNwZWMub3BhY2l0eSA9IG9wYWNpdHkgPyBvcGFjaXR5Ll9nbG9iYWxPcGFjaXR5IDogMTsgXG4gICAgXG4gICAgaWYgKHN1cmZhY2UpIHRoaXMuc3BlYy5vcmlnaW4gPSBzdXJmYWNlLnNwZWMub3JpZ2luO1xuXG4gICAgcmV0dXJuIHRoaXMuc3BlYztcbn07XG5cbkdlb21ldHJ5LnByb3RvdHlwZS5sb2FkRnJvbU9iaiA9IGZ1bmN0aW9uIGxvYWRGcm9tT2JqKHVybCwgb3B0aW9ucykge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB4aHIub3BlbignR0VUJywgdXJsKTtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBsb2FkT2JqLmNhbGwodGhpcywgeGhyLnJlc3BvbnNlVGV4dCwgb3B0aW9ucy5zY2FsZSB8fCAuMDA1LCBvcHRpb25zLm9mZnNldCB8fCBbMCwgMCwgMF0pO1xuICAgICAgICB0aGlzLmNvbXBpbGUoKTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgeGhyLnNlbmQobnVsbCk7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbmZ1bmN0aW9uIGxvYWRPYmoob2JqLCBzY2FsZSwgb2Zmc2V0KSB7IFxuICAgICAgICB2YXIgdnRzID0gW107IFxuICAgICAgICB2YXIgbm1sID0gW107IFxuICAgICAgICB2YXIgaW5kdiA9IFtdOyAgICAgICAgIFxuICAgICAgICB2YXIgaW5kdCA9IFtdOyBcbiAgICAgICAgdmFyIGluZG4gPSBbXTsgXG4gICAgICAgIHZhciB0eGMgPSBbXTsgICAgIFxuICAgICAgICB2YXIgbGluZXMgPSBvYmouc3BsaXQoJ1xcbicpOyAgICAgXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXTsgXG4gICAgICAgICAgICBpZiAobGluZS5pbmRleE9mKCd2ICcpICE9PSAtMSkgeyBcbiAgICAgICAgICAgICAgICB2YXIgdmVydGV4ID0gbGluZS5zcGxpdCgnICcpOyBcbiAgICAgICAgICAgICAgICB2YXIgdnggPSBwYXJzZUZsb2F0KHZlcnRleFsxXSkgKiBzY2FsZSArIG9mZnNldFswXTsgXG4gICAgICAgICAgICAgICAgdmFyIHZ5ID0gcGFyc2VGbG9hdCh2ZXJ0ZXhbMl0pICogc2NhbGUgKyBvZmZzZXRbMV07IFxuICAgICAgICAgICAgICAgIHZhciB2eiA9IHBhcnNlRmxvYXQodmVydGV4WzNdKSAqIHNjYWxlICsgb2Zmc2V0WzJdOyBcbiAgICAgICAgICAgICAgICB2dHMucHVzaChbdngsIHZ5LCB2el0pOyAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9ICAgXG4gICAgICAgICAgICBlbHNlIGlmIChsaW5lLmluZGV4T2YoJ3Z0ICcpICE9PSAtMSkgeyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgdGV4Y29vcmQgPSBsaW5lLnNwbGl0KCcgJyk7ICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciB0eCA9IHBhcnNlRmxvYXQodGV4Y29vcmRbMV0pOyBcbiAgICAgICAgICAgICAgICB2YXIgdHkgPSBwYXJzZUZsb2F0KHRleGNvb3JkWzJdKTsgXG4gICAgICAgICAgICAgICAgdHhjLnB1c2goW3R4LCB0eV0pOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobGluZS5pbmRleE9mKCd2biAnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9ybWFsID0gbGluZS5zcGxpdCgnICcpOyAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIG54ID0gcGFyc2VGbG9hdChub3JtYWxbMV0pOyBcbiAgICAgICAgICAgICAgICB2YXIgbnkgPSBwYXJzZUZsb2F0KG5vcm1hbFsyXSk7IFxuICAgICAgICAgICAgICAgIHZhciBueiA9IHBhcnNlRmxvYXQobm9ybWFsWzNdKTsgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5tbC5wdXNoKFtueCwgbnksIG56XSk7ICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChsaW5lLmluZGV4T2YoJ2YgJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gbGluZS5zcGxpdCgnICcpOyAgICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4WzFdLmluZGV4T2YoJy8vJykgIT09IC0xKSB7ICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkxID0gaW5kZXhbMV0uc3BsaXQoJy8vJyk7IFxuICAgICAgICAgICAgICAgICAgICB2YXIgaTIgPSBpbmRleFsyXS5zcGxpdCgnLy8nKTsgXG4gICAgICAgICAgICAgICAgICAgIHZhciBpMyA9IGluZGV4WzNdLnNwbGl0KCcvLycpOyBcbiAgICAgICAgICAgICAgICAgICAgaW5kdi5wdXNoKHBhcnNlRmxvYXQoaTFbMF0pIC0xLCBwYXJzZUZsb2F0KGkyWzBdKSAtIDEsIHBhcnNlRmxvYXQoaTNbMF0pIC0gMSk7IFxuICAgICAgICAgICAgICAgICAgICBpbmRuLnB1c2gocGFyc2VGbG9hdChpMVsxXSkgLTEsIHBhcnNlRmxvYXQoaTJbMV0pIC0gMSwgcGFyc2VGbG9hdChpM1sxXSkgLSAxKTsgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGluZGV4WzFdLmluZGV4T2YoJy8nKSAhPT0gLTEpIHsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB2YXIgaTEgPSBpbmRleFsxXS5zcGxpdCgnLycpOyBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkyID0gaW5kZXhbMl0uc3BsaXQoJy8nKTsgXG4gICAgICAgICAgICAgICAgICAgIHZhciBpMyA9IGluZGV4WzNdLnNwbGl0KCcvJyk7ICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpbmR2LnB1c2gocGFyc2VGbG9hdChpMVswXSkgLSAxLCBwYXJzZUZsb2F0KGkyWzBdKSAtIDEsIHBhcnNlRmxvYXQoaTNbMF0pIC0gMSk7IFxuICAgICAgICAgICAgICAgICAgICBpbmR0LnB1c2gocGFyc2VGbG9hdChpMVsxXSkgLSAxLCBwYXJzZUZsb2F0KGkyWzFdKSAtIDEsIHBhcnNlRmxvYXQoaTNbMV0pIC0gMSk7ICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGluZG4ucHVzaChwYXJzZUZsb2F0KGkxWzJdKSAtIDEsIHBhcnNlRmxvYXQoaTJbMl0pIC0gMSwgcGFyc2VGbG9hdChpM1syXSkgLSAxKTsgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaW5kdi5wdXNoKHBhcnNlRmxvYXQoaW5kZXhbMV0pIC0gMSwgcGFyc2VGbG9hdChpbmRleFsyXSkgLSAxLCBwYXJzZUZsb2F0KGluZGV4WzNdKSAtIDEpOyBcbiAgICAgICAgICAgICAgICB9ICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICB9ICAgICAgICBcblxuICAgIG1ha2VQcm9wZXJBcnJheShpbmR2LCB2dHMpO1xuICAgIHRoaXMudmVydGljZXMgPSB2dHM7XG4gICAgLy90aGlzLm5vcm1hbHMgPSBtYWtlUHJvcGVyQXJyYXkoaW5kbiwgbm1sKTsgXG4gICAgLy90aGlzLmNvb3JkcyA9IG1ha2VQcm9wZXJBcnJheShpbmR0LCB0eGMpOyBcblxufTsgICAgXG5cbmZ1bmN0aW9uIG1ha2VQcm9wZXJBcnJheShpbmRpY2VzLCBhcnJheSkgeyAgICAgICAgICAgIFxuICAgIHZhciBvdXRwdXQgPSBbXTsgXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHRlbXAgPSBhcnJheVtpbmRpY2VzW2ldXTsgXG4gICAgICAgIGZvcih2YXIgaiA9IDA7IGogPCB0ZW1wLmxlbmd0aDsgaisrKVxuICAgICAgICAgICAgb3V0cHV0LnB1c2godGVtcFtqXSk7ICAgICBcbiAgICB9IFxuICAgIHJldHVybiBvdXRwdXQ7IFxufVxuXG4vKipcbiAqIEJ1ZmZlciBpcyBhIHByaXZhdGUgb2JqZWN0IHRoYXQgc3RvcmVzIHJlZmVyZW5jZXMgdG8gcGFzcyBkYXRhIGZyb21cbiAqIGEgdHlwZWQgYXJyYXkgdG8gYSBWQk8uXG4gKlxuICogQGNsYXNzIEdlb21ldHJ5XG4gKiBAY29tcG9uZW50XG4gKiBAY29uc3RydWN0b3JcbiAqIFxuICogQHBhcmFtIHtUYXJnZXR9IExvY2F0aW9uIG9mIHRoZSB2ZXJ0ZXggZGF0YSB0aGF0IGlzIGJlaW5nIHVwbG9hZGVkIHRvIGdsLlxuICogQHBhcmFtIHtUeXBlfSBDb250c3RydWN0b3IgZm9yIHRoZSB0eXBlZCBhcnJheSB3aGljaCB3aWxsIHN0b3JlIGRhdGEgcGFzc2VkIGZyb20gdGhlIGFwcGxpY2F0aW9uLlxuICovXG5cbmZ1bmN0aW9uIEJ1ZmZlcih0YXJnZXQsIHR5cGUsIGdsKSB7XG4gICAgdGhpcy5idWZmZXIgPSBudWxsO1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5kYXRhID0gW107XG4gICAgdGhpcy5nbCA9IGdsO1xufVxuXG5CdWZmZXIucHJvdG90eXBlID0ge1xuICAgIGNvbXBpbGU6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcbiAgICAgICAgdmFyIGRhdGEgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGNodW5rID0gMTAwMDA7IGkgPCB0aGlzLmRhdGEubGVuZ3RoOyBpICs9IGNodW5rKSB7XG4gICAgICAgICAgICBkYXRhID0gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShkYXRhLCB0aGlzLmRhdGEuc2xpY2UoaSwgaSArIGNodW5rKSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNwYWNpbmcgPSB0aGlzLmRhdGEubGVuZ3RoID8gZGF0YS5sZW5ndGggLyB0aGlzLmRhdGEubGVuZ3RoIDogMDtcbiAgICAgICAgaWYgKHNwYWNpbmcgIT0gTWF0aC5yb3VuZChzcGFjaW5nKSkgdGhyb3cgJ2J1ZmZlciBlbGVtZW50cyBub3Qgb2YgY29uc2lzdGVudCBzaXplLCBhdmVyYWdlIHNpemUgaXMgJyArIHNwYWNpbmc7XG4gICAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5idWZmZXIgfHwgZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgIHRoaXMuYnVmZmVyLmxlbmd0aCA9IGRhdGEubGVuZ3RoO1xuICAgICAgICB0aGlzLmJ1ZmZlci5zcGFjaW5nID0gc3BhY2luZztcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcih0aGlzLnRhcmdldCwgdGhpcy5idWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKHRoaXMudGFyZ2V0LCBuZXcgdGhpcy50eXBlKGRhdGEpLCB0eXBlIHx8IGdsLlNUQVRJQ19EUkFXKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdlb21ldHJ5O1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGFkbmFuQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4gJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBJbmRleGVyKCkge1xuICAgIHRoaXMudW5pcXVlID0gW107XG4gICAgdGhpcy5pbmRpY2VzID0gW107XG4gICAgdGhpcy5tYXAgPSB7fTtcbn1cblxuSW5kZXhlci5wcm90b3R5cGUgPSB7XG4gICAgYWRkOiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgdmFyIGtleSA9IEpTT04uc3RyaW5naWZ5KG9iaik7XG4gICAgICAgIGlmICghIChrZXkgaW4gdGhpcy5tYXApKSB7XG4gICAgICAgICAgICB0aGlzLm1hcFtrZXldID0gdGhpcy51bmlxdWUubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy51bmlxdWUucHVzaChvYmopO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm1hcFtrZXldO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW5kZXhlcjtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBhZG5hbkBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVGV4dHVyZSA9IHJlcXVpcmUoJy4vdGV4dHVyZScpO1xudmFyIFJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi4vY29yZS9FbnRpdHlSZWdpc3RyeScpO1xuZnVuY3Rpb24gTWF0ZXJpYWxzKGVudGl0eSwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMuZ2wgPSBlbnRpdHkuZ2V0Q29udGV4dCgpLmdldENvbXBvbmVudCgnY29udGFpbmVyJykuZ2w7XG5cbiAgICB0aGlzLmltYWdlID0gbG9hZEltYWdlKG9wdGlvbnMuaW1hZ2UsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5sb2FkKCk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmZzQ2h1bmsgPSBvcHRpb25zLmZzQ2h1bmsgfHwge1xuICAgICAgICBkZWZpbmVzOiAnJyxcbiAgICAgICAgYXBwbHk6ICdjb2xvciA9IHRleHR1cmUyRCh0ZXh0dXJlLCB2X3RleENvb3JkLnh5KS54eXp3OydcbiAgICB9O1xuICAgIHRoaXMuZW50aXR5ID0gZW50aXR5O1xuICAgIGlmIChvcHRpb25zLnJlc2FtcGxlKSBzZXRJbnRlcnZhbCh0aGlzLnJlc2FtcGxlLCBvcHRpb25zLnJlc2FtcGxlKTtcblxuICAgIFJlZ2lzdHJ5LnJlZ2lzdGVyKGVudGl0eSwgJ01hdGVyaWFscycpO1xufVxuXG5NYXRlcmlhbHMucHJvdG90eXBlLnNldFVuaWZvcm0gPSBmdW5jdGlvbiBzZXRVbmlmb3JtKG5hbWUsIHZhbHVlKSB7XG4gICAgdGhpcy5lbnRpdHkuc3BlY1tuYW1lXSA9IHZhbHVlO1xufTtcblxuTWF0ZXJpYWxzLnByb3RvdHlwZS5yZXNhbXBsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy50ZXh0dXJlKSB0aGlzLnRleHR1cmU7XG59O1xuXG5NYXRlcmlhbHMucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiBsb2FkKCkge1xuICAgIHZhciBpbWFnZSA9IHRoaXMuaW1hZ2U7XG4gICAgdmFyIHRleHR1cmUgPSBuZXcgVGV4dHVyZSh0aGlzLmdsLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0LCB0aGlzLm9wdGlvbnMpO1xuICAgIHRyeSB7IHRleHR1cmUuaW1hZ2UoaW1hZ2UpOyB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgLy9pZiAob3B0aW9ucy5taW5GaWx0ZXIgJiYgb3B0aW9ucy5taW5GaWx0ZXIgIT0gZ2wuTkVBUkVTVCAmJiBvcHRpb25zLm1pbkZpbHRlciAhPSBnbC5MSU5FQVIpIHtcbiAgICAgIC8vICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFXzJEKTtcbiAgICAvL31cbiAgICB0aGlzLnRleHR1cmUgPSB0ZXh0dXJlO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuTWF0ZXJpYWxzLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgYXBwbHlNYXRlcmlhbC5jYWxsKHRoaXMsIHRoaXMuZW50aXR5KTtcbn07XG5cbmZ1bmN0aW9uIGFwcGx5TWF0ZXJpYWwocmVuZGVyTm9kZSkge1xuICAgIHZhciBnZW8gPSByZW5kZXJOb2RlLmdldENvbXBvbmVudCgnZ2VvbWV0cnknKTtcbiAgICBcbiAgICBpZiAoZ2VvKSB7XG4gICAgICAgIGlmICh0aGlzLnRleHR1cmUpICBnZW8uc3BlYy50ZXh0dXJlID0gdGhpcy50ZXh0dXJlLmlkICYmIDA7XG4gICAgICAgIGdlby5zcGVjLnRleHR1cmUgJiYgdGhpcy50ZXh0dXJlLmJpbmQoKTtcbiAgICAgICAgZ2VvLnNwZWMuZnNDaHVuayA9IHRoaXMuZnNDaHVuaztcbiAgICB9XG4gICAgXG4gICAgcmVuZGVyTm9kZS5nZXRDaGlsZHJlbigpLmZvckVhY2goYXBwbHlNYXRlcmlhbCwgdGhpcyk7XG59XG5cbk1hdGVyaWFscy5wcm90b3R5cGUuX3VwZGF0ZSA9IGZ1bmN0aW9uIF91cGRhdGUoKSB7XG4gICAgaWYgKHRoaXMuaW1hZ2UpIHRoaXMudGV4dHVyZS5pbWFnZSh0aGlzLmltYWdlKTtcbn07XG5cbk1hdGVyaWFscy50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiAnbWF0ZXJpYWxzJztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWF0ZXJpYWxzO1xuXG5cbmZ1bmN0aW9uIGxvYWRJbWFnZShpbWcsIGNiKSB7XG4gICAgdmFyIG9iaiA9ICh0eXBlb2YgaW1nID09PSAnc3RyaW5nJykgPyBuZXcgSW1hZ2UoKSA6IGltZztcbiAgICBvYmoub25sb2FkID0gZnVuY3Rpb24gKGltZykge1xuICAgICAgICBjYi5jYWxsKGltZyk7XG4gICAgfTtcbiAgICBvYmouc3JjID0gaW1nO1xuICAgIHJldHVybiBvYmo7XG59XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogYWRuYW5AZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJyk7XG52YXIgR2VvbWV0cnkgPSByZXF1aXJlKCcuL0dlb21ldHJ5Jyk7XG52YXIgSW5kZXhlciA9IHJlcXVpcmUoJy4vaW5kZXhlcicpO1xuXG5mdW5jdGlvbiBwaWNrT2N0YW50KGkpIHtcbiAgICByZXR1cm4gbmV3IFZlY3RvcigoaSAmIDEpICogMiAtIDEsIChpICYgMikgLSAxLCAoaSAmIDQpIC8gMiAtIDEpO1xufVxuXG52YXIgY3ViZURhdGEgPSBbXG4gICAgWzAsIDQsIDIsIDYsIC0xLCAwLCAwXSxcbiAgICBbMSwgMywgNSwgNywgKzEsIDAsIDBdLFxuICAgIFswLCAxLCA0LCA1LCAwLCAtMSwgMF0sXG4gICAgWzIsIDYsIDMsIDcsIDAsICsxLCAwXSxcbiAgICBbMCwgMiwgMSwgMywgMCwgMCwgLTFdLFxuICAgIFs0LCA1LCA2LCA3LCAwLCAwLCArMV0gXG5dO1xuXG5tb2R1bGUuZXhwb3J0cy5jdWJlID0gZnVuY3Rpb24gQ3ViZShyZW5kZXJOb2RlLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdmFyIGN1YmUgPSBuZXcgR2VvbWV0cnkocmVuZGVyTm9kZSwgb3B0aW9ucyk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN1YmVEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBkYXRhID0gY3ViZURhdGFbaV0sIHYgPSBpICogNDtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCA0OyBqKyspIHtcbiAgICAgICAgICAgIHZhciBkID0gZGF0YVtqXTtcbiAgICAgICAgICAgIGN1YmUudmVydGljZXMucHVzaChwaWNrT2N0YW50KGQpLnRvQXJyYXkoKSk7XG4gICAgICAgICAgICBjdWJlLmNvb3Jkcy5wdXNoKFtqICYgMSwgKGogJiAyKSAvIDJdKTtcbiAgICAgICAgICAgIGN1YmUubm9ybWFscy5wdXNoKGRhdGEuc2xpY2UoNCwgNykpO1xuICAgICAgICB9XG4gICAgICAgIGN1YmUudHJpYW5nbGVzLnB1c2goW3YsIHYgKyAxLCB2ICsgMl0pO1xuICAgICAgICBjdWJlLnRyaWFuZ2xlcy5wdXNoKFt2ICsgMiwgdiArIDEsIHYgKyAzXSk7XG4gICAgfVxuXG4gICAgY3ViZS5jb21waWxlKCk7XG4gICAgcmV0dXJuIGN1YmU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5zcGhlcmUgPSBmdW5jdGlvbiBTcGhlcmUocmVuZGVyTm9kZSwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHZhciBzcGhlcmUgPSBuZXcgR2VvbWV0cnkocmVuZGVyTm9kZSwgb3B0aW9ucyk7XG4gICAgdmFyIGZsaXA7XG5cbiAgICBmdW5jdGlvbiB0cmkoYSwgYiwgYykgeyByZXR1cm4gZmxpcCA/IFthLCBjLCBiXSA6IFthLCBiLCBjXTsgfVxuICAgIGZ1bmN0aW9uIGZpeCh4KSB7IHJldHVybiB4ICsgKHggLSB4ICogeCkgIH1cblxuICAgIHZhciBpbmRleGVyID0gbmV3IEluZGV4ZXIoKTtcbiAgICB2YXIgZGV0YWlsID0gb3B0aW9ucy5kZXRhaWwgfHwgMTU7XG5cbiAgICBmb3IgKHZhciBvY3RhbnQgPSAwOyBvY3RhbnQgPCA4OyBvY3RhbnQrKykge1xuICAgICAgICB2YXIgc2NhbGUgPSBwaWNrT2N0YW50KG9jdGFudCk7XG4gICAgICAgIGZsaXAgPSBzY2FsZS54ICogc2NhbGUueSAqIHNjYWxlLnogPiAwO1xuICAgICAgICB2YXIgZGF0YSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBkZXRhaWw7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGkgKyBqIDw9IGRldGFpbDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGEgPSBpIC8gZGV0YWlsO1xuICAgICAgICAgICAgICAgIHZhciBiID0gaiAvIGRldGFpbDtcbiAgICAgICAgICAgICAgICB2YXIgYyA9IChkZXRhaWwgLSBpIC0gaikgLyBkZXRhaWw7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSBuZXcgVmVjdG9yKGZpeChhKSwgZml4KGIpLCBmaXgoYykpLm5vcm1hbGl6ZSgpLnRpbWVzKHNjYWxlKTtcbiAgICAgICAgICAgICAgICB2YXIgdmVydGV4ID0geyB2ZXJ0ZXg6IFt2LngsIHYueSwgdi56XSB9O1xuICAgICAgICAgICAgICAgIHZlcnRleC5jb29yZCA9IHNjYWxlLnkgPiAwID8gWygxIC0gYSksIGNdIDogW2MsICgxIC0gYSldO1xuICAgICAgICAgICAgICAgIGRhdGEucHVzaChpbmRleGVyLmFkZCh2ZXJ0ZXgpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGkgKyBqIDw9IGRldGFpbDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhID0gKGkgLSAxKSAqIChkZXRhaWwgKyAxKSArICgoaSAtIDEpIC0gKGkgLSAxKSAqIChpIC0gMSkpIC8gMiArIGo7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiID0gaSAqIChkZXRhaWwgKyAxKSArIChpIC0gaSAqIGkpIC8gMiArIGo7XG4gICAgICAgICAgICAgICAgICAgIHNwaGVyZS50cmlhbmdsZXMucHVzaCh0cmkoZGF0YVthXSwgZGF0YVthICsgMV0sIGRhdGFbYl0pKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgKyBqIDwgZGV0YWlsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGhlcmUudHJpYW5nbGVzLnB1c2godHJpKGRhdGFbYl0sIGRhdGFbYSArIDFdLCBkYXRhW2IgKyAxXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3BoZXJlLnZlcnRpY2VzID0gaW5kZXhlci51bmlxdWUubWFwKGZ1bmN0aW9uKHYpIHsgcmV0dXJuIHYudmVydGV4OyB9KTtcblxuICAgIHNwaGVyZS5jb29yZHMgPSBpbmRleGVyLnVuaXF1ZS5tYXAoZnVuY3Rpb24odikgeyByZXR1cm4gdi5jb29yZDsgfSk7XG4gICAgc3BoZXJlLm5vcm1hbHMgPSBzcGhlcmUudmVydGljZXM7XG5cbiAgICBzcGhlcmUuY29tcGlsZSgpO1xuICAgIHJldHVybiBzcGhlcmU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5wbGFuZSA9IGZ1bmN0aW9uIFBsYW5lKHJlbmRlck5vZGUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgcGxhbmUgPSBuZXcgR2VvbWV0cnkocmVuZGVyTm9kZSwgb3B0aW9ucyk7XG5cbiAgICB2YXIgZGV0YWlsWCA9IG9wdGlvbnMuZGV0YWlsWCB8fCBvcHRpb25zLmRldGFpbCB8fCAxO1xuICAgIHZhciBkZXRhaWxZID0gb3B0aW9ucy5kZXRhaWxZIHx8IG9wdGlvbnMuZGV0YWlsIHx8IDE7XG5cbiAgICBmb3IgKHZhciB5ID0gMDsgeSA8PSBkZXRhaWxZOyB5KyspIHtcbiAgICAgICAgdmFyIHQgPSB5IC8gZGV0YWlsWTtcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPD0gZGV0YWlsWDsgeCsrKSB7XG4gICAgICAgICAgICB2YXIgcyA9IHggLyBkZXRhaWxYO1xuICAgICAgICAgICAgcGxhbmUudmVydGljZXMucHVzaChbcywgdCwgMF0pO1xuICAgICAgICAgICAgcGxhbmUuY29vcmRzLnB1c2goW3MsIDEgLSB0XSk7XG4gICAgICAgICAgICBwbGFuZS5ub3JtYWxzLnB1c2goW3MsIDAsIDBdKTtcbiAgICAgICAgICAgIGlmICh4IDwgZGV0YWlsWCAmJiB5IDwgZGV0YWlsWSkge1xuICAgICAgICAgICAgICAgIHZhciBpID0geCArIHkgKiAoZGV0YWlsWCArIDEpO1xuICAgICAgICAgICAgICAgIHBsYW5lLnRyaWFuZ2xlcy5wdXNoKFtpLCBpICsgMSwgaSArIGRldGFpbFggKyAxXSk7XG4gICAgICAgICAgICAgICAgcGxhbmUudHJpYW5nbGVzLnB1c2goW2kgKyBkZXRhaWxYICsgMSwgaSArIDEsIGkgKyBkZXRhaWxYICsgMl0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcGxhbmUuY29tcGlsZSgpO1xuXG4gICAgcmV0dXJuIHBsYW5lO1xufTtcblxuZm9yICh2YXIgaSBpbiBtb2R1bGUuZXhwb3J0cylcbiAgICBtb2R1bGUuZXhwb3J0c1tpXS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICdnZW9tZXRyeSc7XG4gICAgfTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBhZG5hbkBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxudmFyIHZlcnRleFdyYXBwZXIgPSBbXG4gICAgJy8vZGVmaW5lX3ZzQ2h1bmsnLFxuXG4gICAgJ3ZlYzQgY2xpcHNwYWNlKGluIHZlYzQgcG9zKSB7JyxcbiAgICAncmV0dXJuIHZlYzQoMi4gKiAocG9zLnggLyByZXNvbHV0aW9uLngpIC0gMS4sJyxcbiAgICAnICAgICAgICAgICAgMS4gLSAocG9zLnkgLyByZXNvbHV0aW9uLnkpICogMi4sJyxcbiAgICAnLXBvcy56IC8gMTAwMC4sJyxcbiAgICAncG9zLncpOycsIFxuICAgICd9JyxcbiAgICAndmVjNCBwaXBlbGluZV9wb3MoaW4gdmVjNCBwb3MpIHsnLFxuICAgICcgICAgLy9hcHBseV92c0NodW5rJywgXG5cbiAgICAnICAgIHBvcyA9IHZlYzQocG9zLnh5ICogcmVzb2x1dGlvbi54eSwgMC4sIDEuMCk7JyxcbiAgICAnICAgIHBvcy54eSAqPSBzaXplLnh5IC8gcmVzb2x1dGlvbi54eTsnLFxuICAgICcgICAgcG9zLnh5IC09IHNpemUueHkgKiBvcmlnaW47JyxcbiAgICAnICAgIHBvcyA9IHBlcnNwZWN0aXZlICogdHJhbnNmb3JtICogcG9zOycsICAgIFxuICAgICcgICAgcG9zLnh5ICs9IHNpemUueHkgKiBvcmlnaW47JyxcbiAgICAnICAgIHJldHVybiBjbGlwc3BhY2UocG9zKTsnLCAgXG4gICAgJ30nLFxuXG4gICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICcgICAgdl9ub3JtYWwgPSBhX25vcm1hbDsnLFxuICAgICcgICAgdl90ZXhDb29yZCA9IGFfdGV4Q29vcmQ7JyxcbiAgICAnICAgIGdsX1Bvc2l0aW9uID0gcGlwZWxpbmVfcG9zKGFfcG9zKTsnLFxuICAgICd9J1xuXS5qb2luKCdcXG4nKTtcblxudmFyIGZyYWdtZW50V3JhcHBlciA9IFtcbiAgICAnLy9kZWZpbmVfZnNDaHVuaycsICBcbiAgICAndmVjNCBwaXBlbGluZV9jb2xvcihpbiB2ZWM0IGNvbG9yKSB7JyxcbiAgICAnICAgIC8vYXBwbHlfZnNDaHVuaycsICBcbiAgICAnICAgIHJldHVybiBjb2xvcjsnLCBcbiAgICAnfScsXG5cbiAgICAndm9pZCBtYWluKCkgeycsXG4gICAgJyAgICB2ZWM0IGNvbG9yOycsXG4gICAgJyAgICBjb2xvciA9IHBpcGVsaW5lX2NvbG9yKHZlYzQoMS4gLSB2X25vcm1hbCwgMS4pKTsnLFxuICAgICcgICAgZ2xfRnJhZ0NvbG9yID0gY29sb3I7JyxcbiAgICAnfSdcbl0uam9pbignXFxuJyk7XG5cbnZhciBoZWFkZXIgPSBbJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0OycsXG4gICAgICAgICAgICAgICd1bmlmb3JtIG1hdDQgdHJhbnNmb3JtOycsXG4gICAgICAgICAgICAgICd1bmlmb3JtIG1hdDQgcGVyc3BlY3RpdmU7JyxcbiAgICAgICAgICAgICAgJ3VuaWZvcm0gZmxvYXQgZm9jYWxEZXB0aDsnLFxuICAgICAgICAgICAgICAndW5pZm9ybSB2ZWMzIHNpemU7JyxcbiAgICAgICAgICAgICAgJ3VuaWZvcm0gdmVjMyByZXNvbHV0aW9uOycsXG4gICAgICAgICAgICAgICd1bmlmb3JtIHZlYzIgb3JpZ2luOycsXG4gICAgICAgICAgICAgICd1bmlmb3JtIHNhbXBsZXIyRCB0ZXh0dXJlOycsXG4gICAgICAgICAgICAgICd1bmlmb3JtIGZsb2F0IGJyaWdodG5lc3M7JyxcbiAgICAgICAgICAgICAgJ3VuaWZvcm0gZmxvYXQgb3BhY2l0eTsnLFxuICAgICAgICAgICAgICAndW5pZm9ybSBmbG9hdCBjbG9jazsnLFxuICAgICAgICAgICAgICAndW5pZm9ybSB2ZWMyIG1vdXNlOycsXG4gICAgICAgICAgICAgICd2YXJ5aW5nIHZlYzIgdl90ZXhDb29yZDsnLFxuICAgICAgICAgICAgICAndmFyeWluZyB2ZWMzIHZfbm9ybWFsOydcbiAgICAgICAgICAgICBdLmpvaW4oJ1xcbicpO1xuXG52YXIgdmVydGV4SGVhZGVyID0gaGVhZGVyICsgW1xuICAgICdhdHRyaWJ1dGUgdmVjNCBhX3BvczsnLFxuICAgICdhdHRyaWJ1dGUgdmVjMiBhX3RleENvb3JkOycsXG4gICAgJ2F0dHJpYnV0ZSB2ZWMzIGFfbm9ybWFsOycsXG4gICAgJ2F0dHJpYnV0ZSB2ZWM0IGFfY29sb3I7J1xuXS5qb2luKCdcXG4nKTtcblxudmFyIGZyYWdtZW50SGVhZGVyID0gaGVhZGVyICsgJyc7XG5cbmZ1bmN0aW9uIFNoYWRlcihnbCwgbWF0ZXJpYWxzKSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuXG4gICAgdmFyIHZzQ2h1bmtEZWZpbmVzID0gJyc7XG4gICAgdmFyIHZzQ2h1bmtBcHBsaWVzID0gJyc7XG4gICAgdmFyIGZzQ2h1bmtEZWZpbmVzID0gJyc7XG4gICAgdmFyIGZzQ2h1bmtBcHBsaWVzID0gJyc7XG5cbiAgICBtYXRlcmlhbHMuZm9yRWFjaChmdW5jdGlvbiAoY2h1bmspIHtcbiAgICAgICAgaWYgKCEgY2h1bmspIHJldHVybjtcbiAgICAgICAgaWYgKGNodW5rLnZzQ2h1bmspIHtcbiAgICAgICAgICAgIHZzQ2h1bmtEZWZpbmVzICs9IGNodW5rLnZzQ2h1bmsuZGVmaW5lcyB8fCAnJztcbiAgICAgICAgICAgIHZzQ2h1bmtBcHBsaWVzICs9IGNodW5rLnZzQ2h1bmsuYXBwbHkgfHwgJyc7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBpZiAoY2h1bmsuZnNDaHVuaykge1xuICAgICAgICAgICAgZnNDaHVua0RlZmluZXMgKz0gY2h1bmsuZnNDaHVuay5kZWZpbmVzIHx8ICcnO1xuICAgICAgICAgICAgZnNDaHVua0FwcGxpZXMgKz0gY2h1bmsuZnNDaHVuay5hcHBseSB8fCAnJztcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICBcbiAgICB2YXIgdmVydGV4U291cmNlID0gdmVydGV4SGVhZGVyICsgdmVydGV4V3JhcHBlclxuICAgICAgICAgICAgLnJlcGxhY2UoJy8vZGVmaW5lX3ZzQ2h1bmsnLCB2c0NodW5rRGVmaW5lcylcbiAgICAgICAgICAgIC5yZXBsYWNlKCcvL2FwcGx5X3ZzQ2h1bmsnLCB2c0NodW5rQXBwbGllcyk7XG4gICAgXG4gICAgdmFyIGZyYWdtZW50U291cmNlID0gZnJhZ21lbnRIZWFkZXIgKyBmcmFnbWVudFdyYXBwZXJcbiAgICAgICAgICAgIC5yZXBsYWNlKCcvL2RlZmluZV9mc0NodW5rJywgZnNDaHVua0RlZmluZXMpXG4gICAgICAgICAgICAucmVwbGFjZSgnLy9hcHBseV9mc0NodW5rJywgZnNDaHVua0FwcGxpZXMpO1xuXG4gICAgZnVuY3Rpb24gY29tcGlsZVNvdXJjZSh0eXBlLCBzb3VyY2UpIHtcbiAgICAgICAgdmFyIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcih0eXBlKTtcbiAgICAgICAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc291cmNlKTtcbiAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xuICAgICAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICAgICAgdmFyIGkgPSAgMTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHNvdXJjZS5yZXBsYWNlKC9cXG4vZywgZnVuY3Rpb24gKCkgeyByZXR1cm4gJ1xcbicgKyAoaSsrKSArICc6ICc7IH0pKTtcbiAgICAgICAgICAgIHRocm93ICdjb21waWxlIGVycm9yOiAnICsgZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaGFkZXI7XG4gICAgfVxuICAgIFxuICAgIHRoaXMucHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICBnbC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCBjb21waWxlU291cmNlKGdsLlZFUlRFWF9TSEFERVIsIHZlcnRleFNvdXJjZSkpO1xuICAgIGdsLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIGNvbXBpbGVTb3VyY2UoZ2wuRlJBR01FTlRfU0hBREVSLCBmcmFnbWVudFNvdXJjZSkpO1xuICAgIGdsLmxpbmtQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG4gICAgaWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMucHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpKSB7XG4gICAgICAgIHRocm93ICdsaW5rIGVycm9yOiAnICsgZ2wuZ2V0UHJvZ3JhbUluZm9Mb2codGhpcy5wcm9ncmFtKTtcbiAgICB9XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy51bmlmb3JtTG9jYXRpb25zID0ge307XG5cbiAgICB2YXIgaXNTYW1wbGVyID0gdGhpcy5pc1NhbXBsZXIgPSB7fTtcblxuICAgIHJlZ2V4TWFwKC91bmlmb3JtXFxzK3NhbXBsZXIoMUR8MkR8M0R8Q3ViZSlcXHMrKFxcdyspXFxzKjsvZywgdmVydGV4U291cmNlICsgZnJhZ21lbnRTb3VyY2UsXG4gICAgICAgICAgICAgZnVuY3Rpb24oZ3JvdXBzKSB7IGlzU2FtcGxlcltncm91cHNbMl1dID0gMTsgfVxuICAgICAgICAgICAgKTtcbiAgICBcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIobikge1xuICAgIHJldHVybiAhIGlzTmFOKHBhcnNlRmxvYXQobikpICYmIGlzRmluaXRlKG4pO1xufVxuXG5TaGFkZXIucHJvdG90eXBlID0ge1xuICAgIHVuaWZvcm1zOiBmdW5jdGlvbih1bmlmb3Jtcykge1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gICAgICAgIGdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcblxuICAgICAgICBmb3IgKHZhciBuYW1lIGluIHVuaWZvcm1zKSB7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb24gPSB0aGlzLnVuaWZvcm1Mb2NhdGlvbnNbbmFtZV0gfHwgZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMucHJvZ3JhbSwgbmFtZSk7XG4gICAgICAgICAgICBpZiAoIWxvY2F0aW9uKSBjb250aW51ZTtcbiAgICAgICAgICAgIHRoaXMudW5pZm9ybUxvY2F0aW9uc1tuYW1lXSA9IGxvY2F0aW9uO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gdW5pZm9ybXNbbmFtZV07XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgdmFsdWUgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHZhbHVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMTogZ2wudW5pZm9ybTFmdihsb2NhdGlvbiwgbmV3IEZsb2F0MzJBcnJheSh2YWx1ZSkpOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI6IGdsLnVuaWZvcm0yZnYobG9jYXRpb24sIG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzOiBnbC51bmlmb3JtM2Z2KGxvY2F0aW9uLCBuZXcgRmxvYXQzMkFycmF5KHZhbHVlKSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDogZ2wudW5pZm9ybTRmdihsb2NhdGlvbiwgbmV3IEZsb2F0MzJBcnJheSh2YWx1ZSkpOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDk6IGdsLnVuaWZvcm1NYXRyaXgzZnYobG9jYXRpb24sIGZhbHNlLCBuZXcgRmxvYXQzMkFycmF5KHZhbHVlKSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMTY6IGdsLnVuaWZvcm1NYXRyaXg0ZnYobG9jYXRpb24sIGZhbHNlLCBuZXcgRmxvYXQzMkFycmF5KHZhbHVlKSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93ICdkb250IGtub3cgaG93IHRvIGxvYWQgdW5pZm9ybSBcIicgKyBuYW1lICsgJ1wiIG9mIGxlbmd0aCAnICsgdmFsdWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNOdW1iZXIodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgKHRoaXMuaXNTYW1wbGVyW25hbWVdID8gZ2wudW5pZm9ybTFpIDogZ2wudW5pZm9ybTFmKS5jYWxsKGdsLCBsb2NhdGlvbiwgdmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnYXR0ZW1wdGVkIHRvIHNldCB1bmlmb3JtIFwiJyArIG5hbWUgKyAnXCIgdG8gaW52YWxpZCB2YWx1ZSAnICsgdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgZHJhdzogZnVuY3Rpb24obWVzaCwgbW9kZSkge1xuICAgICAgICB0aGlzLmRyYXdCdWZmZXJzKG1lc2gudmVydGV4QnVmZmVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICBtZXNoLmluZGV4QnVmZmVyc1ttb2RlID09IHRoaXMuZ2wuTElORVMgPyAnbGluZXMnIDogJ3RyaWFuZ2xlcyddLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50cy5sZW5ndGggPCAyID8gdGhpcy5nbC5UUklBTkdMRVMgOiBtb2RlKTtcbiAgICB9LFxuXG4gICAgZHJhd0J1ZmZlcnM6IGZ1bmN0aW9uKHZlcnRleEJ1ZmZlcnMsIGluZGV4QnVmZmVyLCBtb2RlKSB7XG4gICAgICAgIHZhciBsZW5ndGggPSAwO1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuICAgICAgICBmb3IgKHZhciBhdHRyaWJ1dGUgaW4gdmVydGV4QnVmZmVycykge1xuICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IHZlcnRleEJ1ZmZlcnNbYXR0cmlidXRlXTtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIHx8XG4gICAgICAgICAgICAgICAgICAgIGdsLmdldEF0dHJpYkxvY2F0aW9uKHRoaXMucHJvZ3JhbSwgYXR0cmlidXRlKTtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbiA9PSAtMSB8fCAhYnVmZmVyLmJ1ZmZlcikgY29udGludWU7XG4gICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA9IGxvY2F0aW9uO1xuICAgICAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlci5idWZmZXIpO1xuICAgICAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgICAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihsb2NhdGlvbiwgYnVmZmVyLmJ1ZmZlci5zcGFjaW5nLCBnbC5GTE9BVCwgZ2wuRkFMU0UsIDAsIDApO1xuICAgICAgICAgICAgbGVuZ3RoID0gYnVmZmVyLmJ1ZmZlci5sZW5ndGggLyBidWZmZXIuYnVmZmVyLnNwYWNpbmc7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBhdHRyaWJ1dGUgaW4gdGhpcy5hdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICBpZiAoIShhdHRyaWJ1dGUgaW4gdmVydGV4QnVmZmVycykpXG4gICAgICAgICAgICAgICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsZW5ndGggJiYgKCFpbmRleEJ1ZmZlciB8fCBpbmRleEJ1ZmZlci5idWZmZXIpKSB7XG4gICAgICAgICAgICBpZiAoaW5kZXhCdWZmZXIpIHtcbiAgICAgICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpbmRleEJ1ZmZlci5idWZmZXIpO1xuICAgICAgICAgICAgICAgIGdsLmRyYXdFbGVtZW50cyhtb2RlLCBpbmRleEJ1ZmZlci5idWZmZXIubGVuZ3RoLCBnbC5VTlNJR05FRF9TSE9SVCwgMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGdsLmRyYXdBcnJheXMobW9kZSwgMCwgbGVuZ3RoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHJlZ2V4TWFwKHJlZ2V4LCB0ZXh0LCBjYWxsYmFjaykge1xuICAgIHZhciByZXN1bHQ7XG4gICAgd2hpbGUgKChyZXN1bHQgPSByZWdleC5leGVjKHRleHQpKSAhPSBudWxsKSBjYWxsYmFjayhyZXN1bHQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNoYWRlcjtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBhZG5hbkBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cbid1c2Ugc3RyaWN0JztcbmZ1bmN0aW9uIFRleHR1cmUoZ2wsIHdpZHRoLCBoZWlnaHQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLmlkID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgIHRoaXMud2lkdGggPSBvcHRpb25zLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQ7XG4gICAgdGhpcy5mb3JtYXQgPSBvcHRpb25zLmZvcm1hdCB8fCBnbC5SR0JBO1xuICAgIHRoaXMudHlwZSA9IG9wdGlvbnMudHlwZSB8fCBnbC5VTlNJR05FRF9CWVRFO1xuICAgIHRoaXMuZ2wgPSBnbDtcblxuICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xuXG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy5pZCk7XG4gICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgMSk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsXG4gICAgICAgICAgICAgICAgICAgICBnbFtvcHRpb25zLmZpbHRlciB8fCBvcHRpb25zLm1hZ0ZpbHRlcl0gfHwgZ2wuTkVBUkVTVCk7XG5cbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUixcbiAgICAgICAgICAgICAgICAgICAgIGdsW29wdGlvbnMuZmlsdGVyIHx8IG9wdGlvbnMubWluRmlsdGVyXSB8fCBnbC5ORUFSRVNUKTtcblxuXG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUyxcbiAgICAgICAgICAgICAgICAgICAgIGdsW29wdGlvbnMud3JhcCB8fCBvcHRpb25zLndyYXBTXSB8fCBnbC5DTEFNUF9UT19FREdFKTtcblxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsXG4gICAgICAgICAgICAgICAgICAgICBnbFtvcHRpb25zLndyYXAgfHwgb3B0aW9ucy53cmFwU10gfHwgZ2wuQ0xBTVBfVE9fRURHRSk7XG5cbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIHRoaXMuZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCAwLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCBudWxsKTtcbn1cblxuVGV4dHVyZS5wcm90b3R5cGUgPSB7XG4gICAgYmluZDogZnVuY3Rpb24odW5pdCkge1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuICAgICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgKHVuaXQgfHwgMCkpO1xuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmlkKTtcbiAgICB9LFxuXG4gICAgdW5iaW5kOiBmdW5jdGlvbih1bml0KSB7XG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyAodW5pdCB8fCAwKSk7XG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgIH0sXG5cbiAgICBpbWFnZTogZnVuY3Rpb24gKGltZykge1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIGltZyk7XG4gICAgfSxcblxuICAgIHJlYWRCYWNrOiBmdW5jdGlvbih4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XG4gICAgICAgIHggPSB4IHx8IDA7XG4gICAgICAgIHkgPSB5IHx8IDA7XG4gICAgICAgIHdpZHRoID0gd2lkdGggfHwgdGhpcy53aWR0aDtcbiAgICAgICAgaGVpZ2h0ID0gaGVpZ2h0IHx8IHRoaXMuaGVpZ2h0O1xuICAgICAgICB2YXIgZmIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGZiKTtcbiAgICAgICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoZ2wuRlJBTUVCVUZGRVIsIGdsLkNPTE9SX0FUVEFDSE1FTlQwLCBnbC5URVhUVVJFXzJELCB0aGlzLmlkLCAwKTtcbiAgICAgICAgaWYgKGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpID09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICAgICAgICB2YXIgcGl4ZWxzID0gbmV3IFVpbnQ4QXJyYXkod2lkdGggKiBoZWlnaHQgKiA0KTtcbiAgICAgICAgICAgIGdsLnJlYWRQaXhlbHMoeCwgeSwgd2lkdGgsIGhlaWdodCwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgcGl4ZWxzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGl4ZWxzO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGV4dHVyZTtcblxuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcjogZGF2aWRAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaHJlZS1lbGVtZW50IGZsb2F0aW5nIHBvaW50IHZlY3Rvci5cbiAqXG4gKiBAY2xhc3MgVmVjdG9yXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0geCB4IGVsZW1lbnQgdmFsdWVcbiAqIEBwYXJhbSB7bnVtYmVyfSB5IHkgZWxlbWVudCB2YWx1ZVxuICogQHBhcmFtIHtudW1iZXJ9IHogeiBlbGVtZW50IHZhbHVlXG4gKi9cblxuZnVuY3Rpb24gVmVjdG9yKHgseSx6KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHRoaXMuc2V0KHgpO1xuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnggPSB4IHx8IDA7XG4gICAgICAgIHRoaXMueSA9IHkgfHwgMDtcbiAgICAgICAgdGhpcy56ID0geiB8fCAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn1cbnZhciBfcmVnaXN0ZXIgPSBuZXcgVmVjdG9yKDAsMCwwKTtcblxuLyoqXG4gKiBBZGQgdGhpcyBlbGVtZW50LXdpc2UgdG8gYW5vdGhlciBWZWN0b3IsIGVsZW1lbnQtd2lzZS5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZCBhZGRcbiAqIEBwYXJhbSB7VmVjdG9yfSB2IGFkZGVuZFxuICogQHJldHVybiB7VmVjdG9yfSB2ZWN0b3Igc3VtXG4gKi9cblZlY3Rvci5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkKHYpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKF9yZWdpc3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCArIHYueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSArIHYueSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueiArIHYuelxuICAgICAgICAgICAgICAgICAgICAgICApO1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdCBhbm90aGVyIHZlY3RvciBmcm9tIHRoaXMgdmVjdG9yLCBlbGVtZW50LXdpc2UuXG4gKiAgIE5vdGU6IFRoaXMgc2V0cyB0aGUgaW50ZXJuYWwgcmVzdWx0IHJlZ2lzdGVyLCBzbyBvdGhlciByZWZlcmVuY2VzIHRvIHRoYXQgdmVjdG9yIHdpbGwgY2hhbmdlLlxuICpcbiAqIEBtZXRob2Qgc3ViXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdiBzdWJ0cmFoZW5kXG4gKiBAcmV0dXJuIHtWZWN0b3J9IHZlY3RvciBkaWZmZXJlbmNlXG4gKi9cblZlY3Rvci5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24gc3ViKHYpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKF9yZWdpc3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCAtIHYueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSAtIHYueSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueiAtIHYuelxuICAgICAgICAgICAgICAgICAgICAgICApO1xufTtcblxuLyoqXG4gKiBTY2FsZSBWZWN0b3IgYnkgZmxvYXRpbmcgcG9pbnQgci5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZCBtdWx0XG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHIgc2NhbGFyXG4gKiBAcmV0dXJuIHtWZWN0b3J9IHZlY3RvciByZXN1bHRcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5tdWx0ID0gZnVuY3Rpb24gbXVsdChyKSB7XG4gICAgcmV0dXJuIF9zZXRYWVouY2FsbChfcmVnaXN0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICByICogdGhpcy54LFxuICAgICAgICAgICAgICAgICAgICAgICAgciAqIHRoaXMueSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgKiB0aGlzLnpcbiAgICAgICAgICAgICAgICAgICAgICAgKTtcbn07XG5cbi8qKlxuICogU2NhbGUgVmVjdG9yIGJ5IGZsb2F0aW5nIHBvaW50IDEvci5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZCBkaXZcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gciBzY2FsYXJcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gdmVjdG9yIHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLmRpdiA9IGZ1bmN0aW9uIGRpdihyKSB7XG4gICAgcmV0dXJuIHRoaXMubXVsdCgxIC8gcik7XG59O1xuXG4vKipcbiAqIEdpdmVuIGFub3RoZXIgdmVjdG9yIHYsIHJldHVybiBjcm9zcyBwcm9kdWN0ICh2KXgodGhpcykuXG4gKiAgIE5vdGU6IFRoaXMgc2V0cyB0aGUgaW50ZXJuYWwgcmVzdWx0IHJlZ2lzdGVyLCBzbyBvdGhlciByZWZlcmVuY2VzIHRvIHRoYXQgdmVjdG9yIHdpbGwgY2hhbmdlLlxuICpcbiAqIEBtZXRob2QgY3Jvc3NcbiAqIEBwYXJhbSB7VmVjdG9yfSB2IExlZnQgSGFuZCBWZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gdmVjdG9yIHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLmNyb3NzID0gZnVuY3Rpb24gY3Jvc3Modikge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuICAgIHZhciB2eCA9IHYueDtcbiAgICB2YXIgdnkgPSB2Lnk7XG4gICAgdmFyIHZ6ID0gdi56O1xuXG4gICAgcmV0dXJuIF9zZXRYWVouY2FsbChfcmVnaXN0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICB6ICogdnkgLSB5ICogdnosXG4gICAgICAgICAgICAgICAgICAgICAgICB4ICogdnogLSB6ICogdngsXG4gICAgICAgICAgICAgICAgICAgICAgICB5ICogdnggLSB4ICogdnlcbiAgICAgICAgICAgICAgICAgICAgICAgKTtcbn07XG5cbi8qKlxuICogQ29tcG9uZW50LXdpc2UgZXF1YWxpdHkgdGVzdCBiZXR3ZWVuIHRoaXMgYW5kIFZlY3RvciB2LlxuICogQG1ldGhvZCBlcXVhbHNcbiAqIEBwYXJhbSB7VmVjdG9yfSB2IHZlY3RvciB0byBjb21wYXJlXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5WZWN0b3IucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyh2KSB7XG4gICAgcmV0dXJuICh2LnggPT09IHRoaXMueCAmJiB2LnkgPT09IHRoaXMueSAmJiB2LnogPT09IHRoaXMueik7XG59O1xuXG4vKipcbiAqIFJvdGF0ZSBjbG9ja3dpc2UgYXJvdW5kIHgtYXhpcyBieSB0aGV0YSByYWRpYW5zLlxuICogICBOb3RlOiBUaGlzIHNldHMgdGhlIGludGVybmFsIHJlc3VsdCByZWdpc3Rlciwgc28gb3RoZXIgcmVmZXJlbmNlcyB0byB0aGF0IHZlY3RvciB3aWxsIGNoYW5nZS5cbiAqIEBtZXRob2Qgcm90YXRlWFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhIHJhZGlhbnNcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gcm90YXRlZCB2ZWN0b3JcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVYID0gZnVuY3Rpb24gcm90YXRlWCh0aGV0YSkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdmFyIGNvc1RoZXRhID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcblxuICAgIHJldHVybiBfc2V0WFlaLmNhbGwoX3JlZ2lzdGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgeCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgKiBjb3NUaGV0YSAtIHogKiBzaW5UaGV0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgKiBzaW5UaGV0YSArIHogKiBjb3NUaGV0YVxuICAgICAgICAgICAgICAgICAgICAgICApO1xufTtcblxuLyoqXG4gKiBSb3RhdGUgY2xvY2t3aXNlIGFyb3VuZCB5LWF4aXMgYnkgdGhldGEgcmFkaWFucy5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKiBAbWV0aG9kIHJvdGF0ZVlcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YSByYWRpYW5zXG4gKiBAcmV0dXJuIHtWZWN0b3J9IHJvdGF0ZWQgdmVjdG9yXG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWSA9IGZ1bmN0aW9uIHJvdGF0ZVkodGhldGEpIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHZhciBjb3NUaGV0YSA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luVGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XG5cbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKF9yZWdpc3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHogKiBzaW5UaGV0YSArIHggKiBjb3NUaGV0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHksXG4gICAgICAgICAgICAgICAgICAgICAgICB6ICogY29zVGhldGEgLSB4ICogc2luVGhldGFcbiAgICAgICAgICAgICAgICAgICAgICAgKTtcbn07XG5cbi8qKlxuICogUm90YXRlIGNsb2Nrd2lzZSBhcm91bmQgei1heGlzIGJ5IHRoZXRhIHJhZGlhbnMuXG4gKiAgIE5vdGU6IFRoaXMgc2V0cyB0aGUgaW50ZXJuYWwgcmVzdWx0IHJlZ2lzdGVyLCBzbyBvdGhlciByZWZlcmVuY2VzIHRvIHRoYXQgdmVjdG9yIHdpbGwgY2hhbmdlLlxuICogQG1ldGhvZCByb3RhdGVaXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGEgcmFkaWFuc1xuICogQHJldHVybiB7VmVjdG9yfSByb3RhdGVkIHZlY3RvclxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVogPSBmdW5jdGlvbiByb3RhdGVaKHRoZXRhKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuXG4gICAgcmV0dXJuIF9zZXRYWVouY2FsbChfcmVnaXN0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICB4ICogY29zVGhldGEgLSB5ICogc2luVGhldGEsXG4gICAgICAgICAgICAgICAgICAgICAgICB4ICogc2luVGhldGEgKyB5ICogY29zVGhldGEsXG4gICAgICAgICAgICAgICAgICAgICAgICB6XG4gICAgICAgICAgICAgICAgICAgICAgICk7XG59O1xuXG4vKipcbiAqIFJldHVybiBkb3QgcHJvZHVjdCBvZiB0aGlzIHdpdGggYSBzZWNvbmQgVmVjdG9yXG4gKiBAbWV0aG9kIGRvdFxuICogQHBhcmFtIHtWZWN0b3J9IHYgc2Vjb25kIHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfSBkb3QgcHJvZHVjdFxuICovXG5WZWN0b3IucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uIGRvdCh2KSB7XG4gICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueSArIHRoaXMueiAqIHYuejtcbn07XG5cbi8qKlxuICogUmV0dXJuIHNxdWFyZWQgbGVuZ3RoIG9mIHRoaXMgdmVjdG9yXG4gKiBAbWV0aG9kIG5vcm1TcXVhcmVkXG4gKiBAcmV0dXJuIHtudW1iZXJ9IHNxdWFyZWQgbGVuZ3RoXG4gKi9cblZlY3Rvci5wcm90b3R5cGUubm9ybVNxdWFyZWQgPSBmdW5jdGlvbiBub3JtU3F1YXJlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5kb3QodGhpcyk7XG59O1xuXG4vKipcbiAqIFJldHVybiBsZW5ndGggb2YgdGhpcyB2ZWN0b3JcbiAqIEBtZXRob2Qgbm9ybVxuICogQHJldHVybiB7bnVtYmVyfSBsZW5ndGhcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5ub3JtID0gZnVuY3Rpb24gbm9ybSgpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMubm9ybVNxdWFyZWQoKSk7XG59O1xuXG4vKipcbiAqIFNjYWxlIFZlY3RvciB0byBzcGVjaWZpZWQgbGVuZ3RoLlxuICogICBJZiBsZW5ndGggaXMgbGVzcyB0aGFuIGludGVybmFsIHRvbGVyYW5jZSwgc2V0IHZlY3RvciB0byBbbGVuZ3RoLCAwLCAwXS5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKiBAbWV0aG9kIG5vcm1hbGl6ZVxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGggdGFyZ2V0IGxlbmd0aCwgZGVmYXVsdCAxLjBcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbiBub3JtYWxpemUobGVuZ3RoKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIGxlbmd0aCA9IDE7XG4gICAgdmFyIG5vcm0gPSB0aGlzLm5vcm0oKTtcblxuICAgIGlmIChub3JtID4gMWUtNykgcmV0dXJuIF9zZXRGcm9tVmVjdG9yLmNhbGwoX3JlZ2lzdGVyLCB0aGlzLm11bHQobGVuZ3RoIC8gbm9ybSkpO1xuICAgIGVsc2UgcmV0dXJuIF9zZXRYWVouY2FsbChfcmVnaXN0ZXIsIGxlbmd0aCwgMCwgMCk7XG59O1xuXG4vKipcbiAqIE1ha2UgYSBzZXBhcmF0ZSBjb3B5IG9mIHRoZSBWZWN0b3IuXG4gKlxuICogQG1ldGhvZCBjbG9uZVxuICpcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKCkge1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMpO1xufTtcblxuLyoqXG4gKiBUcnVlIGlmIGFuZCBvbmx5IGlmIGV2ZXJ5IHZhbHVlIGlzIDAgKG9yIGZhbHN5KVxuICpcbiAqIEBtZXRob2QgaXNaZXJvXG4gKlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5pc1plcm8gPSBmdW5jdGlvbiBpc1plcm8oKSB7XG4gICAgcmV0dXJuICEodGhpcy54IHx8IHRoaXMueSB8fCB0aGlzLnopO1xufTtcblxuZnVuY3Rpb24gX3NldFhZWih4LHkseikge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLnogPSB6O1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBfc2V0RnJvbUFycmF5KHYpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKHRoaXMsdlswXSx2WzFdLHZbMl0gfHwgMCk7XG59XG5cbmZ1bmN0aW9uIF9zZXRGcm9tVmVjdG9yKHYpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKHRoaXMsIHYueCwgdi55LCB2LnopO1xufVxuXG5mdW5jdGlvbiBfc2V0RnJvbU51bWJlcih4KSB7XG4gICAgcmV0dXJuIF9zZXRYWVouY2FsbCh0aGlzLHgsMCwwKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhpcyBWZWN0b3IgdG8gdGhlIHZhbHVlcyBpbiB0aGUgcHJvdmlkZWQgQXJyYXkgb3IgVmVjdG9yLlxuICpcbiAqIEBtZXRob2Qgc2V0XG4gKiBAcGFyYW0ge29iamVjdH0gdiBhcnJheSwgVmVjdG9yLCBvciBudW1iZXJcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gdGhpc1xuICovXG5WZWN0b3IucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCh2KSB7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBBcnJheSkgICAgcmV0dXJuIF9zZXRGcm9tQXJyYXkuY2FsbCh0aGlzLCB2KTtcbiAgICBpZiAodiBpbnN0YW5jZW9mIFZlY3RvcikgICByZXR1cm4gX3NldEZyb21WZWN0b3IuY2FsbCh0aGlzLCB2KTtcbiAgICBpZiAodHlwZW9mIHYgPT09ICdudW1iZXInKSByZXR1cm4gX3NldEZyb21OdW1iZXIuY2FsbCh0aGlzLCB2KTtcbn07XG5cblZlY3Rvci5wcm90b3R5cGUuc2V0WFlaID0gZnVuY3Rpb24oeCx5LHopIHtcbiAgICByZXR1cm4gX3NldFhZWi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxuVmVjdG9yLnByb3RvdHlwZS5zZXQxRCA9IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4gX3NldEZyb21OdW1iZXIuY2FsbCh0aGlzLCB4KTtcbn07XG5cbi8qKlxuICogUHV0IHJlc3VsdCBvZiBsYXN0IGludGVybmFsIHJlZ2lzdGVyIGNhbGN1bGF0aW9uIGluIHNwZWNpZmllZCBvdXRwdXQgdmVjdG9yLlxuICpcbiAqIEBtZXRob2QgcHV0XG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdiBkZXN0aW5hdGlvbiB2ZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gZGVzdGluYXRpb24gdmVjdG9yXG4gKi9cblxuVmVjdG9yLnByb3RvdHlwZS5wdXQgPSBmdW5jdGlvbiBwdXQodikge1xuICAgIGlmICh0aGlzID09PSBfcmVnaXN0ZXIpIF9zZXRGcm9tVmVjdG9yLmNhbGwodiwgX3JlZ2lzdGVyKTtcbiAgICBlbHNlIF9zZXRGcm9tVmVjdG9yLmNhbGwodiwgdGhpcyk7XG59O1xuXG4vKipcbiAqIFNldCB0aGlzIHZlY3RvciB0byBbMCwwLDBdXG4gKlxuICogQG1ldGhvZCBjbGVhclxuICovXG5WZWN0b3IucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgcmV0dXJuIF9zZXRYWVouY2FsbCh0aGlzLDAsMCwwKTtcbn07XG5cbi8qKlxuICogU2NhbGUgdGhpcyBWZWN0b3IgZG93biB0byBzcGVjaWZpZWQgXCJjYXBcIiBsZW5ndGguXG4gKiAgIElmIFZlY3RvciBzaG9ydGVyIHRoYW4gY2FwLCBvciBjYXAgaXMgSW5maW5pdHksIGRvIG5vdGhpbmcuXG4gKiAgIE5vdGU6IFRoaXMgc2V0cyB0aGUgaW50ZXJuYWwgcmVzdWx0IHJlZ2lzdGVyLCBzbyBvdGhlciByZWZlcmVuY2VzIHRvIHRoYXQgdmVjdG9yIHdpbGwgY2hhbmdlLlxuICpcbiAqIEBtZXRob2QgY2FwXG4gKiBAcmV0dXJuIHtWZWN0b3J9IGNhcHBlZCB2ZWN0b3JcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5jYXAgPSBmdW5jdGlvbiB2ZWN0b3JDYXAoY2FwKSB7XG4gICAgaWYgKGNhcCA9PT0gSW5maW5pdHkpIHJldHVybiBfc2V0RnJvbVZlY3Rvci5jYWxsKF9yZWdpc3RlciwgdGhpcyk7XG4gICAgdmFyIG5vcm0gPSB0aGlzLm5vcm0oKTtcbiAgICBpZiAobm9ybSA+IGNhcCkgcmV0dXJuIF9zZXRGcm9tVmVjdG9yLmNhbGwoX3JlZ2lzdGVyLCB0aGlzLm11bHQoY2FwIC8gbm9ybSkpO1xuICAgIGVsc2UgcmV0dXJuIF9zZXRGcm9tVmVjdG9yLmNhbGwoX3JlZ2lzdGVyLCB0aGlzKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIHByb2plY3Rpb24gb2YgdGhpcyBWZWN0b3Igb250byBhbm90aGVyLlxuICogICBOb3RlOiBUaGlzIHNldHMgdGhlIGludGVybmFsIHJlc3VsdCByZWdpc3Rlciwgc28gb3RoZXIgcmVmZXJlbmNlcyB0byB0aGF0IHZlY3RvciB3aWxsIGNoYW5nZS5cbiAqXG4gKiBAbWV0aG9kIHByb2plY3RcbiAqIEBwYXJhbSB7VmVjdG9yfSBuIHZlY3RvciB0byBwcm9qZWN0IHVwb25cbiAqIEByZXR1cm4ge1ZlY3Rvcn0gcHJvamVjdGVkIHZlY3RvclxuICovXG5WZWN0b3IucHJvdG90eXBlLnByb2plY3QgPSBmdW5jdGlvbiBwcm9qZWN0KG4pIHtcbiAgICByZXR1cm4gbi5tdWx0KHRoaXMuZG90KG4pKTtcbn07XG5cbi8qKlxuICogUmVmbGVjdCB0aGlzIFZlY3RvciBhY3Jvc3MgcHJvdmlkZWQgdmVjdG9yLlxuICogICBOb3RlOiBUaGlzIHNldHMgdGhlIGludGVybmFsIHJlc3VsdCByZWdpc3Rlciwgc28gb3RoZXIgcmVmZXJlbmNlcyB0byB0aGF0IHZlY3RvciB3aWxsIGNoYW5nZS5cbiAqXG4gKiBAbWV0aG9kIHJlZmxlY3RBY3Jvc3NcbiAqIEBwYXJhbSB7VmVjdG9yfSBuIHZlY3RvciB0byByZWZsZWN0IGFjcm9zc1xuICogQHJldHVybiB7VmVjdG9yfSByZWZsZWN0ZWQgdmVjdG9yXG4gKi9cblZlY3Rvci5wcm90b3R5cGUucmVmbGVjdEFjcm9zcyA9IGZ1bmN0aW9uIHJlZmxlY3RBY3Jvc3Mobikge1xuICAgIG4ubm9ybWFsaXplKCkucHV0KG4pO1xuICAgIHJldHVybiBfc2V0RnJvbVZlY3RvcihfcmVnaXN0ZXIsIHRoaXMuc3ViKHRoaXMucHJvamVjdChuKS5tdWx0KDIpKSk7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgVmVjdG9yIHRvIHRocmVlLWVsZW1lbnQgYXJyYXkuXG4gKlxuICogQG1ldGhvZCBnZXRcbiAqIEByZXR1cm4ge2FycmF5PG51bWJlcj59IHRocmVlLWVsZW1lbnQgYXJyYXlcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQoKSB7XG4gICAgcmV0dXJuIFt0aGlzLngsIHRoaXMueSwgdGhpcy56XTtcbn07XG5cblZlY3Rvci5wcm90b3R5cGUuZ2V0MUQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy54O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3I7XG5cblxuVmVjdG9yLnByb3RvdHlwZS50aW1lcyA9IGZ1bmN0aW9uIHRpbWVzKHYpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKF9yZWdpc3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCAqIHYueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSAqIHYueSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueiAqIHYuelxuICAgICAgICAgICAgICAgICAgICAgICApO1xufVxuXG5cblZlY3Rvci5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW3RoaXMueCwgdGhpcy55LCB0aGlzLnpdXG59XG5cblZlY3Rvci5mcm9tQXJyYXkgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiBuZXcgVmVjdG9yKGFbMF0sIGFbMV0sIGFbMl0pO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBtdWx0aXBseShvdXRwdXRBcnJheSwgbGVmdCwgcmlnaHQpIHtcbiAgICB2YXIgYTAwID0gbGVmdFswXSwgIGEwMSA9IGxlZnRbMV0sICBhMDIgPSBsZWZ0WzJdLCAgYTAzID0gbGVmdFszXSxcbiAgICAgICAgYTEwID0gbGVmdFs0XSwgIGExMSA9IGxlZnRbNV0sICBhMTIgPSBsZWZ0WzZdLCAgYTEzID0gbGVmdFs3XSxcbiAgICAgICAgYTIwID0gbGVmdFs4XSwgIGEyMSA9IGxlZnRbOV0sICBhMjIgPSBsZWZ0WzEwXSwgYTIzID0gbGVmdFsxMV0sXG4gICAgICAgIGEzMCA9IGxlZnRbMTJdLCBhMzEgPSBsZWZ0WzEzXSwgYTMyID0gbGVmdFsxNF0sIGEzMyA9IGxlZnRbMTVdO1xuICAgIFxuICAgIHZhciBiMCA9IHJpZ2h0WzBdLCBiMSA9IHJpZ2h0WzFdLCBiMiA9IHJpZ2h0WzJdLCBiMyA9IHJpZ2h0WzNdOyBcblxuICAgIG91dHB1dEFycmF5WzBdID0gYjAqYTAwICsgYjEqYTEwICsgYjIqYTIwICsgYjMqYTMwO1xuICAgIG91dHB1dEFycmF5WzFdID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dHB1dEFycmF5WzJdID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dHB1dEFycmF5WzNdID0gYjAqYTAzICsgYjEqYTEzICsgYjIqYTIzICsgYjMqYTMzO1xuICAgIFxuICAgIGIwID0gcmlnaHRbNF07IGIxID0gcmlnaHRbNV07IGIyID0gcmlnaHRbNl07IGIzID0gcmlnaHRbN107XG5cbiAgICBvdXRwdXRBcnJheVs0XSA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXRwdXRBcnJheVs1XSA9IGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMTtcbiAgICBvdXRwdXRBcnJheVs2XSA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXRwdXRBcnJheVs3XSA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcbiAgICBcbiAgICBiMCA9IHJpZ2h0WzhdOyBiMSA9IHJpZ2h0WzldOyBiMiA9IHJpZ2h0WzEwXTsgYjMgPSByaWdodFsxMV07XG5cbiAgICBvdXRwdXRBcnJheVs4XSAgPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0cHV0QXJyYXlbOV0gID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dHB1dEFycmF5WzEwXSA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXRwdXRBcnJheVsxMV0gPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG4gICAgXG4gICAgYjAgPSByaWdodFsxMl07IGIxID0gcmlnaHRbMTNdOyBiMiA9IHJpZ2h0WzE0XTsgYjMgPSByaWdodFsxNV07XG5cbiAgICBvdXRwdXRBcnJheVsxMl0gPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0cHV0QXJyYXlbMTNdID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dHB1dEFycmF5WzE0XSA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXRwdXRBcnJheVsxNV0gPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG4gICAgcmV0dXJuIG91dHB1dEFycmF5O1xufVxuXG5cbmZ1bmN0aW9uIGdldFRyYW5zbGF0aW9uRnJvbU11bHRpcGxpY2F0aW9uKG91dHB1dEFycmF5LCBsZWZ0LCByaWdodCkge1xuICAgIHZhciBhMDAgPSBsZWZ0WzBdLCAgYTAxID0gbGVmdFsxXSxcbiAgICAgICAgYTEwID0gbGVmdFs0XSwgIGExMSA9IGxlZnRbNV0sXG4gICAgICAgIGEyMCA9IGxlZnRbOF0sICBhMjEgPSBsZWZ0WzldLFxuICAgICAgICBhMzAgPSBsZWZ0WzEyXSwgYTMxID0gbGVmdFsxM107XG5cbiAgICB2YXIgYjAgPSByaWdodFsxMl0sXG4gICAgICAgIGIxID0gcmlnaHRbMTNdLFxuICAgICAgICBiMiA9IHJpZ2h0WzE0XSxcbiAgICAgICAgYjMgPSByaWdodFsxNV07XG5cbiAgICBvdXRwdXRBcnJheVswXSA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXRwdXRBcnJheVsxXSA9IGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMTtcbiAgICByZXR1cm4gb3V0cHV0QXJyYXk7XG59XG5cbmZ1bmN0aW9uIGludmVydChvdXRwdXRBcnJheSwgbWF0cml4KSB7XG4gICAgdmFyIGEwMCA9IG1hdHJpeFswXSwgIGEwMSA9IG1hdHJpeFsxXSwgIGEwMiA9IG1hdHJpeFsyXSwgIGEwMyA9IG1hdHJpeFszXSxcbiAgICAgICAgYTEwID0gbWF0cml4WzRdLCAgYTExID0gbWF0cml4WzVdLCAgYTEyID0gbWF0cml4WzZdLCAgYTEzID0gbWF0cml4WzddLFxuICAgICAgICBhMjAgPSBtYXRyaXhbOF0sICBhMjEgPSBtYXRyaXhbOV0sICBhMjIgPSBtYXRyaXhbMTBdLCBhMjMgPSBtYXRyaXhbMTFdLFxuICAgICAgICBhMzAgPSBtYXRyaXhbMTJdLCBhMzEgPSBtYXRyaXhbMTNdLCBhMzIgPSBtYXRyaXhbMTRdLCBhMzMgPSBtYXRyaXhbMTVdLFxuXG4gICAgICAgIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCxcbiAgICAgICAgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLFxuICAgICAgICBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsXG4gICAgICAgIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSxcbiAgICAgICAgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLFxuICAgICAgICBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsXG4gICAgICAgIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCxcbiAgICAgICAgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLFxuICAgICAgICBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsXG4gICAgICAgIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSxcbiAgICAgICAgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLFxuICAgICAgICBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzIsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICAgICAgICBkZXQgPSBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XG5cbiAgICBpZiAoIWRldCkgcmV0dXJuIG51bGw7XG4gICAgZGV0ID0gMS4wIC8gZGV0O1xuXG4gICAgb3V0cHV0QXJyYXlbMF0gID0gKGExMSAqIGIxMSAtIGExMiAqIGIxMCArIGExMyAqIGIwOSkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMV0gID0gKGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMl0gID0gKGEzMSAqIGIwNSAtIGEzMiAqIGIwNCArIGEzMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbM10gID0gKGEyMiAqIGIwNCAtIGEyMSAqIGIwNSAtIGEyMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbNF0gID0gKGExMiAqIGIwOCAtIGExMCAqIGIxMSAtIGExMyAqIGIwNykgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbNV0gID0gKGEwMCAqIGIxMSAtIGEwMiAqIGIwOCArIGEwMyAqIGIwNykgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbNl0gID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbN10gID0gKGEyMCAqIGIwNSAtIGEyMiAqIGIwMiArIGEyMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbOF0gID0gKGExMCAqIGIxMCAtIGExMSAqIGIwOCArIGExMyAqIGIwNikgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbOV0gID0gKGEwMSAqIGIwOCAtIGEwMCAqIGIxMCAtIGEwMyAqIGIwNikgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMTBdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMTFdID0gKGEyMSAqIGIwMiAtIGEyMCAqIGIwNCAtIGEyMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMTJdID0gKGExMSAqIGIwNyAtIGExMCAqIGIwOSAtIGExMiAqIGIwNikgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMTNdID0gKGEwMCAqIGIwOSAtIGEwMSAqIGIwNyArIGEwMiAqIGIwNikgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMTRdID0gKGEzMSAqIGIwMSAtIGEzMCAqIGIwMyAtIGEzMiAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMTVdID0gKGEyMCAqIGIwMyAtIGEyMSAqIGIwMSArIGEyMiAqIGIwMCkgKiBkZXQ7XG4gICAgcmV0dXJuIG91dHB1dEFycmF5O1xufVxuXG5mdW5jdGlvbiBnZXRXZnJvbU11bHRpcGxpY2F0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgdmFyIGEwMCA9IGxlZnRbMF0sICBhMDEgPSBsZWZ0WzFdLCAgYTAyID0gbGVmdFsyXSwgIGEwMyA9IGxlZnRbM10sXG4gICAgICAgIGExMCA9IGxlZnRbNF0sICBhMTEgPSBsZWZ0WzVdLCAgYTEyID0gbGVmdFs2XSwgIGExMyA9IGxlZnRbN10sXG4gICAgICAgIGEyMCA9IGxlZnRbOF0sICBhMjEgPSBsZWZ0WzldLCAgYTIyID0gbGVmdFsxMF0sIGEyMyA9IGxlZnRbMTFdLFxuICAgICAgICBhMzAgPSBsZWZ0WzEyXSwgYTMxID0gbGVmdFsxM10sIGEzMiA9IGxlZnRbMTRdLCBhMzMgPSBsZWZ0WzE1XTtcblxuICAgIHZhciBiMCA9IHJpZ2h0WzEyXSwgYjEgPSByaWdodFsxM10sIGIyID0gcmlnaHRbMTRdLCBiMyA9IHJpZ2h0WzE1XTtcblxuICAgIHJldHVybiBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzAgKyBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzEgKyBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzIgKyBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG59XG5cbmZ1bmN0aW9uIGFwcGx5VG9WZWN0b3Iob3V0cHV0LCBtYXRyaXgsIHZlY3Rvcikge1xuICAgIHZhciBhMDAgPSBtYXRyaXhbMF0sICBhMDEgPSBtYXRyaXhbMV0sICBhMDIgPSBtYXRyaXhbMl0sICBhMDMgPSBtYXRyaXhbM10sXG4gICAgICAgIGExMCA9IG1hdHJpeFs0XSwgIGExMSA9IG1hdHJpeFs1XSwgIGExMiA9IG1hdHJpeFs2XSwgIGExMyA9IG1hdHJpeFs3XSxcbiAgICAgICAgYTIwID0gbWF0cml4WzhdLCAgYTIxID0gbWF0cml4WzldLCAgYTIyID0gbWF0cml4WzEwXSwgYTIzID0gbWF0cml4WzExXSxcbiAgICAgICAgYTMwID0gbWF0cml4WzEyXSwgYTMxID0gbWF0cml4WzEzXSwgYTMyID0gbWF0cml4WzE0XSwgYTMzID0gbWF0cml4WzE1XTtcblxuICAgIHZhciB2MCA9IHZlY3RvclswXSwgdjEgPSB2ZWN0b3JbMV0sIHYyID0gdmVjdG9yWzJdLCB2MyA9IHZlY3RvclszXTtcblxuICAgIG91dHB1dFswXSA9IGEwMCAqIHYwICsgYTEwICogdjEgKyBhMjAgKiB2MiArIGEzMCAqIHYzO1xuICAgIG91dHB1dFsxXSA9IGEwMSAqIHYwICsgYTExICogdjEgKyBhMjEgKiB2MiArIGEzMSAqIHYzO1xuICAgIG91dHB1dFsyXSA9IGEwMiAqIHYwICsgYTEyICogdjEgKyBhMjIgKiB2MiArIGEzMiAqIHYzO1xuICAgIG91dHB1dFszXSA9IGEwMyAqIHYwICsgYTEzICogdjEgKyBhMjMgKiB2MiArIGEzMyAqIHYzO1xuXG4gICAgcmV0dXJuIG91dHB1dDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbXVsdGlwbHkgICAgICAgICAgICAgICAgICAgICAgICAgOiBtdWx0aXBseSxcbiAgICBnZXRUcmFuc2xhdGlvbkZyb21NdWx0aXBsaWNhdGlvbiA6IGdldFRyYW5zbGF0aW9uRnJvbU11bHRpcGxpY2F0aW9uLFxuICAgIGludmVydCAgICAgICAgICAgICAgICAgICAgICAgICAgIDogaW52ZXJ0LFxuICAgIElERU5USVRZICAgICAgICAgICAgICAgICAgICAgICAgIDogbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pLFxuICAgIGdldFdmcm9tTXVsdGlwbGljYXRpb24gICAgICAgICAgIDogZ2V0V2Zyb21NdWx0aXBsaWNhdGlvbixcbiAgICBhcHBseVRvVmVjdG9yICAgICAgICAgICAgICAgICAgICA6IGFwcGx5VG9WZWN0b3Jcbn07IiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuLi9jb3JlL0VudGl0eVJlZ2lzdHJ5Jyk7XG52YXIgbGlmdFJvb3RzICAgICAgPSBFbnRpdHlSZWdpc3RyeS5hZGRMYXllcignTGlmdCcpO1xuXG4vKipcbiAqIExpZnRTeXN0ZW0gaXMgcmVzcG9uc2libGUgZm9yIHRyYXZlcnNpbmcgdGhlIHNjZW5lIGdyYXBoIGFuZFxuICogICB1cGRhdGluZyB0aGUgVHJhbnNmb3JtcywgU2l6ZXMsIGFuZCBPcGFjaXRpZXMgb2YgdGhlIGVudGl0aWVzLlxuICpcbiAqIEBjbGFzcyAgTGlmdFN5c3RlbVxuICogQHN5c3RlbVxuICogQHNpbmdsZXRvblxuICovXG52YXIgTGlmdFN5c3RlbSA9IHt9O1xuXG4vKipcbiAqIHVwZGF0ZSBpdGVyYXRlcyBvdmVyIGVhY2ggb2YgdGhlIENvbnRleHRzIHRoYXQgd2VyZSByZWdpc3RlcmVkIGFuZFxuICogICBraWNrcyBvZiB0aGUgcmVjdXJzaXZlIHVwZGF0aW5nIG9mIHRoZWlyIGVudGl0aWVzLlxuICpcbiAqIEBtZXRob2QgdXBkYXRlXG4gKi9cbnZhciB0ZXN0ID0gW107XG5MaWZ0U3lzdGVtLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICB2YXIgcm9vdFBhcmFtcztcbiAgICB2YXIgY2xlYW51cCA9IFtdO1xuICAgIHZhciBsaWZ0O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaWZ0Um9vdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGlmdCA9IGxpZnRSb290c1tpXS5nZXRDb21wb25lbnQoJ0xpZnRDb21wb25lbnQnKTtcbiAgICAgICAgcm9vdFBhcmFtcyA9IGxpZnQuX3VwZGF0ZSgpO1xuICAgICAgICByb290UGFyYW1zLnVuc2hpZnQobGlmdFJvb3RzW2ldKTtcbiAgICAgICAgY29yZVVwZGF0ZUFuZEZlZWQuYXBwbHkobnVsbCwgcm9vdFBhcmFtcyk7XG5cbiAgICAgICAgaWYgKGxpZnQuZG9uZSkge1xuICAgICAgICAgICAgbGlmdFJvb3RzW2ldLnJlbW92ZUNvbXBvbmVudCgnTGlmdENvbXBvbmVudCcpO1xuICAgICAgICAgICAgRW50aXR5UmVnaXN0cnkuZGVyZWdpc3RlcihsaWZ0Um9vdHNbaV0sICdMaWZ0Jyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogY29yZVVwZGF0ZUFuZEZlZWQgZmVlZHMgcGFyZW50IGluZm9ybWF0aW9uIHRvIGFuIGVudGl0eSBhbmQgc28gdGhhdFxuICogICBlYWNoIGVudGl0eSBjYW4gdXBkYXRlIHRoZWlyIHRyYW5zZm9ybS4gIEl0IFxuICogICB3aWxsIHRoZW4gcGFzcyBkb3duIGludmFsaWRhdGlvbiBzdGF0ZXMgYW5kIHZhbHVlcyB0byBhbnkgY2hpbGRyZW4uXG4gKlxuICogQG1ldGhvZCBjb3JlVXBkYXRlQW5kRmVlZFxuICogQHByaXZhdGVcbiAqICAgXG4gKiBAcGFyYW0gIHtFbnRpdHl9ICBlbnRpdHkgICAgICAgICAgIEVudGl0eSBpbiB0aGUgc2NlbmUgZ3JhcGhcbiAqIEBwYXJhbSAge051bWJlcn0gIHRyYW5zZm9ybVJlcG9ydCAgYml0U2NoZW1lIHJlcG9ydCBvZiB0cmFuc2Zvcm0gaW52YWxpZGF0aW9uc1xuICogQHBhcmFtICB7QXJyYXl9ICAgaW5jb21pbmdNYXRyaXggICBwYXJlbnQgdHJhbnNmb3JtIGFzIGEgRmxvYXQzMiBBcnJheVxuICovXG5mdW5jdGlvbiBjb3JlVXBkYXRlQW5kRmVlZChlbnRpdHksIHRyYW5zZm9ybVJlcG9ydCwgaW5jb21pbmdNYXRyaXgpIHtcbiAgICBpZiAoIWVudGl0eSkgcmV0dXJuO1xuICAgIHZhciB0cmFuc2Zvcm0gPSBlbnRpdHkuZ2V0Q29tcG9uZW50KCd0cmFuc2Zvcm0nKTtcbiAgICB2YXIgaSAgICAgICAgID0gZW50aXR5Ll9jaGlsZHJlbi5sZW5ndGg7XG5cbiAgICB0cmFuc2Zvcm1SZXBvcnQgPSB0cmFuc2Zvcm0uX3VwZGF0ZSh0cmFuc2Zvcm1SZXBvcnQsIGluY29taW5nTWF0cml4KTtcblxuICAgIHdoaWxlIChpLS0pIFxuICAgICAgICBjb3JlVXBkYXRlQW5kRmVlZChcbiAgICAgICAgICAgIGVudGl0eS5fY2hpbGRyZW5baV0sXG4gICAgICAgICAgICB0cmFuc2Zvcm1SZXBvcnQsXG4gICAgICAgICAgICB0cmFuc2Zvcm0uX21hdHJpeCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGlmdFN5c3RlbTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG4vKipcbiAqIEV2ZW50RW1pdHRlciByZXByZXNlbnRzIGEgY2hhbm5lbCBmb3IgZXZlbnRzLlxuICpcbiAqIEBjbGFzcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSB7fTtcbiAgICB0aGlzLl9vd25lciA9IHRoaXM7XG59XG5cbi8qKlxuICogVHJpZ2dlciBhbiBldmVudCwgc2VuZGluZyB0byBhbGwgZG93bnN0cmVhbSBoYW5kbGVyc1xuICogICBsaXN0ZW5pbmcgZm9yIHByb3ZpZGVkICd0eXBlJyBrZXkuXG4gKlxuICogQG1ldGhvZCBlbWl0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IGV2ZW50IGRhdGFcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUsIGV2ZW50KSB7XG4gICAgdmFyIGhhbmRsZXJzID0gdGhpcy5saXN0ZW5lcnNbdHlwZV07XG4gICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2ldLmNhbGwodGhpcy5fb3duZXIsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIFwib25cIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBoYW5kbGVyIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgICBpZiAoISh0eXBlIGluIHRoaXMubGlzdGVuZXJzKSkgdGhpcy5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5pbmRleE9mKGhhbmRsZXIpO1xuICAgIGlmIChpbmRleCA8IDApIHRoaXMubGlzdGVuZXJzW3R5cGVdLnB1c2goaGFuZGxlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBcIm9uXCIuXG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vKipcbiAqIFVuYmluZCBhbiBldmVudCBieSB0eXBlIGFuZCBoYW5kbGVyLlxuICogICBUaGlzIHVuZG9lcyB0aGUgd29yayBvZiBcIm9uXCIuXG4gKlxuICogQG1ldGhvZCByZW1vdmVMaXN0ZW5lclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGhhbmRsZXIgZnVuY3Rpb24gb2JqZWN0IHRvIHJlbW92ZVxuICogQHJldHVybiB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcih0eXBlLCBoYW5kbGVyKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5saXN0ZW5lcnNbdHlwZV0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICBpZiAoaW5kZXggPj0gMCkgdGhpcy5saXN0ZW5lcnNbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2FsbCBldmVudCBoYW5kbGVycyB3aXRoIHRoaXMgc2V0IHRvIG93bmVyLlxuICpcbiAqIEBtZXRob2QgYmluZFRoaXNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3duZXIgb2JqZWN0IHRoaXMgRXZlbnRFbWl0dGVyIGJlbG9uZ3MgdG9cbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5iaW5kVGhpcyA9IGZ1bmN0aW9uIGJpbmRUaGlzKG93bmVyKSB7XG4gICAgdGhpcy5fb3duZXIgPSBvd25lcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyOyIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnLi9FdmVudEVtaXR0ZXInKTtcblxuLyoqXG4gKiBFdmVudEhhbmRsZXIgZm9yd2FyZHMgcmVjZWl2ZWQgZXZlbnRzIHRvIGEgc2V0IG9mIHByb3ZpZGVkIGNhbGxiYWNrIGZ1bmN0aW9ucy5cbiAqIEl0IGFsbG93cyBldmVudHMgdG8gYmUgY2FwdHVyZWQsIHByb2Nlc3NlZCwgYW5kIG9wdGlvbmFsbHkgcGlwZWQgdGhyb3VnaCB0byBvdGhlciBldmVudCBoYW5kbGVycy5cbiAqXG4gKiBAY2xhc3MgRXZlbnRIYW5kbGVyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEhhbmRsZXIoKSB7XG4gICAgRXZlbnRFbWl0dGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmRvd25zdHJlYW0gPSBbXTsgLy8gZG93bnN0cmVhbSBldmVudCBoYW5kbGVyc1xuICAgIHRoaXMuZG93bnN0cmVhbUZuID0gW107IC8vIGRvd25zdHJlYW0gZnVuY3Rpb25zXG5cbiAgICB0aGlzLnVwc3RyZWFtID0gW107IC8vIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXJzXG4gICAgdGhpcy51cHN0cmVhbUxpc3RlbmVycyA9IHt9OyAvLyB1cHN0cmVhbSBsaXN0ZW5lcnNcbn1cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50RW1pdHRlci5wcm90b3R5cGUpO1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEV2ZW50SGFuZGxlcjtcblxuLyoqXG4gKiBBc3NpZ24gYW4gZXZlbnQgaGFuZGxlciB0byByZWNlaXZlIGFuIG9iamVjdCdzIGlucHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldElucHV0SGFuZGxlclxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb2JqZWN0IHRvIG1peCB0cmlnZ2VyLCBzdWJzY3JpYmUsIGFuZCB1bnN1YnNjcmliZSBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyID0gZnVuY3Rpb24gc2V0SW5wdXRIYW5kbGVyKG9iamVjdCwgaGFuZGxlcikge1xuICAgIG9iamVjdC50cmlnZ2VyID0gaGFuZGxlci50cmlnZ2VyLmJpbmQoaGFuZGxlcik7XG4gICAgaWYgKGhhbmRsZXIuc3Vic2NyaWJlICYmIGhhbmRsZXIudW5zdWJzY3JpYmUpIHtcbiAgICAgICAgb2JqZWN0LnN1YnNjcmliZSA9IGhhbmRsZXIuc3Vic2NyaWJlLmJpbmQoaGFuZGxlcik7XG4gICAgICAgIG9iamVjdC51bnN1YnNjcmliZSA9IGhhbmRsZXIudW5zdWJzY3JpYmUuYmluZChoYW5kbGVyKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEFzc2lnbiBhbiBldmVudCBoYW5kbGVyIHRvIHJlY2VpdmUgYW4gb2JqZWN0J3Mgb3V0cHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldE91dHB1dEhhbmRsZXJcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9iamVjdCB0byBtaXggcGlwZSwgdW5waXBlLCBvbiwgYWRkTGlzdGVuZXIsIGFuZCByZW1vdmVMaXN0ZW5lciBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlciA9IGZ1bmN0aW9uIHNldE91dHB1dEhhbmRsZXIob2JqZWN0LCBoYW5kbGVyKSB7XG4gICAgaWYgKGhhbmRsZXIgaW5zdGFuY2VvZiBFdmVudEhhbmRsZXIpIGhhbmRsZXIuYmluZFRoaXMob2JqZWN0KTtcbiAgICBvYmplY3QucGlwZSA9IGhhbmRsZXIucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC51bnBpcGUgPSBoYW5kbGVyLnVucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC5vbiA9IGhhbmRsZXIub24uYmluZChoYW5kbGVyKTtcbiAgICBvYmplY3QuYWRkTGlzdGVuZXIgPSBvYmplY3Qub247XG4gICAgb2JqZWN0LnJlbW92ZUxpc3RlbmVyID0gaGFuZGxlci5yZW1vdmVMaXN0ZW5lci5iaW5kKGhhbmRsZXIpO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VyIGFuIGV2ZW50LCBzZW5kaW5nIHRvIGFsbCBkb3duc3RyZWFtIGhhbmRsZXJzXG4gKiAgIGxpc3RlbmluZyBmb3IgcHJvdmlkZWQgJ3R5cGUnIGtleS5cbiAqXG4gKiBAbWV0aG9kIGVtaXRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgZXZlbnQgZGF0YVxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSwgZXZlbnQpIHtcbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5kb3duc3RyZWFtW2ldLnRyaWdnZXIpIHRoaXMuZG93bnN0cmVhbVtpXS50cmlnZ2VyKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbUZuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZG93bnN0cmVhbUZuW2ldKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBlbWl0XG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudHJpZ2dlciA9IEV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdDtcblxuLyoqXG4gKiBBZGQgZXZlbnQgaGFuZGxlciBvYmplY3QgdG8gc2V0IG9mIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKlxuICogQG1ldGhvZCBwaXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCBldmVudCBoYW5kbGVyIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcGFzc2VkIGV2ZW50IGhhbmRsZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24gcGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnN1YnNjcmliZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSByZXR1cm4gdGFyZ2V0LnN1YnNjcmliZSh0aGlzKTtcblxuICAgIHZhciBkb3duc3RyZWFtQ3R4ID0gKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/IHRoaXMuZG93bnN0cmVhbUZuIDogdGhpcy5kb3duc3RyZWFtO1xuICAgIHZhciBpbmRleCA9IGRvd25zdHJlYW1DdHguaW5kZXhPZih0YXJnZXQpO1xuICAgIGlmIChpbmRleCA8IDApIGRvd25zdHJlYW1DdHgucHVzaCh0YXJnZXQpO1xuXG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB0YXJnZXQoJ3BpcGUnLCBudWxsKTtcbiAgICBlbHNlIGlmICh0YXJnZXQudHJpZ2dlcikgdGFyZ2V0LnRyaWdnZXIoJ3BpcGUnLCBudWxsKTtcblxuICAgIHJldHVybiB0YXJnZXQ7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBoYW5kbGVyIG9iamVjdCBmcm9tIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICogICBVbmRvZXMgd29yayBvZiBcInBpcGVcIi5cbiAqXG4gKiBAbWV0aG9kIHVucGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgdGFyZ2V0IGhhbmRsZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHByb3ZpZGVkIHRhcmdldFxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnVucGlwZSA9IGZ1bmN0aW9uIHVucGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnVuc3Vic2NyaWJlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiB0YXJnZXQudW5zdWJzY3JpYmUodGhpcyk7XG5cbiAgICB2YXIgZG93bnN0cmVhbUN0eCA9ICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgPyB0aGlzLmRvd25zdHJlYW1GbiA6IHRoaXMuZG93bnN0cmVhbTtcbiAgICB2YXIgaW5kZXggPSBkb3duc3RyZWFtQ3R4LmluZGV4T2YodGFyZ2V0KTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICBkb3duc3RyZWFtQ3R4LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgdGFyZ2V0KCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgZWxzZSBpZiAodGFyZ2V0LnRyaWdnZXIpIHRhcmdldC50cmlnZ2VyKCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEJpbmQgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBhbiBldmVudCB0eXBlIGhhbmRsZWQgYnkgdGhpcyBvYmplY3QuXG4gKlxuICogQG1ldGhvZCBcIm9uXCJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbih0eXBlLCBoYW5kbGVyKSB7XG4gICAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykpIHtcbiAgICAgICAgdmFyIHVwc3RyZWFtTGlzdGVuZXIgPSB0aGlzLnRyaWdnZXIuYmluZCh0aGlzLCB0eXBlKTtcbiAgICAgICAgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSA9IHVwc3RyZWFtTGlzdGVuZXI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy51cHN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy51cHN0cmVhbVtpXS5vbih0eXBlLCB1cHN0cmVhbUxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIFwib25cIlxuICogQG1ldGhvZCBhZGRMaXN0ZW5lclxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5vbjtcblxuLyoqXG4gKiBMaXN0ZW4gZm9yIGV2ZW50cyBmcm9tIGFuIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXIuXG4gKlxuICogQG1ldGhvZCBzdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gc3Vic2NyaWJlKHNvdXJjZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMudXBzdHJlYW0uaW5kZXhPZihzb3VyY2UpO1xuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgdGhpcy51cHN0cmVhbS5wdXNoKHNvdXJjZSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLm9uKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdG9wIGxpc3RlbmluZyB0byBldmVudHMgZnJvbSBhbiB1cHN0cmVhbSBldmVudCBoYW5kbGVyLlxuICpcbiAqIEBtZXRob2QgdW5zdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiB1bnN1YnNjcmliZShzb3VyY2UpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnVwc3RyZWFtLmluZGV4T2Yoc291cmNlKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICB0aGlzLnVwc3RyZWFtLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEhhbmRsZXI7IiwidmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIEVuZ2luZSAgICAgICAgICAgICA9IHt9O1xuXG5FbmdpbmUuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuRW5naW5lLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihFbmdpbmUsIEVuZ2luZS5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKEVuZ2luZSwgRW5naW5lLmV2ZW50T3V0cHV0KTtcblxuRW5naW5lLmN1cnJlbnRTdGF0ZSA9IG51bGw7XG5cbkVuZ2luZS5zZXRTdGF0ZSAgICAgPSBmdW5jdGlvbiBzZXRTdGF0ZShzdGF0ZSlcbntcblx0aWYgKHN0YXRlLmluaXRpYWxpemUpIHN0YXRlLmluaXRpYWxpemUoKTtcblx0XG5cdGlmICh0aGlzLmN1cnJlbnRTdGF0ZSlcblx0e1xuXHRcdHRoaXMuY3VycmVudFN0YXRlLnVucGlwZShFbmdpbmUuZXZlbnRJbnB1dCk7XG5cdFx0dGhpcy5jdXJyZW50U3RhdGUuaGlkZSgpO1xuXHR9XG5cblx0c3RhdGUucGlwZSh0aGlzLmV2ZW50SW5wdXQpO1xuXHRzdGF0ZS5zaG93KCk7XG5cblx0dGhpcy5jdXJyZW50U3RhdGUgPSBzdGF0ZTtcbn07XG5cbkVuZ2luZS5zdGVwICAgICAgICAgPSBmdW5jdGlvbiBzdGVwKHRpbWUpXG57XG5cdHZhciBzdGF0ZSA9IEVuZ2luZS5jdXJyZW50U3RhdGU7XG5cdGlmIChzdGF0ZSlcblx0e1xuXHRcdGlmIChzdGF0ZS51cGRhdGUpIHN0YXRlLnVwZGF0ZSgpO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVuZ2luZTsiLCJ2YXIgQVNTRVRfVFlQRSA9ICdpbWFnZSc7XG5cbnZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbnZhciBJbWFnZUxvYWRlciAgPSB7fTtcbnZhciBJbWFnZXMgICAgICAgPSB7fTtcblxuSW1hZ2VMb2FkZXIuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuSW1hZ2VMb2FkZXIuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKEltYWdlTG9hZGVyLCBJbWFnZUxvYWRlci5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKEltYWdlTG9hZGVyLCBJbWFnZUxvYWRlci5ldmVudE91dHB1dCk7XG5cbkltYWdlTG9hZGVyLmxvYWQgPSBmdW5jdGlvbiBsb2FkKGFzc2V0KVxue1xuICAgIHZhciBzb3VyY2UgPSBhc3NldC5zb3VyY2U7XG4gICAgaWYgKCFJbWFnZXNbc291cmNlXSlcbiAgICB7XG4gICAgICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpbWFnZS5zcmMgPSBzb3VyY2U7XG4gICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZmluaXNoZWRMb2FkaW5nKHNvdXJjZSk7XG4gICAgICAgIH07XG4gICAgICAgIEltYWdlc1tzb3VyY2VdID0gaW1hZ2U7XG4gICAgfVxufTtcblxuSW1hZ2VMb2FkZXIuZ2V0ICA9IGZ1bmN0aW9uIGdldChzb3VyY2UpXG57XG4gICAgcmV0dXJuIEltYWdlc1tzb3VyY2VdO1xufTtcblxuSW1hZ2VMb2FkZXIudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpXG57XG4gICAgcmV0dXJuIEFTU0VUX1RZUEU7XG59O1xuXG5mdW5jdGlvbiBmaW5pc2hlZExvYWRpbmcoc291cmNlKVxue1xuICAgIEltYWdlTG9hZGVyLmV2ZW50T3V0cHV0LmVtaXQoJ2RvbmVMb2FkaW5nJywge3NvdXJjZTogc291cmNlLCB0eXBlOiBBU1NFVF9UWVBFfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VMb2FkZXI7IiwidmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIFZpZXdwb3J0ID0ge307XG5cblZpZXdwb3J0LmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblZpZXdwb3J0LmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihWaWV3cG9ydCwgVmlld3BvcnQuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihWaWV3cG9ydCwgVmlld3BvcnQuZXZlbnRPdXRwdXQpO1xuXG53aW5kb3cub25yZXNpemUgPSBoYW5kbGVSZXNpemU7XG5cbmZ1bmN0aW9uIGhhbmRsZVJlc2l6ZSgpXG57XG5cdFZpZXdwb3J0LmV2ZW50T3V0cHV0LmVtaXQoJ3Jlc2l6ZScpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdwb3J0OyIsInZhciBDT01QTEVURSA9IFwiY29tcGxldGVcIjtcbnZhciBMT0FEX1NUQVJURUQgPSBcInN0YXJ0TG9hZGluZ1wiO1xudmFyIExPQURfQ09NUExFVEVEID0gXCJkb25lTG9hZGluZ1wiO1xudmFyIE5PTkUgPSAnbm9uZSc7XG52YXIgVklTSUJMRSA9ICdpbmxpbmUnO1xuXG52YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgTG9hZGluZyAgICAgICAgICA9IHt9O1xudmFyIGJvZHlSZWFkeSAgICAgICAgPSBmYWxzZTtcbnZhciBhc3NldFN0YWNrICAgICAgID0gW107XG52YXIgbG9hZGVyUmVnaXN0cnkgICA9IHt9O1xudmFyIGNvbnRhaW5lciAgICAgICAgPSBudWxsO1xudmFyIHNwbGFzaFNjcmVlbiAgICAgPSBuZXcgSW1hZ2UoKTtcbnNwbGFzaFNjcmVlbi5zcmMgICAgID0gJy4uLy4uL0Fzc2V0cy9Mb2FkaW5nLi4uLnBuZyc7XG5zcGxhc2hTY3JlZW4ud2lkdGggICA9IHNwbGFzaFdpZHRoID0gNTAwO1xuc3BsYXNoU2NyZWVuLmhlaWdodCAgPSBzcGxhc2hIZWlnaHQgPSAxNjA7XG5Mb2FkaW5nLmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbkxvYWRpbmcuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKExvYWRpbmcsIExvYWRpbmcuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihMb2FkaW5nLCBMb2FkaW5nLmV2ZW50T3V0cHV0KTtcblxuTG9hZGluZy5ldmVudElucHV0Lm9uKExPQURfQ09NUExFVEVELCBoYW5kbGVDb21wbGV0ZWRMb2FkKTtcbkxvYWRpbmcuZXZlbnRJbnB1dC5vbigncmVzaXplJywgaGFuZGxlUmVzaXplKTtcblxuTG9hZGluZy5pbml0aWFsaXplID0gZnVuY3Rpb24gaW5pdGlhbGl6ZSgpXG57XG4gICAgaWYgKCFjb250YWluZXIpXG4gICAge1xuICAgICAgICBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9hZGluZycpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoc3BsYXNoU2NyZWVuKTtcbiAgICAgICAgc3BsYXNoU2NyZWVuLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgc3BsYXNoU2NyZWVuLnN0eWxlLnRvcCA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjUpIC0gKHNwbGFzaEhlaWdodCAqIDAuNSkgKyAncHgnO1xuICAgICAgICBzcGxhc2hTY3JlZW4uc3R5bGUubGVmdCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuNSkgLSAoc3BsYXNoV2lkdGgqIDAuNSkgKyAncHgnO1xuICAgIH1cbiAgICBpZiAoYXNzZXRTdGFjay5sZW5ndGgpXG4gICAge1xuICAgICAgICB0aGlzLmV2ZW50T3V0cHV0LmVtaXQoTE9BRF9TVEFSVEVEKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhc3NldFN0YWNrLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgYXNzZXQgID0gYXNzZXRTdGFja1tpXTtcbiAgICAgICAgICAgIHZhciBsb2FkZXIgPSBhc3NldC50eXBlO1xuICAgICAgICAgICAgbG9hZGVyUmVnaXN0cnlbbG9hZGVyXS5sb2FkKGFzc2V0KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkxvYWRpbmcubG9hZCAgICAgICA9IGZ1bmN0aW9uIGxvYWQoYXNzZXQpXG57XG4gICAgYXNzZXRTdGFjay5wdXNoKGFzc2V0KTtcbn07XG5cbkxvYWRpbmcuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gVklTSUJMRTtcbn07XG5cbkxvYWRpbmcuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gTk9ORTtcbn07XG5cbkxvYWRpbmcucmVnaXN0ZXIgICA9IGZ1bmN0aW9uIHJlZ2lzdGVyKGxvYWRlcilcbntcbiAgICB2YXIgbG9hZGVyTmFtZSAgICAgICAgICAgICA9IGxvYWRlci50b1N0cmluZygpO1xuICAgIGxvYWRlclJlZ2lzdHJ5W2xvYWRlck5hbWVdID0gbG9hZGVyO1xuICAgIGxvYWRlci5waXBlKHRoaXMuZXZlbnRJbnB1dCk7XG59O1xuXG5mdW5jdGlvbiBoYW5kbGVDb21wbGV0ZWRMb2FkKGRhdGEpXG57XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpXG4gICAge1xuICAgICAgICB2YXIgc291cmNlID0gZGF0YS5zb3VyY2U7XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IGFzc2V0U3RhY2suaW5kZXhPZihzb3VyY2UpO1xuICAgICAgICBpZiAobG9jYXRpb24pIGFzc2V0U3RhY2suc3BsaWNlKGxvY2F0aW9uLCAxKTtcbiAgICAgICAgaWYgKCFhc3NldFN0YWNrLmxlbmd0aCkgTG9hZGluZy5ldmVudE91dHB1dC5lbWl0KExPQURfQ09NUExFVEVEKTtcbiAgICB9LCAxMDAwKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlUmVzaXplKClcbntcbiAgICBzcGxhc2hTY3JlZW4uc3R5bGUudG9wID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoc3BsYXNoSGVpZ2h0ICogMC41KSArICdweCc7XG4gICAgc3BsYXNoU2NyZWVuLnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKHNwbGFzaFdpZHRoKiAwLjUpICsgJ3B4Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkaW5nOyIsInZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIE1lbnUgICAgICAgICAgPSB7fTtcblxuTWVudS5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5NZW51LmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihNZW51LCBNZW51LmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoTWVudSwgTWVudS5ldmVudE91dHB1dCk7XG5cbk1lbnUuZXZlbnRJbnB1dC5vbigncmVzaXplJywgaGFuZGxlUmVzaXplKTtcblxudmFyIG1lbnVFbGVtZW50ID0gbnVsbCxcbmNvbnRhaW5lciAgICAgICA9IG51bGwsXG5uZXdHYW1lICAgICAgICAgPSBudWxsO1xuXG5NZW51LmluaXRpYWxpemUgPSBmdW5jdGlvbiBpbml0aWFsaXplKClcbntcbiAgICBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudScpO1xuICAgIG1lbnVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbWVudUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIG5ld0dhbWUgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbmV3R2FtZS5vbmNsaWNrID0gc3RhcnROZXdHYW1lO1xuICAgIG5ld0dhbWUuaW5uZXJIVE1MID0gJ05ldyBHYW1lJztcbiAgICBuZXdHYW1lLnN0eWxlLmZvbnRTaXplID0gJzUwcHgnO1xuICAgIG5ld0dhbWUuc3R5bGUuZm9udEZhbWlseSA9ICdIZWx2ZXRpY2EnO1xuICAgIG5ld0dhbWUuc3R5bGUuY29sb3IgPSAnI0ZGRic7XG4gICAgbWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQobmV3R2FtZSk7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG1lbnVFbGVtZW50KTtcbiAgICBtZW51RWxlbWVudC5zdHlsZS50b3AgID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoNTggKiAwLjUpICsgJ3B4JztcbiAgICBtZW51RWxlbWVudC5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtICgyNTEgKiAwLjUpICsgJ3B4Jztcbn07XG5cbk1lbnUuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gVklTSUJMRTtcbn07XG5cbk1lbnUuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gTk9ORTtcbn07XG5cbmZ1bmN0aW9uIGhhbmRsZVJlc2l6ZSgpXG57XG4gICAgbWVudUVsZW1lbnQuc3R5bGUudG9wID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoNTggKiAwLjUpICsgJ3B4JztcbiAgICBtZW51RWxlbWVudC5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtICgyNTEgKiAwLjUpICsgJ3B4Jztcbn1cblxuZnVuY3Rpb24gc3RhcnROZXdHYW1lKClcbntcbiAgICBNZW51LmV2ZW50T3V0cHV0LmVtaXQoJ25ld0dhbWUnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51OyIsInZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcbnZhciBGYW1vdXNFbmdpbmUgICAgICAgPSByZXF1aXJlKCcuLi8uLi9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9FbmdpbmUnKTtcbnZhciBQcmltaXRpdmVzICAgICAgICAgPSByZXF1aXJlKCcuLi8uLi9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvZ2wvcHJpbWl0aXZlcycpO1xudmFyIE1hdGVyaWFsICAgICAgICAgICA9IHJlcXVpcmUoJy4uLy4uL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9nbC9tYXRlcmlhbHMnKTtcbi8vIHZhciBJbWFnZUxvYWRlciAgICAgICAgPSByZXF1aXJlKCcuLi8uLi8nKVxuXG52YXIgUGxheWluZyAgICAgICAgICA9IHt9O1xuXG5QbGF5aW5nLmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblBsYXlpbmcuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKFBsYXlpbmcsIFBsYXlpbmcuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihQbGF5aW5nLCBQbGF5aW5nLmV2ZW50T3V0cHV0KTtcblxuUGxheWluZy5pbml0aWFsaXplID0gZnVuY3Rpb24gaW5pdGlhbGl6ZSgpXG57XG5cdHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYXlpbmcnKTtcbiBcdHRoaXMuY29udGV4dCA9IEZhbW91c0VuZ2luZS5jcmVhdGVDb250ZXh0KHRoaXMuY29udGFpbmVyKTtcbiBcdHZhciBwbGFuZU5vZGUgPSB0aGlzLmNvbnRleHQuYWRkQ2hpbGQoKTtcbiBcdHZhciBwbGFuZSA9IHBsYW5lTm9kZS5hZGRDb21wb25lbnQoUHJpbWl0aXZlcy5wbGFuZSwge1xuIFx0XHRzaXplOiBbNTAwLCA1MDAsIDFdXG4gXHR9KTtcblxuIFx0cGxhbmVOb2RlLmFkZENvbXBvbmVudChNYXRlcmlhbCwge1xuIFx0XHRpbWFnZTogJy9Bc3NldHMvdGlsZS5wbmcnLFxuIFx0XHQvLyBmc0NodW5rOiB7XG4gXHRcdC8vIFx0ZGVmaW5lczogJycsXG4gXHRcdC8vIFx0YXBwbHk6ICdjb2xvciA9IHZlYzQoMSwgMCwgMCwgMSk7J1xuIFx0XHQvLyB9XG4gXHR9KTtcblxuIFx0dmFyIG9mZnNldFggPSAwLjE7XG4gXHR2YXIgb2Zmc2V0WSA9IDAuMTtcblxuIFx0cGxhbmUuY29vcmRzID0gW1xuIFx0XHRbb2Zmc2V0WCArIDAuMiwgb2Zmc2V0WSArIDAuMl0sXG4gXHRcdFtvZmZzZXRYICsgMC4wLCBvZmZzZXRZICsgMC4yXSxcbiBcdFx0W29mZnNldFggKyAwLjIsIG9mZnNldFkgKyAwLjBdLFxuIFx0XHRbb2Zmc2V0WCArIDAuMCwgb2Zmc2V0WSArIDAuMF1cbiBcdF07XG4gXHRwbGFuZS5jb21waWxlKCk7XG59O1xuXG5QbGF5aW5nLnVwZGF0ZSAgICAgPSBmdW5jdGlvbiB1cGRhdGUoKVxue1xuXHRGYW1vdXNFbmdpbmUuc3RlcCgpO1xufTtcblxuUGxheWluZy5zaG93ICAgICAgID0gZnVuY3Rpb24gc2hvdygpXG57XG59O1xuXG5QbGF5aW5nLmhpZGUgICAgICAgPSBmdW5jdGlvbiBoaWRlKClcbntcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWluZzsiLCJ2YXIgRW5naW5lICA9IHJlcXVpcmUoJy4vR2FtZS9FbmdpbmUnKTtcbnZhciBMb2FkaW5nID0gcmVxdWlyZSgnLi9TdGF0ZXMvTG9hZGluZycpO1xudmFyIE1lbnUgICAgPSByZXF1aXJlKCcuL1N0YXRlcy9NZW51Jyk7XG52YXIgUGxheWluZyA9IHJlcXVpcmUoJy4vU3RhdGVzL1BsYXlpbmcnKTtcbnZhciBFdmVudEhhbmRsZXIgPSByZXF1aXJlKCcuL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcbnZhciBJbWFnZUxvYWRlciAgPSByZXF1aXJlKCcuL0dhbWUvSW1hZ2VMb2FkZXInKTtcbnZhciBWaWV3cG9ydCAgICAgPSByZXF1aXJlKCcuL0dhbWUvVmlld3BvcnQnKTtcblxudmFyIENvbnRyb2xsZXIgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cblZpZXdwb3J0LnBpcGUoTWVudSk7XG5WaWV3cG9ydC5waXBlKExvYWRpbmcpO1xuVmlld3BvcnQucGlwZShQbGF5aW5nKTtcblxuRW5naW5lLnBpcGUoQ29udHJvbGxlcik7XG5NZW51LnBpcGUoQ29udHJvbGxlcik7XG5Mb2FkaW5nLnBpcGUoQ29udHJvbGxlcik7XG5cbkNvbnRyb2xsZXIub24oJ2RvbmVMb2FkaW5nJywgZ29Ub01lbnUpO1xuQ29udHJvbGxlci5vbignbmV3R2FtZScsIHN0YXJ0R2FtZSk7XG5cbnZhciBzcHJpdGVzaGVldCA9IHtcblx0dHlwZTogJ2ltYWdlJyxcblx0c291cmNlOiAnLi4vQXNzZXRzL2NyYXRlLmdpZicsXG5cdGRhdGE6IHt9XG59O1xuXG5Mb2FkaW5nLnJlZ2lzdGVyKEltYWdlTG9hZGVyKTtcbkxvYWRpbmcubG9hZChzcHJpdGVzaGVldCk7XG5cbkVuZ2luZS5zZXRTdGF0ZShMb2FkaW5nKTtcblxuZnVuY3Rpb24gZ29Ub01lbnUoKVxue1xuICAgIEVuZ2luZS5zZXRTdGF0ZShNZW51KTtcbn1cblxuZnVuY3Rpb24gc3RhcnRHYW1lKClcbntcblx0RW5naW5lLnNldFN0YXRlKFBsYXlpbmcpO1xufVxuXG5mdW5jdGlvbiBsb29wKClcbntcbiAgICBFbmdpbmUuc3RlcCgpO1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcbn1cblxucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApOyJdfQ==
