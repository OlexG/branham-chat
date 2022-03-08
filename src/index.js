const socketio = require("socket.io");
const express = require("express");
const http = require("http");
const DBManager = require("./db");

/* Markdown + emoji support */
const marked = require("marked");
const createSanitizer = require("dompurify");
const { JSDOM } = require("jsdom");
const window = new JSDOM('').window;
const sanitizer = createSanitizer(window);
const emoji = require("node-emoji");


// This prototype removes the wrapping of the <p> tag in sanitization
// This allows for the message to be put on the same line as the timestamp
marked.Renderer.prototype.paragraph = function(text) {
	return text + '\n';
};
  

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new socketio.Server(server);
const db_manager = new DBManager();

io.on("connection", (socket) => {
	socket.on("chat message", ({ msg, metadata }) => {

		const raw = emoji.emojify(msg, (name) => { return name; })
		const rawParsed = marked.parse(raw);
		let newMsg = sanitizer.sanitize(rawParsed);
		if(!newMsg) {
			io.emit("bad message", msg);
			return; 
		}

		const date_now = new Date();
		const new_metadata = {
			timestamp: date_now,
			room: metadata.room
		};
		let package = { msg: newMsg, metadata: new_metadata };
		io.emit("chat message", package);
		db_manager.push(newMsg, date_now, metadata.room);
	});

	socket.on("get chat messages", () => {
		socket.emit("initial chat messages", db_manager.get());
	});
});
app.use(express.static("public"));

server.listen(process.env.PORT ?? 3000, () => {
	console.log(`Listening on port ${process.env.PORT ?? 3000}`);
});
