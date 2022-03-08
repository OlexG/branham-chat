import "./App.css";
import { useState, useEffect } from "react";
import { SOCKET_URL } from "./constants";
import api from "./api";

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
    const ws = new WebSocket(`${SOCKET_URL}/rooms/test/messages.ws`);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "new_message") {
        addMessage(message);
      }
    }
    fetchMessages();
	}, []);

  function sendMessage(e){
    console.log(e);
    e.preventDefault();
    if (formValue) {
      console.log(formValue);
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
