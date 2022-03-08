import "./App.css";
import io from "socket.io-client";
import { useState, useEffect } from "react";
const socket = io("http://localhost:3000");
socket.emit("get chat messages");

function App() {
	const [messages, setMessages] = useState([]);
  const [formValue, setFormValue] = useState("");
	useEffect(() => {
		function addMessage(message) {
			setMessages((messages) => [...messages, message]);
		}
		socket.on("chat message", (msgObj) => {
			addMessage(msgObj);
		});

		socket.on("initial chat messages", (messages) => {
			messages.forEach(({ msg, timestamp, room }) => {
				addMessage({ msg, metadata: { timestamp, room } });
			});
		});
	}, []);

  function sendMessage(e){
    console.log(e);
    e.preventDefault();
    if (formValue) {
      console.log(formValue);
      socket.emit("chat message", formValue, 'general');
    }
  }

  function handleFormValueChange(e){
    setFormValue(e.target.value);
  }
	return (
		<>
			<header>
				<select id="room-choice"></select>
				<h1 id="title">Branham Chat</h1>
			</header>
			<ul id="messages" className="messages-box">
				{messages.map(({ msg, metadata }) => (
					<li>
						<span className="msg-time">{metadata.timestamp}</span>
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
