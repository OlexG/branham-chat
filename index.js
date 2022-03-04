const socketio = require('socket.io');
const express = require('express');
const http = require('http');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new socketio.Server(server);

io.on('connection', (socket) => {
	socket.on('chat message', ({ msg, md }) => {
		console.log('here')

		const dateNow = new Date();
		let metadata = {
			timestamp: dateNow,
			room: md.room
		}
		let package = { msg: msg, metadata: metadata };
		console.log(package)
		io.emit('chat message', package);
	});
});
app.use(express.static("public"));

server.listen(process.env.PORT ?? 3000);
