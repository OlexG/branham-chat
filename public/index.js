const socket = io();

const send_form = document.getElementById('send-message');
const send_input = document.getElementById('message-content');
const messages = document.getElementById('messages');

let room = "default";

send_form.onsubmit = (e) => {
	e.preventDefault();
	if (send_input.value) {
		const metadata = {
			room: room
		}

		const package = {
			msg: send_input.value,
			metadata
		}
		socket.emit('chat message', package);
		send_input.value = "";
	}
};

socket.on('chat message', ({ msg, metadata }) => {
	if (metadata.room != room) {
		return;
	}

	// <li><span class="msg-time">{metadata.timestamp}</span><span class="msg-msg">{msg}</span></li>

	const elem = document.createElement('li');
	const spanTime = document.createElement('span');
	const spanMsg = document.createElement('span');

	spanTime.innerText = new Date(metadata.timestamp).toLocaleTimeString();
	spanTime.classList.add("msg-time");
	elem.appendChild(spanTime);

	spanMsg.innerText = msg;
	spanMsg.classList.add("msg-msg")
	elem.appendChild(spanMsg);

	elem.classList.add('chat-message');
	messages.appendChild(elem);

	messages.scrollTop = messages.scrollHeight - messages.clientHeight;
})
