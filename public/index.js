const socket = io();

const send_form = document.getElementById('send-message');
const send_input = document.getElementById('message-content');
const messages = document.getElementById('messages');

let room = "default";

send_form.onsubmit = (e) => {
	e.preventDefault();
	if (send_input.value) {
		let metadata = {
			timestamp: new Date(),
			room: room
		}

		let package = { 
			msg: send_input.value, 
			metadata: metadata 
		}
		socket.emit('chat message', package);
		send_input.value = "";
	}
};

socket.on('chat message', (package) => {
	console.log(package)
	let msg = package.msg;
	let metadata = package.metadata;
	if (metadata.room != room) {
		return;
	}

	const elem = document.createElement('li');
	const spanTime = document.createElement('span');
	const spanMsg = document.createElement('span');

	elem.appendChild(spanTime);
	elem.textContent += metadata.time;

	elem.appendChild(spanMsg);
	elem.textContent += msg;

	elem.classList.add('chat-message');
	// <span class="msg-time">formatTime()</span><span class="msg-msg">{msg}</span>
	messages.appendChild(elem);
	window.scrollTo(0, document.body.scrollHeight);
})
