const config = require('config');
const mqtt = require('mqtt');
const pigpio = config.get('debug') ? require('pigpio-mock') : require('pigpio');
const Gpio = pigpio.Gpio;

var mqttConfig = Object.assign({}, config.get('mqtt')); // we copy the config because it must be editable
const client  = mqtt.connect(mqttConfig);

if (!Math.map) {
	Math.map = function (val, in_min, in_max, out_min, out_max) {
		return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}
}

var state = {
	leds: {},
	includeRgb: false,
	includeWhite: false,

	red: 255,
	green: 255,
	blue: 255,
	white: 255,

	brightness: 0,

	on: false,

	init: function() {
		const stripType = config.get('stripType');
		this.includeRgb = (stripType === 'RGB' || stripType === 'RGBW');
		this.includeWhite = (stripType === 'BRIGHTNESS' || stripType === 'RGBW');

		if (includeRgb) {
			leds.red = new Gpio(config.get('pinRed'), { mode: Gpio.OUTPUT });
			leds.green = new Gpio(config.get('pinGreen'), { mode: Gpio.OUTPUT });
			leds.blue = new Gpio(config.get('pinBlue'), { mode: Gpio.OUTPUT });
		}
		if (includeWhite) {
			leds.white = new Gpio(config.get('pinWhite'), { mode: Gpio.OUTPUT });	
		}
	},

	apply: function() {
		var r, g, b, w;

		console.log (this);

		if (this.on) {
			r = Math.round(Math.map(this.red, 0, 255, 0, this.brightness));
			g = Math.round(Math.map(this.green, 0, 255, 0, this.brightness);
			b = Math.round(Math.map(this.blue, 0, 255, 0, this.brightness));
			w = Math.round(Math.map(this.white, 0, 255, 0, this.brightness));
		} else {
			r = 0;
			g = 0;
			b = 0;
			w = 0;
		}

		if (this.includeRgb) {
			this.leds.red.pwmWrite(r || 0);
			this.leds.green.pwmWrite(g || 0);
			this.leds.blue.pwmWrite(b || 0);
		}
		if (this.includeWhite) {
			this.leds.white.pwmWrite(w || 0);
		}
	}
};

state.init();

function sendState() {
	var data = {};
	data.state = state.on ? config.get('mqttPayloadOn') : config.get('mqttPayloadOff');
	if (includeRgb) {
		data.color = {
			r: state.red,
			g: state.green,
			b: state.blue
		};
	}
	if (includeWhite) {
		data.white_value = state.white;
	}

	data.brightness = state.brightness;

	var dataJson = JSON.stringify(data);
	client.publish(config.get('mqttTopicState'), dataJson);
}

client.on('connect', function () {
	client.subscribe(config.get('mqttTopicSet'));
	sendState();
});

client.on('message', function (topic, message) {
	if (topic === config.get('mqttTopicSet')) {
		console.log('rec topic: ' + message);
		var data = JSON.parse(message);

		if (data.state === config.get('mqttPayloadOn')) {
			state.on = true;
		} else if (data.state === config.get('mqttPayloadOff')) {
			state.on = false;
		}

		if (data.color) {
			state.red = +data.color.r;
			state.green = +data.color.g;
			state.blue = +data.color.b;
		}

		if (data.white_value) {
			state.white = +data.white_value;
		}

		if (data.brightness) {
			state.brightness = +data.brightness;
		}

		//TODO implement effects

		state.apply();
		sendState();
	}
});

//make sure the pins are set to the initial state when started
state.apply();
