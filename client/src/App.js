import "./App.css";
import * as api from "./api/requests";
import { useEffect, useState } from "react";
import Login from "./Login";

function App() {
	const [messages, setMessages] = useState([]);
	const [formValue, setFormValue] = useState("");
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		if (!isLoggedIn) {
			return;
		}
		function addMessage(message) {
			setMessages((old_messages) => [...old_messages, message]);
		}
		async function fetchMessages() {
			const { data } = await api.sendGetMessagesRequest("general");
			setMessages(data);
		}
		// listen for chat messages using websockets
		const ws = new WebSocket(
			`${window.location.protocol.replace("http", "ws")}//${
				window.location.host
			}/rooms/general/messages.ws`
		);
		ws.onmessage = (event) => {
			const message = JSON.parse(event.data);
			if (message.type === "new_message") {
				addMessage(message);
			}
		};
		fetchMessages();
	}, [isLoggedIn]);

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
	if (!isLoggedIn) {
		return <Login setIsLoggedIn={setIsLoggedIn} />;
	}
	return (
		<>
			<header>
				<select id="room-choice"></select>
				<h1 id="title">Branham Chat</h1>
			</header>
			<ul id="messages" className="messages-box">
				{messages &&
					messages.map(({ msg, timestamp, user_picture, user_name }) => (
						<li key={msg + timestamp}>
							<span className="msg-time">
								{new Date(parseInt(timestamp, 10)).toISOString()}
							</span>
							<img className="user-icon" src={user_picture} />
							<span className="user-name">{user_name}</span>
							<span className="msg-msg">{msg}</span>
						</li>
					))}
			</ul>
			<footer>
				<form method="dialog" id="send-message" onSubmit={sendMessage}>
					<input
						type="text"
						id="message-content"
						name="Message"
						className="enter-field"
						required
						value={formValue}
						onChange={handleFormValueChange}
					/>
					<input
						className="submit-button"
						type="submit"
						value="Send"
						id="message-send-button"
					/>
				</form>
			</footer>
		</>
	);
}

export default App;
