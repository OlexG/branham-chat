import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";

const socket = io();

function empty_element(elem) {
	while (elem.lastChild) {
		elem.removeChild(elem.lastChild);
	}
}

const send_form = document.getElementById("send-message");
const send_input = document.getElementById("message-content");
const messages = document.getElementById("messages");

class App {
	/**
	 * @type {?number}
	 */
	#room = null;

	constructor(starting) {
		this.change_room(starting);
	}

	get #message_event_name() {
		return `new message ${this.#room}`;
	}

	#leave_room() {
		empty_element(messages);
		socket.off(this.#message_event_name);
	}

	#add_message(msg, timestamp) {
		// <li><span class="msg-time">{metadata.timestamp}</span><span class="msg-msg">{msg}</span></li>
		const elem = document.createElement("li");
		const span_time = document.createElement("span");
		const span_msg = document.createElement("span");

		span_time.innerText = new Date(timestamp).toLocaleTimeString();
		span_time.classList.add("msg-time");
		elem.appendChild(span_time);

		span_msg.innerText = msg;
		span_msg.classList.add("msg-msg");
		elem.appendChild(span_msg);

		elem.classList.add("chat-message");
		messages.appendChild(elem);

		messages.scrollTop = messages.scrollHeight - messages.clientHeight;
	}

	#fetch_initial_messages() {
		socket.emit("get messages", this.#room, (messages) => {
			for (const { msg, timestamp } of messages) {
				this.#add_message(msg, timestamp);
			}
		});
	}

	change_room(new_room) {
		if (!new_room) {
			return false;
		}
		if (this.#room) {
			this.#leave_room();
		}
		this.#room = new_room;
		this.#fetch_initial_messages();
		socket.on(this.#message_event_name, (msg, timestamp) => {
			this.#add_message(msg, timestamp);
		});
	}

	send_message(content) {
		socket.emit("send message", this.#room, content);
	}
}

const app = new App("default");

send_form.onsubmit = (e) => {
	e.preventDefault();
	if (send_input.value) {
		app.send_message(send_input.value);
		send_input.value = "";
	}
};
