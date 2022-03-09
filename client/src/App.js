import "./App.css";
import { useState, useEffect } from "react";
import api from "./api/requests";

console.log(window.location)
function App() {
	const [messages, setMessages] = useState([]);
	const [formValue, setFormValue] = useState("");
	useEffect(() => {
		function addMessage(message) {
			setMessages((messages) => [...messages, message]);
		}
		async function fetchMessages() {
			const { data } = await api.sendGetMessagesRequest("general");
			setMessages(data);
		}
		// listen for chat messages using websockets
		const ws = new WebSocket(`ws://${window.location.host}/rooms/general/messages.ws`);
		ws.onmessage = (event) => {
			const message = JSON.parse(event.data);
			if (message.type === "new_message") {
				addMessage(message);
			}
		};
		fetchMessages();
	}, []);

	function sendMessage(e) {
		e.preventDefault();
		if (formValue) {
			api.sendPostMessageRequest("general", formValue);
			setFormValue("");
		}
	}

	function handleFormValueChange(e) {
		setFormValue(e.target.value);
	}
	return (
		<>
			<header>
				<select id="room-choice"></select>
				<h1 id="title">Branham Chat</h1>
			</header>
			<ul id="messages" className="messages-box">
				{messages.map(({ msg, timestamp }) => (
					<li key={msg + timestamp}>
						<span className="msg-time">{new Date(parseInt(timestamp)).toISOString()}</span>
						<span className="msg-msg">{msg}</span>
					</li>
				))}
			</ul>
			<footer>
				<form method="dialog" id="send-message" onSubmit={sendMessage}>
					<input type="text" id="message-content" name="Message" className="enter-field" required value={formValue} onChange={handleFormValueChange} />
					<input className="submit-button" type="submit" value="Send" id="message-send-button" />
				</form>
			</footer>
		</>
	);
}

export default App;
