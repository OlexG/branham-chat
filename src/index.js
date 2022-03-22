import * as dotenv from "dotenv";
import DBManager from "./db.js";
import { OAuth2Client } from "google-auth-library";
import enable_ws from "express-ws";
import express from "express";
import verify_google_token from "./verification/verify_google_token.js";
import verify_session_token from "./verification/verify_session_token.js";

const client = new OAuth2Client(
	process.env.CLIENT_ID,
	process.env.CLIENT_SECRET
);

dotenv.config();

const app = express();
enable_ws(app);
const db_manager = new DBManager();

app.use(express.json());

// key = room name
// value = array of websocket clients
const room_listeners = new Map(
	db_manager.get_rooms().map(({ name }) => [name, []])
);

app.use(express.static("client/build"));

app.get("/rooms/:room/messages", verify_session_token, (req, res) => {
	let messages = db_manager.get_messages(req.params.room);
	messages = messages.map((message) => {
		const user = db_manager.get_user(message.email);
		const obj = {
			...message,
			user_name: user.name,
			user_picture: user.picture,
		};
		// remove email
		delete obj.email;
		return obj;
	});
	res.json(messages);
});

function send_message(room, content, user) {
	const timestamp = new Date().valueOf();
	const message_data = {
		type: "new_message",
		user_name: user.name,
		user_picture: user.picture,
		...db_manager.push_message(room, content, timestamp, user.id),
	};
	const stringified = JSON.stringify(message_data);
	for (const listener of room_listeners.get(room)) {
		listener.send(stringified);
	}
	return message_data;
}

app.post("/rooms/:room/messages", verify_session_token, (req, res) => {
	const content = req.body.content;
	if (!content) {
		res.status(400).end("message content missing or empty");
	}
	const user = db_manager.get_user(req.headers.email);
	res.json(send_message(req.params.room, content, user));
});

app.post("/login", async (req, res) => {
	const { token } = req.body;
	if (!token) {
		res.status(400).end("Missing required fields");
		return;
	}
	if (!verify_google_token(token)) {
		res.status(401).end("Invalid token");
		return;
	}

	const ticket = await client.verifyIdToken({
		audience: process.env.CLIENT_ID,
		idToken: token,
	});
	const { email, name, picture } = ticket.getPayload();

	if (!email.endsWith("@my.cuhsd.org")) {
		res.status(401).end("You are not from Branham High School");
		return;
	}
	const uuid = db_manager.add_user(email, name, picture);

	res.set("X-User-Token", uuid);
	res.sendStatus(204);
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
	process.stderr.write(`Listening on port ${port}\n`);
});
