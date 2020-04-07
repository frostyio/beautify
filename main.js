/*

a probably bad lua beautifier
npm install luaparse

*/



const fs = require("fs");
const luaparse = require("luaparse");
const parsing = require("./parsing");

function beautify(src){
	console.log("beautifying...");
	const parsed = luaparse.parse(src);
	fs.writeFile("output.lua", parsing(parsed.body), (err) => {
		if (err) throw err;
		console.log("saved to output.lua");
	})
}

fs.readFile("./input.lua", "utf8", (err, src) => {
	if (err) throw err;
	beautify(src);
})