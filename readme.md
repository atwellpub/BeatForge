## Setup and Use

Extract/pull this repo into a custom BeatSaber song's folder (under a subdirectory named BeatForge) and run the following from a command line inside the same sub folder:

`npm install`

Then edit ddr.js and set the difficulty of the .dat file it should read from.

Then, in the same command line interface, type the following:

`node ddr.js`

And if all is well, all double directionals will automatically be replaced until none exist.

## Disclaimer

This script will eliminate all double directionals by switching the direction of cuts until no double directionals exist. This could harm your intended map structure. It could improve it. Be sure to backup your original difficulty.dat file before running this script.