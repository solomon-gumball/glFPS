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

},{"../../events/EventHandler":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/events/EventHandler.js","../../math/4x4matrix":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/math/4x4matrix.js","../EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Components/Surface.js":[function(require,module,exports){
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
    systems              = [RenderSystem, BehaviorSystem, LiftSystem, CoreSystem, TimeSystem], // We're going backwards
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
    this.IO.emit('entityPushed', entity);
    return this.entities.push(entity);
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

var mouse          = [.5, .5];
var shaders        = {};
var start          = Date.now();
var perspective    = __perspective([], 0, innerWidth / innerHeight, .1,  1000.);
var EntityRegistry = require('../EntityRegistry');
var Engine         = require('../Engine');
var Geometry       = require('../../gl/geometry');
var lightList      = EntityRegistry.getLayer('Lights');

var appended = false;
var gl;

var vertexWrapper = [
    '//define_vs',

    'vec4 pipeline_pos(in vec4 pos) {',
    '    //apply_vs', 
    '    pos = transform * perspective * pos;',    
    '    pos.y *= -1.;',    
    '    return pos;',  
    '}',

    'void main() {',
    '    v_normal = a_normal;',
    '    gl_Position = pipeline_pos(a_pos);',
    '}'
].join('\n');

var fragmentWrapper = [
    '//define_fs',  
    'vec4 pipeline_color(in vec4 color) {',
    '    //apply_fs',  
    '    return color;', 
    '}',

    'void main() {',
    '    vec4 color;',
    '    color = vec4(v_normal, 1.);',
    '    gl_FragColor = vec4(1);',
    '}'
].join('\n');

var WebGLRenderer = {
    draw: draw,
    render: function () {
        var geom = EntityRegistry.getLayer('Geometries');
        (geom ? geom.entities : []).forEach(function (geom) {
            var c = geom.getContext().getComponent('camera');
            if (c)  this.shader.uniforms({ perspective:  c.getProjectionTransform() });
            this.draw(geom._components.geometry.render(), {_size: [innerWidth, innerHeight, 10]} );
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

function draw(spec, container) {
    if (!appended) document.body.appendChild(gl.canvas);
    if (! spec.texture) delete spec.texture;

    if (spec.chunkTest) this.shader = mergePipeline.call(this, spec);
    if (spec.fsChunk) this.shader = mergePipeline.call(this, spec, true);

    spec.mouse = mouse;
    spec.resolution = container._size;
    spec.clock = (Date.now() - start) / 100;
    if (! spec.noise) spec.noise = 0;
    this.shader.uniforms(spec).draw(spec.geometry);
}

function init() {
    var options = { alpha: true };
    var canvas = document.createElement('canvas');
    gl = window.gl = canvas.getContext('webgl', options);

    if (! gl) throw 'WebGL not supported';

    this.ShaderMaker = require('../../gl/shader')(gl);

    this.shader = new this.ShaderMaker(vertexWrapper, fragmentWrapper);
    window.onmousemove = function(e) {
        mouse = [e.x / innerWidth, 1. - e.y /innerHeight];
    };

    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.canvas.className = 'GL';
    gl.canvas.width = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function __perspective(out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
};
var once = 0;
function mergePipeline(spec, shader, flag) {
    spec.chunkTest = false;
    if (flag)
    this.shader.vs = this.shader.vs
        .replace('//define_vs', spec.chunkNoise.defines)
        .replace('//apply_fs', spec.chunkNoise.apply);
    else this.shader.fs = this.shader.fs.replace('//apply_fs', spec.fsChunk);
    if(once) return this.shader;
    once ++;
    
    return new this.ShaderMaker(this.shader.vs, this.shader.fs);
}

},{"../../gl/geometry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/geometry.js","../../gl/shader":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/shader.js","../Engine":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Engine.js","../EntityRegistry":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Stylesheet/famous.css":[function(require,module,exports){
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

},{"./EventEmitter":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/events/EventEmitter.js"}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/geometry.js":[function(require,module,exports){
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
var SIZE = 'size';
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
    this.chunks = {};
    this.vertexBuffers = {};
    this.indexBuffers = {};
    this.addVertexBuffer('vertices', 'a_pos');
    this.addVertexBuffer('coords', 'a_texCoord');
    this.addVertexBuffer('normals', 'a_normal');
    if (options.colors) this.addVertexBuffer('colors', 'a_color');
    if (!('triangles' in options) || options.triangles) this.addIndexBuffer('triangles');
    if (options.lines) this.addIndexBuffer('lines');
    this.spec = {
        primitive: 'triangles',
        resolution: [innerWidth / 2, innerHeight / 2],
        mouse: [0,0],
        brightness: 1, 
        opacity: 1,
        origin: [.5, .5],
        geometry: {
            vertexBuffers: this.vertexBuffers,
            indexBuffers: this.indexBuffers
        }
    };
}

Geometry.toString =  function () {
    return 'geometry';
};


Geometry.prototype = Object.create(Target.prototype);
Geometry.prototype.addVertexBuffer = function addVertexBuffer(name, attribute) {
    var buffer = this.vertexBuffers[attribute] = new Buffer(gl.ARRAY_BUFFER, Float32Array);
    buffer.name = name;
    this[name] = [];
};

Geometry.prototype.addIndexBuffer = function addIndexBuffer(name) {
    var buffer = this.indexBuffers[name] = new Buffer(gl.ELEMENT_ARRAY_BUFFER, Uint16Array);
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

function Buffer(target, type) {
    this.buffer = null;
    this.target = target;
    this.type = type;
    this.data = [];
}

Buffer.prototype = {
    compile: function(type) {
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

},{}],"/Users/joseph/code/One/Libraries/MixedMode/src/famous/gl/shader.js":[function(require,module,exports){
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

module.exports = function (gl) {
    function regexMap(regex, text, callback) {
        var result;
        while ((result = regex.exec(text)) != null) callback(result);
    }
    
    function Shader(vertexSource, fragmentSource) {
        this.vs = vertexSource;
        this.fs = fragmentSource;

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
                      'varying vec3 v_normal;'
                     ].join('\n');
        
        var vertexHeader = header + [
            'attribute vec4 a_pos;',
            'attribute vec4 a_uv;',
            'attribute vec3 a_normal;',
            'attribute vec4 a_color;'
        ].join('\n');

        var fragmentHeader = header + '';
        vertexSource = vertexHeader  + vertexSource;
        fragmentSource = fragmentHeader + fragmentSource;

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
                             mesh.indexBuffers[mode == gl.LINES ? 'lines' : 'triangles'],
                             arguments.length < 2 ? gl.TRIANGLES : mode);
        },

        drawBuffers: function(vertexBuffers, indexBuffer, mode) {
            var length = 0;
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
    return Shader;
};

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

var Engine          = {};

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

var Playing          = {};

Playing.eventInput      = new EventHandler();
Playing.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Playing, Playing.eventInput);
EventHandler.setOutputHandler(Playing, Playing.eventOutput);

Playing.initialize = function initialize()
{
	console.log(1)
 	FamousEngine.createContext({ hasCamera: false });
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
},{"../../Libraries/MixedMode/src/famous/core/Engine":"/Users/joseph/code/One/Libraries/MixedMode/src/famous/core/Engine.js","../Events/EventHandler":"/Users/joseph/code/One/Source/Events/EventHandler.js"}],"/Users/joseph/code/One/Source/main.js":[function(require,module,exports){
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

requestAnimationFrame(Engine.step);
},{"./Events/EventHandler":"/Users/joseph/code/One/Source/Events/EventHandler.js","./Game/Engine":"/Users/joseph/code/One/Source/Game/Engine.js","./Game/ImageLoader":"/Users/joseph/code/One/Source/Game/ImageLoader.js","./Game/Viewport":"/Users/joseph/code/One/Source/Game/Viewport.js","./States/Loading":"/Users/joseph/code/One/Source/States/Loading.js","./States/Menu":"/Users/joseph/code/One/Source/States/Menu.js","./States/Playing":"/Users/joseph/code/One/Source/States/Playing.js"}]},{},["/Users/joseph/code/One/Source/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvbm9kZV9tb2R1bGVzL2Nzc2lmeS9icm93c2VyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9Db21wb25lbnRzL0NhbWVyYS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvQ29tcG9uZW50cy9Db250YWluZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL0NvbXBvbmVudHMvU3VyZmFjZS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvQ29tcG9uZW50cy9UYXJnZXQuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL0NvbXBvbmVudHMvVHJhbnNmb3JtLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9Db250ZXh0LmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9FbmdpbmUuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL0VudGl0eS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvRW50aXR5UmVnaXN0cnkuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL0xheWVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9PcHRpb25zTWFuYWdlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvUmVuZGVyZXJzL0RPTXJlbmRlcmVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9SZW5kZXJlcnMvRWxlbWVudEFsbG9jYXRvci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvUmVuZGVyZXJzL1dlYkdMUmVuZGVyZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL1N0eWxlc2hlZXQvZmFtb3VzLmNzcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvU3lzdGVtcy9CZWhhdmlvclN5c3RlbS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvU3lzdGVtcy9Db3JlU3lzdGVtLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9TeXN0ZW1zL1JlbmRlclN5c3RlbS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvU3lzdGVtcy9UaW1lU3lzdGVtLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9jb21wb25lbnRzL1RhcmdldC5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2V2ZW50cy9FdmVudEVtaXR0ZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9ldmVudHMvRXZlbnRIYW5kbGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvZ2wvZ2VvbWV0cnkuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9nbC9pbmRleGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvZ2wvc2hhZGVyLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvZ2wvdmVjdG9yLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvbWF0aC80eDRtYXRyaXguanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy90cmFuc2l0aW9ucy9MaWZ0U3lzdGVtLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9Tb3VyY2UvRXZlbnRzL0V2ZW50RW1pdHRlci5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvU291cmNlL0V2ZW50cy9FdmVudEhhbmRsZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL1NvdXJjZS9HYW1lL0VuZ2luZS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvU291cmNlL0dhbWUvSW1hZ2VMb2FkZXIuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL1NvdXJjZS9HYW1lL1ZpZXdwb3J0LmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9Tb3VyY2UvU3RhdGVzL0xvYWRpbmcuanMiLCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL1NvdXJjZS9TdGF0ZXMvTWVudS5qcyIsIi9Vc2Vycy9qb3NlcGgvY29kZS9PbmUvU291cmNlL1N0YXRlcy9QbGF5aW5nLmpzIiwiL1VzZXJzL2pvc2VwaC9jb2RlL09uZS9Tb3VyY2UvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjc3MsIGN1c3RvbURvY3VtZW50KSB7XG4gIHZhciBkb2MgPSBjdXN0b21Eb2N1bWVudCB8fCBkb2N1bWVudDtcbiAgaWYgKGRvYy5jcmVhdGVTdHlsZVNoZWV0KSB7XG4gICAgZG9jLmNyZWF0ZVN0eWxlU2hlZXQoKS5jc3NUZXh0ID0gY3NzO1xuICB9IGVsc2Uge1xuICAgIHZhciBoZWFkID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sXG4gICAgICAgIHN0eWxlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG5cbiAgICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcbiAgXG4gICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IGNzcztcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jLmNyZWF0ZVRleHROb2RlKGNzcykpO1xuICAgIH1cbiAgICBcbiAgICBoZWFkLmFwcGVuZENoaWxkKHN0eWxlKTsgXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzLmJ5VXJsID0gZnVuY3Rpb24odXJsKSB7XG4gIGlmIChkb2N1bWVudC5jcmVhdGVTdHlsZVNoZWV0KSB7XG4gICAgZG9jdW1lbnQuY3JlYXRlU3R5bGVTaGVldCh1cmwpO1xuICB9IGVsc2Uge1xuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSxcbiAgICAgICAgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcblxuICAgIGxpbmsucmVsID0gJ3N0eWxlc2hlZXQnO1xuICAgIGxpbmsuaHJlZiA9IHVybDtcbiAgXG4gICAgaGVhZC5hcHBlbmRDaGlsZChsaW5rKTsgXG4gIH1cbn07XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBNYXRyaXhNYXRoICAgICA9IHJlcXVpcmUoJy4uLy4uL21hdGgvNHg0bWF0cml4Jyk7XG52YXIgT3B0aW9uc01hbmFnZXIgPSByZXF1aXJlKCcuLi9PcHRpb25zTWFuYWdlcicpO1xuXG4vLyBDT05TVFNcbnZhciBDT01QT05FTlRfTkFNRSA9ICdjYW1lcmEnO1xudmFyIFBST0pFQ1RJT04gICAgID0gJ3Byb2plY3Rpb24nO1xuXG4vKipcbiAqIENhbWVyYVxuICpcbiAqIEBjb21wb25lbnQgQ2FtZXJhXG4gKiBAY29uc3RydWN0b3JcbiAqIFxuICogQHBhcmFtIHtFbnRpdHl9IGVudGl0eSAgRW50aXR5IHRoYXQgdGhlIENvbnRhaW5lciBpcyBhIGNvbXBvbmVudCBvZlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBDYW1lcmEoZW50aXR5LCBvcHRpb25zKSB7XG4gICAgdGhpcy5fZW50aXR5ICAgICAgICAgICAgICA9IGVudGl0eTtcbiAgICB0aGlzLl9wcm9qZWN0aW9uVHJhbnNmb3JtID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pO1xuXG4gICAgdGhpcy5vcHRpb25zICAgICAgICAgICAgICA9IE9iamVjdC5jcmVhdGUoQ2FtZXJhLkRFRkFVTFRfT1BUSU9OUyk7XG4gICAgdGhpcy5fb3B0aW9uc01hbmFnZXIgICAgICA9IG5ldyBPcHRpb25zTWFuYWdlcih0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMuX29wdGlvbnNNYW5hZ2VyLm9uKCdjaGFuZ2UnLCBfZXZlbnRzQ2hhbmdlLmJpbmQodGhpcykpOyAvL3JvYnVzdCBpbnRlZ3JhdGlvblxuXG4gICAgaWYgKG9wdGlvbnMpIHRoaXMuc2V0T3B0aW9ucyhvcHRpb25zKTtcblxuICAgIF9yZWNhbGN1bGF0ZVByb2plY3Rpb25UcmFuc2Zvcm0uY2FsbCh0aGlzKTtcbn1cblxuQ2FtZXJhLkRFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBwcm9qZWN0aW9uIDoge1xuICAgICAgICB0eXBlICAgIDogJ3BpbmhvbGUnLFxuICAgICAgICBvcHRpb25zIDoge1xuICAgICAgICAgICAgZm9jYWxQb2ludCA6IFswLCAwLCAtMTAwMF1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkNhbWVyYS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBDT01QT05FTlRfTkFNRTtcbn07XG5cbkNhbWVyYS5wcm9qZWN0aW9uVHJhbnNmb3JtcyA9IHt9O1xuXG5DYW1lcmEucHJvamVjdGlvblRyYW5zZm9ybXMucGluaG9sZSA9IGZ1bmN0aW9uIHBpbmhvbGUodHJhbnNmb3JtLCBmb2NhbFZlY3Rvcikge1xuICAgIHZhciBjb250ZXh0U2l6ZSAgID0gdGhpcy5fZW50aXR5LmdldENvbnRleHQoKS5fc2l6ZTtcbiAgICB2YXIgY29udGV4dFdpZHRoICA9IGNvbnRleHRTaXplWzBdO1xuICAgIHZhciBjb250ZXh0SGVpZ2h0ID0gY29udGV4dFNpemVbMV07XG5cbiAgICB2YXIgZm9jYWxEaXZpZGUgICAgICAgID0gZm9jYWxWZWN0b3JbMl0gPyAxL2ZvY2FsVmVjdG9yWzJdIDogMDtcbiAgICB2YXIgd2lkdGhUb0hlaWdodFJhdGlvID0gKGNvbnRleHRXaWR0aCA+IGNvbnRleHRIZWlnaHQpID8gY29udGV4dFdpZHRoL2NvbnRleHRIZWlnaHQgOiAxO1xuICAgIHZhciBoZWlnaHRUb1dpZHRoUmF0aW8gPSAoY29udGV4dEhlaWdodCA+IGNvbnRleHRXaWR0aCkgPyBjb250ZXh0SGVpZ2h0L2NvbnRleHRXaWR0aCA6IDE7XG5cbiAgICB2YXIgbGVmdCAgID0gLXdpZHRoVG9IZWlnaHRSYXRpbztcbiAgICB2YXIgcmlnaHQgID0gd2lkdGhUb0hlaWdodFJhdGlvO1xuICAgIHZhciB0b3AgICAgPSBoZWlnaHRUb1dpZHRoUmF0aW87XG4gICAgdmFyIGJvdHRvbSA9IC1oZWlnaHRUb1dpZHRoUmF0aW87XG5cbiAgICB2YXIgbHIgPSAxIC8gKGxlZnQgLSByaWdodCk7XG4gICAgdmFyIGJ0ID0gMSAvIChib3R0b20gLSB0b3ApO1xuXG4gICAgdHJhbnNmb3JtWzBdICA9IC0yICogbHI7XG4gICAgdHJhbnNmb3JtWzFdICA9IDA7XG4gICAgdHJhbnNmb3JtWzJdICA9IDA7XG4gICAgdHJhbnNmb3JtWzNdICA9IDA7XG4gICAgXG4gICAgdHJhbnNmb3JtWzRdICA9IDA7XG4gICAgdHJhbnNmb3JtWzVdICA9IC0yICogYnQ7XG4gICAgdHJhbnNmb3JtWzZdICA9IDA7XG4gICAgdHJhbnNmb3JtWzddICA9IDA7XG4gICBcbiAgICB0cmFuc2Zvcm1bOF0gID0gLWZvY2FsRGl2aWRlICogZm9jYWxWZWN0b3JbMF07XG4gICAgdHJhbnNmb3JtWzldICA9IC1mb2NhbERpdmlkZSAqIGZvY2FsVmVjdG9yWzFdO1xuICAgIHRyYW5zZm9ybVsxMF0gPSBmb2NhbERpdmlkZTtcbiAgICB0cmFuc2Zvcm1bMTFdID0gLWZvY2FsRGl2aWRlO1xuICAgIFxuICAgIHRyYW5zZm9ybVsxMl0gPSAwO1xuICAgIHRyYW5zZm9ybVsxM10gPSAwO1xuICAgIHRyYW5zZm9ybVsxNF0gPSAwO1xuICAgIHRyYW5zZm9ybVsxNV0gPSAxO1xuXG4gICAgcmV0dXJuIHRyYW5zZm9ybTtcbn07XG5cbkNhbWVyYS5wcm9qZWN0aW9uVHJhbnNmb3Jtcy5vcnRob2dyYXBoaWMgPSBmdW5jdGlvbiBvcnRob2dyYXBoaWModHJhbnNmb3JtKSB7XG4gICAgdmFyIGNvbnRleHRTaXplICAgPSB0aGlzLl9lbnRpdHkuZ2V0Q29udGV4dCgpLl9zaXplO1xuICAgIHZhciBjb250ZXh0V2lkdGggID0gY29udGV4dFNpemVbMF07XG4gICAgdmFyIGNvbnRleHRIZWlnaHQgPSBjb250ZXh0U2l6ZVsxXTtcblxuICAgIHZhciB3aWR0aFRvSGVpZ2h0UmF0aW8gPSAoY29udGV4dFdpZHRoID4gY29udGV4dEhlaWdodCkgPyBjb250ZXh0V2lkdGgvY29udGV4dEhlaWdodCA6IDE7XG4gICAgdmFyIGhlaWdodFRvV2lkdGhSYXRpbyA9IChjb250ZXh0SGVpZ2h0ID4gY29udGV4dFdpZHRoKSA/IGNvbnRleHRIZWlnaHQvY29udGV4dFdpZHRoIDogMTtcblxuICAgIHZhciBsZWZ0ICAgPSAtd2lkdGhUb0hlaWdodFJhdGlvO1xuICAgIHZhciByaWdodCAgPSB3aWR0aFRvSGVpZ2h0UmF0aW87XG4gICAgdmFyIHRvcCAgICA9IGhlaWdodFRvV2lkdGhSYXRpbztcbiAgICB2YXIgYm90dG9tID0gLWhlaWdodFRvV2lkdGhSYXRpbztcblxuICAgIHZhciBsciA9IDEgLyAobGVmdCAtIHJpZ2h0KTtcbiAgICB2YXIgYnQgPSAxIC8gKGJvdHRvbSAtIHRvcCk7XG4gICAgdmFyIG5mID0gMSAvIChuZWFyIC0gZmFyKTtcblxuICAgIHRyYW5zZm9ybVswXSAgPSAtMiAqIGxyO1xuICAgIHRyYW5zZm9ybVsxXSAgPSAwO1xuICAgIHRyYW5zZm9ybVsyXSAgPSAwO1xuICAgIHRyYW5zZm9ybVszXSAgPSAwO1xuICAgIFxuICAgIHRyYW5zZm9ybVs0XSAgPSAwO1xuICAgIHRyYW5zZm9ybVs1XSAgPSAtMiAqIGJ0O1xuICAgIHRyYW5zZm9ybVs2XSAgPSAwO1xuICAgIHRyYW5zZm9ybVs3XSAgPSAwO1xuICAgIFxuICAgIHRyYW5zZm9ybVs4XSAgPSAwO1xuICAgIHRyYW5zZm9ybVs5XSAgPSAwO1xuICAgIHRyYW5zZm9ybVsxMF0gPSAyICogbmY7XG4gICAgdHJhbnNmb3JtWzExXSA9IDA7XG4gICAgXG4gICAgdHJhbnNmb3JtWzEyXSA9IChsZWZ0ICsgcmlnaHQpICogbHI7XG4gICAgdHJhbnNmb3JtWzEzXSA9ICh0b3AgKyBib3R0b20pICogYnQ7XG4gICAgdHJhbnNmb3JtWzE0XSA9IChmYXIgKyBuZWFyKSAqIG5mO1xuICAgIHRyYW5zZm9ybVsxNV0gPSAxO1xuXG4gICAgcmV0dXJuIHRyYW5zZm9ybTtcbn07XG5cbkNhbWVyYS5wcm9qZWN0aW9uVHJhbnNmb3Jtcy5wZXJzcGVjdGl2ZSA9IGZ1bmN0aW9uIHBlcnNwZWN0aXZlKHRyYW5zZm9ybSwgZm92eSwgbmVhciwgZmFyKSB7XG4gICAgdmFyIGNvbnRleHRTaXplICAgPSB0aGlzLl9lbnRpdHkuZ2V0Q29udGV4dCgpLl9zaXplO1xuICAgIHZhciBjb250ZXh0V2lkdGggID0gY29udGV4dFNpemVbMF07XG4gICAgdmFyIGNvbnRleHRIZWlnaHQgPSBjb250ZXh0U2l6ZVsxXTtcblxuICAgIHZhciBhc3BlY3QgPSBjb250ZXh0V2lkdGgvY29udGV4dEhlaWdodDtcblxuICAgIHZhciBmICA9IDEuMCAvIE1hdGgudGFuKGZvdnkgLyAyKTtcbiAgICB2YXIgbmYgPSAxIC8gKG5lYXIgLSBmYXIpO1xuXG4gICAgdHJhbnNmb3JtWzBdICA9IGYgLyBhc3BlY3Q7XG4gICAgdHJhbnNmb3JtWzFdICA9IDA7XG4gICAgdHJhbnNmb3JtWzJdICA9IDA7XG4gICAgdHJhbnNmb3JtWzNdICA9IDA7XG4gICAgdHJhbnNmb3JtWzRdICA9IDA7XG4gICAgdHJhbnNmb3JtWzVdICA9IGY7XG4gICAgdHJhbnNmb3JtWzZdICA9IDA7XG4gICAgdHJhbnNmb3JtWzddICA9IDA7XG4gICAgdHJhbnNmb3JtWzhdICA9IDA7XG4gICAgdHJhbnNmb3JtWzldICA9IDA7XG4gICAgdHJhbnNmb3JtWzEwXSA9IChmYXIgKyBuZWFyKSAqIG5mO1xuICAgIHRyYW5zZm9ybVsxMV0gPSAtMTtcbiAgICB0cmFuc2Zvcm1bMTJdID0gMDtcbiAgICB0cmFuc2Zvcm1bMTNdID0gMDtcbiAgICB0cmFuc2Zvcm1bMTRdID0gKDIgKiBmYXIgKiBuZWFyKSAqIG5mO1xuICAgIHRyYW5zZm9ybVsxNV0gPSAwO1xuICAgIHJldHVybiB0cmFuc2Zvcm07XG59O1xuXG5mdW5jdGlvbiBfZXZlbnRzQ2hhbmdlKGRhdGEpIHtcbiAgICBpZiAoZGF0YS5pZCA9PT0gUFJPSkVDVElPTikge1xuICAgICAgICBfcmVjYWxjdWxhdGVQcm9qZWN0aW9uVHJhbnNmb3JtLmNhbGwodGhpcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBfcmVjYWxjdWxhdGVQcm9qZWN0aW9uVHJhbnNmb3JtKCkge1xuICAgIHZhciBvcHRpb25zID0gW3RoaXMuX3Byb2plY3Rpb25UcmFuc2Zvcm1dO1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLm9wdGlvbnMucHJvamVjdGlvbi5vcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMucHVzaCh0aGlzLm9wdGlvbnMucHJvamVjdGlvbi5vcHRpb25zW2tleV0pO1xuICAgIH1cbiAgICByZXR1cm4gQ2FtZXJhLnByb2plY3Rpb25UcmFuc2Zvcm1zW3RoaXMub3B0aW9ucy5wcm9qZWN0aW9uLnR5cGVdLmFwcGx5KHRoaXMsIG9wdGlvbnMpO1xufVxuXG5DYW1lcmEucHJvdG90eXBlLmdldFByb2plY3Rpb25UcmFuc2Zvcm0gPSBmdW5jdGlvbiBnZXRQcm9qZWN0aW9uVHJhbnNmb3JtKCkge1xuICAgIHJldHVybiB0aGlzLl9wcm9qZWN0aW9uVHJhbnNmb3JtO1xufTtcblxuQ2FtZXJhLnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuX29wdGlvbnNNYW5hZ2VyLnNldE9wdGlvbnMob3B0aW9ucyk7XG59O1xuXG5DYW1lcmEucHJvdG90eXBlLmdldE9wdGlvbnMgPSBmdW5jdGlvbiBnZXRPcHRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEVudGl0eVJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi4vRW50aXR5UmVnaXN0cnknKTtcbnZhciBNYXRyaXhNYXRoICAgICA9IHJlcXVpcmUoJy4uLy4uL21hdGgvNHg0bWF0cml4Jyk7XG52YXIgRXZlbnRIYW5kbGVyICAgPSByZXF1aXJlKCcuLi8uLi9ldmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbi8vIENvbnN0c1xudmFyIENPTlRBSU5FUiA9ICdjb250YWluZXInO1xuXG4vKipcbiAqIENvbnRhaW5lciBpcyBhIGNvbXBvbmVudCB0aGF0IGNhbiBiZSBhZGRlZCB0byBhbiBFbnRpdHkgdGhhdFxuICogICBpcyByZXByZXNlbnRlZCBieSBhIERPTSBub2RlIHRocm91Z2ggd2hpY2ggb3RoZXIgcmVuZGVyYWJsZXNcbiAqICAgaW4gdGhlIHNjZW5lIGdyYXBoIGNhbiBiZSBkcmF3biBpbnNpZGUgb2YuXG4gKlxuICogQGNsYXNzIENvbnRhaW5lclxuICogQGNvbXBvbmVudFxuICogQGNvbnN0cnVjdG9yXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgIEVudGl0eSB0aGF0IHRoZSBDb250YWluZXIgaXMgYSBjb21wb25lbnQgb2ZcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gQ29udGFpbmVyKGVudGl0eSwgb3B0aW9ucykge1xuXG4gICAgLy8gVE9ETzogTW9zdCBvZiB0aGVzZSBwcm9wZXJ0aWVzIHNob3VsZCBiZSBhY2Nlc3NlZCBmcm9tIGdldHRlciBNZXRob2RzLCBub3QgcmVhZCBkaXJlY3RseSBhcyB0aGV5IGN1cnJlbnRseSBhcmUgaW4gRE9NUmVuZGVyZXJcblxuICAgIEVudGl0eVJlZ2lzdHJ5LnJlZ2lzdGVyKGVudGl0eSwgJ0hhc0NvbnRhaW5lcicpO1xuICAgIHRoaXMuX2VudGl0eSAgICAgICAgPSBlbnRpdHk7XG4gICAgdGhpcy5fY29udGFpbmVyICAgICA9IG9wdGlvbnMuY29udGFpbmVyO1xuICAgIHZhciB0cmFuc2Zvcm0gICAgICAgPSBlbnRpdHkuZ2V0Q29tcG9uZW50KCd0cmFuc2Zvcm0nKTtcbiAgICB0aGlzLl9pbnZlcnNlTWF0cml4ID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pO1xuICAgIHRoaXMuX3NpemUgICAgICAgICAgPSBvcHRpb25zLnNpemUgfHwgZW50aXR5LmdldENvbnRleHQoKS5fc2l6ZS5zbGljZSgpO1xuICAgIHRoaXMub3JpZ2luICAgICAgICAgPSBbMC41LCAwLjVdO1xuXG4gICAgdGhpcy5fZXZlbnRPdXRwdXQgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG4gICAgdGhpcy5fZXZlbnRPdXRwdXQuYmluZFRoaXModGhpcyk7XG5cbiAgICB0aGlzLl9ldmVudHMgPSB7XG4gICAgICAgIGV2ZW50Rm9yd2FyZGVyOiBmdW5jdGlvbiBldmVudEZvcndhcmRlcihldmVudCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KGV2ZW50LnR5cGUsIGV2ZW50KTtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0uYmluZCh0aGlzKSxcbiAgICAgICAgb24gICAgOiBbXSxcbiAgICAgICAgb2ZmICAgOiBbXSxcbiAgICAgICAgZGlydHkgOiBmYWxzZVxuICAgIH07XG5cbiAgICB0aGlzLl90cmFuc2Zvcm1EaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fc2l6ZURpcnR5ICAgICAgPSB0cnVlO1xuXG4gICAgLy8gSW52ZXJzZXMgdGhlIENvbnRhaW5lcidzIHRyYW5zZm9ybSBtYXRyaXggdG8gaGF2ZSBlbGVtZW50cyBuZXN0ZWQgaW5zaWRlXG4gICAgLy8gdG8gYXBwZWFyIGluIHdvcmxkIHNwYWNlLlxuICAgIHRyYW5zZm9ybS5vbignaW52YWxpZGF0ZWQnLCBmdW5jdGlvbihyZXBvcnQpIHtcbiAgICAgICAgTWF0cml4TWF0aC5pbnZlcnQodGhpcy5faW52ZXJzZU1hdHJpeCwgdHJhbnNmb3JtLl9tYXRyaXgpO1xuICAgICAgICB0aGlzLl90cmFuc2Zvcm1EaXJ0eSA9IHRydWU7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn1cblxuQ29udGFpbmVyLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIENPTlRBSU5FUjtcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdCdzXG4gKiAgRXZlbnRIYW5kbGVyLlxuICpcbiAqIEBtZXRob2Qgb25cbiAqIEBjaGFpbmFibGVcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICovXG5Db250YWluZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBldmVudCA9PT0gJ3N0cmluZycgJiYgY2IgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5vbihldmVudCwgY2IpO1xuICAgICAgICBpZiAodGhpcy5fZXZlbnRzLm9uLmluZGV4T2YoZXZlbnQpIDwgMCkge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzLm9uLnB1c2goZXZlbnQpO1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9ldmVudHMub2ZmLmluZGV4T2YoZXZlbnQpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkgdGhpcy5fZXZlbnRzLm9mZi5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH0gZWxzZSB0aHJvdyBuZXcgRXJyb3IoJ29uIHRha2VzIGFuIGV2ZW50IG5hbWUgYXMgYSBzdHJpbmcgYW5kIGEgY2FsbGJhY2sgdG8gYmUgZmlyZWQgd2hlbiB0aGF0IGV2ZW50IGlzIHJlY2VpdmVkJyk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhIGZ1bmN0aW9uIHRvIGEgcGFydGljdWxhciBldmVudCBvY2N1cmluZy5cbiAqXG4gKiBAbWV0aG9kICBvZmZcbiAqIEBjaGFpbmFibGVcbiAqIFxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IG5hbWUgb2YgdGhlIGV2ZW50IHRvIGNhbGwgdGhlIGZ1bmN0aW9uIHdoZW4gb2NjdXJpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyByZWNpZXZlZC5cbiAqL1xuQ29udGFpbmVyLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbiBvZmYoZXZlbnQsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBldmVudCA9PT0gJ3N0cmluZycgJiYgY2IgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9ldmVudHMub24uaW5kZXhPZihldmVudCk7XG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2IpO1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzLm9uLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMub2ZmLnB1c2goZXZlbnQpO1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB0aHJvdyBuZXcgRXJyb3IoJ29mZiB0YWtlcyBhbiBldmVudCBuYW1lIGFzIGEgc3RyaW5nIGFuZCBhIGNhbGxiYWNrIHRvIGJlIGZpcmVkIHdoZW4gdGhhdCBldmVudCBpcyByZWNlaXZlZCcpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgZXZlbnQgaGFuZGxlciBvYmplY3QgdG8gdGhlIEV2ZW50SGFuZGxlcidzIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKlxuICogQG1ldGhvZCBwaXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCBldmVudCBoYW5kbGVyIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcGFzc2VkIGV2ZW50IGhhbmRsZXJcbiAqL1xuQ29udGFpbmVyLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24gcGlwZSh0YXJnZXQpIHtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5fZXZlbnRPdXRwdXQucGlwZSh0YXJnZXQpO1xuICAgIGZvciAodmFyIGV2ZW50IGluIHRoaXMuX2V2ZW50T3V0cHV0Lmxpc3RlbmVycykge1xuICAgICAgICBpZiAodGhpcy5fZXZlbnRzLm9uLmluZGV4T2YoZXZlbnQpIDwgMCkge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzLm9uLnB1c2goZXZlbnQpO1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuIC8qKlxuICogUmVtb3ZlIGhhbmRsZXIgb2JqZWN0IGZyb20gdGhlIEV2ZW50SGFuZGxlcidzIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKiAgIFVuZG9lcyB3b3JrIG9mIFwicGlwZVwiLlxuICpcbiAqIEBtZXRob2QgdW5waXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCB0YXJnZXQgaGFuZGxlciBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcHJvdmlkZWQgdGFyZ2V0XG4gKi9cbkNvbnRhaW5lci5wcm90b3R5cGUudW5waXBlID0gZnVuY3Rpb24gdW5waXBlKHRhcmdldCkge1xuICAgIHJldHVybiB0aGlzLl9ldmVudE91dHB1dC51bnBpcGUodGFyZ2V0KTtcbn07XG5cbi8qKlxuICogVHJpZ2dlciBhbiBldmVudCwgc2VuZGluZyB0byBhbGwgb2YgdGhlIEV2ZW5ldEhhbmRsZXIncyBcbiAqICBkb3duc3RyZWFtIGhhbmRsZXJzIGxpc3RlbmluZyBmb3IgcHJvdmlkZWQgJ3R5cGUnIGtleS5cbiAqXG4gKiBAbWV0aG9kIGVtaXRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgZXZlbnQgZGF0YVxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkNvbnRhaW5lci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSwgZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQgJiYgIWV2ZW50Lm9yaWdpbikgZXZlbnQub3JpZ2luID0gdGhpcztcbiAgICB2YXIgaGFuZGxlZCA9IHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQodHlwZSwgZXZlbnQpO1xuICAgIGlmIChoYW5kbGVkICYmIGV2ZW50ICYmIGV2ZW50LnN0b3BQcm9wYWdhdGlvbikgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgcmV0dXJuIGhhbmRsZWQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgZGlzcGxheSBtYXRyaXggb2YgdGhlIENvbnRhaW5lci5cbiAqXG4gKiBAbWV0aG9kIGdldERpc3BsYXlNYXRyaXhcbiAqIFxuICogQHJldHVybiB7QXJyYXl9IGRpc3BsYXkgbWF0cml4IG9mIHRoZSBDb250YWluZXJcbiAqL1xuQ29udGFpbmVyLnByb3RvdHlwZS5nZXREaXNwbGF5TWF0cml4ID0gZnVuY3Rpb24gZ2V0RGlzcGxheU1hdHJpeCgpIHtcbiAgICByZXR1cm4gdGhpcy5faW52ZXJzZU1hdHJpeDtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBzaXplIG9mIHRoZSBDb250YWluZXIuXG4gKlxuICogQG1ldGhvZCBnZXRTaXplXG4gKiBcbiAqIEByZXR1cm4ge0FycmF5fSAyIGRpbWVuc2lvbmFsIGFycmF5IG9mIHJlcHJlc2VudGluZyB0aGUgc2l6ZSBvZiB0aGUgQ29udGFpbmVyXG4gKi9cbkNvbnRhaW5lci5wcm90b3R5cGUuZ2V0U2l6ZSA9IGZ1bmN0aW9uIGdldFNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NpemU7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgc2l6ZSBvZiB0aGUgQ29udGFpbmVyLlxuICpcbiAqIEBtZXRob2Qgc2V0U2l6ZVxuICogQGNoYWluYWJsZVxuICogXG4gKiBAcmV0dXJuIHtBcnJheX0gMiBkaW1lbnNpb25hbCBhcnJheSBvZiByZXByZXNlbnRpbmcgdGhlIHNpemUgb2YgdGhlIENvbnRhaW5lclxuICovXG5Db250YWluZXIucHJvdG90eXBlLnNldFNpemUgPSBmdW5jdGlvbiBzZXRTaXplKHdpZHRoLCBoZWlnaHQpIHtcbiAgICB0aGlzLl9zaXplWzBdICAgPSB3aWR0aDtcbiAgICB0aGlzLl9zaXplWzFdICAgPSBoZWlnaHQ7XG4gICAgdGhpcy5fc2l6ZURpcnR5ID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGFpbmVyO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuLi9FbnRpdHlSZWdpc3RyeScpLFxuICAgIFRhcmdldCAgICAgICAgID0gcmVxdWlyZSgnLi9UYXJnZXQnKSxcbiAgICBFdmVudEhhbmRsZXIgICA9IHJlcXVpcmUoJy4uLy4uL2V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxuLy8gQ09OU1RTXG52YXIgVFJBTlNGT1JNID0gJ3RyYW5zZm9ybSc7XG52YXIgU0laRSAgICAgID0gJ3NpemUnO1xudmFyIE9QQUNJVFkgICA9ICdvcGFjaXR5JztcbnZhciBTVVJGQUNFICAgPSAnc3VyZmFjZSc7XG5cbi8qKlxuICogU3VyZmFjZSBpcyBhIGNvbXBvbmVudCB0aGF0IGRlZmluZXMgdGhlIGRhdGEgdGhhdCBzaG91bGRcbiAqICAgYmUgZHJhd24gdG8gYW4gSFRNTEVsZW1lbnQuICBNYW5hZ2VzIENTUyBzdHlsZXMsIEhUTUwgYXR0cmlidXRlcyxcbiAqICAgY2xhc3NlcywgYW5kIGNvbnRlbnQuXG4gKlxuICogQGNsYXNzIFN1cmZhY2VcbiAqIEBjb21wb25lbnRcbiAqIEBjb25zdHJ1Y3RvclxuICogXG4gKiBAcGFyYW0ge0VudGl0eX0gZW50aXR5IEVudGl0eSB0aGF0IHRoZSBTdXJmYWNlIGlzIGEgY29tcG9uZW50IG9mXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBpbnN0YW50aWF0aW9uIG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gU3VyZmFjZShlbnRpdHksIG9wdGlvbnMpIHtcbiAgICBUYXJnZXQuY2FsbCh0aGlzLCBlbnRpdHksIHtcbiAgICAgICAgdmVydGljaWVzOiBbbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMV0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwLCAxXSksXG4gICAgICAgICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDFdKSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMV0pXVxuICAgIH0pO1xuXG4gICAgRW50aXR5UmVnaXN0cnkucmVnaXN0ZXIoZW50aXR5LCAnU3VyZmFjZXMnKTtcbiAgICBFbnRpdHlSZWdpc3RyeS5yZWdpc3RlcihlbnRpdHksICdSZW5kZXJhYmxlcycpO1xuICAgIFxuICAgIHRoaXMuX2VudGl0eSA9IGVudGl0eTtcbiAgICB0aGlzLl9zaXplICAgPSBuZXcgRmxvYXQzMkFycmF5KFswLDBdKTtcblxuICAgIHRoaXMuaW52YWxpZGF0aW9ucyA9IDEyNztcbiAgICB0aGlzLl9ldmVudE91dHB1dCAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG4gICAgdGhpcy5fZXZlbnRPdXRwdXQuYmluZFRoaXModGhpcyk7XG4gICAgdGhpcy5fZXZlbnRGb3J3YXJkZXIgPSBmdW5jdGlvbiBfZXZlbnRGb3J3YXJkZXIoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdChldmVudC50eXBlLCBldmVudCk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5zcGVjID0ge1xuICAgICAgICBfaWQgICAgICAgICAgICA6IGVudGl0eS5faWQsXG4gICAgICAgIGNsYXNzZXMgICAgICAgIDogW10sXG4gICAgICAgIGF0dHJpYnV0ZXMgICAgIDoge30sXG4gICAgICAgIHByb3BlcnRpZXMgICAgIDoge30sXG4gICAgICAgIGNvbnRlbnQgICAgICAgIDogbnVsbCxcbiAgICAgICAgaW52YWxpZGF0aW9ucyAgOiAoMSA8PCBPYmplY3Qua2V5cyhTdXJmYWNlLmludmFsaWRhdGlvbnMpLmxlbmd0aCkgLSAxLFxuICAgICAgICBvcmlnaW4gICAgICAgICA6IG5ldyBGbG9hdDMyQXJyYXkoWzAuNSwgMC41XSksXG4gICAgICAgIGV2ZW50cyAgICAgICAgIDogW10sXG4gICAgICAgIGV2ZW50Rm9yd2FyZGVyIDogdGhpcy5fZXZlbnRGb3J3YXJkZXJcbiAgICB9O1xuXG4gICAgZW50aXR5LmdldENvbXBvbmVudChUUkFOU0ZPUk0pLm9uKCdpbnZhbGlkYXRlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy50cmFuc2Zvcm07XG4gICAgfS5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMuc2V0T3B0aW9ucyhvcHRpb25zKTtcblxuICAgIHRoaXMuX2hhc09yaWdpbiA9IHRydWU7XG59XG5cblN1cmZhY2UucHJvdG90eXBlICAgICAgICAgICAgID0gT2JqZWN0LmNyZWF0ZShUYXJnZXQucHJvdG90eXBlKTtcblN1cmZhY2UucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU3VyZmFjZTtcblxuLy8gSW52YWxpZGF0aW9uIFNjaGVtZVxuU3VyZmFjZS5pbnZhbGlkYXRpb25zID0ge1xuICAgIGNsYXNzZXMgICAgOiAxLFxuICAgIHByb3BlcnRpZXMgOiAyLFxuICAgIGF0dHJpYnV0ZXMgOiA0LFxuICAgIGNvbnRlbnQgICAgOiA4LFxuICAgIHRyYW5zZm9ybSAgOiAxNixcbiAgICBzaXplICAgICAgIDogMzIsXG4gICAgb3BhY2l0eSAgICA6IDY0LFxuICAgIG9yaWdpbiAgICAgOiAxMjgsXG4gICAgZXZlbnRzICAgICA6IDI1NlxufTtcblxuU3VyZmFjZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge3JldHVybiBTVVJGQUNFO307XG5cbi8qKlxuICogR2V0IHRoZSBFbnRpdHkgdGhlIFN1cmZhY2UgaXMgYSBjb21wb25lbnQgb2YuXG4gKlxuICogQG1ldGhvZCBnZXRFbnRpdHlcbiAqXG4gKiBAcmV0dXJuIHtFbnRpdHl9IHRoZSBFbnRpdHkgdGhlIFN1cmZhY2UgaXMgYSBjb21wb25lbnQgb2ZcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuZ2V0RW50aXR5ID0gZnVuY3Rpb24gZ2V0RW50aXR5KCkge1xuICAgIHJldHVybiB0aGlzLl9lbnRpdHk7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgb3B0aW9ucyBvZiB0aGUgU3VyZmFjZS5cbiAqXG4gKiBAbWV0aG9kIHNldE9wdGlvbnNcbiAqIFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgb2JqZWN0IG9mIG9wdGlvbnNcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIHNldE9wdGlvbnMob3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLnByb3BlcnRpZXMpICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0UHJvcGVydGllcyhvcHRpb25zLnByb3BlcnRpZXMpO1xuICAgIGlmIChvcHRpb25zLmNsYXNzZXMpICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0Q2xhc3NlcyhvcHRpb25zLmNsYXNzZXMpO1xuICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZXMpICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlcyhvcHRpb25zLmF0dHJpYnV0ZXMpO1xuICAgIGlmIChvcHRpb25zLmNvbnRlbnQgfHwgb3B0aW9ucy5jb250ZW50ID09PSAnJykgIHRoaXMuc2V0Q29udGVudChvcHRpb25zLmNvbnRlbnQpO1xuICAgIGlmIChvcHRpb25zLnNpemUpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U2l6ZShvcHRpb25zLnNpemUpO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIENTUyBjbGFzc2VzIHRvIGJlIGEgbmV3IEFycmF5IG9mIHN0cmluZ3MuXG4gKlxuICogQG1ldGhvZCBzZXRDbGFzc2VzXG4gKiBcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IG9mIENTUyBjbGFzc2VzXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLnNldENsYXNzZXMgPSBmdW5jdGlvbiBzZXRDbGFzc2VzKGNsYXNzTGlzdCkge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShjbGFzc0xpc3QpKSB0aHJvdyBuZXcgRXJyb3IoXCJTdXJmYWNlOiBleHBlY3RzIGFuIEFycmF5IHRvIGJlIHBhc3NlZCB0byBzZXRDbGFzc2VzXCIpO1xuXG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciByZW1vdmFsID0gW107XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zcGVjLmNsYXNzZXMubGVuZ3RoOyBpKyspXG4gICAgICAgIGlmIChjbGFzc0xpc3QuaW5kZXhPZih0aGlzLnNwZWMuY2xhc3Nlc1tpXSkgPCAwKVxuICAgICAgICAgICAgcmVtb3ZhbC5wdXNoKHRoaXMuc3BlYy5jbGFzc2VzW2ldKTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCByZW1vdmFsLmxlbmd0aDsgaSsrKSAgIHRoaXMucmVtb3ZlQ2xhc3MocmVtb3ZhbFtpXSk7XG4gICAgZm9yIChpID0gMDsgaSA8IGNsYXNzTGlzdC5sZW5ndGg7IGkrKykgdGhpcy5hZGRDbGFzcyhjbGFzc0xpc3RbaV0pO1xuXG4gICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy5zaXplO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYWxsIG9mIHRoZSBjbGFzc2VzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIFN1cmZhY2VcbiAqXG4gKiBAbWV0aG9kIGdldENsYXNzZXNcbiAqIFxuICogQHJldHVybiB7QXJyYXl9IGFycmF5IG9mIENTUyBjbGFzc2VzXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLmdldENsYXNzZXMgPSBmdW5jdGlvbiBnZXRDbGFzc2VzKCkge1xuICAgIHJldHVybiB0aGlzLnNwZWMuY2xhc3Nlcztcbn07XG5cbi8qKlxuICogQWRkIGEgc2luZ2xlIGNsYXNzIHRvIHRoZSBTdXJmYWNlJ3MgbGlzdCBvZiBjbGFzc2VzLlxuICogICBJbnZhbGlkYXRlcyB0aGUgU3VyZmFjZSdzIGNsYXNzZXMuXG4gKlxuICogQG1ldGhvZCBhZGRDbGFzc1xuICogXG4gKiBAcGFyYW0ge1N0cmluZ30gY2xhc3NOYW1lIG5hbWUgb2YgdGhlIGNsYXNzXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24gYWRkQ2xhc3MoY2xhc3NOYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBjbGFzc05hbWUgIT09ICdzdHJpbmcnKSB0aHJvdyBuZXcgRXJyb3IoJ2FkZENsYXNzIG9ubHkgdGFrZXMgU3RyaW5ncyBhcyBwYXJhbWV0ZXJzJyk7XG4gICAgaWYgKHRoaXMuc3BlYy5jbGFzc2VzLmluZGV4T2YoY2xhc3NOYW1lKSA8IDApIHtcbiAgICAgICAgdGhpcy5zcGVjLmNsYXNzZXMucHVzaChjbGFzc05hbWUpO1xuICAgICAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLmNsYXNzZXM7XG4gICAgfVxuXG4gICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy5zaXplO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYSBzaW5nbGUgY2xhc3MgZnJvbSB0aGUgU3VyZmFjZSdzIGxpc3Qgb2YgY2xhc3Nlcy5cbiAqICAgSW52YWxpZGF0ZXMgdGhlIFN1cmZhY2UncyBjbGFzc2VzLlxuICogXG4gKiBAbWV0aG9kIHJlbW92ZUNsYXNzXG4gKiBcbiAqIEBwYXJhbSAge1N0cmluZ30gY2xhc3NOYW1lIGNsYXNzIHRvIHJlbW92ZVxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGNsYXNzTmFtZSkge1xuICAgIGlmICh0eXBlb2YgY2xhc3NOYW1lICE9PSAnc3RyaW5nJykgdGhyb3cgbmV3IEVycm9yKCdhZGRDbGFzcyBvbmx5IHRha2VzIFN0cmluZ3MgYXMgcGFyYW1ldGVycycpO1xuICAgIHZhciBpID0gdGhpcy5zcGVjLmNsYXNzZXMuaW5kZXhPZihjbGFzc05hbWUpO1xuICAgIGlmIChpID49IDApIHtcbiAgICAgICAgdGhpcy5zcGVjLmNsYXNzZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLmNsYXNzZXM7XG4gICAgfVxuXG4gICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy5zaXplO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIENTUyBwcm9wZXJ0aWVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgU3VyZmFjZS5cbiAqICAgSW52YWxpZGF0ZXMgdGhlIFN1cmZhY2UncyBwcm9wZXJ0aWVzLlxuICpcbiAqIEBtZXRob2Qgc2V0UHJvcGVydGllc1xuICovXG5TdXJmYWNlLnByb3RvdHlwZS5zZXRQcm9wZXJ0aWVzID0gZnVuY3Rpb24gc2V0UHJvcGVydGllcyhwcm9wZXJ0aWVzKSB7XG4gICAgZm9yICh2YXIgbiBpbiBwcm9wZXJ0aWVzKSB0aGlzLnNwZWMucHJvcGVydGllc1tuXSA9IHByb3BlcnRpZXNbbl07XG4gICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy5zaXplO1xuICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMucHJvcGVydGllcztcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBDU1MgcHJvcGVydGllcyBhc3NvY2lhdGVkIHdpdGggdGhlIFN1cmZhY2UuXG4gKlxuICogQG1ldGhvZCBnZXRQcm9wZXJ0aWVzXG4gKiBcbiAqIEByZXR1cm4ge09iamVjdH0gQ1NTIHByb3BlcnRpZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBTdXJmYWNlXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLmdldFByb3BlcnRpZXMgPSBmdW5jdGlvbiBnZXRQcm9wZXJ0aWVzKCkge1xuICAgIHJldHVybiB0aGlzLnNwZWMucHJvcGVydGllcztcbn07XG5cbi8qKlxuICogU2V0IHRoZSBIVE1MIGF0dHJpYnV0ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBTdXJmYWNlLlxuICogICBJbnZhbGlkYXRlcyB0aGUgU3VyZmFjZSdzIGF0dHJpYnV0ZXMuXG4gKlxuICogQG1ldGhvZCBzZXRBdHRyaWJ1dGVzXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLnNldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbiBzZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKHZhciBuIGluIGF0dHJpYnV0ZXMpIHRoaXMuc3BlYy5hdHRyaWJ1dGVzW25dID0gYXR0cmlidXRlc1tuXTtcbiAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLmF0dHJpYnV0ZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgSFRNTCBhdHRyaWJ1dGVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgU3VyZmFjZS5cbiAqXG4gKiBAbWV0aG9kIGdldEF0dHJpYnV0ZXNcbiAqIFxuICogQHJldHVybiB7T2JqZWN0fSBIVE1MIGF0dHJpYnV0ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBTdXJmYWNlXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLmdldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbiBnZXRBdHRyaWJ1dGVzKCkge1xuICAgIHJldHVybiB0aGlzLnNwZWMuYXR0cmlidXRlcztcbn07XG5cbi8qKlxuICogU2V0IHRoZSBpbm5lckhUTUwgYXNzb2NpYXRlZCB3aXRoIHRoZSBTdXJmYWNlLlxuICogICBJbnZhbGlkYXRlcyB0aGUgU3VyZmFjZSdzIGNvbnRlbnQuXG4gKlxuICogQG1ldGhvZCBzZXRDb250ZW50XG4gKi9cblN1cmZhY2UucHJvdG90eXBlLnNldENvbnRlbnQgPSBmdW5jdGlvbiBzZXRDb250ZW50KGNvbnRlbnQpIHtcbiAgICBpZiAoY29udGVudCAhPT0gdGhpcy5zcGVjLmNvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5zcGVjLmNvbnRlbnQgICA9IGNvbnRlbnQ7XG4gICAgICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMuY29udGVudDtcbiAgICB9XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgaW5uZXJIVE1MIGFzc29jaWF0ZWQgd2l0aCB0aGUgU3VyZmFjZS5cbiAqXG4gKiBAbWV0aG9kIGdldENvbnRlbnRcbiAqIFxuICogQHJldHVybiB7U3RyaW5nfSBpbm5lckhUTUwgYXNzb2NpYXRlZCB3aXRoIHRoZSBTdXJmYWNlXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLmdldENvbnRlbnQgPSBmdW5jdGlvbiBnZXRDb250ZW50KCkge1xuICAgIHJldHVybiB0aGlzLnNwZWMuY29udGVudDtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBzaXplIG9mIHRoZSBTdXJmYWNlLlxuICpcbiAqIEBtZXRob2Qgc2V0U2l6ZVxuICpcbiAqIEByZXR1cm4ge0FycmF5fSAyLWRpbWVuc2lvbmFsIGFycmF5IHJlcHJlc2VudGluZyB0aGUgc2l6ZSBvZiB0aGUgU3VyZmFjZSBpbiBwaXhlbHMuXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLnNldFNpemUgPSBmdW5jdGlvbiBzZXRTaXplKHNpemUpIHtcbiAgICB2YXIgcHJvcGVydGllcyA9IHt9O1xuICAgIGlmIChzaXplWzBdICE9IG51bGwpIHByb3BlcnRpZXMud2lkdGggPSBzaXplWzBdICsgJ3B4JztcbiAgICBpZiAoc2l6ZVsxXSAhPSBudWxsKSBwcm9wZXJ0aWVzLmhlaWdodCA9IHNpemVbMV0gKyAncHgnO1xuICAgIHRoaXMuc2V0UHJvcGVydGllcyhwcm9wZXJ0aWVzKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBzaXplIG9mIHRoZSBTdXJmYWNlLlxuICpcbiAqIEBtZXRob2QgZ2V0U2l6ZVxuICpcbiAqIEByZXR1cm4ge0FycmF5fSAyLWRpbWVuc2lvbmFsIGFycmF5IHJlcHJlc2VudGluZyB0aGUgc2l6ZSBvZiB0aGUgU3VyZmFjZSBpbiBwaXhlbHMuXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLmdldFNpemUgPSBmdW5jdGlvbiBnZXRTaXplKCkge1xuICAgIHJldHVybiB0aGlzLl9zaXplO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBvcmlnaW4gb2YgdGhlIFN1cmZhY2UuXG4gKlxuICogQG1ldGhvZCBzZXRPcmlnaW5cbiAqIEBjaGFpbmFibGVcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBvcmlnaW4gb24gdGhlIHgtYXhpcyBhcyBhIHBlcmNlbnRcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IG9yaWdpbiBvbiB0aGUgeS1heGlzIGFzIGEgcGVyY2VudFxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5zZXRPcmlnaW4gID0gZnVuY3Rpb24gc2V0T3JpZ2luKHgsIHkpIHtcbiAgICBpZiAoKHggIT0gbnVsbCAmJiAoeCA8IDAgfHwgeCA+IDEpKSB8fCAoeSAhPSBudWxsICYmICh5IDwgMCB8fCB5ID4gMSkpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09yaWdpbiBtdXN0IGhhdmUgYW4geCBhbmQgeSB2YWx1ZSBiZXR3ZWVuIDAgYW5kIDEnKTtcblxuICAgIHRoaXMuc3BlYy5vcmlnaW5bMF0gPSB4ICE9IG51bGwgPyB4IDogdGhpcy5zcGVjLm9yaWdpblswXTtcbiAgICB0aGlzLnNwZWMub3JpZ2luWzFdID0geSAhPSBudWxsID8geSA6IHRoaXMuc3BlYy5vcmlnaW5bMV07XG4gICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy5vcmlnaW47XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgb3JpZ2luIG9mIHRoZSBTdXJmYWNlLlxuICpcbiAqIEBtZXRob2QgZ2V0T3JpZ2luXG4gKlxuICogQHJldHVybiB7QXJyYXl9IDItZGltZW5zaW9uYWwgYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBTdXJmYWNlJ3Mgb3JpZ2luXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLmdldE9yaWdpbiA9IGZ1bmN0aW9uIGdldE9yaWdpbigpIHtcbiAgICByZXR1cm4gdGhpcy5zcGVjLm9yaWdpbjtcbn07XG5cbi8qKlxuICogUmVzZXRzIHRoZSBpbnZhbGlkYXRpb25zIG9mIHRoZSBTdXJmYWNlXG4gKlxuICogQG1ldGhvZCByZXNldEludmFsaWRhdGlvbnNcbiAqIEBjaGFpbmFibGVcbiAqXG4gKiBAcmV0dXJuIHtTdXJmYWNlfSB0aGlzXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLnJlc2V0SW52YWxpZGF0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW52YWxpZGF0aW9ucyA9IDA7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE1hcmsgYWxsIHByb3BlcnRpZXMgYXMgaW52YWxpZGF0ZWQuXG4gKlxuICogQG1ldGhvZCBpbnZhbGlkYXRlQWxsXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHJldHVybiB7U3VyZmFjZX0gdGhpc1xuICovXG5TdXJmYWNlLnByb3RvdHlwZS5pbnZhbGlkYXRlQWxsID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pbnZhbGlkYXRpb25zID0gNTExO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuXG4vKipcbiAqIEJpbmQgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBhbiBldmVudCB0eXBlIGhhbmRsZWQgYnkgdGhpcyBTdXJmYWNlJ3NcbiAqICBFdmVudEhhbmRsZXIuXG4gKlxuICogQG1ldGhvZCBvblxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBoYW5kbGVyIGNhbGxiYWNrXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBldmVudCA9PT0gJ3N0cmluZycgJiYgY2IgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5vbihldmVudCwgY2IpO1xuICAgICAgICBpZiAodGhpcy5zcGVjLmV2ZW50cy5pbmRleE9mKGV2ZW50KSA8IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3BlYy5ldmVudHMucHVzaChldmVudCk7XG4gICAgICAgICAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLmV2ZW50cztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogUmVtb3ZlIGEgZnVuY3Rpb24gdG8gYSBwYXJ0aWN1bGFyIGV2ZW50IG9jY3VyaW5nLlxuICpcbiAqIEBtZXRob2QgIG9mZlxuICogXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgbmFtZSBvZiB0aGUgZXZlbnQgdG8gY2FsbCB0aGUgZnVuY3Rpb24gd2hlbiBvY2N1cmluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IGlzIHJlY2lldmVkLlxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbiBvZmYoZXZlbnQsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBldmVudCA9PT0gJ3N0cmluZycgJiYgY2IgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnNwZWMuZXZlbnRzLmluZGV4T2YoZXZlbnQpO1xuICAgICAgICBpZiAoaW5kZXggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5yZW1vdmVMaXN0ZW5lcihldmVudCwgY2IpO1xuICAgICAgICAgICAgdGhpcy5zcGVjLmV2ZW50cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy5ldmVudHM7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIEFkZCBldmVudCBoYW5kbGVyIG9iamVjdCB0byB0aGUgRXZlbnRIYW5kbGVyJ3MgZG93bnN0cmVhbSBoYW5kbGVycy5cbiAqXG4gKiBAbWV0aG9kIHBpcGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gdGFyZ2V0IGV2ZW50IGhhbmRsZXIgdGFyZ2V0IG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSBwYXNzZWQgZXZlbnQgaGFuZGxlclxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24gcGlwZSh0YXJnZXQpIHtcbiAgICByZXR1cm4gdGhpcy5fZXZlbnRPdXRwdXQucGlwZSh0YXJnZXQpO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgaGFuZGxlciBvYmplY3QgZnJvbSB0aGUgRXZlbnRIYW5kbGVyJ3MgZG93bnN0cmVhbSBoYW5kbGVycy5cbiAqICAgVW5kb2VzIHdvcmsgb2YgXCJwaXBlXCIuXG4gKlxuICogQG1ldGhvZCB1bnBpcGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gdGFyZ2V0IHRhcmdldCBoYW5kbGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSBwcm92aWRlZCB0YXJnZXRcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUudW5waXBlID0gZnVuY3Rpb24gdW5waXBlKHRhcmdldCkge1xuICAgIHJldHVybiB0aGlzLl9ldmVudE91dHB1dC51bnBpcGUodGFyZ2V0KTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSByZW5kZXIgc3BlY2lmaWNhdGlvbiBvZiB0aGUgU3VyZmFjZS5cbiAqXG4gKiBAbWV0aG9kICByZW5kZXJcbiAqIFxuICogQHJldHVybiB7T2JqZWN0fSByZW5kZXIgc3BlY2lmaWNhdGlvblxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNwZWMuaW52YWxpZGF0aW9ucyA9IHRoaXMuaW52YWxpZGF0aW9ucztcbiAgICByZXR1cm4gdGhpcy5zcGVjO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdXJmYWNlO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgTWF0cml4TWF0aCA9IHJlcXVpcmUoJy4uLy4uL21hdGgvNHg0bWF0cml4Jyk7XG5cbi8qKlxuICogVGFyZ2V0IGlzIHRoZSBiYXNlIGNsYXNzIGZvciBhbGwgcmVuZGVyYWJsZXMuICBJdCBob2xkcyB0aGUgc3RhdGUgb2ZcbiAqICAgaXRzIHZlcnRpY2llcywgdGhlIENvbnRhaW5lcnMgaXQgaXMgZGVwbG95ZWQgaW4sIHRoZSBDb250ZXh0IGl0IGJlbG9uZ3NcbiAqICAgdG8sIGFuZCB3aGV0aGVyIG9yIG5vdCBvcmlnaW4gYWxpZ25tZW50IG5lZWRzIHRvIGJlIGFwcGxpZWQuXG4gKlxuICogQGNvbXBvbmVudCBUYXJnZXRcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgIEVudGl0eSB0aGF0IHRoZSBUYXJnZXQgaXMgYSBjb21wb25lbnQgb2ZcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gVGFyZ2V0KGVudGl0eSwgb3B0aW9ucykge1xuICAgIHRoaXMudmVydGljaWVzICA9IG9wdGlvbnMudmVydGljaWVzIHx8IFtdO1xuICAgIHRoaXMuY29udGFpbmVycyA9IHt9O1xuICAgIC8vIHRoaXMuY29udGV4dCAgICA9IGVudGl0eS5nZXRDb250ZXh0KCkuX2lkO1xuICAgIHRoaXMuX2hhc09yaWdpbiA9IGZhbHNlO1xufVxuXG4vKipcbiAqIEdldCB0aGUgdmVydGljaWVzIG9mIHRoZSBUYXJnZXQuXG4gKlxuICogQG1ldGhvZCBnZXRWZXJ0aWNpZXNcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYXJyYXkgb2YgdGhlIHZlcnRpY2llcyByZXByZXNlbnRlZCBhcyB0aHJlZSBlbGVtZW50IGFycmF5cyBbeCwgeSwgel1cbiAqL1xuVGFyZ2V0LnByb3RvdHlwZS5nZXRWZXJ0aWNpZXMgPSBmdW5jdGlvbiBnZXRWZXJ0aWNpZXMoKXtcbiAgICByZXR1cm4gdGhpcy52ZXJ0aWNpZXM7XG59O1xuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBhIFRhcmdldCB3YXMgZGVwbG95ZWQgdG8gYSBwYXJ0aWN1bGFyIGNvbnRhaW5lclxuICpcbiAqIEBtZXRob2QgX2lzV2l0aGluXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZSBpZCBvZiB0aGUgQ29udGFpbmVyJ3MgRW50aXR5XG4gKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIG9yIG5vdyB0aGUgVGFyZ2V0IHdhcyBkZXBsb3llZCB0byB0aGlzIHBhcnRpY3VsYXIgQ29udGFpbmVyXG4gKi9cblRhcmdldC5wcm90b3R5cGUuX2lzV2l0aGluID0gZnVuY3Rpb24gX2lzV2l0aGluKGNvbnRhaW5lcikge1xuICAgIHJldHVybiB0aGlzLmNvbnRhaW5lcnNbY29udGFpbmVyLl9pZF07XG59O1xuXG4vKipcbiAqIE1hcmsgYSBDb250YWluZXIgYXMgaGF2aW5nIGEgZGVwbG95ZWQgaW5zdGFuY2Ugb2YgdGhlIFRhcmdldFxuICpcbiAqIEBtZXRob2QgX2FkZFRvQ29udGFpbmVyXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZSBpZCBvZiB0aGUgQ29udGFpbmVyJ3MgRW50aXR5XG4gKiBAcmV0dXJuIHtCb29sZWFufSBzdGF1cyBvZiB0aGUgYWRkaXRpb25cbiAqL1xuVGFyZ2V0LnByb3RvdHlwZS5fYWRkVG9Db250YWluZXIgPSBmdW5jdGlvbiBfYWRkVG9Db250YWluZXIoY29udGFpbmVyKSB7XG4gICAgdGhpcy5jb250YWluZXJzW2NvbnRhaW5lci5faWRdID0gdHJ1ZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogVW5tYXJrIGEgQ29udGFpbmVyIGFzIGhhdmluZyBhIGRlcGxveWVkIGluc3RhbmNlIG9mIHRoZSBUYXJnZXRcbiAqXG4gKiBAbWV0aG9kIF9yZW1vdmVGcm9tQ29udGFpbmVyXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZSBpZCBvZiB0aGUgQ29udGFpbmVyJ3MgRW50aXR5XG4gKiBAcmV0dXJuIHtCb29sZWFufSBzdGF1cyBvZiB0aGUgcmVtb3ZhbFxuICovXG5UYXJnZXQucHJvdG90eXBlLl9yZW1vdmVGcm9tQ29udGFpbmVyID0gZnVuY3Rpb24gX3JlbW92ZUZyb21Db250YWluZXIoY29udGFpbmVyKSB7XG4gICAgdGhpcy5jb250YWluZXJzW2NvbnRhaW5lci5faWRdID0gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRhcmdldDtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnLi4vLi4vZXZlbnRzL0V2ZW50RW1pdHRlcicpO1xuXG4vLyBDT05TVFNcbnZhciBJREVOVElUWSA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKTtcblxuLy8gRnVuY3Rpb25zIHRvIGJlIHJ1biB3aGVuIGFuIGluZGV4IGlzIG1hcmtlZCBhcyBpbnZhbGlkYXRlZFxudmFyIFZBTElEQVRPUlMgPSBbXG4gICAgZnVuY3Rpb24gdmFsaWRhdGUwKHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbMF0gKiAobWVtb3J5WzJdICogbWVtb3J5WzRdKSAqIHZlY3RvcnMuc2NhbGVbMF0gKyBwYXJlbnRbNF0gKiAobWVtb3J5WzBdICogbWVtb3J5WzVdICsgbWVtb3J5WzFdICogbWVtb3J5WzNdICogbWVtb3J5WzRdKSAqIHZlY3RvcnMuc2NhbGVbMF0gKyBwYXJlbnRbOF0gKiAobWVtb3J5WzFdICogbWVtb3J5WzVdIC0gbWVtb3J5WzBdICogbWVtb3J5WzNdICogbWVtb3J5WzRdKSAqIHZlY3RvcnMuc2NhbGVbMF07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTEocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFsxXSAqIChtZW1vcnlbMl0gKiBtZW1vcnlbNF0pICogdmVjdG9ycy5zY2FsZVswXSArIHBhcmVudFs1XSAqIChtZW1vcnlbMF0gKiBtZW1vcnlbNV0gKyBtZW1vcnlbMV0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNF0pICogdmVjdG9ycy5zY2FsZVswXSArIHBhcmVudFs5XSAqIChtZW1vcnlbMV0gKiBtZW1vcnlbNV0gLSBtZW1vcnlbMF0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNF0pICogdmVjdG9ycy5zY2FsZVswXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlMihwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzJdICogKG1lbW9yeVsyXSAqIG1lbW9yeVs0XSkgKiB2ZWN0b3JzLnNjYWxlWzBdICsgcGFyZW50WzZdICogKG1lbW9yeVswXSAqIG1lbW9yeVs1XSArIG1lbW9yeVsxXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs0XSkgKiB2ZWN0b3JzLnNjYWxlWzBdICsgcGFyZW50WzEwXSAqIChtZW1vcnlbMV0gKiBtZW1vcnlbNV0gLSBtZW1vcnlbMF0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNF0pICogdmVjdG9ycy5zY2FsZVswXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlMyhwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzNdICogKG1lbW9yeVsyXSAqIG1lbW9yeVs0XSkgKiB2ZWN0b3JzLnNjYWxlWzBdICsgcGFyZW50WzddICogKG1lbW9yeVswXSAqIG1lbW9yeVs1XSArIG1lbW9yeVsxXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs0XSkgKiB2ZWN0b3JzLnNjYWxlWzBdICsgcGFyZW50WzExXSAqIChtZW1vcnlbMV0gKiBtZW1vcnlbNV0gLSBtZW1vcnlbMF0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNF0pICogdmVjdG9ycy5zY2FsZVswXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlNChwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzBdICogKC1tZW1vcnlbMl0gKiBtZW1vcnlbNV0pICogdmVjdG9ycy5zY2FsZVsxXSArIHBhcmVudFs0XSAqIChtZW1vcnlbMF0gKiBtZW1vcnlbNF0gLSBtZW1vcnlbMV0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNV0pICogdmVjdG9ycy5zY2FsZVsxXSArIHBhcmVudFs4XSAqIChtZW1vcnlbMV0gKiBtZW1vcnlbNF0gKyBtZW1vcnlbMF0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNV0pICogdmVjdG9ycy5zY2FsZVsxXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlNShwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzFdICogKC1tZW1vcnlbMl0gKiBtZW1vcnlbNV0pICogdmVjdG9ycy5zY2FsZVsxXSArIHBhcmVudFs1XSAqIChtZW1vcnlbMF0gKiBtZW1vcnlbNF0gLSBtZW1vcnlbMV0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNV0pICogdmVjdG9ycy5zY2FsZVsxXSArIHBhcmVudFs5XSAqIChtZW1vcnlbMV0gKiBtZW1vcnlbNF0gKyBtZW1vcnlbMF0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNV0pICogdmVjdG9ycy5zY2FsZVsxXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlNihwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzJdICogKC1tZW1vcnlbMl0gKiBtZW1vcnlbNV0pICogdmVjdG9ycy5zY2FsZVsxXSArIHBhcmVudFs2XSAqIChtZW1vcnlbMF0gKiBtZW1vcnlbNF0gLSBtZW1vcnlbMV0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNV0pICogdmVjdG9ycy5zY2FsZVsxXSArIHBhcmVudFsxMF0gKiAobWVtb3J5WzFdICogbWVtb3J5WzRdICsgbWVtb3J5WzBdICogbWVtb3J5WzNdICogbWVtb3J5WzVdKSAqIHZlY3RvcnMuc2NhbGVbMV07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTcocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFszXSAqICgtbWVtb3J5WzJdICogbWVtb3J5WzVdKSAqIHZlY3RvcnMuc2NhbGVbMV0gKyBwYXJlbnRbN10gKiAobWVtb3J5WzBdICogbWVtb3J5WzRdIC0gbWVtb3J5WzFdICogbWVtb3J5WzNdICogbWVtb3J5WzVdKSAqIHZlY3RvcnMuc2NhbGVbMV0gKyBwYXJlbnRbMTFdICogKG1lbW9yeVsxXSAqIG1lbW9yeVs0XSArIG1lbW9yeVswXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs1XSkgKiB2ZWN0b3JzLnNjYWxlWzFdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGU4KHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbMF0gKiAobWVtb3J5WzNdKSAqIHZlY3RvcnMuc2NhbGVbMl0gKyBwYXJlbnRbNF0gKiAoLW1lbW9yeVsxXSAqIG1lbW9yeVsyXSkgKiB2ZWN0b3JzLnNjYWxlWzJdICsgcGFyZW50WzhdICogKG1lbW9yeVswXSAqIG1lbW9yeVsyXSkgKiB2ZWN0b3JzLnNjYWxlWzJdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGU5KHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbMV0gKiAobWVtb3J5WzNdKSAqIHZlY3RvcnMuc2NhbGVbMl0gKyBwYXJlbnRbNV0gKiAoLW1lbW9yeVsxXSAqIG1lbW9yeVsyXSkgKiB2ZWN0b3JzLnNjYWxlWzJdICsgcGFyZW50WzldICogKG1lbW9yeVswXSAqIG1lbW9yeVsyXSkgKiB2ZWN0b3JzLnNjYWxlWzJdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGUxMChwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzJdICogKG1lbW9yeVszXSkgKiB2ZWN0b3JzLnNjYWxlWzJdICsgcGFyZW50WzZdICogKC1tZW1vcnlbMV0gKiBtZW1vcnlbMl0pICogdmVjdG9ycy5zY2FsZVsyXSArIHBhcmVudFsxMF0gKiAobWVtb3J5WzBdICogbWVtb3J5WzJdKSAqIHZlY3RvcnMuc2NhbGVbMl07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTExKHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbM10gKiAobWVtb3J5WzNdKSAqIHZlY3RvcnMuc2NhbGVbMl0gKyBwYXJlbnRbN10gKiAoLW1lbW9yeVsxXSAqIG1lbW9yeVsyXSkgKiB2ZWN0b3JzLnNjYWxlWzJdICsgcGFyZW50WzExXSAqIChtZW1vcnlbMF0gKiBtZW1vcnlbMl0pICogdmVjdG9ycy5zY2FsZVsyXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlMTIocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFswXSAqIHZlY3RvcnMudHJhbnNsYXRpb25bMF0gKyBwYXJlbnRbNF0gKiB2ZWN0b3JzLnRyYW5zbGF0aW9uWzFdICsgcGFyZW50WzhdICogdmVjdG9ycy50cmFuc2xhdGlvblsyXSArIHBhcmVudFsxMl07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTEzKHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbMV0gKiB2ZWN0b3JzLnRyYW5zbGF0aW9uWzBdICsgcGFyZW50WzVdICogdmVjdG9ycy50cmFuc2xhdGlvblsxXSArIHBhcmVudFs5XSAqIHZlY3RvcnMudHJhbnNsYXRpb25bMl0gKyBwYXJlbnRbMTNdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGUxNChwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzJdICogdmVjdG9ycy50cmFuc2xhdGlvblswXSArIHBhcmVudFs2XSAqIHZlY3RvcnMudHJhbnNsYXRpb25bMV0gKyBwYXJlbnRbMTBdICogdmVjdG9ycy50cmFuc2xhdGlvblsyXSArIHBhcmVudFsxNF07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTE1KHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbM10gKiB2ZWN0b3JzLnRyYW5zbGF0aW9uWzBdICsgcGFyZW50WzddICogdmVjdG9ycy50cmFuc2xhdGlvblsxXSArIHBhcmVudFsxMV0gKiB2ZWN0b3JzLnRyYW5zbGF0aW9uWzJdICsgcGFyZW50WzE1XTtcbiAgICB9XG5dO1xuXG4vLyBNYXAgb2YgaW52YWxpZGF0aW9uIG51bWJlcnNcbnZhciBERVBFTkRFTlRTID0ge1xuICAgIGdsb2JhbCA6IFs0MzY5LDg3MzgsMTc0NzYsMzQ5NTIsNDM2OSw4NzM4LDE3NDc2LDM0OTUyLDQzNjksODczOCwxNzQ3NiwzNDk1Miw0MDk2LDgxOTIsMTYzODQsMzI3NjhdLFxuICAgIGxvY2FsICA6IHtcbiAgICAgICAgdHJhbnNsYXRpb24gOiBbNjE0NDAsNjE0NDAsNjE0NDBdLFxuICAgICAgICByb3RhdGlvbiAgICA6IFs0MDk1LDQwOTUsMjU1XSxcbiAgICAgICAgc2NhbGUgICAgICAgOiBbNDA5NSw0MDk1LDQwOTVdLFxuICAgIH1cbn07XG5cbi8qKlxuICogVHJhbnNmb3JtIGlzIGEgY29tcG9uZW50IHRoYXQgaXMgcGFydCBvZiBldmVyeSBFbnRpdHkuICBJdCBpc1xuICogICByZXNwb25zaWJsZSBmb3IgdXBkYXRpbmcgaXQncyBvd24gbm90aW9uIG9mIHBvc2l0aW9uIGluIHNwYWNlIGFuZFxuICogICBpbmNvcnBvcmF0aW5nIHRoYXQgd2l0aCBwYXJlbnQgaW5mb3JtYXRpb24uXG4gKlxuICogQGNsYXNzIFRyYW5zZm9ybVxuICogQGNvbXBvbmVudFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRyYW5zZm9ybSgpIHtcbiAgICB0aGlzLl9tYXRyaXggICA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKTtcbiAgICB0aGlzLl9tZW1vcnkgICA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDEsIDAsIDEsIDBdKTtcbiAgICB0aGlzLl92ZWN0b3JzICA9IHtcbiAgICAgICAgdHJhbnNsYXRpb24gOiBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwXSksXG4gICAgICAgIHJvdGF0aW9uICAgIDogbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMF0pLFxuICAgICAgICBzY2FsZSAgICAgICA6IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDEsIDFdKVxuICAgIH07XG4gICAgdGhpcy5fSU8gICAgICAgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgdGhpcy5fdXBkYXRlRk4gPSBudWxsO1xuICAgIHRoaXMuX211dGF0b3IgID0ge1xuICAgICAgICB0cmFuc2xhdGUgICAgICA6IHRoaXMudHJhbnNsYXRlLmJpbmQodGhpcyksXG4gICAgICAgIHJvdGF0ZSAgICAgICAgIDogdGhpcy5yb3RhdGUuYmluZCh0aGlzKSxcbiAgICAgICAgc2NhbGUgICAgICAgICAgOiB0aGlzLnNjYWxlLmJpbmQodGhpcyksXG4gICAgICAgIHNldFRyYW5zbGF0aW9uIDogdGhpcy5zZXRUcmFuc2xhdGlvbi5iaW5kKHRoaXMpLFxuICAgICAgICBzZXRSb3RhdGlvbiAgICA6IHRoaXMuc2V0Um90YXRpb24uYmluZCh0aGlzKSxcbiAgICAgICAgc2V0U2NhbGUgICAgICAgOiB0aGlzLnNldFNjYWxlLmJpbmQodGhpcylcbiAgICB9O1xuICAgIHRoaXMuX2ludmFsaWRhdGVkID0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIHRyYW5zZm9ybSBtYXRyaXggdGhhdCByZXByZXNlbnRzIHRoaXMgVHJhbnNmb3JtJ3MgdmFsdWVzIFxuICogICBiZWluZyBhcHBsaWVkIHRvIGl0J3MgcGFyZW50J3MgZ2xvYmFsIHRyYW5zZm9ybS5cbiAqXG4gKiBAbWV0aG9kIGdldEdsb2JhbE1hdHJpeFxuICogXG4gKiBAcmV0dXJuIHtGbG9hdDMyIEFycmF5fSByZXByZXNlbnRhdGlvbiBvZiB0aGlzIFRyYW5zZm9ybSBiZWluZyBhcHBsaWVkIHRvIGl0J3MgcGFyZW50XG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUuZ2V0R2xvYmFsTWF0cml4ID0gZnVuY3Rpb24gZ2V0R2xvYmFsTWF0cml4KCkge1xuICAgIHJldHVybiB0aGlzLl9tYXRyaXg7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgdmVjdG9yaXplZCBpbmZvcm1hdGlvbiBmb3IgdGhpcyBUcmFuc2Zvcm0ncyBsb2NhbFxuICogICB0cmFuc2Zvcm0uXG4gKlxuICogQG1ldGhvZCBnZXRMb2NhbFZlY3RvcnNcbiAqIFxuICogQHJldHVybiB7T2JqZWN0fSBvYmplY3Qgd2l0aCB0cmFuc2xhdGUsIHJvdGF0ZSwgYW5kIHNjYWxlIGtleXNcbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS5nZXRMb2NhbFZlY3RvcnMgPSBmdW5jdGlvbiBnZXRWZWN0b3JzKCkge1xuICAgIHJldHVybiB0aGlzLl92ZWN0b3JzO1xufTtcblxuLyoqXG4gKiBEZWZpbmUgdGhlIHByb3ZpZGVyIG9mIHN0YXRlIGZvciB0aGUgVHJhbnNmb3JtLlxuICpcbiAqIEBtZXRob2QgdXBkYXRlRnJvbVxuICogQGNoYWluYWJsZVxuICogXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gcHJvdmlkZXIgc291cmNlIG9mIHN0YXRlIGZvciB0aGUgVHJhbnNmb3JtXG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUudXBkYXRlRnJvbSA9IGZ1bmN0aW9uIHVwZGF0ZUZyb20ocHJvdmlkZXIpIHtcbiAgICBpZiAocHJvdmlkZXIgaW5zdGFuY2VvZiBGdW5jdGlvbiB8fCAhcHJvdmlkZXIpIHRoaXMuX3VwZGF0ZUZOID0gcHJvdmlkZXI7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGxvY2FsIGludmFsaWRhdGlvbiBzY2hlbWUgYmFzZWQgb24gcGFyZW50IGluZm9ybWF0aW9uXG4gKlxuICogQG1ldGhvZCBfaW52YWxpZGF0ZUZyb21QYXJlbnRcbiAqIEBwcml2YXRlXG4gKiBcbiAqIEBwYXJhbSAge051bWJlcn0gcGFyZW50UmVwb3J0IHBhcmVudCdzIGludmFsaWRhdGlvblxuICovXG5mdW5jdGlvbiBfaW52YWxpZGF0ZUZyb21QYXJlbnQocGFyZW50UmVwb3J0KSB7XG4gICAgdmFyIGNvdW50ZXIgPSAwO1xuICAgIHdoaWxlIChwYXJlbnRSZXBvcnQpIHtcbiAgICAgICAgaWYgKHBhcmVudFJlcG9ydCAmIDEpIHRoaXMuX2ludmFsaWRhdGVkIHw9IERFUEVOREVOVFMuZ2xvYmFsW2NvdW50ZXJdO1xuICAgICAgICBjb3VudGVyKys7XG4gICAgICAgIHBhcmVudFJlcG9ydCA+Pj49IDE7XG4gICAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSB0aGUgZ2xvYmFsIG1hdHJpeCBiYXNlZCBvbiBsb2NhbCBhbmQgcGFyZW50IGludmFsaWRhdGlvbnMuXG4gKlxuICogQG1ldGhvZCAgX3VwZGF0ZVxuICogQHByaXZhdGVcbiAqIFxuICogQHBhcmFtICB7TnVtYmVyfSBwYXJlbnRSZXBvcnQgaW52YWxpZGF0aW9ucyBhc3NvY2lhdGVkIHdpdGggdGhlIHBhcmVudCBtYXRyaXhcbiAqIEBwYXJhbSAge0FycmF5fSBwYXJlbnRNYXRyaXggcGFyZW50IHRyYW5zZm9ybSBtYXRyaXggYXMgYW4gQXJyYXlcbiAqIEByZXR1cm4ge051bWJlcn0gaW52YWxpZGF0aW9uIHNjaGVtZVxuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLl91cGRhdGUgPSBmdW5jdGlvbiBfdXBkYXRlKHBhcmVudFJlcG9ydCwgcGFyZW50TWF0cml4KSB7XG4gICAgaWYgKHBhcmVudFJlcG9ydCkgIF9pbnZhbGlkYXRlRnJvbVBhcmVudC5jYWxsKHRoaXMsIHBhcmVudFJlcG9ydCk7XG4gICAgaWYgKCFwYXJlbnRNYXRyaXgpIHBhcmVudE1hdHJpeCA9IElERU5USVRZO1xuICAgIGlmICh0aGlzLl91cGRhdGVGTikgdGhpcy5fdXBkYXRlRk4odGhpcy5fbXV0YXRvcik7XG4gICAgdmFyIHVwZGF0ZTtcbiAgICB2YXIgY291bnRlciAgICAgPSAwO1xuICAgIHZhciBpbnZhbGlkYXRlZCA9IHRoaXMuX2ludmFsaWRhdGVkO1xuXG4gICAgLy8gQmFzZWQgb24gaW52YWxpZGF0aW9ucyB1cGRhdGUgb25seSB0aGUgbmVlZGVkIGluZGljaWVzXG4gICAgd2hpbGUgKHRoaXMuX2ludmFsaWRhdGVkKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbnZhbGlkYXRlZCAmIDEpIHtcbiAgICAgICAgICAgIHVwZGF0ZSA9IFZBTElEQVRPUlNbY291bnRlcl0ocGFyZW50TWF0cml4LCB0aGlzLl92ZWN0b3JzLCB0aGlzLl9tZW1vcnkpO1xuICAgICAgICAgICAgaWYgKHVwZGF0ZSAhPT0gdGhpcy5fbWF0cml4W2NvdW50ZXJdKVxuICAgICAgICAgICAgICAgIHRoaXMuX21hdHJpeFtjb3VudGVyXSA9IHVwZGF0ZTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpbnZhbGlkYXRlZCAmPSAoKDEgPDwgMTYpIC0gMSkgXiAoMSA8PCBjb3VudGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvdW50ZXIrKztcbiAgICAgICAgdGhpcy5faW52YWxpZGF0ZWQgPj4+PSAxO1xuICAgIH1cblxuICAgIGlmIChpbnZhbGlkYXRlZCkgdGhpcy5fSU8uZW1pdCgnaW52YWxpZGF0ZWQnLCBpbnZhbGlkYXRlZCk7XG4gICAgcmV0dXJuIGludmFsaWRhdGVkO1xufTtcblxuLyoqXG4gKiBBZGQgZXh0cmEgdHJhbnNsYXRpb24gdG8gdGhlIGN1cnJlbnQgdmFsdWVzLiAgSW52YWxpZGF0ZXNcbiAqICAgdHJhbnNsYXRpb24gYXMgbmVlZGVkLlxuICpcbiAqIEBtZXRob2QgdHJhbnNsYXRlXG4gKiAgIFxuICogQHBhcmFtICB7TnVtYmVyfSB4IHRyYW5zbGF0aW9uIGFsb25nIHRoZSB4LWF4aXMgaW4gcGl4ZWxzXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHkgdHJhbnNsYXRpb24gYWxvbmcgdGhlIHktYXhpcyBpbiBwaXhlbHNcbiAqIEBwYXJhbSAge051bWJlcn0geiB0cmFuc2xhdGlvbiBhbG9uZyB0aGUgei1heGlzIGluIHBpeGVsc1xuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uIHRyYW5zbGF0ZSh4LCB5LCB6KSB7XG4gICAgdmFyIHRyYW5zbGF0aW9uID0gdGhpcy5fdmVjdG9ycy50cmFuc2xhdGlvbjtcbiAgICB2YXIgZGlydHkgICAgICAgPSBmYWxzZTtcbiAgICB2YXIgc2l6ZTtcblxuICAgIGlmICh4KSB7XG4gICAgICAgIHRyYW5zbGF0aW9uWzBdICs9IHg7XG4gICAgICAgIGRpcnR5ICAgICAgICAgICA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHkpIHtcbiAgICAgICAgdHJhbnNsYXRpb25bMV0gKz0geTtcbiAgICAgICAgZGlydHkgICAgICAgICAgID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoeikge1xuICAgICAgICB0cmFuc2xhdGlvblsyXSArPSB6O1xuICAgICAgICAvLyBkaXJ0eSAgICAgICAgICAgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChkaXJ0eSkgdGhpcy5faW52YWxpZGF0ZWQgfD0gNjE0NDA7XG59O1xuXG4vKipcbiAqIEFkZCBleHRyYSByb3RhdGlvbiB0byB0aGUgY3VycmVudCB2YWx1ZXMuICBJbnZhbGlkYXRlc1xuICogICByb3RhdGlvbiBhcyBuZWVkZWQuXG4gKlxuICogQG1ldGhvZCByb3RhdGVcbiAqICAgXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHggcm90YXRpb24gYWJvdXQgdGhlIHgtYXhpcyBpbiByYWRpYW5zXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHkgcm90YXRpb24gYWJvdXQgdGhlIHktYXhpcyBpbiByYWRpYW5zXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHogcm90YXRpb24gYWJvdXQgdGhlIHotYXhpcyBpbiByYWRpYW5zXG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24gcm90YXRlKHgsIHksIHopIHtcbiAgICB2YXIgcm90YXRpb24gPSB0aGlzLl92ZWN0b3JzLnJvdGF0aW9uO1xuICAgIHRoaXMuc2V0Um90YXRpb24oKHggPyB4IDogMCkgKyByb3RhdGlvblswXSwgKHkgPyB5IDogMCkgKyByb3RhdGlvblsxXSwgKHogPyB6IDogMCkgKyByb3RhdGlvblsyXSk7XG59O1xuXG4vKipcbiAqIEFkZCBleHRyYSBzY2FsZSB0byB0aGUgY3VycmVudCB2YWx1ZXMuICBJbnZhbGlkYXRlc1xuICogICBzY2FsZSBhcyBuZWVkZWQuXG4gKlxuICogQG1ldGhvZCBzY2FsZVxuICogICBcbiAqIEBwYXJhbSAge051bWJlcn0geCBzY2FsZSBhbG9uZyB0aGUgeC1heGlzIGFzIGEgcGVyY2VudFxuICogQHBhcmFtICB7TnVtYmVyfSB5IHNjYWxlIGFsb25nIHRoZSB5LWF4aXMgYXMgYSBwZXJjZW50XG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHogc2NhbGUgYWxvbmcgdGhlIHotYXhpcyBhcyBhIHBlcmNlbnRcbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uIHNjYWxlKHgsIHksIHopIHtcbiAgICB2YXIgc2NhbGVWZWN0b3IgPSB0aGlzLl92ZWN0b3JzLnNjYWxlO1xuICAgIHZhciBkaXJ0eSAgICAgICA9IGZhbHNlO1xuXG4gICAgaWYgKHgpIHtcbiAgICAgICAgc2NhbGVWZWN0b3JbMF0gKz0geDtcbiAgICAgICAgZGlydHkgICAgID0gZGlydHkgfHwgdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoeSkge1xuICAgICAgICBzY2FsZVZlY3RvclsxXSArPSB5O1xuICAgICAgICBkaXJ0eSAgICAgPSBkaXJ0eSB8fCB0cnVlO1xuICAgIH1cblxuICAgIGlmICh6KSB7XG4gICAgICAgIHNjYWxlVmVjdG9yWzJdICs9IHo7XG4gICAgICAgIGRpcnR5ICAgICA9IGRpcnR5IHx8IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGRpcnR5KSB0aGlzLl9pbnZhbGlkYXRlZCB8PSA0MDk1O1xufTtcblxuLyoqXG4gKiBBYnNvbHV0ZSBzZXQgb2YgdGhlIFRyYW5zZm9ybSdzIHRyYW5zbGF0aW9uLiAgSW52YWxpZGF0ZXNcbiAqICAgdHJhbnNsYXRpb24gYXMgbmVlZGVkLlxuICpcbiAqIEBtZXRob2Qgc2V0VHJhbnNsYXRpb25cbiAqIFxuICogQHBhcmFtICB7TnVtYmVyfSB4IHRyYW5zbGF0aW9uIGFsb25nIHRoZSB4LWF4aXMgaW4gcGl4ZWxzXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHkgdHJhbnNsYXRpb24gYWxvbmcgdGhlIHktYXhpcyBpbiBwaXhlbHNcbiAqIEBwYXJhbSAge051bWJlcn0geiB0cmFuc2xhdGlvbiBhbG9uZyB0aGUgei1heGlzIGluIHBpeGVsc1xuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFRyYW5zbGF0aW9uID0gZnVuY3Rpb24gc2V0VHJhbnNsYXRpb24oeCwgeSwgeikge1xuICAgIHZhciB0cmFuc2xhdGlvbiA9IHRoaXMuX3ZlY3RvcnMudHJhbnNsYXRpb247XG4gICAgdmFyIGRpcnR5ICAgICAgID0gZmFsc2U7XG4gICAgdmFyIHNpemU7XG5cbiAgICBpZiAoeCAhPT0gdHJhbnNsYXRpb25bMF0gJiYgeCAhPSBudWxsKSB7XG4gICAgICAgIHRyYW5zbGF0aW9uWzBdID0geDtcbiAgICAgICAgZGlydHkgICAgICAgICAgPSBkaXJ0eSB8fCB0cnVlO1xuICAgIH1cblxuICAgIGlmICh5ICE9PSB0cmFuc2xhdGlvblsxXSAmJiB5ICE9IG51bGwpIHtcbiAgICAgICAgdHJhbnNsYXRpb25bMV0gPSB5O1xuICAgICAgICBkaXJ0eSAgICAgICAgICA9IGRpcnR5IHx8IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHogIT09IHRyYW5zbGF0aW9uWzJdICYmIHogIT0gbnVsbCkge1xuICAgICAgICB0cmFuc2xhdGlvblsyXSA9IHo7XG4gICAgICAgIGRpcnR5ICAgICAgICAgID0gZGlydHkgfHwgdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoZGlydHkpIHRoaXMuX2ludmFsaWRhdGVkIHw9IDYxNDQwO1xufTtcblxuLyoqXG4gKiBBYnNvbHV0ZSBzZXQgb2YgdGhlIFRyYW5zZm9ybSdzIHJvdGF0aW9uLiAgSW52YWxpZGF0ZXNcbiAqICAgcm90YXRpb24gYXMgbmVlZGVkLlxuICpcbiAqIEBtZXRob2Qgc2V0Um90YXRlXG4gKiAgIFxuICogQHBhcmFtICB7TnVtYmVyfSB4IHJvdGF0aW9uIGFib3V0IHRoZSB4LWF4aXMgaW4gcmFkaWFuc1xuICogQHBhcmFtICB7TnVtYmVyfSB5IHJvdGF0aW9uIGFib3V0IHRoZSB5LWF4aXMgaW4gcmFkaWFuc1xuICogQHBhcmFtICB7TnVtYmVyfSB6IHJvdGF0aW9uIGFib3V0IHRoZSB6LWF4aXMgaW4gcmFkaWFuc1xuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFJvdGF0aW9uID0gZnVuY3Rpb24gc2V0Um90YXRpb24oeCwgeSwgeikge1xuICAgIHZhciByb3RhdGlvbiA9IHRoaXMuX3ZlY3RvcnMucm90YXRpb247XG4gICAgdmFyIGRpcnR5ICAgID0gZmFsc2U7XG5cbiAgICBpZiAoeCAhPT0gcm90YXRpb25bMF0gJiYgeCAhPSBudWxsKSB7XG4gICAgICAgIHJvdGF0aW9uWzBdICAgICA9IHg7XG4gICAgICAgIHRoaXMuX21lbW9yeVswXSA9IE1hdGguY29zKHgpO1xuICAgICAgICB0aGlzLl9tZW1vcnlbMV0gPSBNYXRoLnNpbih4KTtcbiAgICAgICAgZGlydHkgICAgICAgICAgID0gZGlydHkgfHwgdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoeSAhPT0gcm90YXRpb25bMV0gJiYgeSAhPSBudWxsKSB7XG4gICAgICAgIHJvdGF0aW9uWzFdICAgICA9IHk7XG4gICAgICAgIHRoaXMuX21lbW9yeVsyXSA9IE1hdGguY29zKHkpO1xuICAgICAgICB0aGlzLl9tZW1vcnlbM10gPSBNYXRoLnNpbih5KTtcbiAgICAgICAgZGlydHkgICAgICAgICAgID0gZGlydHkgfHwgdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoeiAhPT0gcm90YXRpb25bMl0gJiYgeiAhPSBudWxsKSB7XG4gICAgICAgIHJvdGF0aW9uWzJdICAgICAgICA9IHo7XG4gICAgICAgIHRoaXMuX21lbW9yeVs0XSAgICA9IE1hdGguY29zKHopO1xuICAgICAgICB0aGlzLl9tZW1vcnlbNV0gICAgPSBNYXRoLnNpbih6KTtcbiAgICAgICAgdGhpcy5faW52YWxpZGF0ZWQgfD0gMjU1O1xuICAgIH1cblxuICAgIGlmIChkaXJ0eSkgdGhpcy5faW52YWxpZGF0ZWQgfD0gNDA5NTtcbn07XG5cbi8qKlxuICogQWJzb2x1dGUgc2V0IG9mIHRoZSBUcmFuc2Zvcm0ncyBzY2FsZS4gIEludmFsaWRhdGVzXG4gKiAgIHNjYWxlIGFzIG5lZWRlZC5cbiAqXG4gKiBAbWV0aG9kIHNldFNjYWxlXG4gKiAgIFxuICogQHBhcmFtICB7TnVtYmVyfSB4IHNjYWxlIGFsb25nIHRoZSB4LWF4aXMgYXMgYSBwZXJjZW50XG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHkgc2NhbGUgYWxvbmcgdGhlIHktYXhpcyBhcyBhIHBlcmNlbnRcbiAqIEBwYXJhbSAge051bWJlcn0geiBzY2FsZSBhbG9uZyB0aGUgei1heGlzIGFzIGEgcGVyY2VudFxuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnNldFNjYWxlID0gZnVuY3Rpb24gc2V0U2NhbGUoeCwgeSwgeikge1xuICAgIHZhciBzY2FsZSA9IHRoaXMuX3ZlY3RvcnMuc2NhbGU7XG4gICAgdmFyIGRpcnR5ID0gZmFsc2U7XG5cbiAgICBpZiAoeCAhPT0gc2NhbGVbMF0pIHtcbiAgICAgICAgc2NhbGVbMF0gPSB4O1xuICAgICAgICBkaXJ0eSAgICA9IGRpcnR5IHx8IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHkgIT09IHNjYWxlWzFdKSB7XG4gICAgICAgIHNjYWxlWzFdID0geTtcbiAgICAgICAgZGlydHkgICAgPSBkaXJ0eSB8fCB0cnVlO1xuICAgIH1cblxuICAgIGlmICh6ICE9PSBzY2FsZVsyXSkge1xuICAgICAgICBzY2FsZVsyXSA9IHo7XG4gICAgICAgIGRpcnR5ICAgID0gZGlydHkgfHwgdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoZGlydHkpIHRoaXMuX2ludmFsaWRhdGVkIHw9IDQwOTU7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGZ1bmN0aW9ucyB0byBiZSBjYWxsZWQgb24gdGhlIFRyYW5zZm9ybSdzIGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIG9uXG4gKiBAY2hhaW5hYmxlXG4gKlxuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oKSB7XG4gICAgdGhpcy5fSU8ub24uYXBwbHkodGhpcy5fSU8sIGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEVudGl0eSAgICAgICAgID0gcmVxdWlyZSgnLi9FbnRpdHknKTtcbnZhciBFbnRpdHlSZWdpc3RyeSA9IHJlcXVpcmUoJy4vRW50aXR5UmVnaXN0cnknKTtcbnZhciBDb250YWluZXIgICAgICA9IHJlcXVpcmUoJy4vQ29tcG9uZW50cy9Db250YWluZXInKTtcbnZhciBDYW1lcmEgICAgICAgICA9IHJlcXVpcmUoJy4vQ29tcG9uZW50cy9DYW1lcmEnKTtcblxuLyoqXG4gKiBDb250ZXh0IGlzIHRoZSBkZWZpbml0aW9uIG9mIHdvcmxkIHNwYWNlIGZvciB0aGF0IHBhcnQgb2YgdGhlIHNjZW5lIGdyYXBoLlxuICogICBBIGNvbnRleHQgY2FuIGVpdGhlciBoYXZlIGEgQ29udGFpbmVyIG9yIG5vdC4gIEhhdmluZyBhIGNvbnRhaW5lciBtZWFuc1xuICogICB0aGF0IHBhcnRzIG9mIHRoZSBzY2VuZSBncmFwaCBjYW4gYmUgZHJhd24gaW5zaWRlIG9mIGl0LiAgSWYgaXQgZG9lcyBub3RcbiAqICAgaGF2ZSBhIENvbnRhaW5lciB0aGVuIHRoZSBDb250ZXh0IGlzIG9ubHkgcmVzcG9uc2libGUgZm9yIGRlZmluaW5nIHdvcmxkXG4gKiAgIHNwYWNlLiAgVGhlIENvcmVTeXN0ZW0gd2lsbCBzdGFydCBhdCBlYWNoIENvbnRleHQgYW5kIHJlY3Vyc2l2ZSBkb3duXG4gKiAgIHRocm91Z2ggdGhlaXIgY2hpbGRyZW4gdG8gdXBkYXRlIGVhY2ggZW50aXRpeSdzIFRyYW5zZm9ybSwgU2l6ZSxcbiAqICAgYW5kIE9wYWNpdHkuXG4gKlxuICogQGNsYXNzIENvbnRleHRcbiAqIEBlbnRpdHlcbiAqIEBjb25zdHJ1Y3RvclxuICogICBcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIHRoZSBzdGFydGluZyBvcHRpb25zIGZvciB0aGUgQ29udGV4dFxuICogQHBhcmFtIHtBcnJheX0gb3B0aW9ucy50cmFuc2Zvcm0gdGhlIHN0YXJ0aW5nIHRyYW5zZm9ybSBtYXRyaXhcbiAqIEBwYXJhbSB7QXJyYXl9IG9wdGlvbnMuc2l6ZSB0aGUgc3RhcnRpbmcgc2l6ZVxuICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLmhhc0NvbnRhaW5lciB3aGV0aGVyIG9yIG5vdCB0aGUgQ29udGV4dCBoYXMgYSBDb250YWluZXJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5oYXNDYW1lcmEgd2hldGhlciBvciBub3QgdGhlIENvbnRleHQgaGFzIGEgQ2FtZXJhXG4gKi9cbmZ1bmN0aW9uIENvbnRleHQob3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucyB8fCB0eXBlb2Ygb3B0aW9ucyAhPT0gJ29iamVjdCcgfHwgKCFvcHRpb25zLnNpemUgJiYgIW9wdGlvbnMucGFyZW50RWwgJiYgIW9wdGlvbnMuY29udGFpbmVyKSkgdGhyb3cgbmV3IEVycm9yKCdDb250ZXh0LCBtdXN0IGJlIGNhbGxlZCB3aXRoIGFuIG9wdGlvbiBoYXNoIHRoYXQgYXQgbGVhc3QgaGFzIGEgc2l6ZSBvciBhIHBhcmVudEVsIG9yIGEgY29udGFpbmVyIHByb3BlcnR5Jyk7XG4gICAgRW50aXR5LmNhbGwodGhpcyk7XG4gICAgRW50aXR5UmVnaXN0cnkucmVnaXN0ZXIodGhpcywgJ0NvbnRleHRzJyk7XG4gICAgdGhpcy5fcGFyZW50RWwgPSBvcHRpb25zLnBhcmVudEVsO1xuICAgIHRoaXMuX3NpemUgICAgID0gX2dldFNpemUob3B0aW9ucyk7XG4gICAgdGhpcy5fY29tcG9uZW50cy50cmFuc2Zvcm0uX3VwZGF0ZSgoMSA8PCAxNikgLSAxLCBvcHRpb25zLnRyYW5zZm9ybSk7XG4gICAgaWYgKG9wdGlvbnMuaGFzQ29udGFpbmVyICE9PSBmYWxzZSkgdGhpcy5fY29tcG9uZW50cy5jb250YWluZXIgPSBuZXcgQ29udGFpbmVyKHRoaXMsIG9wdGlvbnMpO1xuICAgIGlmIChvcHRpb25zLmhhc0NhbWVyYSAgICAhPT0gZmFsc2UpIHRoaXMuX2NvbXBvbmVudHMuY2FtZXJhICAgID0gbmV3IENhbWVyYSh0aGlzLCBvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBBIG1ldGhvZCBmb3IgZGV0ZXJtaW5pbmcgd2hhdCB0aGUgc2l6ZSBvZiB0aGUgQ29udGV4dCBpcy5cbiAqICBXaWxsIGJlIHRoZSB1c2VyIGRlZmluZWQgc2l6ZSBpZiBvbmUgd2FzIHByb3ZpZGVkIG90aGVyd2lzZSBpdFxuICogIHdpbGwgZGVmYXVsdCB0byB0aGUgRE9NIHJlcHJlc2VudGF0aW9uLiAgXG4gKlxuICogQG1ldGhvZCBfZ2V0U2l6ZVxuICogQHByaXZhdGVcbiAqIFxuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIHN0YXJ0aW5nIG9wdGlvbnMgZm9yIHRoZSBzaXplc1xuICogQHJldHVybiB7QXJyYXl9IHNpemUgb2YgdGhlIENvbnRleHRcbiAqL1xuZnVuY3Rpb24gX2dldFNpemUob3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLnNpemUpICAgICAgcmV0dXJuIG9wdGlvbnMuc2l6ZTtcbiAgICBpZiAob3B0aW9ucy5jb250YWluZXIpIHJldHVybiBbb3B0aW9ucy5jb250YWluZXIub2Zmc2V0V2lkdGgsIG9wdGlvbnMuY29udGFpbmVyLm9mZnNldEhlaWdodCwgMF07XG4gICAgcmV0dXJuIFtvcHRpb25zLnBhcmVudEVsLm9mZnNldFdpZHRoLCBvcHRpb25zLnBhcmVudEVsLm9mZnNldEhlaWdodCwgMF07XG59XG5cbkNvbnRleHQucHJvdG90eXBlICAgICAgICAgICAgICAgICAgICAgPSBPYmplY3QuY3JlYXRlKEVudGl0eS5wcm90b3R5cGUpO1xuQ29udGV4dC5wcm90b3R5cGUuY29uc3RydWN0b3IgICAgICAgICA9IENvbnRleHQ7XG5Db250ZXh0LnByb3RvdHlwZS51cGRhdGUgICAgICAgICAgICAgID0gbnVsbDtcbkNvbnRleHQucHJvdG90eXBlLnJlZ2lzdGVyQ29tcG9uZW50ICAgPSBudWxsO1xuQ29udGV4dC5wcm90b3R5cGUuZGVyZWdpc3RlckNvbXBvbmVudCA9IG51bGw7XG5Db250ZXh0LnByb3RvdHlwZS5hZGRDb21wb25lbnQgICAgICAgID0gbnVsbDtcbkNvbnRleHQucHJvdG90eXBlLnJlbW92ZUNvbXBvbmVudCAgICAgPSBudWxsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRleHQ7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqICAgICAgICAgXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb3JlU3lzdGVtICAgICA9IHJlcXVpcmUoJy4vU3lzdGVtcy9Db3JlU3lzdGVtJyksXG4gICAgT3B0aW9uc01hbmFnZXIgPSByZXF1aXJlKCcuL09wdGlvbnNNYW5hZ2VyJyksXG4gICAgRE9NcmVuZGVyZXIgICAgPSByZXF1aXJlKCcuL1JlbmRlcmVycy9ET01yZW5kZXJlcicpLFxuICAgIEdMcmVuZGVyZXIgICAgID0gcmVxdWlyZSgnLi9SZW5kZXJlcnMvV2ViR0xSZW5kZXJlcicpLFxuICAgIFJlbmRlclN5c3RlbSAgID0gcmVxdWlyZSgnLi9TeXN0ZW1zL1JlbmRlclN5c3RlbScpLFxuICAgIEJlaGF2aW9yU3lzdGVtID0gcmVxdWlyZSgnLi9TeXN0ZW1zL0JlaGF2aW9yU3lzdGVtJyksXG4gICAgVGltZVN5c3RlbSAgICAgPSByZXF1aXJlKCcuL1N5c3RlbXMvVGltZVN5c3RlbScpLFxuICAgIExpZnRTeXN0ZW0gICAgID0gcmVxdWlyZSgnLi4vdHJhbnNpdGlvbnMvTGlmdFN5c3RlbScpLFxuICAgIENvbnRleHQgICAgICAgID0gcmVxdWlyZSgnLi9Db250ZXh0Jyk7XG5cbnJlcXVpcmUoJy4vU3R5bGVzaGVldC9mYW1vdXMuY3NzJyk7XG5cbnZhciBvcHRpb25zID0ge1xuICAgIGxvb3AgICAgICA6IHRydWUsXG4gICAgZGlyZWN0aW9uIDogMSxcbiAgICBzcGVlZCAgICAgOiAxLFxuICAgIHJlbmRlcmluZyA6IHtcbiAgICAgICAgcmVuZGVyZXJzOiB7XG4gICAgICAgICAgICBET006IERPTXJlbmRlcmVyLFxuICAgICAgICAgICAgR0w6IEdMcmVuZGVyZXJcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8vIFRPRE86IHdoYXQgaXMgdGhpcyBkb2luZyBoZXJlP1xuZG9jdW1lbnQub250b3VjaG1vdmUgPSBmdW5jdGlvbihldmVudCl7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbn07XG5cbi8vIFN0YXRlXG52YXIgTE9PUCAgICAgICAgICAgICAgICAgPSAnbG9vcCcsXG4gICAgUkVOREVSSU5HICAgICAgICAgICAgPSAncmVuZGVyaW5nJyxcbiAgICBvcHRpb25zTWFuYWdlciAgICAgICA9IG5ldyBPcHRpb25zTWFuYWdlcihvcHRpb25zKSxcbiAgICBzeXN0ZW1zICAgICAgICAgICAgICA9IFtSZW5kZXJTeXN0ZW0sIEJlaGF2aW9yU3lzdGVtLCBMaWZ0U3lzdGVtLCBDb3JlU3lzdGVtLCBUaW1lU3lzdGVtXSwgLy8gV2UncmUgZ29pbmcgYmFja3dhcmRzXG4gICAgY3VycmVudFJlbGF0aXZlRnJhbWUgPSAwLFxuICAgIGN1cnJlbnRBYnNvbHV0ZUZyYW1lID0gMDtcblxuZnVuY3Rpb24gc2V0UmVuZGVyZXJzKHJlbmRlcmVycykge1xuICAgIGZvciAodmFyIGtleSBpbiByZW5kZXJlcnMpIHtcbiAgICAgICAgUmVuZGVyU3lzdGVtLnJlZ2lzdGVyKGtleSwgcmVuZGVyZXJzW2tleV0pO1xuICAgIH1cbn1cblxuc2V0UmVuZGVyZXJzKG9wdGlvbnMucmVuZGVyaW5nLnJlbmRlcmVycyk7XG5cbm9wdGlvbnNNYW5hZ2VyLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgaWYgKGRhdGEuaWQgPT09IExPT1ApIHtcbiAgICAgICAgaWYgKGRhdGEudmFsdWUpIHtcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShFbmdpbmUubG9vcCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGRhdGEuaWQgPT09IFJFTkRFUklORykge1xuICAgICAgICBzZXRSZW5kZXJlcnMoZGF0YS52YWx1ZS5yZW5kZXJlcnMpO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFRoZSBzaW5nbGV0b24gb2JqZWN0IGluaXRpYXRlZCB1cG9uIHByb2Nlc3NcbiAqICAgc3RhcnR1cCB3aGljaCBtYW5hZ2VzIGFsbCBhY3RpdmUgU3lzdGVtcyBhbmQgYWN0cyBhcyBhXG4gKiAgIGZhY3RvcnkgZm9yIG5ldyBDb250ZXh0cy9cbiAqXG4gKiAgIE9uIHN0YXRpYyBpbml0aWFsaXphdGlvbiwgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSBpcyBjYWxsZWQgd2l0aFxuICogICAgIHRoZSBldmVudCBsb29wIGZ1bmN0aW9uLlxuICogICAgIFxuICogQGNsYXNzIEVuZ2luZVxuICogQHNpbmdsZXRvblxuICovXG52YXIgRW5naW5lID0ge307XG5cbi8qKlxuICogQ2FsbHMgdXBkYXRlIG9uIGVhY2ggb2YgdGhlIGN1cnJlbnRseSByZWdpc3RlcmVkIHN5c3RlbXMuXG4gKiBcbiAqIEBtZXRob2Qgc3RlcFxuICovXG5FbmdpbmUuc3RlcCA9IGZ1bmN0aW9uIHN0ZXAoKSB7XG4gICAgY3VycmVudFJlbGF0aXZlRnJhbWUgKz0gb3B0aW9ucy5kaXJlY3Rpb24gKiBvcHRpb25zLnNwZWVkO1xuICAgIGN1cnJlbnRBYnNvbHV0ZUZyYW1lKys7XG4gICAgdmFyIGkgPSBzeXN0ZW1zLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSBzeXN0ZW1zW2ldLnVwZGF0ZShjdXJyZW50UmVsYXRpdmVGcmFtZSwgY3VycmVudEFic29sdXRlRnJhbWUpOy8vIEkgdG9sZCB5b3Ugc29cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgdGhhdCB3aWxsIHN0ZXAgXG4gKiBcbiAqIEBtZXRob2QgbG9vcFxuICovXG5FbmdpbmUubG9vcCA9IGZ1bmN0aW9uIGxvb3AoKSB7XG4gICAgaWYgKG9wdGlvbnMubG9vcCkge1xuICAgICAgICBFbmdpbmUuc3RlcCgpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoRW5naW5lLmxvb3ApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbmZ1bmN0aW9uIF9sb29wRm9yKHZhbHVlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgIEVuZ2luZS5zdGVwKCk7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoX2xvb3BGb3IodmFsdWUgLSAxKSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5FbmdpbmUubG9vcEZvciA9IGZ1bmN0aW9uIGxvb3BGb3IodmFsdWUpIHtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoX2xvb3BGb3IodmFsdWUpKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQSB3cmFwcGVyIGZvciB0aGUgXCJET01Db250ZW50TG9hZGVkXCIgZXZlbnQuICBXaWxsIGV4ZWN1dGVcbiAqICAgYSBnaXZlbiBmdW5jdGlvbiBvbmNlIHRoZSBET00gaGF2ZSBiZWVuIGxvYWRlZC5cbiAqXG4gKiBAbWV0aG9kIHJlYWR5XG4gKiBcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiBGdW5jdGlvbiB0byBiZSBjYWxsZWQgYWZ0ZXIgRE9NIGxvYWRpbmdcbiAqL1xuRW5naW5lLnJlYWR5ID0gZnVuY3Rpb24gcmVhZHkoZm4pIHtcbiAgICB2YXIgbGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGxpc3RlbmVyKTtcbiAgICAgICAgZm4oKTtcbiAgICB9O1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBsaXN0ZW5lcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFdpbGwgY3JlYXRlIGEgYnJhbmQgbmV3IENvbnRleHQuICBJRiBhIHBhcmVudCBlbGVtZW50IGlzIG5vdCBwcm92aWRlZCxcbiAqICAgaXQgaXMgYXNzdW1lZCB0byBiZSB0aGUgYm9keSBvZiB0aGUgZG9jdW1lbnQuXG4gKlxuICogQG1ldGhvZCBjcmVhdGVDb250ZXh0XG4gKiBcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIGZvciB0aGUgQ29udGV4dFxuICogQHJldHVybiB7Q29udGV4dH0gbmV3IENvbnRleHQgaW5zdGFuY2VcbiAqL1xuRW5naW5lLmNyZWF0ZUNvbnRleHQgPSBmdW5jdGlvbiBjcmVhdGVDb250ZXh0KG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHZhciBlbGVtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvcHRpb25zKTtcbiAgICAgICAgaWYgKCEoZWxlbSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkgdGhyb3cgbmV3IEVycm9yKCd0aGUgcGFzc2VkIGluIHN0cmluZyBzaG91bGQgYmUgYSBxdWVyeSBzZWxlY3RvciB3aGljaCByZXR1cm5zIGFuIGVsZW1lbnQgZnJvbSB0aGUgZG9tJyk7XG4gICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ29udGV4dCh7cGFyZW50RWw6IGVsZW19KTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KVxuICAgICAgICByZXR1cm4gbmV3IENvbnRleHQoe3BhcmVudEVsOiBvcHRpb25zfSk7XG5cbiAgICBpZiAoIW9wdGlvbnMpXG4gICAgICAgIHJldHVybiBuZXcgQ29udGV4dCh7cGFyZW50RWw6IGRvY3VtZW50LmJvZHl9KTsgLy8gVE9ETyBpdCBzaG91bGQgYmUgcG9zc2libGUgdG8gZGVsYXkgYXNzaWduaW5nIGRvY3VtZW50LmJvZHkgdW50aWwgdGhpcyBoaXRzIHRoZSByZW5kZXIgc3RhZ2UuIFRoaXMgd291bGQgcmVtb3ZlIHRoZSBuZWVkIGZvciBFbmdpbmUucmVhZHlcblxuICAgIGlmICghb3B0aW9ucy5wYXJlbnRFbCAmJiAhb3B0aW9ucy5jb250YWluZXIpXG4gICAgICAgIG9wdGlvbnMucGFyZW50RWwgPSBkb2N1bWVudC5ib2R5O1xuXG4gICAgcmV0dXJuIG5ldyBDb250ZXh0KG9wdGlvbnMpO1xufTtcblxuLyoqXG4gKiBBZGRzIGEgc3lzdGVtIHRvIHRoZSBsaXN0IG9mIHN5c3RlbXMgdG8gdXBkYXRlIG9uIGEgcGVyIGZyYW1lIGJhc2lzXG4gKlxuICogQG1ldGhvZCBhZGRTeXN0ZW1cbiAqIFxuICogQHBhcmFtIHtTeXN0ZW19IHN5c3RlbSBTeXN0ZW0gdG8gZ2V0IHJ1biBldmVyeSBmcmFtZVxuICovXG5FbmdpbmUuYWRkU3lzdGVtID0gZnVuY3Rpb24gYWRkU3lzdGVtKHN5c3RlbSkge1xuICAgIGlmIChzeXN0ZW0gaW5zdGFuY2VvZiBPYmplY3QgJiYgc3lzdGVtLnVwZGF0ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKVxuICAgICAgICByZXR1cm4gc3lzdGVtcy5zcGxpY2Uoc3lzdGVtcy5pbmRleE9mKFJlbmRlclN5c3RlbSkgKyAxLCAwLCBzeXN0ZW0pO1xuICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKCdzeXN0ZW1zIG11c3QgYmUgYW4gb2JqZWN0IHdpdGggYW4gdXBkYXRlIG1ldGhvZCcpO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGEgc3lzdGVtIGZyb20gdGhlIGxpc3Qgb2Ygc3lzdGVtcyB0byB1cGRhdGUgb24gYSBwZXIgZnJhbWUgYmFzaXNcbiAqXG4gKiBAbWV0aG9kIHJlbW92ZVN5c3RlbVxuICogXG4gKiBAcGFyYW0ge1N5c3RlbX0gc3lzdGVtIFN5c3RlbSB0byBnZXQgcnVuIGV2ZXJ5IGZyYW1lXG4gKi9cbkVuZ2luZS5yZW1vdmVTeXN0ZW0gPSBmdW5jdGlvbiByZW1vdmVTeXN0ZW0oc3lzdGVtKSB7XG4gICAgaWYgKHN5c3RlbSBpbnN0YW5jZW9mIE9iamVjdCAmJiBzeXN0ZW0udXBkYXRlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIGluZGV4ID0gc3lzdGVtcy5pbmRleE9mKHN5c3RlbSk7XG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc3lzdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKCdzeXN0ZW1zIG11c3QgYmUgYW4gb2JqZWN0IHdpdGggYW4gdXBkYXRlIG1ldGhvZCcpO1xufTtcblxuLyoqXG4gKiBEZWxlZ2F0ZSB0byB0aGUgb3B0aW9uc01hbmFnZXIuXG4gKlxuICogQG1ldGhvZCBzZXRPcHRpb25zXG4gKiBcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE9wdGlvbnMgdG8gcGF0Y2hcbiAqL1xuRW5naW5lLnNldE9wdGlvbnMgPSBvcHRpb25zTWFuYWdlci5zZXRPcHRpb25zLmJpbmQob3B0aW9uc01hbmFnZXIpO1xuXG4vKipcbiAqIFNldCB0aGUgZGlyZWN0aW9uIG9mIHRoZSBmbG93IG9mIHRpbWUuXG4gKlxuICogQG1ldGhvZCBzZXREaXJlY3Rpb25cbiAqIFxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbCBkaXJlY3Rpb24gYXMgLTEgb3IgMVxuICovXG5FbmdpbmUuc2V0RGlyZWN0aW9uID0gZnVuY3Rpb24gc2V0RGlyZWN0aW9uKHZhbCkge1xuICAgIGlmICh2YWwgIT09IDEgJiYgdmFsICE9PSAtMSkgdGhyb3cgbmV3IEVycm9yKCdkaXJlY3Rpb24gbXVzdCBiZSBlaXRoZXIgMSBmb3IgZm9yd2FyZCBvciAtMSBmb3IgcmV2ZXJzZScpO1xuICAgIG9wdGlvbnNNYW5hZ2VyLnNldCgnZGlyZWN0aW9uJywgdmFsKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogR2V0IHRoZSBkaXJlY3Rpb24gb2YgdGhlIGZsb3cgb2YgdGltZS5cbiAqXG4gKiBAbWV0aG9kIGdldERpcmVjdGlvblxuICogXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGRpcmVjdGlvbiBhcyAtMSBvciAxXG4gKi9cbkVuZ2luZS5nZXREaXJlY3Rpb24gPSBmdW5jdGlvbiBnZXREaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMuZGlyZWN0aW9uO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIHNwZWVkIG9mIHRpbWUuXG4gKlxuICogQG1ldGhvZCBzZXRTcGVlZFxuICogXG4gKiBAcGFyYW0ge051bWJlcn0gdmFsIHJhdGlvIHRvIGh1bWFuIHRpbWVcbiAqL1xuRW5naW5lLnNldFNwZWVkID0gZnVuY3Rpb24gc2V0U3BlZWQodmFsKSB7XG4gICAgaWYgKHR5cGVvZiB2YWwgIT09ICdudW1iZXInKSB0aHJvdyBuZXcgRXJyb3IoJ3NwZWVkIG11c3QgYmUgYSBudW1iZXIsIHVzZWQgYXMgYSBzY2FsZSBmYWN0b3IgZm9yIHRoZSBtb3ZlbWVudCBvZiB0aW1lJyk7XG4gICAgb3B0aW9uc01hbmFnZXIuc2V0KCdzcGVlZCcsIHZhbCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgc3BlZWQgb2YgdGltZS5cbiAqXG4gKiBAbWV0aG9kIGdldFNwZWVkXG4gKiBcbiAqIEByZXR1cm4ge051bWJlcn0gdmFsIHJhdGlvIHRvIGh1bWFuIHRpbWVcbiAqL1xuRW5naW5lLmdldFNwZWVkID0gZnVuY3Rpb24gZ2V0U3BlZWQoKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMuc3BlZWQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgY3VycmVudCBmcmFtZVxuICpcbiAqIEBtZXRob2QgZ2V0QWJzb2x1dGVGcmFtZVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIGN1cnJlbnQgZnJhbWUgbnVtYmVyXG4gKi9cbkVuZ2luZS5nZXRBYnNvbHV0ZUZyYW1lID0gZnVuY3Rpb24gZ2V0QWJzb2x1dGVGcmFtZSgpIHtcbiAgICByZXR1cm4gY3VycmVudEFic29sdXRlRnJhbWU7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgY3VycmVudCBmcmFtZSB0YWtpbmcgaW50byBhY2NvdW50IGVuZ2luZSBzcGVlZCBhbmQgZGlyZWN0aW9uXG4gKlxuICogQG1ldGhvZCBnZXRSZWxhdGl2ZUZyYW1lXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0aGUgY3VycmVudCBmcmFtZSBudW1iZXIgdGFraW5nIGludG8gYWNjb3VudCBFbmdpbmUgc3BlZWQgYW5kIGRpcmVjdGlvblxuICovXG5FbmdpbmUuZ2V0UmVsYXRpdmVGcmFtZSA9IGZ1bmN0aW9uIGdldFJlbGF0aXZlRnJhbWUoKSB7XG4gICAgcmV0dXJuIGN1cnJlbnRSZWxhdGl2ZUZyYW1lO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbmdpbmU7XG5cbi8vU3RhcnQgdGhlIGxvb3BcbkVuZ2luZS5yZWFkeShFbmdpbmUubG9vcCk7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqICAgICAgICAgXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFbnRpdHlSZWdpc3RyeSA9IHJlcXVpcmUoJy4vRW50aXR5UmVnaXN0cnknKSxcbiAgICBUcmFuc2Zvcm0gICAgICA9IHJlcXVpcmUoJy4vQ29tcG9uZW50cy9UcmFuc2Zvcm0nKTtcblxuLyoqXG4gKiBFbnRpdHkgaXMgdGhlIGNvcmUgb2YgdGhlIEZhbW8udXMgc2NlbmUgZ3JhcGguICBUaGUgc2NlbmUgZ3JhcGhcbiAqICAgaXMgY29uc3RydWN0ZWQgYnkgYWRkaW5nIEVudGl0eXMgdG8gb3RoZXIgRW50aXRpZXMgdG8gZGVmaW5lIGhlaXJhcmNoeS5cbiAqICAgRWFjaCBFbnRpdHkgY29tZXMgd2l0aCBhIFRyYW5zZm9ybSBjb21wb25lbnQgd2l0aCB0aGVcbiAqICAgYWJpbGl0eSB0byBhZGQgaW5maW5pdGUgb3RoZXIgY29tcG9uZW50cy4gIEl0IGFsc28gYWN0cyBhcyBhIGZhY3RvcnkgYnkgY3JlYXRpbmdcbiAqICAgbmV3IEVudGl0aWVzIHRoYXQgd2lsbCBhbHJlYWR5IGJlIGNvbnNpZGVyZWQgaXQncyBjaGlsZHJlbi5cbiAqXG4gKiBAY2xhc3MgRW50aXR5XG4gKiBAZW50aXR5XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRW50aXR5KCkge1xuICAgIHZhciBpZCA9IEVudGl0eVJlZ2lzdHJ5LnJlZ2lzdGVyKHRoaXMsICdDb3JlU3lzdGVtJyk7XG5cbiAgICB0aGlzLl9jb21wb25lbnRzID0geyB0cmFuc2Zvcm0gOiBuZXcgVHJhbnNmb3JtKHRoaXMpIH07XG4gICAgdGhpcy5fYmVoYXZpb3JzID0gW107XG5cbiAgICB0aGlzLl9wYXJlbnQgICA9IG51bGw7XG4gICAgdGhpcy5fY2hpbGRyZW4gPSBbXTtcbn1cblxuLyoqXG4gKiBBZGRzIGEgbmV3IGluc3RhbmNlIG9mIGEgY29tcG9uZW50IHRvIHRoZSBFbnRpdHkuXG4gKlxuICogQG1ldGhvZCAgcmVnaXN0ZXJDb21wb25lbnRcbiAqIFxuICogQHBhcmFtICB7RnVuY3Rpb259IENvbnN0cnVjdG9yIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBhIGNvbXBvbmVudFxuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIG9wdGlvbnMgdG8gYmUgcGFzc2VkIGludG8gdGhlIGNvbnN0cnVjdG9yXG4gKiBAcmV0dXJuIHtPYmplY3R9IGluc3RhbmNlIG9mIHRoZSBpbnN0YW50aXRhdGVkIGNvbXBvbmVudFxuICovXG5cbkVudGl0eS5wcm90b3R5cGUucmVnaXN0ZXJDb21wb25lbnQgPSBmdW5jdGlvbiByZWdpc3RlckNvbXBvbmVudChDb25zdHJ1Y3Rvciwgb3B0aW9ucykge1xuICAgIGlmICghQ29uc3RydWN0b3IgfHwgIShDb25zdHJ1Y3RvciBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkgdGhyb3cgbmV3IEVycm9yKCdUaGUgZmlyc3QgYXJndW1lbnQgdG8gLnJlZ2lzdGVyQ29tcG9uZW50IG11c3QgYmUgYSBjb21wb25lbnQgQ29uc3RydWN0b3IgZnVuY3Rpb24nKTtcbiAgICBpZiAoIUNvbnN0cnVjdG9yLnRvU3RyaW5nKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHBhc3NlZC1pbiBjb21wb25lbnQgQ29uc3RydWN0b3IgbXVzdCBoYXZlIGEgXCJ0b1N0cmluZ1wiIG1ldGhvZC4nKTtcblxuICAgIHZhciBjb21wb25lbnQgPSBuZXcgQ29uc3RydWN0b3IodGhpcywgb3B0aW9ucyk7XG4gICAgaWYgKGNvbXBvbmVudC51cGRhdGUpIHRoaXMuX2JlaGF2aW9ycy5wdXNoKENvbnN0cnVjdG9yLnRvU3RyaW5nKCkpO1xuICAgIHRoaXMuX2NvbXBvbmVudHNbQ29uc3RydWN0b3IudG9TdHJpbmcoKV0gPSBjb21wb25lbnQ7XG4gICAgcmV0dXJuIGNvbXBvbmVudDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHJlZ2lzdGVyQ29tcG9uZW50XG4gKiBcbiAqIEBtZXRob2QgYWRkQ29tcG9uZW50XG4gKi9cbkVudGl0eS5wcm90b3R5cGUuYWRkQ29tcG9uZW50ID0gRW50aXR5LnByb3RvdHlwZS5yZWdpc3RlckNvbXBvbmVudDtcblxuLyoqXG4gKiBSZW1vdmVzIGEgY29tcG9uZW50IGZyb20gdGhlIEVudGl0eS5cbiAqXG4gKiBAbWV0aG9kIGRlcmVnaXN0ZXJDb21wb25lbnRcbiAqIFxuICogQHBhcmFtICB7U3RyaW5nfSB0eXBlIGlkIG9mIHRoZSBjb21wb25lbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHN0YXR1cyBvZiB0aGUgcmVtb3ZhbFxuICovXG5FbnRpdHkucHJvdG90eXBlLmRlcmVnaXN0ZXJDb21wb25lbnQgPSBmdW5jdGlvbiBkZXJlZ2lzdGVyQ29tcG9uZW50KHR5cGUpIHtcbiAgICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB0aHJvdyBuZXcgRXJyb3IoJ0VudGl0eS5kZXJlZ2lzdGVyQ29tcG9uZW50IG11c3QgYmUgcGFzc2VkIGEgU3RyaW5nIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXInKTtcbiAgICBpZiAodGhpcy5fY29tcG9uZW50c1t0eXBlXSA9PT0gdW5kZWZpbmVkIHx8IHRoaXMuX2NvbXBvbmVudHNbdHlwZV0gPT09IG51bGwpIHRocm93IG5ldyBFcnJvcignbm8gY29tcG9uZW50IG9mIHRoYXQgdHlwZScpO1xuXG4gICAgdGhpcy5fY29tcG9uZW50c1t0eXBlXS5jbGVhbnVwICYmIHRoaXMuX2NvbXBvbmVudHNbdHlwZV0uY2xlYW51cCgpO1xuICAgIHRoaXMuX2NvbXBvbmVudHNbdHlwZV0gPSBudWxsO1xuXG4gICAgdmFyIGJlaGF2aW9ySW5kZXggPSB0aGlzLl9iZWhhdmlvcnMuaW5kZXhPZih0eXBlKTtcbiAgICBpZiAoYmVoYXZpb3JJbmRleCA+IC0xKVxuICAgICAgICB0aGlzLl9iZWhhdmlvcnMuc3BsaWNlKGJlaGF2aW9ySW5kZXgsIDEpO1xuXG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBkZXJlZ2lzdGVyQ29tcG9uZW50XG4gKiBcbiAqIEBtZXRob2QgcmVtb3ZlQ29tcG9uZW50XG4gKi9cbkVudGl0eS5wcm90b3R5cGUucmVtb3ZlQ29tcG9uZW50ID0gRW50aXR5LnByb3RvdHlwZS5kZXJlZ2lzdGVyQ29tcG9uZW50O1xuXG4vKipcbiAqIEZpbmQgb3V0IGlmIHRoZSBFbnRpdHkgaGFzIGEgY29tcG9uZW50IG9mIGEgY2VydGFpbiBuYW1lLlxuICpcbiAqIEBtZXRob2QgaGFzQ29tcG9uZW50XG4gKiBcbiAqIEBwYXJhbSAge1N0cmluZ30gdHlwZSBuYW1lIG9mIHRoZSBjb21wb25lbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGV4aXN0YW5jZSBvZiBhIGNvbXBvbmVudCBieSB0aGF0IG5hbWVcbiAqL1xuRW50aXR5LnByb3RvdHlwZS5oYXNDb21wb25lbnQgPSBmdW5jdGlvbiBoYXNDb21wb25lbnQodHlwZSkge1xuICAgIHJldHVybiB0aGlzLl9jb21wb25lbnRzW3R5cGVdICE9IG51bGw7XG59O1xuXG4vKipcbiAqIEdldCBhIGNvbXBvbmVudCBieSBuYW1lXG4gKlxuICogQG1ldGhvZCBnZXRDb21wb25lbnRcbiAqIFxuICogQHBhcmFtICB7U3RyaW5nfSB0eXBlIG5hbWUgb2YgdGhlIGNvbXBvbmVudFxuICogQHJldHVybiB7T2JqZWN0fSBjb21wb25lbnQgaW5zdGFuY2VcbiAqL1xuRW50aXR5LnByb3RvdHlwZS5nZXRDb21wb25lbnQgPSBmdW5jdGlvbiBnZXRDb21wb25lbnQodHlwZSkge1xuICAgIHJldHVybiB0aGlzLl9jb21wb25lbnRzW3R5cGVdO1xufTtcblxuLyoqXG4gKiBHZXQgYWxsIG9mIHRoZSBFbnRpdHkncyBjb21wb25lbnRzXG4gKlxuICogQG1ldGhvZCBnZXRBbGxDb21wb25lbnRzXG4gKiBcbiAqIEByZXR1cm4ge09iamVjdH0gSGFzaCBvZiBhbGwgb2YgdGhlIGNvbXBvbmVudHMgaW5kZXhlZCBieSBuYW1lIFxuICovXG5FbnRpdHkucHJvdG90eXBlLmdldEFsbENvbXBvbmVudHMgPSBmdW5jdGlvbiBnZXRBbGxDb21wb25lbnRzKCkge1xuICAgIHJldHVybiB0aGlzLl9jb21wb25lbnRzO1xufTtcblxuLyoqXG4gKiBHZXQgYWxsIG9mIHRoZSBjaGlsZCBub2RlcyBpbiB0aGUgc2NlbmUgZ3JhcGhcbiAqXG4gKiBAbWV0aG9kICBnZXRDaGlsZHJlblxuICogXG4gKiBAcmV0dXJuIHtBcnJheX0gY2hpbGQgZW50aXRpZXNcbiAqL1xuRW50aXR5LnByb3RvdHlwZS5nZXRDaGlsZHJlbiA9IGZ1bmN0aW9uIGdldENoaWxkcmVuKCkge1xuICAgIHJldHVybiB0aGlzLl9jaGlsZHJlbjtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBjb250ZXh0IG9mIHRoZSBub2RlLlxuICpcbiAqIEBtZXRob2QgZ2V0Q29udGV4dFxuICpcbiAqIEByZXR1cm4gQ29udGV4dCBOb2RlXG4gKi9cbkVudGl0eS5wcm90b3R5cGUuZ2V0Q29udGV4dCA9IGZ1bmN0aW9uIGdldENvbnRleHQoKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzO1xuICAgIHdoaWxlIChub2RlLl9wYXJlbnQpIG5vZGUgPSBub2RlLl9wYXJlbnQ7XG4gICAgaWYgKCFub2RlLl9zaXplKSByZXR1cm4gbnVsbDtcbiAgICBlbHNlICAgICAgICAgICAgIHJldHVybiBub2RlO1xufTtcblxuLyoqXG4gKiBBZGQgYSBuZXcgRW50aXR5IGFzIGEgY2hpbGQgYW5kIHJldHVybiBpdC5cbiAqXG4gKiBAbWV0aG9kIGFkZENoaWxkXG4gKlxuICogQHJldHVybiB7RW50aXR5fSBjaGlsZCBFbnRpdHlcbiAqL1xuRW50aXR5LnByb3RvdHlwZS5hZGRDaGlsZCA9IGZ1bmN0aW9uIGFkZENoaWxkKGVudGl0eSkge1xuICAgIGlmIChlbnRpdHkgIT0gbnVsbCAmJiAhKGVudGl0eSBpbnN0YW5jZW9mIEVudGl0eSkpIHRocm93IG5ldyBFcnJvcignT25seSBFbnRpdGllcyBjYW4gYmUgYWRkZWQgYXMgY2hpbGRyZW4gb2Ygb3RoZXIgZW50aXRpZXMnKTtcbiAgICBpZiAoZW50aXR5KSB7XG4gICAgICAgIGlmICh0aGlzLl9jaGlsZHJlbi5pbmRleE9mKGVudGl0eSkgPiAtMSkgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgaWYgKGVudGl0eS5fcGFyZW50ICE9IG51bGwpIGVudGl0eS5fcGFyZW50LmRldGF0Y2hDaGlsZChlbnRpdHkpO1xuICAgICAgICBlbnRpdHkuX3BhcmVudCA9IHRoaXM7XG4gICAgICAgIHRoaXMuX2NoaWxkcmVuLnB1c2goZW50aXR5KTtcbiAgICAgICAgcmV0dXJuIGVudGl0eTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbm9kZSAgICAgPSBuZXcgRW50aXR5KCk7XG4gICAgICAgIG5vZGUuX3BhcmVudCA9IHRoaXM7XG4gICAgICAgIHRoaXMuX2NoaWxkcmVuLnB1c2gobm9kZSk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbn07XG5cbi8qKlxuICogUmVtb3ZlIGEgRW50aXR5J3MgY2hpbGQuXG4gKlxuICogQG1ldGhvZCBkZXRhdGNoQ2hpbGRcbiAqXG4gKiBAcmV0dXJuIHtFbnRpdHl8dm9pZCAwfSBjaGlsZCBFbnRpdHkgb3Igdm9pZCAwIGlmIGl0IGlzIG5vdCBhIGNoaWxkXG4gKi9cbkVudGl0eS5wcm90b3R5cGUuZGV0YXRjaENoaWxkID0gZnVuY3Rpb24gZGV0YXRjaENoaWxkKG5vZGUpIHtcbiAgICBpZiAoIShub2RlIGluc3RhbmNlb2YgRW50aXR5KSkgdGhyb3cgbmV3IEVycm9yKCdFbnRpdHkuZGV0YXRjaENoaWxkIG9ubHkgdGFrZXMgaW4gRW50aXRpZXMgYXMgdGhlIHBhcmFtZXRlcicpO1xuICAgIHZhciBpbmRleCA9IHRoaXMuX2NoaWxkcmVuLmluZGV4T2Yobm9kZSk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgdmFyIGNoaWxkICAgICA9IHRoaXMuX2NoaWxkcmVuLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgICAgIGNoaWxkLl9wYXJlbnQgPSBudWxsO1xuICAgICAgICByZXR1cm4gY2hpbGQ7XG4gICAgfSBlbHNlIHJldHVybiB2b2lkIDA7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGlzIEVudGl0eSBmcm9tIHRoZSBFbnRpdHlSZWdpc3RyeVxuICpcbiAqIEBtZXRob2QgY2xlYW51cFxuICovXG5FbnRpdHkucHJvdG90eXBlLmNsZWFudXAgPSBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgIEVudGl0eVJlZ2lzdHJ5LmNsZWFudXAodGhpcyk7XG59O1xuXG4vKipcbiAqIFVwZGF0ZSBhbGwgb2YgdGhlIGN1c3RvbSBjb21wb25lbnRzIG9uIHRoZSBFbnRpdHlcbiAqIFxuICogQG1ldGhvZCB1cGRhdGVcbiAqL1xuRW50aXR5LnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgdmFyIGkgPSB0aGlzLl9iZWhhdmlvcnMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgdGhpcy5fY29tcG9uZW50c1t0aGlzLl9iZWhhdmlvcnNbaV1dLnVwZGF0ZSh0aGlzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRW50aXR5O1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgTGF5ZXIgPSByZXF1aXJlKCcuL0xheWVyJyk7XG5cbi8vIE1hcCBvZiBhbiBFbnRpdHkncyBwb3NpdGlvbiBpbiBhIGxheWVyXG52YXIgZW50aXRpZXMgPSBbXTtcblxuLy8gU3RvcmFnZSBvZiBFbnRpdHkgYXJyYXlzXG52YXIgbGF5ZXJzID0ge1xuICAgIGV2ZXJ5dGhpbmc6IG5ldyBMYXllcigpXG59O1xuXG4vLyBQb29sIG9mIGZyZWUgc3BhY2VzIGluIHRoZSBlbnRpdGVzIGFycmF5XG52YXIgZnJlZWQgPSBbXTtcblxuLyoqXG4gKiBBIHNpbmdsZXRvbiBvYmplY3QgdGhhdCBtYW5hZ2VzIHRoZSBFbnRpdHkgcmVmZXJlbmNlIHN5c3RlbS5cbiAqICAgRW50aXRpZXMgY2FuIGJlIHBhcnQgb2YgbWFueSBsYXllcnMgZGVwZW5kaW5nIG9uIGltcGxlbWVudGF0aW9uLlxuICogICBcbiAqIEBjbGFzcyBFbnRpdHlSZWdpc3RyeVxuICogQHNpbmdsZXRvblxuICovXG52YXIgRW50aXR5UmVnaXN0cnkgPSB7fTtcblxuLyoqXG4gKiBBZGRzIGEgbmV3IGxheWVyIGtleSB0byB0aGUgbGF5ZXJzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kICBhZGRMYXllclxuICogXG4gKiBAcGFyYW0ge1N0cmluZ30gbGF5ZXIgbmFtZSBvZiB0aGUgbGF5ZXJcbiAqIEByZXR1cm4ge0FycmF5fSB0aGUgYXJyYXkgb2YgZW50aXRpZXMgaW4gdGhlIHNwZWNpZmllZCBsYXllclxuICovXG5FbnRpdHlSZWdpc3RyeS5hZGRMYXllciA9IGZ1bmN0aW9uIGFkZExheWVyKGxheWVyKSB7XG4gICAgaWYgKCFsYXllcikgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignLmFkZExheWVyIG5lZWRzIHRvIGhhdmUgYSBsYXllciBzcGVjaWZpZWQnKTtcbiAgICBpZiAodHlwZW9mIGxheWVyICE9PSAnc3RyaW5nJykgdGhyb3cgbmV3IEVycm9yKCcuYWRkTGF5ZXIgY2FuIG9ubHkgdGFrZSBhIHN0cmluZyBhcyBhbiBhcmd1bWVudCcpO1xuICAgIGlmICghbGF5ZXJzW2xheWVyXSkgbGF5ZXJzW2xheWVyXSA9IG5ldyBMYXllcigpO1xuICAgIHJldHVybiBsYXllcnNbbGF5ZXJdO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGFycmF5IG9mIGVudGl0aWVzIGluIGEgcGFydGljdWxhciBsYXllci5cbiAqXG4gKiBAbWV0aG9kICBnZXRMYXllclxuICogXG4gKiBAcGFyYW0ge1N0cmluZ30gbGF5ZXIgbmFtZSBvZiB0aGUgbGF5ZXJcbiAqIEByZXR1cm4ge0FycmF5fSB0aGUgYXJyYXkgb2YgZW50aXRpZXMgaW4gdGhlIHNwZWNpZmllZCBsYXllclxuICovXG5FbnRpdHlSZWdpc3RyeS5nZXRMYXllciA9IGZ1bmN0aW9uIGdldExheWVyKGxheWVyKSB7XG4gICAgcmV0dXJuIGxheWVyc1tsYXllcl07XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgYSBwYXJ0aWN1bGFyIGxheWVyIGZyb20gdGhlIHJlZ2lzdHJ5XG4gKlxuICogQG1ldGhvZCAgcmVtb3ZlTGF5ZXJcbiAqIFxuICogQHBhcmFtIHtTdHJpbmd9IGxheWVyIG5hbWUgb2YgdGhlIGxheWVyIHRvIHJlbW92ZVxuICogQHJldHVybiB7QXJyYXl9IHRoZSBhcnJheSBvZiBlbnRpdGllcyBpbiB0aGUgc3BlY2lmaWVkIGxheWVyXG4gKi9cbkVudGl0eVJlZ2lzdHJ5LnJlbW92ZUxheWVyID0gZnVuY3Rpb24gcmVtb3ZlTGF5ZXIobGF5ZXIpIHtcbiAgICBpZiAoIWxheWVyKSAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCcucmVtb3ZlTGF5ZXIgbmVlZHMgdG8gaGF2ZSBhIGxheWVyIHNwZWNpZmllZCcpO1xuICAgIGlmICh0eXBlb2YgbGF5ZXIgIT09ICdzdHJpbmcnKSB0aHJvdyBuZXcgRXJyb3IoJy5yZW1vdmVMYXllciBjYW4gb25seSB0YWtlIGEgc3RyaW5nIGFzIGFuIGFyZ3VtZW50Jyk7XG5cbiAgICB2YXIgY3VyckxheWVyID0gbGF5ZXJzW2xheWVyXTtcbiAgICBpZiAoIWN1cnJMYXllcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgdmFyIGkgPSBjdXJyTGF5ZXIubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIGRlbGV0ZSBlbnRpdGllc1tjdXJyTGF5ZXIuZ2V0KGkpLl9pZF1bbGF5ZXJdO1xuXG4gICAgZGVsZXRlIGxheWVyc1tsYXllcl07XG4gICAgcmV0dXJuIGN1cnJMYXllcjtcbn07XG5cbi8qKlxuICogQWRkcyBhbiBlbnRpdHkgdG8gYSBwYXJ0aWN1bGFyIGxheWVyLlxuICpcbiAqIEBtZXRob2QgIHJlZ2lzdGVyXG4gKiBcbiAqIEBwYXJhbSAge0VudGl0eX0gaW5zdGFuY2Ugb2YgYW4gRW50aXR5XG4gKiBAcGFyYW0gIHtTdHJpbmd9IGxheWVyIG5hbWUgb2YgdGhlIGxheWVyIHRvIHJlZ2lzdGVyIHRoZSBlbnRpdHkgdG9cbiAqIEByZXR1cm4ge051bWJlcn0gaWQgb2YgdGhlIEVudGl0eVxuICovXG5FbnRpdHlSZWdpc3RyeS5yZWdpc3RlciA9IGZ1bmN0aW9uIHJlZ2lzdGVyKGVudGl0eSwgbGF5ZXIpIHtcbiAgICB2YXIgaWRNYXA7XG4gICAgaWYgKGVudGl0eS5faWQgPT0gbnVsbCkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZW50aXR5LCAnX2lkJywge1xuICAgICAgICAgICAgdmFsdWUgICAgICAgIDogRW50aXR5UmVnaXN0cnkuZ2V0TmV3SUQoKSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZSA6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBpZCA9IGVudGl0eS5faWQ7XG4gICAgaWYgKGVudGl0aWVzW2lkXSkge1xuICAgICAgICBpZE1hcCA9IGVudGl0aWVzW2lkXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlkTWFwID0ge2V2ZXJ5dGhpbmc6IGxheWVycy5ldmVyeXRoaW5nLmxlbmd0aH07XG4gICAgICAgIGxheWVycy5ldmVyeXRoaW5nLnB1c2goZW50aXR5KTtcbiAgICB9XG5cbiAgICBpZiAobGF5ZXIpIHtcbiAgICAgICAgaWYgKCFsYXllcnNbbGF5ZXJdKSBFbnRpdHlSZWdpc3RyeS5hZGRMYXllcihsYXllcik7XG4gICAgICAgIGlkTWFwW2xheWVyXSA9IGxheWVyc1tsYXllcl0ubGVuZ3RoO1xuICAgICAgICBsYXllcnNbbGF5ZXJdLnB1c2goZW50aXR5KTtcbiAgICB9XG5cbiAgICBpZiAoIWVudGl0aWVzW2lkXSkgZW50aXRpZXNbaWRdID0gaWRNYXA7XG4gICAgcmV0dXJuIGlkOyAvL1RPRE86IERPIFdFIE5FRUQgVE8gUkVUVVJOIEFOWU1PUkU/XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgYW4gZW50aXR5IGZyb20gYSBsYXllclxuICpcbiAqIEBtZXRob2QgIGRlcmVnaXN0ZXJcbiAqIFxuICogQHBhcmFtICB7RW50aXR5fSBlbnRpdHkgaW5zdGFuY2Ugb2YgYW4gRW50aXR5XG4gKiBAcGFyYW0gIHtTdHJpbmd9IGxheWVyIG5hbWUgb2YgbGF5ZXIgdG8gcmVtb3ZlIHRoZSBFbnRpdHkgZnJvbVxuICogQHJldHVybiB7Qm9vbGVhbX0gc3RhdHVzIG9mIHRoZSByZW1vdmFsXG4gKi9cbkVudGl0eVJlZ2lzdHJ5LmRlcmVnaXN0ZXIgPSBmdW5jdGlvbiBkZXJlZ2lzdGVyKGVudGl0eSwgbGF5ZXIpIHtcbiAgICB2YXIgY3VycmVudEVudGl0eTtcbiAgICB2YXIgcG9zaXRpb24gPSBlbnRpdGllc1tlbnRpdHkuX2lkXVtsYXllcl07XG4gICAgaWYgKHBvc2l0aW9uID09PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTtcbiAgICBlbnRpdGllc1tlbnRpdHkuX2lkXVtsYXllcl0gPSBudWxsO1xuICAgIGxheWVyc1tsYXllcl0ucmVtb3ZlKGVudGl0eSk7XG5cbiAgICB2YXIgY3VycmVudEVudGl0eTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVudGl0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGN1cnJlbnRFbnRpdHkgPSBlbnRpdGllc1tpXTtcblxuICAgICAgICBpZiAoY3VycmVudEVudGl0eSAmJiBjdXJyZW50RW50aXR5W2xheWVyXSA+IHBvc2l0aW9uKSBjdXJyZW50RW50aXR5W2xheWVyXS0tO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGlkIG1hcCBvZiB0aGUgRW50aXR5LiAgRWFjaCBFbnRpdHkgaGFzIGFuIG9iamVjdCB0aGF0XG4gKiAgIGRlZmluZWQgdGhlIGluZGljaWVzIG9mIHdoZXJlIGl0IGlzIGluIGVhY2ggbGF5ZXIuXG4gKlxuICogQG1ldGhvZCAgZ2V0XG4gKiBcbiAqIEBwYXJhbSAge051bWJlcn0gaWQgSUQgb2YgdGhlIEVudGl0eVxuICogQHJldHVybiB7T2JqZWN0fSBpZCBtYXAgb2YgdGhlIEVudGl0eSdzIGluZGV4IGluIGVhY2ggbGF5ZXJcbiAqL1xuRW50aXR5UmVnaXN0cnkuZ2V0ID0gZnVuY3Rpb24gZ2V0KGlkKSB7XG4gICAgcmV0dXJuIGVudGl0aWVzW2lkXTtcbn07XG5cbi8qKlxuICogRmluZCBvdXQgaWYgYSBnaXZlbiBlbnRpdHkgZXhpc3RzIGFuZCBhIHNwZWNpZmllZCBsYXllci5cbiAqXG4gKiBAbWV0aG9kICBpbkxheWVyXG4gKiBcbiAqIEBwYXJhbSAge0VudGl0eX0gZW50aXR5IEVudGl0eSBpbnN0YW5jZVxuICogQHBhcmFtICB7U3RyaW5nfSBsYXllciBuYW1lIG9mIHRoZSBsYXllclxuICogQHJldHVybiB7Qm9vbGVhbn0gd2hldGhlciBvciBub3QgdGhlIEVudGl0eSBpcyBpbiBhIGdpdmVuIGxheWVyXG4gKi9cbkVudGl0eVJlZ2lzdHJ5LmluTGF5ZXIgPSBmdW5jdGlvbiBpbkxheWVyKGVudGl0eSwgbGF5ZXIpIHtcbiAgICByZXR1cm4gZW50aXRpZXNbZW50aXR5Ll9pZF1bbGF5ZXJdICE9PSB1bmRlZmluZWQ7XG59O1xuXG4vL3BvdGVudGlhbGx5IG1lbW9yeSB1bnNhZmUgLSBnZXR0aW5nIGFuIGlkIGlzbid0IG5lY2Vzc2FyaWx5IGNvdXBsZWQgd2l0aCBhIHJlZ2lzdHJhdGlvblxuLyoqXG4gKiBHZXQgYSB1bmlxdWUgSUQgZm9yIGFuIEVudGl0eVxuICpcbiAqIEBtZXRob2QgIGdldE5ld0lEXG4gKiBcbiAqIEByZXR1cm4ge051bWJlcn0gSUQgZm9yIGFuIEVudGl0eVxuICovXG5FbnRpdHlSZWdpc3RyeS5nZXROZXdJRCA9IGZ1bmN0aW9uIGdldE5ld0lEKCkge1xuICAgIGlmKGZyZWVkLmxlbmd0aCkgcmV0dXJuIGZyZWVkLnBvcCgpO1xuICAgIGVsc2UgcmV0dXJuIGVudGl0aWVzLmxlbmd0aDtcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFuIGVudGl0eSBhbmQgYWxsIHJlZmVyZW5jZXMgdG8gaXQuXG4gKlxuICogQG1ldGhvZCBjbGVhbnVwXG4gKiBcbiAqIEBwYXJhbSAge0VudGl0eX0gZW50aXR5IEVudGl0eSBpbnN0YW5jZSB0byByZW1vdmVcbiAqIEByZXR1cm4ge051bWJlcn0gSUQgb2YgdGhlIEVudGl0eSB0aGF0IHdhcyByZW1vdmVkXG4gKi9cbkVudGl0eVJlZ2lzdHJ5LmNsZWFudXAgPSBmdW5jdGlvbiBjbGVhbnVwKGVudGl0eSkge1xuICAgIHZhciBjdXJyZW50RW50aXR5O1xuICAgIHZhciBpZE1hcCAgICAgICAgICAgID0gZW50aXRpZXNbZW50aXR5Ll9pZF07XG4gICAgZW50aXRpZXNbZW50aXR5Ll9pZF0gPSBudWxsO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbnRpdGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjdXJyZW50RW50aXR5ID0gZW50aXRpZXNbaV07XG5cbiAgICAgICAgaWYgKGN1cnJlbnRFbnRpdHkpXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gaWRNYXApXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRFbnRpdHlba2V5XSAmJiBjdXJyZW50RW50aXR5W2tleV0gPiBpZE1hcFtrZXldKVxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50RW50aXR5W2tleV0tLTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gaWRNYXApIHtcbiAgICAgICAgbGF5ZXJzW2tleV0uc3BsaWNlKGlkTWFwW2tleV0sIDEpO1xuICAgIH1cblxuICAgIGZyZWVkLnB1c2goZW50aXR5Ll9pZCk7XG4gICAgcmV0dXJuIGVudGl0eS5faWQ7IC8vVE9ETzogRE8gV0UgTkVFRCBUSElTXG59O1xuXG4vKipcbiAqIEdldCBhbiBFbnRpdHkgYnkgaWRcbiAqXG4gKiBAbWV0aG9kIGdldEVudGl0eVxuICogXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIGlkIG9mIHRoZSBFbnRpdHlcbiAqIEByZXR1cm4ge0VudGl0eX0gZW50aXR5IHdpdGggdGhlIGlkIHByb3ZpZGVkXG4gKi9cbkVudGl0eVJlZ2lzdHJ5LmdldEVudGl0eSA9IGZ1bmN0aW9uIGdldEVudGl0eShpZCkge1xuICAgIGlmICghZW50aXRpZXNbaWRdKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIGxheWVycy5ldmVyeXRoaW5nLmdldChlbnRpdGllc1tpZF0uZXZlcnl0aGluZyk7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgRW50aXRpZXMgZnJvbSB0aGUgZW50aXR5IHJlZ2lzdHJ5XG4gKlxuICogQG1ldGhvZCBjbGVhclxuICovXG5FbnRpdHlSZWdpc3RyeS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHZhciBldmVyeXRoaW5nID0gRW50aXR5UmVnaXN0cnkuZ2V0TGF5ZXIoJ2V2ZXJ5dGhpbmcnKTtcbiAgICB3aGlsZSAoZXZlcnl0aGluZy5sZW5ndGgpIEVudGl0eVJlZ2lzdHJ5LmNsZWFudXAoZXZlcnl0aGluZy5wb3AoKSk7XG59O1xuXG4vLyBSZWdzaXRlciB0aGUgZGVmYXVsdCBsYXllcnNcbkVudGl0eVJlZ2lzdHJ5LmFkZExheWVyKCdSb290cycpO1xuRW50aXR5UmVnaXN0cnkuYWRkTGF5ZXIoJ0NvcmVTeXN0ZW0nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFbnRpdHlSZWdpc3RyeTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJy4uL2V2ZW50cy9FdmVudEVtaXR0ZXInKTtcblxuLyoqXG4gKiBMYXllcnMgYXJlIGdyb3VwcyB0aGF0IGhvbGQgcmVmZXJlbmNlcyB0byBFbnRpdGllcy4gIEl0XG4gKiAgYWRkcyBldmVudCBlbWl0dGluZyBhbmQgY29udmVuaWVuY2UgbWV0aG9kcyBvbiB0b3Agb2ZcbiAqICB0aGUgYXJyYXkgc3RvcmFnZS5cbiAqXG4gKiBAY2xhc3MgTGF5ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBMYXllcigpIHtcbiAgICB0aGlzLmVudGl0aWVzID0gW107XG4gICAgdGhpcy5JTyAgICAgICA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2xlbmd0aCcsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbnRpdGllcy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLyoqXG4gKiBEZWxlZ2F0ZXMgdG8gdGhlIEV2ZW50SGFuZGxlcnMgXCJvblwiXG4gKlxuICogQG1ldGhvZCBvblxuICovXG5MYXllci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbigpIHtcbiAgICByZXR1cm4gdGhpcy5JTy5vbi5hcHBseSh0aGlzLklPLCBhcmd1bWVudHMpO1xufTtcblxuLyoqXG4gKiBBZGRzIGFuIEVudGl0eSBhbmQgZW1pdHMgYSBtZXNzYWdlXG4gKlxuICogQG1ldGhvZCBwdXNoXG4gKiBcbiAqIEByZXN1bHQge0Jvb2xlYW59IHJldHVybiBzdGF0dXMgb2YgYXJyYXkgcHVzaFxuICovXG5MYXllci5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uIHB1c2goZW50aXR5KSB7XG4gICAgdGhpcy5JTy5lbWl0KCdlbnRpdHlQdXNoZWQnLCBlbnRpdHkpO1xuICAgIHJldHVybiB0aGlzLmVudGl0aWVzLnB1c2goZW50aXR5KTtcbn07XG5cbi8qKlxuICogQWRkcyBhbiBFbnRpdHkgYW5kIGVtaXRzIGEgbWVzc2FnZVxuICpcbiAqIEBtZXRob2QgcG9wXG4gKiBcbiAqIEByZXN1bHQge0VudGl0eX0gbGFzdCBFbnRpdHkgdGhhdCB3YXMgYWRkZWRcbiAqL1xuTGF5ZXIucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uIHBvcCgpIHtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5lbnRpdGllcy5wb3AoKTtcbiAgICB0aGlzLklPLmVtaXQoJ2VudGl0eVBvcHBlZCcsIHJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogRmluZCB3aGVyZSBhbmQgaWYgYW4gRW50aXR5IGlzIGluIHRoZSBhcnJheVxuICpcbiAqIEBtZXRob2QgaW5kZXhPZlxuICogXG4gKiBAcmVzdWx0IHtOdW1iZXJ9IGluZGV4IG9mIEVudGl0eSBpbiB0aGUgYXJyYXlcbiAqL1xuTGF5ZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mKCkge1xuICAgIHJldHVybiB0aGlzLmVudGl0aWVzLmluZGV4T2YuYXBwbHkodGhpcy5lbnRpdGllcywgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogU3BsaWNlcyB0aGUgYXJyYXkgYW5kIGVtaXRzIGEgbWVzc2FnZVxuICpcbiAqIEBtZXRob2Qgc3BsaWNlXG4gKiBcbiAqIEByZXN1bHQge0FycmF5fSBzcGxpY2VkIG91dCBFbnRpdGllc1xuICovXG5MYXllci5wcm90b3R5cGUuc3BsaWNlID0gZnVuY3Rpb24gc3BsaWNlKCkge1xuICAgIHZhciByZXN1bHQgPSB0aGlzLmVudGl0aWVzLnNwbGljZS5hcHBseSh0aGlzLmVudGl0aWVzLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuSU8uZW1pdCgnZW50aXRpZXNTcGxpY2VkJywgcmVzdWx0KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGFuZCBlbnRpdHkgZnJvbSB0aGUgYXJyYXkgYW5kIGVtaXRzIGEgbWVzc2FnZVxuICpcbiAqIEBtZXRob2QgcmVtb3ZlXG4gKiBcbiAqIEByZXN1bHQge0VudGl0eX0gcmVtb3ZlZCBFbnRpdHlcbiAqL1xuTGF5ZXIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZShlbnRpdHkpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmVudGl0aWVzLmluZGV4T2YoZW50aXR5KTtcbiAgICB0aGlzLklPLmVtaXQoJ2VudGl0eVJlbW92ZWQnLCBlbnRpdHkpO1xuICAgIGlmIChpbmRleCA8IDApIHJldHVybiBmYWxzZTtcbiAgICBlbHNlICAgICAgICAgICByZXR1cm4gdGhpcy5lbnRpdGllcy5zcGxpY2UoaW5kZXgsIDEpWzBdO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIEVudGl0eSBhcmUgYSBwYXJ0aWN1bGFyIGluZGV4XG4gKlxuICogQG1ldGhvZCBnZXRcbiAqIFxuICogQHJlc3VsdCB7RW50aXR5fSBFbnRpdHkgYXQgdGhhdCBpbmRleFxuICovXG5MYXllci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuZW50aXRpZXNbaW5kZXhdO1xufTtcblxuLyoqXG4gKiBGaW5kIG9mIGlmIHRoZSBMYXllciBoYXMgYW4gRW50aXR5XG4gKlxuICogQG1ldGhvZCBoYXNcbiAqIFxuICogQHJlc3VsdCB7Qm9vbGVhbn0gZXhpc3RlbmNlIG9mIHRoZSBFbnRpdHkgaW4gdGhlIExheWVyXG4gKi9cbkxheWVyLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiBoYXMoZW50aXR5KSB7XG4gICAgcmV0dXJuIHRoaXMuZW50aXRpZXMuaW5kZXhPZihlbnRpdHkpICE9PSAtMTtcbn07XG5cbi8qKlxuICogRXhlY3V0ZSBhIGZ1bmN0aW9uIHRoYXQgaXRlcmF0ZXMgb3ZlciB0aGUgY29sbGVjdGlvblxuICogIG9mIEVudGl0aWVzIGFuZCBjYWxscyBhIGZ1bmN0aW9uIHdoZXJlIHRoZSBwYXJhbWV0ZXJzXG4gKiAgYXJlLCB0aGUgRW50aXR5LCBpbmRleCwgYW5kIGZ1bGwgY29sbGVjdGlvbiBvZiBFbnRpdGllcy5cbiAqXG4gKiBAbWV0aG9kIGZvckVhY2hcbiAqIFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuY3Rpb24gdG8gYmUgcnVuIHBlciBFbnRpdHlcbiAqL1xuTGF5ZXIucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiBmb3JFYWNoKGZuKSB7XG4gICAgdmFyIGkgICAgICA9IC0xLFxuICAgICAgICBsZW5ndGggPSB0aGlzLmVudGl0aWVzLmxlbmd0aDtcblxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBFcnJvcignTGF5ZXIuZm9yRWFjaCBvbmx5IGFjY2VwdHMgZnVuY3Rpb25zIGFzIGEgcGFyYW1ldGVyJyk7XG5cbiAgICB3aGlsZSAobGVuZ3RoIC0gKytpKSBmbih0aGlzLmVudGl0aWVzW2ldLCBpLCB0aGlzLmVudGl0aWVzKTtcbn07XG5cbi8qKlxuICogSW1wbGVtZW50cyByZWR1Y2Ugb24gdGhlIGNvbGxlY3Rpb24gb2YgRW50aXRpZXNcbiAqXG4gKiBAbWV0aG9kIHJlZHVjZVxuICogXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jdGlvbiB0byBiZSBydW4gcGVyIEVudGl0eVxuICogQHBhcmFtIHsqfSBpbml0aWFsVmFsdWUgaW5pdGlhbCB2YWx1ZSBvZiB0aGUgcmVkdWNlIGZ1bmN0aW9uXG4gKiBcbiAqIEByZXR1cm4geyp9IHZhbHVlIGFmdGVyIGVhY2ggRW50aXR5IGhhcyBoYWQgdGhlIGZ1bmN0aW9uIHJ1blxuICovXG5MYXllci5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gcmVkdWNlKGZuLCBpbml0aWFsVmFsdWUpIHtcbiAgICB2YXIgaSAgICAgID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoLFxuICAgICAgICBhY2N1bXVsYXRvcjtcblxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBFcnJvcignTGF5ZXIucmVkdWNlIG9ubHkgYWNjZXB0cyBmdW5jdGlvbnMgYXMgYSBwYXJhbWV0ZXInKTtcblxuICAgIGlmIChpbml0aWFsVmFsdWUgIT0gbnVsbCkgYWNjdW11bGF0b3IgPSBpbml0aWFsVmFsdWU7XG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICBhY2N1bXVsYXRvciA9IHRoaXMuZW50aXRpZXNbKytpXTtcbiAgICB3aGlsZSAobGVuZ3RoIC0gKytpKSAgICAgIGFjY3VtdWxhdG9yID0gZm4oYWNjdW11bGF0b3IsIHRoaXMuZW50aXRpZXNbaV0sIGksIHRoaXMuZW50aXRpZXMpO1xuXG4gICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xufTtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIG1hcCBvbiB0aGUgY29sbGVjdGlvbiBvZiBFbnRpdGllc1xuICpcbiAqIEBtZXRob2QgbWFwXG4gKiBcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmN0aW9uIHRvIGJlIHJ1biBwZXIgRW50aXR5XG4gKlxuICogQHJldHVybiB7QXJyYXl9IGFycmF5IG9mIHRoZSByZXR1cm4gdmFsdWVzIG9mIHRoZSBtYXBwaW5nIGZ1bmN0aW9uXG4gKi9cbkxheWVyLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiBtYXAoZm4pIHtcbiAgICB2YXIgaSAgICAgID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoLFxuICAgICAgICByZXN1bHQgPSBbXTtcblxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBFcnJvcignTGF5ZXIubWFwIG9ubHkgYWNjZXB0cyBmdW5jdGlvbnMgYXMgYSBwYXJhbWV0ZXInKTtcblxuICAgIHdoaWxlIChsZW5ndGggLSArK2kpIHJlc3VsdC5wdXNoKGZuKHRoaXMuZW50aXRpZXNbaV0sIGksIHRoaXMuZW50aXRpZXMpKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIEltcGxlbWVudHMgZmlsdGVyIG9uIHRoZSBjb2xsZWN0aW9uIG9mIEVudGl0aWVzXG4gKlxuICogQG1ldGhvZCBmaWx0ZXJcbiAqIFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuY3Rpb24gdG8gYmUgcnVuIHBlciBFbnRpdHlcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYXJyYXkgb2YgdGhlIHJldHVybiB2YWx1ZXMgb2YgdGhlIGZpbHRlcmluZyBmdW5jdGlvblxuICovXG5MYXllci5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gZmlsdGVyKGZuKSB7XG4gICAgdmFyIGkgICAgICA9IC0xLFxuICAgICAgICBsZW5ndGggPSB0aGlzLmVudGl0aWVzLmxlbmd0aCxcbiAgICAgICAgcmVzdWx0ID0gW107XG5cbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB0aHJvdyBuZXcgRXJyb3IoJ0xheWVyLmZpbHRlciBvbmx5IGFjY2VwdHMgZnVuY3Rpb25zIGFzIGEgcGFyYW1ldGVyJyk7XG5cbiAgICB3aGlsZSAobGVuZ3RoIC0gKytpKSBpZiAoZm4odGhpcy5lbnRpdGllc1tpXSwgaSwgdGhpcy5lbnRpdGllcykpIHJlc3VsdC5wdXNoKHRoaXMuZW50aXRpZXNbaV0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogSW1wbGVtZW50cyByZWplY3Qgb24gdGhlIGNvbGxlY3Rpb24gb2YgRW50aXRpZXNcbiAqXG4gKiBAbWV0aG9kIHJlamVjdFxuICogXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jdGlvbiB0byBiZSBydW4gcGVyIEVudGl0eVxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBhcnJheSBvZiB0aGUgcmV0dXJuIHZhbHVlcyBvZiB0aGUgcmVqZWN0aW5nIGZ1bmN0aW9uXG4gKi9cbkxheWVyLnByb3RvdHlwZS5yZWplY3QgPSBmdW5jdGlvbiByZWplY3QoZm4pIHtcbiAgICB2YXIgaSAgICAgID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IHRoaXMuZW50aXRpZXMubGVuZ3RoLFxuICAgICAgICByZXN1bHQgPSBbXTtcblxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBFcnJvcignTGF5ZXIucmVqZWN0IG9ubHkgYWNjZXB0cyBmdW5jdGlvbnMgYXMgYSBwYXJhbWV0ZXInKTtcblxuICAgIHdoaWxlIChsZW5ndGggLSArK2kpIGlmICghZm4odGhpcy5lbnRpdGllc1tpXSwgaSwgdGhpcy5lbnRpdGllcykpIHJlc3VsdC5wdXNoKHRoaXMuZW50aXRpZXNbaV0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTGF5ZXI7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyOiBtYXJrQGZhbW8udXNcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG4gXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEhhbmRsZXIgPSByZXF1aXJlKCcuLi9ldmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbi8qKlxuICogIEEgY29sbGVjdGlvbiBvZiBtZXRob2RzIGZvciBzZXR0aW5nIG9wdGlvbnMgd2hpY2ggY2FuIGJlIGV4dGVuZGVkXG4gKiAgb250byBvdGhlciBjbGFzc2VzLlxuICpcbiAqXG4gKiBAY2xhc3MgT3B0aW9uc01hbmFnZXJcbiAqIEBjb25zdHJ1Y3RvclxuICogXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgb3B0aW9ucyBkaWN0aW9uYXJ5XG4gKi9cbmZ1bmN0aW9uIE9wdGlvbnNNYW5hZ2VyKHZhbHVlKSB7XG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLmV2ZW50T3V0cHV0ID0gbnVsbDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgb3B0aW9ucyBtYW5hZ2VyIGZyb20gc291cmNlIGRpY3Rpb25hcnkgd2l0aCBhcmd1bWVudHMgb3ZlcnJpZGVuIGJ5IHBhdGNoIGRpY3Rpb25hcnkuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZCBPcHRpb25zTWFuYWdlci5wYXRjaFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2Ugc291cmNlIGFyZ3VtZW50c1xuICogQHBhcmFtIHsuLi5PYmplY3R9IGRhdGEgYXJndW1lbnQgYWRkaXRpb25zIGFuZCBvdmVyd3JpdGVzXG4gKiBAcmV0dXJuIHtPYmplY3R9IHNvdXJjZSBvYmplY3RcbiAqL1xuT3B0aW9uc01hbmFnZXIucGF0Y2ggPSBmdW5jdGlvbiBwYXRjaE9iamVjdChzb3VyY2UsIGRhdGEpIHtcbiAgICB2YXIgbWFuYWdlciA9IG5ldyBPcHRpb25zTWFuYWdlcihzb3VyY2UpO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSBtYW5hZ2VyLnBhdGNoKGFyZ3VtZW50c1tpXSk7XG4gICAgcmV0dXJuIHNvdXJjZTtcbn07XG5cbmZ1bmN0aW9uIF9jcmVhdGVFdmVudE91dHB1dCgpIHtcbiAgICB0aGlzLmV2ZW50T3V0cHV0ID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuICAgIHRoaXMuZXZlbnRPdXRwdXQuYmluZFRoaXModGhpcyk7XG4gICAgRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIodGhpcywgdGhpcy5ldmVudE91dHB1dCk7XG59XG5cbi8qKlxuICogQ3JlYXRlIE9wdGlvbnNNYW5hZ2VyIGZyb20gc291cmNlIHdpdGggYXJndW1lbnRzIG92ZXJyaWRlbiBieSBwYXRjaGVzLlxuICogICBUcmlnZ2VycyAnY2hhbmdlJyBldmVudCBvbiB0aGlzIG9iamVjdCdzIGV2ZW50IGhhbmRsZXIgaWYgdGhlIHN0YXRlIG9mXG4gKiAgIHRoZSBPcHRpb25zTWFuYWdlciBjaGFuZ2VzIGFzIGEgcmVzdWx0LlxuICpcbiAqIEBtZXRob2QgcGF0Y2hcbiAqXG4gKiBAcGFyYW0gey4uLk9iamVjdH0gYXJndW1lbnRzIGxpc3Qgb2YgcGF0Y2ggb2JqZWN0c1xuICogQHJldHVybiB7T3B0aW9uc01hbmFnZXJ9IHRoaXNcbiAqL1xuT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLnBhdGNoID0gZnVuY3Rpb24gcGF0Y2goKSB7XG4gICAgdmFyIG15U3RhdGUgPSB0aGlzLl92YWx1ZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZGF0YSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgayBpbiBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoKGsgaW4gbXlTdGF0ZSkgJiYgKGRhdGFba10gJiYgZGF0YVtrXS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0KSAmJiAobXlTdGF0ZVtrXSAmJiBteVN0YXRlW2tdLmNvbnN0cnVjdG9yID09PSBPYmplY3QpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFteVN0YXRlLmhhc093blByb3BlcnR5KGspKSBteVN0YXRlW2tdID0gT2JqZWN0LmNyZWF0ZShteVN0YXRlW2tdKTtcbiAgICAgICAgICAgICAgICB0aGlzLmtleShrKS5wYXRjaChkYXRhW2tdKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ldmVudE91dHB1dCkgdGhpcy5ldmVudE91dHB1dC5lbWl0KCdjaGFuZ2UnLCB7aWQ6IGssIHZhbHVlOiBkYXRhW2tdfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHRoaXMuc2V0KGssIGRhdGFba10pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3IgcGF0Y2hcbiAqXG4gKiBAbWV0aG9kIHNldE9wdGlvbnNcbiAqXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5zZXRPcHRpb25zID0gT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLnBhdGNoO1xuXG4vKipcbiAqIFJldHVybiBPcHRpb25zTWFuYWdlciBiYXNlZCBvbiBzdWItb2JqZWN0IHJldHJpZXZlZCBieSBrZXlcbiAqXG4gKiBAbWV0aG9kIGtleVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZGVudGlmaWVyIGtleVxuICogQHJldHVybiB7T3B0aW9uc01hbmFnZXJ9IG5ldyBvcHRpb25zIG1hbmFnZXIgd2l0aCB0aGUgdmFsdWVcbiAqL1xuT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLmtleSA9IGZ1bmN0aW9uIGtleShpZGVudGlmaWVyKSB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBPcHRpb25zTWFuYWdlcih0aGlzLl92YWx1ZVtpZGVudGlmaWVyXSk7XG4gICAgaWYgKCEocmVzdWx0Ll92YWx1ZSBpbnN0YW5jZW9mIE9iamVjdCkgfHwgcmVzdWx0Ll92YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSByZXN1bHQuX3ZhbHVlID0ge307XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogTG9vayB1cCB2YWx1ZSBieSBrZXlcbiAqIEBtZXRob2QgZ2V0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBrZXlcbiAqIEByZXR1cm4ge09iamVjdH0gYXNzb2NpYXRlZCBvYmplY3RcbiAqL1xuT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWVba2V5XTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIGdldFxuICogQG1ldGhvZCBnZXRPcHRpb25zXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5nZXRPcHRpb25zID0gT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLmdldDtcblxuLyoqXG4gKiBTZXQga2V5IHRvIHZhbHVlLiAgT3V0cHV0cyAnY2hhbmdlJyBldmVudCBpZiBhIHZhbHVlIGlzIG92ZXJ3cml0dGVuLlxuICpcbiAqIEBtZXRob2Qgc2V0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBrZXkgc3RyaW5nXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgdmFsdWUgb2JqZWN0XG4gKiBAcmV0dXJuIHtPcHRpb25zTWFuYWdlcn0gbmV3IG9wdGlvbnMgbWFuYWdlciBiYXNlZCBvbiB0aGUgdmFsdWUgb2JqZWN0XG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQoa2V5LCB2YWx1ZSkge1xuICAgIHZhciBvcmlnaW5hbFZhbHVlID0gdGhpcy5nZXQoa2V5KTtcbiAgICB0aGlzLl92YWx1ZVtrZXldID0gdmFsdWU7XG5cbiAgICBpZiAodGhpcy5ldmVudE91dHB1dCAmJiB2YWx1ZSAhPT0gb3JpZ2luYWxWYWx1ZSkgdGhpcy5ldmVudE91dHB1dC5lbWl0KCdjaGFuZ2UnLCB7aWQ6IGtleSwgdmFsdWU6IHZhbHVlfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBlbnRpcmUgb2JqZWN0IGNvbnRlbnRzIG9mIHRoaXMgT3B0aW9uc01hbmFnZXIuXG4gKlxuICogQG1ldGhvZCB2YWx1ZVxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gY3VycmVudCBzdGF0ZSBvZiBvcHRpb25zXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uIHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIFwib25cIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NoYW5nZScpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKCkge1xuICAgIF9jcmVhdGVFdmVudE91dHB1dC5jYWxsKHRoaXMpO1xuICAgIHJldHVybiB0aGlzLm9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG4vKipcbiAqIFVuYmluZCBhbiBldmVudCBieSB0eXBlIGFuZCBoYW5kbGVyLlxuICogICBUaGlzIHVuZG9lcyB0aGUgd29yayBvZiBcIm9uXCIuXG4gKlxuICogQG1ldGhvZCByZW1vdmVMaXN0ZW5lclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NoYW5nZScpXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBoYW5kbGVyIGZ1bmN0aW9uIG9iamVjdCB0byByZW1vdmVcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gaW50ZXJuYWwgZXZlbnQgaGFuZGxlciBvYmplY3QgKGZvciBjaGFpbmluZylcbiAqL1xuT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgX2NyZWF0ZUV2ZW50T3V0cHV0LmNhbGwodGhpcyk7XG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogQWRkIGV2ZW50IGhhbmRsZXIgb2JqZWN0IHRvIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICpcbiAqIEBtZXRob2QgcGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgZXZlbnQgaGFuZGxlciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHBhc3NlZCBldmVudCBoYW5kbGVyXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24gcGlwZSgpIHtcbiAgICBfY3JlYXRlRXZlbnRPdXRwdXQuY2FsbCh0aGlzKTtcbiAgICByZXR1cm4gdGhpcy5waXBlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBoYW5kbGVyIG9iamVjdCBmcm9tIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICogVW5kb2VzIHdvcmsgb2YgXCJwaXBlXCJcbiAqXG4gKiBAbWV0aG9kIHVucGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgdGFyZ2V0IGhhbmRsZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHByb3ZpZGVkIHRhcmdldFxuICovXG5PcHRpb25zTWFuYWdlci5wcm90b3R5cGUudW5waXBlID0gZnVuY3Rpb24gdW5waXBlKCkge1xuICAgIF9jcmVhdGVFdmVudE91dHB1dC5jYWxsKHRoaXMpO1xuICAgIHJldHVybiB0aGlzLnVucGlwZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBPcHRpb25zTWFuYWdlcjsiLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBPcHRpb25zTWFuYWdlciAgID0gcmVxdWlyZSgnLi4vT3B0aW9uc01hbmFnZXInKSxcbiAgICBTdXJmYWNlICAgICAgICAgID0gcmVxdWlyZSgnLi4vQ29tcG9uZW50cy9TdXJmYWNlJyksXG4gICAgQ29udGFpbmVyICAgICAgICA9IHJlcXVpcmUoJy4uL0NvbXBvbmVudHMvQ29udGFpbmVyJyksXG4gICAgRWxlbWVudEFsbG9jYXRvciA9IHJlcXVpcmUoJy4vRWxlbWVudEFsbG9jYXRvcicpLFxuICAgIEVudGl0eVJlZ2lzdHJ5ICAgPSByZXF1aXJlKCcuLi9FbnRpdHlSZWdpc3RyeScpLFxuICAgIE1hdHJpeE1hdGggICAgICAgPSByZXF1aXJlKCcuLi8uLi9tYXRoLzR4NG1hdHJpeCcpO1xuXG4vLyBTdGF0ZVxudmFyIGNvbnRhaW5lcnNUb0VsZW1lbnRzID0ge30sXG4gICAgc3VyZmFjZXNUb0VsZW1lbnRzICAgPSB7fSxcbiAgICBjb250YWluZXJzVG9TdXJmYWNlcyA9IHt9LFxuICAgIHRhcmdldHMgICAgICAgICAgICAgID0gW1N1cmZhY2UudG9TdHJpbmcoKV07XG5cbnZhciB1c2VQcmVmaXggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKS5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gIT0gbnVsbDtcblxuLy8gQ09OU1RTXG52YXIgWkVSTyAgICAgICAgICAgICAgICA9IDAsXG4gICAgTUFUUklYM0QgICAgICAgICAgICA9ICdtYXRyaXgzZCgnLFxuICAgIENMT1NFX1BBUkVOICAgICAgICAgPSAnKScsXG4gICAgQ09NTUEgICAgICAgICAgICAgICA9ICcsJyxcbiAgICBESVYgICAgICAgICAgICAgICAgID0gJ2RpdicsXG4gICAgRkFfQ09OVEFJTkVSICAgICAgICA9ICdmYS1jb250YWluZXInLFxuICAgIEZBX1NVUkZBQ0UgICAgICAgICAgPSAnZmEtc3VyZmFjZScsXG4gICAgQ09OVEFJTkVSICAgICAgICAgICA9ICdjb250YWluZXInLFxuICAgIFBYICAgICAgICAgICAgICAgICAgPSAncHgnLFxuICAgIFNVUkZBQ0UgICAgICAgICAgICAgPSAnc3VyZmFjZScsXG4gICAgVFJBTlNGT1JNICAgICAgICAgICA9ICd0cmFuc2Zvcm0nLFxuICAgIENTU1RSQU5TRk9STSAgICAgICAgPSB1c2VQcmVmaXggPyAnd2Via2l0VHJhbnNmb3JtJyA6ICd0cmFuc2Zvcm0nLFxuICAgIENTU1RSQU5TRk9STV9PUklHSU4gPSB1c2VQcmVmaXggPyAnd2Via2l0VHJhbnNmb3JtT3JpZ2luJyA6ICd0cmFuc2Zvcm1PcmlnaW4nO1xuXG4vL3NjcmF0Y2ggbWVtb3J5IGZvciBtYXRyaXggY2FsY3VsYXRpb25zXG52YXIgZGV2aWNlUGl4ZWxSYXRpbyA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEsXG4gICAgbWF0cml4U2NyYXRjaDEgICA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKSxcbiAgICBtYXRyaXhTY3JhdGNoMiAgID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pLFxuICAgIG1hdHJpeFNjcmF0Y2gzICAgPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSksXG4gICAgbWF0cml4U2NyYXRjaDQgICA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKTtcblxuLyoqXG4gKiBET01SZW5kZXJlciBpcyBhIHNpbmdsZXRvbiBvYmplY3Qgd2hvc2UgcmVzcG9uc2libGl0eSBpdCBpc1xuICogIHRvIGRyYXcgRE9NIGJvdW5kIFN1cmZhY2VzIHRvIHRoZWlyIHJlc3BlY3RpdmUgQ29udGFpbmVycy5cbiAqXG4gKiBAY2xhc3MgRE9NUmVuZGVyZXJcbiAqIEBzaW5nbGV0b25cbiAqL1xudmFyIERPTVJlbmRlcmVyID0ge1xuICAgIF9xdWV1ZXM6IHtcbiAgICAgICAgY29udGFpbmVyczoge1xuICAgICAgICAgICAgdXBkYXRlOiBbXSxcbiAgICAgICAgICAgIHJlY2FsbDogW10sXG4gICAgICAgICAgICBkZXBsb3k6IFtdXG4gICAgICAgIH0sXG4gICAgICAgIHN1cmZhY2VzOiB7fVxuICAgIH0sXG4gICAgYWxsb2NhdG9yczoge31cbn07XG5cbi8qKlxuICogQWRkIGFuIEVudGl0eSB3aXRoIGEgQ29udGFpbmVyIGNvbXBvbmVudCB0byB0aGUgcXVldWUgdG8gYmVcbiAqICBhZGRlZCBpbnRvIHRoZSBET00uXG4gKlxuICogQG1ldGhvZCBkZXBsb3lDb250YWluZXJcbiAqIFxuICogQHBhcmFtIHtFbnRpdHl9IGVudGl0eSBFbnRpdHkgdGhhdCBuZWVkcyB0byBiZSBkZXBsb3llZFxuICovXG5ET01SZW5kZXJlci5kZXBsb3lDb250YWluZXIgPSBmdW5jdGlvbiBkZXBsb3lDb250YWluZXIoZW50aXR5KSB7XG4gICAgdGhpcy5fcXVldWVzLmNvbnRhaW5lcnMuZGVwbG95LnB1c2goZW50aXR5KTtcbiAgICBjb250YWluZXJzVG9TdXJmYWNlc1tlbnRpdHkuX2lkXSAgPSB7fTtcbiAgICB0aGlzLl9xdWV1ZXMuc3VyZmFjZXNbZW50aXR5Ll9pZF0gPSB7XG4gICAgICAgIHVwZGF0ZTogW10sXG4gICAgICAgIHJlY2FsbDogW10sXG4gICAgICAgIGRlcGxveTogW11cbiAgICB9O1xufTtcblxuLy8gRGVwbG95IGEgZ2l2ZW4gRW50aXR5J3MgQ29udGFpbmVyIHRvIHRoZSBET00uXG5mdW5jdGlvbiBfZGVwbG95Q29udGFpbmVyKGVudGl0eSkge1xuICAgIHZhciBjb250ZXh0ID0gZW50aXR5LmdldENvbnRleHQoKTtcblxuICAgIC8vIElmIHRoZSBDb250YWluZXIgaGFzIG5vdCBwcmV2aW91c2x5IGJlZW4gZGVwbG95IGFuZFxuICAgIC8vIGRvZXMgbm90IGhhdmUgYW4gYWxsb2NhdG9yLCBjcmVhdGUgb25lLlxuICAgIGlmICghRE9NUmVuZGVyZXIuYWxsb2NhdG9yc1tjb250ZXh0Ll9pZF0pXG4gICAgICAgIERPTVJlbmRlcmVyLmFsbG9jYXRvcnNbY29udGV4dC5faWRdID0gbmV3IEVsZW1lbnRBbGxvY2F0b3IoY29udGV4dC5fcGFyZW50RWwpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBET00gcmVwcmVzZW50YXRpb24gb2YgdGhlIENvbnRhaW5lclxuICAgIHZhciBlbGVtZW50ID0gRE9NUmVuZGVyZXIuYWxsb2NhdG9yc1tjb250ZXh0Ll9pZF0uYWxsb2NhdGUoRElWKTtcbiAgICBjb250YWluZXJzVG9FbGVtZW50c1tlbnRpdHkuX2lkXSA9IGVsZW1lbnQ7XG4gICAgX3VwZGF0ZUNvbnRhaW5lcihlbnRpdHksIGVsZW1lbnQpO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChGQV9DT05UQUlORVIpO1xuXG4gICAgRE9NUmVuZGVyZXIuYWxsb2NhdG9yc1tlbnRpdHkuX2lkXSA9IG5ldyBFbGVtZW50QWxsb2NhdG9yKGVsZW1lbnQpO1xufVxuXG4vKipcbiAqIEFkZCBhbiBFbnRpdHkgd2l0aCBhIENvbnRhaW5lciBjb21wb25lbnQgdG8gdGhlIHF1ZXVlIHRvIGJlXG4gKiAgcmVtb3ZlZCBmcm9tIHRoZSBET00uXG4gKlxuICogQG1ldGhvZCByZWNhbGxDb250YWluZXJcbiAqIFxuICogQHBhcmFtIHtFbnRpdHl9IGVudGl0eSBFbnRpdHkgdGhhdCBuZWVkcyB0byBiZSByZWNhbGxlZFxuICovXG5ET01SZW5kZXJlci5yZWNhbGxDb250YWluZXIgPSBmdW5jdGlvbiByZWNhbGxDb250YWluZXIoZW50aXR5KSB7XG4gICAgdGhpcy5fcXVldWVzLmNvbnRhaW5lcnMucmVjYWxsLnB1c2goZW50aXR5KTtcbiAgICBkZWxldGUgdGhpcy5fcXVldWVzLnN1cmZhY2VzW2VudGl0eS5faWRdO1xufTtcblxuLy8gUmVjYWxsIHRoZSBET00gcmVwcmVzZW50YXRpb24gb2YgdGhlIEVudGl0eSdzIENvbnRhaW5lclxuLy8gYW5kIGNsZWFuIHVwIHJlZmVyZW5jZXMuXG5mdW5jdGlvbiBfcmVjYWxsQ29udGFpbmVyKGVudGl0eSkge1xuICAgIHZhciBlbGVtZW50ID0gY29udGFpbmVyc1RvRWxlbWVudHNbZW50aXR5Ll9pZF07XG4gICAgdmFyIGNvbnRleHQgPSBlbnRpdHkuZ2V0Q29udGV4dCgpO1xuICAgIERPTVJlbmRlcmVyLmFsbG9jYXRvcnNbY29udGV4dC5faWRdLmRlYWxsb2NhdGUoZWxlbWVudCk7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKEZBX0NPTlRBSU5FUik7XG4gICAgZGVsZXRlIERPTVJlbmRlcmVyLmFsbG9jYXRvcnNbZW50aXR5Ll9pZF07XG59XG5cbi8qKlxuICogQWRkIGFuIEVudGl0eSB3aXRoIGEgQ29udGFpbmVyIGNvbXBvbmVudCB0byB0aGUgcXVldWUgdG8gYmVcbiAqICB1cGRhdGVkLlxuICpcbiAqIEBtZXRob2QgdXBkYXRlQ29udGFpbmVyXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgbmVlZHMgdG8gYmUgdXBkYXRlZFxuICovXG5ET01SZW5kZXJlci51cGRhdGVDb250YWluZXIgPSBmdW5jdGlvbiB1cGRhdGVDb250YWluZXIoZW50aXR5KSB7XG4gICAgdGhpcy5fcXVldWVzLmNvbnRhaW5lcnMudXBkYXRlLnB1c2goZW50aXR5KTtcbn07XG5cbi8vIFVwZGF0ZSB0aGUgQ29udGFpbmVyJ3MgRE9NIHByb3BlcnRpZXNcbmZ1bmN0aW9uIF91cGRhdGVDb250YWluZXIoZW50aXR5KSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGVudGl0eS5nZXRDb21wb25lbnQoQ09OVEFJTkVSKSxcbiAgICAgICAgZWxlbWVudCAgID0gY29udGFpbmVyc1RvRWxlbWVudHNbZW50aXR5Ll9pZF0sXG4gICAgICAgIGkgICAgICAgICA9IDAsXG4gICAgICAgIHNpemUsXG4gICAgICAgIG9yaWdpbixcbiAgICAgICAgY29udGV4dFNpemU7XG5cbiAgICBpZiAoY29udGFpbmVyLl9ldmVudHMuZGlydHkpIHtcbiAgICAgICAgaSA9IGNvbnRhaW5lci5fZXZlbnRzLm9uLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGNvbnRhaW5lci5fZXZlbnRzLm9mZi5sZW5ndGgpIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihjb250YWluZXIuX2V2ZW50cy5vZmYucG9wKCksIGNvbnRhaW5lci5fZXZlbnRzLmZvcndhcmRlcik7XG4gICAgICAgIHdoaWxlIChpLS0pIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihjb250YWluZXIuX2V2ZW50cy5vbltpXSwgY29udGFpbmVyLl9ldmVudHMuZm9yd2FyZGVyKTtcbiAgICAgICAgY29udGFpbmVyLl9ldmVudHMuZGlydHkgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoY29udGFpbmVyLl9zaXplRGlydHkgfHwgY29udGFpbmVyLl90cmFuc2Zvcm1EaXJ0eSkge1xuICAgICAgICBjb250ZXh0U2l6ZSA9IGVudGl0eS5nZXRDb250ZXh0KCkuX3NpemU7XG4gICAgICAgIHNpemUgICAgICAgID0gY29udGFpbmVyLmdldFNpemUoKTtcbiAgICAgICAgb3JpZ2luICAgICAgPSBjb250YWluZXIub3JpZ2luO1xuICAgIH1cblxuICAgIGlmIChjb250YWluZXIuX3NpemVEaXJ0eSkge1xuICAgICAgICBlbGVtZW50LnN0eWxlLndpZHRoICA9IHNpemVbMF0gKyBQWDtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBzaXplWzFdICsgUFg7XG4gICAgICAgIGNvbnRhaW5lci5fc2l6ZURpcnR5ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRhaW5lci5fdHJhbnNmb3JtRGlydHkpIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybSAgICAgICAgICAgICAgID0gRE9NUmVuZGVyZXIuY3JlYXRlRE9NTWF0cml4KGVudGl0eS5nZXRDb21wb25lbnQoVFJBTlNGT1JNKS5fbWF0cml4LCBjb250ZXh0U2l6ZSwgc2l6ZSwgb3JpZ2luKTtcbiAgICAgICAgZWxlbWVudC5zdHlsZVtDU1NUUkFOU0ZPUk1dID0gRE9NUmVuZGVyZXIuc3RyaW5naWZ5TWF0cml4KHRyYW5zZm9ybSk7XG5cbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhjb250YWluZXJzVG9TdXJmYWNlc1tlbnRpdHkuX2lkXSk7XG4gICAgICAgIGkgICAgICAgID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICBpZiAoY29udGFpbmVyc1RvU3VyZmFjZXNbZW50aXR5Ll9pZF1ba2V5c1tpXV0pXG4gICAgICAgICAgICAgICAgY29udGFpbmVyc1RvU3VyZmFjZXNbZW50aXR5Ll9pZF1ba2V5c1tpXV0uZ2V0Q29tcG9uZW50KFNVUkZBQ0UpLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLnRyYW5zZm9ybTtcbiAgICB9XG59XG5cbi8qKlxuICogQWRkIGFuIEVudGl0eSB3aXRoIGEgU3VyZmFjZSB0byB0aGUgcXVldWUgdG8gYmUgZGVwbG95ZWRcbiAqICB0byBhIHBhcnRpY3VsYXIgQ29udGFpbmVyLlxuICpcbiAqIEBtZXRob2QgZGVwbG95XG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgbmVlZHMgdG8gYmUgZGVwbG95ZWRcbiAqIEBwYXJhbSB7RW50aXR5fSBjb250YWluZXIgRW50aXR5IHRoYXQgdGhlIFN1cmZhY2Ugd2lsbCBiZSBkZXBsb3llZCB0b1xuICovXG5ET01SZW5kZXJlci5kZXBsb3kgPSBmdW5jdGlvbiBkZXBsb3koZW50aXR5LCBjb250YWluZXIpIHtcbiAgICBpZiAoIXN1cmZhY2VzVG9FbGVtZW50c1tlbnRpdHkuX2lkXSkgc3VyZmFjZXNUb0VsZW1lbnRzW2VudGl0eS5faWRdID0ge307XG4gICAgRE9NUmVuZGVyZXIuX3F1ZXVlcy5zdXJmYWNlc1tjb250YWluZXIuX2lkXS5kZXBsb3kucHVzaChlbnRpdHkpO1xuICAgIGNvbnRhaW5lcnNUb1N1cmZhY2VzW2NvbnRhaW5lci5faWRdW2VudGl0eS5faWRdID0gZW50aXR5O1xufTtcblxuLy8gRGVwbG95cyB0aGUgRW50aXR5J3MgU3VyZmFjZSB0byBhIHBhcnRpY3VsYXIgQ29udGFpbmVyLlxuZnVuY3Rpb24gX2RlcGxveShlbnRpdHksIGNvbnRhaW5lcklEKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBET01SZW5kZXJlci5hbGxvY2F0b3JzW2NvbnRhaW5lcklEXS5hbGxvY2F0ZShESVYpO1xuICAgIGVudGl0eS5nZXRDb21wb25lbnQoU1VSRkFDRSkuaW52YWxpZGF0ZUFsbCgpO1xuICAgIHN1cmZhY2VzVG9FbGVtZW50c1tlbnRpdHkuX2lkXVtjb250YWluZXJJRF0gPSBlbGVtZW50O1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChGQV9TVVJGQUNFKTtcbiAgICBfdXBkYXRlKGVudGl0eSwgY29udGFpbmVySUQpO1xufVxuXG4vKipcbiAqIEFkZCBhbiBFbnRpdHkgd2l0aCBhIFN1cmZhY2UgdG8gdGhlIHF1ZXVlIHRvIGJlIHJlY2FsbGVkXG4gKiAgZnJvbSBhIHBhcnRpY3VsYXIgQ29udGFpbmVyLlxuICpcbiAqIEBtZXRob2QgcmVjYWxsXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgbmVlZHMgdG8gYmUgcmVjYWxsZWQgZnJvbVxuICogQHBhcmFtIHtFbnRpdHl9IGNvbnRhaW5lciBFbnRpdHkgdGhhdCB0aGUgU3VyZmFjZSB3aWxsIGJlIHJlY2FsbGVkIGZyb21cbiAqL1xuRE9NUmVuZGVyZXIucmVjYWxsID0gZnVuY3Rpb24gcmVjYWxsKGVudGl0eSwgY29udGFpbmVyKSB7XG4gICAgRE9NUmVuZGVyZXIuX3F1ZXVlcy5zdXJmYWNlc1tjb250YWluZXIuX2lkXS5yZWNhbGwucHVzaChlbnRpdHkpO1xuICAgIGNvbnRhaW5lcnNUb1N1cmZhY2VzW2NvbnRhaW5lci5faWRdW2VudGl0eS5faWRdID0gZmFsc2U7XG59O1xuXG4vLyBSZWNhbGxzIHRoZSBFbnRpdHkncyBTdXJmYWNlIGZyb20gYSBnaXZlbiBDb250YWluZXJcbmZ1bmN0aW9uIF9yZWNhbGwoZW50aXR5LCBjb250YWluZXJJRCkge1xuICAgIHZhciBlbGVtZW50ID0gc3VyZmFjZXNUb0VsZW1lbnRzW2VudGl0eS5faWRdO1xuICAgIHZhciBzdXJmYWNlID0gZW50aXR5LmdldENvbXBvbmVudCgnc3VyZmFjZScpO1xuICAgIERPTVJlbmRlcmVyLmFsbG9jYXRvcnNbY29udGFpbmVySURdLmRlYWxsb2NhdGUoZWxlbWVudCk7XG4gICAgdmFyIGkgPSBzdXJmYWNlLnNwZWMuZXZlbnRzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoc3VyZmFjZS5zcGVjLmV2ZW50c1tpXSwgc3VyZmFjZS5ldmVudEZvcndhcmRlcik7XG59XG5cbi8qKlxuICogQWRkIGFuIEVudGl0eSB3aXRoIGEgU3VyZmFjZSB0byB0aGUgcXVldWUgdG8gYmUgdXBkYXRlZFxuICpcbiAqIEBtZXRob2QgdXBkYXRlXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgbmVlZHMgdG8gYmUgdXBkYXRlZFxuICogQHBhcmFtIHtFbnRpdHl9IGNvbnRhaW5lciBFbnRpdHkgdGhhdCB0aGUgU3VyZmFjZSB3aWxsIGJlIHVwZGF0ZWQgZm9yXG4gKi9cbkRPTVJlbmRlcmVyLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZShlbnRpdHksIGNvbnRhaW5lcikge1xuICAgIERPTVJlbmRlcmVyLl9xdWV1ZXMuc3VyZmFjZXNbY29udGFpbmVyLl9pZF0udXBkYXRlLnB1c2goZW50aXR5KTtcbn07XG5cbi8vIFVwZGF0ZSB0aGUgU3VyZmFjZSB0aGF0IGlzIHRvIGRlcGxveWVkIHRvIGEgcGFydGN1bGFyIENvbnRhaW5lclxuZnVuY3Rpb24gX3VwZGF0ZShlbnRpdHksIGNvbnRhaW5lcklEKSB7XG4gICAgdmFyIHN1cmZhY2UgICAgICAgICA9IGVudGl0eS5nZXRDb21wb25lbnQoU1VSRkFDRSksXG4gICAgICAgIHNwZWMgICAgICAgICAgICA9IHN1cmZhY2UucmVuZGVyKCksXG4gICAgICAgIGkgICAgICAgICAgICAgICA9IDAsXG4gICAgICAgIGNvbnRleHRTaXplICAgICA9IGVudGl0eS5nZXRDb250ZXh0KCkuX3NpemUsXG4gICAgICAgIGVsZW1lbnQgICAgICAgICA9IHN1cmZhY2VzVG9FbGVtZW50c1tlbnRpdHkuX2lkXVtjb250YWluZXJJRF0sXG4gICAgICAgIGNvbnRhaW5lckVudGl0eSA9IEVudGl0eVJlZ2lzdHJ5LmdldEVudGl0eShjb250YWluZXJJRCksXG4gICAgICAgIGNvbnRhaW5lciAgICAgICA9IGNvbnRhaW5lckVudGl0eS5nZXRDb21wb25lbnQoQ09OVEFJTkVSKSxcbiAgICAgICAga2V5O1xuXG4gICAgaWYgKFN1cmZhY2UuaW52YWxpZGF0aW9ucy5jbGFzc2VzICYgc3BlYy5pbnZhbGlkYXRpb25zKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBlbGVtZW50LmNsYXNzTGlzdC5sZW5ndGg7IGkrKykgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGVsZW1lbnQuY2xhc3NMaXN0W2ldKTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHNwZWMuY2xhc3Nlcy5sZW5ndGg7ICAgaSsrKSBlbGVtZW50LmNsYXNzTGlzdC5hZGQoc3BlYy5jbGFzc2VzW2ldKTtcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKEZBX1NVUkZBQ0UpO1xuICAgIH1cbiAgICBcbiAgICBpZiAoU3VyZmFjZS5pbnZhbGlkYXRpb25zLnByb3BlcnRpZXMgJiBzcGVjLmludmFsaWRhdGlvbnMpXG4gICAgICAgIGZvciAoa2V5IGluIHNwZWMucHJvcGVydGllcykgZWxlbWVudC5zdHlsZVtrZXldID0gc3BlYy5wcm9wZXJ0aWVzW2tleV07XG5cbiAgICBpZiAoU3VyZmFjZS5pbnZhbGlkYXRpb25zLmNvbnRlbnQgJiBzcGVjLmludmFsaWRhdGlvbnMpXG4gICAgICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gc3BlYy5jb250ZW50O1xuXG4gICAgaWYgKFN1cmZhY2UuaW52YWxpZGF0aW9ucy5vcGFjaXR5ICYgc3BlYy5pbnZhbGlkYXRpb25zKVxuICAgICAgICBlbGVtZW50LnN0eWxlLm9wYWNpdHkgPSBzcGVjLm9wYWNpdHk7XG5cbiAgICBpZiAoU3VyZmFjZS5pbnZhbGlkYXRpb25zLm9yaWdpbiAmIHNwZWMuaW52YWxpZGF0aW9ucykge1xuICAgICAgICBlbGVtZW50LnN0eWxlW0NTU1RSQU5TRk9STV9PUklHSU5dID0gc3BlYy5vcmlnaW5bMF0udG9GaXhlZCgyKSAqIDEwMCArICclICcgKyBzcGVjLm9yaWdpblsxXS50b0ZpeGVkKDIpICogMTAwICsgJyUnO1xuICAgIH1cblxuICAgIGlmIChTdXJmYWNlLmludmFsaWRhdGlvbnMuZXZlbnRzICYgc3BlYy5pbnZhbGlkYXRpb25zKSB7XG4gICAgICAgIGkgPSBzcGVjLmV2ZW50cy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihzcGVjLmV2ZW50c1tpXSwgc3BlYy5ldmVudEZvcndhcmRlcik7XG4gICAgfVxuXG4gICAgaWYgKFN1cmZhY2UuaW52YWxpZGF0aW9ucy5zaXplICYgc3BlYy5pbnZhbGlkYXRpb25zKSB7XG4gICAgICAgIHN1cmZhY2UuX3NpemVbMF0gPSBlbGVtZW50Lm9mZnNldFdpZHRoO1xuICAgICAgICBzdXJmYWNlLl9zaXplWzFdID0gZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgfVxuXG4gICAgaWYgKFN1cmZhY2UuaW52YWxpZGF0aW9ucy50cmFuc2Zvcm0gJiBzcGVjLmludmFsaWRhdGlvbnMpIHtcbiAgICAgICAgdmFyIHRyYW5zZm9ybSA9IE1hdHJpeE1hdGgubXVsdGlwbHkobWF0cml4U2NyYXRjaDMsIGNvbnRhaW5lci5nZXREaXNwbGF5TWF0cml4KCksIGVudGl0eS5nZXRDb21wb25lbnQoVFJBTlNGT1JNKS5fbWF0cml4KTtcbiAgICAgICAgdHJhbnNmb3JtICAgICA9IERPTVJlbmRlcmVyLmNyZWF0ZURPTU1hdHJpeCh0cmFuc2Zvcm0sIGNvbnRleHRTaXplLCBzdXJmYWNlLmdldFNpemUoKSwgc3BlYy5vcmlnaW4pO1xuICAgICAgICB2YXIgY2FtZXJhICAgID0gZW50aXR5LmdldENvbnRleHQoKS5nZXRDb21wb25lbnQoJ2NhbWVyYScpO1xuICAgICAgICBpZiAoY2FtZXJhKSB7XG4gICAgICAgICAgICB2YXIgZm9jYWxQb2ludCAgICA9IGNhbWVyYS5nZXRPcHRpb25zKCkucHJvamVjdGlvbi5vcHRpb25zLmZvY2FsUG9pbnQ7XG4gICAgICAgICAgICB2YXIgZnggICAgICAgICAgICA9IChmb2NhbFBvaW50WzBdICsgMSkgKiAwLjUgKiBjb250ZXh0U2l6ZVswXTtcbiAgICAgICAgICAgIHZhciBmeSAgICAgICAgICAgID0gKDEgLSBmb2NhbFBvaW50WzFdKSAqIDAuNSAqIGNvbnRleHRTaXplWzFdO1xuICAgICAgICAgICAgdmFyIHNjcmF0Y2hNYXRyaXggPSBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgIDAsIDAsIDAsIDEsIDAsIGZ4IC0gc3VyZmFjZS5nZXRTaXplKClbMF0gKiBzcGVjLm9yaWdpblswXSwgIGZ5IC0gc3VyZmFjZS5nZXRTaXplKClbMV0gKiBzcGVjLm9yaWdpblsxXSwgMCwgMV07XG4gICAgICAgICAgICBNYXRyaXhNYXRoLm11bHRpcGx5KHNjcmF0Y2hNYXRyaXgsIHNjcmF0Y2hNYXRyaXgsIFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAgMCwgMCwgMCwgMSwgZW50aXR5LmdldENvbnRleHQoKS5nZXRDb21wb25lbnQoJ2NhbWVyYScpLmdldFByb2plY3Rpb25UcmFuc2Zvcm0oKVsxMV0sICAwLCAwLCAwLCAxXSk7XG4gICAgICAgICAgICBNYXRyaXhNYXRoLm11bHRpcGx5KHNjcmF0Y2hNYXRyaXgsIHNjcmF0Y2hNYXRyaXgsIFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAtKGZ4IC0gc3VyZmFjZS5nZXRTaXplKClbMF0gKiBzcGVjLm9yaWdpblswXSksICAtKGZ5IC0gc3VyZmFjZS5nZXRTaXplKClbMV0gKiBzcGVjLm9yaWdpblsxXSksIDAsIDFdKTtcbiAgICAgICAgICAgIE1hdHJpeE1hdGgubXVsdGlwbHkodHJhbnNmb3JtLCBzY3JhdGNoTWF0cml4LCB0cmFuc2Zvcm0pO1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQuc3R5bGVbQ1NTVFJBTlNGT1JNXSA9IERPTVJlbmRlcmVyLnN0cmluZ2lmeU1hdHJpeCh0cmFuc2Zvcm0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZW5kZXIgd2lsbCBydW4gb3ZlciBhbGwgb2YgdGhlIHF1ZXVlcyB0aGF0IGhhdmUgYmVlbiBwb3B1bGF0ZWRcbiAqICBieSB0aGUgUmVuZGVyU3lzdGVtIGFuZCB3aWxsIGV4ZWN1dGUgdGhlIGRlcGxveW1lbnQsIHJlY2FsbGluZyxcbiAqICBhbmQgdXBkYXRpbmcuXG4gKlxuICogQG1ldGhvZCByZW5kZXJcbiAqL1xuIERPTVJlbmRlcmVyLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB2YXIgcXVldWUsXG4gICAgICAgIGNvbnRhaW5lcklELFxuICAgICAgICBpbm5lclF1ZXVlcyxcbiAgICAgICAgcXVldWVzICAgICA9IERPTVJlbmRlcmVyLl9xdWV1ZXMsXG4gICAgICAgIGNvbnRhaW5lcnMgPSBPYmplY3Qua2V5cyhxdWV1ZXMuc3VyZmFjZXMpLFxuICAgICAgICBqICAgICAgICAgID0gY29udGFpbmVycy5sZW5ndGgsXG4gICAgICAgIGkgICAgICAgICAgPSAwLFxuICAgICAgICBrICAgICAgICAgID0gMDtcbiAgICBcbiAgICAvLyBEZXBsb3kgQ29udGFpbmVyc1xuICAgIHF1ZXVlID0gcXVldWVzLmNvbnRhaW5lcnMuZGVwbG95O1xuICAgIGkgICAgID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIF9kZXBsb3lDb250YWluZXIocXVldWUuc2hpZnQoKSk7XG5cbiAgICAvLyBSZWNhbGwgQ29udGFpbmVyc1xuICAgIHF1ZXVlID0gcXVldWVzLmNvbnRhaW5lcnMucmVjYWxsO1xuICAgIGkgICAgID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIF9yZWNhbGxDb250YWluZXIocXVldWUuc2hpZnQoKSk7XG5cbiAgICAvLyBVcGRhdGUgQ29udGFpbmVyc1xuICAgIHF1ZXVlID0gcXVldWVzLmNvbnRhaW5lcnMudXBkYXRlO1xuICAgIGkgICAgID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIF91cGRhdGVDb250YWluZXIocXVldWUuc2hpZnQoKSk7XG5cbiAgICAvLyBGb3IgZWFjaCBDb250YWluZXJcbiAgICB3aGlsZSAoai0tKSB7XG4gICAgICAgIGNvbnRhaW5lcklEID0gY29udGFpbmVyc1tqXTtcbiAgICAgICAgaW5uZXJRdWV1ZXMgPSBxdWV1ZXMuc3VyZmFjZXNbY29udGFpbmVySURdO1xuXG4gICAgICAgIC8vIERlcGxveSBTdXJmYWNlc1xuICAgICAgICBxdWV1ZSA9IGlubmVyUXVldWVzLmRlcGxveTtcbiAgICAgICAgaSAgICAgPSBxdWV1ZS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIF9kZXBsb3kocXVldWUuc2hpZnQoKSwgY29udGFpbmVySUQpO1xuXG4gICAgICAgIC8vIFJlY2FsbCBTdXJmYWNlc1xuICAgICAgICBxdWV1ZSA9IGlubmVyUXVldWVzLnJlY2FsbDtcbiAgICAgICAgaSAgICAgPSBxdWV1ZS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIF9yZWNhbGwocXVldWUuc2hpZnQoKSwgY29udGFpbmVySUQpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSBTdXJmYWNlc1xuICAgICAgICBxdWV1ZSA9IGlubmVyUXVldWVzLnVwZGF0ZTtcbiAgICAgICAgaSAgICAgPSBxdWV1ZS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIF91cGRhdGUocXVldWUuc2hpZnQoKSwgY29udGFpbmVySUQpO1xuICAgIH1cblxufTtcblxuLy8gR2V0IHRoZSB0eXBlIG9mIFRhcmdldHMgdGhlIERPTVJlbmRlcmVyIHdpbGwgd29yayBmb3JcbkRPTVJlbmRlcmVyLmdldFRhcmdldHMgPSBmdW5jdGlvbiBnZXRUYXJnZXRzKCkge1xuICAgIHJldHVybiB0YXJnZXRzO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIFRyYW5zZm9ybSBtYXRyaXggZm9yIGEgU3VyZmFjZSBiYXNlZCBvbiBpdCB0cmFuc2Zvcm0sXG4gKiAgc2l6ZSwgb3JpZ2luLCBhbmQgQ29udGV4dCdzIHNpemUuICBVc2VzIGl0cyBDb250ZXh0J3Mgc2l6ZSB0b1xuICogIHR1cm4gaG9tb2dlbm91cyBjb29yZGluYXRlIFRyYW5zZm9ybXMgdG8gcGl4ZWxzLlxuICpcbiAqIEBtZXRob2QgY3JlYXRlRE9NTUF0cml4XG4gKlxuICogQHBhcmFtIHtBcnJheX0gdHJhbnNmb3JtIFRyYW5zZm9ybSBtYXRyaXhcbiAqIEBwYXJhbSB7QXJyYXl9IGNvbnRleHRTaXplIDItZGltZW5zaW9uYWwgc2l6ZSBvZiB0aGUgQ29udGV4dFxuICogQHBhcmFtIHtBcnJheX0gc2l6ZSBzaXplIG9mIHRoZSBET00gZWxlbWVudCBhcyBhIDMtZGltZW5zaW9uYWwgYXJyYXlcbiAqIEBwYXJhbSB7QXJyYXl9IG9yaWdpbiBvcmlnaW4gb2YgdGhlIERPTSBlbGVtZW50IGFzIGEgMi1kaW1lbnNpb25hbCBhcnJheVxuICogQHBhcmFtIHtBcnJheX0gcmVzdWx0IHN0b3JhZ2Ugb2YgdGhlIERPTSBib3VuZCB0cmFuc2Zvcm0gbWF0cml4XG4gKi9cbkRPTVJlbmRlcmVyLmNyZWF0ZURPTU1hdHJpeCA9IGZ1bmN0aW9uIGNyZWF0ZURPTU1hdHJpeCh0cmFuc2Zvcm0sIGNvbnRleHRTaXplLCBzaXplLCBvcmlnaW4sIHJlc3VsdCkge1xuICAgIHJlc3VsdCAgICAgICAgICAgICA9IHJlc3VsdCB8fCBbXTtcbiAgICAvLyBzaXplWzBdICAgICAgICAgICAvPSAwLjUgKiBjb250ZXh0U2l6ZVswXTsgLy8gVE9ETzogV2UncmUgbm90IHVzaW5nIHRoZSBcbiAgICAvLyBzaXplWzFdICAgICAgICAgICAvPSAwLjUgKiBjb250ZXh0U2l6ZVsxXTtcbiAgICBtYXRyaXhTY3JhdGNoMVswXSAgPSAxO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzFdICA9IDA7XG4gICAgbWF0cml4U2NyYXRjaDFbMl0gID0gMDtcbiAgICBtYXRyaXhTY3JhdGNoMVszXSAgPSAwO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzRdICA9IDA7XG4gICAgbWF0cml4U2NyYXRjaDFbNV0gID0gMTtcbiAgICBtYXRyaXhTY3JhdGNoMVs2XSAgPSAwO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzddICA9IDA7XG4gICAgbWF0cml4U2NyYXRjaDFbOF0gID0gMDtcbiAgICBtYXRyaXhTY3JhdGNoMVs5XSAgPSAwO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzEwXSA9IDE7XG4gICAgbWF0cml4U2NyYXRjaDFbMTFdID0gMDtcbiAgICBtYXRyaXhTY3JhdGNoMVsxMl0gPSAtc2l6ZVswXSAqIG9yaWdpblswXTtcbiAgICBtYXRyaXhTY3JhdGNoMVsxM10gPSAtc2l6ZVsxXSAqIG9yaWdpblsxXTtcbiAgICBtYXRyaXhTY3JhdGNoMVsxNF0gPSAwO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzE1XSA9IDE7XG4gICAgTWF0cml4TWF0aC5tdWx0aXBseShtYXRyaXhTY3JhdGNoMiwgbWF0cml4U2NyYXRjaDEsIHRyYW5zZm9ybSk7XG5cbiAgICByZXN1bHRbMF0gID0gKChtYXRyaXhTY3JhdGNoMlswXSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlswXSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzBdKTtcbiAgICByZXN1bHRbMV0gID0gKChtYXRyaXhTY3JhdGNoMlsxXSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlsxXSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzFdKTtcbiAgICByZXN1bHRbMl0gID0gKChtYXRyaXhTY3JhdGNoMlsyXSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlsyXSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzJdKTtcbiAgICByZXN1bHRbM10gID0gKChtYXRyaXhTY3JhdGNoMlszXSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlszXSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzNdKTtcbiAgICByZXN1bHRbNF0gID0gKChtYXRyaXhTY3JhdGNoMls0XSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMls0XSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzRdKTtcbiAgICByZXN1bHRbNV0gID0gKChtYXRyaXhTY3JhdGNoMls1XSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMls1XSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzVdKTtcbiAgICByZXN1bHRbNl0gID0gKChtYXRyaXhTY3JhdGNoMls2XSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMls2XSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzZdKTtcbiAgICByZXN1bHRbN10gID0gKChtYXRyaXhTY3JhdGNoMls3XSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMls3XSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzddKTtcbiAgICByZXN1bHRbOF0gID0gKChtYXRyaXhTY3JhdGNoMls4XSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMls4XSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzhdKTtcbiAgICByZXN1bHRbOV0gID0gKChtYXRyaXhTY3JhdGNoMls5XSAgPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMls5XSAgPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzldKTtcbiAgICByZXN1bHRbMTBdID0gKChtYXRyaXhTY3JhdGNoMlsxMF0gPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlsxMF0gPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzEwXSk7XG4gICAgcmVzdWx0WzExXSA9ICgobWF0cml4U2NyYXRjaDJbMTFdIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbMTFdID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMlsxMV0pO1xuICAgIHJlc3VsdFsxMl0gPSAoKG1hdHJpeFNjcmF0Y2gyWzEyXSA8IDAuMDAwMDAxICYmIG1hdHJpeFNjcmF0Y2gyWzEyXSA+IC0wLjAwMDAwMSkgPyBaRVJPIDogbWF0cml4U2NyYXRjaDJbMTJdKSArIDAuNSAqIGNvbnRleHRTaXplWzBdO1xuICAgIHJlc3VsdFsxM10gPSAoKG1hdHJpeFNjcmF0Y2gyWzEzXSA8IDAuMDAwMDAxICYmIG1hdHJpeFNjcmF0Y2gyWzEzXSA+IC0wLjAwMDAwMSkgPyBaRVJPIDogbWF0cml4U2NyYXRjaDJbMTNdKSArIDAuNSAqIGNvbnRleHRTaXplWzFdO1xuICAgIC8vIHJlc3VsdFsxMl0gPSAoTWF0aC5yb3VuZCgobWF0cml4U2NyYXRjaDJbMTJdICsgMSkgKiAwLjUgKiBjb250ZXh0U2l6ZVswXSAqIGRldmljZVBpeGVsUmF0aW8pIC8gZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgLy8gcmVzdWx0WzEzXSA9IChNYXRoLnJvdW5kKChtYXRyaXhTY3JhdGNoMlsxM10gKyAxKSAqIDAuNSAqIGNvbnRleHRTaXplWzFdICogZGV2aWNlUGl4ZWxSYXRpbykgLyBkZXZpY2VQaXhlbFJhdGlvKTtcbiAgICByZXN1bHRbMTRdID0gKChtYXRyaXhTY3JhdGNoMlsxNF0gPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlsxNF0gPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzE0XSk7XG4gICAgcmVzdWx0WzE1XSA9ICgobWF0cml4U2NyYXRjaDJbMTVdIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbMTVdID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMlsxNV0pO1xuXG4gICAgLy8gc2l6ZVswXSAqPSAwLjUgKiBjb250ZXh0U2l6ZVswXTtcbiAgICAvLyBzaXplWzFdICo9IDAuNSAqIGNvbnRleHRTaXplWzFdO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgQ1NTIHJlcHJlc2VudGF0aW9uIG9mIGEgVHJhbnNmb3JtIG1hdHJpeFxuICpcbiAqIEBtZXRob2Qgc3RyaW5naWZ5TWF0cml4XG4gKlxuICogQHBhcmFtIHtBcnJheX0gbSBUcmFuc2Zvcm0gbWF0cml4XG4gKi9cbkRPTVJlbmRlcmVyLnN0cmluZ2lmeU1hdHJpeCA9IGZ1bmN0aW9uIHN0cmluZ2lmeU1hdHJpeChtKSB7XG4gICAgcmV0dXJuIE1BVFJJWDNEICtcbiAgICAgICAgbVswXSAgKyBDT01NQSArXG4gICAgICAgIG1bMV0gICsgQ09NTUEgK1xuICAgICAgICBtWzJdICArIENPTU1BICtcbiAgICAgICAgbVszXSAgKyBDT01NQSArXG4gICAgICAgIG1bNF0gICsgQ09NTUEgK1xuICAgICAgICBtWzVdICArIENPTU1BICtcbiAgICAgICAgbVs2XSAgKyBDT01NQSArXG4gICAgICAgIG1bN10gICsgQ09NTUEgK1xuICAgICAgICBtWzhdICArIENPTU1BICtcbiAgICAgICAgbVs5XSAgKyBDT01NQSArXG4gICAgICAgIG1bMTBdICsgQ09NTUEgK1xuICAgICAgICBtWzExXSArIENPTU1BICtcbiAgICAgICAgbVsxMl0gKyBDT01NQSArXG4gICAgICAgIG1bMTNdICsgQ09NTUEgK1xuICAgICAgICBtWzE0XSArIENPTU1BICtcbiAgICAgICAgbVsxNV0gKyBDTE9TRV9QQVJFTjtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBET01SZW5kZXJlcjtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBtYXJrQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIG9iamVjdCB0byBDb250YWluZXIgdGhhdCBoYW5kbGVzIHRoZSBwcm9jZXNzIG9mXG4gKiAgIGNyZWF0aW5nIGFuZCBhbGxvY2F0aW5nIERPTSBlbGVtZW50cyB3aXRoaW4gYSBtYW5hZ2VkIGRpdi5cbiAqICAgUHJpdmF0ZS5cbiAqXG4gKiBAY2xhc3MgRWxlbWVudEFsbG9jYXRvclxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtET01FbGVtZW50fSBjb250YWluZXIgZG9jdW1lbnQgZWxlbWVudCBpbiB3aGljaCBGYW1vLnVzIGNvbnRlbnQgd2lsbCBiZSBpbnNlcnRlZFxuICovXG5mdW5jdGlvbiBFbGVtZW50QWxsb2NhdG9yKGNvbnRhaW5lcikge1xuICAgIGlmICghY29udGFpbmVyKSBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdGhpcy5jb250YWluZXIgICAgID0gY29udGFpbmVyO1xuICAgIHRoaXMuZGV0YWNoZWROb2RlcyA9IHt9O1xuICAgIHRoaXMubm9kZUNvdW50ICAgICA9IDA7XG59XG5cbi8qKlxuICogQWxsb2NhdGUgYW4gZWxlbWVudCBvZiBzcGVjaWZpZWQgdHlwZSBmcm9tIHRoZSBwb29sLlxuICpcbiAqIEBtZXRob2QgYWxsb2NhdGVcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZSB0eXBlIG9mIGVsZW1lbnQsIGUuZy4gJ2RpdidcbiAqXG4gKiBAcmV0dXJuIHtET01FbGVtZW50fSBhbGxvY2F0ZWQgZG9jdW1lbnQgZWxlbWVudFxuICovXG5FbGVtZW50QWxsb2NhdG9yLnByb3RvdHlwZS5hbGxvY2F0ZSA9IGZ1bmN0aW9uIGFsbG9jYXRlKHR5cGUpIHtcbiAgICB0eXBlID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy5kZXRhY2hlZE5vZGVzKSkgdGhpcy5kZXRhY2hlZE5vZGVzW3R5cGVdID0gW107XG4gICAgdmFyIG5vZGVTdG9yZSA9IHRoaXMuZGV0YWNoZWROb2Rlc1t0eXBlXTtcbiAgICB2YXIgcmVzdWx0O1xuICAgIGlmIChub2RlU3RvcmUubGVuZ3RoID4gMCkge1xuICAgICAgICByZXN1bHQgPSBub2RlU3RvcmUucG9wKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKTtcbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQocmVzdWx0KTtcbiAgICB9XG4gICAgdGhpcy5ub2RlQ291bnQrKztcbiAgICByZXN1bHQuc3R5bGUuZGlzcGxheSA9ICcnOyAgICBcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBEZS1hbGxvY2F0ZSBhbiBlbGVtZW50IG9mIHNwZWNpZmllZCB0eXBlIHRvIHRoZSBwb29sLlxuICpcbiAqIEBtZXRob2QgZGVhbGxvY2F0ZVxuICpcbiAqIEBwYXJhbSB7RE9NRWxlbWVudH0gZWxlbWVudCBkb2N1bWVudCBlbGVtZW50IHRvIGRlYWxsb2NhdGVcbiAqL1xuRWxlbWVudEFsbG9jYXRvci5wcm90b3R5cGUuZGVhbGxvY2F0ZSA9IGZ1bmN0aW9uIGRlYWxsb2NhdGUoZWxlbWVudCkge1xuICAgIHZhciBub2RlVHlwZSA9IGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgbm9kZVN0b3JlID0gdGhpcy5kZXRhY2hlZE5vZGVzW25vZGVUeXBlXTtcbiAgICBub2RlU3RvcmUucHVzaChlbGVtZW50KTtcbiAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgZWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gJyc7XG4gICAgZWxlbWVudC5zdHlsZS53aWR0aCAgID0gJyc7XG4gICAgZWxlbWVudC5zdHlsZS5oZWlnaHQgID0gJyc7XG4gICAgdGhpcy5ub2RlQ291bnQtLTtcbn07XG5cbi8qKlxuICogR2V0IGNvdW50IG9mIHRvdGFsIGFsbG9jYXRlZCBub2RlcyBpbiB0aGUgZG9jdW1lbnQuXG4gKlxuICogQG1ldGhvZCBnZXROb2RlQ291bnRcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRvdGFsIG5vZGUgY291bnRcbiAqL1xuRWxlbWVudEFsbG9jYXRvci5wcm90b3R5cGUuZ2V0Tm9kZUNvdW50ID0gZnVuY3Rpb24gZ2V0Tm9kZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLm5vZGVDb3VudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRWxlbWVudEFsbG9jYXRvcjsiLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogYWRuYW5AZmFtby51cyxcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBtb3VzZSAgICAgICAgICA9IFsuNSwgLjVdO1xudmFyIHNoYWRlcnMgICAgICAgID0ge307XG52YXIgc3RhcnQgICAgICAgICAgPSBEYXRlLm5vdygpO1xudmFyIHBlcnNwZWN0aXZlICAgID0gX19wZXJzcGVjdGl2ZShbXSwgMCwgaW5uZXJXaWR0aCAvIGlubmVySGVpZ2h0LCAuMSwgIDEwMDAuKTtcbnZhciBFbnRpdHlSZWdpc3RyeSA9IHJlcXVpcmUoJy4uL0VudGl0eVJlZ2lzdHJ5Jyk7XG52YXIgRW5naW5lICAgICAgICAgPSByZXF1aXJlKCcuLi9FbmdpbmUnKTtcbnZhciBHZW9tZXRyeSAgICAgICA9IHJlcXVpcmUoJy4uLy4uL2dsL2dlb21ldHJ5Jyk7XG52YXIgbGlnaHRMaXN0ICAgICAgPSBFbnRpdHlSZWdpc3RyeS5nZXRMYXllcignTGlnaHRzJyk7XG5cbnZhciBhcHBlbmRlZCA9IGZhbHNlO1xudmFyIGdsO1xuXG52YXIgdmVydGV4V3JhcHBlciA9IFtcbiAgICAnLy9kZWZpbmVfdnMnLFxuXG4gICAgJ3ZlYzQgcGlwZWxpbmVfcG9zKGluIHZlYzQgcG9zKSB7JyxcbiAgICAnICAgIC8vYXBwbHlfdnMnLCBcbiAgICAnICAgIHBvcyA9IHRyYW5zZm9ybSAqIHBlcnNwZWN0aXZlICogcG9zOycsICAgIFxuICAgICcgICAgcG9zLnkgKj0gLTEuOycsICAgIFxuICAgICcgICAgcmV0dXJuIHBvczsnLCAgXG4gICAgJ30nLFxuXG4gICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICcgICAgdl9ub3JtYWwgPSBhX25vcm1hbDsnLFxuICAgICcgICAgZ2xfUG9zaXRpb24gPSBwaXBlbGluZV9wb3MoYV9wb3MpOycsXG4gICAgJ30nXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgZnJhZ21lbnRXcmFwcGVyID0gW1xuICAgICcvL2RlZmluZV9mcycsICBcbiAgICAndmVjNCBwaXBlbGluZV9jb2xvcihpbiB2ZWM0IGNvbG9yKSB7JyxcbiAgICAnICAgIC8vYXBwbHlfZnMnLCAgXG4gICAgJyAgICByZXR1cm4gY29sb3I7JywgXG4gICAgJ30nLFxuXG4gICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICcgICAgdmVjNCBjb2xvcjsnLFxuICAgICcgICAgY29sb3IgPSB2ZWM0KHZfbm9ybWFsLCAxLik7JyxcbiAgICAnICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoMSk7JyxcbiAgICAnfSdcbl0uam9pbignXFxuJyk7XG5cbnZhciBXZWJHTFJlbmRlcmVyID0ge1xuICAgIGRyYXc6IGRyYXcsXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBnZW9tID0gRW50aXR5UmVnaXN0cnkuZ2V0TGF5ZXIoJ0dlb21ldHJpZXMnKTtcbiAgICAgICAgKGdlb20gPyBnZW9tLmVudGl0aWVzIDogW10pLmZvckVhY2goZnVuY3Rpb24gKGdlb20pIHtcbiAgICAgICAgICAgIHZhciBjID0gZ2VvbS5nZXRDb250ZXh0KCkuZ2V0Q29tcG9uZW50KCdjYW1lcmEnKTtcbiAgICAgICAgICAgIGlmIChjKSAgdGhpcy5zaGFkZXIudW5pZm9ybXMoeyBwZXJzcGVjdGl2ZTogIGMuZ2V0UHJvamVjdGlvblRyYW5zZm9ybSgpIH0pO1xuICAgICAgICAgICAgdGhpcy5kcmF3KGdlb20uX2NvbXBvbmVudHMuZ2VvbWV0cnkucmVuZGVyKCksIHtfc2l6ZTogW2lubmVyV2lkdGgsIGlubmVySGVpZ2h0LCAxMF19ICk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcbiAgICBkZXBsb3k6IGZ1bmN0aW9uICgpIHt9LFxuICAgIHVwZGF0ZTogZnVuY3Rpb24gKCkge30sXG4gICAgc2V0T3B0aW9uczogZnVuY3Rpb24oKSB7fSxcbiAgICBERUZBVUxUX09QVElPTlM6IHt9LFxuICAgIHJlY2FsbDogZnVuY3Rpb24gKCkge30sXG4gICAgZ2V0VGFyZ2V0czogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gW0dlb21ldHJ5LnRvU3RyaW5nKCldO1xuICAgIH0sXG4gICAgaW5pdDogaW5pdFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWJHTFJlbmRlcmVyO1xuXG5mdW5jdGlvbiBkcmF3KHNwZWMsIGNvbnRhaW5lcikge1xuICAgIGlmICghYXBwZW5kZWQpIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZ2wuY2FudmFzKTtcbiAgICBpZiAoISBzcGVjLnRleHR1cmUpIGRlbGV0ZSBzcGVjLnRleHR1cmU7XG5cbiAgICBpZiAoc3BlYy5jaHVua1Rlc3QpIHRoaXMuc2hhZGVyID0gbWVyZ2VQaXBlbGluZS5jYWxsKHRoaXMsIHNwZWMpO1xuICAgIGlmIChzcGVjLmZzQ2h1bmspIHRoaXMuc2hhZGVyID0gbWVyZ2VQaXBlbGluZS5jYWxsKHRoaXMsIHNwZWMsIHRydWUpO1xuXG4gICAgc3BlYy5tb3VzZSA9IG1vdXNlO1xuICAgIHNwZWMucmVzb2x1dGlvbiA9IGNvbnRhaW5lci5fc2l6ZTtcbiAgICBzcGVjLmNsb2NrID0gKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDA7XG4gICAgaWYgKCEgc3BlYy5ub2lzZSkgc3BlYy5ub2lzZSA9IDA7XG4gICAgdGhpcy5zaGFkZXIudW5pZm9ybXMoc3BlYykuZHJhdyhzcGVjLmdlb21ldHJ5KTtcbn1cblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHsgYWxwaGE6IHRydWUgfTtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgZ2wgPSB3aW5kb3cuZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnLCBvcHRpb25zKTtcblxuICAgIGlmICghIGdsKSB0aHJvdyAnV2ViR0wgbm90IHN1cHBvcnRlZCc7XG5cbiAgICB0aGlzLlNoYWRlck1ha2VyID0gcmVxdWlyZSgnLi4vLi4vZ2wvc2hhZGVyJykoZ2wpO1xuXG4gICAgdGhpcy5zaGFkZXIgPSBuZXcgdGhpcy5TaGFkZXJNYWtlcih2ZXJ0ZXhXcmFwcGVyLCBmcmFnbWVudFdyYXBwZXIpO1xuICAgIHdpbmRvdy5vbm1vdXNlbW92ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgbW91c2UgPSBbZS54IC8gaW5uZXJXaWR0aCwgMS4gLSBlLnkgL2lubmVySGVpZ2h0XTtcbiAgICB9O1xuXG4gICAgZ2wuZW5hYmxlKGdsLlBPTFlHT05fT0ZGU0VUX0ZJTEwpO1xuICAgIGdsLnBvbHlnb25PZmZzZXQoMSwgMSk7XG4gICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgIGdsLmNhbnZhcy5jbGFzc05hbWUgPSAnR0wnO1xuICAgIGdsLmNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIGdsLmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgZ2wudmlld3BvcnQoMCwgMCwgZ2wuY2FudmFzLndpZHRoLCBnbC5jYW52YXMuaGVpZ2h0KTtcbn1cblxuZnVuY3Rpb24gX19wZXJzcGVjdGl2ZShvdXQsIGZvdnksIGFzcGVjdCwgbmVhciwgZmFyKSB7XG4gICAgdmFyIGYgPSAxLjAgLyBNYXRoLnRhbihmb3Z5IC8gMiksXG4gICAgICAgIG5mID0gMSAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMF0gPSBmIC8gYXNwZWN0O1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDA7XG4gICAgb3V0WzVdID0gZjtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMDtcbiAgICBvdXRbOV0gPSAwO1xuICAgIG91dFsxMF0gPSAoZmFyICsgbmVhcikgKiBuZjtcbiAgICBvdXRbMTFdID0gLTE7XG4gICAgb3V0WzEyXSA9IDA7XG4gICAgb3V0WzEzXSA9IDA7XG4gICAgb3V0WzE0XSA9ICgyICogZmFyICogbmVhcikgKiBuZjtcbiAgICBvdXRbMTVdID0gMDtcbiAgICByZXR1cm4gb3V0O1xufTtcbnZhciBvbmNlID0gMDtcbmZ1bmN0aW9uIG1lcmdlUGlwZWxpbmUoc3BlYywgc2hhZGVyLCBmbGFnKSB7XG4gICAgc3BlYy5jaHVua1Rlc3QgPSBmYWxzZTtcbiAgICBpZiAoZmxhZylcbiAgICB0aGlzLnNoYWRlci52cyA9IHRoaXMuc2hhZGVyLnZzXG4gICAgICAgIC5yZXBsYWNlKCcvL2RlZmluZV92cycsIHNwZWMuY2h1bmtOb2lzZS5kZWZpbmVzKVxuICAgICAgICAucmVwbGFjZSgnLy9hcHBseV9mcycsIHNwZWMuY2h1bmtOb2lzZS5hcHBseSk7XG4gICAgZWxzZSB0aGlzLnNoYWRlci5mcyA9IHRoaXMuc2hhZGVyLmZzLnJlcGxhY2UoJy8vYXBwbHlfZnMnLCBzcGVjLmZzQ2h1bmspO1xuICAgIGlmKG9uY2UpIHJldHVybiB0aGlzLnNoYWRlcjtcbiAgICBvbmNlICsrO1xuICAgIFxuICAgIHJldHVybiBuZXcgdGhpcy5TaGFkZXJNYWtlcih0aGlzLnNoYWRlci52cywgdGhpcy5zaGFkZXIuZnMpO1xufVxuIiwidmFyIGNzcyA9IFwidmFyIGNzcyA9IFxcXCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXFxcXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXFxcXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxcXFxuICpcXFxcbiAqIE93bmVyOiBtYXJrQGZhbW8udXNcXFxcbiAqIEBsaWNlbnNlIE1QTCAyLjBcXFxcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxcXFxuICovXFxcXG5cXFxcblxcXFxuaHRtbCB7XFxcXG4gICAgd2lkdGg6IDEwMCU7XFxcXG4gICAgaGVpZ2h0OiAxMDAlO1xcXFxuICAgIG1hcmdpbjogMHB4O1xcXFxuICAgIHBhZGRpbmc6IDBweDtcXFxcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xcXFxuICAgIC13ZWJraXQtdHJhbnNmb3JtLXN0eWxlOiBwcmVzZXJ2ZS0zZDtcXFxcbiAgICB0cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkO1xcXFxufVxcXFxuXFxcXG5ib2R5IHtcXFxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxcXG4gICAgd2lkdGg6IDEwMCU7XFxcXG4gICAgaGVpZ2h0OiAxMDAlO1xcXFxuICAgIG1hcmdpbjogMHB4O1xcXFxuICAgIHBhZGRpbmc6IDBweDtcXFxcbiAgICAtd2Via2l0LXRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7XFxcXG4gICAgdHJhbnNmb3JtLXN0eWxlOiBwcmVzZXJ2ZS0zZDtcXFxcbiAgICAtd2Via2l0LWZvbnQtc21vb3RoaW5nOiBhbnRpYWxpYXNlZDtcXFxcbiAgICAtd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3I6IHRyYW5zcGFyZW50O1xcXFxuICAgIC13ZWJraXQtcGVyc3BlY3RpdmU6IDA7XFxcXG4gICAgcGVyc3BlY3RpdmU6IG5vbmU7XFxcXG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcXFxcbn1cXFxcblxcXFxuLmZhbW91cy1jb250YWluZXIsIC5mYW1vdXMtZ3JvdXAge1xcXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXFxcbiAgICB0b3A6IDBweDtcXFxcbiAgICBsZWZ0OiAwcHg7XFxcXG4gICAgYm90dG9tOiAwcHg7XFxcXG4gICAgcmlnaHQ6IDBweDtcXFxcbiAgICBvdmVyZmxvdzogdmlzaWJsZTtcXFxcbiAgICAtd2Via2l0LXRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7XFxcXG4gICAgdHJhbnNmb3JtLXN0eWxlOiBwcmVzZXJ2ZS0zZDtcXFxcbiAgICAtd2Via2l0LWJhY2tmYWNlLXZpc2liaWxpdHk6IHZpc2libGU7XFxcXG4gICAgYmFja2ZhY2UtdmlzaWJpbGl0eTogdmlzaWJsZTtcXFxcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcXFxcbn1cXFxcblxcXFxuLmZhbW91cy1ncm91cCB7XFxcXG4gICAgd2lkdGg6IDBweDtcXFxcbiAgICBoZWlnaHQ6IDBweDtcXFxcbiAgICBtYXJnaW46IDBweDtcXFxcbiAgICBwYWRkaW5nOiAwcHg7XFxcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkO1xcXFxuICAgIHRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7XFxcXG59XFxcXG5cXFxcbi5mYS1zdXJmYWNlIHtcXFxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm0tb3JpZ2luOiAwJSAwJTtcXFxcbiAgICB0cmFuc2Zvcm0tb3JpZ2luOiAwJSAwJTtcXFxcbiAgICAtd2Via2l0LWJhY2tmYWNlLXZpc2liaWxpdHk6IHZpc2libGU7XFxcXG4gICAgYmFja2ZhY2UtdmlzaWJpbGl0eTogdmlzaWJsZTtcXFxcbiAgICAtd2Via2l0LXRyYW5zZm9ybS1zdHlsZTogZmxhdDtcXFxcbiAgICB0cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkOyAvKiBwZXJmb3JtYW5jZSAqL1xcXFxuLyogICAgLXdlYmtpdC1ib3gtc2l6aW5nOiBib3JkZXItYm94O1xcXFxuICAgIC1tb3otYm94LXNpemluZzogYm9yZGVyLWJveDsqL1xcXFxuICAgIC13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcjogdHJhbnNwYXJlbnQ7XFxcXG4gICAgcG9pbnRlci1ldmVudHM6IGF1dG87XFxcXG5cXFxcbn1cXFxcblxcXFxuLmZhbW91cy1jb250YWluZXItZ3JvdXAge1xcXFxuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcXFxcbiAgICB3aWR0aDogMTAwJTtcXFxcbiAgICBoZWlnaHQ6IDEwMCU7XFxcXG59XFxcXG5cXFxcbi5mYS1jb250YWluZXIge1xcXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXFxcbiAgICAtd2Via2l0LXRyYW5zZm9ybS1vcmlnaW46IGNlbnRlciBjZW50ZXI7XFxcXG4gICAgdHJhbnNmb3JtLW9yaWdpbjogY2VudGVyIGNlbnRlcjtcXFxcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xcXFxufVxcXFxuXFxcXG5jYW52YXMuR0wge1xcXFxuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xcXFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXFxcbiAgICBvcGFjaXR5OiAuNztcXFxcbiAgICB6LWluZGV4OiA5OTk5O1xcXFxuICAgIHRvcDogMHB4O1xcXFxuICAgIGxlZnQ6IDBweDtcXFxcbn1cXFxcblxcXCI7IChyZXF1aXJlKFxcXCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvbm9kZV9tb2R1bGVzL2Nzc2lmeVxcXCIpKShjc3MpOyBtb2R1bGUuZXhwb3J0cyA9IGNzcztcIjsgKHJlcXVpcmUoXCIvVXNlcnMvam9zZXBoL2NvZGUvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvbm9kZV9tb2R1bGVzL2Nzc2lmeVwiKSkoY3NzKTsgbW9kdWxlLmV4cG9ydHMgPSBjc3M7IiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuLi9FbnRpdHlSZWdpc3RyeScpO1xudmFyIHJlbmRlck5vZGVzICAgID0gRW50aXR5UmVnaXN0cnkuZ2V0TGF5ZXIoJ2V2ZXJ5dGhpbmcnKTtcblxuLyoqXG4gKiBBIHN5c3RlbSB0aGF0IHdpbGwgcnVuIG92ZXIgY3VzdG9tIGNvbXBvbmVudHMgdGhhdCBoYXZlIGFuXG4gKiAgIHVwZGF0ZSBmdW5jdGlvbi5cbiAqXG4gKiBAY2xhc3MgQmVoYXZpb3JTeXN0ZW1cbiAqIEBzeXN0ZW1cbiAqIEBzaW5nbGV0b25cbiAqL1xudmFyIEJlaGF2aW9yU3lzdGVtID0ge307XG5cbi8qKlxuICogVXBkYXRlIHdpbGwgaXRlcmF0ZSBvdmVyIGFsbCBvZiB0aGUgZW50aXRpZXMgYW5kIGNhbGxcbiAqICAgZWFjaCBvZiB0aGVpciB1cGRhdGUgZnVuY3Rpb25zLlxuICpcbiAqIEBtZXRob2QgdXBkYXRlXG4gKi9cbkJlaGF2aW9yU3lzdGVtLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICB2YXIgaSA9IHJlbmRlck5vZGVzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIGlmIChyZW5kZXJOb2Rlcy5lbnRpdGllc1tpXS51cGRhdGUpXG4gICAgICAgICAgICByZW5kZXJOb2Rlcy5lbnRpdGllc1tpXS51cGRhdGUoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQmVoYXZpb3JTeXN0ZW07XG5cbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEVudGl0eVJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi4vRW50aXR5UmVnaXN0cnknKTtcbnZhciByb290cyAgICAgICAgICA9IEVudGl0eVJlZ2lzdHJ5LmFkZExheWVyKCdDb250ZXh0cycpO1xuXG4vKipcbiAqIENvcmVTeXN0ZW0gaXMgcmVzcG9uc2libGUgZm9yIHRyYXZlcnNpbmcgdGhlIHNjZW5lIGdyYXBoIGFuZFxuICogICB1cGRhdGluZyB0aGUgVHJhbnNmb3JtcyBvZiB0aGUgZW50aXRpZXMuXG4gKlxuICogQGNsYXNzICBDb3JlU3lzdGVtXG4gKiBAc3lzdGVtXG4gKiBAc2luZ2xldG9uXG4gKi9cbnZhciBDb3JlU3lzdGVtID0ge307XG5cbi8qKlxuICogdXBkYXRlIGl0ZXJhdGVzIG92ZXIgZWFjaCBvZiB0aGUgQ29udGV4dHMgdGhhdCB3ZXJlIHJlZ2lzdGVyZWQgYW5kXG4gKiAgIGtpY2tzIG9mIHRoZSByZWN1cnNpdmUgdXBkYXRpbmcgb2YgdGhlaXIgZW50aXRpZXMuXG4gKlxuICogQG1ldGhvZCB1cGRhdGVcbiAqL1xuQ29yZVN5c3RlbS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgcm9vdHMuZm9yRWFjaChjb3JlVXBkYXRlQW5kRmVlZCk7XG59O1xuXG4vKipcbiAqIGNvcmVVcGRhdGVBbmRGZWVkIGZlZWRzIHBhcmVudCBpbmZvcm1hdGlvbiB0byBhbiBlbnRpdHkgYW5kIHNvIHRoYXRcbiAqICAgZWFjaCBlbnRpdHkgY2FuIHVwZGF0ZSB0aGVpciB0cmFuc2Zvcm0uICBJdCB3aWxsIHRoZW4gcGFzcyBkb3duXG4gKiAgIGludmFsaWRhdGlvbiBzdGF0ZXMgYW5kIHZhbHVlcyB0byBhbnkgY2hpbGRyZW4uXG4gKlxuICogQG1ldGhvZCBjb3JlVXBkYXRlQW5kRmVlZFxuICogQHByaXZhdGVcbiAqICAgXG4gKiBAcGFyYW0gIHtFbnRpdHl9ICBlbnRpdHkgICAgICAgICAgIEVudGl0eSBpbiB0aGUgc2NlbmUgZ3JhcGhcbiAqIEBwYXJhbSAge051bWJlcn0gIHRyYW5zZm9ybVJlcG9ydCAgYml0U2NoZW1lIHJlcG9ydCBvZiB0cmFuc2Zvcm0gaW52YWxpZGF0aW9uc1xuICogQHBhcmFtICB7QXJyYXl9ICAgaW5jb21pbmdNYXRyaXggICBwYXJlbnQgdHJhbnNmb3JtIGFzIGEgRmxvYXQzMiBBcnJheVxuICovXG5mdW5jdGlvbiBjb3JlVXBkYXRlQW5kRmVlZChlbnRpdHksIHRyYW5zZm9ybVJlcG9ydCwgaW5jb21pbmdNYXRyaXgpIHtcbiAgICB2YXIgdHJhbnNmb3JtID0gZW50aXR5LmdldENvbXBvbmVudCgndHJhbnNmb3JtJyk7XG4gICAgdmFyIGkgICAgICAgICA9IGVudGl0eS5fY2hpbGRyZW4ubGVuZ3RoO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBUcmFuc2Zvcm0gYmFzZWQgb24gcGFyZW50IGludmFsaWRhdGlvbnNcbiAgICB0cmFuc2Zvcm1SZXBvcnQgPSB0cmFuc2Zvcm0uX3VwZGF0ZSh0cmFuc2Zvcm1SZXBvcnQsIGluY29taW5nTWF0cml4KTtcblxuICAgIHdoaWxlIChpLS0pIGNvcmVVcGRhdGVBbmRGZWVkKGVudGl0eS5fY2hpbGRyZW5baV0sIHRyYW5zZm9ybVJlcG9ydCwgdHJhbnNmb3JtLl9tYXRyaXgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvcmVTeXN0ZW07XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFbnRpdHlSZWdpc3RyeSA9IHJlcXVpcmUoJy4uL0VudGl0eVJlZ2lzdHJ5JyksXG4gICAgTWF0cml4TWF0aCAgICAgPSByZXF1aXJlKCcuLi8uLi9tYXRoLzR4NG1hdHJpeCcpLFxuICAgIE9wdGlvbnNNYW5hZ2VyID0gcmVxdWlyZSgnLi4vT3B0aW9uc01hbmFnZXInKTtcblxudmFyIHJlbmRlcmVycyAgICAgICAgICA9IHt9LFxuICAgIHRhcmdldHNUb1JlbmRlcmVycyA9IHt9O1xuXG52YXIgY29udGFpbmVycyAgPSBFbnRpdHlSZWdpc3RyeS5hZGRMYXllcignSGFzQ29udGFpbmVyJyksXG4gICAgcmVuZGVyYWJsZXMgPSBFbnRpdHlSZWdpc3RyeS5hZGRMYXllcignUmVuZGVyYWJsZXMnKTtcblxudmFyIHRvRGVwbG95ID0gW107XG5cbmNvbnRhaW5lcnMub24oJ2VudGl0eVB1c2hlZCcsIGRlcGxveUNvbnRhaW5lcik7XG5jb250YWluZXJzLm9uKCdlbnRpdHlSZW1vdmVkJywgcmVjYWxsQ29udGFpbmVyKTtcblxudmFyIGNvbnRhaW5lclRvVGFyZ2V0cyA9IHt9O1xuXG5mdW5jdGlvbiBkZXBsb3lDb250YWluZXIoZW50aXR5KSB7XG4gICAgaWYgKGVudGl0eS5nZXRDb250ZXh0KCkpIHJlbmRlcmVycy5ET00uZGVwbG95Q29udGFpbmVyKGVudGl0eSk7XG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgIHRvRGVwbG95LnB1c2goZW50aXR5KTsgLy8gVE9ETyBUaGlzIGlzIHRlbXBvcmFyeSBhbmQgaXQgc3Vja3Ncbn1cblxuZnVuY3Rpb24gcmVjYWxsQ29udGFpbmVyKGVudGl0eSkge1xuICAgIHJlbmRlcmVycy5ET00ucmVjYWxsQ29udGFpbmVyKGVudGl0eSk7XG59XG5cbmZ1bmN0aW9uIF9yZWxldmVudFRvUmVuZGVyZXIocmVuZGVyZXIsIGVudGl0eSkge1xuICAgIHZhciB0YXJnZXRzID0gcmVuZGVyZXIuZ2V0VGFyZ2V0cygpO1xuICAgIHZhciBqICAgICAgID0gdGFyZ2V0cy5sZW5ndGg7XG4gICAgd2hpbGUgKGotLSkgaWYgKGVudGl0eS5oYXNDb21wb25lbnQodGFyZ2V0c1tqXSkpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3JlbGV2ZW50VG9BbnlSZW5kZXJlcihlbnRpdHkpIHtcbiAgICB2YXIgcmVuZGVyZXJOYW1lcyA9IE9iamVjdC5rZXlzKHJlbmRlcmVycyksXG4gICAgICAgIGkgICAgICAgICAgICAgPSByZW5kZXJlck5hbWVzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpLS0pIGlmIChfcmVsZXZlbnRUb1JlbmRlcmVyKHJlbmRlcmVyc1tyZW5kZXJlck5hbWVzW2ldXSwgZW50aXR5KSkgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG52YXIgdmVydGV4U2NyYXRjaCA9IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDBdKSxcbiAgICBtYXRyaXhTY3JhdGNoID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pO1xuXG4vLyBWZXJ0ZXggY3VsbGluZyBsb2dpY1xuZnVuY3Rpb24gX2lzV2l0aGluKHRhcmdldCwgZW50aXR5LCBjb250YWluZXIpIHtcbiAgICAvLyB2YXIgdmVydGljaWVzICAgPSB0YXJnZXQuZ2V0VmVydGljaWVzKCksXG4gICAgLy8gICAgIGkgICAgICAgICAgID0gdmVydGljaWVzLmxlbmd0aCxcbiAgICAvLyAgICAgdiAgICAgICAgICAgPSBudWxsLFxuICAgIC8vICAgICBvcmlnaW4gICAgICA9IHZvaWQgMCxcbiAgICAvLyAgICAgaXNJbnNpZGUgICAgPSBmYWxzZSxcbiAgICAvLyAgICAgZGlzcGxheVNpemUgPSBjb250YWluZXIuZ2V0Q29tcG9uZW50KCdzaXplJykuZ2V0R2xvYmFsU2l6ZSgpLFxuICAgIC8vICAgICB4ICAgICAgICAgICA9IDAsXG4gICAgLy8gICAgIHkgICAgICAgICAgID0gMCxcbiAgICAvLyAgICAgc2l6ZSAgICAgICAgPSBlbnRpdHkuZ2V0Q29tcG9uZW50KCdzaXplJykuZ2V0R2xvYmFsU2l6ZSgpLFxuICAgIC8vICAgICBmdCAgICAgICAgICA9IE1hdHJpeE1hdGgubXVsdGlwbHkobWF0cml4U2NyYXRjaCxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5nZXRDb21wb25lbnQoJ2NvbnRhaW5lcicpLmdldERpc3BsYXlNYXRyaXgoKSwgXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRpdHkuZ2V0Q29tcG9uZW50KCd0cmFuc2Zvcm0nKS5nZXRHbG9iYWxNYXRyaXgoKSk7XG5cbiAgICAvLyB3aGlsZSAoIWlzSW5zaWRlICYmIGktLSkge1xuICAgIC8vICAgICB2ID0gdmVydGljaWVzW2ldO1xuICAgIC8vICAgICBpZiAodGFyZ2V0LmdldE9yaWdpbikge1xuICAgIC8vICAgICAgICAgb3JpZ2luICA9IHRhcmdldC5nZXRPcmlnaW4oKTtcbiAgICAvLyAgICAgICAgIHZbMF0gICAtPSBzaXplWzBdICogb3JpZ2luWzBdO1xuICAgIC8vICAgICAgICAgdlsxXSAgIC09IHNpemVbMV0gKiBvcmlnaW5bMV07XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgTWF0cml4TWF0aC5hcHBseVRvVmVjdG9yKHZlcnRleFNjcmF0Y2gsIGZ0LCB2KTtcbiAgICAvLyAgICAgaWYgKG9yaWdpbikge1xuICAgIC8vICAgICAgICAgdlswXSArPSBzaXplWzBdICogb3JpZ2luWzBdO1xuICAgIC8vICAgICAgICAgdlsxXSArPSBzaXplWzFdICogb3JpZ2luWzFdO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIHggPSB2ZXJ0ZXhTY3JhdGNoWzBdIC8gdmVydGV4U2NyYXRjaFszXTtcbiAgICAvLyAgICAgeSA9IHZlcnRleFNjcmF0Y2hbMV0gLyB2ZXJ0ZXhTY3JhdGNoWzNdO1xuICAgIC8vICAgICBpc0luc2lkZSA9IHggPD0gKCBkaXNwbGF5U2l6ZVswXSAvIDIpICYmXG4gICAgLy8gICAgICAgICAgICAgICAgeSA8PSAoIGRpc3BsYXlTaXplWzFdIC8gMikgJiZcbiAgICAvLyAgICAgICAgICAgICAgICB4ID49ICgtZGlzcGxheVNpemVbMF0gLyAyKSAmJlxuICAgIC8vICAgICAgICAgICAgICAgIHkgPj0gKC1kaXNwbGF5U2l6ZVsxXSAvIDIpO1xuICAgIC8vIH0gXG4gICAgLy8gcmV0dXJuIGlzSW5zaWRlO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFJlbmRlclN5c3RlbSBpcyByZXNwb25zaWJsZSBmb3Iga2VlcGluZyB0cmFjayBvZiB0aGUgdmFyaW91cyByZW5kZXJlcnNcbiAqICBhbmQgZmVlZGluZyB0aGVtIFxuICpcbiAqXG4gKiBAY2xhc3MgUmVuZGVyU3lzdGVtXG4gKiBAc3lzdGVtXG4gKi9cbnZhciBSZW5kZXJTeXN0ZW0gPSB7fTtcblxuUmVuZGVyU3lzdGVtLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICB2YXIgdGFyZ2V0cyAgICAgICAgICAgICA9IE9iamVjdC5rZXlzKHRhcmdldHNUb1JlbmRlcmVycyksXG4gICAgICAgIHJlbmRlcmVyTmFtZXMgICAgICAgPSBPYmplY3Qua2V5cyhyZW5kZXJlcnMpLFxuICAgICAgICB0YXJnZXQgICAgICAgICAgICAgID0gbnVsbCxcbiAgICAgICAgZW50aXR5ICAgICAgICAgICAgICA9IG51bGwsXG4gICAgICAgIGNvbnRhaW5lciAgICAgICAgICAgPSBudWxsLFxuICAgICAgICB0YXJnZXROYW1lICAgICAgICAgID0gdm9pZCAwLFxuICAgICAgICBjb250YWluZXJFbnRzICAgICAgID0gY29udGFpbmVycy5lbnRpdGllcyxcbiAgICAgICAgZW50aXRpZXMgICAgICAgICAgICA9IHJlbmRlcmFibGVzLmVudGl0aWVzLFxuICAgICAgICBpICAgICAgICAgICAgICAgICAgID0gZW50aXRpZXMubGVuZ3RoLFxuICAgICAgICB0YXJnZXRzTGVuZ3RoICAgICAgID0gdGFyZ2V0cy5sZW5ndGgsXG4gICAgICAgIGNvbnRhaW5lckVudExlbmd0aHMgPSBjb250YWluZXJFbnRzLmxlbmd0aCxcbiAgICAgICAgcmVuZGVyZXJzTGVuZ3RoICAgICA9IDAsXG4gICAgICAgIGogICAgICAgICAgICAgICAgICAgPSB0b0RlcGxveS5sZW5ndGgsXG4gICAgICAgIGsgICAgICAgICAgICAgICAgICAgPSAwLFxuICAgICAgICBsICAgICAgICAgICAgICAgICAgID0gMDtcblxuICAgIC8vIFVwZGF0ZSB0aGUgQ29udGFpbmVyIGlmIGl0cyB0cmFuc2Zvcm0gb3Igc2l6ZSBhcmUgZGlydHkuXG4gICAgY29udGFpbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGVudGl0eSkge1xuICAgICAgICBjb250YWluZXIgPSBlbnRpdHkuZ2V0Q29tcG9uZW50KCdjb250YWluZXInKTtcbiAgICAgICAgaWYgKGVudGl0eS5nZXRDb250ZXh0KCkgJiYgKGNvbnRhaW5lci5fdHJhbnNmb3JtRGlydHkgfHwgY29udGFpbmVyLl9zaXplRGlydHkpKSByZW5kZXJlcnMuRE9NLnVwZGF0ZUNvbnRhaW5lcihlbnRpdHkpO1xuICAgIH0pO1xuXG4gICAgd2hpbGUgKGotLSkgZGVwbG95Q29udGFpbmVyKHRvRGVwbG95LnBvcCgpKTtcblxuICAgIC8vIEZvciBhbGwgb2YgdGhlIHJlbmRlcmFibGVzXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBqICAgICAgPSB0YXJnZXRzTGVuZ3RoO1xuICAgICAgICBlbnRpdHkgPSBlbnRpdGllc1tpXTtcbiAgICAgICAgaWYgKCFlbnRpdHkuZ2V0Q29udGV4dCgpKSBjb250aW51ZTtcblxuICAgICAgICAvLyBGb3IgZWFjaCByZW5kZXJlclxuICAgICAgICB3aGlsZSAoai0tKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSBlbnRpdHkuZ2V0Q29tcG9uZW50KHRhcmdldHNbal0pO1xuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIGNvbnRpbnVlOyAvLyBza2lwIGlmIHRoaXMgUmVuZGVyYWJsZSBkb2VzIG5vdCBjb250YWluZXIgdGhlIHByb3BlciB0YXJnZXQgY29tcG9uZW50IGZvciB0aGlzIHJlbmRlcmVyXG5cbiAgICAgICAgICAgIGsgPSBjb250YWluZXJFbnRMZW5ndGhzO1xuXG4gICAgICAgICAgICBpZiAoaykge1xuICAgICAgICAgICAgICAgIHRhcmdldE5hbWUgICAgICA9IHRhcmdldC5jb25zdHJ1Y3Rvci50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIHJlbmRlcmVyc0xlbmd0aCA9IHRhcmdldHNUb1JlbmRlcmVyc1t0YXJnZXROYW1lXS5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICAvLyBGb3IgZWFjaCBjb250YWluZXJcbiAgICAgICAgICAgICAgICB3aGlsZSAoay0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGwgICAgICAgICAgPSByZW5kZXJlcnNMZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lciAgPSBjb250YWluZXJFbnRzW2tdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSB0YXJnZXQgaXMgaW4gdGhlIENvbnRhaW5lclxuICAgICAgICAgICAgICAgICAgICBpZiAoX2lzV2l0aGluKHRhcmdldCwgZW50aXR5LCBjb250YWluZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEZWNpZGUgaWYgdG8gZGVwbG95ICBhbmQgdXBkYXRlIG9yIGp1c3QgdXBkYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0Ll9pc1dpdGhpbihjb250YWluZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGwtLSkgdGFyZ2V0c1RvUmVuZGVyZXJzW3RhcmdldE5hbWVdW2xdLnVwZGF0ZShlbnRpdHksIGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChsLS0pIHRhcmdldHNUb1JlbmRlcmVyc1t0YXJnZXROYW1lXVtsXS5kZXBsb3koZW50aXR5LCBjb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldC5fYWRkVG9Db250YWluZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQuX2lzV2l0aGluKGNvbnRhaW5lcikpIHsgLy8gSWYgdGhlIHRhcmdldCBpcyBjdWxsZWQgcmVjYWxsIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAobC0tKSB0YXJnZXRzVG9SZW5kZXJlcnNbdGFyZ2V0TmFtZV1bbF0ucmVjYWxsKGVudGl0eSwgY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldC5fcmVtb3ZlRnJvbUNvbnRhaW5lcihjb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZXNldCB0aGUgaW52YWxpZGF0aW9ucyBhZnRlciBhbGwgb2YgdGhlIGxvZ2ljIGZvciBcbiAgICAgICAgICAgIC8vIGEgcGFydGljdWxhciB0YXJnZXQgXG4gICAgICAgICAgICBpZiAodGFyZ2V0LnJlc2V0SW52YWxpZGF0aW9ucykgdGFyZ2V0LnJlc2V0SW52YWxpZGF0aW9ucygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gSGF2ZSBlYWNoIHJlbmRlcmVyIHJ1blxuICAgIGkgPSByZW5kZXJlck5hbWVzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSByZW5kZXJlcnNbcmVuZGVyZXJOYW1lc1tpXV0ucmVuZGVyKCk7XG59O1xuXG4vKipcbiAqIEFkZCBhIG5ldyByZW5kZXJlciB3aGljaCB3aWxsIGJlIGNhbGxlZCBldmVyeSBmcmFtZS5cbiAqXG4gKiBAbWV0aG9kIHJlZ2lzdGVyXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgbmFtZSBvZiB0aGUgcmVuZGVyZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSByZW5kZXJlciBzaW5nbGV0b24gcmVuZGVyZXIgb2JqZWN0XG4gKi9cblJlbmRlclN5c3RlbS5yZWdpc3RlciA9IGZ1bmN0aW9uIHJlZ2lzdGVyKG5hbWUsIHJlbmRlcmVyKSB7XG4gICAgaWYgKHJlbmRlcmVyc1tuYW1lXSAhPSBudWxsKSByZXR1cm4gZmFsc2U7XG5cbiAgICByZW5kZXJlcnNbbmFtZV0gPSByZW5kZXJlcjtcblxuICAgIHZhciB0YXJnZXRzID0gcmVuZGVyZXIuZ2V0VGFyZ2V0cygpLFxuICAgICAgICBpICAgICAgID0gdGFyZ2V0cy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGlmICh0YXJnZXRzVG9SZW5kZXJlcnNbdGFyZ2V0c1tpXV0gPT0gbnVsbCkgdGFyZ2V0c1RvUmVuZGVyZXJzW3RhcmdldHNbaV1dID0gW107XG4gICAgICAgIHRhcmdldHNUb1JlbmRlcmVyc1t0YXJnZXRzW2ldXS5wdXNoKHJlbmRlcmVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyU3lzdGVtO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuICd1c2Ugc3RyaWN0JztcblxudmFyIHByZXZpb3VzVGltZSAgICAgICA9IDAsIFxuICAgIGRlbHRhICAgICAgICAgICAgICA9IDAsXG4gICAgaW5pdGlhbGl6YXRpb25UaW1lID0gRGF0ZS5ub3coKSxcbiAgICBjdXJyZW50VGltZSAgICAgICAgPSBpbml0aWFsaXphdGlvblRpbWUsXG4gICAgcmVsYXRpdmVUaW1lICAgICAgID0gaW5pdGlhbGl6YXRpb25UaW1lLFxuICAgIGFic29sdXRlVGltZSAgICAgICA9IGluaXRpYWxpemF0aW9uVGltZSxcbiAgICBwcmV2aW91c1JlbEZyYW1lICAgPSAwO1xuXG4vKipcbiAqIFRpbWVTeXN0ZW0gaXMgcmVzcG9uc2libGUgZm9yIGRldGVybWluaW5nIHRoZSBjdXJyZW50IG1vbWVudC5cbiAqXG4gKiBAY2xhc3MgVGltZVN5c3RlbVxuICogQHN5c3RlbVxuICovXG52YXIgVGltZVN5c3RlbSA9IHt9O1xuXG4vKipcbiAqIFVwZGF0ZSB0aGUgdGltZSBiYXNlZCBvbiB0aGUgZnJhbWUgZGF0YSBmcm9tIHRoZSBFbmdpbmUuXG4gKlxuICogQG1ldGhvZCB1cGRhdGVcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcmVsRnJhbWUgXG4gKi9cblRpbWVTeXN0ZW0udXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKHJlbEZyYW1lKSB7XG4gICAgcHJldmlvdXNUaW1lICAgICA9IGN1cnJlbnRUaW1lO1xuICAgIGN1cnJlbnRUaW1lICAgICAgPSBEYXRlLm5vdygpO1xuICAgIGRlbHRhICAgICAgICAgICAgPSBjdXJyZW50VGltZSAtIHByZXZpb3VzVGltZTtcbiAgICByZWxhdGl2ZVRpbWUgICAgKz0gZGVsdGEgKiAocmVsRnJhbWUgLSBwcmV2aW91c1JlbEZyYW1lKTtcbiAgICBhYnNvbHV0ZVRpbWUgICAgKz0gZGVsdGE7XG4gICAgcHJldmlvdXNSZWxGcmFtZSA9IHJlbEZyYW1lO1xufTtcblxuLyoqXG4gKiBHZXQgcmVsYXRpdmUgdGltZSBpbiBtcyBvZmZmc2V0IGJ5IHRoZSBzcGVlZCBhdCB3aGljaCB0aGUgRW5naW5lIGlzIHJ1bm5pbmcuXG4gKlxuICogQG1ldGhvZCBnZXRSZWxhdGl2ZVRpbWVcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSB0aW1lIGFjY291bnRpbmcgZm9yIEVuZ2luZSdzIHJ1biBzcGVlZFxuICovXG5UaW1lU3lzdGVtLmdldFJlbGF0aXZlVGltZSA9IGZ1bmN0aW9uIGdldFJlbGF0aXZlVGltZSgpIHtcbiAgICByZXR1cm4gcmVsYXRpdmVUaW1lO1xufTtcblxuLyoqXG4gKiBHZXQgYWJzb2x1dGUgdGltZS5cbiAqXG4gKiBAbWV0aG9kIGdldEFic29sdXRlVGltZVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIHRpbWUgaW4gbXNcbiAqL1xuVGltZVN5c3RlbS5nZXRBYnNvbHV0ZVRpbWUgPSBmdW5jdGlvbiBnZXRBYnNvbHV0ZVRpbWUoKSB7XG4gICAgcmV0dXJuIGFic29sdXRlVGltZTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSB0aW1lIGluIHdoaWNoIHRoZSBFbmdpbmUgd2FzIGluc3RhbnRpYXRlZC5cbiAqXG4gKiBAbWV0aG9kIGdldEluaXRpYWxUaW1lXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0aGUgdGltZSBpbiBtc1xuICovXG5UaW1lU3lzdGVtLmdldEluaXRpYWxUaW1lID0gZnVuY3Rpb24gZ2V0SW5pdGlhbFRpbWUoKSB7XG4gICAgcmV0dXJuIGluaXRpYWxpemF0aW9uVGltZTtcbn07XG5cbi8qKlxuICogR2V0IGVsYXBzZWQgdGltZSBzaW5jZSBpbnN0YW50aWF0aW9uIGFjY291bnRpbmcgZm9yIEVuZ2luZSBzcGVlZFxuICpcbiAqIEBtZXRob2QgZ2V0RWxhcHNlZFJlbGF0aXZlVGltZVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIHRpbWUgaW4gbXNcbiAqL1xuVGltZVN5c3RlbS5nZXRFbGFwc2VkUmVsYXRpdmVUaW1lID0gZnVuY3Rpb24gZ2V0RWxhcHNlZFJlbGF0aXZlVGltZSgpIHtcbiAgICByZXR1cm4gcmVsYXRpdmVUaW1lIC0gaW5pdGlhbGl6YXRpb25UaW1lO1xufTtcblxuLyoqXG4gKiBHZXQgYWJzb2x1dGUgZWxhcHNlZCB0aW1lIHNpbmNlIGluc3RhbnRpYXRpb25cbiAqXG4gKiBAbWV0aG9kIGdldEVsYXBzZWRBYnNvbHV0ZVRpbWVcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSB0aW1lIGluIG1zXG4gKi9cblRpbWVTeXN0ZW0uZ2V0RWxhcHNlZEFic29sdXRlVGltZSA9IGZ1bmN0aW9uIGdldEVsYXBzZWRBYnNvbHV0ZVRpbWUoKSB7XG4gICAgcmV0dXJuIGFic29sdXRlVGltZSAtIGluaXRpYWxpemF0aW9uVGltZTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSB0aW1lIGJldHdlZW4gdGhpcyBmcmFtZSBhbmQgbGFzdC5cbiAqXG4gKiBAbWV0aG9kIGdldERlbHRhXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0aGUgdGltZSBpbiBtc1xuICovXG5UaW1lU3lzdGVtLmdldERlbHRhID0gZnVuY3Rpb24gZ2V0RGVsdGEoKSB7XG4gICAgcmV0dXJuIGRlbHRhO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUaW1lU3lzdGVtO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgTWF0cml4TWF0aCA9IHJlcXVpcmUoJy4uLy4uL21hdGgvNHg0bWF0cml4Jyk7XG5cbi8qKlxuICogVGFyZ2V0IGlzIHRoZSBiYXNlIGNsYXNzIGZvciBhbGwgcmVuZGVyYWJsZXMuICBJdCBob2xkcyB0aGUgc3RhdGUgb2ZcbiAqICAgaXRzIHZlcnRpY2llcywgdGhlIENvbnRhaW5lcnMgaXQgaXMgZGVwbG95ZWQgaW4sIHRoZSBDb250ZXh0IGl0IGJlbG9uZ3NcbiAqICAgdG8sIGFuZCB3aGV0aGVyIG9yIG5vdCBvcmlnaW4gYWxpZ25tZW50IG5lZWRzIHRvIGJlIGFwcGxpZWQuXG4gKlxuICogQGNvbXBvbmVudCBUYXJnZXRcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgIEVudGl0eSB0aGF0IHRoZSBUYXJnZXQgaXMgYSBjb21wb25lbnQgb2ZcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gVGFyZ2V0KGVudGl0eSwgb3B0aW9ucykge1xuICAgIHRoaXMudmVydGljaWVzICA9IG9wdGlvbnMudmVydGljaWVzIHx8IFtdO1xuICAgIHRoaXMuY29udGFpbmVycyA9IHt9O1xuICAgIC8vIHRoaXMuY29udGV4dCAgICA9IGVudGl0eS5nZXRDb250ZXh0KCkuX2lkO1xuICAgIHRoaXMuX2hhc09yaWdpbiA9IGZhbHNlO1xufVxuXG4vKipcbiAqIEdldCB0aGUgdmVydGljaWVzIG9mIHRoZSBUYXJnZXQuXG4gKlxuICogQG1ldGhvZCBnZXRWZXJ0aWNpZXNcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYXJyYXkgb2YgdGhlIHZlcnRpY2llcyByZXByZXNlbnRlZCBhcyB0aHJlZSBlbGVtZW50IGFycmF5cyBbeCwgeSwgel1cbiAqL1xuVGFyZ2V0LnByb3RvdHlwZS5nZXRWZXJ0aWNpZXMgPSBmdW5jdGlvbiBnZXRWZXJ0aWNpZXMoKXtcbiAgICByZXR1cm4gdGhpcy52ZXJ0aWNpZXM7XG59O1xuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBhIFRhcmdldCB3YXMgZGVwbG95ZWQgdG8gYSBwYXJ0aWN1bGFyIGNvbnRhaW5lclxuICpcbiAqIEBtZXRob2QgX2lzV2l0aGluXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZSBpZCBvZiB0aGUgQ29udGFpbmVyJ3MgRW50aXR5XG4gKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIG9yIG5vdyB0aGUgVGFyZ2V0IHdhcyBkZXBsb3llZCB0byB0aGlzIHBhcnRpY3VsYXIgQ29udGFpbmVyXG4gKi9cblRhcmdldC5wcm90b3R5cGUuX2lzV2l0aGluID0gZnVuY3Rpb24gX2lzV2l0aGluKGNvbnRhaW5lcikge1xuICAgIHJldHVybiB0aGlzLmNvbnRhaW5lcnNbY29udGFpbmVyLl9pZF07XG59O1xuXG4vKipcbiAqIE1hcmsgYSBDb250YWluZXIgYXMgaGF2aW5nIGEgZGVwbG95ZWQgaW5zdGFuY2Ugb2YgdGhlIFRhcmdldFxuICpcbiAqIEBtZXRob2QgX2FkZFRvQ29udGFpbmVyXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZSBpZCBvZiB0aGUgQ29udGFpbmVyJ3MgRW50aXR5XG4gKiBAcmV0dXJuIHtCb29sZWFufSBzdGF1cyBvZiB0aGUgYWRkaXRpb25cbiAqL1xuVGFyZ2V0LnByb3RvdHlwZS5fYWRkVG9Db250YWluZXIgPSBmdW5jdGlvbiBfYWRkVG9Db250YWluZXIoY29udGFpbmVyKSB7XG4gICAgdGhpcy5jb250YWluZXJzW2NvbnRhaW5lci5faWRdID0gdHJ1ZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogVW5tYXJrIGEgQ29udGFpbmVyIGFzIGhhdmluZyBhIGRlcGxveWVkIGluc3RhbmNlIG9mIHRoZSBUYXJnZXRcbiAqXG4gKiBAbWV0aG9kIF9yZW1vdmVGcm9tQ29udGFpbmVyXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRoZSBpZCBvZiB0aGUgQ29udGFpbmVyJ3MgRW50aXR5XG4gKiBAcmV0dXJuIHtCb29sZWFufSBzdGF1cyBvZiB0aGUgcmVtb3ZhbFxuICovXG5UYXJnZXQucHJvdG90eXBlLl9yZW1vdmVGcm9tQ29udGFpbmVyID0gZnVuY3Rpb24gX3JlbW92ZUZyb21Db250YWluZXIoY29udGFpbmVyKSB7XG4gICAgdGhpcy5jb250YWluZXJzW2NvbnRhaW5lci5faWRdID0gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRhcmdldDtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRXZlbnRFbWl0dGVyIHJlcHJlc2VudHMgYSBjaGFubmVsIGZvciBldmVudHMuXG4gKlxuICogQGNsYXNzIEV2ZW50RW1pdHRlclxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgICB0aGlzLmxpc3RlbmVycyA9IHt9O1xuICAgIHRoaXMuX293bmVyID0gdGhpcztcbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGFuIGV2ZW50LCBzZW5kaW5nIHRvIGFsbCBkb3duc3RyZWFtIGhhbmRsZXJzXG4gKiAgIGxpc3RlbmluZyBmb3IgcHJvdmlkZWQgJ3R5cGUnIGtleS5cbiAqXG4gKiBAbWV0aG9kIGVtaXRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgZXZlbnQgZGF0YVxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSwgZXZlbnQpIHtcbiAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLmxpc3RlbmVyc1t0eXBlXTtcbiAgICBpZiAoaGFuZGxlcnMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaGFuZGxlcnNbaV0uY2FsbCh0aGlzLl9vd25lciwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBCaW5kIGEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYW4gZXZlbnQgdHlwZSBoYW5kbGVkIGJ5IHRoaXMgb2JqZWN0LlxuICpcbiAqIEBtZXRob2QgXCJvblwiXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcsIE9iamVjdCl9IGhhbmRsZXIgY2FsbGJhY2tcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24odHlwZSwgaGFuZGxlcikge1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy5saXN0ZW5lcnMpKSB0aGlzLmxpc3RlbmVyc1t0eXBlXSA9IFtdO1xuICAgIHZhciBpbmRleCA9IHRoaXMubGlzdGVuZXJzW3R5cGVdLmluZGV4T2YoaGFuZGxlcik7XG4gICAgaWYgKGluZGV4IDwgMCkgdGhpcy5saXN0ZW5lcnNbdHlwZV0ucHVzaChoYW5kbGVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIFwib25cIi5cbiAqIEBtZXRob2QgYWRkTGlzdGVuZXJcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8qKlxuICogVW5iaW5kIGFuIGV2ZW50IGJ5IHR5cGUgYW5kIGhhbmRsZXIuXG4gKiAgIFRoaXMgdW5kb2VzIHRoZSB3b3JrIG9mIFwib25cIi5cbiAqXG4gKiBAbWV0aG9kIHJlbW92ZUxpc3RlbmVyXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtmdW5jdGlvbn0gaGFuZGxlciBmdW5jdGlvbiBvYmplY3QgdG8gcmVtb3ZlXG4gKiBAcmV0dXJuIHtFdmVudEVtaXR0ZXJ9IHRoaXNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKHR5cGUsIGhhbmRsZXIpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5pbmRleE9mKGhhbmRsZXIpO1xuICAgIGlmIChpbmRleCA+PSAwKSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDYWxsIGV2ZW50IGhhbmRsZXJzIHdpdGggdGhpcyBzZXQgdG8gb3duZXIuXG4gKlxuICogQG1ldGhvZCBiaW5kVGhpc1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvd25lciBvYmplY3QgdGhpcyBFdmVudEVtaXR0ZXIgYmVsb25ncyB0b1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmJpbmRUaGlzID0gZnVuY3Rpb24gYmluZFRoaXMob3duZXIpIHtcbiAgICB0aGlzLl9vd25lciA9IG93bmVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4qIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbipcbiogT3duZXI6IG1hcmtAZmFtby51c1xuKiBAbGljZW5zZSBNUEwgMi4wXG4qIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnLi9FdmVudEVtaXR0ZXInKTtcblxuLyoqXG4gKiBFdmVudEhhbmRsZXIgZm9yd2FyZHMgcmVjZWl2ZWQgZXZlbnRzIHRvIGEgc2V0IG9mIHByb3ZpZGVkIGNhbGxiYWNrIGZ1bmN0aW9ucy5cbiAqIEl0IGFsbG93cyBldmVudHMgdG8gYmUgY2FwdHVyZWQsIHByb2Nlc3NlZCwgYW5kIG9wdGlvbmFsbHkgcGlwZWQgdGhyb3VnaCB0byBvdGhlciBldmVudCBoYW5kbGVycy5cbiAqXG4gKiBAY2xhc3MgRXZlbnRIYW5kbGVyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEhhbmRsZXIoKSB7XG4gICAgRXZlbnRFbWl0dGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmRvd25zdHJlYW0gPSBbXTsgLy8gZG93bnN0cmVhbSBldmVudCBoYW5kbGVyc1xuICAgIHRoaXMuZG93bnN0cmVhbUZuID0gW107IC8vIGRvd25zdHJlYW0gZnVuY3Rpb25zXG5cbiAgICB0aGlzLnVwc3RyZWFtID0gW107IC8vIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXJzXG4gICAgdGhpcy51cHN0cmVhbUxpc3RlbmVycyA9IHt9OyAvLyB1cHN0cmVhbSBsaXN0ZW5lcnNcbn1cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50RW1pdHRlci5wcm90b3R5cGUpO1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEV2ZW50SGFuZGxlcjtcblxuLyoqXG4gKiBBc3NpZ24gYW4gZXZlbnQgaGFuZGxlciB0byByZWNlaXZlIGFuIG9iamVjdCdzIGlucHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldElucHV0SGFuZGxlclxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb2JqZWN0IHRvIG1peCB0cmlnZ2VyLCBzdWJzY3JpYmUsIGFuZCB1bnN1YnNjcmliZSBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyID0gZnVuY3Rpb24gc2V0SW5wdXRIYW5kbGVyKG9iamVjdCwgaGFuZGxlcikge1xuICAgIG9iamVjdC50cmlnZ2VyID0gaGFuZGxlci50cmlnZ2VyLmJpbmQoaGFuZGxlcik7XG4gICAgaWYgKGhhbmRsZXIuc3Vic2NyaWJlICYmIGhhbmRsZXIudW5zdWJzY3JpYmUpIHtcbiAgICAgICAgb2JqZWN0LnN1YnNjcmliZSA9IGhhbmRsZXIuc3Vic2NyaWJlLmJpbmQoaGFuZGxlcik7XG4gICAgICAgIG9iamVjdC51bnN1YnNjcmliZSA9IGhhbmRsZXIudW5zdWJzY3JpYmUuYmluZChoYW5kbGVyKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEFzc2lnbiBhbiBldmVudCBoYW5kbGVyIHRvIHJlY2VpdmUgYW4gb2JqZWN0J3Mgb3V0cHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldE91dHB1dEhhbmRsZXJcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9iamVjdCB0byBtaXggcGlwZSwgdW5waXBlLCBvbiwgYWRkTGlzdGVuZXIsIGFuZCByZW1vdmVMaXN0ZW5lciBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlciA9IGZ1bmN0aW9uIHNldE91dHB1dEhhbmRsZXIob2JqZWN0LCBoYW5kbGVyKSB7XG4gICAgaWYgKGhhbmRsZXIgaW5zdGFuY2VvZiBFdmVudEhhbmRsZXIpIGhhbmRsZXIuYmluZFRoaXMob2JqZWN0KTtcbiAgICBvYmplY3QucGlwZSA9IGhhbmRsZXIucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC51bnBpcGUgPSBoYW5kbGVyLnVucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC5vbiA9IGhhbmRsZXIub24uYmluZChoYW5kbGVyKTtcbiAgICBvYmplY3QuYWRkTGlzdGVuZXIgPSBvYmplY3Qub247XG4gICAgb2JqZWN0LnJlbW92ZUxpc3RlbmVyID0gaGFuZGxlci5yZW1vdmVMaXN0ZW5lci5iaW5kKGhhbmRsZXIpO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VyIGFuIGV2ZW50LCBzZW5kaW5nIHRvIGFsbCBkb3duc3RyZWFtIGhhbmRsZXJzXG4gKiAgIGxpc3RlbmluZyBmb3IgcHJvdmlkZWQgJ3R5cGUnIGtleS5cbiAqXG4gKiBAbWV0aG9kIGVtaXRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgZXZlbnQgZGF0YVxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSwgZXZlbnQpIHtcbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5kb3duc3RyZWFtW2ldLnRyaWdnZXIpIHRoaXMuZG93bnN0cmVhbVtpXS50cmlnZ2VyKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbUZuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZG93bnN0cmVhbUZuW2ldKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBlbWl0XG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudHJpZ2dlciA9IEV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdDtcblxuLyoqXG4gKiBBZGQgZXZlbnQgaGFuZGxlciBvYmplY3QgdG8gc2V0IG9mIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKlxuICogQG1ldGhvZCBwaXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCBldmVudCBoYW5kbGVyIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcGFzc2VkIGV2ZW50IGhhbmRsZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24gcGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnN1YnNjcmliZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSByZXR1cm4gdGFyZ2V0LnN1YnNjcmliZSh0aGlzKTtcblxuICAgIHZhciBkb3duc3RyZWFtQ3R4ID0gKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/IHRoaXMuZG93bnN0cmVhbUZuIDogdGhpcy5kb3duc3RyZWFtO1xuICAgIHZhciBpbmRleCA9IGRvd25zdHJlYW1DdHguaW5kZXhPZih0YXJnZXQpO1xuICAgIGlmIChpbmRleCA8IDApIGRvd25zdHJlYW1DdHgucHVzaCh0YXJnZXQpO1xuXG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB0YXJnZXQoJ3BpcGUnLCBudWxsKTtcbiAgICBlbHNlIGlmICh0YXJnZXQudHJpZ2dlcikgdGFyZ2V0LnRyaWdnZXIoJ3BpcGUnLCBudWxsKTtcblxuICAgIHJldHVybiB0YXJnZXQ7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBoYW5kbGVyIG9iamVjdCBmcm9tIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICogICBVbmRvZXMgd29yayBvZiBcInBpcGVcIi5cbiAqXG4gKiBAbWV0aG9kIHVucGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgdGFyZ2V0IGhhbmRsZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHByb3ZpZGVkIHRhcmdldFxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnVucGlwZSA9IGZ1bmN0aW9uIHVucGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnVuc3Vic2NyaWJlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiB0YXJnZXQudW5zdWJzY3JpYmUodGhpcyk7XG5cbiAgICB2YXIgZG93bnN0cmVhbUN0eCA9ICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgPyB0aGlzLmRvd25zdHJlYW1GbiA6IHRoaXMuZG93bnN0cmVhbTtcbiAgICB2YXIgaW5kZXggPSBkb3duc3RyZWFtQ3R4LmluZGV4T2YodGFyZ2V0KTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICBkb3duc3RyZWFtQ3R4LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgdGFyZ2V0KCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgZWxzZSBpZiAodGFyZ2V0LnRyaWdnZXIpIHRhcmdldC50cmlnZ2VyKCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEJpbmQgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBhbiBldmVudCB0eXBlIGhhbmRsZWQgYnkgdGhpcyBvYmplY3QuXG4gKlxuICogQG1ldGhvZCBcIm9uXCJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbih0eXBlLCBoYW5kbGVyKSB7XG4gICAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykpIHtcbiAgICAgICAgdmFyIHVwc3RyZWFtTGlzdGVuZXIgPSB0aGlzLnRyaWdnZXIuYmluZCh0aGlzLCB0eXBlKTtcbiAgICAgICAgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSA9IHVwc3RyZWFtTGlzdGVuZXI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy51cHN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy51cHN0cmVhbVtpXS5vbih0eXBlLCB1cHN0cmVhbUxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIFwib25cIlxuICogQG1ldGhvZCBhZGRMaXN0ZW5lclxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5vbjtcblxuLyoqXG4gKiBMaXN0ZW4gZm9yIGV2ZW50cyBmcm9tIGFuIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXIuXG4gKlxuICogQG1ldGhvZCBzdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gc3Vic2NyaWJlKHNvdXJjZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMudXBzdHJlYW0uaW5kZXhPZihzb3VyY2UpO1xuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgdGhpcy51cHN0cmVhbS5wdXNoKHNvdXJjZSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLm9uKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdG9wIGxpc3RlbmluZyB0byBldmVudHMgZnJvbSBhbiB1cHN0cmVhbSBldmVudCBoYW5kbGVyLlxuICpcbiAqIEBtZXRob2QgdW5zdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiB1bnN1YnNjcmliZShzb3VyY2UpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnVwc3RyZWFtLmluZGV4T2Yoc291cmNlKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICB0aGlzLnVwc3RyZWFtLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEhhbmRsZXI7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogYWRuYW5AZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbiAndXNlIHN0cmljdCc7XG5cbnZhciBUUkFOU0ZPUk0gPSAndHJhbnNmb3JtJztcbnZhciBTSVpFID0gJ3NpemUnO1xudmFyIE9QQUNJVFkgPSAnb3BhY2l0eSc7XG52YXIgTUFURVJJQUxTID0gJ21hdGVyaWFscyc7XG5cbnZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpO1xudmFyIEluZGV4ZXIgPSByZXF1aXJlKCcuL2luZGV4ZXInKTtcbnZhciBFbnRpdHlSZWdpc3RyeSA9IHJlcXVpcmUoJy4uL2NvcmUvRW50aXR5UmVnaXN0cnknKTtcbnZhciBUYXJnZXQgPSByZXF1aXJlKCcuLi9jb3JlL2NvbXBvbmVudHMvVGFyZ2V0Jyk7XG5cbi8qKlxuICogR2VvbWV0cnkgaXMgYSBjb21wb25lbnQgdGhhdCBkZWZpbmVzIHRoZSBkYXRhIHRoYXQgc2hvdWxkXG4gKiAgIGJlIGRyYXduIHRvIHRoZSB3ZWJHTCBjYW52YXMuIE1hbmFnZXMgdmVydGV4IGRhdGEgYW5kIGF0dHJpYnV0ZXMuXG4gKlxuICogQGNsYXNzIEdlb21ldHJ5XG4gKiBAY29tcG9uZW50XG4gKiBAY29uc3RydWN0b3JcbiAqIFxuICogQHBhcmFtIHtFbnRpdHl9IGVudGl0eSBFbnRpdHkgdGhhdCB0aGUgR2VvbWV0cnkgaXMgYSBjb21wb25lbnQgb2ZcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIGluc3RhbnRpYXRpb24gb3B0aW9uc1xuICovXG5cbmZ1bmN0aW9uIEdlb21ldHJ5KGVudGl0eSwgb3B0aW9ucykge1xuICAgIFRhcmdldC5jYWxsKHRoaXMsIGVudGl0eSwge1xuICAgICAgICB2ZXJ0aWNpZXM6IFtuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwLCAxXSksXG4gICAgICAgICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDFdKSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMV0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwLCAxXSldXG4gICAgfSk7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIEVudGl0eVJlZ2lzdHJ5LnJlZ2lzdGVyKGVudGl0eSwgJ0dlb21ldHJpZXMnKTtcbiAgICBFbnRpdHlSZWdpc3RyeS5yZWdpc3RlcihlbnRpdHksICdSZW5kZXJhYmxlcycpO1xuICAgIFxuICAgIHRoaXMuZW50aXR5ID0gZW50aXR5O1xuICAgIHRoaXMuY2h1bmtzID0ge307XG4gICAgdGhpcy52ZXJ0ZXhCdWZmZXJzID0ge307XG4gICAgdGhpcy5pbmRleEJ1ZmZlcnMgPSB7fTtcbiAgICB0aGlzLmFkZFZlcnRleEJ1ZmZlcigndmVydGljZXMnLCAnYV9wb3MnKTtcbiAgICB0aGlzLmFkZFZlcnRleEJ1ZmZlcignY29vcmRzJywgJ2FfdGV4Q29vcmQnKTtcbiAgICB0aGlzLmFkZFZlcnRleEJ1ZmZlcignbm9ybWFscycsICdhX25vcm1hbCcpO1xuICAgIGlmIChvcHRpb25zLmNvbG9ycykgdGhpcy5hZGRWZXJ0ZXhCdWZmZXIoJ2NvbG9ycycsICdhX2NvbG9yJyk7XG4gICAgaWYgKCEoJ3RyaWFuZ2xlcycgaW4gb3B0aW9ucykgfHwgb3B0aW9ucy50cmlhbmdsZXMpIHRoaXMuYWRkSW5kZXhCdWZmZXIoJ3RyaWFuZ2xlcycpO1xuICAgIGlmIChvcHRpb25zLmxpbmVzKSB0aGlzLmFkZEluZGV4QnVmZmVyKCdsaW5lcycpO1xuICAgIHRoaXMuc3BlYyA9IHtcbiAgICAgICAgcHJpbWl0aXZlOiAndHJpYW5nbGVzJyxcbiAgICAgICAgcmVzb2x1dGlvbjogW2lubmVyV2lkdGggLyAyLCBpbm5lckhlaWdodCAvIDJdLFxuICAgICAgICBtb3VzZTogWzAsMF0sXG4gICAgICAgIGJyaWdodG5lc3M6IDEsIFxuICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICBvcmlnaW46IFsuNSwgLjVdLFxuICAgICAgICBnZW9tZXRyeToge1xuICAgICAgICAgICAgdmVydGV4QnVmZmVyczogdGhpcy52ZXJ0ZXhCdWZmZXJzLFxuICAgICAgICAgICAgaW5kZXhCdWZmZXJzOiB0aGlzLmluZGV4QnVmZmVyc1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuR2VvbWV0cnkudG9TdHJpbmcgPSAgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAnZ2VvbWV0cnknO1xufTtcblxuXG5HZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFRhcmdldC5wcm90b3R5cGUpO1xuR2VvbWV0cnkucHJvdG90eXBlLmFkZFZlcnRleEJ1ZmZlciA9IGZ1bmN0aW9uIGFkZFZlcnRleEJ1ZmZlcihuYW1lLCBhdHRyaWJ1dGUpIHtcbiAgICB2YXIgYnVmZmVyID0gdGhpcy52ZXJ0ZXhCdWZmZXJzW2F0dHJpYnV0ZV0gPSBuZXcgQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgRmxvYXQzMkFycmF5KTtcbiAgICBidWZmZXIubmFtZSA9IG5hbWU7XG4gICAgdGhpc1tuYW1lXSA9IFtdO1xufTtcblxuR2VvbWV0cnkucHJvdG90eXBlLmFkZEluZGV4QnVmZmVyID0gZnVuY3Rpb24gYWRkSW5kZXhCdWZmZXIobmFtZSkge1xuICAgIHZhciBidWZmZXIgPSB0aGlzLmluZGV4QnVmZmVyc1tuYW1lXSA9IG5ldyBCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIFVpbnQxNkFycmF5KTtcbiAgICB0aGlzW25hbWVdID0gW107XG59O1xuXG5HZW9tZXRyeS5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uIGNvbXBpbGUoKSB7XG4gICAgZm9yICh2YXIgYXR0cmlidXRlIGluIHRoaXMudmVydGV4QnVmZmVycykge1xuICAgICAgICB2YXIgYnVmZmVyID0gdGhpcy52ZXJ0ZXhCdWZmZXJzW2F0dHJpYnV0ZV07XG4gICAgICAgIGJ1ZmZlci5kYXRhID0gdGhpc1tidWZmZXIubmFtZV07XG4gICAgICAgIGJ1ZmZlci5jb21waWxlKCk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzLmluZGV4QnVmZmVycykge1xuICAgICAgICB2YXIgYnVmZmVyID0gdGhpcy5pbmRleEJ1ZmZlcnNbbmFtZV07XG4gICAgICAgIGJ1ZmZlci5kYXRhID0gdGhpc1tuYW1lXTtcbiAgICAgICAgYnVmZmVyLmNvbXBpbGUoKTtcbiAgICB9XG59O1xuXG5HZW9tZXRyeS5wcm90b3R5cGUuYWRkTm9ybWFscyA9IGZ1bmN0aW9uIGFkZE5vcm1hbHMoKSB7XG4gICAgaWYgKCF0aGlzLm5vcm1hbHMpIHRoaXMuYWRkVmVydGV4QnVmZmVyKCdub3JtYWxzJywgJ2dsX05vcm1hbCcpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLm5vcm1hbHNbaV0gPSBuZXcgVmVjdG9yKCk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50cmlhbmdsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHQgPSB0aGlzLnRyaWFuZ2xlc1tpXTtcbiAgICAgICAgdmFyIGEgPSBWZWN0b3IuZnJvbUFycmF5KHRoaXMudmVydGljZXNbdFswXV0pO1xuICAgICAgICB2YXIgYiA9IFZlY3Rvci5mcm9tQXJyYXkodGhpcy52ZXJ0aWNlc1t0WzFdXSk7XG4gICAgICAgIHZhciBjID0gVmVjdG9yLmZyb21BcnJheSh0aGlzLnZlcnRpY2VzW3RbMl1dKTtcbiAgICAgICAgdmFyIG5vcm1hbCA9IGIuc3ViKGEpLmNyb3NzKGMuc3ViKGEpKS5ub3JtYWxpemUoKTtcbiAgICAgICAgdGhpcy5ub3JtYWxzW3RbMF1dID0gdGhpcy5ub3JtYWxzW3RbMF1dLmFkZChub3JtYWwpO1xuICAgICAgICB0aGlzLm5vcm1hbHNbdFsxXV0gPSB0aGlzLm5vcm1hbHNbdFsxXV0uYWRkKG5vcm1hbCk7XG4gICAgICAgIHRoaXMubm9ybWFsc1t0WzJdXSA9IHRoaXMubm9ybWFsc1t0WzJdXS5hZGQobm9ybWFsKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMubm9ybWFsc1tpXSA9IHRoaXMubm9ybWFsc1tpXS5ub3JtYWxpemUoKS50b0FycmF5KCk7XG4gICAgfVxuICAgIHRoaXMuY29tcGlsZSgpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gR2VvbWV0cnk7XG5cbkdlb21ldHJ5LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRyYW5zZm9ybSA9IHRoaXMuZW50aXR5LmdldENvbXBvbmVudChUUkFOU0ZPUk0pO1xuICAgIHZhciBvcGFjaXR5ID0gdGhpcy5lbnRpdHkuZ2V0Q29tcG9uZW50KE9QQUNJVFkpO1xuICAgIHZhciBzdXJmYWNlID0gdGhpcy5lbnRpdHkuZ2V0Q29tcG9uZW50KCdzdXJmYWNlJyk7XG5cbiAgICB0aGlzLnNwZWMudHJhbnNmb3JtID0gdHJhbnNmb3JtLmdldEdsb2JhbE1hdHJpeCgpO1xuICAgIHRoaXMuc3BlYy5vcGFjaXR5ID0gb3BhY2l0eSA/IG9wYWNpdHkuX2dsb2JhbE9wYWNpdHkgOiAxOyBcbiAgICBcbiAgICBpZiAoc3VyZmFjZSkgdGhpcy5zcGVjLm9yaWdpbiA9IHN1cmZhY2Uuc3BlYy5vcmlnaW47XG5cbiAgICByZXR1cm4gdGhpcy5zcGVjO1xufTtcblxuR2VvbWV0cnkucHJvdG90eXBlLmxvYWRGcm9tT2JqID0gZnVuY3Rpb24gbG9hZEZyb21PYmoodXJsLCBvcHRpb25zKSB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxvYWRPYmouY2FsbCh0aGlzLCB4aHIucmVzcG9uc2VUZXh0LCBvcHRpb25zLnNjYWxlIHx8IC4wMDUsIG9wdGlvbnMub2Zmc2V0IHx8IFswLCAwLCAwXSk7XG4gICAgICAgIHRoaXMuY29tcGlsZSgpO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICB4aHIuc2VuZChudWxsKTtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gbG9hZE9iaihvYmosIHNjYWxlLCBvZmZzZXQpIHsgXG4gICAgICAgIHZhciB2dHMgPSBbXTsgXG4gICAgICAgIHZhciBubWwgPSBbXTsgXG4gICAgICAgIHZhciBpbmR2ID0gW107ICAgICAgICAgXG4gICAgICAgIHZhciBpbmR0ID0gW107IFxuICAgICAgICB2YXIgaW5kbiA9IFtdOyBcbiAgICAgICAgdmFyIHR4YyA9IFtdOyAgICAgXG4gICAgICAgIHZhciBsaW5lcyA9IG9iai5zcGxpdCgnXFxuJyk7ICAgICBcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldOyBcbiAgICAgICAgICAgIGlmIChsaW5lLmluZGV4T2YoJ3YgJykgIT09IC0xKSB7IFxuICAgICAgICAgICAgICAgIHZhciB2ZXJ0ZXggPSBsaW5lLnNwbGl0KCcgJyk7IFxuICAgICAgICAgICAgICAgIHZhciB2eCA9IHBhcnNlRmxvYXQodmVydGV4WzFdKSAqIHNjYWxlICsgb2Zmc2V0WzBdOyBcbiAgICAgICAgICAgICAgICB2YXIgdnkgPSBwYXJzZUZsb2F0KHZlcnRleFsyXSkgKiBzY2FsZSArIG9mZnNldFsxXTsgXG4gICAgICAgICAgICAgICAgdmFyIHZ6ID0gcGFyc2VGbG9hdCh2ZXJ0ZXhbM10pICogc2NhbGUgKyBvZmZzZXRbMl07IFxuICAgICAgICAgICAgICAgIHZ0cy5wdXNoKFt2eCwgdnksIHZ6XSk7ICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gICBcbiAgICAgICAgICAgIGVsc2UgaWYgKGxpbmUuaW5kZXhPZigndnQgJykgIT09IC0xKSB7ICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciB0ZXhjb29yZCA9IGxpbmUuc3BsaXQoJyAnKTsgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHR4ID0gcGFyc2VGbG9hdCh0ZXhjb29yZFsxXSk7IFxuICAgICAgICAgICAgICAgIHZhciB0eSA9IHBhcnNlRmxvYXQodGV4Y29vcmRbMl0pOyBcbiAgICAgICAgICAgICAgICB0eGMucHVzaChbdHgsIHR5XSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChsaW5lLmluZGV4T2YoJ3ZuICcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBub3JtYWwgPSBsaW5lLnNwbGl0KCcgJyk7ICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgbnggPSBwYXJzZUZsb2F0KG5vcm1hbFsxXSk7IFxuICAgICAgICAgICAgICAgIHZhciBueSA9IHBhcnNlRmxvYXQobm9ybWFsWzJdKTsgXG4gICAgICAgICAgICAgICAgdmFyIG56ID0gcGFyc2VGbG9hdChub3JtYWxbM10pOyAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbm1sLnB1c2goW254LCBueSwgbnpdKTsgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGxpbmUuaW5kZXhPZignZiAnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBsaW5lLnNwbGl0KCcgJyk7ICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXhbMV0uaW5kZXhPZignLy8nKSAhPT0gLTEpIHsgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB2YXIgaTEgPSBpbmRleFsxXS5zcGxpdCgnLy8nKTsgXG4gICAgICAgICAgICAgICAgICAgIHZhciBpMiA9IGluZGV4WzJdLnNwbGl0KCcvLycpOyBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkzID0gaW5kZXhbM10uc3BsaXQoJy8vJyk7IFxuICAgICAgICAgICAgICAgICAgICBpbmR2LnB1c2gocGFyc2VGbG9hdChpMVswXSkgLTEsIHBhcnNlRmxvYXQoaTJbMF0pIC0gMSwgcGFyc2VGbG9hdChpM1swXSkgLSAxKTsgXG4gICAgICAgICAgICAgICAgICAgIGluZG4ucHVzaChwYXJzZUZsb2F0KGkxWzFdKSAtMSwgcGFyc2VGbG9hdChpMlsxXSkgLSAxLCBwYXJzZUZsb2F0KGkzWzFdKSAtIDEpOyBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaW5kZXhbMV0uaW5kZXhPZignLycpICE9PSAtMSkgeyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHZhciBpMSA9IGluZGV4WzFdLnNwbGl0KCcvJyk7IFxuICAgICAgICAgICAgICAgICAgICB2YXIgaTIgPSBpbmRleFsyXS5zcGxpdCgnLycpOyBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkzID0gaW5kZXhbM10uc3BsaXQoJy8nKTsgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGluZHYucHVzaChwYXJzZUZsb2F0KGkxWzBdKSAtIDEsIHBhcnNlRmxvYXQoaTJbMF0pIC0gMSwgcGFyc2VGbG9hdChpM1swXSkgLSAxKTsgXG4gICAgICAgICAgICAgICAgICAgIGluZHQucHVzaChwYXJzZUZsb2F0KGkxWzFdKSAtIDEsIHBhcnNlRmxvYXQoaTJbMV0pIC0gMSwgcGFyc2VGbG9hdChpM1sxXSkgLSAxKTsgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaW5kbi5wdXNoKHBhcnNlRmxvYXQoaTFbMl0pIC0gMSwgcGFyc2VGbG9hdChpMlsyXSkgLSAxLCBwYXJzZUZsb2F0KGkzWzJdKSAtIDEpOyBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpbmR2LnB1c2gocGFyc2VGbG9hdChpbmRleFsxXSkgLSAxLCBwYXJzZUZsb2F0KGluZGV4WzJdKSAtIDEsIHBhcnNlRmxvYXQoaW5kZXhbM10pIC0gMSk7IFxuICAgICAgICAgICAgICAgIH0gICAgXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuXG4gICAgbWFrZVByb3BlckFycmF5KGluZHYsIHZ0cyk7XG4gICAgdGhpcy52ZXJ0aWNlcyA9IHZ0cztcbiAgICAvL3RoaXMubm9ybWFscyA9IG1ha2VQcm9wZXJBcnJheShpbmRuLCBubWwpOyBcbiAgICAvL3RoaXMuY29vcmRzID0gbWFrZVByb3BlckFycmF5KGluZHQsIHR4Yyk7IFxuXG59OyAgICBcblxuZnVuY3Rpb24gbWFrZVByb3BlckFycmF5KGluZGljZXMsIGFycmF5KSB7ICAgICAgICAgICAgXG4gICAgdmFyIG91dHB1dCA9IFtdOyBcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgaW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdGVtcCA9IGFycmF5W2luZGljZXNbaV1dOyBcbiAgICAgICAgZm9yKHZhciBqID0gMDsgaiA8IHRlbXAubGVuZ3RoOyBqKyspXG4gICAgICAgICAgICBvdXRwdXQucHVzaCh0ZW1wW2pdKTsgICAgIFxuICAgIH0gXG4gICAgcmV0dXJuIG91dHB1dDsgXG59XG5cbi8qKlxuICogQnVmZmVyIGlzIGEgcHJpdmF0ZSBvYmplY3QgdGhhdCBzdG9yZXMgcmVmZXJlbmNlcyB0byBwYXNzIGRhdGEgZnJvbVxuICogYSB0eXBlZCBhcnJheSB0byBhIFZCTy5cbiAqXG4gKiBAY2xhc3MgR2VvbWV0cnlcbiAqIEBjb21wb25lbnRcbiAqIEBjb25zdHJ1Y3RvclxuICogXG4gKiBAcGFyYW0ge1RhcmdldH0gTG9jYXRpb24gb2YgdGhlIHZlcnRleCBkYXRhIHRoYXQgaXMgYmVpbmcgdXBsb2FkZWQgdG8gZ2wuXG4gKiBAcGFyYW0ge1R5cGV9IENvbnRzdHJ1Y3RvciBmb3IgdGhlIHR5cGVkIGFycmF5IHdoaWNoIHdpbGwgc3RvcmUgZGF0YSBwYXNzZWQgZnJvbSB0aGUgYXBwbGljYXRpb24uXG4gKi9cblxuZnVuY3Rpb24gQnVmZmVyKHRhcmdldCwgdHlwZSkge1xuICAgIHRoaXMuYnVmZmVyID0gbnVsbDtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuZGF0YSA9IFtdO1xufVxuXG5CdWZmZXIucHJvdG90eXBlID0ge1xuICAgIGNvbXBpbGU6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGNodW5rID0gMTAwMDA7IGkgPCB0aGlzLmRhdGEubGVuZ3RoOyBpICs9IGNodW5rKSB7XG4gICAgICAgICAgICBkYXRhID0gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShkYXRhLCB0aGlzLmRhdGEuc2xpY2UoaSwgaSArIGNodW5rKSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNwYWNpbmcgPSB0aGlzLmRhdGEubGVuZ3RoID8gZGF0YS5sZW5ndGggLyB0aGlzLmRhdGEubGVuZ3RoIDogMDtcbiAgICAgICAgaWYgKHNwYWNpbmcgIT0gTWF0aC5yb3VuZChzcGFjaW5nKSkgdGhyb3cgJ2J1ZmZlciBlbGVtZW50cyBub3Qgb2YgY29uc2lzdGVudCBzaXplLCBhdmVyYWdlIHNpemUgaXMgJyArIHNwYWNpbmc7XG4gICAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5idWZmZXIgfHwgZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgIHRoaXMuYnVmZmVyLmxlbmd0aCA9IGRhdGEubGVuZ3RoO1xuICAgICAgICB0aGlzLmJ1ZmZlci5zcGFjaW5nID0gc3BhY2luZztcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcih0aGlzLnRhcmdldCwgdGhpcy5idWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKHRoaXMudGFyZ2V0LCBuZXcgdGhpcy50eXBlKGRhdGEpLCB0eXBlIHx8IGdsLlNUQVRJQ19EUkFXKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdlb21ldHJ5O1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGFkbmFuQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4gJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBJbmRleGVyKCkge1xuICAgIHRoaXMudW5pcXVlID0gW107XG4gICAgdGhpcy5pbmRpY2VzID0gW107XG4gICAgdGhpcy5tYXAgPSB7fTtcbn1cblxuSW5kZXhlci5wcm90b3R5cGUgPSB7XG4gICAgYWRkOiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgdmFyIGtleSA9IEpTT04uc3RyaW5naWZ5KG9iaik7XG4gICAgICAgIGlmICghIChrZXkgaW4gdGhpcy5tYXApKSB7XG4gICAgICAgICAgICB0aGlzLm1hcFtrZXldID0gdGhpcy51bmlxdWUubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy51bmlxdWUucHVzaChvYmopO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm1hcFtrZXldO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW5kZXhlcjtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBhZG5hbkBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChnbCkge1xuICAgIGZ1bmN0aW9uIHJlZ2V4TWFwKHJlZ2V4LCB0ZXh0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICB3aGlsZSAoKHJlc3VsdCA9IHJlZ2V4LmV4ZWModGV4dCkpICE9IG51bGwpIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIFNoYWRlcih2ZXJ0ZXhTb3VyY2UsIGZyYWdtZW50U291cmNlKSB7XG4gICAgICAgIHRoaXMudnMgPSB2ZXJ0ZXhTb3VyY2U7XG4gICAgICAgIHRoaXMuZnMgPSBmcmFnbWVudFNvdXJjZTtcblxuICAgICAgICB2YXIgaGVhZGVyID0gWydwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDsnLFxuICAgICAgICAgICAgICAgICAgICAgICd1bmlmb3JtIG1hdDQgdHJhbnNmb3JtOycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3VuaWZvcm0gbWF0NCBwZXJzcGVjdGl2ZTsnLFxuICAgICAgICAgICAgICAgICAgICAgICd1bmlmb3JtIGZsb2F0IGZvY2FsRGVwdGg7JyxcbiAgICAgICAgICAgICAgICAgICAgICAndW5pZm9ybSB2ZWMzIHNpemU7JyxcbiAgICAgICAgICAgICAgICAgICAgICAndW5pZm9ybSB2ZWMzIHJlc29sdXRpb247JyxcbiAgICAgICAgICAgICAgICAgICAgICAndW5pZm9ybSB2ZWMyIG9yaWdpbjsnLFxuICAgICAgICAgICAgICAgICAgICAgICd1bmlmb3JtIHNhbXBsZXIyRCB0ZXh0dXJlOycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3VuaWZvcm0gZmxvYXQgYnJpZ2h0bmVzczsnLFxuICAgICAgICAgICAgICAgICAgICAgICd1bmlmb3JtIGZsb2F0IG9wYWNpdHk7JyxcbiAgICAgICAgICAgICAgICAgICAgICAndW5pZm9ybSBmbG9hdCBjbG9jazsnLFxuICAgICAgICAgICAgICAgICAgICAgICd1bmlmb3JtIHZlYzIgbW91c2U7JyxcbiAgICAgICAgICAgICAgICAgICAgICAndmFyeWluZyB2ZWMzIHZfbm9ybWFsOydcbiAgICAgICAgICAgICAgICAgICAgIF0uam9pbignXFxuJyk7XG4gICAgICAgIFxuICAgICAgICB2YXIgdmVydGV4SGVhZGVyID0gaGVhZGVyICsgW1xuICAgICAgICAgICAgJ2F0dHJpYnV0ZSB2ZWM0IGFfcG9zOycsXG4gICAgICAgICAgICAnYXR0cmlidXRlIHZlYzQgYV91djsnLFxuICAgICAgICAgICAgJ2F0dHJpYnV0ZSB2ZWMzIGFfbm9ybWFsOycsXG4gICAgICAgICAgICAnYXR0cmlidXRlIHZlYzQgYV9jb2xvcjsnXG4gICAgICAgIF0uam9pbignXFxuJyk7XG5cbiAgICAgICAgdmFyIGZyYWdtZW50SGVhZGVyID0gaGVhZGVyICsgJyc7XG4gICAgICAgIHZlcnRleFNvdXJjZSA9IHZlcnRleEhlYWRlciAgKyB2ZXJ0ZXhTb3VyY2U7XG4gICAgICAgIGZyYWdtZW50U291cmNlID0gZnJhZ21lbnRIZWFkZXIgKyBmcmFnbWVudFNvdXJjZTtcblxuICAgICAgICBmdW5jdGlvbiBjb21waWxlU291cmNlKHR5cGUsIHNvdXJjZSkge1xuICAgICAgICAgICAgdmFyIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcih0eXBlKTtcbiAgICAgICAgICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XG4gICAgICAgICAgICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcik7XG4gICAgICAgICAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICAgICAgICAgIHZhciBpID0gIDE7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coc291cmNlLnJlcGxhY2UoL1xcbi9nLCBmdW5jdGlvbiAoKSB7IHJldHVybiAnXFxuJyArIChpKyspICsgJzogJzsgfSkpO1xuICAgICAgICAgICAgICAgIHRocm93ICdjb21waWxlIGVycm9yOiAnICsgZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNoYWRlcjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5wcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgICAgICBnbC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCBjb21waWxlU291cmNlKGdsLlZFUlRFWF9TSEFERVIsIHZlcnRleFNvdXJjZSkpO1xuICAgICAgICBnbC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCBjb21waWxlU291cmNlKGdsLkZSQUdNRU5UX1NIQURFUiwgZnJhZ21lbnRTb3VyY2UpKTtcbiAgICAgICAgZ2wubGlua1Byb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgICAgICAgaWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMucHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpKSB7XG4gICAgICAgICAgICB0aHJvdyAnbGluayBlcnJvcjogJyArIGdsLmdldFByb2dyYW1JbmZvTG9nKHRoaXMucHJvZ3JhbSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgICAgIHRoaXMudW5pZm9ybUxvY2F0aW9ucyA9IHt9O1xuXG4gICAgICAgIHZhciBpc1NhbXBsZXIgPSB0aGlzLmlzU2FtcGxlciA9IHt9O1xuXG4gICAgICAgIHJlZ2V4TWFwKC91bmlmb3JtXFxzK3NhbXBsZXIoMUR8MkR8M0R8Q3ViZSlcXHMrKFxcdyspXFxzKjsvZywgdmVydGV4U291cmNlICsgZnJhZ21lbnRTb3VyY2UsXG4gICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGdyb3VwcykgeyBpc1NhbXBsZXJbZ3JvdXBzWzJdXSA9IDE7IH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc051bWJlcihuKSB7XG4gICAgICAgIHJldHVybiAhIGlzTmFOKHBhcnNlRmxvYXQobikpICYmIGlzRmluaXRlKG4pO1xuICAgIH1cblxuICAgIFNoYWRlci5wcm90b3R5cGUgPSB7XG4gICAgICAgIHVuaWZvcm1zOiBmdW5jdGlvbih1bmlmb3Jtcykge1xuICAgICAgICAgICAgZ2wudXNlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBuYW1lIGluIHVuaWZvcm1zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gdGhpcy51bmlmb3JtTG9jYXRpb25zW25hbWVdIHx8IGdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnByb2dyYW0sIG5hbWUpO1xuICAgICAgICAgICAgICAgIGlmICghbG9jYXRpb24pIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHRoaXMudW5pZm9ybUxvY2F0aW9uc1tuYW1lXSA9IGxvY2F0aW9uO1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHVuaWZvcm1zW25hbWVdO1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSB8fCB2YWx1ZSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHZhbHVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6IGdsLnVuaWZvcm0xZnYobG9jYXRpb24sIG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMjogZ2wudW5pZm9ybTJmdihsb2NhdGlvbiwgbmV3IEZsb2F0MzJBcnJheSh2YWx1ZSkpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOiBnbC51bmlmb3JtM2Z2KGxvY2F0aW9uLCBuZXcgRmxvYXQzMkFycmF5KHZhbHVlKSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDQ6IGdsLnVuaWZvcm00ZnYobG9jYXRpb24sIG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgOTogZ2wudW5pZm9ybU1hdHJpeDNmdihsb2NhdGlvbiwgZmFsc2UsIG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTY6IGdsLnVuaWZvcm1NYXRyaXg0ZnYobG9jYXRpb24sIGZhbHNlLCBuZXcgRmxvYXQzMkFycmF5KHZhbHVlKSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyAnZG9udCBrbm93IGhvdyB0byBsb2FkIHVuaWZvcm0gXCInICsgbmFtZSArICdcIiBvZiBsZW5ndGggJyArIHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNOdW1iZXIodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICh0aGlzLmlzU2FtcGxlcltuYW1lXSA/IGdsLnVuaWZvcm0xaSA6IGdsLnVuaWZvcm0xZikuY2FsbChnbCwgbG9jYXRpb24sIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnYXR0ZW1wdGVkIHRvIHNldCB1bmlmb3JtIFwiJyArIG5hbWUgKyAnXCIgdG8gaW52YWxpZCB2YWx1ZSAnICsgdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBkcmF3OiBmdW5jdGlvbihtZXNoLCBtb2RlKSB7XG4gICAgICAgICAgICB0aGlzLmRyYXdCdWZmZXJzKG1lc2gudmVydGV4QnVmZmVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzaC5pbmRleEJ1ZmZlcnNbbW9kZSA9PSBnbC5MSU5FUyA/ICdsaW5lcycgOiAndHJpYW5nbGVzJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50cy5sZW5ndGggPCAyID8gZ2wuVFJJQU5HTEVTIDogbW9kZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZHJhd0J1ZmZlcnM6IGZ1bmN0aW9uKHZlcnRleEJ1ZmZlcnMsIGluZGV4QnVmZmVyLCBtb2RlKSB7XG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGF0dHJpYnV0ZSBpbiB2ZXJ0ZXhCdWZmZXJzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IHZlcnRleEJ1ZmZlcnNbYXR0cmlidXRlXTtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb24gPSB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5wcm9ncmFtLCBhdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICAgIGlmIChsb2NhdGlvbiA9PSAtMSB8fCAhYnVmZmVyLmJ1ZmZlcikgY29udGludWU7XG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyLmJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgICAgICAgICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIobG9jYXRpb24sIGJ1ZmZlci5idWZmZXIuc3BhY2luZywgZ2wuRkxPQVQsIGdsLkZBTFNFLCAwLCAwKTtcbiAgICAgICAgICAgICAgICBsZW5ndGggPSBidWZmZXIuYnVmZmVyLmxlbmd0aCAvIGJ1ZmZlci5idWZmZXIuc3BhY2luZztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgYXR0cmlidXRlIGluIHRoaXMuYXR0cmlidXRlcykge1xuICAgICAgICAgICAgICAgIGlmICghKGF0dHJpYnV0ZSBpbiB2ZXJ0ZXhCdWZmZXJzKSlcbiAgICAgICAgICAgICAgICAgICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGxlbmd0aCAmJiAoIWluZGV4QnVmZmVyIHx8IGluZGV4QnVmZmVyLmJ1ZmZlcikpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXhCdWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaW5kZXhCdWZmZXIuYnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgZ2wuZHJhd0VsZW1lbnRzKG1vZGUsIGluZGV4QnVmZmVyLmJ1ZmZlci5sZW5ndGgsIGdsLlVOU0lHTkVEX1NIT1JULCAwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBnbC5kcmF3QXJyYXlzKG1vZGUsIDAsIGxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIFNoYWRlcjtcbn07XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyOiBkYXZpZEBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFRocmVlLWVsZW1lbnQgZmxvYXRpbmcgcG9pbnQgdmVjdG9yLlxuICpcbiAqIEBjbGFzcyBWZWN0b3JcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB4IHggZWxlbWVudCB2YWx1ZVxuICogQHBhcmFtIHtudW1iZXJ9IHkgeSBlbGVtZW50IHZhbHVlXG4gKiBAcGFyYW0ge251bWJlcn0geiB6IGVsZW1lbnQgdmFsdWVcbiAqL1xuXG5mdW5jdGlvbiBWZWN0b3IoeCx5LHopIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkgdGhpcy5zZXQoeCk7XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMueCA9IHggfHwgMDtcbiAgICAgICAgdGhpcy55ID0geSB8fCAwO1xuICAgICAgICB0aGlzLnogPSB6IHx8IDA7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufVxudmFyIF9yZWdpc3RlciA9IG5ldyBWZWN0b3IoMCwwLDApO1xuXG4vKipcbiAqIEFkZCB0aGlzIGVsZW1lbnQtd2lzZSB0byBhbm90aGVyIFZlY3RvciwgZWxlbWVudC13aXNlLlxuICogICBOb3RlOiBUaGlzIHNldHMgdGhlIGludGVybmFsIHJlc3VsdCByZWdpc3Rlciwgc28gb3RoZXIgcmVmZXJlbmNlcyB0byB0aGF0IHZlY3RvciB3aWxsIGNoYW5nZS5cbiAqXG4gKiBAbWV0aG9kIGFkZFxuICogQHBhcmFtIHtWZWN0b3J9IHYgYWRkZW5kXG4gKiBAcmV0dXJuIHtWZWN0b3J9IHZlY3RvciBzdW1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBhZGQodikge1xuICAgIHJldHVybiBfc2V0WFlaLmNhbGwoX3JlZ2lzdGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy54ICsgdi54LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy55ICsgdi55LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy56ICsgdi56XG4gICAgICAgICAgICAgICAgICAgICAgICk7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0IGFub3RoZXIgdmVjdG9yIGZyb20gdGhpcyB2ZWN0b3IsIGVsZW1lbnQtd2lzZS5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZCBzdWJcbiAqIEBwYXJhbSB7VmVjdG9yfSB2IHN1YnRyYWhlbmRcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gdmVjdG9yIGRpZmZlcmVuY2VcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbiBzdWIodikge1xuICAgIHJldHVybiBfc2V0WFlaLmNhbGwoX3JlZ2lzdGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy54IC0gdi54LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy55IC0gdi55LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy56IC0gdi56XG4gICAgICAgICAgICAgICAgICAgICAgICk7XG59O1xuXG4vKipcbiAqIFNjYWxlIFZlY3RvciBieSBmbG9hdGluZyBwb2ludCByLlxuICogICBOb3RlOiBUaGlzIHNldHMgdGhlIGludGVybmFsIHJlc3VsdCByZWdpc3Rlciwgc28gb3RoZXIgcmVmZXJlbmNlcyB0byB0aGF0IHZlY3RvciB3aWxsIGNoYW5nZS5cbiAqXG4gKiBAbWV0aG9kIG11bHRcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gciBzY2FsYXJcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gdmVjdG9yIHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLm11bHQgPSBmdW5jdGlvbiBtdWx0KHIpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKF9yZWdpc3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgKiB0aGlzLngsXG4gICAgICAgICAgICAgICAgICAgICAgICByICogdGhpcy55LFxuICAgICAgICAgICAgICAgICAgICAgICAgciAqIHRoaXMuelxuICAgICAgICAgICAgICAgICAgICAgICApO1xufTtcblxuLyoqXG4gKiBTY2FsZSBWZWN0b3IgYnkgZmxvYXRpbmcgcG9pbnQgMS9yLlxuICogICBOb3RlOiBUaGlzIHNldHMgdGhlIGludGVybmFsIHJlc3VsdCByZWdpc3Rlciwgc28gb3RoZXIgcmVmZXJlbmNlcyB0byB0aGF0IHZlY3RvciB3aWxsIGNoYW5nZS5cbiAqXG4gKiBAbWV0aG9kIGRpdlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSByIHNjYWxhclxuICogQHJldHVybiB7VmVjdG9yfSB2ZWN0b3IgcmVzdWx0XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuZGl2ID0gZnVuY3Rpb24gZGl2KHIpIHtcbiAgICByZXR1cm4gdGhpcy5tdWx0KDEgLyByKTtcbn07XG5cbi8qKlxuICogR2l2ZW4gYW5vdGhlciB2ZWN0b3IgdiwgcmV0dXJuIGNyb3NzIHByb2R1Y3QgKHYpeCh0aGlzKS5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZCBjcm9zc1xuICogQHBhcmFtIHtWZWN0b3J9IHYgTGVmdCBIYW5kIFZlY3RvclxuICogQHJldHVybiB7VmVjdG9yfSB2ZWN0b3IgcmVzdWx0XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuY3Jvc3MgPSBmdW5jdGlvbiBjcm9zcyh2KSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG4gICAgdmFyIHZ4ID0gdi54O1xuICAgIHZhciB2eSA9IHYueTtcbiAgICB2YXIgdnogPSB2Lno7XG5cbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKF9yZWdpc3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHogKiB2eSAtIHkgKiB2eixcbiAgICAgICAgICAgICAgICAgICAgICAgIHggKiB2eiAtIHogKiB2eCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgKiB2eCAtIHggKiB2eVxuICAgICAgICAgICAgICAgICAgICAgICApO1xufTtcblxuLyoqXG4gKiBDb21wb25lbnQtd2lzZSBlcXVhbGl0eSB0ZXN0IGJldHdlZW4gdGhpcyBhbmQgVmVjdG9yIHYuXG4gKiBAbWV0aG9kIGVxdWFsc1xuICogQHBhcmFtIHtWZWN0b3J9IHYgdmVjdG9yIHRvIGNvbXBhcmVcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzKHYpIHtcbiAgICByZXR1cm4gKHYueCA9PT0gdGhpcy54ICYmIHYueSA9PT0gdGhpcy55ICYmIHYueiA9PT0gdGhpcy56KTtcbn07XG5cbi8qKlxuICogUm90YXRlIGNsb2Nrd2lzZSBhcm91bmQgeC1heGlzIGJ5IHRoZXRhIHJhZGlhbnMuXG4gKiAgIE5vdGU6IFRoaXMgc2V0cyB0aGUgaW50ZXJuYWwgcmVzdWx0IHJlZ2lzdGVyLCBzbyBvdGhlciByZWZlcmVuY2VzIHRvIHRoYXQgdmVjdG9yIHdpbGwgY2hhbmdlLlxuICogQG1ldGhvZCByb3RhdGVYXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGEgcmFkaWFuc1xuICogQHJldHVybiB7VmVjdG9yfSByb3RhdGVkIHZlY3RvclxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVggPSBmdW5jdGlvbiByb3RhdGVYKHRoZXRhKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuXG4gICAgcmV0dXJuIF9zZXRYWVouY2FsbChfcmVnaXN0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICB4LFxuICAgICAgICAgICAgICAgICAgICAgICAgeSAqIGNvc1RoZXRhIC0geiAqIHNpblRoZXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgeSAqIHNpblRoZXRhICsgeiAqIGNvc1RoZXRhXG4gICAgICAgICAgICAgICAgICAgICAgICk7XG59O1xuXG4vKipcbiAqIFJvdGF0ZSBjbG9ja3dpc2UgYXJvdW5kIHktYXhpcyBieSB0aGV0YSByYWRpYW5zLlxuICogICBOb3RlOiBUaGlzIHNldHMgdGhlIGludGVybmFsIHJlc3VsdCByZWdpc3Rlciwgc28gb3RoZXIgcmVmZXJlbmNlcyB0byB0aGF0IHZlY3RvciB3aWxsIGNoYW5nZS5cbiAqIEBtZXRob2Qgcm90YXRlWVxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhIHJhZGlhbnNcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gcm90YXRlZCB2ZWN0b3JcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVZID0gZnVuY3Rpb24gcm90YXRlWSh0aGV0YSkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdmFyIGNvc1RoZXRhID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcblxuICAgIHJldHVybiBfc2V0WFlaLmNhbGwoX3JlZ2lzdGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgeiAqIHNpblRoZXRhICsgeCAqIGNvc1RoZXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgeSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHogKiBjb3NUaGV0YSAtIHggKiBzaW5UaGV0YVxuICAgICAgICAgICAgICAgICAgICAgICApO1xufTtcblxuLyoqXG4gKiBSb3RhdGUgY2xvY2t3aXNlIGFyb3VuZCB6LWF4aXMgYnkgdGhldGEgcmFkaWFucy5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKiBAbWV0aG9kIHJvdGF0ZVpcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YSByYWRpYW5zXG4gKiBAcmV0dXJuIHtWZWN0b3J9IHJvdGF0ZWQgdmVjdG9yXG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWiA9IGZ1bmN0aW9uIHJvdGF0ZVoodGhldGEpIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHZhciBjb3NUaGV0YSA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luVGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XG5cbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKF9yZWdpc3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHggKiBjb3NUaGV0YSAtIHkgKiBzaW5UaGV0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHggKiBzaW5UaGV0YSArIHkgKiBjb3NUaGV0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHpcbiAgICAgICAgICAgICAgICAgICAgICAgKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIGRvdCBwcm9kdWN0IG9mIHRoaXMgd2l0aCBhIHNlY29uZCBWZWN0b3JcbiAqIEBtZXRob2QgZG90XG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdiBzZWNvbmQgdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9IGRvdCBwcm9kdWN0XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24gZG90KHYpIHtcbiAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55ICsgdGhpcy56ICogdi56O1xufTtcblxuLyoqXG4gKiBSZXR1cm4gc3F1YXJlZCBsZW5ndGggb2YgdGhpcyB2ZWN0b3JcbiAqIEBtZXRob2Qgbm9ybVNxdWFyZWRcbiAqIEByZXR1cm4ge251bWJlcn0gc3F1YXJlZCBsZW5ndGhcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5ub3JtU3F1YXJlZCA9IGZ1bmN0aW9uIG5vcm1TcXVhcmVkKCkge1xuICAgIHJldHVybiB0aGlzLmRvdCh0aGlzKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIGxlbmd0aCBvZiB0aGlzIHZlY3RvclxuICogQG1ldGhvZCBub3JtXG4gKiBAcmV0dXJuIHtudW1iZXJ9IGxlbmd0aFxuICovXG5WZWN0b3IucHJvdG90eXBlLm5vcm0gPSBmdW5jdGlvbiBub3JtKCkge1xuICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5ub3JtU3F1YXJlZCgpKTtcbn07XG5cbi8qKlxuICogU2NhbGUgVmVjdG9yIHRvIHNwZWNpZmllZCBsZW5ndGguXG4gKiAgIElmIGxlbmd0aCBpcyBsZXNzIHRoYW4gaW50ZXJuYWwgdG9sZXJhbmNlLCBzZXQgdmVjdG9yIHRvIFtsZW5ndGgsIDAsIDBdLlxuICogICBOb3RlOiBUaGlzIHNldHMgdGhlIGludGVybmFsIHJlc3VsdCByZWdpc3Rlciwgc28gb3RoZXIgcmVmZXJlbmNlcyB0byB0aGF0IHZlY3RvciB3aWxsIGNoYW5nZS5cbiAqIEBtZXRob2Qgbm9ybWFsaXplXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aCB0YXJnZXQgbGVuZ3RoLCBkZWZhdWx0IDEuMFxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIG5vcm1hbGl6ZShsZW5ndGgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgbGVuZ3RoID0gMTtcbiAgICB2YXIgbm9ybSA9IHRoaXMubm9ybSgpO1xuXG4gICAgaWYgKG5vcm0gPiAxZS03KSByZXR1cm4gX3NldEZyb21WZWN0b3IuY2FsbChfcmVnaXN0ZXIsIHRoaXMubXVsdChsZW5ndGggLyBub3JtKSk7XG4gICAgZWxzZSByZXR1cm4gX3NldFhZWi5jYWxsKF9yZWdpc3RlciwgbGVuZ3RoLCAwLCAwKTtcbn07XG5cbi8qKlxuICogTWFrZSBhIHNlcGFyYXRlIGNvcHkgb2YgdGhlIFZlY3Rvci5cbiAqXG4gKiBAbWV0aG9kIGNsb25lXG4gKlxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUoKSB7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcyk7XG59O1xuXG4vKipcbiAqIFRydWUgaWYgYW5kIG9ubHkgaWYgZXZlcnkgdmFsdWUgaXMgMCAob3IgZmFsc3kpXG4gKlxuICogQG1ldGhvZCBpc1plcm9cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5WZWN0b3IucHJvdG90eXBlLmlzWmVybyA9IGZ1bmN0aW9uIGlzWmVybygpIHtcbiAgICByZXR1cm4gISh0aGlzLnggfHwgdGhpcy55IHx8IHRoaXMueik7XG59O1xuXG5mdW5jdGlvbiBfc2V0WFlaKHgseSx6KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMueiA9IHo7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIF9zZXRGcm9tQXJyYXkodikge1xuICAgIHJldHVybiBfc2V0WFlaLmNhbGwodGhpcyx2WzBdLHZbMV0sdlsyXSB8fCAwKTtcbn1cblxuZnVuY3Rpb24gX3NldEZyb21WZWN0b3Iodikge1xuICAgIHJldHVybiBfc2V0WFlaLmNhbGwodGhpcywgdi54LCB2LnksIHYueik7XG59XG5cbmZ1bmN0aW9uIF9zZXRGcm9tTnVtYmVyKHgpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKHRoaXMseCwwLDApO1xufVxuXG4vKipcbiAqIFNldCB0aGlzIFZlY3RvciB0byB0aGUgdmFsdWVzIGluIHRoZSBwcm92aWRlZCBBcnJheSBvciBWZWN0b3IuXG4gKlxuICogQG1ldGhvZCBzZXRcbiAqIEBwYXJhbSB7b2JqZWN0fSB2IGFycmF5LCBWZWN0b3IsIG9yIG51bWJlclxuICogQHJldHVybiB7VmVjdG9yfSB0aGlzXG4gKi9cblZlY3Rvci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0KHYpIHtcbiAgICBpZiAodiBpbnN0YW5jZW9mIEFycmF5KSAgICByZXR1cm4gX3NldEZyb21BcnJheS5jYWxsKHRoaXMsIHYpO1xuICAgIGlmICh2IGluc3RhbmNlb2YgVmVjdG9yKSAgIHJldHVybiBfc2V0RnJvbVZlY3Rvci5jYWxsKHRoaXMsIHYpO1xuICAgIGlmICh0eXBlb2YgdiA9PT0gJ251bWJlcicpIHJldHVybiBfc2V0RnJvbU51bWJlci5jYWxsKHRoaXMsIHYpO1xufTtcblxuVmVjdG9yLnByb3RvdHlwZS5zZXRYWVogPSBmdW5jdGlvbih4LHkseikge1xuICAgIHJldHVybiBfc2V0WFlaLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG5WZWN0b3IucHJvdG90eXBlLnNldDFEID0gZnVuY3Rpb24oeCkge1xuICAgIHJldHVybiBfc2V0RnJvbU51bWJlci5jYWxsKHRoaXMsIHgpO1xufTtcblxuLyoqXG4gKiBQdXQgcmVzdWx0IG9mIGxhc3QgaW50ZXJuYWwgcmVnaXN0ZXIgY2FsY3VsYXRpb24gaW4gc3BlY2lmaWVkIG91dHB1dCB2ZWN0b3IuXG4gKlxuICogQG1ldGhvZCBwdXRcbiAqIEBwYXJhbSB7VmVjdG9yfSB2IGRlc3RpbmF0aW9uIHZlY3RvclxuICogQHJldHVybiB7VmVjdG9yfSBkZXN0aW5hdGlvbiB2ZWN0b3JcbiAqL1xuXG5WZWN0b3IucHJvdG90eXBlLnB1dCA9IGZ1bmN0aW9uIHB1dCh2KSB7XG4gICAgaWYgKHRoaXMgPT09IF9yZWdpc3RlcikgX3NldEZyb21WZWN0b3IuY2FsbCh2LCBfcmVnaXN0ZXIpO1xuICAgIGVsc2UgX3NldEZyb21WZWN0b3IuY2FsbCh2LCB0aGlzKTtcbn07XG5cbi8qKlxuICogU2V0IHRoaXMgdmVjdG9yIHRvIFswLDAsMF1cbiAqXG4gKiBAbWV0aG9kIGNsZWFyXG4gKi9cblZlY3Rvci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKHRoaXMsMCwwLDApO1xufTtcblxuLyoqXG4gKiBTY2FsZSB0aGlzIFZlY3RvciBkb3duIHRvIHNwZWNpZmllZCBcImNhcFwiIGxlbmd0aC5cbiAqICAgSWYgVmVjdG9yIHNob3J0ZXIgdGhhbiBjYXAsIG9yIGNhcCBpcyBJbmZpbml0eSwgZG8gbm90aGluZy5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZCBjYXBcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gY2FwcGVkIHZlY3RvclxuICovXG5WZWN0b3IucHJvdG90eXBlLmNhcCA9IGZ1bmN0aW9uIHZlY3RvckNhcChjYXApIHtcbiAgICBpZiAoY2FwID09PSBJbmZpbml0eSkgcmV0dXJuIF9zZXRGcm9tVmVjdG9yLmNhbGwoX3JlZ2lzdGVyLCB0aGlzKTtcbiAgICB2YXIgbm9ybSA9IHRoaXMubm9ybSgpO1xuICAgIGlmIChub3JtID4gY2FwKSByZXR1cm4gX3NldEZyb21WZWN0b3IuY2FsbChfcmVnaXN0ZXIsIHRoaXMubXVsdChjYXAgLyBub3JtKSk7XG4gICAgZWxzZSByZXR1cm4gX3NldEZyb21WZWN0b3IuY2FsbChfcmVnaXN0ZXIsIHRoaXMpO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gcHJvamVjdGlvbiBvZiB0aGlzIFZlY3RvciBvbnRvIGFub3RoZXIuXG4gKiAgIE5vdGU6IFRoaXMgc2V0cyB0aGUgaW50ZXJuYWwgcmVzdWx0IHJlZ2lzdGVyLCBzbyBvdGhlciByZWZlcmVuY2VzIHRvIHRoYXQgdmVjdG9yIHdpbGwgY2hhbmdlLlxuICpcbiAqIEBtZXRob2QgcHJvamVjdFxuICogQHBhcmFtIHtWZWN0b3J9IG4gdmVjdG9yIHRvIHByb2plY3QgdXBvblxuICogQHJldHVybiB7VmVjdG9yfSBwcm9qZWN0ZWQgdmVjdG9yXG4gKi9cblZlY3Rvci5wcm90b3R5cGUucHJvamVjdCA9IGZ1bmN0aW9uIHByb2plY3Qobikge1xuICAgIHJldHVybiBuLm11bHQodGhpcy5kb3QobikpO1xufTtcblxuLyoqXG4gKiBSZWZsZWN0IHRoaXMgVmVjdG9yIGFjcm9zcyBwcm92aWRlZCB2ZWN0b3IuXG4gKiAgIE5vdGU6IFRoaXMgc2V0cyB0aGUgaW50ZXJuYWwgcmVzdWx0IHJlZ2lzdGVyLCBzbyBvdGhlciByZWZlcmVuY2VzIHRvIHRoYXQgdmVjdG9yIHdpbGwgY2hhbmdlLlxuICpcbiAqIEBtZXRob2QgcmVmbGVjdEFjcm9zc1xuICogQHBhcmFtIHtWZWN0b3J9IG4gdmVjdG9yIHRvIHJlZmxlY3QgYWNyb3NzXG4gKiBAcmV0dXJuIHtWZWN0b3J9IHJlZmxlY3RlZCB2ZWN0b3JcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yZWZsZWN0QWNyb3NzID0gZnVuY3Rpb24gcmVmbGVjdEFjcm9zcyhuKSB7XG4gICAgbi5ub3JtYWxpemUoKS5wdXQobik7XG4gICAgcmV0dXJuIF9zZXRGcm9tVmVjdG9yKF9yZWdpc3RlciwgdGhpcy5zdWIodGhpcy5wcm9qZWN0KG4pLm11bHQoMikpKTtcbn07XG5cbi8qKlxuICogQ29udmVydCBWZWN0b3IgdG8gdGhyZWUtZWxlbWVudCBhcnJheS5cbiAqXG4gKiBAbWV0aG9kIGdldFxuICogQHJldHVybiB7YXJyYXk8bnVtYmVyPn0gdGhyZWUtZWxlbWVudCBhcnJheVxuICovXG5WZWN0b3IucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCgpIHtcbiAgICByZXR1cm4gW3RoaXMueCwgdGhpcy55LCB0aGlzLnpdO1xufTtcblxuVmVjdG9yLnByb3RvdHlwZS5nZXQxRCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLng7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjtcblxuXG5WZWN0b3IucHJvdG90eXBlLnRpbWVzID0gZnVuY3Rpb24gdGltZXModikge1xuICAgIHJldHVybiBfc2V0WFlaLmNhbGwoX3JlZ2lzdGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy54ICogdi54LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy55ICogdi55LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy56ICogdi56XG4gICAgICAgICAgICAgICAgICAgICAgICk7XG59XG5cblxuVmVjdG9yLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbdGhpcy54LCB0aGlzLnksIHRoaXMuel1cbn1cblxuVmVjdG9yLmZyb21BcnJheSA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoYVswXSwgYVsxXSwgYVsyXSk7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIG11bHRpcGx5KG91dHB1dEFycmF5LCBsZWZ0LCByaWdodCkge1xuICAgIHZhciBhMDAgPSBsZWZ0WzBdLCAgYTAxID0gbGVmdFsxXSwgIGEwMiA9IGxlZnRbMl0sICBhMDMgPSBsZWZ0WzNdLFxuICAgICAgICBhMTAgPSBsZWZ0WzRdLCAgYTExID0gbGVmdFs1XSwgIGExMiA9IGxlZnRbNl0sICBhMTMgPSBsZWZ0WzddLFxuICAgICAgICBhMjAgPSBsZWZ0WzhdLCAgYTIxID0gbGVmdFs5XSwgIGEyMiA9IGxlZnRbMTBdLCBhMjMgPSBsZWZ0WzExXSxcbiAgICAgICAgYTMwID0gbGVmdFsxMl0sIGEzMSA9IGxlZnRbMTNdLCBhMzIgPSBsZWZ0WzE0XSwgYTMzID0gbGVmdFsxNV07XG4gICAgXG4gICAgdmFyIGIwID0gcmlnaHRbMF0sIGIxID0gcmlnaHRbMV0sIGIyID0gcmlnaHRbMl0sIGIzID0gcmlnaHRbM107IFxuXG4gICAgb3V0cHV0QXJyYXlbMF0gPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0cHV0QXJyYXlbMV0gPSBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzE7XG4gICAgb3V0cHV0QXJyYXlbMl0gPSBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzI7XG4gICAgb3V0cHV0QXJyYXlbM10gPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG4gICAgXG4gICAgYjAgPSByaWdodFs0XTsgYjEgPSByaWdodFs1XTsgYjIgPSByaWdodFs2XTsgYjMgPSByaWdodFs3XTtcblxuICAgIG91dHB1dEFycmF5WzRdID0gYjAqYTAwICsgYjEqYTEwICsgYjIqYTIwICsgYjMqYTMwO1xuICAgIG91dHB1dEFycmF5WzVdID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dHB1dEFycmF5WzZdID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dHB1dEFycmF5WzddID0gYjAqYTAzICsgYjEqYTEzICsgYjIqYTIzICsgYjMqYTMzO1xuICAgIFxuICAgIGIwID0gcmlnaHRbOF07IGIxID0gcmlnaHRbOV07IGIyID0gcmlnaHRbMTBdOyBiMyA9IHJpZ2h0WzExXTtcblxuICAgIG91dHB1dEFycmF5WzhdICA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXRwdXRBcnJheVs5XSAgPSBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzE7XG4gICAgb3V0cHV0QXJyYXlbMTBdID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dHB1dEFycmF5WzExXSA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcbiAgICBcbiAgICBiMCA9IHJpZ2h0WzEyXTsgYjEgPSByaWdodFsxM107IGIyID0gcmlnaHRbMTRdOyBiMyA9IHJpZ2h0WzE1XTtcblxuICAgIG91dHB1dEFycmF5WzEyXSA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXRwdXRBcnJheVsxM10gPSBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzE7XG4gICAgb3V0cHV0QXJyYXlbMTRdID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dHB1dEFycmF5WzE1XSA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcbiAgICByZXR1cm4gb3V0cHV0QXJyYXk7XG59XG5cblxuZnVuY3Rpb24gZ2V0VHJhbnNsYXRpb25Gcm9tTXVsdGlwbGljYXRpb24ob3V0cHV0QXJyYXksIGxlZnQsIHJpZ2h0KSB7XG4gICAgdmFyIGEwMCA9IGxlZnRbMF0sICBhMDEgPSBsZWZ0WzFdLFxuICAgICAgICBhMTAgPSBsZWZ0WzRdLCAgYTExID0gbGVmdFs1XSxcbiAgICAgICAgYTIwID0gbGVmdFs4XSwgIGEyMSA9IGxlZnRbOV0sXG4gICAgICAgIGEzMCA9IGxlZnRbMTJdLCBhMzEgPSBsZWZ0WzEzXTtcblxuICAgIHZhciBiMCA9IHJpZ2h0WzEyXSxcbiAgICAgICAgYjEgPSByaWdodFsxM10sXG4gICAgICAgIGIyID0gcmlnaHRbMTRdLFxuICAgICAgICBiMyA9IHJpZ2h0WzE1XTtcblxuICAgIG91dHB1dEFycmF5WzBdID0gYjAqYTAwICsgYjEqYTEwICsgYjIqYTIwICsgYjMqYTMwO1xuICAgIG91dHB1dEFycmF5WzFdID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIHJldHVybiBvdXRwdXRBcnJheTtcbn1cblxuZnVuY3Rpb24gaW52ZXJ0KG91dHB1dEFycmF5LCBtYXRyaXgpIHtcbiAgICB2YXIgYTAwID0gbWF0cml4WzBdLCAgYTAxID0gbWF0cml4WzFdLCAgYTAyID0gbWF0cml4WzJdLCAgYTAzID0gbWF0cml4WzNdLFxuICAgICAgICBhMTAgPSBtYXRyaXhbNF0sICBhMTEgPSBtYXRyaXhbNV0sICBhMTIgPSBtYXRyaXhbNl0sICBhMTMgPSBtYXRyaXhbN10sXG4gICAgICAgIGEyMCA9IG1hdHJpeFs4XSwgIGEyMSA9IG1hdHJpeFs5XSwgIGEyMiA9IG1hdHJpeFsxMF0sIGEyMyA9IG1hdHJpeFsxMV0sXG4gICAgICAgIGEzMCA9IG1hdHJpeFsxMl0sIGEzMSA9IG1hdHJpeFsxM10sIGEzMiA9IG1hdHJpeFsxNF0sIGEzMyA9IG1hdHJpeFsxNV0sXG5cbiAgICAgICAgYjAwID0gYTAwICogYTExIC0gYTAxICogYTEwLFxuICAgICAgICBiMDEgPSBhMDAgKiBhMTIgLSBhMDIgKiBhMTAsXG4gICAgICAgIGIwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMCxcbiAgICAgICAgYjAzID0gYTAxICogYTEyIC0gYTAyICogYTExLFxuICAgICAgICBiMDQgPSBhMDEgKiBhMTMgLSBhMDMgKiBhMTEsXG4gICAgICAgIGIwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMixcbiAgICAgICAgYjA2ID0gYTIwICogYTMxIC0gYTIxICogYTMwLFxuICAgICAgICBiMDcgPSBhMjAgKiBhMzIgLSBhMjIgKiBhMzAsXG4gICAgICAgIGIwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMCxcbiAgICAgICAgYjA5ID0gYTIxICogYTMyIC0gYTIyICogYTMxLFxuICAgICAgICBiMTAgPSBhMjEgKiBhMzMgLSBhMjMgKiBhMzEsXG4gICAgICAgIGIxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMixcblxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XG4gICAgICAgIGRldCA9IGIwMCAqIGIxMSAtIGIwMSAqIGIxMCArIGIwMiAqIGIwOSArIGIwMyAqIGIwOCAtIGIwNCAqIGIwNyArIGIwNSAqIGIwNjtcblxuICAgIGlmICghZGV0KSByZXR1cm4gbnVsbDtcbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRwdXRBcnJheVswXSAgPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVsxXSAgPSAoYTAyICogYjEwIC0gYTAxICogYjExIC0gYTAzICogYjA5KSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVsyXSAgPSAoYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzKSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVszXSAgPSAoYTIyICogYjA0IC0gYTIxICogYjA1IC0gYTIzICogYjAzKSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVs0XSAgPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVs1XSAgPSAoYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3KSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVs2XSAgPSAoYTMyICogYjAyIC0gYTMwICogYjA1IC0gYTMzICogYjAxKSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVs3XSAgPSAoYTIwICogYjA1IC0gYTIyICogYjAyICsgYTIzICogYjAxKSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVs4XSAgPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVs5XSAgPSAoYTAxICogYjA4IC0gYTAwICogYjEwIC0gYTAzICogYjA2KSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVsxMF0gPSAoYTMwICogYjA0IC0gYTMxICogYjAyICsgYTMzICogYjAwKSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVsxMV0gPSAoYTIxICogYjAyIC0gYTIwICogYjA0IC0gYTIzICogYjAwKSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVsxMl0gPSAoYTExICogYjA3IC0gYTEwICogYjA5IC0gYTEyICogYjA2KSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVsxM10gPSAoYTAwICogYjA5IC0gYTAxICogYjA3ICsgYTAyICogYjA2KSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVsxNF0gPSAoYTMxICogYjAxIC0gYTMwICogYjAzIC0gYTMyICogYjAwKSAqIGRldDtcbiAgICBvdXRwdXRBcnJheVsxNV0gPSAoYTIwICogYjAzIC0gYTIxICogYjAxICsgYTIyICogYjAwKSAqIGRldDtcbiAgICByZXR1cm4gb3V0cHV0QXJyYXk7XG59XG5cbmZ1bmN0aW9uIGdldFdmcm9tTXVsdGlwbGljYXRpb24obGVmdCwgcmlnaHQpIHtcbiAgICB2YXIgYTAwID0gbGVmdFswXSwgIGEwMSA9IGxlZnRbMV0sICBhMDIgPSBsZWZ0WzJdLCAgYTAzID0gbGVmdFszXSxcbiAgICAgICAgYTEwID0gbGVmdFs0XSwgIGExMSA9IGxlZnRbNV0sICBhMTIgPSBsZWZ0WzZdLCAgYTEzID0gbGVmdFs3XSxcbiAgICAgICAgYTIwID0gbGVmdFs4XSwgIGEyMSA9IGxlZnRbOV0sICBhMjIgPSBsZWZ0WzEwXSwgYTIzID0gbGVmdFsxMV0sXG4gICAgICAgIGEzMCA9IGxlZnRbMTJdLCBhMzEgPSBsZWZ0WzEzXSwgYTMyID0gbGVmdFsxNF0sIGEzMyA9IGxlZnRbMTVdO1xuXG4gICAgdmFyIGIwID0gcmlnaHRbMTJdLCBiMSA9IHJpZ2h0WzEzXSwgYjIgPSByaWdodFsxNF0sIGIzID0gcmlnaHRbMTVdO1xuXG4gICAgcmV0dXJuIGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMCArIGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMSArIGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMiArIGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcbn1cblxuZnVuY3Rpb24gYXBwbHlUb1ZlY3RvcihvdXRwdXQsIG1hdHJpeCwgdmVjdG9yKSB7XG4gICAgdmFyIGEwMCA9IG1hdHJpeFswXSwgIGEwMSA9IG1hdHJpeFsxXSwgIGEwMiA9IG1hdHJpeFsyXSwgIGEwMyA9IG1hdHJpeFszXSxcbiAgICAgICAgYTEwID0gbWF0cml4WzRdLCAgYTExID0gbWF0cml4WzVdLCAgYTEyID0gbWF0cml4WzZdLCAgYTEzID0gbWF0cml4WzddLFxuICAgICAgICBhMjAgPSBtYXRyaXhbOF0sICBhMjEgPSBtYXRyaXhbOV0sICBhMjIgPSBtYXRyaXhbMTBdLCBhMjMgPSBtYXRyaXhbMTFdLFxuICAgICAgICBhMzAgPSBtYXRyaXhbMTJdLCBhMzEgPSBtYXRyaXhbMTNdLCBhMzIgPSBtYXRyaXhbMTRdLCBhMzMgPSBtYXRyaXhbMTVdO1xuXG4gICAgdmFyIHYwID0gdmVjdG9yWzBdLCB2MSA9IHZlY3RvclsxXSwgdjIgPSB2ZWN0b3JbMl0sIHYzID0gdmVjdG9yWzNdO1xuXG4gICAgb3V0cHV0WzBdID0gYTAwICogdjAgKyBhMTAgKiB2MSArIGEyMCAqIHYyICsgYTMwICogdjM7XG4gICAgb3V0cHV0WzFdID0gYTAxICogdjAgKyBhMTEgKiB2MSArIGEyMSAqIHYyICsgYTMxICogdjM7XG4gICAgb3V0cHV0WzJdID0gYTAyICogdjAgKyBhMTIgKiB2MSArIGEyMiAqIHYyICsgYTMyICogdjM7XG4gICAgb3V0cHV0WzNdID0gYTAzICogdjAgKyBhMTMgKiB2MSArIGEyMyAqIHYyICsgYTMzICogdjM7XG5cbiAgICByZXR1cm4gb3V0cHV0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBtdWx0aXBseSAgICAgICAgICAgICAgICAgICAgICAgICA6IG11bHRpcGx5LFxuICAgIGdldFRyYW5zbGF0aW9uRnJvbU11bHRpcGxpY2F0aW9uIDogZ2V0VHJhbnNsYXRpb25Gcm9tTXVsdGlwbGljYXRpb24sXG4gICAgaW52ZXJ0ICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBpbnZlcnQsXG4gICAgSURFTlRJVFkgICAgICAgICAgICAgICAgICAgICAgICAgOiBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSksXG4gICAgZ2V0V2Zyb21NdWx0aXBsaWNhdGlvbiAgICAgICAgICAgOiBnZXRXZnJvbU11bHRpcGxpY2F0aW9uLFxuICAgIGFwcGx5VG9WZWN0b3IgICAgICAgICAgICAgICAgICAgIDogYXBwbHlUb1ZlY3RvclxufTsiLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFbnRpdHlSZWdpc3RyeSA9IHJlcXVpcmUoJy4uL2NvcmUvRW50aXR5UmVnaXN0cnknKTtcbnZhciBsaWZ0Um9vdHMgICAgICA9IEVudGl0eVJlZ2lzdHJ5LmFkZExheWVyKCdMaWZ0Jyk7XG5cbi8qKlxuICogTGlmdFN5c3RlbSBpcyByZXNwb25zaWJsZSBmb3IgdHJhdmVyc2luZyB0aGUgc2NlbmUgZ3JhcGggYW5kXG4gKiAgIHVwZGF0aW5nIHRoZSBUcmFuc2Zvcm1zLCBTaXplcywgYW5kIE9wYWNpdGllcyBvZiB0aGUgZW50aXRpZXMuXG4gKlxuICogQGNsYXNzICBMaWZ0U3lzdGVtXG4gKiBAc3lzdGVtXG4gKiBAc2luZ2xldG9uXG4gKi9cbnZhciBMaWZ0U3lzdGVtID0ge307XG5cbi8qKlxuICogdXBkYXRlIGl0ZXJhdGVzIG92ZXIgZWFjaCBvZiB0aGUgQ29udGV4dHMgdGhhdCB3ZXJlIHJlZ2lzdGVyZWQgYW5kXG4gKiAgIGtpY2tzIG9mIHRoZSByZWN1cnNpdmUgdXBkYXRpbmcgb2YgdGhlaXIgZW50aXRpZXMuXG4gKlxuICogQG1ldGhvZCB1cGRhdGVcbiAqL1xudmFyIHRlc3QgPSBbXTtcbkxpZnRTeXN0ZW0udXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgIHZhciByb290UGFyYW1zO1xuICAgIHZhciBjbGVhbnVwID0gW107XG4gICAgdmFyIGxpZnQ7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpZnRSb290cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsaWZ0ID0gbGlmdFJvb3RzW2ldLmdldENvbXBvbmVudCgnTGlmdENvbXBvbmVudCcpO1xuICAgICAgICByb290UGFyYW1zID0gbGlmdC5fdXBkYXRlKCk7XG4gICAgICAgIHJvb3RQYXJhbXMudW5zaGlmdChsaWZ0Um9vdHNbaV0pO1xuICAgICAgICBjb3JlVXBkYXRlQW5kRmVlZC5hcHBseShudWxsLCByb290UGFyYW1zKTtcblxuICAgICAgICBpZiAobGlmdC5kb25lKSB7XG4gICAgICAgICAgICBsaWZ0Um9vdHNbaV0ucmVtb3ZlQ29tcG9uZW50KCdMaWZ0Q29tcG9uZW50Jyk7XG4gICAgICAgICAgICBFbnRpdHlSZWdpc3RyeS5kZXJlZ2lzdGVyKGxpZnRSb290c1tpXSwgJ0xpZnQnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBjb3JlVXBkYXRlQW5kRmVlZCBmZWVkcyBwYXJlbnQgaW5mb3JtYXRpb24gdG8gYW4gZW50aXR5IGFuZCBzbyB0aGF0XG4gKiAgIGVhY2ggZW50aXR5IGNhbiB1cGRhdGUgdGhlaXIgdHJhbnNmb3JtLiAgSXQgXG4gKiAgIHdpbGwgdGhlbiBwYXNzIGRvd24gaW52YWxpZGF0aW9uIHN0YXRlcyBhbmQgdmFsdWVzIHRvIGFueSBjaGlsZHJlbi5cbiAqXG4gKiBAbWV0aG9kIGNvcmVVcGRhdGVBbmRGZWVkXG4gKiBAcHJpdmF0ZVxuICogICBcbiAqIEBwYXJhbSAge0VudGl0eX0gIGVudGl0eSAgICAgICAgICAgRW50aXR5IGluIHRoZSBzY2VuZSBncmFwaFxuICogQHBhcmFtICB7TnVtYmVyfSAgdHJhbnNmb3JtUmVwb3J0ICBiaXRTY2hlbWUgcmVwb3J0IG9mIHRyYW5zZm9ybSBpbnZhbGlkYXRpb25zXG4gKiBAcGFyYW0gIHtBcnJheX0gICBpbmNvbWluZ01hdHJpeCAgIHBhcmVudCB0cmFuc2Zvcm0gYXMgYSBGbG9hdDMyIEFycmF5XG4gKi9cbmZ1bmN0aW9uIGNvcmVVcGRhdGVBbmRGZWVkKGVudGl0eSwgdHJhbnNmb3JtUmVwb3J0LCBpbmNvbWluZ01hdHJpeCkge1xuICAgIGlmICghZW50aXR5KSByZXR1cm47XG4gICAgdmFyIHRyYW5zZm9ybSA9IGVudGl0eS5nZXRDb21wb25lbnQoJ3RyYW5zZm9ybScpO1xuICAgIHZhciBpICAgICAgICAgPSBlbnRpdHkuX2NoaWxkcmVuLmxlbmd0aDtcblxuICAgIHRyYW5zZm9ybVJlcG9ydCA9IHRyYW5zZm9ybS5fdXBkYXRlKHRyYW5zZm9ybVJlcG9ydCwgaW5jb21pbmdNYXRyaXgpO1xuXG4gICAgd2hpbGUgKGktLSkgXG4gICAgICAgIGNvcmVVcGRhdGVBbmRGZWVkKFxuICAgICAgICAgICAgZW50aXR5Ll9jaGlsZHJlbltpXSxcbiAgICAgICAgICAgIHRyYW5zZm9ybVJlcG9ydCxcbiAgICAgICAgICAgIHRyYW5zZm9ybS5fbWF0cml4KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMaWZ0U3lzdGVtO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4qIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4qXG4qIE93bmVyOiBtYXJrQGZhbW8udXNcbiogQGxpY2Vuc2UgTVBMIDIuMFxuKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiovXG5cbi8qKlxuICogRXZlbnRFbWl0dGVyIHJlcHJlc2VudHMgYSBjaGFubmVsIGZvciBldmVudHMuXG4gKlxuICogQGNsYXNzIEV2ZW50RW1pdHRlclxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgICB0aGlzLmxpc3RlbmVycyA9IHt9O1xuICAgIHRoaXMuX293bmVyID0gdGhpcztcbn1cblxuLyoqXG4gKiBUcmlnZ2VyIGFuIGV2ZW50LCBzZW5kaW5nIHRvIGFsbCBkb3duc3RyZWFtIGhhbmRsZXJzXG4gKiAgIGxpc3RlbmluZyBmb3IgcHJvdmlkZWQgJ3R5cGUnIGtleS5cbiAqXG4gKiBAbWV0aG9kIGVtaXRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgZXZlbnQgZGF0YVxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSwgZXZlbnQpIHtcbiAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLmxpc3RlbmVyc1t0eXBlXTtcbiAgICBpZiAoaGFuZGxlcnMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaGFuZGxlcnNbaV0uY2FsbCh0aGlzLl9vd25lciwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBCaW5kIGEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYW4gZXZlbnQgdHlwZSBoYW5kbGVkIGJ5IHRoaXMgb2JqZWN0LlxuICpcbiAqIEBtZXRob2QgXCJvblwiXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcsIE9iamVjdCl9IGhhbmRsZXIgY2FsbGJhY2tcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24odHlwZSwgaGFuZGxlcikge1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy5saXN0ZW5lcnMpKSB0aGlzLmxpc3RlbmVyc1t0eXBlXSA9IFtdO1xuICAgIHZhciBpbmRleCA9IHRoaXMubGlzdGVuZXJzW3R5cGVdLmluZGV4T2YoaGFuZGxlcik7XG4gICAgaWYgKGluZGV4IDwgMCkgdGhpcy5saXN0ZW5lcnNbdHlwZV0ucHVzaChoYW5kbGVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIFwib25cIi5cbiAqIEBtZXRob2QgYWRkTGlzdGVuZXJcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8qKlxuICogVW5iaW5kIGFuIGV2ZW50IGJ5IHR5cGUgYW5kIGhhbmRsZXIuXG4gKiAgIFRoaXMgdW5kb2VzIHRoZSB3b3JrIG9mIFwib25cIi5cbiAqXG4gKiBAbWV0aG9kIHJlbW92ZUxpc3RlbmVyXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtmdW5jdGlvbn0gaGFuZGxlciBmdW5jdGlvbiBvYmplY3QgdG8gcmVtb3ZlXG4gKiBAcmV0dXJuIHtFdmVudEVtaXR0ZXJ9IHRoaXNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKHR5cGUsIGhhbmRsZXIpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5pbmRleE9mKGhhbmRsZXIpO1xuICAgIGlmIChpbmRleCA+PSAwKSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDYWxsIGV2ZW50IGhhbmRsZXJzIHdpdGggdGhpcyBzZXQgdG8gb3duZXIuXG4gKlxuICogQG1ldGhvZCBiaW5kVGhpc1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvd25lciBvYmplY3QgdGhpcyBFdmVudEVtaXR0ZXIgYmVsb25ncyB0b1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmJpbmRUaGlzID0gZnVuY3Rpb24gYmluZFRoaXMob3duZXIpIHtcbiAgICB0aGlzLl9vd25lciA9IG93bmVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7IiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4qIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4qXG4qIE93bmVyOiBtYXJrQGZhbW8udXNcbiogQGxpY2Vuc2UgTVBMIDIuMFxuKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiovXG5cbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCcuL0V2ZW50RW1pdHRlcicpO1xuXG4vKipcbiAqIEV2ZW50SGFuZGxlciBmb3J3YXJkcyByZWNlaXZlZCBldmVudHMgdG8gYSBzZXQgb2YgcHJvdmlkZWQgY2FsbGJhY2sgZnVuY3Rpb25zLlxuICogSXQgYWxsb3dzIGV2ZW50cyB0byBiZSBjYXB0dXJlZCwgcHJvY2Vzc2VkLCBhbmQgb3B0aW9uYWxseSBwaXBlZCB0aHJvdWdoIHRvIG90aGVyIGV2ZW50IGhhbmRsZXJzLlxuICpcbiAqIEBjbGFzcyBFdmVudEhhbmRsZXJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEV2ZW50SGFuZGxlcigpIHtcbiAgICBFdmVudEVtaXR0ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuZG93bnN0cmVhbSA9IFtdOyAvLyBkb3duc3RyZWFtIGV2ZW50IGhhbmRsZXJzXG4gICAgdGhpcy5kb3duc3RyZWFtRm4gPSBbXTsgLy8gZG93bnN0cmVhbSBmdW5jdGlvbnNcblxuICAgIHRoaXMudXBzdHJlYW0gPSBbXTsgLy8gdXBzdHJlYW0gZXZlbnQgaGFuZGxlcnNcbiAgICB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzID0ge307IC8vIHVwc3RyZWFtIGxpc3RlbmVyc1xufVxuRXZlbnRIYW5kbGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZlbnRFbWl0dGVyLnByb3RvdHlwZSk7XG5FdmVudEhhbmRsZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRXZlbnRIYW5kbGVyO1xuXG4vKipcbiAqIEFzc2lnbiBhbiBldmVudCBoYW5kbGVyIHRvIHJlY2VpdmUgYW4gb2JqZWN0J3MgaW5wdXQgZXZlbnRzLlxuICpcbiAqIEBtZXRob2Qgc2V0SW5wdXRIYW5kbGVyXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBvYmplY3QgdG8gbWl4IHRyaWdnZXIsIHN1YnNjcmliZSwgYW5kIHVuc3Vic2NyaWJlIGZ1bmN0aW9ucyBpbnRvXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gaGFuZGxlciBhc3NpZ25lZCBldmVudCBoYW5kbGVyXG4gKi9cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIgPSBmdW5jdGlvbiBzZXRJbnB1dEhhbmRsZXIob2JqZWN0LCBoYW5kbGVyKSB7XG4gICAgb2JqZWN0LnRyaWdnZXIgPSBoYW5kbGVyLnRyaWdnZXIuYmluZChoYW5kbGVyKTtcbiAgICBpZiAoaGFuZGxlci5zdWJzY3JpYmUgJiYgaGFuZGxlci51bnN1YnNjcmliZSkge1xuICAgICAgICBvYmplY3Quc3Vic2NyaWJlID0gaGFuZGxlci5zdWJzY3JpYmUuYmluZChoYW5kbGVyKTtcbiAgICAgICAgb2JqZWN0LnVuc3Vic2NyaWJlID0gaGFuZGxlci51bnN1YnNjcmliZS5iaW5kKGhhbmRsZXIpO1xuICAgIH1cbn07XG5cbi8qKlxuICogQXNzaWduIGFuIGV2ZW50IGhhbmRsZXIgdG8gcmVjZWl2ZSBhbiBvYmplY3QncyBvdXRwdXQgZXZlbnRzLlxuICpcbiAqIEBtZXRob2Qgc2V0T3V0cHV0SGFuZGxlclxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb2JqZWN0IHRvIG1peCBwaXBlLCB1bnBpcGUsIG9uLCBhZGRMaXN0ZW5lciwgYW5kIHJlbW92ZUxpc3RlbmVyIGZ1bmN0aW9ucyBpbnRvXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gaGFuZGxlciBhc3NpZ25lZCBldmVudCBoYW5kbGVyXG4gKi9cbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyID0gZnVuY3Rpb24gc2V0T3V0cHV0SGFuZGxlcihvYmplY3QsIGhhbmRsZXIpIHtcbiAgICBpZiAoaGFuZGxlciBpbnN0YW5jZW9mIEV2ZW50SGFuZGxlcikgaGFuZGxlci5iaW5kVGhpcyhvYmplY3QpO1xuICAgIG9iamVjdC5waXBlID0gaGFuZGxlci5waXBlLmJpbmQoaGFuZGxlcik7XG4gICAgb2JqZWN0LnVucGlwZSA9IGhhbmRsZXIudW5waXBlLmJpbmQoaGFuZGxlcik7XG4gICAgb2JqZWN0Lm9uID0gaGFuZGxlci5vbi5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC5hZGRMaXN0ZW5lciA9IG9iamVjdC5vbjtcbiAgICBvYmplY3QucmVtb3ZlTGlzdGVuZXIgPSBoYW5kbGVyLnJlbW92ZUxpc3RlbmVyLmJpbmQoaGFuZGxlcik7XG59O1xuXG4vKipcbiAqIFRyaWdnZXIgYW4gZXZlbnQsIHNlbmRpbmcgdG8gYWxsIGRvd25zdHJlYW0gaGFuZGxlcnNcbiAqICAgbGlzdGVuaW5nIGZvciBwcm92aWRlZCAndHlwZScga2V5LlxuICpcbiAqIEBtZXRob2QgZW1pdFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCBldmVudCBkYXRhXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdCh0eXBlLCBldmVudCkge1xuICAgIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHZhciBpID0gMDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5kb3duc3RyZWFtLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLmRvd25zdHJlYW1baV0udHJpZ2dlcikgdGhpcy5kb3duc3RyZWFtW2ldLnRyaWdnZXIodHlwZSwgZXZlbnQpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5kb3duc3RyZWFtRm4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5kb3duc3RyZWFtRm5baV0odHlwZSwgZXZlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIGVtaXRcbiAqIEBtZXRob2QgYWRkTGlzdGVuZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS50cmlnZ2VyID0gRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5lbWl0O1xuXG4vKipcbiAqIEFkZCBldmVudCBoYW5kbGVyIG9iamVjdCB0byBzZXQgb2YgZG93bnN0cmVhbSBoYW5kbGVycy5cbiAqXG4gKiBAbWV0aG9kIHBpcGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gdGFyZ2V0IGV2ZW50IGhhbmRsZXIgdGFyZ2V0IG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSBwYXNzZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnBpcGUgPSBmdW5jdGlvbiBwaXBlKHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQuc3Vic2NyaWJlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiB0YXJnZXQuc3Vic2NyaWJlKHRoaXMpO1xuXG4gICAgdmFyIGRvd25zdHJlYW1DdHggPSAodGFyZ2V0IGluc3RhbmNlb2YgRnVuY3Rpb24pID8gdGhpcy5kb3duc3RyZWFtRm4gOiB0aGlzLmRvd25zdHJlYW07XG4gICAgdmFyIGluZGV4ID0gZG93bnN0cmVhbUN0eC5pbmRleE9mKHRhcmdldCk7XG4gICAgaWYgKGluZGV4IDwgMCkgZG93bnN0cmVhbUN0eC5wdXNoKHRhcmdldCk7XG5cbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgRnVuY3Rpb24pIHRhcmdldCgncGlwZScsIG51bGwpO1xuICAgIGVsc2UgaWYgKHRhcmdldC50cmlnZ2VyKSB0YXJnZXQudHJpZ2dlcigncGlwZScsIG51bGwpO1xuXG4gICAgcmV0dXJuIHRhcmdldDtcbn07XG5cbi8qKlxuICogUmVtb3ZlIGhhbmRsZXIgb2JqZWN0IGZyb20gc2V0IG9mIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKiAgIFVuZG9lcyB3b3JrIG9mIFwicGlwZVwiLlxuICpcbiAqIEBtZXRob2QgdW5waXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCB0YXJnZXQgaGFuZGxlciBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcHJvdmlkZWQgdGFyZ2V0XG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudW5waXBlID0gZnVuY3Rpb24gdW5waXBlKHRhcmdldCkge1xuICAgIGlmICh0YXJnZXQudW5zdWJzY3JpYmUgaW5zdGFuY2VvZiBGdW5jdGlvbikgcmV0dXJuIHRhcmdldC51bnN1YnNjcmliZSh0aGlzKTtcblxuICAgIHZhciBkb3duc3RyZWFtQ3R4ID0gKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/IHRoaXMuZG93bnN0cmVhbUZuIDogdGhpcy5kb3duc3RyZWFtO1xuICAgIHZhciBpbmRleCA9IGRvd25zdHJlYW1DdHguaW5kZXhPZih0YXJnZXQpO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIGRvd25zdHJlYW1DdHguc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB0YXJnZXQoJ3VucGlwZScsIG51bGwpO1xuICAgICAgICBlbHNlIGlmICh0YXJnZXQudHJpZ2dlcikgdGFyZ2V0LnRyaWdnZXIoJ3VucGlwZScsIG51bGwpO1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cbiAgICBlbHNlIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIFwib25cIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBoYW5kbGVyIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKCEodHlwZSBpbiB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzKSkge1xuICAgICAgICB2YXIgdXBzdHJlYW1MaXN0ZW5lciA9IHRoaXMudHJpZ2dlci5iaW5kKHRoaXMsIHR5cGUpO1xuICAgICAgICB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzW3R5cGVdID0gdXBzdHJlYW1MaXN0ZW5lcjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnVwc3RyZWFtLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnVwc3RyZWFtW2ldLm9uKHR5cGUsIHVwc3RyZWFtTGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3IgXCJvblwiXG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEhhbmRsZXIucHJvdG90eXBlLm9uO1xuXG4vKipcbiAqIExpc3RlbiBmb3IgZXZlbnRzIGZyb20gYW4gdXBzdHJlYW0gZXZlbnQgaGFuZGxlci5cbiAqXG4gKiBAbWV0aG9kIHN1YnNjcmliZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRFbWl0dGVyfSBzb3VyY2Ugc291cmNlIGVtaXR0ZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiBzdWJzY3JpYmUoc291cmNlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy51cHN0cmVhbS5pbmRleE9mKHNvdXJjZSk7XG4gICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICB0aGlzLnVwc3RyZWFtLnB1c2goc291cmNlKTtcbiAgICAgICAgZm9yICh2YXIgdHlwZSBpbiB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBzb3VyY2Uub24odHlwZSwgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFN0b3AgbGlzdGVuaW5nIHRvIGV2ZW50cyBmcm9tIGFuIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXIuXG4gKlxuICogQG1ldGhvZCB1bnN1YnNjcmliZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRFbWl0dGVyfSBzb3VyY2Ugc291cmNlIGVtaXR0ZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS51bnN1YnNjcmliZSA9IGZ1bmN0aW9uIHVuc3Vic2NyaWJlKHNvdXJjZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMudXBzdHJlYW0uaW5kZXhPZihzb3VyY2UpO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIHRoaXMudXBzdHJlYW0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgZm9yICh2YXIgdHlwZSBpbiB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIodHlwZSwgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50SGFuZGxlcjsiLCJ2YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgRW5naW5lICAgICAgICAgID0ge307XG5cbkVuZ2luZS5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5FbmdpbmUuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKEVuZ2luZSwgRW5naW5lLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoRW5naW5lLCBFbmdpbmUuZXZlbnRPdXRwdXQpO1xuXG5FbmdpbmUuY3VycmVudFN0YXRlID0gbnVsbDtcblxuRW5naW5lLnNldFN0YXRlICAgICA9IGZ1bmN0aW9uIHNldFN0YXRlKHN0YXRlKVxue1xuXHRpZiAoc3RhdGUuaW5pdGlhbGl6ZSkgc3RhdGUuaW5pdGlhbGl6ZSgpO1xuXHRcblx0aWYgKHRoaXMuY3VycmVudFN0YXRlKVxuXHR7XG5cdFx0dGhpcy5jdXJyZW50U3RhdGUudW5waXBlKEVuZ2luZS5ldmVudElucHV0KTtcblx0XHR0aGlzLmN1cnJlbnRTdGF0ZS5oaWRlKCk7XG5cdH1cblxuXHRzdGF0ZS5waXBlKHRoaXMuZXZlbnRJbnB1dCk7XG5cdHN0YXRlLnNob3coKTtcblxuXHR0aGlzLmN1cnJlbnRTdGF0ZSA9IHN0YXRlO1xufTtcblxuRW5naW5lLnN0ZXAgICAgICAgICA9IGZ1bmN0aW9uIHN0ZXAodGltZSlcbntcblx0dmFyIHN0YXRlID0gRW5naW5lLmN1cnJlbnRTdGF0ZTtcblx0aWYgKHN0YXRlKVxuXHR7XG5cdFx0aWYgKHN0YXRlLnVwZGF0ZSkgc3RhdGUudXBkYXRlKCk7XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRW5naW5lOyIsInZhciBBU1NFVF9UWVBFID0gJ2ltYWdlJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIEltYWdlTG9hZGVyICA9IHt9O1xudmFyIEltYWdlcyAgICAgICA9IHt9O1xuXG5JbWFnZUxvYWRlci5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5JbWFnZUxvYWRlci5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoSW1hZ2VMb2FkZXIsIEltYWdlTG9hZGVyLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoSW1hZ2VMb2FkZXIsIEltYWdlTG9hZGVyLmV2ZW50T3V0cHV0KTtcblxuSW1hZ2VMb2FkZXIubG9hZCA9IGZ1bmN0aW9uIGxvYWQoYXNzZXQpXG57XG4gICAgdmFyIHNvdXJjZSA9IGFzc2V0LnNvdXJjZTtcbiAgICBpZiAoIUltYWdlc1tzb3VyY2VdKVxuICAgIHtcbiAgICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGltYWdlLnNyYyA9IHNvdXJjZTtcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmaW5pc2hlZExvYWRpbmcoc291cmNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgSW1hZ2VzW3NvdXJjZV0gPSBpbWFnZTtcbiAgICB9XG59O1xuXG5JbWFnZUxvYWRlci5nZXQgID0gZnVuY3Rpb24gZ2V0KHNvdXJjZSlcbntcbiAgICByZXR1cm4gSW1hZ2VzW3NvdXJjZV07XG59O1xuXG5JbWFnZUxvYWRlci50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKClcbntcbiAgICByZXR1cm4gQVNTRVRfVFlQRTtcbn07XG5cbmZ1bmN0aW9uIGZpbmlzaGVkTG9hZGluZyhzb3VyY2UpXG57XG4gICAgSW1hZ2VMb2FkZXIuZXZlbnRPdXRwdXQuZW1pdCgnZG9uZUxvYWRpbmcnLCB7c291cmNlOiBzb3VyY2UsIHR5cGU6IEFTU0VUX1RZUEV9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZUxvYWRlcjsiLCJ2YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgVmlld3BvcnQgPSB7fTtcblxuVmlld3BvcnQuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuVmlld3BvcnQuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKFZpZXdwb3J0LCBWaWV3cG9ydC5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKFZpZXdwb3J0LCBWaWV3cG9ydC5ldmVudE91dHB1dCk7XG5cbndpbmRvdy5vbnJlc2l6ZSA9IGhhbmRsZVJlc2l6ZTtcblxuZnVuY3Rpb24gaGFuZGxlUmVzaXplKClcbntcblx0Vmlld3BvcnQuZXZlbnRPdXRwdXQuZW1pdCgncmVzaXplJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld3BvcnQ7IiwidmFyIENPTVBMRVRFID0gXCJjb21wbGV0ZVwiO1xudmFyIExPQURfU1RBUlRFRCA9IFwic3RhcnRMb2FkaW5nXCI7XG52YXIgTE9BRF9DT01QTEVURUQgPSBcImRvbmVMb2FkaW5nXCI7XG52YXIgTk9ORSA9ICdub25lJztcbnZhciBWSVNJQkxFID0gJ2lubGluZSc7XG5cbnZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbnZhciBMb2FkaW5nICAgICAgICAgID0ge307XG52YXIgYm9keVJlYWR5ICAgICAgICA9IGZhbHNlO1xudmFyIGFzc2V0U3RhY2sgICAgICAgPSBbXTtcbnZhciBsb2FkZXJSZWdpc3RyeSAgID0ge307XG52YXIgY29udGFpbmVyICAgICAgICA9IG51bGw7XG52YXIgc3BsYXNoU2NyZWVuICAgICA9IG5ldyBJbWFnZSgpO1xuc3BsYXNoU2NyZWVuLnNyYyAgICAgPSAnLi4vLi4vQXNzZXRzL0xvYWRpbmcuLi4ucG5nJztcbnNwbGFzaFNjcmVlbi53aWR0aCAgID0gc3BsYXNoV2lkdGggPSA1MDA7XG5zcGxhc2hTY3JlZW4uaGVpZ2h0ICA9IHNwbGFzaEhlaWdodCA9IDE2MDtcbkxvYWRpbmcuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuTG9hZGluZy5ldmVudE91dHB1dCAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cbkV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIoTG9hZGluZywgTG9hZGluZy5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKExvYWRpbmcsIExvYWRpbmcuZXZlbnRPdXRwdXQpO1xuXG5Mb2FkaW5nLmV2ZW50SW5wdXQub24oTE9BRF9DT01QTEVURUQsIGhhbmRsZUNvbXBsZXRlZExvYWQpO1xuTG9hZGluZy5ldmVudElucHV0Lm9uKCdyZXNpemUnLCBoYW5kbGVSZXNpemUpO1xuXG5Mb2FkaW5nLmluaXRpYWxpemUgPSBmdW5jdGlvbiBpbml0aWFsaXplKClcbntcbiAgICBpZiAoIWNvbnRhaW5lcilcbiAgICB7XG4gICAgICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2FkaW5nJyk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChzcGxhc2hTY3JlZW4pO1xuICAgICAgICBzcGxhc2hTY3JlZW4uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBzcGxhc2hTY3JlZW4uc3R5bGUudG9wID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoc3BsYXNoSGVpZ2h0ICogMC41KSArICdweCc7XG4gICAgICAgIHNwbGFzaFNjcmVlbi5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtIChzcGxhc2hXaWR0aCogMC41KSArICdweCc7XG4gICAgfVxuICAgIGlmIChhc3NldFN0YWNrLmxlbmd0aClcbiAgICB7XG4gICAgICAgIHRoaXMuZXZlbnRPdXRwdXQuZW1pdChMT0FEX1NUQVJURUQpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFzc2V0U3RhY2subGVuZ3RoOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBhc3NldCAgPSBhc3NldFN0YWNrW2ldO1xuICAgICAgICAgICAgdmFyIGxvYWRlciA9IGFzc2V0LnR5cGU7XG4gICAgICAgICAgICBsb2FkZXJSZWdpc3RyeVtsb2FkZXJdLmxvYWQoYXNzZXQpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuTG9hZGluZy5sb2FkICAgICAgID0gZnVuY3Rpb24gbG9hZChhc3NldClcbntcbiAgICBhc3NldFN0YWNrLnB1c2goYXNzZXQpO1xufTtcblxuTG9hZGluZy5zaG93ICAgICAgID0gZnVuY3Rpb24gc2hvdygpXG57XG4gICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBWSVNJQkxFO1xufTtcblxuTG9hZGluZy5oaWRlICAgICAgID0gZnVuY3Rpb24gaGlkZSgpXG57XG4gICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBOT05FO1xufTtcblxuTG9hZGluZy5yZWdpc3RlciAgID0gZnVuY3Rpb24gcmVnaXN0ZXIobG9hZGVyKVxue1xuICAgIHZhciBsb2FkZXJOYW1lICAgICAgICAgICAgID0gbG9hZGVyLnRvU3RyaW5nKCk7XG4gICAgbG9hZGVyUmVnaXN0cnlbbG9hZGVyTmFtZV0gPSBsb2FkZXI7XG4gICAgbG9hZGVyLnBpcGUodGhpcy5ldmVudElucHV0KTtcbn07XG5cbmZ1bmN0aW9uIGhhbmRsZUNvbXBsZXRlZExvYWQoZGF0YSlcbntcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBkYXRhLnNvdXJjZTtcbiAgICAgICAgdmFyIGxvY2F0aW9uID0gYXNzZXRTdGFjay5pbmRleE9mKHNvdXJjZSk7XG4gICAgICAgIGlmIChsb2NhdGlvbikgYXNzZXRTdGFjay5zcGxpY2UobG9jYXRpb24sIDEpO1xuICAgICAgICBpZiAoIWFzc2V0U3RhY2subGVuZ3RoKSBMb2FkaW5nLmV2ZW50T3V0cHV0LmVtaXQoTE9BRF9DT01QTEVURUQpO1xuICAgIH0sIDEwMDApO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVSZXNpemUoKVxue1xuICAgIHNwbGFzaFNjcmVlbi5zdHlsZS50b3AgPSAod2luZG93LmlubmVySGVpZ2h0ICogMC41KSAtIChzcGxhc2hIZWlnaHQgKiAwLjUpICsgJ3B4JztcbiAgICBzcGxhc2hTY3JlZW4uc3R5bGUubGVmdCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuNSkgLSAoc3BsYXNoV2lkdGgqIDAuNSkgKyAncHgnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRpbmc7IiwidmFyIE5PTkUgPSAnbm9uZSc7XG52YXIgVklTSUJMRSA9ICdpbmxpbmUnO1xuXG52YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgTWVudSAgICAgICAgICA9IHt9O1xuXG5NZW51LmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbk1lbnUuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKE1lbnUsIE1lbnUuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihNZW51LCBNZW51LmV2ZW50T3V0cHV0KTtcblxuTWVudS5ldmVudElucHV0Lm9uKCdyZXNpemUnLCBoYW5kbGVSZXNpemUpO1xuXG52YXIgbWVudUVsZW1lbnQgPSBudWxsLFxuY29udGFpbmVyICAgICAgID0gbnVsbCxcbm5ld0dhbWUgICAgICAgICA9IG51bGw7XG5cbk1lbnUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uIGluaXRpYWxpemUoKVxue1xuICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZW51Jyk7XG4gICAgbWVudUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBtZW51RWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgbmV3R2FtZSAgICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBuZXdHYW1lLm9uY2xpY2sgPSBzdGFydE5ld0dhbWU7XG4gICAgbmV3R2FtZS5pbm5lckhUTUwgPSAnTmV3IEdhbWUnO1xuICAgIG5ld0dhbWUuc3R5bGUuZm9udFNpemUgPSAnNTBweCc7XG4gICAgbmV3R2FtZS5zdHlsZS5mb250RmFtaWx5ID0gJ0hlbHZldGljYSc7XG4gICAgbmV3R2FtZS5zdHlsZS5jb2xvciA9ICcjRkZGJztcbiAgICBtZW51RWxlbWVudC5hcHBlbmRDaGlsZChuZXdHYW1lKTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobWVudUVsZW1lbnQpO1xuICAgIG1lbnVFbGVtZW50LnN0eWxlLnRvcCAgPSAod2luZG93LmlubmVySGVpZ2h0ICogMC41KSAtICg1OCAqIDAuNSkgKyAncHgnO1xuICAgIG1lbnVFbGVtZW50LnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKDI1MSAqIDAuNSkgKyAncHgnO1xufTtcblxuTWVudS5zaG93ICAgICAgID0gZnVuY3Rpb24gc2hvdygpXG57XG4gICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBWSVNJQkxFO1xufTtcblxuTWVudS5oaWRlICAgICAgID0gZnVuY3Rpb24gaGlkZSgpXG57XG4gICAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBOT05FO1xufTtcblxuZnVuY3Rpb24gaGFuZGxlUmVzaXplKClcbntcbiAgICBtZW51RWxlbWVudC5zdHlsZS50b3AgPSAod2luZG93LmlubmVySGVpZ2h0ICogMC41KSAtICg1OCAqIDAuNSkgKyAncHgnO1xuICAgIG1lbnVFbGVtZW50LnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKDI1MSAqIDAuNSkgKyAncHgnO1xufVxuXG5mdW5jdGlvbiBzdGFydE5ld0dhbWUoKVxue1xuICAgIE1lbnUuZXZlbnRPdXRwdXQuZW1pdCgnbmV3R2FtZScpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnU7IiwidmFyIE5PTkUgPSAnbm9uZSc7XG52YXIgVklTSUJMRSA9ICdpbmxpbmUnO1xuXG52YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xudmFyIEZhbW91c0VuZ2luZSAgICAgICA9IHJlcXVpcmUoJy4uLy4uL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL0VuZ2luZScpO1xuXG52YXIgUGxheWluZyAgICAgICAgICA9IHt9O1xuXG5QbGF5aW5nLmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblBsYXlpbmcuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKFBsYXlpbmcsIFBsYXlpbmcuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihQbGF5aW5nLCBQbGF5aW5nLmV2ZW50T3V0cHV0KTtcblxuUGxheWluZy5pbml0aWFsaXplID0gZnVuY3Rpb24gaW5pdGlhbGl6ZSgpXG57XG5cdGNvbnNvbGUubG9nKDEpXG4gXHRGYW1vdXNFbmdpbmUuY3JlYXRlQ29udGV4dCh7IGhhc0NhbWVyYTogZmFsc2UgfSk7XG59O1xuXG5QbGF5aW5nLnVwZGF0ZSAgICAgPSBmdW5jdGlvbiB1cGRhdGUoKVxue1xuXHRGYW1vdXNFbmdpbmUuc3RlcCgpO1xufTtcblxuUGxheWluZy5zaG93ICAgICAgID0gZnVuY3Rpb24gc2hvdygpXG57XG59O1xuXG5QbGF5aW5nLmhpZGUgICAgICAgPSBmdW5jdGlvbiBoaWRlKClcbntcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWluZzsiLCJ2YXIgRW5naW5lICA9IHJlcXVpcmUoJy4vR2FtZS9FbmdpbmUnKTtcbnZhciBMb2FkaW5nID0gcmVxdWlyZSgnLi9TdGF0ZXMvTG9hZGluZycpO1xudmFyIE1lbnUgICAgPSByZXF1aXJlKCcuL1N0YXRlcy9NZW51Jyk7XG52YXIgUGxheWluZyA9IHJlcXVpcmUoJy4vU3RhdGVzL1BsYXlpbmcnKTtcbnZhciBFdmVudEhhbmRsZXIgPSByZXF1aXJlKCcuL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcbnZhciBJbWFnZUxvYWRlciAgPSByZXF1aXJlKCcuL0dhbWUvSW1hZ2VMb2FkZXInKTtcbnZhciBWaWV3cG9ydCAgICAgPSByZXF1aXJlKCcuL0dhbWUvVmlld3BvcnQnKTtcblxudmFyIENvbnRyb2xsZXIgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5cblZpZXdwb3J0LnBpcGUoTWVudSk7XG5WaWV3cG9ydC5waXBlKExvYWRpbmcpO1xuVmlld3BvcnQucGlwZShQbGF5aW5nKTtcblxuRW5naW5lLnBpcGUoQ29udHJvbGxlcik7XG5NZW51LnBpcGUoQ29udHJvbGxlcik7XG5Mb2FkaW5nLnBpcGUoQ29udHJvbGxlcik7XG5cbkNvbnRyb2xsZXIub24oJ2RvbmVMb2FkaW5nJywgZ29Ub01lbnUpO1xuQ29udHJvbGxlci5vbignbmV3R2FtZScsIHN0YXJ0R2FtZSk7XG5cbnZhciBzcHJpdGVzaGVldCA9IHtcblx0dHlwZTogJ2ltYWdlJyxcblx0c291cmNlOiAnLi4vQXNzZXRzL2NyYXRlLmdpZicsXG5cdGRhdGE6IHt9XG59O1xuXG5Mb2FkaW5nLnJlZ2lzdGVyKEltYWdlTG9hZGVyKTtcbkxvYWRpbmcubG9hZChzcHJpdGVzaGVldCk7XG5cbkVuZ2luZS5zZXRTdGF0ZShMb2FkaW5nKTtcblxuZnVuY3Rpb24gZ29Ub01lbnUoKVxue1xuICAgIEVuZ2luZS5zZXRTdGF0ZShNZW51KTtcbn1cblxuZnVuY3Rpb24gc3RhcnRHYW1lKClcbntcblx0RW5naW5lLnNldFN0YXRlKFBsYXlpbmcpO1xufVxuXG5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoRW5naW5lLnN0ZXApOyJdfQ==
