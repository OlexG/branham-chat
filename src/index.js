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
	socket.on("rooms", (callback) => {
		callback(db_manager.get_rooms());
	});

	socket.on("send message", (room_id, msg) => {
		const date_now = new Date();
		io.emit(`new message ${room_id}`, msg, date_now);
		db_manager.push_message(room_id, msg, date_now);
	});

	socket.on("get messages", (room_id, callback) => {
		callback(db_manager.get_messages(room_id));
	});
});

app.use(express.static("client/build"));

server.listen(process.env.PORT ?? 3000, () => {
	console.log(`Listening on port ${process.env.PORT}`);
});
