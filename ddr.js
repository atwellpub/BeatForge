/**
 *  Setup
 */
const setup = {
    "difficulty" : "hard",
    "mode" : "rewrite",
    "backup" : false, /* not implemented */
    "overwrite" : false, /* not implemented */
    "eliminateDDs" : true,
    "fixTriangles" : false, /* not implemented */
    "minDistance" :.05, /* we will only correct dd if delta occurance is greater than this number - looks forward and backwards for same color notes */
    "maxDistance" : 20, /* we will only correct dd if delta occurance is less than this number */
    "ignoreTimes" : [
        236,237,238,239,240,252,253,255,256,270,271,272,287,288,302,303,304,311,312,357,358,359,367,368,383,384,399,400,963,964,979,980,995,996,1003,1004,1007,1008,1011,1012,1019,1020,1043,1044,1051,1052,1059,1060,1067,1068,1086,1087,1217,1224,1232,1249,1257
    ]
};

/**
 *  Packages
 */
const jsonfile = require('jsonfile');


/**
 * DDR Core
 */
var DDR = ( function() {
    var routines = [];
    var map = {} ;
    var memory = [];
    var newNotes = [];

    return {
        init: function( n ) {
            DDR.routines = []

            /* setup routine chain */
            DDR.routines.push("loadFile")
            if (setup.eliminateDDs) {
                DDR.routines.push("reversify")
            }
            if (setup.fixTriangles) {
                DDR.routines.push("fixTriangles")
            }
            DDR.routines.push("writeFile")

            /* set defaults */
            DDR.map = {};
            DDR.memory = [];
            DDR.newNotes = [];

            this.runNext()
        },
        runNext : function() {
            var next = DDR.routines.shift()
            console.log('running routine: ' + next);
            eval("this."+next+"()")
        },
        loadFile : function() {
            var file= "../" + setup.difficulty + '.dat'
            jsonfile.readFile(file, function (err, obj) {
                DDR.map = obj;
                DDR.runNext();
            })
        },
        writeFile : function(cb) {

            jsonfile.writeFile(setup.difficulty + '.dat', DDR.map, {spaces: 4}, function (err) {
                console.log("New file created.")
            });
        },
        reversify : function() {

            /* set default states into memory */
            DDR.memory.redState = -1;
            DDR.memory.blueState = -1;

            DDR.map._notes.forEach(function(note ,index) {

                var parsedTime = note._time.toString().split('.');
                var time = parseInt(parsedTime[0]);

                /* if the cut direction is a dot then record in memory and skip */
                if (note._cutDirection === 8) {
                    DDR.newNotes.push(note);
                    DDR.memory.redState = (note._type) ? note : DDR.memory.redState;
                    DDR.memory.blueState = (!note._type) ? note : DDR.memory.blueState;
                    return;
                }

                /* if the note is on the ignore timeline the record in memory and skip */
                if (setup.ignoreTimes.includes(time)) {
                    DDR.newNotes.push(note);
                    DDR.memory.redState = (note._type) ? note : DDR.memory.redState;
                    DDR.memory.blueState = (!note._type) ? note : DDR.memory.blueState;
                    console.log("ignoring note as it is on an ignored time marker");
                    return;
                }

                /* if note is red check for DD */
                if (note._type === 0) {

                    /* check if last note is within the acceptable max distance */
                    if ((note._time - DDR.memory.redState._time) < setup.minDistance) {
                        DDR.newNotes.push(note);
                        console.log("Note skipped because time delta is too small");
                        DDR.memory.redState = note;
                        return;
                    }

                    /* check to make sure next note is also not within minimal acceptable distance */
                    var nextNote = DDR.map._notes[index+1];
                    if (nextNote._type==note._type) {
                        if ((nextNote._time - note._time) < setup.minDistance) {
                            DDR.newNotes.push(note);
                            console.log("Note skipped because next note is same color, and is too close");
                            DDR.memory.redState = note;
                            return;
                        }
                    }

                    /* check if last note is within the acceptable max distance */
                    if ((note._time - DDR.memory.redState._time) > setup.maxDistance) {
                        DDR.newNotes.push(note);
                        console.log("Note skipped because time delta is too great");
                        DDR.memory.redState = note;
                        return;
                    }

                    /* check if this red block is the same as the last red block and switch it if it is */
                    if ( note._cutDirection == DDR.memory.redState._cutDirection ) {
                        note._cutDirection = DDR.getOpposite(note._cutDirection)
                    }

                    /* update memory */
                    DDR.memory.redState = note
                }

                /* if note is blue check for DD */
                if (note._type === 1) {

                    /* check if last note is within the acceptable min distance */
                    if ((note._time - DDR.memory.blueState._time) < setup.minDistance) {
                        DDR.newNotes.push(note);
                        console.log("Note skipped because time delta is too small");
                        DDR.memory.blueState = note;
                        return;
                    }

                    /* check to make sure next note is also not within minimal acceptable distance */
                    var nextNote = DDR.map._notes[index+1];
                    if (nextNote._type==note._type) {
                        if ((nextNote._time - note._time) < setup.minDistance) {
                            DDR.newNotes.push(note);
                            console.log("Note skipped because next note is same color, and is too close");
                            DDR.memory.blueState = note;
                            return;
                        }
                    }

                    /* check if last note is within acceptable an max distance */
                    if ((note._time - DDR.memory.blueState._time) > setup.maxDistance) {
                        DDR.newNotes.push(note);
                        console.log("Note skipped because time delta is too great");
                        DDR.memory.blueState = note;
                        return;
                    }

                    /* check if this red block is the same as the last red block and switch it if it is */
                    if ( note._cutDirection == DDR.memory.blueState._cutDirection ) {
                        note._cutDirection = DDR.getOpposite(note._cutDirection)
                    }

                    /* update memory */
                    DDR.memory.blueState = note
                }

                /* add modified note to notes replacement object */
                DDR.newNotes.push(note);

            });

            console.log("processing complete");

            /* set newNotes into map */
            DDR.map._notes = DDR.newNotes;

            DDR.runNext();
        },
        /**
         * return oppisite direction
         * @param input
         * @returns {number}
         */
        getOpposite : function(input) {
            console.log("corrected DD");
            switch(input) {
                case 0:
                    return 1;
                    break;
                case 1:
                    return 0;
                    break;
                case 5:
                    return 6;
                    break;
                case 6:
                    return 5;
                    break;
                case 3:
                    return 2;
                    break;
                case 2:
                    return 3;
                    break;
                case 7:
                    return 4;
                    break;
                case 4:
                    return 7;
                    break;
                case 8:
                    return 8;
                    break;
            }
        },
        fixTriangles : function() {

            console.log("Running fixTriangles");

            /* set default states into memory */
            DDR.memory.redState = [];
            DDR.memory.blueState = [];

            DDR.map._notes.forEach(function(note) {

                /* if red */
                if (note._type === 0) {
                    DDR.memory.redState.push(note._cutDirection)

                    /* check if this note qualifies as triangle */
                }

                /* remove first item - we only want to keep last 3 in there */
                if (DDR.memory.redState.length>3) {
                    DDR.memory.redState.shift()
                }

                /* remove first item - we only want to keep last 3 in there */
                if (DDR.memory.blueState.length>3) {
                    DDR.memory.blueState.shift()
                }
            })


            DDR.runNext();
        }
    }
})();

DDR.init();

