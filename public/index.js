const socket = io();

const send_form = document.getElementById('send-message');
const send_input = document.getElementById('message-content');
const messages = document.getElementById('messages');

let room = "default";

send_form.onsubmit = (e) => {
	e.preventDefault();
	if (send_input.value) {
		socket.emit('chat message', { msg: send_input.value, room });
		send_input.value = "";
	}
};

socket.on('chat message', (msg) => {
	if (msg.room != room) {
		return;
	}

	const elem = document.createElement('li');
	elem.classList.add('chat-message');
	elem.textContent = msg.msg;
	messages.appendChild(elem);
	window.scrollTo(0, document.body.scrollHeight);
})
