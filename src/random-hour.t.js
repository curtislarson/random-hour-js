var RH = require('./random-hour.js').RandomHour;

var main = function() {
	var duration = 360; // 6 minutes
	var numSeconds = 60;

	for (var i = 0; i < 100; i++) {
		var startTime = RH.private.getStartTime(duration, numSeconds);
		assert(startTime - 10 > 0 && startTime + numSeconds <= duration,
			   "startTime" + i);
	}
	process.exit(0);
}

var assert = function(thingToAssert, tag) {
	if (!thingToAssert) {
		console.log("ERROR! TEST " + tag + " HAS FAILED!");
	}
	else {
		console.log("Test " + tag + " has passed.")
	}
}


main();