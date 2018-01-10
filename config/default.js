'use strict';

var config = {
	debug: (process.env.NODE_ENV !== 'production'),

	stripType: 'RGB', // options: BRIGHTNESS, RGB, RGBW

	pinRed: 0,		// For RGB(W)
	pinGreen: 0,	// For RGB(W)
	pinBlue: 0,		// For RGB(W)
	pinWhite: 0,	// For BRIGHTNESS and RGBW

	payloadOn: 'ON',
	payloadOff: 'OFF',

	mqtt: {
		host: '127.0.0.1', 
		port: 1883,
		username: undefined,
		password: undefined
	},
	mqttTopicState: 'home/PI_LED',
	mqttTopicSet: 'home/PI_LED/set'
};

module.exports = config;
