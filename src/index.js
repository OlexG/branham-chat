import express from "express";
import enable_ws from "express-ws";
import * as http from "http";
import DBManager from "./db.js";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
enable_ws(app);
const db_manager = new DBManager();

app.use(express.json());

// key = room name
// value = array of websocket clients
const room_listeners = new Map(db_manager.get_rooms().map(({ name }) => [name, []]));

app.get("/", (_req, res) => {
	res.redirect(301, "/app");
});

console.log(import.meta.url)

app.get("/app", (_req, res) => {
	res.sendFile(path.resolve("client/build/index.html"));
});

app.use("/static", express.static("client/build/static"));

app.get("/rooms/:room/messages", (req, res) => {
	const messages = db_manager.get_messages(req.params.room);
	res.json(messages);
});

function send_message(room, content) {
	const timestamp = new Date().valueOf();
	const message_data = {
		type: "new_message",
		...db_manager.push_message(room, content, timestamp),
	};
	const stringified = JSON.stringify(message_data);
	for (const listener of room_listeners.get(room)) {
		listener.send(stringified);
	}
	return message_data;
}

app.post("/rooms/:room/messages", (req, res) => {
	const content = req.body.content;
	if (!content) {
		res.status(400).end("message content missing or empty");
	}
	res.json(send_message(req.params.room, content));
});

app.ws("/rooms/:room/messages.ws", (ws, req) => {
	const room_name = req.params.room;
	// insert the listener into the listeners map
	{
		const listeners = room_listeners.get(room_name);
		if (!Array.isArray(listeners)) {
			req.status(404).end("room does not exist");
			return;
		} else {
			listeners.push(ws);
		}
	}
	// remove the client from the listeners map entry for the room when the connection is closed
	ws.on("close", () => {
		const listeners = room_listeners.get(room_name);
		listeners.splice(listeners.indexOf(ws), 1);
	});
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
	console.info(`Listening on port ${port}`);
});
