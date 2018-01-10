const config = require('config');
const pigpio = config.get('debug') ? require('pigpio-mock') : require('pigpio');
const Gpio = pigpio.Gpio;

const payloadOn = config.get('payloadOn');
const payloadOff = config.get('payloadOff');

if (!Math.map) {
	Math.map = function (val, in_min, in_max, out_min, out_max) {
		return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
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

		brightness: 0,

		on: false,

		apply: function() {
			var r, g, b, w;

			if (this.on) {
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

			if (this.includeRgb) {
				leds.red.pwmWrite(r || 0);
				leds.green.pwmWrite(g || 0);
				leds.blue.pwmWrite(b || 0);
			}
			if (this.includeWhite) {
				leds.white.pwmWrite(w || 0);
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
					r: this.red,
					g: this.green,
					b: this.blue
				};
			}
			if (this.includeWhite) {
				data.white_value = this.white;
			}

			data.brightness = this.brightness;
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
