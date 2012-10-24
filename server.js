var connect = require("connect");

connect(
	connect.static(require("path").join(__dirname))
).listen(3000);

console.log("Running on http://localhost:3000/");