var currentTime;

module.exports = {
	_events: [],

	update: function update(){
		currentTime = Date.now();
		if(!this._initialTime) this._initialTime = currentTime;
		this._elapsed = currentTime - this._initialTime;

		for (var i = 0; i < this._events.length; i++) {
			if(this._elapsed > this._events[i].trigger) {
				this._events[i].callback();
				this._events.splice(i, 1);
			}
		}
	},

	getElapsed: function getElapsed() {
		return this._elapsed;
	},

	after: function after(callback, timeout) {
		this._events.push({
			callback: callback,
			trigger: this._elapsed + timeout
		});
	}
};