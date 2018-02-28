'use strict';
var eventEmitter = require('events').EventEmitter;

module.exports = function(state) {
	var intervalId = undefined;
	var stepR, stepG, stepB, stepW;

	var stepCount = 0;
	var stepTotal = 255; // 255 should be enough step to stop at each possible rgb led value

	var transition = {
		time: 0,

		start: function(r, g, b, w) {
			// If we don't want to fade, skip it.
			if (this.time == 0) {
				state.red = r;
				state.green = g;
				state.blue = b;
				state.white = w;
			}
			else {
				stepCount = 0;
				stepR = calculateStep(state.red, r);
				stepG = calculateStep(state.green, g);
				stepB = calculateStep(state.blue, b);
				stepW = calculateStep(state.white, w);

				this.end();
				intervalId = setInterval(() => { this.update(); }, ((this.time * 1000) / stepTotal));
			}
		},

		update: function() {
			if (stepCount < stepTotal) {
				state.red += stepR;
				state.green += stepG;
				state.blue += stepB;
				state.white += stepW;

				state.apply();

				++stepCount;
			}
			else {
				this.end();
			}
		},

		processJson: function(data) {
			if (data.transition) {
				var red = 0, 
					grn = 0, 
					blu = 0, 
					wht = 0;

				if (data.color) {
					red = +data.color.r;
					grn = +data.color.g;
					blu = +data.color.b;
				}

				if (data.white_value) {
					wht = +data.white_value;
				}

				// should the brighness also be transitioned?
				if (data.brightness) {
					state.brightness = +data.brightness;
				}

				this.time = data.transition;
				this.start(red, grn, blu, wht);

				return true;
			}
			return false;
		},
		populateJson: function(data) {
		},
		end: function() {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = undefined;
				this.emit('end');
			}
		}
	};

	function calculateStep(prevValue, endValue) {
		var step = (endValue - prevValue) / stepTotal;	// The overall gap divided by the number of steps taken
		return step;
	}

	Object.defineProperty(transition, 'running', {
		get: function() {
			return (intervalId !== undefined);
		}
	});
	return Object.assign(Object.create(new eventEmitter()), transition);
};
