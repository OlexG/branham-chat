const socketio = require('socket.io');
const express = require('express');
const http = require('http');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new socketio.Server(server);

io.on('connection', (socket) => {
	socket.on('chat message', ({ msg, room }) => {
		io.emit('chat message', { msg, room });
	});
});
app.use(express.static("public"));

server.listen(process.env.PORT ?? 3000);
