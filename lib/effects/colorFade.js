'use strict';
const config = require('config');

module.exports = function(state, transition) {
	const nameBase = 'colorfade';
	const nameSlow = nameBase + '_slow';
	const nameFast = nameBase + '_fast';

	const timeSlow = config.get('colorFade').timeSlow;
	const timeFast = config.get('colorFade').timeFast;

	var running = false;
	var currentColor = 0;
	// {red, grn, blu, wht}
	const colors = [
		[255, 0, 0, 0],
		[0, 255, 0, 0],
		[0, 0, 255, 0],
		[255, 80, 0, 0],
		[163, 0, 255, 0],
		[0, 255, 255, 0],
		[255, 255, 0, 0],
	];

	var colorFade = {
		processJson: function(data) {
			if (state.includeRgb && ('' + data.effect).startsWith(nameBase)) { // converting data.effect to string before compare
				running = true;
				currentColor = 0;

				// use the transition time from the data or else select one according to the name
				transition.time = data.transition || (data.effect === nameSlow ? timeSlow : timeFast);

				// make sure the fading is started
				progressTransition();
				return true;
			}
			else if (running && !data.color && data.brightness) {
				// Adjust brightness during colorfade
				state.brightness = data.brightness;
				return true;
			}

			return false;
		},
		populateJson: function(data) {
			if (running) {
				data.effect = nameBase;
			}
		},
		end: function() {
			running = false;
		}
	}

	transition.on('end', () => {
		progressTransition();
	});

	function progressTransition() {
		if(running) {
			var r = colors[currentColor][0];
			var g = colors[currentColor][1];
			var b = colors[currentColor][2];
			var w = colors[currentColor][3];

			currentColor = (currentColor + 1) % colors.length;

			transition.start(r, g, b, w);
		}
	}

	return colorFade;
}
