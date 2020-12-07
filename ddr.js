/**
 *  Setup
 */
const setup = {
    "difficulty" : "hard",
    "mode" : "rewrite",
    "backup" : true, /* not implemented */
    "eliminateDDs" : true,
    "fixTriangles" : true,
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
            DDR.routines = [
                "loadFile",
                "reversify",
                "fixTriangles",
                "writeFile"
            ]

            /* unset disabled */
            if (!setup.eliminateDDs) {
                delete DDR.routines['reversify']
            }

            if (!setup.fixTriangles) {
                delete DDR.routines['fixTriangles']
            }

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

            DDR.map._notes.forEach(function(note) {

                /* if the cut direction is a dot then record in memory and skip */
                if (note._cutDirection === 8) {
                    DDR.newNotes.push(note);
                    DDR.memory.redState = (note._type) ? 8 : DDR.memory.redState;
                    DDR.memory.blueState = (!note._type) ? 8 : DDR.memory.blueState;
                    return;
                }

                /* if note is red check for DD */
                if (note._type === 0) {

                    /* check if this red block is the same as the last red block and switch it if it is */
                    if ( note._cutDirection == DDR.memory.redState ) {
                        note._cutDirection = DDR.getOpposite(note._cutDirection)
                    }

                    /* update memory */
                    DDR.memory.redState = note._cutDirection
                }

                /* if note is blue check for DD */
                if (note._type === 0) {

                    /* check if this red block is the same as the last red block and switch it if it is */
                    if ( note._cutDirection == DDR.memory.blueState ) {
                        note._cutDirection = DDR.getOpposite(note._cutDirection)
                    }

                    /* update memory */
                    DDR.memory.blueState = note._cutDirection
                }

                /* add modified note to notes replacement object */
                DDR.newNotes.push(note);

            });

            console.log("processing complete");

            /* set newNotes into map */
            DDR.map._notes = DDR.newNotes;

            console.log(DDR.map._notes);

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
                case 2:
                    return 3;
                    break;
                case 3:
                    return 2;
                    break;
                case 4:
                    return 7;
                    break;
                case 5:
                    return 6;
                    break;
                case 6:
                    return 5;
                    break;
                case 7:
                    return 4;
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
                    DDR.memory.redState.add(note._cutDirection)

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

