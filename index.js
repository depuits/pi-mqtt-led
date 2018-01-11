const config = require('config');
const mqtt = require('mqtt');

var mqttConfig = Object.assign({}, config.get('mqtt')); // we copy the config because it must be editable
const client  = mqtt.connect(mqttConfig);

const state = require('./lib/colorState')();
const transition = require('./lib/effects/transition')(state);
const colorFade = require('./lib/effects/colorFade')(state, transition);

var effects = [
	colorFade,
	transition,
	state
];

function sendState() {
	var data = {}; 

	for (let e of effects) {
		e.populateJson(data);
	}

	var dataJson = JSON.stringify(data);
	client.publish(config.get('mqttTopicState'), dataJson);
}

client.on('connect', function () {
	client.subscribe(config.get('mqttTopicSet'));
	sendState(); //make sure the current state is know when connected
});

client.on('message', function (topic, message) {
	if (topic === config.get('mqttTopicSet')) {
		console.log('rec topic: ' + message);
		var data = JSON.parse(message);

		state.preprocessJson(data);

		for (let e of effects) {
			//we must make sure no other effects are still running
			if (e.processJson(data)) {
				for (let e2 of effects) {
					if (e != e2) { // we do not want to stop the effect that just started
						e2.end();
					}
				}

				break;
			}
		}

		sendState();
	}
});
