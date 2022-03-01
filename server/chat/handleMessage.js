function handleMessage(io, msg, room) {
	io.emit('chat message', { msg, room });
}

module.exports = handleMessage;
