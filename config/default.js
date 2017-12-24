'use strict';

var config = {
	stripType: 'RGB', // options: BRIGHTNESS, RGB, RGBW

	pinRed: 0,		// For RGB(W)
	pinGreen: 0,	// For RGB(W)
	pinBlue: 0,		// For RGB(W)
	pinWhite: 0,	// For BRIGHTNESS and RGBW

	mqttHost: '{mqtt-server}', 
	mqttPort: 1883,
	mqttUsername: undefined,
	mqttPassword: undefined,

	mqttTopicState: 'home/PI_LED',
	mqttTopicSet: 'home/PI_LED/set',
	mqttPayloadOn: 'ON',
	mqttPayloadOff: 'OFF'
};

module.exports = config;
