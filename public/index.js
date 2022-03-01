const socket = io();

const send_form = document.getElementById('send-message');
const send_input = document.getElementById('message-content');
const switch_form = document.getElementById('choose-room');
const switch_input = document.getElementById('room-choice');
const messages = document.getElementById('messages');

let room = "default";

send_form.onsubmit = (e) => {
	e.preventDefault();
	if (send_input.value) {
		socket.emit('chat message', { msg: send_input.value, room });
		send_input.value = "";
	}
};

switch_form.onsubmit = (e) => {
	e.preventDefault();
	while (messages.childElementCount > 0) {
		messages.removeChild(messages.children[0]);
	}
	if (switch_input.value) {
		room = switch_input.value;
	}
}

socket.on('chat message', (msg) => {
	if (msg.room != room) {
		return;
	}

	const elem = document.createElement('li');
	elem.textContent = msg.msg;
	messages.appendChild(elem);
	window.scrollTo(0, document.body.scrollHeight);
})
