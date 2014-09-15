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