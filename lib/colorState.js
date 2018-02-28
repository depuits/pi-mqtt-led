'use strict';
const config = require('config');
const pigpio = config.get('debug') ? require('pigpio-mock') : require('pigpio');
const Gpio = pigpio.Gpio;

const invertLedLogic = config.get('invertLedLogic');

const payloadOn = config.get('payloadOn');
const payloadOff = config.get('payloadOff');

if (!Math.map) {
	Math.map = function (val, in_min, in_max, out_min, out_max) {
		return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}
} 
if (!Math.clamp) {
	Math.clamp = function clamp(num, min, max) {
		if (num < min) return min;
		if (num > max) return max;
		return num;
	}
}

module.exports = function() {
	var leds = {};

	var state = {
		includeRgb: false,
		includeWhite: false,

		red: 255,
		green: 255,
		blue: 255,
		white: 255,

		brightness: 255,

		on: false,

		apply: function() {
			var r, g, b, w;

			if (this.on) {
				// map the colors according to the brightness 
				// and round them to a whole number or else the pigpio library can crash
				r = Math.round(Math.map(this.red, 0, 255, 0, this.brightness));
				g = Math.round(Math.map(this.green, 0, 255, 0, this.brightness));
				b = Math.round(Math.map(this.blue, 0, 255, 0, this.brightness));
				w = Math.round(Math.map(this.white, 0, 255, 0, this.brightness));
			} else {
				r = 0;
				g = 0;
				b = 0;
				w = 0;
			}

			// make sure the color is a number and it is valid (not NaN or undefined)
			// then clamp it between 0 and 255
			r = Math.clamp(+r || 0, 0, 255);
			g = Math.clamp(+g || 0, 0, 255);
			b = Math.clamp(+b || 0, 0, 255);
			w = Math.clamp(+w || 0, 0, 255);

			if(invertLedLogic) {
				r = (255 - r);
				g = (255 - g);
				b = (255 - b);
				w = (255 - w);
			}

			if (this.includeRgb) {
				leds.red.pwmWrite(r);
				leds.green.pwmWrite(g);
				leds.blue.pwmWrite(b);
			}
			if (this.includeWhite) {
				leds.white.pwmWrite(w);
			}
		},

		preprocessJson: function(data) {
			if (data.state === payloadOn) {
				this.on = true;
			} else if (data.state === payloadOff) {
				this.on = false;
			}

			return this.on;
		},
		processJson: function(data) {
			if (data.color) {
				this.red = +data.color.r;
				this.green = +data.color.g;
				this.blue = +data.color.b;
			}

			if (data.white_value) {
				this.white = +data.white_value;
			}

			if (data.brightness) {
				this.brightness = +data.brightness;
			}

			this.apply();

			return true;
		},
		populateJson: function(data) {
			data.state = this.on ? payloadOn : payloadOff;
			if (this.includeRgb) {
				data.color = {
					// round the values so we don't get long numbers in or json
					r: Math.round(this.red),
					g: Math.round(this.green),
					b: Math.round(this.blue)
				};
			}
			if (this.includeWhite) {
				data.white_value = Math.round(this.white);
			}

			data.brightness = Math.round(this.brightness);
		},
		end: function() {}
	};

	const stripType = config.get('stripType');
	state.includeRgb = (stripType === 'RGB' || stripType === 'RGBW');
	state.includeWhite = (stripType === 'BRIGHTNESS' || stripType === 'RGBW');

	if (state.includeRgb) {
		leds.red = new Gpio(config.get('pinRed'), { mode: Gpio.OUTPUT });
		leds.green = new Gpio(config.get('pinGreen'), { mode: Gpio.OUTPUT });
		leds.blue = new Gpio(config.get('pinBlue'), { mode: Gpio.OUTPUT });
	}
	if (state.includeWhite) {
		leds.white = new Gpio(config.get('pinWhite'), { mode: Gpio.OUTPUT });	
	}

	//make sure the pins are set to the initial state when started
	state.apply();

	return state;
};
