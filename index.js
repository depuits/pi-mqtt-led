const config = require('config');
const mqtt = require('mqtt');
const pigpio = process.env.NODE_ENV !== 'production' ? require('pigpio-mock') : require('pigpio');
const Gpio = pigpio.Gpio;

const stripType = config.get('stripType');
const includeRgb = (stripType === 'RGB' || stripType === 'RGBW');
const includeWhite = (stripType === 'BRIGHTNESS' || stripType === 'RGBW');

const client  = mqtt.connect({ 
	host: config.get('mqttHost'), 
	port: config.get('mqttPort'), 
	username: config.get('mqttUsername'), 
	password: config.get('mqttPassword')
});

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
	return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

var state = {
	red: 0,
	green: 0,
	blue: 0,
	white: 0,

	brightness: 0,

	on: false,
};

var leds = {};
if (includeRgb) {
	leds.red = new Gpio(config.get('pinRed'), { mode: Gpio.OUTPUT });
	leds.green = new Gpio(config.get('pinGreen'), { mode: Gpio.OUTPUT });
	leds.blue = new Gpio(config.get('pinBlue'), { mode: Gpio.OUTPUT });
}
if (includeWhite) {
	leds.white = new Gpio(config.get('pinWhite'), { mode: Gpio.OUTPUT });	
}

function applyState() {
	var r, g, b, w;

	console.log (state);

	if (state.on) {
		r = state.red.map(0, 255, 0, state.brightness);
		g = state.green.map(0, 255, 0, state.brightness);
		b = state.blue.map(0, 255, 0, state.brightness);
		w = state.white.map(0, 255, 0, state.brightness);
	} else {
		r = 0;
		g = 0;
		b = 0;
		w = 0;
	}

	if (includeRgb) {
		leds.red.pwmWrite(r);
		leds.green.pwmWrite(g);
		leds.blue.pwmWrite(b);
	}
	if (includeWhite) {
		leds.white.pwmWrite(w);
	}
}

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
			state.red = +data.color.r || 0;
			state.green = +data.color.g || 0;
			state.blue = +data.color.b || 0;
		}

		if (data.white_value) {
			state.white = +data.white_value;
		}

		if (data.brightness) {
			state.brightness = +data.brightness;
		}

		//TODO implement effects

		applyState();
		sendState();
	}
});

//make sure the pins are set to the initial state when started
applyState();