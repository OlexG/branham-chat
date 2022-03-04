const socket = io();
socket.emit('get chat messages');

const send_form = document.getElementById('send-message');
const send_input = document.getElementById('message-content');
const messages = document.getElementById('messages');

let room = "default";

function add_message(msg, metadata) {
  console.log(msg, metadata);
  if (metadata.room != room) {
		return;
	}

	// <li><span class="msg-time">{metadata.timestamp}</span><span class="msg-msg">{msg}</span></li>

	const elem = document.createElement('li');
	const span_time = document.createElement('span');
	const span_msg = document.createElement('span');

	span_time.innerText = new Date(metadata.timestamp).toLocaleTimeString();
	span_time.classList.add("msg-time");
	elem.appendChild(span_time);

	span_msg.innerText = msg;
	span_msg.classList.add("msg-msg")
	elem.appendChild(span_msg);

	elem.classList.add('chat-message');
	messages.appendChild(elem);

	messages.scrollTop = messages.scrollHeight - messages.clientHeight;
}

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
  add_message(msg, metadata);
})

socket.on('initial chat messages', messages => {
  messages.forEach(({ msg, timestamp, room }) => {
    add_message(msg, {
      timestamp,
      room
    });
  });
});
