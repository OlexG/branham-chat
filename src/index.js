import * as socketio from "socket.io";
import express from "express";
import * as http from "http";
import DBManager from "./db.js";

import * as dotenv from "dotenv";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new socketio.Server(server);
const db_manager = new DBManager();

io.on("connection", (socket) => {
	socket.on("chat message", ({ msg, metadata }) => {
		const date_now = new Date();
		const new_metadata = {
			timestamp: date_now,
			room: metadata.room,
		};
		let data = { msg, metadata: new_metadata };
		io.emit("chat message", data);
		db_manager.push(msg, date_now, metadata.room);
	});

	socket.on("get chat messages", () => {
		socket.emit("initial chat messages", db_manager.get());
	});
});
app.use(express.static("public"));

server.listen(process.env.PORT ?? 3000, () => {
	console.log(`Listening on port ${process.env.PORT}`);
});
