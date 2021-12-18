#!/usr/bin/env node

//For every simulation, this script gets the needed javascript (compiled typescript) files and
//merges them while respecting a specified order. This is run after a successful tsc compilation.

const fs = require("fs");
const { join, sep } = require("path");
const { exit } = require("process");

//Gets an ordered javascript file list from a text file file (splits it by lines). callback is
//called with the first argument being the list of files.
function getScriptsList(filePath, callback) {
	fs.readFile(filePath, {encoding: "utf-8"} , function(err, f) {
		if (err) {
			console.error("fs.readFile error in \"" + filePath + "\": " + err);
			exit(1);
		} else {
			callback(f.split("\n"));
		}	
	});
}

//Gets a lists of files (one for every HTML page) that lists the scripts every page needs.
//callback is called for every file list with the file path as the first argument.
function getSimulationList(callback) {
	fs.readdir("pages", (err, files) => { //Get all files and directories
		if (err) {
			console.error("fs.readdir error in \"" + pages + "\": " + err);
			exit(1);
		} else {
			for (let i = 0; i < files.length; ++i) {
				let pathFromPwd = join("pages", files[i]);

				fs.stat(pathFromPwd, (err, stats) => { //Filter the directories (those are pages)
					if (err) {
						console.error("fs.stat error in \"" + pathFromPwd + "\": " + err);
						exit(1);
					} else {
						if (stats.isDirectory()) {
							//The path of the file listing the scripts.
							callback(join(pathFromPwd, "scripts.txt"));
						}
					}
				});
			}
		}
	});
}

//Reads all files in the list and merges their contents into a string.
function mergeScripts(list) {
	let ret = ""; //Value to be returned

	for (let i = 0; i < list.length; ++i) {
		try {
			ret += fs.readFileSync(list[i], {encoding: "utf-8"});
		} catch (err) {
			console.error("fs.readFileSync error in \"" + list[i] + "\": " + err);
			exit(1);
		}
	}

	return ret;
}

console.log("\n"); //Formatting
getSimulationList((file) => {
	getScriptsList(file, (scripts) => {
		let script = mergeScripts(scripts);
		let outPath = join(file.substring(0, file.lastIndexOf(sep)), "compiledJS.js");

		fs.writeFile(outPath, script, { encoding: "utf-8" }, (err) => {
			if (err) {
				console.error("fs.writeFile error in \"" + outPath + "\": " + err);
				exit(1);
			}
		});
	});
});