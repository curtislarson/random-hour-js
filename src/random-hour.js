var exec   = require("child_process").exec;
var prompt = require("prompt");
var fs     = require("fs");
var util   = require("util");

var RandomHour = {
    private: {

        /**
         * @method
         * Starts the prompt to receive data from the user.
         */
        startPrompt: undefined,

        /**
         * @method
         * Processes the command line arguments and runs the random hour
         * @param {String} directory The directory that contains the songs.
         * @param {String} vlcPath The path of the vlc executable.
         * @param {String} ffmpegPath The path of the ffmpeg executable.
         * @param {Integer} numSongs Number of songs to play.
         * @param {Integer} numSeconds Number of seconds of each song to play.
         */
        runRandomHour: undefined,

        /**
         * @method
         * Plays the provided 'files' in vlc located at the provided 'vlcPath'
         * for a randomly defined portion of 'numSeconds' seconds.
         * param {Array} files A list of file paths
         * param {Integer} numSeconds The number of seconds for each song
         * param {String} vlcPath The path of the vlc executable
         */
        randomPlay: undefined,

        /**
         * @method
         * Randomly choose 'numToChoose' values from the provided 'array'
         * array and return it as a new array.
         * @param {Array} array An array of values.
         * @param {Integer} numToChoose The number of values to choose.
         * @return {Array} the new random array of 'numToChoose' length.
         */
        randomChoose: undefined,

        /**
         * @method
         * Gets the duration of each of the provided filePaths in the 'files'
         * array using ffmpeg located at the provided 'ffmpegPath' path. Calls
         * 'callback' with an array of objects containing filePath and duration
         * properties.
         * @param {Array} files The files to retrieve durations for
         * @param {String} ffmpegPath The path of the ffmpeg executable.
         * @param {Function} callback Called when durations have been retrieved.
         */
        getDurations: undefined,

        /**
         * @method
         * Get the duration of song located at the provided 'filePath' using
         * ffmpeg located at the provided 'ffmpegPath' in seconds.
         * @param {String} filePath The file path of the song to check the
         *                          duration of.
         * @param {String} ffmpegPath The path of the ffmpeg executable.
         * @param {Function} callback called with the duration in seconds.
         */
        getDuration: undefined,

        /**
         * @method
         * Takes in a time interval string of the form HH:MM:SS.MS and returns
         * the corresponding value in seconds
         * @param {String} timeIntervalString
         * @return {Integer} time interval in seconds 
         */
        getSeconds: undefined,

        /**
         * @method
         * Calculate a random start time based on the provided 'duration' and
         * 'numSeconds'. Also uses the static 'SONG_BUFFER' variable.
         * @param {Integer} duration
         * @param {Integer} numSeconds
         */
        getStartTime: undefined,

        /**
         * @method
         * Prints the provided 'errorMessage'. If 'isFatal' is true, also
         * terminate the program.
         * @param {Object} error
         * @param {Boolean} isFatal
         * @return {Integer} an integer if the error is fatal.
         */
        printError: undefined,
    },

    static: {
        ARGS: ["directory", "vlcpath", "ffmpegpath", "numsongs", "numseconds"],

        SONG_BUFFER: 10,
    },

    /**
     * Main function for this script.
     */
    main: undefined,

    public: {

    }
};

RandomHour.private.startPrompt = function() {
    prompt.start();
    prompt.get(RandomHour.static.ARGS, function(err, result) {
        if (err) {
            printErr(err);                                               // EXIT
        }
        else {
            RandomHour.private.runRandomHour(result.directory,
                                             result.vlcpath,
                                             result.ffmpegpath,
                                             result.numsongs,
                                             result.numseconds);
        }
    });
}

RandomHour.private.runRandomHour = function(directory,
                                            vlcPath,
                                            ffmpegPath,
                                            numSongs,
                                            numSeconds) {
    if ("" === directory) {
        directory = "/Users/larson/Documents/ph4";
    }
    if ("" === vlcPath) {
        vlcPath = "/Applications/VLC.app/Contents/MacOS/VLC";
    }
    if ("" === ffmpegPath) {
        ffmpegPath = "./ffmpeg";
    }
    if ("" === numSongs) {
        numSongs = 60;
    }
    if ("" === numSeconds) {
        numSeconds = 60;
    }

    var files = fs.readdirSync(directory);

    if (files.length < numSongs) {
        printErr("Unable to run random hour, command line num songs " +
                 numSongs +
                 "is greater than provided directory " +
                 directory +
                 " song count " +
                 files.length);                                          // EXIT
    }

    files = RandomHour.private.randomChoose(files, numSongs);

    for (var i = 0; i < numSongs; i++) {
        files[i] = directory + "/" + files[i];
    }

    RandomHour.private.getDurations(files, ffmpegPath, function(newFiles) {
        RandomHour.private.randomPlay(newFiles, numSeconds, vlcPath);
    });
}

RandomHour.private.randomPlay = function(files, numSeconds, vlcPath) {
    var length = files.length;
    var index = 0;

    var cancelInterval = null;

    var play = function() {
        if (index != length + 1) {
            var file = files[index];
            var duration = file.duration;
            var filePath = file.filePath;
            var startTime = RandomHour.private.getStartTime(duration);

            exec(vlcPath +
                 " --fullscreen --play-and-exit --start-time " +
                 startTime +
                 " --stop-time " + 
                 (startTime + numSeconds) +
                 " --run-time " +
                 numSeconds +
                 " '" + 
                 filePath + 
                 "'");
            index++;
        } 
        else {
            cancelInterval();
        }
    }

    // Add .2 to numSeconds to account for VLC delay
    cancelInterval = setInterval(play, (numSeconds + .2) * 1000);
    play();
}

RandomHour.private.getDurations = function(files, ffmpegPath, callback) {
    var newFiles = [];
    var length = files.length;
    var asyncIdx = 0;
    files.forEach(function(filePath, index, arr) {
            RandomHour.private.getDuration(filePath,
                                           ffmpegPath,
                                           function(duration) {
            newFiles[index] = {
                filePath: filePath,
                duration: duration
            };
            // Send the results once we know we have processed all the files.
            asyncIdx++;
            if (asyncIdx === length) {
                callback(newFiles);
            }
        });
    });
}

RandomHour.private.randomChoose = function(array, numToChoose) {
    var returnArray = [];

    for (var i = 0; i < numToChoose; i++) {
        var index = Math.floor(Math.random() * array.length);
        var value = array[index];
        returnArray.push(value);

        array.splice(index, 1);
    }

    return returnArray;
}

RandomHour.private.getDuration = function(filePath,
                                          ffmpegPath,
                                          callback) {
    exec(ffmpegPath + " -i '" + filePath + "'", function(err, stdout, stderr) {
        // We are going to ignore errors in this case and return stderr instead
        // of stdout because ffmpeg will always complain about a lack of output
        // file, and the duration information will be printed to stderr instead.
        var durationStringIdx = stderr.indexOf("Duration: ");
        var durationStringLen = 10;
        var start = durationStringIdx + durationStringLen;
        var durationLen = 11;
        var duration = stderr.substring(start, start + durationLen);
        callback(RandomHour.private.getSeconds(duration));
    });
}

RandomHour.private.getSeconds = function(timeIntervalString) {
    var split = timeIntervalString.split(":");
    return parseInt(split[0]) * 3600  + parseInt(split[1]) * 60 +
           parseInt(split[2]);
}

RandomHour.private.getStartTime = function(duration, numSeconds) {
    return Math.floor(Math.random() * (duration - 
        (numSeconds + RandomHour.static.SONG_BUFFER)) + 10);
}

RandomHour.private.printError = function(err, isFatal) {
    if (undefined === isFatal) {
        isFatal = true;
    }

    console.log(err);

    if (isFatal) {
        process.exit(1);
    }
}
var printErr = RandomHour.private.printError;

RandomHour.main = function() {
    RandomHour.private.startPrompt();
}

RandomHour.main();

exports.RandomHour = RandomHour;