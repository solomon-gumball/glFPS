module.exports = {
	_once: [],
	_every: [],

	update: function update(){
		var currentTime = Date.now();
		var timerEvent;
		if(!this._initialTime) this._initialTime = currentTime;
		this._elapsed = currentTime - this._initialTime;

		for (var i = 0; i < this._once.length; i++) {
			if(this._elapsed > this._once[i].trigger) {
				timerEvent = this._once[i];
				timerEvent.callback();
				this._once.splice(i, 1);
			}
		}

		for (var i = 0; i < this._every.length; i++) {
			if(this._elapsed > this._every[i].trigger) {
				timerEvent = this._every[i];
				timerEvent.callback();
				timerEvent.trigger = this._elapsed + timerEvent.timeout
			}
		}
	},

	getElapsed: function getElapsed() {
		return this._elapsed;
	},

	after: function after(callback, timeout) {
		this._once.push({
			callback: callback,
			trigger: this._elapsed + timeout
		});
	},

	every: function every(callback, timeout) {
		this._every.push({
			callback: callback,
			trigger: this._elapsed + timeout,
			timeout: timeout
		})
	}
};