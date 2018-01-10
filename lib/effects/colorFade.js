
module.exports = function(state, transition) {
	const nameSlow = 'colorfade_slow';
	const nameFast = 'colorfade_fast';

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
		},
		populateJson: function(data) {
			
		},
		end: function() {
		}
	}
}
