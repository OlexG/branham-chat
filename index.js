const socketio = require('socket.io');
const express = require('express');
const http = require('http');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new socketio.Server(server);

io.on('connection', (socket) => {
	socket.on('chat message', ({ msg, metadata }) => {
		const date_now = new Date();
		const new_metadata = {
			timestamp: date_now,
			room: metadata.room
		}
		let package = { msg, metadata: new_metadata };
		io.emit('chat message', package);
	});
});
app.use(express.static("public"));

server.listen(process.env.PORT ?? 3000, () => {
	console.log(`Listening on port ${process.env.PORT}`);
});
